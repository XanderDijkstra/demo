import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Ban,
  CheckCircle2,
  CircleAlert,
  Eye,
  Inbox,
  Mail,
  Send,
} from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { OutreachEmail } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * Chronological send log. Pulls the most recent 100 outbound rows so
 * the operator can confirm the daily cron actually fired and which
 * leads were reached. Each row links to the lead detail.
 */
export async function LogTab() {
  const supabase = getSupabaseAdmin();

  const [recentRes, todayRes, cronRunsRes] = await Promise.all([
    supabase
      .from("outreach_emails")
      .select("id, org_nr, to_email, subject, status, sent_at, delivered_at, opened_at, replied_at, error_message, created_at")
      .eq("direction", "out")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("outreach_emails")
      .select("id", { count: "exact", head: true })
      .eq("direction", "out")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("audit_log")
      .select("created_at, metadata, actor")
      .eq("action", "outreach.daily.run")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const rows = (recentRes.data ?? []) as OutreachEmail[];
  const today = todayRes.count ?? 0;

  // Join company names for context.
  const orgNrs = [...new Set(rows.map((r) => r.org_nr).filter(Boolean))] as string[];
  const namesRes = orgNrs.length > 0
    ? await supabase.from("companies").select("org_nr, name").in("org_nr", orgNrs)
    : { data: [] as Array<{ org_nr: string; name: string }> };
  const nameByOrg = new Map((namesRes.data ?? []).map((c) => [c.org_nr, c.name]));

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <CardTitle className="text-base">Recent sends</CardTitle>
              <CardDescription>
                Last 100 outbound emails — including failures.
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Last 24h:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {today}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Mail}
                title="No emails sent yet"
                description="Configure the campaign in the Campaign tab and run it once to see entries here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Lead</th>
                    <th className="px-4 py-2 font-medium">Subject</th>
                    <th className="px-4 py-2 font-medium">To</th>
                    <th className="px-4 py-2 font-medium text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 align-middle">
                        <StatusCell row={row} />
                      </td>
                      <td className="px-4 py-2.5 align-middle">
                        <Link
                          href={`/admin/leads/${row.org_nr}` as never}
                          className="font-medium hover:underline"
                        >
                          {nameByOrg.get(row.org_nr) ?? row.org_nr}
                        </Link>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {row.org_nr}
                        </div>
                      </td>
                      <td
                        className="max-w-md truncate px-4 py-2.5 align-middle"
                        title={row.subject}
                      >
                        {row.subject}
                      </td>
                      <td className="px-4 py-2.5 align-middle text-muted-foreground">
                        {row.to_email}
                      </td>
                      <td
                        className="px-4 py-2.5 align-middle text-right text-xs text-muted-foreground"
                        title={row.created_at}
                      >
                        {formatDistanceToNow(new Date(row.created_at), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily cron history</CardTitle>
          <CardDescription>
            Last 10 runs of /api/cron/outreach-daily.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(cronRunsRes.data ?? []).length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Inbox}
                title="No cron runs yet"
                description="The cron is scheduled for 08:00 UTC daily, or hit Run now from the Campaign tab."
              />
            </div>
          ) : (
            <ul className="divide-y">
              {(cronRunsRes.data ?? []).map((entry, i) => {
                const meta = (entry.metadata ?? {}) as {
                  candidates?: number;
                  sent?: number;
                  skipped?: number;
                  failed?: number;
                  max_per_day?: number;
                };
                return (
                  <li
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 text-sm"
                  >
                    <Send className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">
                      {entry.actor}
                    </span>
                    <span className="ml-2 tabular-nums">
                      <span className="font-medium">{meta.sent ?? 0}</span>
                      <span className="text-muted-foreground"> sent</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {meta.skipped ?? 0} skipped · {meta.failed ?? 0} failed
                      </span>
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCell({ row }: { row: OutreachEmail }) {
  if (row.replied_at) {
    return (
      <Badge variant="success" className="gap-1">
        <Mail className="h-3 w-3" />
        replied
      </Badge>
    );
  }
  if (row.bounced_at) {
    return (
      <Badge variant="destructive" className="gap-1">
        <Ban className="h-3 w-3" />
        bounced
      </Badge>
    );
  }
  if (row.status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1" title={row.error_message ?? undefined}>
        <CircleAlert className="h-3 w-3" />
        failed
      </Badge>
    );
  }
  if (row.opened_at) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Eye className="h-3 w-3" />
        opened
      </Badge>
    );
  }
  if (row.delivered_at) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        delivered
      </Badge>
    );
  }
  if (row.sent_at) {
    return (
      <Badge variant="outline" className="gap-1">
        <Send className="h-3 w-3" />
        sent
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn("gap-1")}>
      queued
    </Badge>
  );
}
