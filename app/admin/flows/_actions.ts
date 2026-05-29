"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { processFlows } from "@/lib/jobs/flows-processor";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const VALID_STAGES = ["replied", "in_conversation", "proposal_sent", "won", "lost"];

const FlowSchema = z
  .object({
    name: z.string().trim().min(1, "Navn er påkrevd").max(120),
    trigger_type: z.enum(["no_reply", "stage_entered"]),
    trigger_stage: z.string().trim().nullable(),
    delay_hours: z.coerce.number().int().min(0, "Kan ikke være negativ").max(2160), // ≤ 90 dager
    follow_up_subject: z.string().trim().min(1, "Emne er påkrevd").max(998),
    follow_up_body: z.string().trim().min(1, "Tekst er påkrevd").max(50_000),
    enabled: z.boolean(),
  })
  .refine(
    (v) =>
      v.trigger_type !== "stage_entered" ||
      (v.trigger_stage && VALID_STAGES.includes(v.trigger_stage)),
    { message: "Velg en gyldig CRM-stage for trigger", path: ["trigger_stage"] }
  );

function parseForm(formData: FormData) {
  const triggerType = String(formData.get("trigger_type") ?? "no_reply");
  return FlowSchema.safeParse({
    name: formData.get("name"),
    trigger_type: triggerType,
    trigger_stage:
      triggerType === "stage_entered"
        ? String(formData.get("trigger_stage") ?? "")
        : null,
    delay_hours: formData.get("delay_hours"),
    follow_up_subject: formData.get("follow_up_subject"),
    follow_up_body: formData.get("follow_up_body"),
    enabled: formData.get("enabled") === "on",
  });
}

export async function createFlow(formData: FormData): Promise<ActionResult> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldig" };
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("flows").insert({
    name: parsed.data.name,
    delay_hours: parsed.data.delay_hours,
    follow_up_subject: parsed.data.follow_up_subject,
    follow_up_body: parsed.data.follow_up_body,
    enabled: parsed.data.enabled,
    trigger_type: parsed.data.trigger_type,
    trigger_stage:
      parsed.data.trigger_type === "stage_entered"
        ? parsed.data.trigger_stage
        : null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/flows");
  return { ok: true, message: "Flow opprettet" };
}

export async function updateFlow(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Mangler id" };
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ugyldig" };
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("flows")
    .update({
      name: parsed.data.name,
      delay_hours: parsed.data.delay_hours,
      follow_up_subject: parsed.data.follow_up_subject,
      follow_up_body: parsed.data.follow_up_body,
      enabled: parsed.data.enabled,
      trigger_type: parsed.data.trigger_type,
      trigger_stage:
        parsed.data.trigger_type === "stage_entered"
          ? parsed.data.trigger_stage
          : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/flows");
  return { ok: true, message: "Flow lagret" };
}

export async function toggleFlow(
  id: string,
  enabled: boolean
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Mangler id" };
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("flows")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/flows");
  return { ok: true, message: enabled ? "Flow aktivert" : "Flow pauset" };
}

export async function deleteFlow(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Mangler id" };
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("flows").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/flows");
  return { ok: true, message: "Flow slettet" };
}

export async function runFlowsNow(): Promise<
  ActionResult & { sent?: number; skippedReplied?: number; failed?: number }
> {
  try {
    const r = await processFlows({ triggeredBy: "manual" });
    revalidatePath("/admin/flows");
    revalidatePath("/admin/inbox");
    return {
      ok: true,
      sent: r.sent,
      skippedReplied: r.skippedReplied,
      failed: r.failed,
      message: `Sendte ${r.sent} oppfølginger (${r.skippedReplied} svarte allerede, ${r.failed} feilet)`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
