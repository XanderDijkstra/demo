"use client";

import { useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveOutreachFromAddress } from "./_actions";

export function OutreachFromForm({ initial }: { initial: string }) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveOutreachFromAddress(formData);
      if (result.ok) toast.success(result.message ?? "Lagret");
      else toast.error(result.error);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5 flex-1 min-w-72">
        <Label htmlFor="outreach-from" className="text-xs">
          Avsenderadresse
        </Label>
        <Input
          id="outreach-from"
          name="from"
          defaultValue={initial}
          placeholder="FX Media <noreply@vekst-systemet.no>"
          disabled={pending}
        />
        <p className="text-[11px] text-muted-foreground">
          Domenet må være verifisert i Resend (SPF + DKIM) før utsendelser
          slipper gjennom.
        </p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        Lagre
      </Button>
    </form>
  );
}
