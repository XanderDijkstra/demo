"use client";

import { useTransition } from "react";
import { Loader2, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { deleteFlow, runFlowsNow, toggleFlow } from "./_actions";

export function FlowToggle({
  id,
  enabled,
}: {
  id: string;
  enabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  function flip() {
    startTransition(async () => {
      const r = await toggleFlow(id, !enabled);
      if (r.ok) toast.success(r.message ?? "Oppdatert");
      else toast.error(r.error);
    });
  }
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={enabled}
        onChange={flip}
        disabled={pending}
        className="h-4 w-4 rounded border-input"
      />
      <span className={enabled ? "text-foreground" : "text-muted-foreground"}>
        {enabled ? "Aktiv" : "Pauset"}
      </span>
    </label>
  );
}

export function DeleteFlowButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    if (!confirm("Slette denne flowen? Loggen beholdes ikke.")) return;
    startTransition(async () => {
      const r = await deleteFlow(id);
      if (r.ok) toast.success(r.message ?? "Slettet");
      else toast.error(r.error);
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export function RunNowButton() {
  const [pending, startTransition] = useTransition();
  function run() {
    startTransition(async () => {
      const r = await runFlowsNow();
      if (r.ok) toast.success(r.message ?? "Ferdig");
      else toast.error(r.error);
    });
  }
  return (
    <Button variant="outline" onClick={run} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Play />}
      Kjør nå
    </Button>
  );
}
