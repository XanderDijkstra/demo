"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
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
}

function defaultReplySubject(subject: string): string {
  if (/^\s*(re|sv|fwd|fw)\s*:/i.test(subject)) return subject;
  return `Re: ${subject}`;
}

export function ReplyComposer({ threadId, to, subject }: Props) {
  const [subj, setSubj] = useState(defaultReplySubject(subject));
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await replyToThread(threadId, fd);
      if (result.ok) {
        toast.success(`Reply sent to ${to}`);
        setBody("");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-[60px_1fr] items-center gap-2 text-sm">
            <span className="text-muted-foreground">To</span>
            <span className="truncate font-medium">{to}</span>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reply-subject" className="text-xs">
              Subject
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
          <div className="space-y-1.5">
            <Label htmlFor="reply-body" className="text-xs">
              Reply
            </Label>
            <textarea
              id="reply-body"
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              required
              disabled={pending}
              placeholder="Type your reply…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Placeholders: {"{{company_name}}"}, {"{{contact_first_name}}"},
              {" "}
              {"{{kommune}}"}, {"{{region}}"}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={pending || !body.trim()}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              Send reply
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
