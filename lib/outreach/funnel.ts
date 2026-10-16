import "server-only";

import { getDb } from "@/lib/db";
import type { Company } from "@/lib/db/types";
import { publicSiteUrl } from "@/lib/jobs/generate-site";
import {
  countCandidatesPerFilter,
  dailyBudget,
  selectCandidates,
} from "@/lib/jobs/outreach-daily";
import { loadCampaignConfig, type OutreachCampaignConfig } from "@/lib/outreach/campaign";
import { fylkeFromKommuneNr } from "@/lib/regions";
import { applyPlaceholders } from "@/lib/resend";
import { formatCompanyName } from "@/lib/utils";

/**
 * What the daily outreach cron sees when it runs: the same gates and the
 * same selection query (lib/jobs/outreach-daily), as a funnel + the exact
 * list it would email next, whether each lead already has a demo site,
 * and the rendered email for the first one.
 *
 * Pure read; never sends or mutates anything.
 */

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface FunnelCandidate extends Company {
  /** A demo site exists; otherwise one is generated just before sending. */
  has_site: boolean;
}

export interface DailyFunnelResult {
  config: OutreachCampaignConfig;
  stages: FunnelStage[];
  /** Who the next run emails, in order (capped by what's left of today's budget). */
  candidates: FunnelCandidate[];
  /** Total that passed every gate before the per-day cap. */
  qualifiedTotal: number;
  sentToday: number;
  remaining: number;
  /** The first candidate's email, exactly as it would be sent (minus the unsubscribe footer). */
  preview: { to: string; subject: string; body: string } | null;
}

export async function getDailyFunnel(): Promise<DailyFunnelResult> {
  const config = await loadCampaignConfig();
  const [stages, budget] = await Promise.all([countCandidatesPerFilter(config), dailyBudget(config)]);
  // Show the full cap's worth even when today's budget is spent, so the
  // operator sees who's next in line.
  const rows = await selectCandidates(config, config.maxPerDay);

  const { data: sites } = await getDb()
    .from("generated_sites")
    .select("org_nr")
    .in("org_nr", rows.map((r) => r.org_nr));
  const withSite = new Set((sites ?? []).map((s) => s.org_nr));
  const candidates = rows.map((r) => ({ ...r, has_site: withSite.has(r.org_nr) }));

  const first = candidates[0];
  const preview = first?.email
    ? (() => {
        const vars = {
          company_name: formatCompanyName(first.name),
          kommune: first.kommune,
          region: fylkeFromKommuneNr(first.kommune_nr),
          org_nr: first.org_nr,
          site_url: publicSiteUrl(first.org_nr),
          contact_name: first.contact_name,
          contact_first_name: first.contact_name?.trim().split(/\s+/)[0] ?? null,
        };
        return {
          to: first.email,
          subject: applyPlaceholders(config.subject, vars),
          body: applyPlaceholders(config.body, vars),
        };
      })()
    : null;

  return {
    config,
    stages,
    candidates,
    qualifiedTotal: stages[stages.length - 1]?.count ?? 0,
    sentToday: budget.sentToday,
    remaining: budget.remaining,
    preview,
  };
}
