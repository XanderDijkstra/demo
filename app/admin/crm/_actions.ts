"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { fetchEnhetByOrgNr, mapEnhetToCompanyInsert } from "@/lib/brreg";
import {
  ACTIVE_STAGES,
  createManualDeal,
  isValidDealStage,
  setDealStage,
} from "@/lib/deals";
import { scoreCompanyInsert } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getScoringWeights,
  getTargetNaceCodes,
} from "@/lib/supabase/queries";
import type { DealStage } from "@/lib/supabase/types";

type ActionResult = { ok: true; orgNr?: string } | { ok: false; error: string };

export async function moveDealStage(
  dealId: string,
  stage: DealStage
): Promise<ActionResult> {
  if (!dealId) return { ok: false, error: "Missing deal id" };
  if (!isValidDealStage(stage)) return { ok: false, error: "Invalid stage" };

  const deal = await setDealStage(dealId, stage);
  if (!deal) return { ok: false, error: "Could not change stage" };

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/leads/${deal.org_nr}`);
  return { ok: true };
}

// ─── Manually add a lead to the pipeline ─────────────────────────────────────

const AddLeadSchema = z.object({
  orgNr: z.string().regex(/^\d{9}$/, "Org.nr må være 9 siffer"),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  contactName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/**
 * Add an arbitrary org.nr into the pipeline manually.
 *
 *   - If the company isn't in our DB yet, fetch it from Brreg, score
 *     it with the current weights, and insert.
 *   - If it already exists, leave the existing row alone (no clobber
 *     of contact_name / email / status).
 *   - Then create a manual deal in "in_conversation" via
 *     createManualDeal (idempotent — returns the existing active deal
 *     if one is already in the pipeline).
 *
 * Optional email + contactName fields are only filled when the existing
 * row is empty there — we never overwrite operator-edited values.
 */
export async function addLeadToCrm(
  formData: FormData
): Promise<ActionResult> {
  const parsed = AddLeadSchema.safeParse({
    orgNr: String(formData.get("orgNr") ?? "").trim(),
    email: String(formData.get("email") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ugyldig input",
    };
  }
  const { orgNr, email, contactName } = parsed.data;

  const supabase = getSupabaseAdmin();

  // Bail early if an active deal already exists — surfaces the right
  // message instead of silently re-using.
  const { data: existingActive } = await supabase
    .from("deals")
    .select("id")
    .eq("org_nr", orgNr)
    .in("stage", ACTIVE_STAGES)
    .maybeSingle();
  if (existingActive) {
    return { ok: false, error: "Lead ligger allerede i pipeline" };
  }

  // Find or fetch the company.
  const { data: existingCompany } = await supabase
    .from("companies")
    .select("org_nr, email, contact_name")
    .eq("org_nr", orgNr)
    .maybeSingle();

  if (!existingCompany) {
    let enhet;
    try {
      enhet = await fetchEnhetByOrgNr(orgNr);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Brreg-oppslag feilet",
      };
    }
    if (!enhet) {
      return { ok: false, error: "Fant ikke org.nr i Brreg" };
    }

    const insert = mapEnhetToCompanyInsert(enhet);
    if (email && !insert.email) insert.email = email;
    if (contactName && !insert.contact_name) insert.contact_name = contactName;

    const [weights, targets] = await Promise.all([
      getScoringWeights(),
      getTargetNaceCodes(),
    ]);
    if (weights && targets) {
      const { score, breakdown } = scoreCompanyInsert(insert, weights, targets);
      insert.score = score;
      insert.score_breakdown = breakdown;
    }

    const { error: insertError } = await supabase
      .from("companies")
      .upsert(insert, { onConflict: "org_nr", ignoreDuplicates: true });
    if (insertError) {
      return { ok: false, error: insertError.message };
    }
  } else {
    // Company already exists — fill missing email / contactName only.
    const patch: Record<string, string> = {};
    if (email && !existingCompany.email) patch.email = email;
    if (contactName && !existingCompany.contact_name)
      patch.contact_name = contactName;
    if (Object.keys(patch).length > 0) {
      await supabase.from("companies").update(patch).eq("org_nr", orgNr);
    }
  }

  const deal = await createManualDeal(orgNr);
  if (!deal) {
    return {
      ok: false,
      error: "Kunne ikke opprette deal — sjekk loggen",
    };
  }

  revalidatePath("/admin/crm");
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${orgNr}`);
  return { ok: true, orgNr };
}
