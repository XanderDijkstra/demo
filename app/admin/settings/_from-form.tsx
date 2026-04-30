"use client";

import { useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { saveOutreachFromAddress, saveOutreachReplyTo } from "./_actions";

interface Props {
  initialFrom: string;
  initialReplyTo: string;
}

export function OutreachFromForm({ initialFrom, initialReplyTo }: Props) {
  const [pendingFrom, startFromTransition] = useTransition();
  const [pendingReplyTo, startReplyToTransition] = useTransition();

  function onSubmitFrom(formData: FormData) {
    startFromTransition(async () => {
      const result = await saveOutreachFromAddress(formData);
      if (result.ok) toast.success(result.message ?? "Lagret");
      else toast.error(result.error);
    });
  }

  function onSubmitReplyTo(formData: FormData) {
    startReplyToTransition(async () => {
      const result = await saveOutreachReplyTo(formData);
      if (result.ok) toast.success(result.message ?? "Lagret");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-5">
      <form action={onSubmitFrom} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 flex-1 min-w-72">
          <Label htmlFor="outreach-from" className="text-xs">
            Avsender (FROM)
          </Label>
          <Input
            id="outreach-from"
            name="from"
            defaultValue={initialFrom}
            placeholder="FX Media <info@kontakt.fx-media.no>"
            disabled={pendingFrom}
          />
          <p className="text-[11px] text-muted-foreground">
            Domenet i adressen må være verifisert i Resend. Subdomenet
            <code className="mx-1 font-mono">kontakt.fx-media.no</code>er
            verifisert — bruk en adresse som ender på det.
          </p>
        </div>
        <Button type="submit" disabled={pendingFrom}>
          {pendingFrom ? <Loader2 className="animate-spin" /> : <Save />}
          Lagre
        </Button>
      </form>

      <form
        action={onSubmitReplyTo}
        className="flex flex-wrap items-end gap-3 border-t pt-5"
      >
        <div className="space-y-1.5 flex-1 min-w-72">
          <Label htmlFor="outreach-reply-to" className="text-xs">
            Reply-To
          </Label>
          <Input
            id="outreach-reply-to"
            name="reply_to"
            type="email"
            defaultValue={initialReplyTo}
            placeholder="info@fx-media.no"
            disabled={pendingReplyTo}
          />
          <p className="text-[11px] text-muted-foreground">
            Adressen som mottar svar når noen svarer på en utsendelse. Bør
            være en reell, overvåket innboks.
          </p>
        </div>
        <Button type="submit" disabled={pendingReplyTo}>
          {pendingReplyTo ? <Loader2 className="animate-spin" /> : <Save />}
          Lagre
        </Button>
      </form>
    </div>
  );
}
