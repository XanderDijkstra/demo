"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Ban, Loader2, Send } from "lucide-react";
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
  replyTo: string;
  companyName: string;
  kommune: string | null;
  suppressedReason: string | null;
  previousSendCount: number;
  /** Public URL of the published demo site, or null if none is live. */
  siteUrl: string | null;
}

const DEFAULT_SUBJECT = "Lagde en demo til {{company_name}}";

const DEFAULT_BODY = `Hei!

Lagde en kjapp demoside til {{company_name}} basert på det jeg så.

Se den her: {{site_url}}

Hvis det treffer, ta en lyd. Hvis ikke, ingen stress.

— Xander
FX Media`;

export function SendEmailButton({
  orgNr,
  to,
  fromAddress,
  replyTo,
  companyName,
  kommune: _kommune,
  suppressedReason,
  previousSendCount,
  siteUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!to) return;

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendLeadEmail(orgNr, fd);
      if (result.ok) {
        toast.success(`Email sent til ${to}`);
        setOpen(false);
      } else {
        toast.error(`Send failed: ${result.error}`);
      }
    });
  }

  const isBlocked = !to || !!suppressedReason;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={isBlocked}
          variant={suppressedReason ? "outline" : "default"}
          title={
            suppressedReason
              ? `Suppressed (${suppressedReason}) — cannot send`
              : !to
                ? "Add an email first"
                : undefined
          }
        >
          {suppressedReason ? <Ban /> : <Send />}
          Send email
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Send email til {companyName}</DialogTitle>
            <DialogDescription>
              Variables:{" "}
              <code className="text-[11px]">{"{{company_name}}"}</code>{" "}
              <code className="text-[11px]">{"{{contact_name}}"}</code>{" "}
              <code className="text-[11px]">{"{{contact_first_name}}"}</code>{" "}
              <code className="text-[11px]">{"{{kommune}}"}</code>{" "}
              <code className="text-[11px]">{"{{org_nr}}"}</code>{" "}
              <code className="text-[11px]">{"{{site_url}}"}</code>
              {siteUrl ? (
                <span className="block mt-1 text-[11px] text-muted-foreground">
                  site_url → <span className="font-mono">{siteUrl}</span>
                </span>
              ) : (
                <span className="block mt-1 text-[11px] text-amber-700">
                  site_url → empty (no demo site published)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {previousSendCount > 0 ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  You've already sent {previousSendCount}{" "}
                  {previousSendCount === 1 ? "email" : "emails"} to this
                  lead. Make sure a follow-up is wanted before sending
                  again.
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="truncate">{fromAddress}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-sm">
              <span className="text-muted-foreground">Reply-To</span>
              <span className="truncate">{replyTo}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-sm">
              <span className="text-muted-foreground">To</span>
              <span>{to ?? <em className="text-muted-foreground">none</em>}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs">
                Subject
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
                Body
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
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !to}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              Send now
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
