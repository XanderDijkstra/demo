/**
 * Niche taxonomy for the auto-generated demo sites.
 *
 * One source of truth for:
 *   - Each niche template + a generic fallback
 *   - NACE prefix → niche slug mapping
 *   - Per-niche brand colour, hero image, services, CTA
 *
 * Most niches render through the generic `components/site/template.tsx`.
 * Niches that need bespoke layouts (e.g. landscaper) have a dedicated
 * component under `components/site/templates/{slug}.tsx` and are
 * dispatched on slug in the public + preview routes.
 *
 * Copy rule: the demo sites are sent to real, newly registered companies.
 * Nothing here may read as a factual claim about them (years, ratings,
 * certifications, guarantees, response times). Service descriptions stay
 * generic ("Vi tar oppdrag innen …") and benefit chips are neutral labels.
 */

export type NicheSlug =
  | "plumber"
  | "electrician"
  | "restaurant"
  | "salon"
  | "auto_repair"
  | "landscaper"
  | "contractor"
  | "carpenter"
  | "generic";

export interface NicheService {
  title: string;
  description: string;
}

export type HeroLayout = "split" | "centered" | "overlay";

export interface NicheConfig {
  slug: NicheSlug;
  /** Norwegian display name (capitalised noun, e.g. "Rørlegger"). Shown to
   *  operators in the niche dropdown and used lowercased in sentences. */
  displayName: string;
  /** Tailwind-friendly CSS variable for the primary brand colour (oklch). */
  primaryColor: string;
  /** Lighter accent for hero gradients. */
  accentColor: string;
  /** Short descriptive keyword for the hero image (shown in admin). */
  heroImageKeyword: string;
  /** Self-hosted hero photo under /public/templates/<niche>/ (credits in
   *  public/templates/CREDITS.md). Used by the generic template. */
  heroImage: string;
  /** Hero composition variant the renderer will pick. */
  heroLayout: HeroLayout;
  /** Services rendered in the services section. Most niches list 3; some
   *  (landscaper) have a 6-card grid. Always at least 3. */
  services: NicheService[];
  /** Call-to-action label on every CTA button. */
  ctaText: string;
  /** Short, neutral chips in the hero (never claims). */
  benefitTags: string[];
}

const PLUMBER: NicheConfig = {
  slug: "plumber",
  displayName: "Rørlegger",
  primaryColor: "oklch(0.55 0.16 245)",
  accentColor: "oklch(0.92 0.04 245)",
  heroImageKeyword: "plumber",
  heroImage: "/templates/plumber/hero.webp",
  heroLayout: "split",
  services: [
    {
      title: "Lekkasjer og tette avløp",
      description:
        "Vi tar oppdrag innen feilsøking og utbedring av lekkasjer, tette avløp og andre rørproblemer.",
    },
    {
      title: "Bad og våtrom",
      description:
        "Vi tar oppdrag innen rørleggerarbeid ved oppussing av bad, vaskerom og kjøkken.",
    },
    {
      title: "Service og utskifting",
      description:
        "Bytte av blandebatterier, varmtvannsberedere og annet utstyr i boligen.",
    },
  ],
  ctaText: "Ta kontakt",
  benefitTags: ["Rørleggerarbeid", "Privat og bedrift", "Ta kontakt for pris"],
};

const ELECTRICIAN: NicheConfig = {
  slug: "electrician",
  displayName: "Elektriker",
  primaryColor: "oklch(0.7 0.18 90)",
  accentColor: "oklch(0.95 0.05 90)",
  heroImageKeyword: "electrician",
  heroImage: "/templates/electrician/hero.webp",
  heroLayout: "split",
  services: [
    {
      title: "Elektrisk arbeid i bolig",
      description:
        "Vi tar oppdrag innen nye kurser, stikkontakter, belysning og utbedringer i hjemmet.",
    },
    {
      title: "Elbillader og smarthus",
      description:
        "Montering av ladeboks og styring av lys og varme.",
    },
    {
      title: "Næring",
      description:
        "Elektriske installasjoner for kontorer, butikker og verksteder.",
    },
  ],
  ctaText: "Be om tilbud",
  benefitTags: ["Elektrisk arbeid", "Privat og bedrift", "Ta kontakt for pris"],
};

const RESTAURANT: NicheConfig = {
  slug: "restaurant",
  displayName: "Restaurant",
  primaryColor: "oklch(0.55 0.18 30)",
  accentColor: "oklch(0.95 0.04 30)",
  heroImageKeyword: "restaurant",
  heroImage: "/templates/restaurant/hero.webp",
  heroLayout: "overlay",
  services: [
    {
      title: "Lunsj og middag",
      description: "Her kan menyen og åpningstidene deres presenteres.",
    },
    {
      title: "Selskap",
      description:
        "Ta kontakt for å høre om muligheter for selskap og større grupper.",
    },
    {
      title: "Take-away",
      description: "Her kan informasjon om bestilling og henting stå.",
    },
  ],
  ctaText: "Ta kontakt",
  benefitTags: ["Lunsj og middag", "Selskap", "Take-away"],
};

