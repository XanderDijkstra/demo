import "server-only";

import { loadCampaignConfig, type OutreachCampaignConfig } from "@/lib/outreach/campaign";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Company } from "@/lib/supabase/types";

/**
 * What the daily outreach cron actually sees when it runs. Same filter
 * pipeline as selectCandidates() in lib/jobs/outreach-daily, but here
 * exposed as a funnel breakdown + the full candidate list — so the
 * operator can see exactly who is about to get emailed (and which gate
 * is filtering everyone out when 0 are queued).
 *
 * Pure read; never sends or mutates anything.
 */

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface DailyFunnelResult {
  config: OutreachCampaignConfig;
  stages: FunnelStage[];
  /** Capped at config.maxPerDay — what the cron would actually send. */
  candidates: Company[];
  /** Total that passed every gate before the per-day cap. */
  qualifiedTotal: number;
}

export async function getDailyFunnel(): Promise<DailyFunnelResult> {
  const supabase = getSupabaseAdmin();
  const config = await loadCampaignConfig();

  // Stage 0: total companies in the DB (sanity baseline).
  const totalRes = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });
  const totalLeads = totalRes.count ?? 0;

  // Stage 1: status = "new".
  const newRes = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  const newCount = newRes.count ?? 0;

  // Stage 2: + score ≥ minScore. Score before email so the operator
  // sees "there are X high-score leads → BUT only Y have an email"
  // instead of the misleading reverse.
  const scoredRes = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("status", "new")
    .gte("score", config.minScore);
  const scoredCount = scoredRes.count ?? 0;

  // Stage 3: + has email.
  const withEmailRes = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("status", "new")
    .gte("score", config.minScore)
    .not("email", "is", null);
  const withEmailCount = withEmailRes.count ?? 0;

  // Stage 4: + allowed org form.
  let formReq = supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("status", "new")
    .gte("score", config.minScore)
    .not("email", "is", null);
  if (config.allowedOrgForms.length > 0) {
    formReq = formReq.in("org_form", config.allowedOrgForms);
  }
  const formRes = await formReq;
  const formCount = formRes.count ?? 0;

  // Now pull the matching rows so we can apply the in-memory filters
  // (NACE prefix exclusion + already-emailed dedup).
  let rowsReq = supabase
    .from("companies")
    .select("*")
    .eq("status", "new")
    .gte("score", config.minScore)
    .not("email", "is", null)
    .order("score", { ascending: false })
    .order("registered_at", { ascending: false, nullsFirst: false });
  if (config.allowedOrgForms.length > 0) {
    rowsReq = rowsReq.in("org_form", config.allowedOrgForms);
  }
  const { data: candidateRows } = await rowsReq;
  const rows = (candidateRows ?? []) as Company[];

  // Stage 5: NACE prefix exclusion.
  const afterNace = rows.filter((r) => {
    if (config.excludedNacePrefixes.length === 0) return true;
    if (!r.nace_code) return true;
    return !config.excludedNacePrefixes.some((p) =>
      r.nace_code!.startsWith(p.trim())
    );
  });

  // Stage 6: not already emailed.
  const { data: prior } = await supabase
    .from("outreach_emails")
    .select("org_nr")
    .eq("direction", "out");
  const alreadyEmailed = new Set(
    (prior ?? []).map((r) => r.org_nr).filter(Boolean)
  );
  const qualified = afterNace.filter((r) => !alreadyEmailed.has(r.org_nr));

  return {
    config,
    stages: [
      { key: "total", label: "Alle leads i DB", count: totalLeads },
      { key: "new", label: "Status «ny»", count: newCount },
      {
        key: "score",
        label: `Score ≥ ${config.minScore}`,
        count: scoredCount,
      },
      { key: "email", label: "Med e-post", count: withEmailCount },
      {
        key: "orgform",
        label:
          config.allowedOrgForms.length === 0
            ? "Selskapsform (alle)"
            : `Selskapsform ∈ {${config.allowedOrgForms.join(", ")}}`,
        count: formCount,
      },
      {
        key: "nace",
        label:
          config.excludedNacePrefixes.length === 0
            ? "Ekskluderte næringer"
            : `Ikke i ekskluderte NACE-prefiks (${config.excludedNacePrefixes.length})`,
        count: afterNace.length,
      },
      {
        key: "dedupe",
        label: "Ikke allerede e-postet",
        count: qualified.length,
      },
    ],
    candidates: qualified.slice(0, config.maxPerDay),
    qualifiedTotal: qualified.length,
  };
}
