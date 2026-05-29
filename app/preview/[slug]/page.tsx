import { notFound } from "next/navigation";

import { SiteTemplate } from "@/components/site/template";
import { CarpenterTemplate } from "@/components/site/templates/carpenter";
import { ContractorTemplate } from "@/components/site/templates/contractor";
import { LandscaperTemplate } from "@/components/site/templates/landscaper";
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
  website: "eksempelbedrift.no",
  founded_at: "2003-04-15",
};

const SAMPLE_CONTENT = {
  hero_headline: "Vi løser jobben raskt og riktig.",
  hero_subheadline:
    "Eksempelbedrift AS leverer trygge tjenester til kunder i Bergen og omegn — alltid med klar pris og fast oppmøte.",
  about_paragraph:
    "Eksempelbedrift AS ble etablert for å gjøre fagarbeid enkelt for vanlige folk. Teamet vårt er sertifisert, lokalkjent, og opptatt av å levere arbeid vi selv ville vært stolte av i eget hjem.",
};

// Per-niche sample content used when there's a more natural choice than the
// generic "Eksempelbedrift" copy. Falls back to SAMPLE_CONTENT otherwise.
const SAMPLE_CONTENT_BY_SLUG: Record<string, typeof SAMPLE_CONTENT> = {
  landscaper: {
    hero_headline: "Drømmehagen din — uten bekymringer",
    hero_subheadline:
      "Vi forvandler uteområdet ditt med stramt steinarbeid, frodig plen og førsteklasses renovasjoner i Bergen og omegn.",
    about_paragraph:
      "Hos Eksempelbedrift AS handler alt om håndverk. Vi skaper og vedlikeholder hager som ikke bare er pene, men der du faktisk slapper av. Med 10+ års erfaring sørger vi for et resultat som står seg.",
  },
  contractor: {
    hero_headline: "Førsteklasses entreprise i Bergen",
    hero_subheadline:
      "Vi tar hele renoveringen — fra første tegning til siste finish — med en prosjektleder som er din kontakt fra start til slutt.",
    about_paragraph:
      "Eksempelbedrift AS er totalentreprenør for hjem som skal vare. Med over 20 års erfaring leverer vi prosjekter med åpne priser, dokumentert kvalitet og en stødig prosess. Visjonen din er rammen vi bygger innenfor.",
  },
  carpenter: {
    hero_headline: "Bygger din visjon, skaper varige rom",
    hero_subheadline:
      "Fra skreddersydde nybygg til kjøkken- og badrenoveringer — Eksempelbedrift AS bringer 20+ år med pålitelig håndverk og ærlig prosjektledelse til hvert hjem vi rører.",
    about_paragraph:
      "Eksempelbedrift AS er en familieeid snekkerbedrift med over 20 års erfaring i Bergen. John Eksempel leder personlig hvert prosjekt med en hands-on tilnærming — ærlige priser, nitid fokus på detaljer og en sømløs opplevelse fra første konsultasjon til overlevering.",
  },
};

export default async function TemplatePreviewPage({ params }: RouteProps) {
  const { slug } = await params;
  if (!isNicheSlug(slug)) notFound();

  const niche = await loadNicheConfig(slug);
  const content = SAMPLE_CONTENT_BY_SLUG[slug] ?? SAMPLE_CONTENT;

  if (slug === "landscaper") {
    return (
      <LandscaperTemplate
        company={SAMPLE_COMPANY}
        niche={niche}
        content={content}
      />
    );
  }

  if (slug === "contractor") {
    return (
      <ContractorTemplate
        company={SAMPLE_COMPANY}
        niche={niche}
        content={content}
      />
    );
  }

  if (slug === "carpenter") {
    return (
      <CarpenterTemplate
        company={SAMPLE_COMPANY}
        niche={niche}
        content={content}
      />
    );
  }

  return (
    <SiteTemplate company={SAMPLE_COMPANY} niche={niche} content={content} />
  );
}
