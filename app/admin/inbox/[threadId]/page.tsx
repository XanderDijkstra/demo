import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowUpRight,
  Mail,
  MailOpen,
  Phone,
  User,
} from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  Company,
  EmailThread,
  OutreachEmail,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { ReplyComposer } from "./_reply-composer";
import { markThreadRead } from "./_actions";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ threadId: string }>;
}

export default async function ThreadPage({ params }: RouteProps) {
  const { threadId } = await params;

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
  if (!thread) notFound();

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

  // Mark the thread read on open. Server action — no UI for it.
  if (thread.unread_count > 0) {
    await markThreadRead(threadId);
  }

  return (
    <>
      <Topbar
        title={thread.subject ?? "(no subject)"}
        description={
          lead ? `${lead.name} · org.nr ${lead.org_nr}` : "Unlinked thread"
        }
        actions={
          <Link
            href="/admin/inbox"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Inbox
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Messages */}
          <div className="space-y-3 min-w-0">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No messages in this thread yet.
                </CardContent>
              </Card>
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
                referencesChain={collectReferences(messages)}
                subject={thread.subject ?? ""}
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">
                  {lead
                    ? "Add an email address on the lead to reply from here."
                    : "Link this thread to a lead to reply."}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lead context */}
          <aside className="space-y-4">
            {lead ? (
              <LeadCard lead={lead} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Unlinked</CardTitle>
                  <CardDescription>
                    No lead is associated with this thread.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thread</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between gap-2">
                  <span>Started</span>
                  <span>{format(new Date(thread.created_at), "d MMM yyyy")}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Messages</span>
                  <span className="tabular-nums">{messages.length}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Status</span>
                  <Badge variant="outline" className="capitalize">
                    {thread.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

function collectReferences(messages: OutreachEmail[]): string[] {
  // Build the References chain to put on the next outbound reply: all
  // prior Message-IDs in chronological order.
  return messages
    .map((m) => m.message_id)
    .filter((v): v is string => !!v);
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
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              isInbound
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isInbound ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium leading-tight">
              {isInbound
                ? message.from_name || message.from_email
                : `You → ${message.to_email}`}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {isInbound
                ? `to ${message.to_email}`
                : `from ${message.from_email}`}
              {" · "}
              {format(new Date(ts), "d MMM yyyy, HH:mm")}
            </div>
          </div>
        </div>
        <MessageStatusBadge message={message} />
      </header>
      <div className="px-5 py-4 text-sm leading-relaxed">
        <pre className="whitespace-pre-wrap font-sans">
          {message.body_text ?? message.body ?? ""}
        </pre>
        {message.attachments && message.attachments.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.attachments.map((a, i) => (
              <a
                key={i}
                href={a.storage_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2.5 py-1 text-xs hover:bg-muted"
              >
                {a.filename}
                <span className="text-muted-foreground">
                  · {formatBytes(a.size)}
                </span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MessageStatusBadge({ message }: { message: OutreachEmail }) {
  if (message.direction === "in") {
    return <Badge variant="default">received</Badge>;
  }
  const variant =
    message.status === "delivered"
      ? "success"
      : message.status === "bounced" || message.status === "failed" || message.status === "complained"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{message.status}</Badge>;
}

function LeadCard({ lead }: { lead: Company }) {
  return (
    <Card>
      <CardHeader className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{lead.name}</CardTitle>
          <Link
            href={`/admin/leads/${lead.org_nr}` as never}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Open lead
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <CardDescription className="font-mono text-[11px]">
          {lead.org_nr}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {lead.contact_name ? (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{lead.contact_name}</span>
          </div>
        ) : null}
        {lead.email ? (
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <a
              href={`mailto:${lead.email}`}
              className="truncate hover:underline"
            >
              {lead.email}
            </a>
          </div>
        ) : null}
        {(lead.mobile || lead.phone) ? (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <a
              href={`tel:${lead.mobile || lead.phone}`}
              className="hover:underline"
            >
              {lead.mobile || lead.phone}
            </a>
          </div>
        ) : null}
        <Separator />
        <div className="text-xs text-muted-foreground">
          Score{" "}
          <span className="font-medium tabular-nums text-foreground">
            {lead.score}
          </span>
          {" · "}
          status{" "}
          <span className="font-medium text-foreground">{lead.status}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
