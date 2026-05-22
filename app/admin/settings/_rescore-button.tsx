"use client";

import { useTransition } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { rescoreAllLeads } from "./_actions";

export function RescoreButton({ totalLeads }: { totalLeads: number }) {
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const result = await rescoreAllLeads();
      if (result.ok) {
        toast.success(`Rescoret ${result.count} leads`);
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    });
  }

  return (
    <Button
      variant="outline"
      onClick={handle}
      disabled={pending || totalLeads === 0}
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Rescore alle leads ({totalLeads})
    </Button>
  );
}
