import Link from "next/link";
import { ArrowDown, Users } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { ScoreBadge } from "@/components/admin/score-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDailyFunnel } from "@/lib/outreach/funnel";
import { formatCompanyName } from "@/lib/utils";

/**
 * "Hvem blir e-postet i dag?" — the daily-cron filter pipeline laid out
 * stage-by-stage with the actual surviving candidates listed below.
 * Lets the operator see at a glance which gate is killing the pool when
 * no emails go out.
 */
export async function CandidatesTab() {
  const funnel = await getDailyFunnel();
  const { stages, candidates, qualifiedTotal, config } = funnel;
  const capped = qualifiedTotal > config.maxPerDay;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dagens funnel</CardTitle>
          <CardDescription>
            Filter-pipelinen den daglige cron-en kjører gjennom akkurat nå.
            Tallet til høyre er hvor mange leads som er igjen etter hvert
            trinn.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {stages.map((stage, idx) => {
              const prev = idx > 0 ? stages[idx - 1]!.count : stage.count;
              const dropped = Math.max(0, prev - stage.count);
              const isLast = idx === stages.length - 1;
              return (
                <li
                  key={stage.key}
                  className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="truncate">{stage.label}</span>
                    {idx > 0 && dropped > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <ArrowDown className="h-3 w-3" />
                        {dropped}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={
                      "tabular-nums font-medium " +
                      (isLast
                        ? stage.count === 0
                          ? "text-destructive"
                          : "text-emerald-600 dark:text-emerald-400"
                        : "text-foreground")
                    }
                  >
                    {stage.count}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="border-t bg-muted/30 px-6 py-3 text-xs text-muted-foreground">
            Tak per dag: <span className="font-medium text-foreground">{config.maxPerDay}</span>
            {capped ? (
              <>
                {" "}· {qualifiedTotal} kvalifiserte i dag, men kun de{" "}
                <span className="font-medium text-foreground">
                  {config.maxPerDay}
                </span>{" "}
                høyest-scorende sendes.
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            I dagens sending ({candidates.length})
          </CardTitle>
          <CardDescription>
            Disse leadsene treffer alle kriteriene og er det cron-en vil sende
            til ved neste run. Sortert etter score, deretter
            registreringsdato.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {candidates.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Ingen kandidater i dag"
                description="Sjekk funnelen over for å se hvilket trinn som filtrerer alle bort. Vanligvis: dedup på allerede-e-postet eller for høyt score-krav."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium w-14">Score</th>
                    <th className="px-4 py-2 font-medium">Bedrift</th>
                    <th className="px-4 py-2 font-medium">E-post</th>
                    <th className="px-4 py-2 font-medium">Næring</th>
                    <th className="px-4 py-2 font-medium">Kommune</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.org_nr} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-2.5 align-middle">
                        <ScoreBadge score={c.score} />
                      </td>
                      <td className="px-4 py-2.5 align-middle min-w-56">
                        <Link
                          href={`/admin/leads/${c.org_nr}` as never}
                          className="font-medium hover:underline truncate block"
                        >
                          {formatCompanyName(c.name)}
                        </Link>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {c.org_nr}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-xs">
                        {c.email ?? (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </td>
                      <td
                        className="px-4 py-2.5 align-middle max-w-56 text-xs text-muted-foreground"
                        title={c.nace_description ?? undefined}
                      >
                        <div className="truncate">
                          {c.nace_description ?? "–"}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 align-middle text-xs">
                        {c.kommune ?? (
                          <span className="text-muted-foreground">–</span>
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
    </div>
  );
}
