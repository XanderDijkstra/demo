import { Building2 } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Topbar } from "@/components/admin/topbar";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ orgnr: string }>;
}) {
  const { orgnr } = await params;

  return (
    <>
      <Topbar title={`Lead ${orgnr}`} description="Detaljvisning" />

      <div className="flex-1 overflow-y-auto p-6">
        <EmptyState
          icon={Building2}
          title="Detaljside kommer i Stage 5"
          description={`Org.nr ${orgnr} — Brreg-data, scoring-bruddrapport og aktivitetslogg vises her.`}
        />
      </div>
    </>
  );
}
