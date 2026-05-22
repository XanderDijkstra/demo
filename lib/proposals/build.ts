/**
 * Build a full ProposalData from a small operator-facing form input.
 *
 * The form only collects the few decisions that vary per lead — service
 * type, prices, binding. Everything else (eyebrow, hero copy, deliverables,
 * next steps, CTA, summary table layout) comes from SERVICE_TEMPLATES with
 * the right substitutions.
 */

import {
  SERVICE_TEMPLATES,
  SERVICE_PROPOSAL_TITLE,
} from "./templates";
import type { ProposalData, ServiceType } from "./types";

export type SimpleServiceType = Exclude<ServiceType, "custom">;

export interface ProposalFormInput {
  service_type: SimpleServiceType;
  client_name: string;
  client_contact: string;
  /** Norwegian-formatted date, e.g. "12. mai 2026". */
  proposal_date: string;
  /** Monthly subscription in NOK, e.g. 700. */
  monthly_price_nok: number;
  /** If true, the left card renders "Gratis" instead of a NOK amount. */
  free_setup: boolean;
  /** Binding period text — e.g. "Ingen", "12 måneder". Defaults to "Ingen". */
  binding: string;
  /** Optional ad-budget guideline shown in the description (Meta / Google ads). */
  ad_budget?: string;
}

const NB_MONTHS = [
  "januar",
  "februar",
  "mars",
  "april",
  "mai",
  "juni",
  "juli",
  "august",
  "september",
  "oktober",
  "november",
  "desember",
] as const;

/** Format an ISO yyyy-MM-dd to Norwegian "12. mai 2026". */
export function formatNorwegianDate(iso: string): string {
  const [yStr, mStr, dStr] = iso.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return iso;
  }
  const month = NB_MONTHS[m - 1] ?? "";
  return `${d}. ${month} ${y}`;
}

/** Format an NOK amount as "kr 700 / mnd". */
export function formatMonthlyAmount(amount: number): string {
  const fmt = new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `kr ${fmt} / mnd`;
}

export function buildProposalData(input: ProposalFormInput): ProposalData {
  const tpl = SERVICE_TEMPLATES[input.service_type];
  const hero = tpl.hero_template.replace(/\{client_name\}/g, input.client_name);
  const monthly = formatMonthlyAmount(input.monthly_price_nok);

  const isAdsService =
    input.service_type === "meta_ads" || input.service_type === "google_ads";

  return {
    client_name: input.client_name,
    client_contact: input.client_contact,
    proposal_date: input.proposal_date,
    proposal_title: SERVICE_PROPOSAL_TITLE[input.service_type],
    eyebrow: tpl.default_eyebrow,
    hero,
    sublead: `Vi har satt sammen et tilbud for ${input.client_name}. Klare leveranser, åpne priser og full transparens fra start til slutt.`,
    deliverables_intro:
      "Her er nøyaktig hva som inngår i tilbudet. Ingen skjulte ledd, ingen tilleggsfakturaer for det som er listet.",
    deliverables: tpl.deliverables,
    pricing: {
      intro:
        "Vi tror på en åpen prismodell uten skjulte kostnader. Du betaler kun den månedlige driften — etablering er inkludert.",
      left_card: {
        label: "ETABLERING",
        amount: input.free_setup ? "Gratis" : "kr 0",
        subtitle: "Inkludert i tilbudet",
        description:
          "Oppsett, design og lansering er dekket. Du betaler noneting før første måned starter.",
      },
      right_card: {
        label: "MÅNEDLIG",
        amount: monthly,
        subtitle: "eks. mva.",
        description: isAdsService
          ? `Forvaltning og rapportering inkludert.${
              input.ad_budget
                ? ` Anbefalt annonsebudsjett: kr ${input.ad_budget}.`
                : ""
            }`
          : "Alt vedlikehold, mindre endringer og support er inkludert i den månedlige prisen.",
      },
      summary_rows: [
        { label: "TOTAL", value: monthly },
        {
          label: "BINDINGSTID",
          value: input.binding.trim() ? input.binding : "Ingen",
        },
        { label: "OPPSIGELSE", value: "Løpende, 1 måned" },
      ],
    },
    next_steps: {
      intro:
        "Vi gjør det enkelt å komme i gang. Fire steg fra dette tilbudet til done delivered løsning.",
      steps: [
        {
          num: "01",
          title: "Tobud godkjent",
          desc: "Du svarer på e-post eller telefon at tilbudet er greit, så er avtalen i boks.",
        },
        {
          num: "02",
          title: "Oppstartsmøte",
          desc: "Vi har et kort møte (digitalt eller fysisk) der vyesterday gjennom mål, brand og innhold.",
        },
        {
          num: "03",
          title: "Produksjon og forhåndsvisning",
          desc: "Vi setter opp leveransen og deler en forhåndsvisning du kan gi tilbakemelding på.",
        },
        {
          num: "04",
          title: "Lansering og oppfølging",
          desc: "Vi lanserer, går gjennom resultatet sammen, og følger opp månedlig fremover.",
        },
      ],
    },
    cta: {
      headline: `Klar til å {{accent}}komme i gang{{/accent}}?`,
      subtext:
        "Svar på denne e-posten eller ring direkte. Vi er enkle å få tak i — og kjapp på respons.",
      primary: "info@fx-media.no",
      secondary: "+47 401 85 596",
    },
  };
}
