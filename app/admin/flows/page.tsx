import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Mail, Workflow } from "lucide-react";

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
import type { Flow, FlowEnrollment, FlowRun } from "@/lib/supabase/types";
import { formatCompanyName } from "@/lib/utils";

import { FlowCanvas } from "./_flow-canvas";
import { DeleteFlowButton, FlowToggle, RunNowButton } from "./_flow-controls";
import { FlowDialog } from "./_flow-dialog";

export const dynamic = "force-dynamic";

interface ActivityRow {
  id: string;
  flow_id: string;
  org_nr: string;
  status: string;
  at: string;
  error_message: string | null;
  company_name: string | null;
  flow_name: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  sent: "Sendt",
  skipped_replied: "Svarte",
  skipped_suppressed: "Suppressed",
  skipped_no_email: "Ingen e-post",
  failed: "Feilet",
  pending: "Planlagt",
  cancelled: "Avbrutt",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "destructive" | "warning" | "secondary" | "outline"
> = {
  sent: "success",
  skipped_replied: "secondary",
  skipped_suppressed: "warning",
  skipped_no_email: "outline",
  failed: "destructive",
  pending: "default",
  cancelled: "outline",
};

export default async function FlowsPage() {
  const supabase = getSupabaseAdmin();

  const [{ data: flowsData }, { data: runsData }, { data: enrData }] =
    await Promise.all([
      supabase
        .from("flows")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("flow_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("flow_enrollments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const flows = (flowsData ?? []) as Flow[];
  const runs = (runsData ?? []) as FlowRun[];
  const enrollments = (enrData ?? []) as FlowEnrollment[];

  // Unified activity from both sources (no_reply → flow_runs,
  // stage_entered → flow_enrollments).
  const activity: ActivityRow[] = [
    ...runs.map((r) => ({
      id: r.id,
      flow_id: r.flow_id,
      org_nr: r.org_nr,
      status: r.status,
      at: r.created_at,
      error_message: r.error_message,
      company_name: null,
      flow_name: null,
    })),
    ...enrollments.map((e) => ({
      id: e.id,
      flow_id: e.flow_id,
      org_nr: e.org_nr,
      status: e.status,
      at: e.processed_at ?? e.created_at,
      error_message: e.error_message,
      company_name: null,
      flow_name: null,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  // Per-flow sent counts (both sources).
  const sentByFlow = new Map<string, number>();
  for (const a of activity) {
    if (a.status === "sent") {
      sentByFlow.set(a.flow_id, (sentByFlow.get(a.flow_id) ?? 0) + 1);
    }
  }

  // Enrich with company + flow names.
  const orgNrs = [...new Set(activity.map((a) => a.org_nr))];
  const flowNameById = new Map(flows.map((f) => [f.id, f.name]));
  const nameByOrg = new Map<string, string>();
  if (orgNrs.length > 0) {
    const { data: companies } = await supabase
      .from("companies")
      .select("org_nr, name")
      .in("org_nr", orgNrs);
    for (const c of companies ?? []) nameByOrg.set(c.org_nr, c.name);
  }
  const runRows: ActivityRow[] = activity.slice(0, 60).map((a) => ({
    ...a,
    company_name: nameByOrg.get(a.org_nr) ?? null,
    flow_name: flowNameById.get(a.flow_id) ?? null,
  }));

  return (
    <>
      <Topbar
        title="Flows"
        description="Automatiske oppfølginger — ved manglende svar eller når en lead flyttes i CRM"
        actions={
          <div className="flex items-center gap-2">
            <RunNowButton />
            <FlowDialog />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {flows.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="Ingen flows enda"
            description="Lag en flow som sender en påminnelse til leads som ikke har svart."
          />
        ) : (
          <div className="grid gap-4">
            {flows.map((flow) => (
              <Card key={flow.id}>
                <CardHeader className="flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {flow.name}
                      {flow.enabled ? (
                        <Badge variant="success" className="text-[10px]">
                          aktiv
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          pauset
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3">
                      <span>
                        <span className="font-medium text-foreground">
                          {sentByFlow.get(flow.id) ?? 0}
                        </span>{" "}
                        oppfølginger sendt
                      </span>
                      <span className="text-muted-foreground/60">·</span>
                      <span>Klikk en node for å redigere</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <FlowToggle id={flow.id} enabled={flow.enabled} />
                    <DeleteFlowButton id={flow.id} />
                  </div>
                </CardHeader>
                <CardContent>
                  <FlowCanvas flow={flow} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktivitet</CardTitle>
            <CardDescription>
              {runRows.length} siste hendelser fra alle flows
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {runRows.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Mail}
                  title="Ingen aktivitet enda"
                  description="Når en flow sender eller hopper over en lead, vises det her."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Bedrift</th>
                      <th className="px-4 py-2 font-medium">Flow</th>
                      <th className="px-4 py-2 font-medium">Når</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runRows.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-4 py-2">
                          <Badge
                            variant={STATUS_VARIANT[r.status] ?? "outline"}
                            className="text-[10px]"
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2">
                          {r.company_name
                            ? formatCompanyName(r.company_name)
                            : r.org_nr}
                          {r.error_message ? (
                            <div className="text-[11px] text-destructive">
                              {r.error_message}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {r.flow_name ?? "–"}
                        </td>
                        <td
                          className="px-4 py-2 text-muted-foreground"
                          title={r.at}
                        >
                          {formatDistanceToNow(new Date(r.at), {
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
