"use client";

import { useState, useTransition } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { replyToThread } from "./_actions";

interface Props {
  threadId: string;
  orgNr: string;
  to: string;
  lastMessageId: string | null;
  referencesChain: string[];
  subject: string;
  /** When true, show the "Send demoside" quick-fill button. Server-side
   *  flag from the lead page so we only offer it when a published demo
   *  exists for this lead. */
  hasDemoSite?: boolean;
}

/**
 * Quick-fill templates. Each template is the body text only; subject
 * stays whatever the user has typed. Placeholders are resolved on the
 * server inside replyToThread, so the operator sees them as-is.
 */
const TEMPLATES: Array<{
  id: string;
  label: string;
  requires?: "demo";
  body: string;
}> = [
  {
    id: "send-demo",
    label: "Send demoside",
    requires: "demo",
    body: [
      "Hei{{contact_first_name}},",
      "",
      "Topp at du vil ta en titt. Jeg har bygget en demoside spesifikt for {{company_name}} — den finner du her: {{site_url}}",
      "",
      "Si gjerne ifra om det er noe jeg bør justere (farger, bilder, tekst, alt er fleksibelt). Hvis du synes den treffer, kan vi sette den live på eget domene etterpå.",
      "",
      "Mvh,",
      "Xander",
      "FX Media",
    ].join("\n"),
  },
];

function defaultReplySubject(subject: string): string {
  if (/^\s*(re|sv|fwd|fw)\s*:/i.test(subject)) return subject;
  return `Re: ${subject}`;
}

export function ReplyComposer({
  threadId,
  to,
  subject,
  hasDemoSite = false,
}: Props) {
  const [subj, setSubj] = useState(defaultReplySubject(subject));
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await replyToThread(threadId, fd);
      if (result.ok) {
        toast.success(`Sendt til ${to}`);
        setBody("");
      } else {
        toast.error(result.error);
      }
    });
  }

  function applyTemplate(templateBody: string) {
    if (body.trim() && !confirm("Erstatt eksisterende tekst?")) return;
    setBody(templateBody);
  }

  const availableTemplates = TEMPLATES.filter((t) => {
    if (t.requires === "demo" && !hasDemoSite) return false;
    return true;
  });

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-[60px_1fr] items-center gap-2 text-sm">
            <span className="text-muted-foreground">Til</span>
            <span className="truncate font-medium">{to}</span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reply-subject" className="text-xs">
              Emne
            </Label>
            <Input
              id="reply-subject"
              name="subject"
              value={subj}
              onChange={(e) => setSubj(e.target.value)}
              required
              disabled={pending}
            />
          </div>

          {availableTemplates.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground">Maler:</span>
              {availableTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.body)}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-md border border-input bg-accent/40 px-2 py-1 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="reply-body" className="text-xs">
              Svar
            </Label>
            <textarea
              id="reply-body"
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              required
              disabled={pending}
              placeholder="Skriv svaret ditt…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Plassholdere: {"{{company_name}}"}, {"{{contact_first_name}}"},
              {" "}
              {"{{kommune}}"}, {"{{region}}"}, {"{{site_url}}"}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={pending || !body.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              Send svar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
