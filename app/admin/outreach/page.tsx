import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  Ban,
  Eye,
  Inbox,
  Mail,
  MousePointerClick,
  Reply,
  Send,
  ShieldOff,
  TrendingUp,
} from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { OutreachDailyChart } from "@/components/admin/outreach-daily-chart";
import { StatCard } from "@/components/admin/stat-card";
import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fetchOutreachStats,
  pct,
  trend,
  type WindowDays,
} from "@/lib/outreach-stats";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const WINDOW_OPTIONS: WindowDays[] = [7, 14, 30, 90];

function parseWindow(value: string | string[] | undefined): WindowDays {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (WINDOW_OPTIONS as number[]).includes(n) ? (n as WindowDays) : 30;
}

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const windowDays = parseWindow(params.window);
  const stats = await fetchOutreachStats(windowDays);

  const { kpis } = stats;
  const sentTrend = trend(kpis.sent, kpis.prevSent);
  const deliveredTrend = trend(kpis.delivered, kpis.prevDelivered);
  const openedTrend = trend(kpis.opened, kpis.prevOpened);
  const repliedTrend = trend(kpis.replied, kpis.prevReplied);

  const funnel = [
    {
      label: "Sendt",
      count: kpis.sent,
      pct: 100,
      color: "bg-primary",
    },
    {
      label: "Levert",
      count: kpis.delivered,
      pct: pct(kpis.delivered, kpis.sent),
      color: "bg-primary/85",
    },
    {
      label: "Åpnet",
      count: kpis.opened,
      pct: pct(kpis.opened, kpis.delivered),
      color: "bg-primary/70",
    },
    {
      label: "Klikket",
      count: kpis.clicked,
      pct: pct(kpis.clicked, kpis.opened),
      color: "bg-primary/55",
    },
    {
      label: "Besvart",
      count: kpis.replied,
      pct: pct(kpis.replied, kpis.sent),
      color: "bg-emerald-500",
    },
  ];

  return (
    <>
      <Topbar
        title="Utsendelser"
        description="E-post-statistikk og leveringskvalitet"
        actions={
          <div className="hidden items-center gap-1 rounded-md border bg-background p-0.5 text-xs sm:inline-flex">
            {WINDOW_OPTIONS.map((w) => {
              const active = w === windowDays;
              return (
                <Link
                  key={w}
                  href={`/admin/outreach?window=${w}`}
                  className={cn(
                    "rounded px-2 py-1 transition-colors",
                    active
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {w}d
                </Link>
              );
            })}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI strip */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Send}
            label="Sendt"
            value={kpis.sent}
            hint={`Siste ${windowDays} dager`}
            trend={sentTrend}
          />
          <StatCard
            icon={Mail}
            label="Leveringsrate"
            value={`${pct(kpis.delivered, kpis.sent)}%`}
            hint={`${kpis.delivered} av ${kpis.sent} levert`}
            trend={deliveredTrend}
          />
          <StatCard
            icon={Eye}
            label="Åpnings­rate"
            value={`${pct(kpis.opened, kpis.delivered)}%`}
            hint={`${kpis.opened} av ${kpis.delivered} åpnet`}
            trend={openedTrend}
          />
          <StatCard
            icon={Reply}
            label="Svarrate"
            value={`${pct(kpis.replied, kpis.sent)}%`}
            hint={`${kpis.replied} besvart`}
            trend={repliedTrend}
          />
        </div>

        {/* Daily chart + funnel */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Daglig utsendelse + svar
              </CardTitle>
              <CardDescription>
                Siste {windowDays} dager
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.daily.every((d) => d.sent === 0 && d.replied === 0) ? (
                <EmptyState
                  icon={Inbox}
                  title="Ingen utsendelser i perioden"
                  description="Send fra en lead-detaljside for å se aktivitet her."
                />
              ) : (
                <OutreachDailyChart data={stats.daily} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Konverterings­trakt
              </CardTitle>
              <CardDescription>
                Fra utsendt til svar — {windowDays} dager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {funnel.map((stage) => (
                <div key={stage.label} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      <span className="text-foreground font-medium">
                        {stage.count}
                      </span>
                      <span className="ml-1.5">· {stage.pct}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        stage.color
                      )}
                      style={{ width: `${Math.max(2, stage.pct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Health + suppression breakdown */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Leveringskvalitet</CardTitle>
              <CardDescription>Problemer i perioden</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <HealthRow
                icon={Ban}
                label="Bounce"
                count={kpis.bounced}
                ofTotal={kpis.sent}
                tone={kpis.bounced > 0 ? "warn" : "ok"}
              />
              <HealthRow
                icon={ShieldOff}
                label="Spam-klage"
                count={kpis.complained}
                ofTotal={kpis.sent}
                tone={kpis.complained > 0 ? "warn" : "ok"}
              />
              <HealthRow
                icon={MousePointerClick}
                label="Klikk"
                count={kpis.clicked}
                ofTotal={kpis.delivered}
                tone="ok"
              />
              <HealthRow
                icon={Inbox}
                label="Feilet (ikke sendt)"
                count={kpis.failed}
                ofTotal={kpis.sent + kpis.failed}
                tone={kpis.failed > 0 ? "warn" : "ok"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suppression list</CardTitle>
              <CardDescription>
                Adresser som ikke kan kontaktes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">
                {stats.suppressions.total}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <SuppressionPill
                  label="bounce"
                  count={stats.suppressions.byReason.bounced}
                  tone="destructive"
                />
                <SuppressionPill
                  label="klage"
                  count={stats.suppressions.byReason.complained}
                  tone="destructive"
                />
                <SuppressionPill
                  label="manuell"
                  count={stats.suppressions.byReason.manual}
                />
                <SuppressionPill
                  label="avmeldt"
                  count={stats.suppressions.byReason.unsubscribed}
                />
              </div>
              <Link
                href="/admin/settings"
                className="mt-4 inline-flex text-xs text-primary hover:underline"
              >
                Administrer i Innstillinger →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Top engaged leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mest engasjerte leads</CardTitle>
            <CardDescription>
              Topp 8 — sortert etter svar × 5 + klikk × 2 + åpning
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stats.topEngaged.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Inbox}
                  title="Ingen aktivitet enda"
                  description="Når leads åpner eller svarer, dukker de opp her."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium">Selskap</th>
                      <th className="px-4 py-2 font-medium text-right">Sendt</th>
                      <th className="px-4 py-2 font-medium text-right">Åpnet</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Klikket
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Besvart
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topEngaged.map((row) => (
                      <tr
                        key={row.org_nr}
                        className="border-t hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 align-middle">
                          <Link
                            href={`/admin/leads/${row.org_nr}` as never}
                            className="font-medium hover:underline"
                          >
                            {row.name ?? row.org_nr}
                          </Link>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {row.org_nr}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right tabular-nums">
                          {row.sent}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right tabular-nums">
                          {row.opened}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right tabular-nums">
                          {row.clicked}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-right tabular-nums">
                          {row.replied > 0 ? (
                            <span className="text-emerald-600 font-medium">
                              {row.replied}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Siste 20 utsendelser</CardTitle>
            <CardDescription>Alle perioder</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recent.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Mail}
                  title="Ingen utsendelser enda"
                  description="Send fra en lead-detaljside for å komme i gang."
                />
              </div>
            ) : (
              <ul className="divide-y">
                {stats.recent.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/30 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Link
                      href={`/admin/leads/${entry.org_nr}` as never}
                      className="min-w-0 flex-1 truncate font-medium hover:underline"
                      title={entry.subject}
                    >
                      {entry.subject}
                    </Link>
                    <span className="hidden text-xs text-muted-foreground sm:inline truncate max-w-40">
                      → {entry.to_email}
                    </span>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: nb,
                      })}
                    </span>
                    <Badge
                      variant={
                        entry.replied_at
                          ? "success"
                          : entry.status === "delivered"
                            ? "secondary"
                            : entry.status === "bounced" ||
                              entry.status === "complained" ||
                              entry.status === "failed"
                              ? "destructive"
                              : "outline"
                      }
                    >
                      {entry.replied_at ? "besvart" : entry.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function HealthRow({
  icon: Icon,
  label,
  count,
  ofTotal,
  tone,
}: {
  icon: typeof Ban;
  label: string;
  count: number;
  ofTotal: number;
  tone: "ok" | "warn";
}) {
  const ratio = pct(count, ofTotal);
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            tone === "warn" ? "text-amber-600" : "text-muted-foreground"
          )}
        />
        <span>{label}</span>
      </div>
      <div className="text-right">
        <span className="font-medium tabular-nums">{count}</span>
        <span className="ml-2 text-xs text-muted-foreground tabular-nums">
          {ratio}%
        </span>
      </div>
    </div>
  );
}

function SuppressionPill({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone?: "destructive";
}) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-input px-2.5 py-0.5 text-[11px] text-muted-foreground">
        {label}{" "}
        <span className="font-medium tabular-nums text-foreground/50">
          {count}
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        tone === "destructive"
          ? "bg-destructive/15 text-destructive"
          : "bg-muted text-foreground"
      )}
    >
      {label}{" "}
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
