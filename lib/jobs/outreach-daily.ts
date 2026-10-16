import "server-only";

import {
  ensureOutboundThread,
  getInboundDomain,
  makeMessageId,
  touchThread,
} from "@/lib/email/threads";
import { publicSiteUrl, runGenerateLeadSite } from "@/lib/jobs/generate-site";
import { sendEmail } from "@/lib/email/provider";
import { loadCampaignConfig } from "@/lib/outreach/campaign";
import { fylkeFromKommuneNr } from "@/lib/regions";
import {
  applyPlaceholders,
  getOutreachFromAddress,
  getOutreachReplyTo,
  isSuppressed,
} from "@/lib/resend";
import { d1, getDb } from "@/lib/db";
import type { Company } from "@/lib/db/types";
import { formatCompanyName } from "@/lib/utils";

export interface DailyOutreachResult {
  enabled: boolean;
  candidates: number;
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: Array<{ org_nr: string; error: string }>;
}

/** Rows a crashed run left in 'queued' are failed after this long, never re-sent blind. */
const STALE_QUEUED_MS = 60 * 60 * 1000;
/** A run that holds the lock longer than this is assumed dead. */
const LOCK_TTL_MS = 15 * 60 * 1000;
const LOCK_KEY = "lock:daily_outreach";

/** Start of today in Europe/Oslo, as an ISO UTC timestamp. */
export function osloMidnightIso(now = new Date()): string {
  const day = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Oslo" }); // yyyy-MM-dd
  // Oslo is UTC+1 or UTC+2; pick the offset that lands on local midnight.
  for (const offset of [1, 2]) {
    const candidate = new Date(`${day}T00:00:00Z`);
    candidate.setUTCHours(candidate.getUTCHours() - offset);
    if (candidate.toLocaleTimeString("sv-SE", { timeZone: "Europe/Oslo" }) === "00:00:00") {
      return candidate.toISOString();
    }
  }
  return new Date(`${day}T00:00:00Z`).toISOString();
}

/** Outbound emails sent (or in flight) since Oslo midnight. Manual sends count too. */
async function sentToday(): Promise<number> {
  const { count } = await getDb()
    .from("outreach_emails")
    .select("id", { count: "exact", head: true })
    .eq("direction", "out")
    .neq("status", "failed")
    .gte("created_at", osloMidnightIso());
  return count ?? 0;
}

/**
 * Eligible leads for outreach, highest score first.
 *
 *   - status 'new' or 'qualified' (rejected / reviewed leads are skipped)
 *   - has an email, not on the suppression list (case-insensitive)
 *   - score >= minScore, org_form in allowedOrgForms, NACE not excluded
 *   - never emailed before (any outbound row, queued/failed included) —
 *     checked in SQL, so it holds however many emails have gone out
 */
export async function selectCandidates(
  config: Awaited<ReturnType<typeof loadCampaignConfig>>,
  limit: number
): Promise<Company[]> {
  if (limit <= 0) return [];
  const where: string[] = [
    "c.status in ('new', 'qualified')",
    "c.email is not null and trim(c.email) <> ''",
    "c.score >= ?",
    "not exists (select 1 from outreach_emails o where o.org_nr = c.org_nr and o.direction = 'out')",
    "not exists (select 1 from outreach_suppressions s where lower(s.email) = lower(trim(c.email)))",
  ];
  const params: unknown[] = [config.minScore];
  if (config.allowedOrgForms.length > 0) {
    where.push("c.org_form in (select value from json_each(?))");
    params.push(JSON.stringify(config.allowedOrgForms));
  }
  for (const prefix of config.excludedNacePrefixes.map((p) => p.trim()).filter(Boolean)) {
    where.push("(c.nace_code is null or c.nace_code not like ?)");
    params.push(`${prefix}%`);
  }
  const { results } = await d1()
    .prepare(
      `select c.* from companies c where ${where.join(" and ")}
       order by c.score desc, c.registered_at desc nulls last limit ?`
    )
    .bind(...params, limit)
    .all<Record<string, unknown>>();
  return (results ?? []).map(
    (r) =>
      ({
        ...r,
        vat_registered: Boolean(r.vat_registered),
        bankrupt: Boolean(r.bankrupt),
        under_dissolution: Boolean(r.under_dissolution),
        forced_dissolution: Boolean(r.forced_dissolution),
        score_breakdown: JSON.parse(String(r.score_breakdown ?? "{}")),
        raw_data: r.raw_data ? JSON.parse(String(r.raw_data)) : null,
      }) as Company
  );
}

