/**
 * Niche taxonomy for the auto-generated demo sites.
 *
 * One source of truth for:
 *   - Each niche template + a generic fallback
 *   - NACE prefix → niche slug mapping
 *   - Per-niche brand colour, hero image keyword, services, CTA
 *
 * Most niches render through the generic `components/site/template.tsx`.
 * Niches that need bespoke layouts (e.g. landscaper) have a dedicated
 * component under `components/site/templates/{slug}.tsx` and are
 * dispatched on slug in the public + preview routes.
 */

export type NicheSlug =
  | "plumber"
  | "electrician"
  | "restaurant"
  | "salon"
  | "auto_repair"
  | "landscaper"
  | "generic";

export interface NicheService {
  title: string;
  description: string;
}

export type HeroLayout = "split" | "centered" | "overlay";

export interface NicheConfig {
  slug: NicheSlug;
  /** Norwegian display name shown to operators in the niche dropdown. */
  displayName: string;
  /** Tailwind-friendly CSS variable for the primary brand colour (oklch). */
  primaryColor: string;
  /** Lighter accent for hero gradients. */
  accentColor: string;
  /** Unsplash query used for the hero background image. */
  heroImageKeyword: string;
  /** Hero composition variant the renderer will pick. */
  heroLayout: HeroLayout;
  /** Services rendered in the services section. Most niches list 3; some
   *  (landscaper) have a 6-card grid. Always at least 3. */
  services: NicheService[];
  /** Call-to-action label on every CTA button. */
  ctaText: string;
  /** Short benefit chips in the hero. Most niches list 3. */
  benefitTags: string[];
}

const PLUMBER: NicheConfig = {
  slug: "plumber",
  displayName: "Rørlegger",
  primaryColor: "oklch(0.55 0.16 245)",
  accentColor: "oklch(0.92 0.04 245)",
  heroImageKeyword: "plumber",
  heroLayout: "split",
  services: [
    {
      title: "Akutt rørleggerhjelp",
      description:
        "Vannlekkasje, tett avløp eller frosne rør? Vi rykker ut samme dag.",
    },
    {
      title: "Bad og våtrom",
      description:
        "Komplett renovering med våtromssertifikat og fagansvar fra start til slutt.",
    },
    {
      title: "Service og vedlikehold",
      description:
        "Faste serviceavtaler som forebygger lekkasjer og forlenger levetid.",
    },
  ],
  ctaText: "Bestill befaring",
  benefitTags: ["Døgnvakt", "Fastpris", "5 års garanti"],
};

const ELECTRICIAN: NicheConfig = {
  slug: "electrician",
  displayName: "Elektriker",
  primaryColor: "oklch(0.7 0.18 90)",
  accentColor: "oklch(0.95 0.05 90)",
  heroImageKeyword: "electrician",
  heroLayout: "split",
  services: [
    {
      title: "El-sjekk for bolig",
      description:
        "Få oversikt over anleggets tilstand med rapport og forsikringsgyldig kontroll.",
    },
    {
      title: "Smarthus og lading",
      description:
        "Installasjon av elbillader, smarte lyskontroller og nettverk i hele boligen.",
    },
    {
      title: "Næring og industri",
      description:
        "Prosjektering og utførelse for kontorbygg, butikker og verksteder.",
    },
  ],
  ctaText: "Be om tilbud",
  benefitTags: ["NEK 400", "Sentral godkjenning", "Fast elektriker"],
};

const RESTAURANT: NicheConfig = {
  slug: "restaurant",
  displayName: "Restaurant",
  primaryColor: "oklch(0.55 0.18 30)",
  accentColor: "oklch(0.95 0.04 30)",
  heroImageKeyword: "restaurant",
  heroLayout: "overlay",
  services: [
    {
      title: "Lunsj og middag",
      description:
        "Fersk meny basert på sesongens råvarer fra lokale produsenter.",
    },
    {
      title: "Selskap og catering",
      description:
        "Bryllup, runde tall, firmafest. Vi planlegger og leverer hele opplevelsen.",
    },
    {
      title: "Take-away",
      description:
        "Bestill via nett — klart til avhentning på 20 minutter.",
    },
  ],
  ctaText: "Reserver bord",
  benefitTags: ["Lokale råvarer", "Catering", "Vegetar / vegan"],
};

