import "server-only";

import { DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";

import { getSupabaseAdmin } from "./admin";
import type {
  AgencyInfo,
  ScoringWeights,
  SettingRow,
} from "./types";

/**
 * Fetch a single settings row, typed.
 * Returns null if the row does not exist.
 */
export async function getSetting<V>(key: string): Promise<V | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle<Pick<SettingRow<V>, "value">>();

  if (error) {
    throw new Error(`Failed to load setting "${key}": ${error.message}`);
  }

  return data?.value ?? null;
}

export async function getScoringWeights(): Promise<ScoringWeights | null> {
  const raw = await getSetting<Partial<ScoringWeights>>("scoring_weights");
  if (!raw) return null;
  // Merge with defaults so newly-added weights (e.g. is_handverker) work
  // against older DB rows that predate them.
  return { ...DEFAULT_SCORING_WEIGHTS, ...raw } as ScoringWeights;
}

export async function getTargetNaceCodes(): Promise<string[] | null> {
  return getSetting<string[]>("target_nace_codes");
}

export async function getExcludedOrgForms(): Promise<string[] | null> {
  return getSetting<string[]>("excluded_org_forms");
}

export async function getAgencyInfo(): Promise<AgencyInfo | null> {
  return getSetting<AgencyInfo>("agency_info");
}

/**
 * Health probe — verifies the service-role client can reach Supabase
 * and that the `settings` table exists. Returns ok/error for the UI to render.
 */
export async function checkSupabaseHealth(): Promise<
  { ok: true; settingsCount: number } | { ok: false; error: string }
> {
  try {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
      .from("settings")
      .select("*", { count: "exact", head: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, settingsCount: count ?? 0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
