import Link from "next/link";
import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  ArrowLeft,
  Ban,
  Building2,
  Eye,
  ExternalLink,
  MapPin,
  MousePointerClick,
  Phone,
  Send,
  Smartphone,
  Users,
} from "lucide-react";

import { ScoreBadge } from "@/components/admin/score-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { publicSiteUrl } from "@/lib/jobs/generate-site";
import { checkOutreachReadiness, fetchLeadByOrgNr } from "@/lib/leads";
import { getOutreachFromAddress, getOutreachReplyTo } from "@/lib/resend";
import { DEFAULT_SCORING_WEIGHTS } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  GeneratedSite,
  OutreachEmail,
  ScoreBreakdown,
  ScoringWeights,
} from "@/lib/supabase/types";
import { isNicheSlug, pickNicheFromNace, type NicheSlug } from "@/lib/templates";

import { EmailEditor } from "./_email-editor";
import { ProposalButton } from "./_proposal-button";
import { SendEmailButton } from "./_send-email-button";
import { SiteCard } from "./_site-card";
import { StatusActions } from "./_status-actions";

export const dynamic = "force-dynamic";

const SCORE_LABELS: Record<keyof ScoringWeights, string> = {
  has_phone: "Har telefon",
  org_form_as: "Selskapsform AS/ASA",
  target_nace: "Målnæring (NACE)",
  has_website: "Har nettside",
  has_real_address: "Reell forretningsadresse",
  freshly_founded: "Nystiftet (siste 7 dager)",
};

function formatDate(value: string | null): string {
  if (!value) return "–";
  try {
    return format(new Date(value), "d. MMMM yyyy", { locale: nb });
  } catch {
    return value;
  }
}

