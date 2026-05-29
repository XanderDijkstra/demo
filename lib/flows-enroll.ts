import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Flow } from "@/lib/supabase/types";

/**
 * Reply = hard stop. The moment a lead replies (or otherwise enters a
 * live conversation) we cancel every still-pending flow enrollment for
 * them, so no automated nudge can land in a warm thread. Called from the
 * inbound webhook handler. Fail-soft.
 */
export async function cancelPendingEnrollments(
  orgNr: string,
  reason: string
): Promise<void> {
  if (!orgNr) return;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("flow_enrollments")
      .update({
        status: "cancelled",
        error_message: reason,
        processed_at: new Date().toISOString(),
      })
      .eq("org_nr", orgNr)
      .eq("status", "pending")
      .select("id");
    if (data && data.length > 0) {
      await supabase.from("audit_log").insert({
        actor: "system",
        action: "flow.enrollments_cancelled",
        entity_type: "company",
        entity_id: orgNr,
        metadata: { reason, count: data.length },
      });
    }
  } catch {
    // Never block inbound handling on this side-effect.
  }
}

/**
 * Enroll a lead into every enabled stage-triggered flow whose
 * trigger_stage matches the stage the lead just entered.
 *
 * Called from the deal stage-change helpers (swipe-to-CRM, kanban
 * moves, reply auto-create). The flows processor later sends the
 * follow-up once `due_at` (now + delay) passes.
 *
 * Idempotent: the unique (flow_id, org_nr) constraint means re-entering
 * the same stage won't duplicate or reset an existing enrollment.
 * Fail-soft — never throws into the caller's stage-change flow.
 */
export async function enrollLeadInStageFlows(
  orgNr: string,
  stage: string
): Promise<void> {
  if (!orgNr || !stage) return;
  try {
    const supabase = getSupabaseAdmin();

    const { data: flowsData } = await supabase
      .from("flows")
      .select("*")
      .eq("enabled", true)
      .eq("trigger_type", "stage_entered")
      .eq("trigger_stage", stage);

    const flows = (flowsData ?? []) as Flow[];
    if (flows.length === 0) return;

    const now = Date.now();
    for (const flow of flows) {
      const dueAt = new Date(
        now + flow.delay_hours * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase.from("flow_enrollments").upsert(
        {
          flow_id: flow.id,
          org_nr: orgNr,
          due_at: dueAt,
          status: "pending",
        },
        { onConflict: "flow_id,org_nr", ignoreDuplicates: true }
      );
      if (error) continue;

      await supabase.from("audit_log").insert({
        actor: "system",
        action: "flow.enrolled",
        entity_type: "flow",
        entity_id: flow.id,
        metadata: { org_nr: orgNr, stage, due_at: dueAt },
      });
    }
  } catch {
    // Enrollment is a side-effect of moving a deal — never let it break
    // the move itself.
  }
}
