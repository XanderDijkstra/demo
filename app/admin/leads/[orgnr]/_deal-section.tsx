"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  CircleDot,
  Handshake,
  Loader2,
  PlusCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEAL_STAGES, dealStageMeta } from "@/lib/deals-shared";
import type { Deal, DealStage } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import {
  createDealAction,
  updateDealFieldsAction,
  updateDealStageAction,
} from "./_actions";

interface Props {
  orgNr: string;
  deal: Deal | null;
}

export function DealSection({ orgNr, deal }: Props) {
  const [stagePending, startStageTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [createPending, startCreateTransition] = useTransition();

  const [valueStr, setValueStr] = useState(
    deal?.value_nok != null ? String(deal.value_nok) : ""
  );
  const [notes, setNotes] = useState(deal?.notes ?? "");

  if (!deal) {
    return (
      <div className="flex items-start gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Handshake className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            No active deal for this lead yet. One is created automatically
            when you mark an email as replied — or create one manually
            here if the conversation started elsewhere (phone, meeting,
            etc.).
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={createPending}
            onClick={() =>
              startCreateTransition(async () => {
                const result = await createDealAction(orgNr);
                if (result.ok) toast.success("Deal created");
                else toast.error(result.error);
              })
            }
          >
            {createPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <PlusCircle />
            )}
            Create deal manuelt
          </Button>
        </div>
      </div>
    );
  }

  const meta = dealStageMeta(deal.stage);
  const isClosed = deal.stage === "won" || deal.stage === "lost";

  function handleStageChange(stage: DealStage) {
    if (stage === deal!.stage) return;
    let lostReason: string | undefined;
    if (stage === "lost") {
      lostReason =
        window.prompt("What's the reason the deal was lost? (optional)") ??
        undefined;
    }
    startStageTransition(async () => {
      const result = await updateDealStageAction(
        orgNr,
        deal!.id,
        stage,
        lostReason
      );
      if (result.ok) {
        toast.success(`Stage endret til ${dealStageMeta(stage).label}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleSave() {
    const value = valueStr.trim()
      ? Math.max(0, Math.floor(Number(valueStr)) || 0)
      : null;
    startSaveTransition(async () => {
      const result = await updateDealFieldsAction(orgNr, deal!.id, {
        value_nok: value,
        notes: notes.trim() || null,
      });
      if (result.ok) toast.success("Deal updated");
      else toast.error(result.error);
    });
  }

  const stageChangedAgo = formatDistanceToNow(new Date(deal.stage_changed_at), {
    addSuffix: true,
    locale: nb,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-md",
            meta.toneClass
          )}
        >
          <CircleDot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-48">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                meta.toneClass
              )}
            >
              {meta.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {stageChangedAgo}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {meta.description}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_180px] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="deal-stage" className="text-xs">
            Stage
          </Label>
          <select
            id="deal-stage"
            value={deal.stage}
            disabled={stagePending}
            onChange={(e) => handleStageChange(e.target.value as DealStage)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DEAL_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-value" className="text-xs">
            Value (NOK)
          </Label>
          <Input
            id="deal-value"
            type="number"
            min={0}
            step={500}
            placeholder="0"
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
            disabled={savePending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="deal-notes" className="text-xs">
          Notes
        </Label>
        <textarea
          id="deal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Hva ble sagt? Hva skjer videre?"
          disabled={savePending}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] text-muted-foreground">
          {isClosed && deal.stage === "lost" && deal.lost_reason ? (
            <>Lost-grunn: {deal.lost_reason}</>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={savePending}
        >
          {savePending ? <Loader2 className="animate-spin" /> : <Save />}
          Save
        </Button>
      </div>
    </div>
  );
}
