"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScoringWeights } from "@/lib/supabase/types";

import { saveScoringWeights } from "./_actions";

const FIELDS: Array<{
  key: keyof ScoringWeights;
  label: string;
  hint: string;
}> = [
  { key: "has_phone", label: "Har telefon", hint: "telefon eller mobil i Brreg" },
  { key: "org_form_as", label: "Selskapsform AS/ASA", hint: "innskutt kapital" },
  { key: "target_nace", label: "Målnæring (NACE)", hint: "matcher liste under" },
  { key: "has_website", label: "Har nettside", hint: "hjemmeside i Brreg" },
  { key: "has_real_address", label: "Reell adresse", hint: "ikke postboks" },
  { key: "freshly_founded", label: "Nystiftet", hint: "siste 7 dager" },
];

export function WeightsForm({ initial }: { initial: ScoringWeights }) {
  const [values, setValues] = useState<ScoringWeights>(initial);
  const [pending, startTransition] = useTransition();

  const total = useMemo(
    () =>
      FIELDS.reduce((sum, f) => sum + (Number(values[f.key]) || 0), 0),
    [values]
  );

  function update(key: keyof ScoringWeights, raw: string) {
    const n = Math.max(0, Math.min(100, Math.round(Number(raw) || 0)));
    setValues((prev) => ({ ...prev, [key]: n }));
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveScoringWeights(formData);
      if (result.ok) toast.success(result.message ?? "Lagret");
      else toast.error(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={f.key} className="text-xs">
              {f.label}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={f.key}
                name={f.key}
                type="number"
                min={0}
                max={100}
                step={1}
                value={values[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                className="w-24 tabular-nums"
                disabled={pending}
              />
              <span className="text-xs text-muted-foreground">{f.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Total maksscore:{" "}
          <span className="text-foreground font-medium tabular-nums">
            {total}
          </span>
          {total > 100 ? (
            <span className="ml-2 text-amber-700">
              Over 100 — score capper på 100
            </span>
          ) : null}
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Lagre vekter
        </Button>
      </div>
    </form>
  );
}
