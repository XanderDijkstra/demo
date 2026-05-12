import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Deal, DealStage, DealUpdate } from "@/lib/supabase/types";

import {
  ACTIVE_STAGES,
  DEAL_STAGES,
  dealStageMeta,
  isValidDealStage,
  type KanbanCard,
} from "./deals-shared";

// Re-export the shared constants so existing imports from "@/lib/deals"
// continue to work for server callers.
export {
  ACTIVE_STAGES,
  DEAL_STAGES,
  dealStageMeta,
  isValidDealStage,
  type KanbanCard,
};

/** Fetch the currently active deal for a company, or null if none. */
export async function getActiveDealByOrgNr(
  orgNr: string
): Promise<Deal | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("deals")
    .select("*")
    .eq("org_nr", orgNr)
    .in("stage", ACTIVE_STAGES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Deal | null) ?? null;
}

/**
 * Create a deal in `replied` stage if no active deal exists for this company.
 * Idempotent — safe to call multiple times on the same reply event.
 */
export async function ensureDealForReply(orgNr: string): Promise<Deal | null> {
  const existing = await getActiveDealByOrgNr(orgNr);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("deals")
    .insert({
      org_nr: orgNr,
      stage: "replied",
      stage_changed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) return null;

  await supabase.from("audit_log").insert({
    actor: "system",
    action: "deal.created",
    entity_type: "deal",
    entity_id: data.id,
    metadata: { org_nr: orgNr, stage: "replied", trigger: "reply" },
  });

  return data as Deal;
}

/**
 * Advance the active deal to a given stage. No-op when no active deal exists.
 * Won't downgrade across active stages unless explicitly allowed.
 */
export async function advanceActiveDealStage(
  orgNr: string,
  toStage: DealStage,
  options: { allowDowngrade?: boolean } = {}
): Promise<Deal | null> {
  const supabase = getSupabaseAdmin();
  const active = await getActiveDealByOrgNr(orgNr);
  if (!active) return null;

  const order = ACTIVE_STAGES;
  const currentIdx = order.indexOf(active.stage);
  const targetIdx = order.indexOf(toStage);
  if (
    !options.allowDowngrade &&
    currentIdx >= 0 &&
    targetIdx >= 0 &&
    targetIdx < currentIdx
  ) {
    return active;
  }
  if (active.stage === toStage) return active;

  const { data, error } = await supabase
    .from("deals")
    .update({
      stage: toStage,
      stage_changed_at: new Date().toISOString(),
    })
    .eq("id", active.id)
    .select()
    .single();

  if (error || !data) return null;

  await supabase.from("audit_log").insert({
    actor: "system",
    action: `deal.stage.${toStage}`,
    entity_type: "deal",
    entity_id: active.id,
    metadata: { org_nr: orgNr, from: active.stage, to: toStage },
  });

  return data as Deal;
}

/** Manual stage transition initiated by the operator. */
export async function setDealStage(
  dealId: string,
  toStage: DealStage,
  options: { lostReason?: string } = {}
): Promise<Deal | null> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const update: DealUpdate = {
    stage: toStage,
    stage_changed_at: now,
  };
  if (toStage === "won") update.won_at = now;
  if (toStage === "lost") {
    update.lost_at = now;
    if (options.lostReason) update.lost_reason = options.lostReason;
  }

  const { data, error } = await supabase
    .from("deals")
    .update(update)
    .eq("id", dealId)
    .select()
    .single();

  if (error || !data) return null;

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: `deal.stage.${toStage}`,
    entity_type: "deal",
    entity_id: dealId,
    metadata: { stage: toStage, lost_reason: options.lostReason ?? null },
  });

  return data as Deal;
}

export async function updateDealFields(
  dealId: string,
  patch: { value_nok?: number | null; notes?: string | null }
): Promise<Deal | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("deals")
    .update({
      ...(patch.value_nok !== undefined ? { value_nok: patch.value_nok } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    })
    .eq("id", dealId)
    .select()
    .single();

  if (error || !data) return null;
  return data as Deal;
}

/** Create a deal manually (operator opens a new deal without an inbound reply). */
export async function createManualDeal(orgNr: string): Promise<Deal | null> {
  const existing = await getActiveDealByOrgNr(orgNr);
  if (existing) return existing;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("deals")
    .insert({
      org_nr: orgNr,
      stage: "in_conversation",
      stage_changed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) return null;

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "deal.created",
    entity_type: "deal",
    entity_id: data.id,
    metadata: { org_nr: orgNr, stage: "in_conversation", trigger: "manual" },
  });

  return data as Deal;
}

// ─── Kanban view ────────────────────────────────────────────────────────────

function daysSince(iso: string): number {
  const d = new Date(iso).getTime();
  return Math.max(0, Math.floor((Date.now() - d) / (24 * 60 * 60 * 1000)));
}

/**
 * Fetch all deals for the kanban, grouped by stage with company info joined.
 * Won/lost deals are filtered to the last 30 days to keep the board tidy.
 */
export async function fetchKanban(): Promise<Record<DealStage, KanbanCard[]>> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [activeRes, closedRes] = await Promise.all([
    supabase
      .from("deals")
      .select("*, companies(name, kommune)")
      .in("stage", ACTIVE_STAGES)
      .order("stage_changed_at", { ascending: false }),
    supabase
      .from("deals")
      .select("*, companies(name, kommune)")
      .in("stage", ["won", "lost"])
      .gte("stage_changed_at", cutoff)
      .order("stage_changed_at", { ascending: false }),
  ]);

  type Joined = Deal & {
    companies: { name: string; kommune: string | null } | null;
  };

  // Cast through unknown — the FK between deals.org_nr and companies.org_nr
  // exists in SQL but isn't reflected in the hand-written Database
  // `Relationships: []` (which we keep empty to avoid bloating types).
  const rows: Joined[] = [
    ...((activeRes.data ?? []) as unknown as Joined[]),
    ...((closedRes.data ?? []) as unknown as Joined[]),
  ];

  const grouped: Record<DealStage, KanbanCard[]> = {
    replied: [],
    in_conversation: [],
    proposal_sent: [],
    won: [],
    lost: [],
  };

  for (const row of rows) {
    grouped[row.stage].push({
      ...row,
      company_name: row.companies?.name ?? row.org_nr,
      kommune: row.companies?.kommune ?? null,
      days_in_stage: daysSince(row.stage_changed_at),
    });
  }

  return grouped;
}
