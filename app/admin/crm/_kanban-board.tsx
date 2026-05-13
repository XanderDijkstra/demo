"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { DEAL_STAGES, type KanbanCard } from "@/lib/deals-shared";
import type { DealStage } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { moveDealStage } from "./_actions";
import { DealCard } from "./_card";

type Board = Record<DealStage, KanbanCard[]>;

interface Props {
  initial: Board;
}

function cloneBoard(b: Board): Board {
  return {
    replied: [...b.replied],
    in_conversation: [...b.in_conversation],
    proposal_sent: [...b.proposal_sent],
    won: [...b.won],
    lost: [...b.lost],
  };
}

export function KanbanBoard({ initial }: Props) {
  const [board, setBoard] = useState<Board>(initial);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverStage, setHoverStage] = useState<DealStage | null>(null);
  const [, startTransition] = useTransition();

  // Resync when the server prop changes (revalidatePath from another action).
  // We diff by a stable key over (stage, id) pairs so we don't clobber a
  // mid-flight optimistic update with stale server data.
  const initialKey = DEAL_STAGES.map((s) =>
    initial[s.value].map((c) => c.id).join(",")
  ).join("|");
  useEffect(() => {
    setBoard(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  function findStageOf(cardId: string): DealStage | null {
    for (const stage of DEAL_STAGES) {
      if (board[stage.value].some((c) => c.id === cardId)) return stage.value;
    }
    return null;
  }

  const handleDrop = useCallback(
    (toStage: DealStage, cardId: string | null) => {
      setHoverStage(null);
      setDraggingId(null);
      const id = cardId ?? draggingId;
      if (!id) return;

      const fromStage = findStageOf(id);
      if (!fromStage || fromStage === toStage) return;

      const card = board[fromStage].find((c) => c.id === id);
      if (!card) return;

      // Optimistic update — move locally first, roll back on failure.
      const prevBoard = board;
      const next = cloneBoard(board);
      next[fromStage] = next[fromStage].filter((c) => c.id !== id);
      next[toStage] = [
        { ...card, stage: toStage, days_in_stage: 0 },
        ...next[toStage],
      ];
      setBoard(next);

      startTransition(async () => {
        const result = await moveDealStage(id, toStage);
        if (result.ok) {
          const meta = DEAL_STAGES.find((s) => s.value === toStage);
          toast.success(`Flyttet til ${meta?.label ?? toStage}`, {
            duration: 1500,
          });
        } else {
          toast.error(`Feilet: ${result.error}`);
          setBoard(prevBoard);
        }
      });
    },
    [board, draggingId]
  );

  return (
    <div className="overflow-x-auto -mx-6 px-6 pb-4">
      <div className="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4">
        {DEAL_STAGES.map((stage) => {
          const cards = board[stage.value];
          const isHover = hoverStage === stage.value;
          const isOriginOfDragging =
            draggingId !== null && findStageOf(draggingId) === stage.value;

          return (
            <section
              key={stage.value}
              onDragOver={(e) => {
                if (!draggingId) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (hoverStage !== stage.value) setHoverStage(stage.value);
              }}
              onDragLeave={(e) => {
                // Only clear when the pointer truly leaves the column,
                // not when it crosses between child elements.
                if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
                if (hoverStage === stage.value) setHoverStage(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const cardId = e.dataTransfer.getData("text/deal-id") || null;
                handleDrop(stage.value, cardId);
              }}
              className={cn(
                "flex min-h-[400px] flex-col rounded-lg border bg-muted/30 p-2 transition-colors",
                isHover && !isOriginOfDragging
                  ? "border-primary/60 bg-primary/5 ring-2 ring-primary/40"
                  : "",
                isOriginOfDragging ? "opacity-90" : ""
              )}
            >
              <header className="px-2 pb-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider">
                    {stage.label}
                  </h2>
                  <span
                    className={cn(
                      "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                      stage.toneClass
                    )}
                  >
                    {cards.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                  {stage.description}
                </p>
              </header>

              <div className="flex-1 space-y-2 overflow-y-auto px-1">
                {cards.length === 0 ? (
                  <div
                    className={cn(
                      "flex h-32 items-center justify-center rounded-md border border-dashed text-[11px] transition-colors",
                      isHover && !isOriginOfDragging
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "text-muted-foreground/70"
                    )}
                  >
                    {isHover && !isOriginOfDragging ? (
                      <span>Slipp her</span>
                    ) : (
                      <>
                        <Users className="mr-1.5 h-3 w-3" />
                        ingen
                      </>
                    )}
                  </div>
                ) : (
                  cards.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/deal-id", c.id);
                        setDraggingId(c.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setHoverStage(null);
                      }}
                      className={cn(
                        "cursor-grab active:cursor-grabbing",
                        draggingId === c.id && "opacity-40"
                      )}
                    >
                      <DealCard card={c} />
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
