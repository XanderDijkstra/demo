"use server";

import { revalidatePath } from "next/cache";

import { isValidDealStage, setDealStage } from "@/lib/deals";
import type { DealStage } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

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
