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
import { getOne1881Config } from "@/lib/enrichment/one1881";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/db/queries";
import type { ScrapeRun, ScrapeRunStatus } from "@/lib/db/types";

import { BackfillForm } from "./_backfill-form";
import { CronSettingsForm } from "./_cron-settings-form";
import { EmailBatchForm } from "./_email-batch-form";
import { Enrich1881Form } from "./_enrich-1881-form";
import { RunNowForm } from "./_run-now-form";

// Mirrors the cron triggers in wrangler.jsonc — kept here for display only.
const BRREG_CRON_SCHEDULE = "0 6 * * *";

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
  running: "kjører",
  success: "fullført",
  failed: "feilet",
};

function formatDuration(ms: number | null): string {
  if (ms == null) return "–";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

export default async function QueuePage() {
  const db = getDb();
  const [{ data, error }, cronEnabled, cronDayOffset] = await Promise.all([
    db
      .from("scrape_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50),
    getSetting<boolean>("brreg_cron_enabled"),
    getSetting<number>("brreg_cron_day_offset"),
  ]);

  const runs: ScrapeRun[] = data ?? [];
  const one1881Configured = !!getOne1881Config();

  return (
    <>
      <Topbar
        title="Jobber"
        description="Daglig innhenting fra Brreg og kjørehistorikk"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">
              Backfill kontaktdata fra Brreg-payload
            </CardTitle>
            <CardDescription>
              Importerte leads hadde e-post=null pga. en feil i parseren
              (leste «epost» i stedet for «epostadresse»). Adressen lå hele
              tiden lagret i raw_data. Denne jobben leser den ut for alle
              eksisterende leads, fyller tomme felt (e-post, telefon, mobil,
              nettside) og re-scorer — uten å hente fra Brreg på nytt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BackfillForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daglig cron-job</CardTitle>
            <CardDescription>
              Pause eller endre måldato uten å re-deploye. Cron-en sjekker
              disse innstillingene før den kjører.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CronSettingsForm
              initialEnabled={cronEnabled ?? true}
              initialDayOffset={
                typeof cronDayOffset === "number" ? cronDayOffset : 1
              }
              schedule={BRREG_CRON_SCHEDULE}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manuell innhenting</CardTitle>
            <CardDescription>
              Start Brreg-jobben for en bestemt dato. Standard er gårsdagen
              — samme som den daglige cron-jobben (kjører kl. 06:00 UTC / 07–08
              norsk tid).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RunNowForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              1881-berikelse (kontaktdata)
            </CardTitle>
            <CardDescription>
              Slår opp leads uten e-post mot 1881 og fyller inn e-post, telefon
              og kontaktperson når det finnes — også for selskaper uten
              nettside, som nettside-skraperen ikke når. Fyller kun tomme felt,
              og re-scorer raden etterpå. Test ett oppslag først for å se hva
              1881-abonnementet faktisk returnerer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Enrich1881Form configured={one1881Configured} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hent e-poster fra nettsider</CardTitle>
            <CardDescription>
              Brreg gir sjelden ut e-post — denne jobben henter forside +
              kontaktside for hver lead uten e-post som er registrert nylig,
              ekstraherer kandidater og lagrer den beste automatisk. Re-scorer
              også raden så den får uttelling for &quot;Har e-post&quot;-vekten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmailBatchForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Siste kjøringer</CardTitle>
            <CardDescription>
              {error ? (
                <span className="text-destructive">{error.message}</span>
              ) : (
                `${runs.length} kjøringer logget`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {runs.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Activity}
                  title="Ingen kjøringer enda"
                  description="Trykk «Kjør nå» over for å starte første innhenting."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Dato</th>
                      <th className="px-4 py-2 font-medium text-right">Hentet</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Lagt til
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Hoppet over
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Varighet
                      </th>
                      <th className="px-4 py-2 font-medium">Startet av</th>
                      <th className="px-4 py-2 font-medium">Startet</th>
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
