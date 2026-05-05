import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";

import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOutreachFromAddress, getOutreachReplyTo } from "@/lib/resend";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getExcludedOrgForms,
  getScoringWeights,
  getSetting,
  getTargetNaceCodes,
} from "@/lib/supabase/queries";
import type {
  AuditLogEntry,
  OutreachSuppression,
} from "@/lib/supabase/types";

import {
  saveExcludedOrgForms,
  saveTargetNaceCodes,
} from "./_actions";
import { OutreachFromForm } from "./_from-form";
import { ListForm } from "./_list-form";
import { RescoreButton } from "./_rescore-button";
import { SuppressionManager } from "./_suppression-form";
import { WeightsForm } from "./_weights-form";

export const dynamic = "force-dynamic";

const SETTINGS_AUDIT_PREFIX = "settings.";

export default async function SettingsPage() {
  const supabase = getSupabaseAdmin();
  const [
    weights,
    naceCodes,
    excludedForms,
    fromAddress,
    replyTo,
    claudeModel,
    leadsCount,
    sitesRes,
    sitesUsageRes,
    auditRes,
    suppressionsRes,
  ] = await Promise.all([
    getScoringWeights(),
    getTargetNaceCodes(),
    getExcludedOrgForms(),
    getOutreachFromAddress(),
    getOutreachReplyTo(),
    getSetting<string>("claude_model"),
    supabase.from("companies").select("*", { count: "exact", head: true }),
    supabase
      .from("generated_sites")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("generated_sites")
      .select("generation_input_tokens, generation_output_tokens"),
    supabase
      .from("audit_log")
      .select("*")
      .like("action", `${SETTINGS_AUDIT_PREFIX}%`)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("outreach_suppressions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const totalLeads = leadsCount.count ?? 0;
  const totalSites = sitesRes.count ?? 0;
  const sitesUsage = (sitesUsageRes.data ?? []) as Array<{
    generation_input_tokens: number | null;
    generation_output_tokens: number | null;
  }>;
  const totalInputTokens = sitesUsage.reduce(
    (sum, r) => sum + (r.generation_input_tokens ?? 0),
    0
  );
  const totalOutputTokens = sitesUsage.reduce(
    (sum, r) => sum + (r.generation_output_tokens ?? 0),
    0
  );
  const recentChanges = (auditRes.data ?? []) as AuditLogEntry[];
  const suppressions = (suppressionsRes.data ?? []) as OutreachSuppression[];

  return (
    <>
      <Topbar
        title="Innstillinger"
        description="Scoring-vekter, målnæringer og ekskluderte former"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Scoring weights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scoring-vekter</CardTitle>
            <CardDescription>
              Hvor mange poeng hvert signal er verdt. Endringer påvirker bare
              nye leads — bruk «Rescore alle» under for å oppdatere
              eksisterende.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeightsForm initial={weights ?? DEFAULT_SCORING_WEIGHTS} />
          </CardContent>
        </Card>

        {/* NACE + excluded forms */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Målnæringer (NACE)</CardTitle>
              <CardDescription>
                Én kode per linje. Prefix-match — &ldquo;43.22&rdquo; matcher
                &ldquo;43.220&rdquo;. Brreg sin{" "}
                <a
                  href="https://www.ssb.no/klass/klassifikasjoner/6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SSB-liste
                </a>{" "}
                har alle koder.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListForm
                inputName="codes"
                initial={naceCodes ?? []}
                description={`${naceCodes?.length ?? 0} koder konfigurert`}
                placeholder={"43.22\n43.21\n56.10"}
                saveAction={saveTargetNaceCodes}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ekskluderte former</CardTitle>
              <CardDescription>
                Selskapsformer som filtreres bort før scoring (KBO,
                tvangsavviklinger, utenlandske filialer, offentlige
                organer).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ListForm
                inputName="forms"
                initial={excludedForms ?? []}
                description={`${excludedForms?.length ?? 0} former ekskludert`}
                placeholder={"KBO\nUTLA\nSTAT"}
                saveAction={saveExcludedOrgForms}
              />
            </CardContent>
          </Card>
        </div>

        {/* Outreach */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">E-post-utsendelse</CardTitle>
            <CardDescription>
              Avsenderadressen som brukes når du sender e-post fra
              lead-detaljsiden via Resend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OutreachFromForm
              initialFrom={fromAddress}
              initialReplyTo={replyTo}
            />
          </CardContent>
        </Card>

        {/* Demosider — Claude usage summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demosider</CardTitle>
            <CardDescription>
              AI-genererte landingssider per lead. Modellen settes i
              <code className="font-mono mx-1">claude_model</code>-settingen
              (ikke redigerbar fra UI enda).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-muted-foreground">Aktiv modell</div>
                <div className="font-mono text-sm">
                  {claudeModel ?? "claude-haiku-4-5"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Publiserte sider
                </div>
                <div className="text-sm tabular-nums">
                  <span className="font-medium">{totalSites}</span>
                  <span className="text-muted-foreground"> / {totalLeads}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Tokens brukt totalt
                </div>
                <div className="text-sm tabular-nums">
                  <span className="font-medium">
                    {(totalInputTokens + totalOutputTokens).toLocaleString("nb-NO")}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    ({totalInputTokens.toLocaleString("nb-NO")} inn /{" "}
                    {totalOutputTokens.toLocaleString("nb-NO")} ut)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suppression list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suppression list</CardTitle>
            <CardDescription>
              Adresser som aldri skal kontaktes. Resend sender bounces og
              spam-klager hit automatisk via webhook. Du kan også legge til
              manuelt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SuppressionManager suppressions={suppressions} />
          </CardContent>
        </Card>

        {/* Re-score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rescore eksisterende leads</CardTitle>
            <CardDescription>
              Beregn scoren på nytt for alle leads i databasen med gjeldende
              vekter og målnæringer. Status, notater og andre manuelle endringer
              beholdes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RescoreButton totalLeads={totalLeads} />
          </CardContent>
        </Card>

        {/* Recent changes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Siste endringer</CardTitle>
            <CardDescription>
              {recentChanges.length === 0
                ? "Ingen endringer logget enda"
                : `${recentChanges.length} oppdateringer`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentChanges.length === 0 ? null : (
              <ul className="divide-y">
                {recentChanges.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {entry.action.replace(SETTINGS_AUDIT_PREFIX, "")}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {entry.actor ?? "system"}
                      </span>
                    </div>
                    <span
                      className="text-xs text-muted-foreground whitespace-nowrap"
                      title={entry.created_at}
                    >
                      {formatDistanceToNow(new Date(entry.created_at), {
                        addSuffix: true,
                        locale: nb,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