const SALON: NicheConfig = {
  slug: "salon",
  displayName: "Frisør",
  primaryColor: "oklch(0.6 0.16 350)",
  accentColor: "oklch(0.96 0.04 350)",
  heroImageKeyword: "hair-salon",
  heroImage: "/templates/salon/hero.webp",
  heroLayout: "centered",
  services: [
    {
      title: "Klipp og styling",
      description: "Klipp, vask og styling for dame, herre og barn.",
    },
    {
      title: "Farge og striper",
      description: "Hel farge, striper og fargefornying.",
    },
    {
      title: "Oppsett og festfrisyrer",
      description: "Hår til bryllup, konfirmasjon og andre anledninger.",
    },
  ],
  ctaText: "Bestill time",
  benefitTags: ["Klipp", "Farge", "Styling"],
};

const AUTO_REPAIR: NicheConfig = {
  slug: "auto_repair",
  displayName: "Bilverksted",
  primaryColor: "oklch(0.5 0.2 25)",
  accentColor: "oklch(0.95 0.04 25)",
  heroImageKeyword: "auto-repair",
  heroImage: "/templates/auto_repair/hero.webp",
  heroLayout: "split",
  services: [
    {
      title: "Service",
      description:
        "Vi tar oppdrag innen periodisk service og vedlikehold av bilen.",
    },
    {
      title: "Reparasjon",
      description:
        "Feilsøking og reparasjon av motor, bremser, understell og elektronikk.",
    },
    {
      title: "Dekk og hjul",
      description: "Hjulskift og andre oppdrag knyttet til dekk og hjul.",
    },
  ],
  ctaText: "Bestill verkstedtime",
  benefitTags: ["Service", "Reparasjon", "Ta kontakt for pris"],
};

const LANDSCAPER: NicheConfig = {
  slug: "landscaper",
  displayName: "Anleggsgartner",
  // Dark forest green as primary; cream as accent. Lime CTA is hardcoded
  // inside components/site/templates/landscaper.tsx since it's an identity
  // signal of this template.
  primaryColor: "oklch(0.32 0.05 145)",
  accentColor: "oklch(0.94 0.03 85)",
  heroImageKeyword: "garden",
  heroImage: "/templates/landscaper/hero.webp",
  heroLayout: "overlay",
  services: [
    {
      title: "Plenanlegg",
      description: "Ferdigplen og såing av ny plen, med forarbeid av jorda.",
    },
    {
      title: "Steinarbeid",
      description: "Steinlegging av oppkjørsler, gangveier og uteplasser.",
    },
    {
      title: "Gjerder",
      description: "Gjerder og levegger tilpasset tomten og behovet ditt.",
    },
    {
      title: "Hagerenovasjon",
      description: "Oppgradering av hagen, fra planlegging til beplantning.",
    },
    {
      title: "Grunnarbeid",
      description: "Utgraving, planering og drenering.",
    },
    {
      title: "Vedlikehold",
      description: "Beskjæring, plenklipp og jevnlig stell av hagen.",
    },
  ],
  ctaText: "Be om tilbud",
  benefitTags: ["Hage og uterom", "Privat og bedrift", "Ta kontakt for pris"],
};

const CONTRACTOR: NicheConfig = {
  slug: "contractor",
  displayName: "Entreprenør",
  // Warm charcoal as primary, sand cream as accent. Bronze CTA accent
  // is hardcoded inside components/site/templates/contractor.tsx.
  primaryColor: "oklch(0.18 0.012 70)",
  accentColor: "oklch(0.91 0.04 80)",
  heroImageKeyword: "kitchen,renovation",
  heroImage: "/templates/contractor/hero.webp",
  heroLayout: "split",
  services: [
    {
      title: "Boligrenovasjon",
      description:
        "Vi tar oppdrag innen oppussing og renovering av boliger, store og små.",
    },
    {
      title: "Kjøkken og stue",
      description: "Oppussing av kjøkken og stue, inkludert endringer i planløsning.",
    },
    {
      title: "Tilbygg og påbygg",
      description: "Påbygg, ekstraetasjer, garasjer og uthus.",
    },
    {
      title: "Bad og våtrom",
      description: "Oppussing av bad og vaskerom, fra riving til ferdig rom.",
    },
    {
      title: "Terrasse og uterom",
      description: "Terrasser, balkonger og uteplasser.",
    },
    {
      title: "Snekkerarbeid",
      description: "Garderober, hyller og innebygde løsninger.",
    },
  ],
  ctaText: "Be om tilbud",
  benefitTags: ["Bygg og oppussing", "Privat og bedrift", "Ta kontakt for pris"],
};

