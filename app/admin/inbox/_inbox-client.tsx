"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowUpRight,
  Inbox as InboxIcon,
  Loader2,
  MailOpen,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  Company,
  EmailThread,
  OutreachEmail,
} from "@/lib/supabase/types";
import { cn, formatCompanyName } from "@/lib/utils";

import { markThreadRead } from "./_actions";
import { ReplyComposer } from "./_reply-composer";

export type ViewId = "inbox" | "sent" | "all";

export interface ThreadRow extends EmailThread {
  company_name: string | null;
  preview: string | null;
  last_from: string | null;
  last_direction: "in" | "out" | null;
}

interface ThreadDetail {
  thread: EmailThread;
  messages: OutreachEmail[];
  lead: Company | null;
}

interface InboxClientProps {
  threads: ThreadRow[];
  view: ViewId;
  initialThreadId: string | null;
}

/**
 * Two-pane inbox driven by client state. The server-rendered route only
 * fetches the thread list once per visit; clicking between emails fires
 * a single JSON request to /api/inbox/threads/[id] and re-renders just
 * the right pane.
 *
 * The previously-loaded thread payloads stay in an in-memory cache, so
 * bouncing between threads is instant after the first hit.
 */
export function InboxClient({
  threads,
  view,
  initialThreadId,
}: InboxClientProps) {
  const [localThreads, setLocalThreads] = useState<ThreadRow[]>(threads);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialThreadId ?? threads[0]?.id ?? null
  );
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, ThreadDetail>>(new Map());

  // Keep local list in sync with server-provided threads when the view changes.
  useEffect(() => {
    setLocalThreads(threads);
    if (!selectedId || !threads.some((t) => t.id === selectedId)) {
      setSelectedId(threads[0]?.id ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    // Reflect selection in the URL without a router push (no server roundtrip).
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", view);
      url.searchParams.set("thread", selectedId);
      window.history.replaceState(null, "", url.toString());
    }

    const cached = cacheRef.current.get(selectedId);
    if (cached) {
      setDetail(cached);
      setError(null);
      maybeMarkRead(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/inbox/threads/${selectedId}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `HTTP ${res.status}`);
        }
        return (await res.json()) as ThreadDetail;
      })
      .then((data) => {
        if (cancelled) return;
        cacheRef.current.set(selectedId, data);
        setDetail(data);
        maybeMarkRead(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, view]);

  // Fire-and-forget unread clear. Updates local list state so the badge
  // disappears without a route refresh.
  const maybeMarkRead = useCallback((data: ThreadDetail) => {
    if (data.thread.unread_count <= 0) return;
    void markThreadRead(data.thread.id).catch(() => {
      // ignore — non-critical UI side-effect
    });
    setLocalThreads((prev) =>
      prev.map((t) =>
        t.id === data.thread.id ? { ...t, unread_count: 0 } : t
      )
    );
  }, []);

  function onSelect(id: string) {
    setSelectedId(id);
  }

  return (
    <div className="flex flex-1 min-h-0">
      <aside className="hidden w-[360px] shrink-0 flex-col overflow-y-auto border-r bg-card md:flex">
        {localThreads.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div className="space-y-2">
              <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <InboxIcon className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">
                {view === "inbox"
                  ? "Inbox is empty"
                  : view === "sent"
                    ? "Nothing sent yet"
                    : "No threads"}
              </div>
              <p className="text-xs text-muted-foreground">
                {view === "inbox"
                  ? "Lead replies show up here."
                  : view === "sent"
                    ? "Outbound emails group into threads."
                    : null}
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {localThreads.map((t) => (
              <ThreadListItem
                key={t.id}
                thread={t}
                active={t.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </aside>

      <main className="flex flex-1 flex-col overflow-y-auto bg-muted/20">
        {!selectedId ? (
          <EmptyPane />
        ) : error ? (
          <div className="flex flex-1 items-center justify-center p-12 text-center text-sm text-destructive">
            Kunne ikke laste tråd: {error}
          </div>
        ) : detail ? (
          <ThreadView
            thread={detail.thread}
            messages={detail.messages}
            lead={detail.lead}
            isStale={loading}
          />
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Laster…
          </div>
        ) : (
          <EmptyPane />
        )}
      </main>
    </div>
  );
}

function EmptyPane() {
  return (
    <div className="flex flex-1 items-center justify-center p-12 text-center">
      <div className="space-y-2 text-muted-foreground">
        <MessageSquare className="mx-auto h-8 w-8 opacity-60" />
        <p className="text-sm">Pick a thread on the left.</p>
      </div>
    </div>
  );
}

function ThreadListItem({
  thread,
  active,
  onSelect,
}: {
  thread: ThreadRow;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const unread = (thread.unread_count ?? 0) > 0;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(thread.id)}
        className={cn(
          "flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors",
          active
            ? "bg-primary/10 hover:bg-primary/15"
            : "hover:bg-accent/50",
          unread && !active && "bg-muted/30"
        )}
      >
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            unread ? "bg-primary" : "bg-transparent"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                unread
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground/90"
              )}
            >
              {thread.company_name ?? thread.last_from ?? "Unknown sender"}
            </span>
            <span
              className="shrink-0 text-[10px] text-muted-foreground"
              title={thread.last_activity_at}
            >
              {formatDistanceToNow(new Date(thread.last_activity_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div
            className={cn(
              "mt-0.5 flex items-center gap-1.5 truncate text-xs",
              unread ? "text-foreground/85" : "text-muted-foreground"
            )}
          >
            {thread.last_direction === "in" ? (
              <MailOpen className="h-3 w-3 shrink-0" />
            ) : thread.last_direction === "out" ? (
              <Send className="h-3 w-3 shrink-0" />
            ) : null}
            <span className="truncate">{thread.subject ?? "(no subject)"}</span>
          </div>
          {thread.preview ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
              {thread.preview}
            </p>
          ) : null}
        </div>
      </button>
    </li>
  );
}

function ThreadView({
  thread,
  messages,
  lead,
  isStale,
}: {
  thread: EmailThread;
  messages: OutreachEmail[];
  lead: Company | null;
  isStale: boolean;
}) {
  // Optimistic optimistic — when we're swapping in a fresh fetch we keep
  // the previous content rendered (snappier feel) and only dim it slightly.
  const [, startTransition] = useTransition();
  void startTransition;

  return (
    <div className={cn("flex flex-1 flex-col", isStale && "opacity-70")}>
      <header className="border-b bg-card px-6 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold leading-tight">
              {thread.subject ?? "(no subject)"}
            </h2>
            {lead ? (
              <Link
                href={`/admin/leads/${lead.org_nr}` as never}
                className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {formatCompanyName(lead.name)}
                <span className="font-mono">· {lead.org_nr}</span>
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">
                Unlinked thread
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] capitalize">
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => <MessageCard key={m.id} message={m} />)
        )}

        {lead?.email ? (
          <ReplyComposer
            threadId={thread.id}
            orgNr={lead.org_nr}
            to={lead.email}
            lastMessageId={messages[messages.length - 1]?.message_id ?? null}
            referencesChain={messages
              .map((m) => m.message_id)
              .filter((v): v is string => !!v)}
            subject={thread.subject ?? ""}
          />
        ) : (
          <div className="rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground">
            {lead
              ? "Add an email address on the lead to reply from here."
              : "Link this thread to a lead to reply."}
          </div>
        )}
      </div>

      {lead ? (
        <footer className="border-t bg-card px-6 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {lead.contact_name ? (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3 w-3" />
                {lead.contact_name}
              </span>
            ) : null}
            {(lead.mobile || lead.phone) ? (
              <a
                href={`tel:${lead.mobile || lead.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {lead.mobile || lead.phone}
              </a>
            ) : null}
            <span>
              Score{" "}
              <span className="font-medium tabular-nums text-foreground">
                {lead.score}
              </span>
            </span>
            <span>
              Status{" "}
              <span className="font-medium text-foreground">{lead.status}</span>
            </span>
            <Link
              href={`/admin/leads/${lead.org_nr}` as never}
              className="ml-auto text-primary hover:underline"
            >
              Open lead →
            </Link>
          </div>
        </footer>
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
        "rounded-lg border bg-card",
        isInbound ? "border-primary/20" : ""
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <span
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs",
              isInbound
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isInbound ? (
              <MailOpen className="h-3.5 w-3.5" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight">
              {isInbound
                ? message.from_name || message.from_email
                : `You → ${message.to_email}`}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {format(new Date(ts), "d MMM yyyy, HH:mm")}
            </div>
          </div>
        </div>
        <MessageStatusBadge message={message} />
      </header>
      <div className="px-4 py-3 text-sm">
        {message.body_text || message.body ? (
          <pre className="whitespace-pre-wrap font-sans leading-relaxed">
            {message.body_text || message.body}
          </pre>
        ) : message.body_html ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: message.body_html }}
          />
        ) : message.direction === "in" && message.resend_id ? (
          <div className="space-y-2.5 rounded-md border border-dashed bg-muted/40 p-3 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Resend doesn&apos;t expose inbound email bodies through their
              API yet — only metadata reaches the webhook. The full message
              is readable in their dashboard:
            </p>
            <a
              href={`https://resend.com/emails/${message.resend_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              View body in Resend
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            (No body content on this message.)
          </p>
        )}
      </div>
    </article>
  );
}

function MessageStatusBadge({ message }: { message: OutreachEmail }) {
  if (message.direction === "in") {
    return (
      <Badge variant="default" className="text-[10px]">
        received
      </Badge>
    );
  }
  const variant =
    message.status === "delivered"
      ? "success"
      : message.status === "bounced" ||
          message.status === "failed" ||
          message.status === "complained"
        ? "destructive"
        : "secondary";
  return (
    <Badge variant={variant} className="text-[10px]">
      {message.status}
    </Badge>
  );
}
