"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Flow } from "@/lib/supabase/types";

import { createFlow, updateFlow } from "./_actions";

const PLACEHOLDERS = [
  "{{company_name}}",
  "{{contact_first_name}}",
  "{{kommune}}",
  "{{region}}",
  "{{site_url}}",
];

interface FlowDialogProps {
  flow?: Flow;
  /**
   * Custom element to render as the dialog trigger. When omitted, falls
   * back to the default "Ny flow" / "Rediger" button. The canvas nodes
   * pass their own clickable card here so clicking a node opens this
   * editor.
   */
  trigger?: ReactNode;
}

export function FlowDialog({ flow, trigger }: FlowDialogProps) {
  const isEdit = !!flow;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Store delay as days in the UI (friendlier), convert to hours on submit.
  const [name, setName] = useState(flow?.name ?? "");
  const [delayDays, setDelayDays] = useState(
    String(flow ? Math.max(1, Math.round(flow.delay_hours / 24)) : 3)
  );
  const [subject, setSubject] = useState(
    flow?.follow_up_subject ?? "Re: {{company_name}}"
  );
  const [body, setBody] = useState(flow?.follow_up_body ?? "");
  const [enabled, setEnabled] = useState(flow?.enabled ?? false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    fd.set("delay_hours", String(Math.max(1, Number(delayDays) || 1) * 24));
    fd.set("follow_up_subject", subject);
    fd.set("follow_up_body", body);
    if (enabled) fd.set("enabled", "on");

    startTransition(async () => {
      const result = isEdit
        ? await updateFlow(flow.id, fd)
        : await createFlow(fd);
      if (result.ok) {
        toast.success(result.message ?? "Lagret");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : isEdit ? (
          <Button variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5" />
            Rediger
          </Button>
        ) : (
          <Button>
            <Plus />
            Ny flow
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Rediger flow" : "Ny flow"}</DialogTitle>
            <DialogDescription>
              Sender en oppfølging når en lead ikke har svart innen valgt tid.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="flow-name" className="text-xs">
                  Navn
                </Label>
                <Input
                  id="flow-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Påminnelse etter 3 dager"
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="flow-delay" className="text-xs">
                  Vent (dager uten svar)
                </Label>
                <Input
                  id="flow-delay"
                  type="number"
                  min={1}
                  max={90}
                  step={1}
                  value={delayDays}
                  onChange={(e) => setDelayDays(e.target.value)}
                  className="w-28 tabular-nums"
                  disabled={pending}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="flow-subject" className="text-xs">
                Emne
              </Label>
              <Input
                id="flow-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={pending}
              />
              <p className="text-[11px] text-muted-foreground">
                Behold &quot;Re: &quot; så lander oppfølgingen i samme tråd.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="flow-body" className="text-xs">
                Tekst
              </Label>
              <textarea
                id="flow-body"
                rows={9}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={"Hei{{contact_first_name}},\n\nBare en kjapp påminnelse…"}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y"
                disabled={pending}
              />
              <p className="text-[11px] text-muted-foreground">
                Placeholders: {PLACEHOLDERS.join("  ")}
              </p>
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                disabled={pending}
                className="h-4 w-4 rounded border-input"
              />
              <span>Aktiv</span>
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {isEdit ? "Lagre" : "Opprett"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
