import "server-only";

import {
  buildThreadReplyTo,
  ensureOutboundThread,
  getInboundDomain,
  makeMessageId,
  touchThread,
} from "@/lib/email/threads";
import { publicSiteUrl } from "@/lib/jobs/generate-site";
import { loadCampaignConfig } from "@/lib/outreach/campaign";
import {
  applyPlaceholders,
  getOutreachFromAddress,
  getOutreachReplyTo,
  isSuppressed,
  sendOutreachEmail,
} from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Company } from "@/lib/supabase/types";

export interface DailyOutreachResult {
  enabled: boolean;
  candidates: number;
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  errors: Array<{ org_nr: string; error: string }>;
}

/**
 * Pull eligible leads for today's outreach run.
 *
 * Filters (campaign config):
 *   - status = 'new'                    (untriaged)
 *   - email is not null                 (otherwise we can't send)
 *   - email not in outreach_suppressions
 *   - score >= minScore
 *   - org_form ∈ allowedOrgForms (when non-empty)
 *   - nace_code does NOT start with any of excludedNacePrefixes
 *   - hasn't already received an outreach email (no outreach_emails row
 *     with direction='out' for this org_nr) — we don't double-send.
 *
 * Returns up to `maxPerDay` candidates, highest-score first.
 */
async function selectCandidates(
  config: Awaited<ReturnType<typeof loadCampaignConfig>>
): Promise<Company[]> {
  const supabase = getSupabaseAdmin();

  // Already-emailed org_nrs.
  const { data: prior } = await supabase
    .from("outreach_emails")
    .select("org_nr")
    .eq("direction", "out");
  const alreadyEmailed = new Set(
    (prior ?? []).map((r) => r.org_nr).filter(Boolean)
  );

  let req = supabase
    .from("companies")
    .select("*")
    .eq("status", "new")
    .not("email", "is", null)
    .gte("score", config.minScore)
    .order("score", { ascending: false })
    .order("registered_at", { ascending: false, nullsFirst: false })
    // Pull more than maxPerDay to leave room after filtering.
    .limit(config.maxPerDay * 4);

  if (config.allowedOrgForms.length > 0) {
    req = req.in("org_form", config.allowedOrgForms);
  }

  const { data, error } = await req;
  if (error) throw new Error(`selectCandidates: ${error.message}`);

  const rows = (data ?? []) as Company[];

  const filtered = rows.filter((r) => {
    if (alreadyEmailed.has(r.org_nr)) return false;
    if (config.excludedNacePrefixes.length > 0 && r.nace_code) {
      const code = r.nace_code;
      if (
        config.excludedNacePrefixes.some((prefix) =>
          code.startsWith(prefix.trim())
        )
      ) {
        return false;
      }
    }
    return true;
  });

  return filtered.slice(0, config.maxPerDay);
}

/**
 * Run the daily outreach campaign. Reads config, selects candidates,
 * sends through the same thread-aware pipeline as the manual flow.
 * Returns a summary the cron route surfaces in its response (and the
 * audit log).
 */
export async function runDailyOutreach(opts: {
  triggeredBy: "cron" | "manual";
  dryRun?: boolean;
}): Promise<DailyOutreachResult> {
  const config = await loadCampaignConfig();
  const supabase = getSupabaseAdmin();

  if (!config.enabled && opts.triggeredBy === "cron") {
    return {
      enabled: false,
      candidates: 0,
      attempted: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };
  }

  const candidates = await selectCandidates(config);
  const result: DailyOutreachResult = {
    enabled: config.enabled,
    candidates: candidates.length,
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  if (opts.dryRun) return result;

  const [fromAddress, fallbackReplyTo, inboundDomain] = await Promise.all([
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

    const firstName = lead.contact_name?.trim().split(/\s+/)[0] ?? null;
    const { data: siteRow } = await supabase
      .from("generated_sites")
      .select("org_nr")
      .eq("org_nr", lead.org_nr)
      .maybeSingle();

    const placeholders = {
      company_name: lead.name,
      kommune: lead.kommune,
      org_nr: lead.org_nr,
      site_url: siteRow ? publicSiteUrl(lead.org_nr) : "",
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

    const replyTo = inboundDomain
      ? buildThreadReplyTo(thread.id, inboundDomain)
      : fallbackReplyTo;
    const messageId = makeMessageId(inboundDomain);

    const { data: row, error: insertError } = await supabase
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

    const sendResult = await sendOutreachEmail({
      to: lead.email,
      from: fromAddress,
      subject,
      body,
      replyTo,
      messageId,
    });

    if (sendResult.ok) {
      result.sent++;
      await supabase
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
      await supabase
        .from("outreach_emails")
        .update({
          status: "failed",
          error_message: sendResult.error ?? null,
        })
        .eq("id", row.id);
    }
  }

  await supabase.from("audit_log").insert({
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
