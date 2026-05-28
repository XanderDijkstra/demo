import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowUpRight,
  Inbox as InboxIcon,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import { getInboundDomain } from "@/lib/email/threads";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  Company,
  EmailThread,
  OutreachEmail,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { markThreadRead } from "./_actions";
import { ReplyComposer } from "./_reply-composer";

export const dynamic = "force-dynamic";

type ViewId = "inbox" | "sent" | "all";

const VIEWS: Array<{ id: ViewId; label: string }> = [
  { id: "inbox", label: "Inbox" },
  { id: "sent", label: "Sent" },
  { id: "all", label: "All" },
];

function parseView(value: string | string[] | undefined): ViewId {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "sent" || v === "all" || v === "inbox" ? v : "inbox";
}

interface RouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface ThreadRow extends EmailThread {
  company_name: string | null;
  preview: string | null;
  last_from: string | null;
  last_direction: "in" | "out" | null;
}

async function fetchThreadList(
  view: ViewId
): Promise<ThreadRow[]> {
  const supabase = getSupabaseAdmin();

  const { data: threads, error } = await supabase
    .from("email_threads")
    .select("*")
    .eq("status", "open")
    .order("last_activity_at", { ascending: false })
    .limit(200);

  if (error || !threads || threads.length === 0) return [];

  const threadIds = threads.map((t) => t.id);
  const orgNrs = [
    ...new Set(threads.map((t) => t.org_nr).filter(Boolean)),
  ] as string[];

  const [companiesRes, messagesRes] = await Promise.all([
    orgNrs.length > 0
      ? supabase.from("companies").select("org_nr, name").in("org_nr", orgNrs)
      : Promise.resolve({ data: [] as Array<{ org_nr: string; name: string }> }),
    supabase
      .from("outreach_emails")
      .select("thread_id, direction, from_email, body_text, body, created_at")
      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
  ]);

  const nameByOrg = new Map(
    (companiesRes.data ?? []).map((c) => [c.org_nr, c.name])
  );

  const lastByThread = new Map<
    string,
    {
      direction: "in" | "out";
      from: string | null;
      preview: string | null;
    }
  >();
  for (const m of messagesRes.data ?? []) {
    if (!m.thread_id || lastByThread.has(m.thread_id)) continue;
    lastByThread.set(m.thread_id, {
      direction: m.direction as "in" | "out",
      from: m.from_email ?? null,
      preview: (m.body_text ?? m.body ?? "")
        .replace(/\s+/g, " ")
        .slice(0, 140),
    });
  }

  const enriched: ThreadRow[] = threads.map((t) => {
    const last = lastByThread.get(t.id);
    return {
      ...(t as EmailThread),
      company_name: t.org_nr ? nameByOrg.get(t.org_nr) ?? null : null,
      preview: last?.preview ?? null,
      last_from: last?.from ?? null,
      last_direction: last?.direction ?? null,
    };
  });

  if (view === "inbox") {
    return enriched.filter(
      (t) => (t.unread_count ?? 0) > 0 || t.last_direction === "in"
    );
  }
  if (view === "sent") {
    return enriched.filter(
      (t) => t.last_direction === "out" && (t.unread_count ?? 0) === 0
    );
  }
  return enriched;
}

async function fetchThreadDetail(threadId: string): Promise<{
  thread: EmailThread;
  messages: OutreachEmail[];
  lead: Company | null;
} | null> {
  const supabase = getSupabaseAdmin();
  const [threadRes, messagesRes] = await Promise.all([
    supabase
      .from("email_threads")
      .select("*")
      .eq("id", threadId)
      .maybeSingle(),
    supabase
      .from("outreach_emails")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true }),
  ]);

  const thread = threadRes.data as EmailThread | null;
  if (!thread) return null;

  const messages = (messagesRes.data ?? []) as OutreachEmail[];

  let lead: Company | null = null;
  if (thread.org_nr) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("org_nr", thread.org_nr)
      .maybeSingle();
    lead = (data as Company | null) ?? null;
  }

  return { thread, messages, lead };
}

