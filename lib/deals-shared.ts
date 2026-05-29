/**
 * Pure data + helpers shared between server and client components.
 * No `server-only` here — these constants need to be safe to import
 * from client React components.
 */

import type { Deal, DealStage } from "@/lib/supabase/types";

export const DEAL_STAGES: ReadonlyArray<{
  value: DealStage;
  label: string;
  description: string;
  toneClass: string;
}> = [
  {
    value: "replied",
    label: "Lead",
    description: "Lead har svart — automatisk inn i CRM",
    toneClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  },
  {
    value: "in_conversation",
    label: "In conversation",
    description: "Active dialog pågyears",
    toneClass: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    value: "proposal_sent",
    label: "Proposal sent",
    description: "Proposal delivered, awaiting response",
    toneClass:
      "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-300",
  },
  {
    value: "won",
    label: "Won",
    description: "Deal closed",
    toneClass:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  },
  {
    value: "lost",
    label: "Lost",
    description: "Deal lost",
    toneClass: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300",
  },
];

export const ACTIVE_STAGES: ReadonlyArray<DealStage> = [
  "replied",
  "in_conversation",
  "proposal_sent",
];

export function isValidDealStage(v: unknown): v is DealStage {
  return typeof v === "string" && DEAL_STAGES.some((s) => s.value === v);
}

export function dealStageMeta(stage: DealStage) {
  return DEAL_STAGES.find((s) => s.value === stage) ?? DEAL_STAGES[0]!;
}

export interface KanbanCard extends Deal {
  company_name: string;
  kommune: string | null;
  days_in_stage: number;
}
