/**
 * Service templates — port of templates.py.
 *
 * Each entry seeds the proposal form's editable fields. Operator picks
 * a service type, the matching template fills the form, they tweak and
 * generate.
 *
 * Hero / CTA headlines use {{accent}}…{{/accent}} markers around the words
 * that should render in orange (rendered inline in pdf.tsx).
 *
 * {client_name} placeholder is substituted at form-prefill hour.
 */

import type { Deliverable, ServiceType } from "./types";

export interface ServiceTemplate {
  label: string;
  default_eyebrow: string;
  hero_template: string;
  deliverables: Deliverable[];
}

export const SERVICE_TEMPLATES: Record<
  Exclude<ServiceType, "custom">,
  ServiceTemplate
> = {
  website: {
    label: "Nettside",
    default_eyebrow: "PROFESJONELL NETTSIDE",
    hero_template:
      "Profesjonell {{accent}}nettside{{/accent}} for {{accent}}{client_name}{{/accent}}",
    deliverables: [
      {
        num: "01",
        title: "Design & Outvikling",
        bullets: [
          "Skreddersydd nettside",
          "Responsivt design – mobil, nettbrett, desktop",
          "Forside, om oss, tjenester, kontakt og flere",
          "Rent og profesjonelt uttrykk tilpasset bransjen",
        ],
      },
      {
        num: "02",
        title: "Body & Struktur",
        bullets: [
          "Bodysrådgivning og teksthjelp",
          "SEO-vennlig sidestruktur fra start",
          "Profesjonell bildebehandling og optimalisering",
          "Tydelig «call to action» på hver side",
        ],
      },
      {
        num: "03",
        title: "Teknisk oppsett",
        bullets: [
          "SSL-sertifikat og sikkerhet",
          "Hastighetsoptimalisering",
          "Google Analytics og Search Console oppsett",
          "Kontaktskjema med e-postvarsling",
        ],
      },
      {
        num: "04",
        title: "Lansering & Overlevering",
        bullets: [
          "Forhåndsvisning før du bestemmer deg",
          "Testing og kvalitetssikring",
          "Kort gjennomgang etter lansering",
          "Vi tar hånd om alt det tekniske",
        ],
      },
    ],
  },
  meta_ads: {
    label: "Meta Ads",
    default_eyebrow: "FACEBOOK & INSTAGRAM ANNONSER",
    hero_template:
      "Meta-annonser som {{accent}}konverterer{{/accent}} for {{accent}}{client_name}{{/accent}}",
    deliverables: [
      {
        num: "01",
        title: "Oppsett & Strategi",
        bullets: [
          "Kampanjestrategi tilpasset bransje og marked",
          "Meta Business Manager + annonsekonto + piksel",
          "Målgruppebygging: alder, geo, interesser, lookalikes",
          "Konverteringssporing på nettsiden",
        ],
      },
      {
        num: "02",
        title: "Annonseproduksjon",
        bullets: [
          "3–5 motiver per måned (feed/stories/reels)",
          "Profesjonelt design med tydelig CTA",
          "A/B-testing av motiver",
          "Tekstet og formatert for Meta",
        ],
      },
      {
        num: "03",
        title: "Kampanjeforvaltning",
        bullets: [
          "Løpende optimalisering – budsjett, målgrupper, motiver",
          "Retargeting av besøkende",
          "Negative ord og budjustering",
          "Månedlig resultatrapport",
        ],
      },
      {
        num: "04",
        title: "Teknisk oppsett",
        bullets: [
          "Meta-piksel og Conversions API",
          "Event-tracking (skjema, telefonklikk, booking)",
          "Domeneverifisering",
          "Rapportering i dashbordet",
        ],
      },
    ],
  },
  seo: {
    label: "SEO",
    default_eyebrow: "SØKEMOTOROPTIMALISERING",
    hero_template:
      "Bli funnet av {{accent}}flere kunder{{/accent}} – synlighet for {{accent}}{client_name}{{/accent}}",
    deliverables: [
      {
        num: "01",
        title: "Teknisk SEO",
        bullets: [
          "Teknisk audit (hastighet, mobil, indeksering)",
          "Feilretting og forbedringer",
          "Search Console og Analytics oppsett",
          "Strukturert data og schema",
        ],
      },
      {
        num: "02",
        title: "Searcheord & Strategi",
        bullets: [
          "Kartlegging av relevante søkeord",
          "Konkurrentanalyse",
          "Prioritering etter volum og intensjon",
          "Lokal SEO-strategi",
        ],
      },
      {
        num: "03",
        title: "Bodysproduksjon",
        bullets: [
          "SEO-optimaliserte artikler hver måned",
          "On-page optimalisering av eksisterende sider",
          "Intern lenkestruktur",
          "Lokal og kommersiell intensjon",
        ],
      },
      {
        num: "04",
        title: "Google Min Bedrift & Rapportering",
        bullets: [
          "Optimalisering av Google-profil",
          "Strategi for flere anmeldelser",
          "Månedlig rapport: rangering, trafikk, synlighet",
          "Anbefalinger for neste periode",
        ],
      },
    ],
  },
  google_ads: {
    label: "Google Ads",
    default_eyebrow: "GOOGLE SEARCH-ANNONSER",
    hero_template:
      "Google-annonser som gir {{accent}}resultater{{/accent}} for {{accent}}{client_name}{{/accent}}",
    deliverables: [
      {
        num: "01",
        title: "Oppsett & Strategi",
        bullets: [
          "Kontostruktur tilpasset bransje og budsjett",
          "Searcheordsanalyse og annonsegrupper",
          "Konverteringssporing (Tag Manager)",
          "Negative søkeord fra start",
        ],
      },
      {
        num: "02",
        title: "Annonseproduksjon",
        bullets: [
          "Responsive søkeannonser",
          "Annonseutvidelser (sitelinks, callouts)",
          "A/B-testing av tekster",
          "Landingsside-anbefalinger",
        ],
      },
      {
        num: "03",
        title: "Kampanjeforvaltning",
        bullets: [
          "Løpende budsjettstyring og budoptimalisering",
          "Searcheordsforedling",
          "Kvalitetsscore-optimalisering",
          "Budstrategier (manual/automatisk)",
        ],
      },
      {
        num: "04",
        title: "Rapportering",
        bullets: [
          "Månedlig rapport: klikk, konverteringer, CPA, ROAS",
          "Anbefalinger for neste periode",
          "Insights fra søkeordsdata",
          "Konkurrentinnsikt",
        ],
      },
    ],
  },
  reviews: {
    label: "Anmeldelser",
    default_eyebrow: "AUTOMATISERTE GOOGLE-ANMELDELSER",
    hero_template:
      "Flere {{accent}}5-stjerners anmeldelser{{/accent}} for {{accent}}{client_name}{{/accent}}",
    deliverables: [
      {
        num: "01",
        title: "Oppsett",
        bullets: [
          "NFC-kort med personlig design",
          "Landingsside for enkel anmeldelse (QR + NFC)",
          "Integrasjon med Google Min Bedrift",
          "Branded til bedriften",
        ],
      },
      {
        num: "02",
        title: "AI-drevne svar",
        bullets: [
          "Automatisk generering av svar",
          "Topasset tone og stil for bedriften",
          "Håndtering av positive og negative",
          "Manuell godkjenning hvis ønskelig",
        ],
      },
      {
        num: "03",
        title: "Oppfølging",
        bullets: [
          "Månedlig oversikt over nye anmeldelser",
          "Gjennomsnittlig score-tracking",
          "Strategi for å øke volum",
          "Rådgivning ved negativ feedback",
        ],
      },
      {
        num: "04",
        title: "Rapportering",
        bullets: [
          "Månedsrapport i dashbordet",
          "Sammenligning over tid",
          "Konkurrentbenchmarking",
          "Anbefalinger for forbedring",
        ],
      },
    ],
  },
};

/** Default proposal title shown in PDF metadata + header strip. */
export const SERVICE_PROPOSAL_TITLE: Record<
  Exclude<ServiceType, "custom">,
  string
> = {
  website: "Nettside Tobud",
  meta_ads: "Meta Ads Tobud",
  seo: "SEO Tobud",
  google_ads: "Google Ads Tobud",
  reviews: "Anmeldelser Tobud",
};
