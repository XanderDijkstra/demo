/**
 * Proposal generator — domain types.
 *
 * Mirrors the data schema documented in the original Python reference.
 * The shape lets a form pre-fill from a SERVICE_TEMPLATE and then let
 * the operator edit any field before generating the PDF.
 */

export type ServiceType =
  | "website"
  | "meta_ads"
  | "seo"
  | "google_ads"
  | "reviews"
  | "custom";

export interface Deliverable {
  num: string; // "01" — "04"
  title: string;
  bullets: string[];
}

export interface PricingCard {
  label: string;
  amount: string; // e.g. "Gratis" / "kr 700 / mnd"
  subtitle: string; // e.g. "Etablering"
  description: string;
}

export interface PricingSummaryRow {
  label: string;
  value: string;
}

export interface Pricing {
  intro: string;
  left_card: PricingCard;
  right_card: PricingCard;
  summary_rows: PricingSummaryRow[];
}

export interface NextStep {
  num: string;
  title: string;
  desc: string;
}

export interface NextSteps {
  intro: string;
  steps: NextStep[];
}

export interface ProposalCta {
  /** Headline supports inline orange word via {{accent}}…{{/accent}} markers. */
  headline: string;
  subtext: string;
  primary: string; // e.g. "info@fx-media.no"
  secondary: string; // e.g. "+47 401 85 596"
}

export interface ProposalData {
  client_name: string;
  client_contact: string;
  proposal_date: string; // Norwegian-formatted, e.g. "12. mai 2026"
  proposal_title: string; // e.g. "Nettside Tobud"
  eyebrow: string;
  /** Hero supports inline orange word via {{accent}}…{{/accent}} markers. */
  hero: string;
  sublead: string;
  deliverables_intro: string;
  deliverables: Deliverable[]; // exactly 4
  pricing: Pricing;
  next_steps: NextSteps;
  cta: ProposalCta;
}
