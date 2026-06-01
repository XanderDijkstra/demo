"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { sendTelegramTest } from "./_actions";

export function TelegramTestButton() {
  const [pending, startTransition] = useTransition();
  function run() {
    startTransition(async () => {
      const result = await sendTelegramTest();
      if (result.ok) toast.success(result.message ?? "Sendt");
      else toast.error(result.error);
    });
  }
  return (
    <Button variant="outline" onClick={run} disabled={pending} size="sm">
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      Send testmelding
    </Button>
  );
}
