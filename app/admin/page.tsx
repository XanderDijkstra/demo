import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Activity,
  ArrowRight,
  Building2,
  Database,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { DailyIntakeChart } from "@/components/admin/daily-intake-chart";
import { EmptyState } from "@/components/admin/empty-state";
import { ScoreBadge } from "@/components/admin/score-badge";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchDashboardStats } from "@/lib/dashboard";
import { checkSupabaseHealth } from "@/lib/supabase/queries";
import { cn, formatCompanyName } from "@/lib/utils";

export const dynamic = "force-dynamic";

function trendOf(current: number, previous: number) {
  if (previous === 0) {
    return current === 0
      ? { delta: 0, direction: "flat" as const }
      : { delta: 100, direction: "up" as const };
  }
  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return { delta: 0, direction: "flat" as const };
  return { delta, direction: delta > 0 ? ("up" as const) : ("down" as const) };
}

export default async function DashboardPage() {
  const [health, stats] = await Promise.all([
    checkSupabaseHealth(),
    fetchDashboardStats(),
  ]);

  const trend = trendOf(stats.weekLeads, stats.weekLeadsPrev);
  const lastRun = stats.lastRun;
  const maxBucket = Math.max(
    1,
    ...stats.scoreDistribution.map((b) => b.count)
  );
  const maxNace = Math.max(1, ...stats.topNace.map((n) => n.count));

  return (
    <>
      <Topbar
        title="Dashboard"
        description="Daily overview of leads from Brreg"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!health.ok ? (
          <Card className="border-destructive/40">
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <Database className="h-4 w-4 text-destructive shrink-0" />
              <div className="space-y-0.5">
                <div className="font-medium text-destructive">
                  Supabase ikke tilkoblet
                </div>
                <div className="text-xs text-muted-foreground">
                  {health.error}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* KPI strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Leads this week"
            value={stats.weekLeads}
            hint={`${stats.weekLeadsPrev} forrige 7 dager`}
            trend={trend}
          />
          <StatCard
            icon={Sparkles}
            label="High quality (≥70)"
            value={stats.weekHighQuality}
            hint="This week"
          />
          <StatCard
            icon={TrendingUp}
            label="Average score this week"
            value={stats.weekAvgScore}
            hint="0–100"
          />
          <StatCard
            icon={Building2}
            label="Totalt i database"
            value={stats.totalLeads}
            hint="All-time"
          />
        </div>

        {/* Daily intake + cron health */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Daglig innhenting</CardTitle>
              <CardDescription>Siste 14 dager</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.dailyIntake.every((d) => d.count === 0) ? (
                <EmptyState
                  icon={LayoutDashboard}
                  title="Ingen data enda"
                  description="Trigger første innhenting fra Queue-siden, så fylles grafen opp."
                />
              ) : (
                <DailyIntakeChart data={stats.dailyIntake} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cron-status</CardTitle>
              <CardDescription>Siste Brreg-run</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {lastRun ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        lastRun.status === "success"
                          ? "success"
                          : lastRun.status === "running"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {lastRun.status === "success"
                        ? "done"
                        : lastRun.status === "running"
                          ? "running"
                          : "failed"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Kjørt</span>
                    <span className="text-xs">
                      {formatDistanceToNow(new Date(lastRun.started_at), {
                        addSuffix: true,
                        locale: nb,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Måldato</span>
                    <span className="font-mono text-xs">
                      {lastRun.target_date}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fetched</span>
                    <span className="tabular-nums">
                      {lastRun.fetched_count}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lagt til</span>
                    <span className="tabular-nums font-medium">
                      {lastRun.inserted_count}
                    </span>
                  </div>
                  {lastRun.error_message ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                      {lastRun.error_message}
                    </div>
                  ) : null}
                  <Link
                    href="/admin/queue"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Gå til Queue
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-muted-foreground">
                    No runs yet.
                  </p>
                  <Link
                    href="/admin/queue"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Trigger første innhenting
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Score distribution + top NACE */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score-fordeling</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.scoreDistribution.every((b) => b.count === 0) ? (
                <p className="text-sm text-muted-foreground">
                  No leads this week enda.
                </p>
              ) : (
                stats.scoreDistribution.map((b) => (
                  <div key={b.bucket} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium tabular-nums">{b.bucket}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {b.count}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          b.bucket === "80–100" && "bg-primary",
                          b.bucket === "60–79" && "bg-primary/70",
                          b.bucket === "40–59" && "bg-amber-400",
                          b.bucket === "20–39" && "bg-muted-foreground/40",
                          b.bucket === "0–19" && "bg-muted-foreground/20"
                        )}
                        style={{
                          width: `${(b.count / maxBucket) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Topp næringer</CardTitle>
              <CardDescription>This week (NACE)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.topNace.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ingen næringsdata enda.
                </p>
              ) : (
                stats.topNace.map((n) => (
                  <div key={n.code} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span
                        className="truncate"
                        title={`${n.code} · ${n.description}`}
                      >
                        <span className="font-mono text-muted-foreground mr-2">
                          {n.code}
                        </span>
                        {n.description}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {n.count}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${(n.count / maxNace) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top leads */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Top leads this week</CardTitle>
              <CardDescription>
                Sorted by score · this week's top 10
              </CardDescription>
            </div>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Se alle
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topLeads.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Activity}
                  title="No leads this week"
                  description="Trigger en run fra Queue-siden, eller vent til morgendagens cron."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium w-14">Score</th>
                      <th className="px-4 py-2 font-medium">Company</th>
                      <th className="px-4 py-2 font-medium">Industry</th>
                      <th className="px-4 py-2 font-medium">Kommune</th>
                      <th className="px-4 py-2 font-medium">Registered</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topLeads.map((lead) => (
                      <tr
                        key={lead.org_nr}
                        className="border-t hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 align-middle">
                          <ScoreBadge score={lead.score} />
                        </td>
                        <td className="px-4 py-2.5 align-middle min-w-56">
                          <Link
                            href={`/admin/leads/${lead.org_nr}` as never}
                            className="font-medium hover:underline truncate block"
                          >
                            {formatCompanyName(lead.name)}
                          </Link>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {lead.org_nr}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2.5 align-middle text-xs text-muted-foreground max-w-56"
                          title={lead.nace_description ?? undefined}
                        >
                          <div className="truncate">
                            {lead.nace_description ?? "–"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-xs">
                          {lead.kommune ?? (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-xs text-muted-foreground tabular-nums">
                          {lead.registered_at
                            ? format(new Date(lead.registered_at), "d. MMM", {
                                locale: nb,
                              })
                            : "–"}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <StatusBadge status={lead.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
