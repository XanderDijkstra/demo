"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CompanyStatus } from "@/lib/supabase/types";

const VALID_STATUSES: CompanyStatus[] = [
  "new",
  "reviewed",
  "qualified",
  "rejected",
];

export async function updateLeadStatus(
  orgNr: string,
  status: CompanyStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!/^\d{9}$/.test(orgNr)) {
    return { ok: false, error: "Ugyldig org.nr" };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Ugyldig status" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("org_nr", orgNr);

  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: `lead.status.${status}`,
    entity_type: "company",
    entity_id: orgNr,
    metadata: { status },
  });

  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");

  return { ok: true };
}
