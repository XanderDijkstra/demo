import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { ArrowRight, Palette } from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
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
        description="Per-bransje design og kopi for de auto-genererte demosidene"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Hvordan maler fungerer
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Hver mal består av farger, hero-bildemne, tre tjenester, en CTA og
              tre fordeler-chips. Strukturen (seksjoner og rekkefølge) ligger i
              kode.
            </p>
            <p>
              Endringer blir <strong className="text-foreground">live umiddelbart</strong>{" "}
              for alle publiserte demosider — ingen regenerering trengs. Kun
              Claude-skreven hero/about-tekst per lead beholdes som den var.
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
                  className="h-24 w-full"
                  style={{
                    background: `linear-gradient(135deg, ${n.primaryColor}, ${n.accentColor})`,
                  }}
                />
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold tracking-tight">
                        {n.displayName}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {n.slug}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {n.source === "db" ? "endret" : "standard"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.services[0]?.title} · {n.services[1]?.title} ·{" "}
                    {n.services[2]?.title}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {n.updatedAt ? (
                        <>
                          oppdatert{" "}
                          {formatDistanceToNow(new Date(n.updatedAt), {
                            addSuffix: true,
                            locale: nb,
                          })}
                        </>
                      ) : (
                        <span className="italic">aldri endret</span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      Rediger
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
