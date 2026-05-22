import Link from "next/link";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { Globe, Phone, Users } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { ScoreBadge } from "@/components/admin/score-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { Topbar } from "@/components/admin/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { fetchLeads, fetchLeadsTotals, parseLeadsQuery } from "@/lib/leads";

import { LeadsFilters } from "./_filters";
import { LeadsPagination } from "./_pagination";
import { LeadsTabs } from "./_tabs";

export const dynamic = "force-dynamic";

function formatRegistered(value: string | null): string {
  if (!value) return "–";
  try {
    return format(new Date(value), "d. MMM yyyy", { locale: nb });
  } catch {
    return value;
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = parseLeadsQuery(params);

  const [{ rows, total }, totals] = await Promise.all([
    fetchLeads(query),
    fetchLeadsTotals(),
  ]);

  return (
    <>
      <Topbar
        title="Leads"
        description="Companies pulled from Brreg, sorted by score"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <LeadsFilters />
            <LeadsTabs active={query.tab} counts={totals} />
          </CardContent>
        </Card>

        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads match"
            description={
              total === 0 && totals.all === 0
                ? "Trigger første innhenting fra Queue-siden for å se leads her."
                : "Prøv å endre filtre eller bytt til «All»-fanen."
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium w-14">Score</th>
                      <th className="px-4 py-2 font-medium">Company</th>
                      <th className="px-4 py-2 font-medium">Form</th>
                      <th className="px-4 py-2 font-medium">Industry</th>
                      <th className="px-4 py-2 font-medium">Kommune</th>
                      <th className="px-4 py-2 font-medium">Kontakt</th>
                      <th className="px-4 py-2 font-medium">Registered</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((lead) => (
                      <tr
                        key={lead.org_nr}
                        className="border-t hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 align-middle">
                          <ScoreBadge score={lead.score} />
                        </td>
                        <td className="px-4 py-2.5 align-middle min-w-64">
                          <Link
                            href={`/admin/leads/${lead.org_nr}` as never}
                            className="font-medium hover:underline truncate block"
                          >
                            {lead.name}
                          </Link>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {lead.org_nr}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-xs text-muted-foreground">
                          {lead.org_form ?? "–"}
                        </td>
                        <td
                          className="px-4 py-2.5 align-middle max-w-56"
                          title={lead.nace_description ?? undefined}
                        >
                          <div className="truncate text-xs text-muted-foreground">
                            {lead.nace_description ?? "–"}
                          </div>
                          {lead.nace_code ? (
                            <div className="text-[10px] text-muted-foreground/70 font-mono">
                              {lead.nace_code}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 align-middle text-xs">
                          {lead.kommune ? (
                            <span>{lead.kommune}</span>
                          ) : (
                            <span className="text-muted-foreground">–</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            {lead.phone || lead.mobile ? (
                              <Phone
                                className="h-3.5 w-3.5"
                                aria-label="Has phone"
                              />
                            ) : null}
                            {lead.website ? (
                              <Globe
                                className="h-3.5 w-3.5"
                                aria-label="Has website"
                              />
                            ) : null}
                            {!lead.phone && !lead.mobile && !lead.website ? (
                              <span className="text-xs">–</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle text-xs text-muted-foreground tabular-nums">
                          {formatRegistered(lead.registered_at)}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <StatusBadge status={lead.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {rows.length > 0 ? (
          <LeadsPagination
            page={query.page}
            pageSize={query.pageSize}
            total={total}
          />
        ) : null}
      </div>
    </>
  );
}
