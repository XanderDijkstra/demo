"use client";

import { ChevronRight, Mail, MousePointerClick, Zap } from "lucide-react";

import { DEAL_STAGES } from "@/lib/deals-shared";
import type { Flow } from "@/lib/supabase/types";

import { FlowDialog } from "./_flow-dialog";

interface FlowCanvasProps {
  flow: Flow;
}

function delayLabel(hours: number): string {
  if (hours === 0) return "med en gang";
  if (hours % 24 === 0) {
    const d = hours / 24;
    return `${d} ${d === 1 ? "dag" : "dager"}`;
  }
  return `${hours} t`;
}

function stageLabel(value: string | null): string {
  return DEAL_STAGES.find((s) => s.value === value)?.label ?? value ?? "stage";
}

/** Strip placeholders + collapse whitespace so the preview reads cleanly. */
function previewLine(body: string): string {
  const first = body
    .split(/\n+/)
    .map((s) => s.trim())
    .find((s) => s.length > 0);
  if (!first) return "(tom)";
  return first.replace(/\{\{[^}]+\}\}/g, "…").slice(0, 60);
}

/**
 * Canvas-style view of a single flow. Today every flow is a 2-node chain:
 *
 *    [Trigger: no reply after X days] → [Email: follow-up]
 *
 * Both nodes are clickable — they wrap FlowDialog so a tap opens the
 * email editor. Data model is unchanged; when we add multi-step flows
 * later (email 2, wait, branch), each extra step becomes one more node
 * in this same row.
 */
export function FlowCanvas({ flow }: FlowCanvasProps) {
  const isStage = flow.trigger_type === "stage_entered";
  return (
    <div
      className="relative overflow-x-auto rounded-md border bg-muted/15 p-6"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      }}
    >
      <div className="flex min-w-fit items-stretch gap-3">
        <FlowDialog
          flow={flow}
          trigger={
            <button
              type="button"
              className="group flex w-56 cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 text-left shadow-sm transition-all hover:border-primary hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  {isStage ? (
                    <MousePointerClick className="h-3.5 w-3.5" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Trigger
                </span>
              </div>
              {isStage ? (
                <div className="space-y-0.5">
                  <div className="text-sm font-medium leading-tight">
                    Flyttet til «{stageLabel(flow.trigger_stage)}»
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sender{" "}
                    <span className="font-medium text-foreground">
                      {delayLabel(flow.delay_hours)}
                    </span>{" "}
                    etter
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <div className="text-sm font-medium leading-tight">
                    Ingen svar
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Etter{" "}
                    <span className="font-medium text-foreground">
                      {delayLabel(flow.delay_hours)}
                    </span>{" "}
                    uten reply
                  </div>
                </div>
              )}
            </button>
          }
        />

        <div className="flex items-center text-muted-foreground/60">
          <ChevronRight className="h-5 w-5" />
        </div>

        <FlowDialog
          flow={flow}
          trigger={
            <button
              type="button"
              className="group flex w-72 cursor-pointer flex-col gap-2 rounded-lg border bg-card p-3 text-left shadow-sm transition-all hover:border-primary hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Send e-post
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="truncate text-sm font-medium leading-tight">
                  {flow.follow_up_subject || "(emne mangler)"}
                </div>
                <div className="line-clamp-2 text-xs text-muted-foreground">
                  {previewLine(flow.follow_up_body)}
                </div>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Klikk for å redigere
              </div>
            </button>
          }
        />

        {/* Placeholder for the next step — kept inert until we ship
            multi-step flows. Lets the operator see the chain can grow. */}
        <div
          className="flex w-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-transparent p-3 text-[11px] text-muted-foreground/70"
          aria-disabled
        >
          <span className="text-lg leading-none">+</span>
          <span className="text-center leading-tight">
            Flere steg
            <br />
            (kommer)
          </span>
        </div>
      </div>
    </div>
  );
}
