import { notFound } from "next/navigation";

import { SiteTemplate } from "@/components/site/template";
import { loadNicheConfig } from "@/lib/template-store";
import { isNicheSlug } from "@/lib/templates";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

/**
 * Sample company used to render the preview iframe in /admin/templates/[slug].
 * Shape mirrors the props SiteTemplate expects from a real Company row.
 */
const SAMPLE_COMPANY = {
  org_nr: "999999999",
  name: "Eksempelbedrift AS",
  kommune: "Bergen",
  address_line: "Strandgata 14",
  postal_code: "5004",
  postal_place: "BERGEN",
  phone: "55 12 34 56",
  mobile: "920 12 345",
  email: "post@eksempelbedrift.no",
};

const SAMPLE_CONTENT = {
  hero_headline: "Vi løser jobben raskt og riktig.",
  hero_subheadline:
    "Eksempelbedrift AS leverer trygge tjenester til kunder i Bergen og omegn — alltid med klar pris og fast oppmøte.",
  about_paragraph:
    "Eksempelbedrift AS ble etablert for å gjøre fagarbeid enkelt for vanlige folk. Teamet vårt er sertifisert, lokalkjent, og opptatt av å levere arbeid vi selv ville vært stolte av i eget hjem.",
};

export default async function TemplatePreviewPage({ params }: RouteProps) {
  const { slug } = await params;
  if (!isNicheSlug(slug)) notFound();

  const niche = await loadNicheConfig(slug);

  return (
    <SiteTemplate
      company={SAMPLE_COMPANY}
      niche={niche}
      content={SAMPLE_CONTENT}
    />
  );
}
