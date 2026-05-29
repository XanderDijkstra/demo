"use client";

import { useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { triggerBackfillFromRaw } from "./_actions";

export function BackfillForm() {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await triggerBackfillFromRaw();
      if (result.ok) {
        toast.success(
          `Skannet ${result.scanned} — fylte e-post ${result.emailsFilled}, telefon ${result.phonesFilled}, nettside ${result.websitesFilled} (oppdatert ${result.updated})`
        );
      } else {
        toast.error(`Backfill feilet: ${result.error}`);
      }
    });
  }

  return (
    <Button onClick={run} disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Kjører…
        </>
      ) : (
        <>
          <Wand2 />
          Backfill kontaktdata
        </>
      )}
    </Button>
  );
}
