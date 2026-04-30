"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CompanyStatus } from "@/lib/supabase/types";

import { updateLeadStatus } from "./_actions";

interface Props {
  orgNr: string;
  current: CompanyStatus;
}

const TRANSITIONS: Array<{
  status: CompanyStatus;
  label: string;
  variant: "default" | "outline" | "destructive" | "secondary";
}> = [
  { status: "reviewed", label: "Marker som vurdert", variant: "outline" },
  { status: "qualified", label: "Kvalifiser", variant: "default" },
  { status: "rejected", label: "Avvis", variant: "destructive" },
];

export function StatusActions({ orgNr, current }: Props) {
  const [pending, startTransition] = useTransition();

  function handle(status: CompanyStatus) {
    startTransition(async () => {
      const result = await updateLeadStatus(orgNr, status);
      if (result.ok) {
        toast.success(`Status oppdatert: ${status}`);
      } else {
        toast.error(`Kunne ikke oppdatere: ${result.error}`);
      }
    });
  }

  return (
    <div className={cn("flex flex-wrap gap-2", pending && "opacity-70")}>
      {TRANSITIONS.map((t) => (
        <Button
          key={t.status}
          variant={t.variant}
          size="sm"
          disabled={pending || current === t.status}
          onClick={() => handle(t.status)}
        >
          {pending ? <Loader2 className="animate-spin" /> : null}
          {t.label}
        </Button>
      ))}
    </div>
  );
}
