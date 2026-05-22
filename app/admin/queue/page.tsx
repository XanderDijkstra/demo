import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Activity } from "lucide-react";

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
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { ScrapeRun, ScrapeRunStatus } from "@/lib/supabase/types";

import { RunNowForm } from "./_run-now-form";

export const dynamic = "force-dynamic";

const statusVariant: Record<
  ScrapeRunStatus,
  "default" | "success" | "destructive" | "warning"
> = {
  running: "warning",
  success: "success",
  failed: "destructive",
};

const statusLabel: Record<ScrapeRunStatus, string> = {
  running: "running",
  success: "done",
  failed: "failed",
};

function formatDuration(ms: number | null): string {
  if (ms == null) return "–";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

export default async function QueuePage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("scrape_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);

  const runs: ScrapeRun[] = data ?? [];

  return (
    <>
      <Topbar
        title="Queue"
        description="Daily Brreg ingestion and run history"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manuell innhenting</CardTitle>
            <CardDescription>
              Trigger Brreg-jobben for en spesifikk dato. Default er gyearssdagen
              — samme som den daglige cron job (runs at 06:00 UTC / 07–08
              Oslo).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RunNowForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Siste runs</CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-destructive">{error.message}</span>
              ) : (
                `${runs.length} runs logget`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {runs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Activity}
                  title="No runs yet"
                  description="Press 'Run now' above to start the first ingestion."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Dato</th>
                      <th className="px-4 py-2 font-medium text-right">Fetched</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Lagt til
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Skipet over
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Duration
                      </th>
                      <th className="px-4 py-2 font-medium">Trigger</th>
                      <th className="px-4 py-2 font-medium">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr
                        key={run.id}
                        className="border-t hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2">
                          <Badge variant={statusVariant[run.status]}>
                            {statusLabel[run.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {run.target_date}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {run.fetched_count}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums font-medium text-foreground">
                          {run.inserted_count}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                          {run.skipped_count}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                          {formatDuration(run.duration_ms)}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {run.triggered_by}
                        </td>
                        <td
                          className="px-4 py-2 text-muted-foreground"
                          title={run.started_at}
                        >
                          {formatDistanceToNow(new Date(run.started_at), {
                            addSuffix: true,
                            locale: nb,
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
      </div>
    </>
  );
}
