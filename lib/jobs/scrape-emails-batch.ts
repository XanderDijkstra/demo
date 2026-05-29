/**
 * Bulk email enrichment for recently-imported leads.
 *
 * Brreg's `epost` field is empty for the vast majority of small Norwegian
 * businesses, but most of them publish a contact email somewhere on their
 * website. The daily outreach cron filters on `email is not null`, so
 * without this batch job almost nothing flows into the campaign.
 *
 * For every company that was registered in the last N days and has a
 * website but no email yet, run the same `scrapeWebsiteEmail` we use on
 * the lead detail page. Auto-save the best candidate when it's a clear
 * winner (same logic as the manual scrape action) and re-score the row
 * so it picks up the new `has_email` weight.
 *
 * Runs serially with a tiny delay between fetches — these are external
 * sites and we don't want to hammer anyone. Fail-soft: per-lead errors
 * are logged to audit_log and the batch continues.
 */

import "server-only";

import { scoreCompanyInsert } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getScoringWeights,
  getTargetNaceCodes,
} from "@/lib/supabase/queries";
import type { Company } from "@/lib/supabase/types";

import { scrapeWebsiteEmail } from "./scrape-website-email";

export interface ScrapeEmailsBatchParams {
  /** How far back to scan. Default 4. */
  daysSince?: number;
  /** Hard cap on how many leads to process in one invocation. Default 50. */
  limit?: number;
  /** Throttle between fetches in ms. Default 250. */
  delayMs?: number;
}

export interface ScrapeEmailsBatchResult {
  ok: true;
  scanned: number;
  saved: number;
  candidates_only: number;
  failed: number;
  durationMs: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scrapeEmailsBatch(
  params: ScrapeEmailsBatchParams = {}
): Promise<ScrapeEmailsBatchResult> {
  const daysSince = params.daysSince ?? 4;
  const limit = params.limit ?? 50;
  const delayMs = params.delayMs ?? 250;

  const startedAt = Date.now();
  const supabase = getSupabaseAdmin();

  const since = new Date(
    Date.now() - daysSince * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: leads, error } = await supabase
    .from("companies")
    .select("*")
    .gte("registered_at", since)
    .is("email", null)
    .not("website", "is", null)
    .order("registered_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Kunne ikke hente leads: ${error.message}`);
  }

  const all = (leads ?? []) as Company[];

  const [weights, targets] = await Promise.all([
    getScoringWeights(),
    getTargetNaceCodes(),
  ]);

  let saved = 0;
  let candidates_only = 0;
  let failed = 0;

  for (const lead of all) {
    try {
      const result = await scrapeWebsiteEmail(lead.website);
      if (!result.ok) {
        failed += 1;
        await supabase.from("audit_log").insert({
          actor: "manual.batch",
          action: "lead.email.scrape.failed",
          entity_type: "company",
          entity_id: lead.org_nr,
          metadata: {
            website: lead.website,
            error: result.error,
            fetched_urls: result.fetchedUrls,
          },
        });
        continue;
      }

      const top = result.best;
      const second = result.candidates[1];
      const isClearWinner =
        !second || top.score - second.score >= 30 || top.score >= 100;

      if (!isClearWinner) {
        candidates_only += 1;
        await supabase.from("audit_log").insert({
          actor: "manual.batch",
          action: "lead.email.scrape.candidates",
          entity_type: "company",
          entity_id: lead.org_nr,
          metadata: {
            website: lead.website,
            best: top.email,
            candidate_count: result.candidates.length,
            fetched_urls: result.fetchedUrls,
          },
        });
        continue;
      }

      const updates: { email: string; score?: number; score_breakdown?: Company["score_breakdown"] } = {
        email: top.email,
      };
      if (weights && targets) {
        const rescored = scoreCompanyInsert(
          { ...lead, email: top.email },
          weights,
          targets
        );
        updates.score = rescored.score;
        updates.score_breakdown = rescored.breakdown;
      }

      const { error: updateError } = await supabase
        .from("companies")
        .update(updates)
        .eq("org_nr", lead.org_nr);

      if (updateError) {
        failed += 1;
        await supabase.from("audit_log").insert({
          actor: "manual.batch",
          action: "lead.email.scrape.update_failed",
          entity_type: "company",
          entity_id: lead.org_nr,
          metadata: {
            website: lead.website,
            best: top.email,
            error: updateError.message,
          },
        });
        continue;
      }

      saved += 1;
      await supabase.from("audit_log").insert({
        actor: "manual.batch",
        action: "lead.email.scrape.auto_saved",
        entity_type: "company",
        entity_id: lead.org_nr,
        metadata: {
          website: lead.website,
          best: top.email,
          new_score: updates.score,
          fetched_urls: result.fetchedUrls,
        },
      });
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      await supabase.from("audit_log").insert({
        actor: "manual.batch",
        action: "lead.email.scrape.exception",
        entity_type: "company",
        entity_id: lead.org_nr,
        metadata: { website: lead.website, error: msg },
      });
    }

    if (delayMs > 0) await sleep(delayMs);
  }

  const durationMs = Date.now() - startedAt;

  await supabase.from("audit_log").insert({
    actor: "manual.batch",
    action: "lead.email.scrape.batch_completed",
    entity_type: "settings",
    entity_id: "scrape_emails_batch",
    metadata: {
      scanned: all.length,
      saved,
      candidates_only,
      failed,
      days_since: daysSince,
      limit,
      duration_ms: durationMs,
    },
  });

  return {
    ok: true,
    scanned: all.length,
    saved,
    candidates_only,
    failed,
    durationMs,
  };
}