/** Single-runner lock in the settings table, so a manual run and the cron can't double-send. */
async function acquireLock(): Promise<boolean> {
  const now = Date.now();
  const { data } = await getDb().from("settings").select("value").eq("key", LOCK_KEY).maybeSingle();
  const heldSince = typeof data?.value === "number" ? data.value : 0;
  if (heldSince && now - heldSince < LOCK_TTL_MS) return false;
  // Compare-and-set on the value we just read: only one concurrent caller wins.
  const res = await d1()
    .prepare(
      `insert into settings (key, value) values (?, ?)
       on conflict (key) do update set value = excluded.value where settings.value = ?`
    )
    .bind(LOCK_KEY, JSON.stringify(now), JSON.stringify(heldSince))
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

async function releaseLock(): Promise<void> {
  await getDb().from("settings").delete().eq("key", LOCK_KEY);
}

/** A row stuck in 'queued' means a run died between insert and send; we can't know if it went out. */
async function failStaleQueued(): Promise<void> {
  await getDb()
    .from("outreach_emails")
    .update({
      status: "failed",
      error_message: "Avbrutt før sending (kjøringen stoppet). Sjekk før du sender på nytt.",
    })
    .eq("status", "queued")
    .eq("direction", "out")
    .lt("created_at", new Date(Date.now() - STALE_QUEUED_MS).toISOString());
}

/**
 * Run the daily outreach campaign. Reads config, selects candidates,
 * makes sure each has a demo site (generates one if missing — no email
 * goes out without a working link), then sends through the same
 * thread-aware pipeline as the manual flow. Returns a summary the cron
 * route surfaces in its response (and the audit log).
 */
export async function runDailyOutreach(opts: {
  triggeredBy: "cron" | "manual";
  dryRun?: boolean;
}): Promise<DailyOutreachResult> {
  const config = await loadCampaignConfig();
  const db = getDb();

  const result: DailyOutreachResult = {
    enabled: config.enabled,
    candidates: 0,
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  if (!config.enabled && opts.triggeredBy === "cron") return result;

  // The cap counts everything sent today, so manual runs + cron never exceed maxPerDay.
  const remaining = Math.max(0, config.maxPerDay - (await sentToday()));
  const candidates = await selectCandidates(config, remaining);
  result.candidates = candidates.length;

  if (opts.dryRun || candidates.length === 0) return result;

  if (!(await acquireLock())) {
    result.errors.push({ org_nr: "-", error: "En annen utsendelse kjører allerede." });
    return result;
  }

  try {
    await failStaleQueued();
    await sendToCandidates(candidates, config, result);
  } finally {
    await releaseLock();
  }

  await db.from("audit_log").insert({
    actor: opts.triggeredBy === "cron" ? "cron" : "manual",
    action: "outreach.daily.run",
    entity_type: "campaign",
    entity_id: "daily",
    metadata: {
      candidates: result.candidates,
      attempted: result.attempted,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
      max_per_day: config.maxPerDay,
      min_score: config.minScore,
    },
  });

  return result;
}

async function sendToCandidates(
  candidates: Company[],
  config: Awaited<ReturnType<typeof loadCampaignConfig>>,
  result: DailyOutreachResult
): Promise<void> {
  const db = getDb();
  const [fromAddress, replyTo, inboundDomain] = await Promise.all([
    getOutreachFromAddress(),
    getOutreachReplyTo(),
    getInboundDomain(),
  ]);

  for (const lead of candidates) {
    if (!lead.email) {
      result.skipped++;
      continue;
    }

    result.attempted++;

    const sup = await isSuppressed(lead.email);
    if (sup.suppressed) {
      result.skipped++;
      continue;
    }

    // The email promises a demo site, so make sure one exists first.
    const { data: siteRow } = await db
      .from("generated_sites")
      .select("org_nr")
      .eq("org_nr", lead.org_nr)
      .maybeSingle();
    if (!siteRow) {
      const generated = await runGenerateLeadSite({ orgNr: lead.org_nr });
      if (!generated.ok) {
        result.skipped++;
        result.errors.push({
          org_nr: lead.org_nr,
          error: `Demoside kunne ikke lages, hoppet over: ${generated.error ?? "ukjent feil"}`,
        });
        continue;
      }
    }

    const firstName = lead.contact_name?.trim().split(/\s+/)[0] ?? null;
    const placeholders = {
      company_name: formatCompanyName(lead.name),
      kommune: lead.kommune,
      region: fylkeFromKommuneNr(lead.kommune_nr),
      org_nr: lead.org_nr,
      site_url: publicSiteUrl(lead.org_nr),
      contact_name: lead.contact_name,
      contact_first_name: firstName,
    };
    const subject = applyPlaceholders(config.subject, placeholders);
    const body = applyPlaceholders(config.body, placeholders);

    let thread;
    try {
      thread = await ensureOutboundThread({
        orgNr: lead.org_nr,
        subject,
      });
    } catch (err) {
      result.failed++;
      result.errors.push({
        org_nr: lead.org_nr,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    const messageId = makeMessageId(inboundDomain);

    const { data: row, error: insertError } = await db
      .from("outreach_emails")
      .insert({
        org_nr: lead.org_nr,
        to_email: lead.email,
        from_email: fromAddress,
        subject,
        body,
        status: "queued",
        direction: "out",
        thread_id: thread.id,
        message_id: messageId,
      })
      .select()
      .single();

    if (insertError || !row) {
      result.failed++;
      result.errors.push({
        org_nr: lead.org_nr,
        error: insertError?.message ?? "insert failed",
      });
      continue;
    }

    const sendResult = await sendEmail({
      to: lead.email,
      from: fromAddress,
      subject,
      body,
      replyTo,
      messageId,
    });

    if (sendResult.ok) {
      result.sent++;
      await db
        .from("outreach_emails")
        .update({
          status: "sent",
          resend_id: sendResult.resendId ?? null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      await touchThread({ threadId: thread.id });
    } else {
      result.failed++;
      result.errors.push({
        org_nr: lead.org_nr,
        error: sendResult.error ?? "send failed",
      });
      await db
        .from("outreach_emails")
        .update({
          status: "failed",
          error_message: sendResult.error ?? null,
        })
        .eq("id", row.id);
    }
  }
}