function ScoreBreakdownList({
  breakdown,
}: {
  breakdown: ScoreBreakdown;
}) {
  const keys = Object.keys(DEFAULT_SCORING_WEIGHTS) as Array<
    keyof ScoringWeights
  >;
  return (
    <ul className="space-y-1 text-sm">
      {keys.map((key) => {
        const points = breakdown[key];
        const earned = typeof points === "number" && points > 0;
        return (
          <li
            key={key}
            className="flex items-center justify-between gap-3 py-1"
          >
            <span
              className={
                earned ? "text-foreground" : "text-muted-foreground/70"
              }
            >
              {SCORE_LABELS[key]}
            </span>
            <span
              className={
                earned
                  ? "font-medium tabular-nums text-primary"
                  : "tabular-nums text-muted-foreground/50"
              }
            >
              {earned ? `+${points}` : "0"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ orgnr: string }>;
}) {
  const { orgnr } = await params;
  const lead = await fetchLeadByOrgNr(orgnr);
  if (!lead) notFound();

  const supabase = getSupabaseAdmin();
  const [historyRes, fromAddress, replyTo, readiness, siteRes] =
    await Promise.all([
      supabase
        .from("outreach_emails")
        .select("*")
        .eq("org_nr", lead.org_nr)
        .order("created_at", { ascending: false })
        .limit(20),
      getOutreachFromAddress(),
      getOutreachReplyTo(),
      checkOutreachReadiness(lead.org_nr, lead.email),
      supabase
        .from("generated_sites")
        .select("*")
        .eq("org_nr", lead.org_nr)
        .maybeSingle(),
    ]);
  const outreachHistory = (historyRes.data ?? []) as OutreachEmail[];
  const generatedSite = (siteRes.data as GeneratedSite | null) ?? null;
  const detectedNiche: NicheSlug = pickNicheFromNace(lead.nace_code);
  const publishedSite = generatedSite
    ? {
        nicheSlug: isNicheSlug(generatedSite.niche_slug)
          ? generatedSite.niche_slug
          : ("generic" as NicheSlug),
        nicheOverridden: generatedSite.niche_overridden,
        generatedAt: generatedSite.generated_at,
        model: generatedSite.generated_by_model,
        inputTokens: generatedSite.generation_input_tokens,
        outputTokens: generatedSite.generation_output_tokens,
      }
    : null;

  const brregUrl = `https://virksomhet.brreg.no/nb/oppslag/enheter/${lead.org_nr}`;

  return (
    <>
      <Topbar
        title={lead.name}
        description={`Org.nr ${lead.org_nr}`}
        actions={
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tilbake
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <ScoreBadge score={lead.score} className="h-7 min-w-11 text-sm" />
                  <h2 className="text-xl font-semibold tracking-tight">
                    {lead.name}
                  </h2>
                  <StatusBadge status={lead.status} />
                  {lead.bankrupt ? (
                    <Badge variant="destructive">Konkurs</Badge>
                  ) : null}
                  {lead.under_dissolution ? (
                    <Badge variant="warning">Under avvikling</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  Registrert {formatDate(lead.registered_at)}
                  {lead.founded_at && lead.founded_at !== lead.registered_at
                    ? ` · stiftet ${formatDate(lead.founded_at)}`
                    : null}
                </p>
              </div>

              <div className="flex flex-col items-end gap-3">
                <a
                  href={brregUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Vis i Brreg
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="flex flex-wrap items-center gap-2">
              <StatusActions orgNr={lead.org_nr} current={lead.status} />
              <div className="flex-1" />
              <ProposalButton companyName={lead.name} />
              <SendEmailButton
                orgNr={lead.org_nr}
                to={lead.email}
                fromAddress={fromAddress}
                replyTo={replyTo}
                companyName={lead.name}
                kommune={lead.kommune}
                suppressedReason={readiness.suppressed?.reason ?? null}
                previousSendCount={readiness.previousSendCount}
                siteUrl={publishedSite ? publicSiteUrl(lead.org_nr) : null}
              />
            </div>
          </CardContent>
        </Card>

        {/* Demoside */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demoside</CardTitle>
            <CardDescription>
              Auto-generert landingsside basert på Brreg-info og Claude-skreven
              kopi. Publiseres på{" "}
              <code className="font-mono">/p/{lead.org_nr}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SiteCard
              orgNr={lead.org_nr}
              detectedNiche={detectedNiche}
              publishedSite={publishedSite}
              publicUrl={publicSiteUrl(lead.org_nr)}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Score breakdown */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Score-bruddrapport</CardTitle>
              <CardDescription>
                Hvordan {lead.score}-poeng-summen er satt sammen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreBreakdownList breakdown={lead.score_breakdown ?? {}} />
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <ContactRow
                icon={Phone}
                label="Telefon"
                value={lead.phone}
                href={lead.phone ? `tel:${lead.phone}` : undefined}
              />
              <ContactRow
                icon={Smartphone}
                label="Mobil"
                value={lead.mobile}
                href={lead.mobile ? `tel:${lead.mobile}` : undefined}
              />
              <EmailEditor orgNr={lead.org_nr} initialEmail={lead.email} />
              <ContactRow
                icon={ExternalLink}
                label="Nettside"
                value={lead.website}
                href={
                  lead.website
                    ? lead.website.startsWith("http")
                      ? lead.website
                      : `https://${lead.website}`
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {/* Address + firmographics */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Selskap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Selskapsform
                  </div>
                  <div>
                    {lead.org_form ?? "–"}
                    {lead.org_form_description ? (
                      <span className="text-muted-foreground ml-1">
                        ({lead.org_form_description})
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Ansatte</div>
                  <div>
                    {lead.employee_count != null
                      ? lead.employee_count
                      : "–"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Forretningsadresse
                  </div>
                  <div>
                    {lead.address_line ?? "–"}
                    {lead.postal_code || lead.postal_place ? (
                      <div className="text-muted-foreground">
                        {lead.postal_code} {lead.postal_place}
                      </div>
                    ) : null}
                    {lead.kommune ? (
                      <div className="text-xs text-muted-foreground">
                        {lead.kommune}
                        {lead.kommune_nr ? ` (${lead.kommune_nr})` : ""}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NACE + flags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Næring og status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">NACE</div>
              <div className="text-sm">
                {lead.nace_code ? (
                  <span className="font-mono mr-2">{lead.nace_code}</span>
                ) : null}
                {lead.nace_description ?? "–"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-start">
              {lead.vat_registered ? (
                <Badge variant="success">MVA-registrert</Badge>
              ) : (
                <Badge variant="outline">Ikke MVA-registrert</Badge>
              )}
              {lead.forced_dissolution ? (
                <Badge variant="destructive">Tvangsavvikling</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Outreach history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">E-post sendt</CardTitle>
            <CardDescription>
              {outreachHistory.length === 0
                ? "Ingen e-post sendt enda"
                : `${outreachHistory.length} utsendelser`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {outreachHistory.length === 0 ? null : (
              <ul className="divide-y">
                {outreachHistory.map((entry) => (
                  <li key={entry.id} className="px-6 py-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Send className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">
                          {entry.subject}
                        </span>
                      </div>
                      <OutreachStatusBadge status={entry.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">→ {entry.to_email}</span>
                      <span
                        className="whitespace-nowrap"
                        title={entry.created_at}
                      >
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                          locale: nb,
                        })}
                      </span>
                    </div>
                    {(entry.delivered_at ||
                      entry.opened_at ||
                      entry.clicked_at ||
                      entry.bounced_at) && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                        {entry.delivered_at ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            levert{" "}
                            {formatDistanceToNow(new Date(entry.delivered_at), {
                              addSuffix: true,
                              locale: nb,
                            })}
                          </span>
                        ) : null}
                        {entry.opened_at ? (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            åpnet
                            {entry.open_count > 1
                              ? ` ×${entry.open_count}`
                              : ""}
                          </span>
                        ) : null}
                        {entry.clicked_at ? (
                          <span className="inline-flex items-center gap-1">
                            <MousePointerClick className="h-3 w-3" />
                            klikket
                            {entry.click_count > 1
                              ? ` ×${entry.click_count}`
                              : ""}
                          </span>
                        ) : null}
                        {entry.bounced_at ? (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <Ban className="h-3 w-3" />
                            bounce
                          </span>
                        ) : null}
                      </div>
                    )}
                    {entry.error_message ? (
                      <p className="text-xs text-destructive">
                        {entry.error_message}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Raw payload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rådata fra Brreg</CardTitle>
            <CardDescription>
              Full payload fra Enhetsregisteret API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
                Vis JSON
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">
                {JSON.stringify(lead.raw_data ?? {}, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function OutreachStatusBadge({
  status,
}: {
  status: OutreachEmail["status"];
}) {
  const map: Record<
    OutreachEmail["status"],
    { variant: "success" | "destructive" | "warning" | "secondary" | "outline"; label: string }
  > = {
    queued: { variant: "warning", label: "i kø" },
    sent: { variant: "secondary", label: "sendt" },
    delivered: { variant: "success", label: "levert" },
    bounced: { variant: "destructive", label: "bounce" },
    complained: { variant: "destructive", label: "klage" },
    failed: { variant: "destructive", label: "feilet" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        {value ? (
          href ? (
            <a
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="break-words hover:underline"
            >
              {value}
            </a>
          ) : (
            <span className="break-words">{value}</span>
          )
        ) : (
          <span className="text-muted-foreground/70">–</span>
        )}
      </div>
    </div>
  );
}
