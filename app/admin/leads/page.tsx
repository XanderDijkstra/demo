import { Users } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default function LeadsPage() {
  return (
    <>
      <Topbar
        title="Leads"
        description="Selskaper hentet fra Brreg, sortert etter score"
      />

      <div className="flex-1 overflow-y-auto p-6">
        <EmptyState
          icon={Users}
          title="Lead-oversikt kommer i Stage 5"
          description="Tabell med ukens og alle leads, filtre, søk og detaljside per selskap."
        />
      </div>
    </>
  );
}
