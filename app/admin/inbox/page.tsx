import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Inbox as InboxIcon, Mail, Star } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInboundDomain } from "@/lib/email/threads";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  EmailThread,
  OutreachEmail,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ThreadRow extends EmailThread {
  company_name: string | null;
  preview: string | null;
  last_from: string | null;
}

async function fetchThreads(): Promise<ThreadRow[]> {
  const supabase = getSupabaseAdmin();
  const { data: threads, error } = await supabase
    .from("email_threads")
    .select("*")
    .eq("status", "open")
    .order("last_activity_at", { ascending: false })
    .limit(100);

  if (error || !threads) return [];

  // Pull company names + last message preview per thread.
  const orgNrs = [...new Set(threads.map((t) => t.org_nr).filter(Boolean))] as string[];
  const threadIds = threads.map((t) => t.id);

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

  // Take the first (most-recent) message per thread.
  const lastByThread = new Map<
    string,
    { direction: string; from: string | null; preview: string | null }
  >();
  for (const m of messagesRes.data ?? []) {
    if (!m.thread_id || lastByThread.has(m.thread_id)) continue;
    const previewSource = m.body_text ?? m.body ?? "";
    lastByThread.set(m.thread_id, {
      direction: m.direction,
      from: m.from_email ?? null,
      preview: previewSource.replace(/\s+/g, " ").slice(0, 140),
    });
  }

  return threads.map((t) => {
    const last = lastByThread.get(t.id);
    return {
      ...(t as EmailThread),
      company_name: t.org_nr ? nameByOrg.get(t.org_nr) ?? null : null,
      preview: last?.preview ?? null,
      last_from: last?.from ?? null,
    };
  });
}

export default async function InboxPage() {
  const [threads, inboundDomain] = await Promise.all([
    fetchThreads(),
    getInboundDomain(),
  ]);

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);

  return (
    <>
      <Topbar
        title="Inbox"
        description="Lead replies and outbound conversations in one place"
        actions={
          totalUnread > 0 ? (
            <Badge variant="default" className="gap-1 text-[10px]">
              <Mail className="h-3 w-3" />
              {totalUnread} unread
            </Badge>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!inboundDomain ? (
          <Card className="border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="text-base">
                Inbound domain not configured
              </CardTitle>
              <CardDescription>
                To receive replies, set a subdomain (e.g.{" "}
                <code className="font-mono">reply.fx-media.no</code>) with MX
                records pointing at Resend's inbound servers, then save it
                under{" "}
                <Link
                  href="/admin/settings"
                  className="text-primary hover:underline"
                >
                  Settings → Inbound domain
                </Link>
                . Until then, outbound mails still go out and webhook events
                land, but replies fall back to the operator's personal Reply-To
                address.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            {threads.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={InboxIcon}
                  title="Inbox is empty"
                  description="When a lead replies to one of your outbound emails it shows up here."
                />
              </div>
            ) : (
              <ul className="divide-y">
                {threads.map((t) => {
                  const unread = (t.unread_count ?? 0) > 0;
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/admin/inbox/${t.id}` as never}
                        className={cn(
                          "flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-accent/50",
                          unread && "bg-muted/30"
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
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={cn(
                                  "truncate text-sm",
                                  unread
                                    ? "font-semibold text-foreground"
                                    : "font-medium text-foreground/90"
                                )}
                              >
                                {t.company_name ??
                                  t.last_from ??
                                  "Unknown sender"}
                              </span>
                              {unread ? (
                                <Badge
                                  variant="default"
                                  className="h-4 min-w-4 px-1 text-[10px] tabular-nums"
                                >
                                  {t.unread_count}
                                </Badge>
                              ) : null}
                            </div>
                            <span
                              className="shrink-0 text-[11px] text-muted-foreground"
                              title={t.last_activity_at}
                            >
                              {formatDistanceToNow(new Date(t.last_activity_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "mt-0.5 truncate text-sm",
                              unread
                                ? "text-foreground/85"
                                : "text-muted-foreground"
                            )}
                          >
                            {t.subject ?? "(no subject)"}
                          </div>
                          {t.preview ? (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {t.preview}
                            </p>
                          ) : null}
                        </div>
                        <ArrowRight className="mt-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground">
          <Star className="-mt-0.5 mr-1 inline h-3 w-3" />
          Snooze, archive, search and three-pane view are coming. For now the
          inbox shows all open threads sorted by latest activity.
        </p>
      </div>
    </>
  );
}

// Re-export the row type so the detail page can import it without
// reaching back into the database utils.
export type { OutreachEmail };
