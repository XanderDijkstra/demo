"use server";

import { revalidatePath } from "next/cache";

import { createManualDeal } from "@/lib/deals";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CompanyStatus } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

function isValidOrgNr(orgNr: string): boolean {
  return /^\d{9}$/.test(orgNr);
}

async function setStatus(
  orgNr: string,
  status: CompanyStatus,
  action: string
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Ugyldig org.nr" };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("org_nr", orgNr);

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action,
    entity_type: "company",
    entity_id: orgNr,
    metadata: { status },
  });

  return { ok: true };
}

export async function swipeReject(orgNr: string): Promise<ActionResult> {
  const result = await setStatus(orgNr, "rejected", "swipe.reject");
  revalidatePath("/admin/swipe");
  revalidatePath("/admin/leads");
  return result;
}

export async function swipeQualify(orgNr: string): Promise<ActionResult> {
  const result = await setStatus(orgNr, "qualified", "swipe.qualify");
  revalidatePath("/admin/swipe");
  revalidatePath("/admin/leads");
  return result;
}

export async function swipeToCrm(orgNr: string): Promise<ActionResult> {
  const statusResult = await setStatus(orgNr, "qualified", "swipe.to_crm");
  if (!statusResult.ok) return statusResult;

  const deal = await createManualDeal(orgNr);
  if (!deal) {
    return {
      ok: false,
      error:
        "Kvalifisert, men kunne ikke opprette deal (kanskje finnes en aktiv allerede)",
    };
  }

  revalidatePath("/admin/swipe");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/crm");
  return { ok: true };
}

/** Mark as reviewed without rejecting — comes back later, just not in this queue. */
export async function swipeReview(orgNr: string): Promise<ActionResult> {
  const result = await setStatus(orgNr, "reviewed", "swipe.review");
  revalidatePath("/admin/swipe");
  revalidatePath("/admin/leads");
  return result;
}
