import { checkSupabaseHealth } from "@/lib/supabase/queries";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const health = await checkSupabaseHealth();

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            V
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Vekst-Systemet</h1>
            <p className="text-sm text-muted-foreground">
              Internt verktøy for FX Media
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Supabase</CardTitle>
            {health.ok ? (
              <Badge variant="success">tilkoblet</Badge>
            ) : (
              <Badge variant="destructive">frakoblet</Badge>
            )}
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            {health.ok ? (
              <p>
                <span className="font-medium text-foreground">
                  {health.settingsCount}
                </span>{" "}
                rader i <code>settings</code>. Migration er kjørt.
              </p>
            ) : (
              <>
                <p className="text-destructive">{health.error}</p>
                <p className="text-xs">
                  Sjekk at migration <code>0001_initial_schema.sql</code> er kjørt
                  i Supabase, og at env-variabler er satt.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stage 2 ferdig</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Database-skjema og Supabase-klient er på plass.</p>
            <p>
              Neste steg: admin-skall (sidebar, topbar, ruter), så Brreg-scraping
              og scoring.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
