"use server";

import { revalidatePath } from "next/cache";

import { isValidDealStage, setDealStage } from "@/lib/deals";
import type { DealStage } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function moveDealStage(
  dealId: string,
  stage: DealStage
): Promise<ActionResult> {
  if (!dealId) return { ok: false, error: "Mangler deal-id" };
  if (!isValidDealStage(stage)) return { ok: false, error: "Ugyldig stage" };

  const deal = await setDealStage(dealId, stage);
  if (!deal) return { ok: false, error: "Kunne ikke endre stage" };

  revalidatePath("/admin/crm");
  revalidatePath(`/admin/leads/${deal.org_nr}`);
  return { ok: true };
}
