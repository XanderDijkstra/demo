/**
 * Backfill contact fields from each company's stored Brreg `raw_data`.
 *
 * Why this exists: the Brreg parser read `epost` when the API actually
 * returns `epostadresse`, so every imported lead got email=null even
 * though the address was right there in the payload. The daily scrape
 * upserts with ignoreDuplicates, so re-running it does NOT repair the
 * already-imported rows. This job does — without touching Brreg at all,
 * since the full payload is already in companies.raw_data.
 *
 * Fill-only: never overwrites a field that already has a value (so any
 * manually-entered or 1881-enriched data stays put). Re-scores every
 * row it changes so has_email / has_phone start counting.
 */

import "server-only";

import { scoreCompanyInsert } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getScoringWeights,
  getTargetNaceCodes,
} from "@/lib/supabase/queries";
import type { Company } from "@/lib/supabase/types";

export interface BackfillResult {
  ok: true;
  scanned: number;
  emailsFilled: number;
  phonesFilled: number;
  websitesFilled: number;
  updated: number;
  durationMs: number;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * Pull the contact fields out of a Brreg payload, tolerant of the
 * key-name variants we've seen.
 */
function contactFromRaw(raw: Record<string, unknown>): {
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
} {
  return {
    email: str(raw.epostadresse) ?? str(raw.epost),
    phone: str(raw.telefon) ?? str(raw.telefonnummer),
    mobile: str(raw.mobil) ?? str(raw.mobiltelefon),
    website: str(raw.hjemmeside),
  };
}

export async function backfillFromRaw(): Promise<BackfillResult> {
  const startedAt = Date.now();
  const supabase = getSupabaseAdmin();

  const [weights, targets] = await Promise.all([
    getScoringWeights(),
    getTargetNaceCodes(),
  ]);

  let emailsFilled = 0;
  let phonesFilled = 0;
  let websitesFilled = 0;
  let updated = 0;
  let scanned = 0;

  const PAGE = 500;
  let from = 0;

  // Paginate so we don't load the whole table into memory at once.
  // We only need rows where at least one contact field is still empty.
  for (;;) {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .or("email.is.null,phone.is.null,mobile.is.null,website.is.null")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(`Kunne ikke hente leads: ${error.message}`);
    const rows = (data ?? []) as Company[];
    if (rows.length === 0) break;

    for (const lead of rows) {
      scanned += 1;
      const raw = lead.raw_data;
      if (!raw || typeof raw !== "object") continue;

      const found = contactFromRaw(raw as Record<string, unknown>);

      const patch: Partial<Company> = {};
      if (found.email && !lead.email) patch.email = found.email;
      if (found.phone && !lead.phone) patch.phone = found.phone;
      if (found.mobile && !lead.mobile) patch.mobile = found.mobile;
      if (found.website && !lead.website) patch.website = found.website;

      if (Object.keys(patch).length === 0) continue;

      if (patch.email) emailsFilled += 1;
      if (patch.phone || patch.mobile) phonesFilled += 1;
      if (patch.website) websitesFilled += 1;

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
      if (!upErr) updated += 1;
    }

    if (rows.length < PAGE) break;
    from += PAGE;
  }

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "lead.backfill_from_raw",
    entity_type: "settings",
    entity_id: "backfill_from_raw",
    metadata: {
      scanned,
      emails_filled: emailsFilled,
      phones_filled: phonesFilled,
      websites_filled: websitesFilled,
      updated,
      duration_ms: Date.now() - startedAt,
    },
  });

  return {
    ok: true,
    scanned,
    emailsFilled,
    phonesFilled,
    websitesFilled,
    updated,
    durationMs: Date.now() - startedAt,
  };
}
