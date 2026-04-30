"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { sendLeadEmail } from "./_actions";

interface Props {
  orgNr: string;
  to: string | null;
  fromAddress: string;
  companyName: string;
  kommune: string | null;
}

const DEFAULT_SUBJECT = "Hei {{company_name}} — gratulerer med oppstart";

const DEFAULT_BODY = `Hei!

Jeg så at {{company_name}} nettopp ble registrert{{kommune}} — gratulerer med oppstart.

Vi i FX Media hjelper små selskaper med å komme raskt i gang med nettside og synlighet, og jeg tenkte å ta en kort prat om dere har planer for det.

Har du 10 minutter denne uken?

Vennlig hilsen,
Xander
FX Media`;

export function SendEmailButton({
  orgNr,
  to,
  fromAddress,
  companyName,
  kommune,
}: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(
    DEFAULT_BODY.replace(
      "{{kommune}}",
      kommune ? ` i ${kommune}` : ""
    )
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!to) return;

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendLeadEmail(orgNr, fd);
      if (result.ok) {
        toast.success(`E-post sendt til ${to}`);
        setOpen(false);
      } else {
        toast.error(`Send feilet: ${result.error}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!to}>
          <Send />
          Send e-post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Send e-post til {companyName}</DialogTitle>
            <DialogDescription>
              Variabler:{" "}
              <code className="text-[11px]">{"{{company_name}}"}</code>{" "}
              <code className="text-[11px]">{"{{kommune}}"}</code>{" "}
              <code className="text-[11px]">{"{{org_nr}}"}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-[60px_1fr] items-center gap-2 text-sm">
              <span className="text-muted-foreground">Fra</span>
              <span className="truncate">{fromAddress}</span>
            </div>
            <div className="grid grid-cols-[60px_1fr] items-center gap-2 text-sm">
              <span className="text-muted-foreground">Til</span>
              <span>{to ?? <em className="text-muted-foreground">ingen</em>}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs">
                Emne
              </Label>
              <Input
                id="subject"
                name="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={pending}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="body" className="text-xs">
                Innhold
              </Label>
              <textarea
                id="body"
                name="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                required
                disabled={pending}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={pending || !to}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              Send nå
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
