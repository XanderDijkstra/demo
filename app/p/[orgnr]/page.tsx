import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteTemplate } from "@/components/site/template";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getNicheConfig,
  isNicheSlug,
  type NicheSlug,
} from "@/lib/templates";
import type { Company, GeneratedSite } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ orgnr: string }>;
}

async function loadSite(orgNr: string): Promise<{
  company: Company;
  site: GeneratedSite;
} | null> {
  if (!/^\d{9}$/.test(orgNr)) return null;
  const supabase = getSupabaseAdmin();

  const [companyRes, siteRes] = await Promise.all([
    supabase.from("companies").select("*").eq("org_nr", orgNr).maybeSingle(),
    supabase
      .from("generated_sites")
      .select("*")
      .eq("org_nr", orgNr)
      .maybeSingle(),
  ]);

  if (companyRes.error || siteRes.error) return null;
  if (!companyRes.data || !siteRes.data) return null;

  return {
    company: companyRes.data as Company,
    site: siteRes.data as GeneratedSite,
  };
}

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  const { orgnr } = await params;
  const data = await loadSite(orgnr);
  if (!data) return { title: "Ikke funnet" };
  const niche = isNicheSlug(data.site.niche_slug)
    ? data.site.niche_slug
    : ("generic" as NicheSlug);
  const config = getNicheConfig(niche);
  return {
    title: `${data.company.name} – ${config.displayName}`,
    description:
      data.site.content_json.hero_subheadline ??
      `${config.displayName} ${data.company.kommune ? `i ${data.company.kommune}` : ""}`.trim(),
    robots: { index: false, follow: false },
  };
}

export default async function PublicSitePage({ params }: RouteProps) {
  const { orgnr } = await params;
  const data = await loadSite(orgnr);
  if (!data) notFound();

  const slug: NicheSlug = isNicheSlug(data.site.niche_slug)
    ? data.site.niche_slug
    : "generic";
  const niche = getNicheConfig(slug);

  return (
    <SiteTemplate
      company={data.company}
      niche={niche}
      content={data.site.content_json}
    />
  );
}
