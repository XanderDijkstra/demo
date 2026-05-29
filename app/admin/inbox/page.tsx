import Link from "next/link";
import { Mail } from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import { getInboundDomain } from "@/lib/email/threads";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { EmailThread } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

import { InboxClient, type ThreadRow, type ViewId } from "./_inbox-client";

export const dynamic = "force-dynamic";

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

async function fetchThreadList(view: ViewId): Promise<ThreadRow[]> {
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

      <InboxClient
        threads={threads}
        view={view}
        initialThreadId={selectedThreadId ?? null}
      />
    </>
  );
}
