import { LayoutDashboard } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkSupabaseHealth } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const health = await checkSupabaseHealth();

  return (
    <>
      <Topbar
        title="Dashboard"
        description="Daglig oversikt over nye leads fra Brreg"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Supabase</CardTitle>
            {health.ok ? (
              <Badge variant="success">tilkoblet</Badge>
            ) : (
              <Badge variant="destructive">frakoblet</Badge>
            )}
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {health.ok ? (
              <p>
                <span className="font-medium text-foreground">
                  {health.settingsCount}
                </span>{" "}
                rader i <code>settings</code>. Migration er kjørt.
              </p>
            ) : (
              <p className="text-destructive">{health.error}</p>
            )}
          </CardContent>
        </Card>

        <EmptyState
          icon={LayoutDashboard}
          title="Dashboard kommer i Stage 6"
          description="Statistikk for daglige innhentinger, score-fordeling og topp-leads vises her når dataene begynner å komme inn."
        />
      </div>
    </>
  );
}
