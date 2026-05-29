/**
 * Bulk contact enrichment via 1881.
 *
 * Targets the leads the website scraper CAN'T help: recently-registered
 * companies with no email on file. 1881 frequently has a phone, and
 * sometimes an email, even when the business has no website. Anything we
 * find gets written back and the row is re-scored so the new `has_email`
 * weight (and phone) lifts it toward the outreach threshold.
 *
 * Fill-only: we never overwrite a field that already has a value. Runs
 * serially with a small delay between lookups to stay polite to the API
 * (and within plan rate limits). Per-lead failures are logged and the
 * batch continues.
 */

import "server-only";

import {
  getOne1881Config,
  lookupByOrgNr,
  type One1881Config,
} from "@/lib/enrichment/one1881";
import { scoreCompanyInsert } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getScoringWeights,
  getTargetNaceCodes,
} from "@/lib/supabase/queries";
import type { Company } from "@/lib/supabase/types";

export interface Enrich1881BatchParams {
  /** How far back to scan, in days. Default 4. */
  daysSince?: number;
  /** Hard cap on leads processed per invocation. Default 50. */
  limit?: number;
  /** Throttle between lookups in ms. Default 300. */
  delayMs?: number;
}

export interface Enrich1881BatchResult {
  ok: true;
  scanned: number;
  emailsFound: number;
  phonesFound: number;
  updated: number;
  failed: number;
  durationMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrich1881Batch(
  params: Enrich1881BatchParams = {}
): Promise<Enrich1881BatchResult> {
  const daysSince = params.daysSince ?? 4;
  const limit = params.limit ?? 50;
  const delayMs = params.delayMs ?? 300;

  const cfg: One1881Config | null = getOne1881Config();
  if (!cfg) {
    throw new Error(
      "1881 ikke konfigurert — sett ONE1881_API_KEY i miljøvariablene"
    );
  }

  const startedAt = Date.now();
  const supabase = getSupabaseAdmin();

  const since = new Date(
    Date.now() - daysSince * 24 * 60 * 60 * 1000
  ).toISOString();

  // Prioritise the highest-scoring leads that are missing an email —
  // those are the ones the cron is skipping.
  const { data: leads, error } = await supabase
    .from("companies")
    .select("*")
    .gte("registered_at", since)
    .is("email", null)
    .order("score", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Kunne ikke hente leads: ${error.message}`);
  }

  const all = (leads ?? []) as Company[];

  const [weights, targets] = await Promise.all([
    getScoringWeights(),
    getTargetNaceCodes(),
  ]);

  let emailsFound = 0;
  let phonesFound = 0;
  let updated = 0;
  let failed = 0;

  for (const lead of all) {
    try {
      const result = await lookupByOrgNr(lead.org_nr, cfg);
      if (!result.ok) {
        failed += 1;
        await supabase.from("audit_log").insert({
          actor: "manual.batch",
          action: "lead.enrich.1881.failed",
          entity_type: "company",
          entity_id: lead.org_nr,
          metadata: { error: result.error, status: result.status },
        });
        if (delayMs > 0) await sleep(delayMs);
        continue;
      }

      const { contact } = result;

      // Fill-only: never clobber existing values.
      const patch: Partial<Company> = {};
      if (contact.email && !lead.email) patch.email = contact.email;
      if (contact.phone && !lead.phone) patch.phone = contact.phone;
      if (contact.mobile && !lead.mobile) patch.mobile = contact.mobile;
      if (contact.contactName && !lead.contact_name)
        patch.contact_name = contact.contactName;

      if (Object.keys(patch).length === 0) {
        // 1881 had nothing new for this lead.
        await supabase.from("audit_log").insert({
          actor: "manual.batch",
          action: "lead.enrich.1881.empty",
          entity_type: "company",
          entity_id: lead.org_nr,
          metadata: { found_in: result.foundIn, keys: result.topLevelKeys },
        });
        if (delayMs > 0) await sleep(delayMs);
        continue;
      }

      if (patch.email) emailsFound += 1;
      if (patch.phone || patch.mobile) phonesFound += 1;

      // Re-score with the merged values so has_email / has_phone land.
      if (weights && targets) {
        const merged = { ...lead, ...patch } as Company;
        const rescored = scoreCompanyInsert(merged, weights, targets);
        patch.score = rescored.score;
        patch.score_breakdown = rescored.breakdown;
      }

      const { error: upErr } = await supabase
        .from("companies")
        .update(patch)
        .eq("org_nr", lead.org_nr);

      if (upErr) {
        failed += 1;
        await supabase.from("audit_log").insert({
          actor: "manual.batch",
          action: "lead.enrich.1881.update_failed",
          entity_type: "company",
          entity_id: lead.org_nr,
          metadata: { error: upErr.message },
        });
        if (delayMs > 0) await sleep(delayMs);
        continue;
      }

      updated += 1;
      await supabase.from("audit_log").insert({
        actor: "manual.batch",
        action: "lead.enrich.1881.updated",
        entity_type: "company",
        entity_id: lead.org_nr,
        metadata: {
          filled: Object.keys(patch).filter(
            (k) => k !== "score" && k !== "score_breakdown"
          ),
          email: patch.email ?? null,
          new_score: patch.score ?? null,
        },
      });
    } catch (err) {
      failed += 1;
      await supabase.from("audit_log").insert({
        actor: "manual.batch",
        action: "lead.enrich.1881.exception",
        entity_type: "company",
        entity_id: lead.org_nr,
        metadata: { error: err instanceof Error ? err.message : String(err) },
      });
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  const durationMs = Date.now() - startedAt;

  await supabase.from("audit_log").insert({
    actor: "manual.batch",
    action: "lead.enrich.1881.batch_completed",
    entity_type: "settings",
    entity_id: "enrich_1881_batch",
    metadata: {
      scanned: all.length,
      emails_found: emailsFound,
      phones_found: phonesFound,
      updated,
      failed,
      days_since: daysSince,
      limit,
      duration_ms: durationMs,
    },
  });

  return {
    ok: true,
    scanned: all.length,
    emailsFound,
    phonesFound,
    updated,
    failed,
    durationMs,
  };
}
