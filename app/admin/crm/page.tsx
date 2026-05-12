import { Kanban, Reply, Users } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEAL_STAGES, fetchKanban } from "@/lib/deals";
import { cn } from "@/lib/utils";

import { DealCard } from "./_card";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const kanban = await fetchKanban();

  const totalActive =
    kanban.replied.length + kanban.in_conversation.length + kanban.proposal_sent.length;
  const totalAll =
    totalActive + kanban.won.length + kanban.lost.length;

  return (
    <>
      <Topbar
        title="CRM"
        description="Aktive samtaler — fra første svar til lukket avtale"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {totalAll === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Reply className="h-4 w-4" />
                Ingen aktive avtaler enda
              </CardTitle>
              <CardDescription>
                CRM-kort opprettes automatisk når du markerer en e-post som
                besvart på lead-detaljsiden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Kanban}
                title="Tomt salgsbord"
                description="Når en lead svarer, marker e-posten som «Besvart» — så dukker leadet opp her i «Ny svar»."
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-md border bg-card px-3 py-1.5">
                <span className="text-muted-foreground">Aktive: </span>
                <span className="font-semibold tabular-nums">{totalActive}</span>
              </div>
              <div className="rounded-md border bg-card px-3 py-1.5">
                <span className="text-muted-foreground">Vunnet (30d): </span>
                <span className="font-semibold tabular-nums text-emerald-700">
                  {kanban.won.length}
                </span>
              </div>
              <div className="rounded-md border bg-card px-3 py-1.5">
                <span className="text-muted-foreground">Tapt (30d): </span>
                <span className="font-semibold tabular-nums text-rose-700">
                  {kanban.lost.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 pb-4">
              <div className="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4">
                {DEAL_STAGES.map((stage) => {
                  const cards = kanban[stage.value];
                  return (
                    <section
                      key={stage.value}
                      className="flex min-h-[400px] flex-col rounded-lg border bg-muted/30 p-2"
                    >
                      <header className="px-2 pb-2 pt-1">
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-xs font-semibold uppercase tracking-wider">
                            {stage.label}
                          </h2>
                          <span
                            className={cn(
                              "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                              stage.toneClass
                            )}
                          >
                            {cards.length}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                          {stage.description}
                        </p>
                      </header>

                      <div className="flex-1 space-y-2 overflow-y-auto px-1">
                        {cards.length === 0 ? (
                          <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-[11px] text-muted-foreground/70">
                            <Users className="mr-1.5 h-3 w-3" />
                            ingen
                          </div>
                        ) : (
                          cards.map((c) => <DealCard key={c.id} card={c} />)
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