export default async function InboxPage({ searchParams }: RouteProps) {
  const params = await searchParams;
  const view = parseView(params.view);
  const selectedThreadId = Array.isArray(params.thread)
    ? params.thread[0]
    : params.thread;

  const [threads, inboundDomain] = await Promise.all([
    fetchThreadList(view),
    getInboundDomain(),
  ]);

  // Auto-pick first thread when none selected so the right pane isn't blank.
  const activeThreadId =
    selectedThreadId ?? (threads[0]?.id ?? null);

  const detail = activeThreadId
    ? await fetchThreadDetail(activeThreadId)
    : null;

  // Clear unread on open. Server-side side-effect, no UI control.
  // Wrapped so a transient DB blip can never crash the page render.
  if (detail && detail.thread.unread_count > 0) {
    try {
      await markThreadRead(detail.thread.id);
    } catch {
      // ignore
    }
  }

  const totalUnread = threads.reduce(
    (sum, t) => sum + (t.unread_count ?? 0),
    0
  );

  return (
    <>
      <Topbar
        title="Inbox"
        description="Lead replies and outbound conversations"
        actions={
          totalUnread > 0 ? (
            <Badge variant="default" className="gap-1 text-[10px]">
              <Mail className="h-3 w-3" />
              {totalUnread} unread
            </Badge>
          ) : null
        }
      />

      {!inboundDomain ? (
        <div className="border-b bg-amber-50 px-6 py-2.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Inbound domain not configured. Set{" "}
          <code className="font-mono">resend_inbound_domain</code> in settings
          so replies route back to the inbox.
        </div>
      ) : null}

      {/* View tabs */}
      <div className="border-b bg-card">
        <div className="flex items-center gap-1 px-4">
          {VIEWS.map((v) => {
            const active = v.id === view;
            return (
              <Link
                key={v.id}
                href={`/admin/inbox?view=${v.id}` as never}
                className={cn(
                  "relative -mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm transition-colors",
                  active
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {v.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two-pane body */}
      <div className="flex flex-1 min-h-0">
        {/* Thread list */}
        <aside className="hidden w-[360px] shrink-0 flex-col overflow-y-auto border-r bg-card md:flex">
          {threads.length === 0 ? (
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
              {threads.map((t) => (
                <ThreadListItem
                  key={t.id}
                  thread={t}
                  active={t.id === activeThreadId}
                  view={view}
                />
              ))}
            </ul>
          )}
        </aside>

        {/* Active thread */}
        <main className="flex flex-1 flex-col overflow-y-auto bg-muted/20">
          {detail ? (
            <ThreadView
              thread={detail.thread}
              messages={detail.messages}
              lead={detail.lead}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-12 text-center">
              <div className="space-y-2 text-muted-foreground">
                <MessageSquare className="mx-auto h-8 w-8 opacity-60" />
                <p className="text-sm">Pick a thread on the left.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ─── Thread list item ──────────────────────────────────────────────────────

function ThreadListItem({
  thread,
  active,
  view,
}: {
  thread: ThreadRow;
  active: boolean;
  view: ViewId;
}) {
  const unread = (thread.unread_count ?? 0) > 0;
  return (
    <li>
      <Link
        href={`/admin/inbox?view=${view}&thread=${thread.id}` as never}
        scroll={false}
        className={cn(
          "flex items-start gap-2.5 px-4 py-3 transition-colors",
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
      </Link>
    </li>
  );
}

// ─── Thread detail pane ───────────────────────────────────────────────────

function ThreadView({
  thread,
  messages,
  lead,
}: {
  thread: EmailThread;
  messages: OutreachEmail[];
  lead: Company | null;
}) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Thread header */}
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
                {lead.name}
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

      {/* Messages */}
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
            lastMessageId={
              messages[messages.length - 1]?.message_id ?? null
            }
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

      {/* Lead quick-info footer */}
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
              API yet — only metadata reaches the webhook. The full
              message is readable in their dashboard:
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
            <p className="text-[11px] text-muted-foreground/80">
              Replies sent from this inbox still go through cleanly — only
              reading the lead&apos;s body needs the dashboard.
            </p>
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
