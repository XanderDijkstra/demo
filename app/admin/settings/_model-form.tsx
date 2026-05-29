"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { saveClaudeModel } from "./_actions";

const MODELS: Array<{ value: string; label: string; hint: string }> = [
  {
    value: "claude-opus-4-8",
    label: "Opus 4.8",
    hint: "Beste kvalitet — dyrest. Best for polerte maler.",
  },
  {
    value: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    hint: "Balansert kvalitet og pris.",
  },
  {
    value: "claude-haiku-4-5",
    label: "Haiku 4.5",
    hint: "Raskest og billigst (~0,002 $ per side).",
  },
];

export function ModelForm({ initial }: { initial: string }) {
  const known = MODELS.some((m) => m.value === initial);
  const [model, setModel] = useState(known ? initial : "claude-haiku-4-5");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveClaudeModel(formData);
      if (result.ok) toast.success(result.message ?? "Lagret");
      else toast.error(result.error);
    });
  }

  const active = MODELS.find((m) => m.value === model);

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="claude-model" className="text-xs">
          Modell for sidegenerering
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="claude-model"
            name="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={pending}
            className="flex h-9 w-56 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} — {m.value}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Lagre modell
          </Button>
        </div>
        {active ? (
          <p className="text-[11px] text-muted-foreground">{active.hint}</p>
        ) : null}
      </div>
    </form>
  );
}
