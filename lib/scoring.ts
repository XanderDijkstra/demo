/**
 * Lead scoring.
 *
 * Each company gets a 0–100 score. Weights are configurable via the
 * `settings.scoring_weights` row, so they can be tuned from /admin/settings
 * without redeploying.
 *
 * NACE codes match by prefix. Settings stores e.g. "43.22"; a company with
 * naeringskode1.kode "43.220" matches.
 */

import type { CompanyInsert, ScoreBreakdown, ScoringWeights } from "@/lib/supabase/types";

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  has_phone: 30,
  has_email: 25,
  org_form_as: 20,
  target_nace: 20,
  is_handverker: 20,
  has_website: 10,
  has_real_address: 10,
  freshly_founded: 10,
};

/** Norwegian labels for each scoring signal — used by the lead detail page,
 *  the swipe card, and anywhere else we surface the score breakdown. */
export const SCORE_LABELS_NB: Record<keyof ScoringWeights, string> = {
  has_phone: "Har telefon",
  has_email: "Har e-post",
  org_form_as: "Selskapsform AS/ASA",
  target_nace: "Målnæring (NACE)",
  is_handverker: "Håndverker",
  has_website: "Har nettside",
  has_real_address: "Reell forretningsadresse",
  freshly_founded: "Nystiftet",
};

const AS_LIKE_FORMS = new Set(["AS", "ASA"]);

/**
 * NACE prefixes that count as håndverker (Norwegian building trades).
 * Anything starting with "41." (bygging av bygninger), "43." (spesialisert
 * bygge- og anleggsvirksomhet — rørlegger, elektriker, maler, taktekker,
 * snekker, ...) or matching "81.30" (anleggsgartner).
 */
const HANDVERKER_NACE_PREFIXES = ["41.", "43.", "81.30"];

const FRESH_DAYS = 7;

function isHandverker(naceCode: string | null | undefined): boolean {
  if (!naceCode) return false;
  const normalized = naceCode.replace(/\.?$/, "");
  return HANDVERKER_NACE_PREFIXES.some((prefix) =>
    normalized.startsWith(prefix)
  );
}

function isWithinDays(iso: string | null | undefined, days: number): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const ageMs = Date.now() - d.getTime();
  return ageMs >= 0 && ageMs <= days * 24 * 60 * 60 * 1000;
}

function naceMatches(naceCode: string | null | undefined, targets: string[]): boolean {
  if (!naceCode) return false;
  const normalized = naceCode.replace(/\.?$/, "");
  return targets.some((target) => {
    const t = target.trim();
    if (!t) return false;
    return normalized.startsWith(t);
  });
}

export interface ScoreInput {
  phone: string | null;
  mobile: string | null;
  email: string | null;
  org_form: string | null;
  nace_code: string | null;
  website: string | null;
  address_line: string | null;
  postal_code: string | null;
  founded_at: string | null;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdown;
}

/**
 * Score a company against the active weights and target NACE list.
 * Returns the score (clamped to [0, 100]) and a per-signal breakdown.
 */
export function scoreCompany(
  input: ScoreInput,
  weights: ScoringWeights,
  targetNaceCodes: string[]
): ScoreResult {
  const breakdown: ScoreBreakdown = {};

  if (input.phone || input.mobile) {
    breakdown.has_phone = weights.has_phone;
  }

  if (input.email && input.email.trim()) {
    breakdown.has_email = weights.has_email;
  }

  if (input.org_form && AS_LIKE_FORMS.has(input.org_form)) {
    breakdown.org_form_as = weights.org_form_as;
  }

  if (naceMatches(input.nace_code, targetNaceCodes)) {
    breakdown.target_nace = weights.target_nace;
  }

  if (isHandverker(input.nace_code)) {
    breakdown.is_handverker = weights.is_handverker;
  }

  if (input.website) {
    breakdown.has_website = weights.has_website;
  }

  // "Real address" = a non-PO-box street address with a postal code.
  // Brreg always returns address objects, so we check that adresse[] has
  // something that doesn't start with "Postboks".
  const addressIsReal =
    !!input.address_line &&
    !!input.postal_code &&
    !/^postboks/i.test(input.address_line.trim());
  if (addressIsReal) {
    breakdown.has_real_address = weights.has_real_address;
  }

  if (isWithinDays(input.founded_at, FRESH_DAYS)) {
    breakdown.freshly_founded = weights.freshly_founded;
  }

  const score = Object.values(breakdown).reduce<number>(
    (sum, v) => sum + (v ?? 0),
    0
  );

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown,
  };
}

/**
 * Convenience: score a CompanyInsert directly.
 */
export function scoreCompanyInsert(
  insert: CompanyInsert,
  weights: ScoringWeights,
  targetNaceCodes: string[]
): ScoreResult {
  return scoreCompany(
    {
      phone: insert.phone ?? null,
      mobile: insert.mobile ?? null,
      email: insert.email ?? null,
      org_form: insert.org_form ?? null,
      nace_code: insert.nace_code ?? null,
      website: insert.website ?? null,
      address_line: insert.address_line ?? null,
      postal_code: insert.postal_code ?? null,
      founded_at: insert.founded_at ?? null,
    },
    weights,
    targetNaceCodes
  );
}
