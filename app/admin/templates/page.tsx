import Link from "next/link";
import { ArrowRight, MessageSquare, Palette } from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadAllNiches } from "@/lib/template-store";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const niches = await loadAllNiches();

  return (
    <>
      <Topbar
        title="Maler"
        description="Per-bransje design for de auto-genererte demosidene"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Slik fungerer maler
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Hver bransje har én mal som auto-genererte demosider rendres
              gjennom. Klikk inn på en mal for å se hvordan den ser ut med
              eksempel-data.
            </p>
            <p className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Designarbeid skjer i Claude-chatten — del skjermbilder der, så
                oppdateres koden i{" "}
                <code className="font-mono">lib/templates.ts</code> og
                endringer går live etter neste deploy.
              </span>
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((n) => (
            <Link
              key={n.slug}
              href={`/admin/templates/${n.slug}` as never}
              className="group block focus:outline-hidden"
            >
              <Card className="overflow-hidden transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring">
                <div
                  className="h-28 w-full"
                  style={{
                    background: `linear-gradient(135deg, ${n.primaryColor}, ${n.accentColor})`,
                  }}
                />
                <CardContent className="p-4 space-y-2.5">
                  <div>
                    <div className="font-semibold tracking-tight">
                      {n.displayName}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {n.slug}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.services[0]?.title} · {n.services[1]?.title} ·{" "}
                    {n.services[2]?.title}
                  </p>

                  <div className="flex items-center justify-end text-[11px]">
                    <span className="inline-flex items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground">
                      Se mal
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