const CARPENTER: NicheConfig = {
  slug: "carpenter",
  displayName: "Snekker",
  // Warm beige / cream + deep navy. Identity colours are largely
  // hardcoded inside components/site/templates/carpenter.tsx since the
  // template has a specific editorial look; these are kept for the
  // shared niche-color UI bits (badges, etc.).
  primaryColor: "oklch(0.22 0.04 250)",
  accentColor: "oklch(0.86 0.05 70)",
  heroImageKeyword: "carpentry,wood",
  heroImage: "/templates/carpenter/2149343676.webp",
  heroLayout: "split",
  services: [
    {
      title: "Renovering",
      description:
        "Vi tar oppdrag innen oppussing og renovering av boliger og hytter.",
    },
    {
      title: "Kjøkken og bad",
      description:
        "Montering av kjøkken, innredning og snekkerarbeid ved oppussing av bad.",
    },
    {
      title: "Tilbygg og påbygg",
      description: "Påbygg, ekstraetasjer, garasjer og uthus.",
    },
    {
      title: "Nybygg",
      description: "Bygging av boliger, hytter og mindre bygg.",
    },
  ],
  ctaText: "Be om tilbud",
  benefitTags: ["Snekkerarbeid", "Privat og bedrift", "Ta kontakt for pris"],
};

const GENERIC: NicheConfig = {
  slug: "generic",
  displayName: "Generell",
  primaryColor: "oklch(0.6 0.118 184.704)",
  accentColor: "oklch(0.95 0.03 184)",
  heroImageKeyword: "workspace",
  heroImage: "/templates/generic/hero.webp",
  heroLayout: "split",
  services: [
    {
      title: "Hva vi tilbyr",
      description: "Her kan dere beskrive tjenestene eller produktene deres.",
    },
    {
      title: "Slik jobber vi",
      description: "Her kan dere fortelle hvordan et oppdrag eller en bestilling foregår.",
    },
    {
      title: "Ta kontakt",
      description: "Send en e-post eller ring, så hører vi hva du trenger.",
    },
  ],
  ctaText: "Ta kontakt",
  benefitTags: [],
};

const NICHE_REGISTRY: Record<NicheSlug, NicheConfig> = {
  plumber: PLUMBER,
  electrician: ELECTRICIAN,
  restaurant: RESTAURANT,
  salon: SALON,
  auto_repair: AUTO_REPAIR,
  landscaper: LANDSCAPER,
  contractor: CONTRACTOR,
  carpenter: CARPENTER,
  generic: GENERIC,
};

/**
 * NACE prefix → niche slug. Order is significant — the first matching prefix
 * wins. Always followed by a generic fallback. Covers both the old SN2007
 * codes and the SN2025 codes Brreg uses for newer registrations.
 */
const NACE_TO_NICHE: Array<[prefix: string, slug: NicheSlug]> = [
  ["43.22", "plumber"],
  ["43.21", "electrician"],
  ["56.10", "restaurant"], // SN2007 Restaurantvirksomhet
  ["56.11", "restaurant"], // SN2025 Restaurantvirksomhet
  ["56.12", "restaurant"], // SN2025 Mobile serveringssteder
  ["96.02", "salon"], // SN2007 Frisering og annen skjønnhetspleie
  ["96.21", "salon"], // SN2025 Frisering og barbering
  ["45.20", "auto_repair"], // SN2007 Vedlikehold og reparasjon av motorvogner
  ["95.31", "auto_repair"], // SN2025 Reparasjon og vedlikehold av motorvogner
  ["81.30", "landscaper"], // Beplantning av hager og parkanlegg
  ["01.30", "landscaper"], // Planteformering — small overlap, treat as landscaper
  ["41.20", "contractor"], // Bygging av boliger og andre bygninger
  ["41.10", "contractor"], // Utvikling av byggeprosjekter
  ["43.99", "contractor"], // Annen spesialisert bygge- og anleggsvirksomhet
  ["43.39", "contractor"], // Annen ferdigjøring av bygninger
  // Snekker-spesifikke koder. Mer spesifikke enn 41.xx contractor-kodene.
  ["43.32", "carpenter"], // Snekkerarbeid (innebygging av kjøkken, dører, vinduer)
  ["16.23", "carpenter"], // Produksjon av andre bygningsartikler av tre
  // Malere (43.34) og taktekkere (43.91) faller bevisst til generic:
  // contractor-teksten handler om renovering/tilbygg og passer ikke dem.
];

export function pickNicheFromNace(naceCode: string | null | undefined): NicheSlug {
  if (!naceCode) return "generic";
  const normalized = naceCode.replace(/\.?$/, "");
  for (const [prefix, slug] of NACE_TO_NICHE) {
    if (normalized.startsWith(prefix)) return slug;
  }
  return "generic";
}

export function getNicheConfig(slug: NicheSlug): NicheConfig {
  return NICHE_REGISTRY[slug];
}

export function isNicheSlug(value: string): value is NicheSlug {
  return value in NICHE_REGISTRY;
}

export const ALL_NICHES: NicheConfig[] = (
  [
    "plumber",
    "electrician",
    "restaurant",
    "salon",
    "auto_repair",
    "landscaper",
    "contractor",
    "carpenter",
    "generic",
  ] as const
).map((slug) => NICHE_REGISTRY[slug]);
