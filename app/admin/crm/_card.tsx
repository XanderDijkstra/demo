"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { DEAL_STAGES, type KanbanCard } from "@/lib/deals-shared";
import type { DealStage } from "@/lib/supabase/types";
import { cn, formatCompanyName } from "@/lib/utils";

import { moveDealStage } from "./_actions";

interface Props {
  card: KanbanCard;
}

export function DealCard({ card }: Props) {
  const [pending, startTransition] = useTransition();

  function handleStageChange(stage: DealStage) {
    if (stage === card.stage) return;
    startTransition(async () => {
      const result = await moveDealStage(card.id, stage);
      if (result.ok) {
        toast.success(`Flyttet til ${stageLabel(stage)}`);
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    });
  }

  const valueLabel =
    typeof card.value_nok === "number" && card.value_nok > 0
      ? new Intl.NumberFormat("nb-NO", {
          style: "currency",
          currency: "NOK",
          maximumFractionDigits: 0,
        }).format(card.value_nok)
      : null;

  const isClosed = card.stage === "won" || card.stage === "lost";

  return (
    <article
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        pending && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/leads/${card.org_nr}` as never}
          className="min-w-0 flex-1 group/title"
        >
          <div className="truncate text-sm font-medium leading-tight group-hover/title:underline">
            {formatCompanyName(card.company_name)}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground font-mono">
            {card.org_nr}
          </div>
        </Link>
        <Link
          href={`/admin/leads/${card.org_nr}` as never}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Open lead"
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {card.kommune ? <span>{card.kommune}</span> : null}
        <span aria-hidden>·</span>
        <span>
          {card.days_in_stage === 0
            ? "today"
            : card.days_in_stage === 1
              ? "yesterday"
              : `${card.days_in_stage} dager`}
        </span>
        {valueLabel ? (
          <>
            <span aria-hidden>·</span>
            <span className="font-medium text-foreground">{valueLabel}</span>
          </>
        ) : null}
      </div>

      {card.notes ? (
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {card.notes}
        </p>
      ) : null}

      {card.stage === "lost" && card.lost_reason ? (
        <p className="mt-2 text-[11px] text-rose-700 dark:text-rose-300">
          Reason: {card.lost_reason}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-1.5">
        {isClosed ? (
          <Badge
            variant="outline"
            className={card.stage === "won" ? "text-emerald-700" : "text-rose-700"}
          >
            {stageLabel(card.stage)}
          </Badge>
        ) : null}
        <select
          value={card.stage}
          onChange={(e) => handleStageChange(e.target.value as DealStage)}
          disabled={pending}
          className="ml-auto h-7 max-w-[140px] rounded-md border border-input bg-transparent px-2 text-[11px] shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {DEAL_STAGES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </article>
  );
}

function stageLabel(stage: DealStage): string {
  return DEAL_STAGES.find((s) => s.value === stage)?.label ?? stage;
}
