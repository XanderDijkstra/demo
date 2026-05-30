import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { MailOpen, Send } from "lucide-react";

import { ReplyComposer } from "@/app/admin/inbox/_reply-composer";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  EmailThread,
  OutreachEmail,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

interface Props {
  orgNr: string;
  /** Lead's reply-to email — required to render the composer. */
  email: string | null;
  /** Whether a demo site exists; controls the "Send demoside" template. */
  hasDemoSite: boolean;
}

/**
 * Server component. Renders every email thread for one lead, with the
 * full message timeline inline so the operator can read and answer
 * right on the lead detail page (no jump to the inbox).
 *
 * Reply composer only appears on the most-recent thread — the older
 * ones are reference history. Each thread auto-marks itself read when
 * the lead page is opened (handled by the inbox already; here we just
 * render).
 */
export async function LeadThreads({ orgNr, email, hasDemoSite }: Props) {
  const supabase = getSupabaseAdmin();

  const { data: threadsData } = await supabase
    .from("email_threads")
    .select("*")
    .eq("org_nr", orgNr)
    .order("last_activity_at", { ascending: false });

  const threads = (threadsData ?? []) as EmailThread[];
  if (threads.length === 0) {
    return null;
  }

  const threadIds = threads.map((t) => t.id);
  const { data: messagesData } = await supabase
    .from("outreach_emails")
    .select("*")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: true });

  const messages = (messagesData ?? []) as OutreachEmail[];
  const byThread = new Map<string, OutreachEmail[]>();
  for (const m of messages) {
    if (!m.thread_id) continue;
    const arr = byThread.get(m.thread_id) ?? [];
    arr.push(m);
    byThread.set(m.thread_id, arr);
  }

  const totalUnread = threads.reduce(
    (sum, t) => sum + (t.unread_count ?? 0),
    0
  );

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">E-postsamtaler</CardTitle>
          <CardDescription>
            {threads.length} tråd{threads.length === 1 ? "" : "er"}
            {totalUnread > 0 ? ` · ${totalUnread} ulest` : ""}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {threads.map((thread, idx) => {
          const threadMessages = byThread.get(thread.id) ?? [];
          const priorIds = threadMessages
            .map((m) => m.message_id)
            .filter((v): v is string => !!v);
          const lastMessageId =
            priorIds.length > 0 ? (priorIds[priorIds.length - 1] ?? null) : null;
          const isLatest = idx === 0;

          return (
            <ThreadBlock
              key={thread.id}
              thread={thread}
              messages={threadMessages}
              isLatest={isLatest}
              email={email}
              hasDemoSite={hasDemoSite}
              orgNr={orgNr}
              lastMessageId={lastMessageId}
              priorIds={priorIds}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

function ThreadBlock({
  thread,
  messages,
  isLatest,
  email,
  hasDemoSite,
  orgNr,
  lastMessageId,
  priorIds,
}: {
  thread: EmailThread;
  messages: OutreachEmail[];
  isLatest: boolean;
  email: string | null;
  hasDemoSite: boolean;
  orgNr: string;
  lastMessageId: string | null;
  priorIds: string[];
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/15 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">
            {thread.subject ?? "(uten emne)"}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {messages.length} melding{messages.length === 1 ? "" : "er"} ·{" "}
            sist{" "}
            {formatDistanceToNow(new Date(thread.last_activity_at), {
              addSuffix: true,
              locale: nb,
            })}
          </p>
        </div>
        {(thread.unread_count ?? 0) > 0 ? (
          <Badge variant="default" className="text-[10px]">
            {thread.unread_count} ulest
          </Badge>
        ) : null}
      </div>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Ingen meldinger lastet.
          </p>
        ) : (
          messages.map((m) => <MessageCard key={m.id} message={m} />)
        )}
      </div>

      {isLatest && email ? (
        <div className="pt-2">
          <ReplyComposer
            threadId={thread.id}
            orgNr={orgNr}
            to={email}
            lastMessageId={lastMessageId}
            referencesChain={priorIds}
            subject={thread.subject ?? ""}
            hasDemoSite={hasDemoSite}
          />
        </div>
      ) : null}
    </div>
  );
}

function MessageCard({ message }: { message: OutreachEmail }) {
  const isInbound = message.direction === "in";
  const ts = message.received_at ?? message.sent_at ?? message.created_at;

  return (
    <article
      className={cn(
        "rounded-md border bg-card",
        isInbound ? "border-primary/30" : ""
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-start gap-2 min-w-0">
          <span
            className={cn(
              "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              isInbound
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isInbound ? (
              <MailOpen className="h-3 w-3" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium leading-tight">
              {isInbound
                ? message.from_name || message.from_email
                : `Du → ${message.to_email}`}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              {format(new Date(ts), "d. MMM yyyy, HH:mm", { locale: nb })}
            </div>
          </div>
        </div>
      </header>
      <div className="px-3 py-2.5 text-sm">
        {message.body_text || message.body ? (
          <pre className="whitespace-pre-wrap font-sans leading-relaxed">
            {message.body_text || message.body}
          </pre>
        ) : message.body_html ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: message.body_html }}
          />
        ) : (
          <p className="text-xs italic text-muted-foreground">
            (Ingen innhold på denne meldingen.)
          </p>
        )}
      </div>
    </article>
  );
}

