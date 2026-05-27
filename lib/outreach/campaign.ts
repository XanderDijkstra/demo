import "server-only";

import { getSetting } from "@/lib/supabase/queries";

/**
 * Configuration for the daily-outreach cron. Read fresh on each run
 * so the operator can change settings without redeploying.
 */
export interface OutreachCampaignConfig {
  enabled: boolean;
  subject: string;
  body: string;
  /** Only send to leads with `score >= minScore`. */
  minScore: number;
  /** Hard cap on how many emails the cron can send in one run. */
  maxPerDay: number;
  /** Only consider leads whose org_form is one of these (case-insensitive).
   *  Empty array → no restriction. */
  allowedOrgForms: string[];
  /** Skip leads whose nace_code starts with any of these prefixes. */
  excludedNacePrefixes: string[];
}

export const CAMPAIGN_DEFAULTS: OutreachCampaignConfig = {
  enabled: false,
  subject: "Idea for {{company_name}}",
  body: [
    "Hei!",
    "",
    "Lagde en kjapp demoside til {{company_name}} basert på det jeg så.",
    "",
    "Se den her: {{site_url}}",
    "",
    "Hvis det treffer, ta en lyd. Hvis ikke, ingen stress.",
    "",
    "— Xander",
    "FX Media",
  ].join("\n"),
  minScore: 60,
  maxPerDay: 25,
  allowedOrgForms: ["AS", "ASA", "ENK"],
  excludedNacePrefixes: [],
};

export async function loadCampaignConfig(): Promise<OutreachCampaignConfig> {
  const [
    enabled,
    subject,
    body,
    minScore,
    maxPerDay,
    allowedOrgForms,
    excludedNacePrefixes,
  ] = await Promise.all([
    getSetting<boolean>("daily_outreach_enabled"),
    getSetting<string>("daily_outreach_subject"),
    getSetting<string>("daily_outreach_body"),
    getSetting<number>("daily_outreach_min_score"),
    getSetting<number>("daily_outreach_max_per_day"),
    getSetting<string[]>("daily_outreach_allowed_org_forms"),
    getSetting<string[]>("daily_outreach_excluded_nace_prefixes"),
  ]);

  return {
    enabled: enabled ?? CAMPAIGN_DEFAULTS.enabled,
    subject: subject ?? CAMPAIGN_DEFAULTS.subject,
    body: body ?? CAMPAIGN_DEFAULTS.body,
    minScore: typeof minScore === "number" ? minScore : CAMPAIGN_DEFAULTS.minScore,
    maxPerDay:
      typeof maxPerDay === "number" ? maxPerDay : CAMPAIGN_DEFAULTS.maxPerDay,
    allowedOrgForms: Array.isArray(allowedOrgForms)
      ? allowedOrgForms
      : CAMPAIGN_DEFAULTS.allowedOrgForms,
    excludedNacePrefixes: Array.isArray(excludedNacePrefixes)
      ? excludedNacePrefixes
      : CAMPAIGN_DEFAULTS.excludedNacePrefixes,
  };
}
