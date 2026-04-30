import { Activity } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default function QueuePage() {
  return (
    <>
      <Topbar
        title="Kø"
        description="Brreg-innhenting og bakgrunnsjobber"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <EmptyState
          icon={Activity}
          title="Jobbkø kommer i Stage 4"
          description="Daglig Brreg-cron, kjørehistorikk og knapp for manuell kjøring vises her."
        />
      </div>
    </>
  );
}
