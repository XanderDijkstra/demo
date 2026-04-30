import { Settings } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <>
      <Topbar
        title="Innstillinger"
        description="Scoring-vekter og målnæringer"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <EmptyState
          icon={Settings}
          title="Innstillinger kommer i Stage 7"
          description="Tuning av score-vekter, målrettede NACE-koder og ekskluderte selskapsformer."
        />
      </div>
    </>
  );
}
