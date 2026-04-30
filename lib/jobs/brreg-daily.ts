import "server-only";

import {
  fetchEnheterRegisteredBetween,
  mapEnhetToCompanyInsert,
} from "@/lib/brreg";
import { scoreCompanyInsert, DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getExcludedOrgForms,
  getScoringWeights,
  getTargetNaceCodes,
} from "@/lib/supabase/queries";
import type {
  CompanyInsert,
  ScrapeRun,
  ScrapeTriggeredBy,
} from "@/lib/supabase/types";

export interface ScrapeJobResult {
  runId: string;
  targetDate: string;
  status: "success" | "failed";
  fetched: number;
  inserted: number;
  skipped: number;
  durationMs: number;
  error?: string;
}

/**
 * Compute the default target date — yesterday in Europe/Oslo, ISO yyyy-MM-dd.
 *
 * We just shift UTC by 24h and slice; the daily cron's exact second-of-day
 * doesn't matter since Brreg's data is whole-day buckets.
 */
export function defaultTargetDate(now: Date = new Date()): string {
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().slice(0, 10);
}

/**
 * Run the daily Brreg scrape.
 *
 * Steps:
 *   1. Load tunables (weights, targets, exclusions) from settings.
 *   2. Open a scrape_runs row (status='running').
 *   3. Fetch all entities Brreg-registered on `targetDate`.
 *   4. Filter out excluded org forms (KBO, UTLA, ...).
 *   5. Score each remaining company against the weights.
 *   6. Upsert into companies (existing rows are skipped, not overwritten).
 *   7. Close the scrape_runs row with final counts.
 *
 * The function never throws — all errors are captured into the scrape_runs
 * row and surfaced via the return value, so the cron route can return a
 * sensible HTTP status without losing observability.
 */
export async function runBrregDailyScrape(
  options: {
    targetDate?: string;
    triggeredBy?: ScrapeTriggeredBy;
  } = {}
): Promise<ScrapeJobResult> {
  const targetDate = options.targetDate ?? defaultTargetDate();
  const triggeredBy: ScrapeTriggeredBy = options.triggeredBy ?? "cron";
  const supabase = getSupabaseAdmin();
  const startedAt = Date.now();

  // 1. Open the run row up front so it's visible in /admin/queue while running.
  const { data: runRow, error: insertRunError } = await supabase
    .from("scrape_runs")
    .insert({
      target_date: targetDate,
      status: "running",
      fetched_count: 0,
      inserted_count: 0,
      skipped_count: 0,
      triggered_by: triggeredBy,
    })
    .select()
    .single<ScrapeRun>();

  if (insertRunError || !runRow) {
    throw new Error(
      `Failed to open scrape_runs row: ${insertRunError?.message ?? "no row returned"}`
    );
  }

  const runId = runRow.id;

  try {
    // 2. Load tunables in parallel with the Brreg fetch.
    const [weights, targets, excluded, fetched] = await Promise.all([
      getScoringWeights().then((w) => w ?? DEFAULT_SCORING_WEIGHTS),
      getTargetNaceCodes().then((t) => t ?? []),
      getExcludedOrgForms().then((e) => e ?? []),
      fetchEnheterRegisteredBetween(targetDate, targetDate),
    ]);

    const excludedSet = new Set(excluded);

    // 3. Map → filter excluded → score.
    const inserts: CompanyInsert[] = [];
    for (const enhet of fetched) {
      const candidate = mapEnhetToCompanyInsert(enhet);
      if (candidate.org_form && excludedSet.has(candidate.org_form)) continue;

      const { score, breakdown } = scoreCompanyInsert(
        candidate,
        weights,
        targets
      );
      candidate.score = score;
      candidate.score_breakdown = breakdown;
      inserts.push(candidate);
    }

    // 4. Insert in chunks. ON CONFLICT DO NOTHING preserves any manual edits
    //    on already-present rows (status changes, notes, etc.).
    let inserted = 0;
    const CHUNK = 500;
    for (let i = 0; i < inserts.length; i += CHUNK) {
      const slice = inserts.slice(i, i + CHUNK);
      const { count, error } = await supabase
        .from("companies")
        .upsert(slice, { onConflict: "org_nr", ignoreDuplicates: true, count: "exact" });
      if (error) throw new Error(`Insert failed: ${error.message}`);
      inserted += count ?? 0;
    }

    const durationMs = Date.now() - startedAt;
    const result: ScrapeJobResult = {
      runId,
      targetDate,
      status: "success",
      fetched: fetched.length,
      inserted,
      skipped: inserts.length - inserted,
      durationMs,
    };

    await supabase
      .from("scrape_runs")
      .update({
        status: "success",
        fetched_count: result.fetched,
        inserted_count: result.inserted,
        skipped_count: result.skipped,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await supabase.from("audit_log").insert({
      actor: triggeredBy === "cron" ? "system" : "manual",
      action: "brreg.scrape.success",
      entity_type: "scrape_run",
      entity_id: runId,
      metadata: {
        target_date: targetDate,
        fetched: result.fetched,
        inserted: result.inserted,
        skipped: result.skipped,
        duration_ms: durationMs,
      },
    });

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const durationMs = Date.now() - startedAt;

    await supabase
      .from("scrape_runs")
      .update({
        status: "failed",
        error_message: message,
        duration_ms: durationMs,
        finished_at: new Date().toISOString(),
      })
      .eq("id", runId);

    await supabase.from("audit_log").insert({
      actor: triggeredBy === "cron" ? "system" : "manual",
      action: "brreg.scrape.failed",
      entity_type: "scrape_run",
      entity_id: runId,
      metadata: { target_date: targetDate, error: message },
    });

    return {
      runId,
      targetDate,
      status: "failed",
      fetched: 0,
      inserted: 0,
      skipped: 0,
      durationMs,
      error: message,
    };
  }
}
