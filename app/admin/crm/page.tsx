import { Kanban, Reply } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchKanban } from "@/lib/deals";

import { KanbanBoard } from "./_kanban-board";

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

            <p className="text-[11px] text-muted-foreground">
              Tips: dra et kort mellom kolonnene for å flytte det.
            </p>

            <KanbanBoard initial={kanban} />
          </>
        )}
      </div>
    </>
  );
}
