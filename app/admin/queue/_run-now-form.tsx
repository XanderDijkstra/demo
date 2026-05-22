"use client";

import { useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { triggerScrapeNow } from "./_actions";

function defaultDate() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().slice(0, 10);
}

export function RunNowForm() {
  const [pending, startTransition] = useTransition();
  const [date, setDate] = useState<string>(defaultDate());

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await triggerScrapeNow(formData);
      if (result.status === "success") {
        toast.success(
          `Fetched ${result.fetched} selskaper, lagt til ${result.inserted} nye`
        );
      } else {
        toast.error(`Inhenting failed: ${result.error ?? "ukjent feil"}`);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="run-date" className="text-xs">
          Måldato
        </Label>
        <Input
          id="run-date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={defaultDate()}
          className="w-44"
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Kjører…
          </>
        ) : (
          <>
            <Play />
            Run now
          </>
        )}
      </Button>
    </form>
  );
}
