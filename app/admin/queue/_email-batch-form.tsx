"use client";

import { useState, useTransition } from "react";
import { Loader2, Mails } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { triggerEmailBatchScrape } from "./_actions";

export function EmailBatchForm() {
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState("4");
  const [limit, setLimit] = useState("50");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await triggerEmailBatchScrape(formData);
      if (result.ok) {
        toast.success(
          `Skannet ${result.scanned} leads — lagret ${result.saved} e-poster (${result.candidates_only} med usikre kandidater, ${result.failed} feilet)`
        );
      } else {
        toast.error(`Batch failed: ${result.error}`);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="batch-days" className="text-xs">
          Siste dager
        </Label>
        <Input
          id="batch-days"
          name="days"
          type="number"
          min={1}
          max={30}
          step={1}
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-24 tabular-nums"
          disabled={pending}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="batch-limit" className="text-xs">
          Maks leads
        </Label>
        <Input
          id="batch-limit"
          name="limit"
          type="number"
          min={1}
          max={200}
          step={1}
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          className="w-24 tabular-nums"
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Skraper…
          </>
        ) : (
          <>
            <Mails />
            Scrape e-poster
          </>
        )}
      </Button>
    </form>
  );
}