const SALON: NicheConfig = {
  slug: "salon",
  displayName: "Frisør",
  primaryColor: "oklch(0.6 0.16 350)",
  accentColor: "oklch(0.96 0.04 350)",
  heroImageKeyword: "hair-salon",
  heroLayout: "centered",
  services: [
    {
      title: "Klipp og styling",
      description:
        "Personlig konsultasjon, presisjonsklipp og moderne styling for alle hårtyper.",
    },
    {
      title: "Farge og striper",
      description:
        "Balayage, highlights og fargefornying med skånsomme, profesjonelle produkter.",
    },
    {
      title: "Brud og bryllup",
      description:
        "Hår og oppsett til den store dagen — prøvetime inkludert.",
    },
  ],
  ctaText: "Book time",
  benefitTags: ["Online booking", "Erfarne frisører", "Plant-based produkter"],
};

const AUTO_REPAIR: NicheConfig = {
  slug: "auto_repair",
  displayName: "Bilverksted",
  primaryColor: "oklch(0.5 0.2 25)",
  accentColor: "oklch(0.95 0.04 25)",
  heroImageKeyword: "auto-repair",
  heroLayout: "split",
  services: [
    {
      title: "EU-kontroll",
      description:
        "Godkjent kontrollverksted. Vi henter og leverer bilen om du ønsker.",
    },
    {
      title: "Service og reparasjon",
      description:
        "Fra olje­skift til motorrenovering — alle merker, fast pris på vanlige jobber.",
    },
    {
      title: "Dekk og hjul",
      description:
        "Hjulskift, oppbevaring av dekk og avansert hjulstilling i moderne lokaler.",
    },
  ],
  ctaText: "Bestill verkstedtime",
  benefitTags: ["Lånebil", "Alle merker", "Fast pris"],
};

const LANDSCAPER: NicheConfig = {
  slug: "landscaper",
  displayName: "Anleggsgartner",
  // Dark forest green as primary; cream as accent. Lime CTA is hardcoded
  // inside components/site/templates/landscaper.tsx since it's an identity
  // signal of this template.
  primaryColor: "oklch(0.32 0.05 145)",
  accentColor: "oklch(0.94 0.03 85)",
  heroImageKeyword: "japanese-garden",
  heroLayout: "overlay",
  services: [
    {
      title: "Plenanlegg",
      description:
        "Gressplen og innsådd med øye for jordkvalitet og et stramt sluttresultat.",
    },
    {
      title: "Steinarbeid",
      description:
        "Solid steinlegging, oppkjørsler og terrasser som varer i mange år.",
    },
    {
      title: "Gjerder",
      description:
        "Skreddersydde gjerder og levegger for personvern og en pen utstråling.",
    },
    {
      title: "Hagerenovasjon",
      description:
        "Komplett forvandling av hagen, fra prosjektering til siste plante.",
    },
    {
      title: "Grunnarbeid",
      description:
        "Utgraving, planering og drenering — det stødige fundamentet for alt vi bygger.",
    },
    {
      title: "Vedlikehold",
      description:
        "Profesjonell beskjæring og periodisk stell som holder hagen i toppform.",
    },
  ],
  ctaText: "Be om tilbud",
  benefitTags: ["10+ års erfaring", "Fast pris", "Personlig service"],
};

const GENERIC: NicheConfig = {
  slug: "generic",
  displayName: "Generell",
  primaryColor: "oklch(0.6 0.118 184.704)",
  accentColor: "oklch(0.95 0.03 184)",
  heroImageKeyword: "norwegian-business",
  heroLayout: "split",
  services: [
    {
      title: "Personlig service",
      description:
        "Vi tar oss tid til å forstå behovene dine og leverer løsninger som passer.",
    },
    {
      title: "Lokal forankring",
      description:
        "Etablert i nærområdet med kjennskap til kundene og markedet i regionen.",
    },
    {
      title: "Kvalitet i alle ledd",
      description:
        "Fra første kontakt til ferdig leveranse — kvalitet er hovedfokus.",
    },
  ],
  ctaText: "Ta kontakt",
  benefitTags: ["Lokal", "Erfaren", "Pålitelig"],
};

const NICHE_REGISTRY: Record<NicheSlug, NicheConfig> = {
  plumber: PLUMBER,
  electrician: ELECTRICIAN,
  restaurant: RESTAURANT,
  salon: SALON,
  auto_repair: AUTO_REPAIR,
  landscaper: LANDSCAPER,
  generic: GENERIC,
};

/**
 * NACE prefix → niche slug. Order is significant — the first matching prefix
 * wins. Always followed by a generic fallback.
 */
const NACE_TO_NICHE: Array<[prefix: string, slug: NicheSlug]> = [
  ["43.22", "plumber"],
  ["43.21", "electrician"],
  ["56.10", "restaurant"],
  ["96.02", "salon"],
  ["45.20", "auto_repair"],
  ["81.30", "landscaper"], // Beplantning av hager og parkanlegg
  ["01.30", "landscaper"], // Planteformering — small overlap, treat as landscaper
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
    "generic",
  ] as const
).map((slug) => NICHE_REGISTRY[slug]);
