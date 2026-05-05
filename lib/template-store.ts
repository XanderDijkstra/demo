import "server-only";

import {
  ALL_NICHES,
  getNicheConfig as getInCodeNicheConfig,
  type NicheConfig,
  type NicheSlug,
} from "@/lib/templates";

/**
 * Templates are code-driven. The DB tables (niche_templates,
 * template_references) are intentionally ignored here — design work happens
 * in this repo (lib/templates.ts + components/site/template.tsx) and is
 * deployed via git push, not edited from the dashboard.
 *
 * If you ever want the live-edit layer back, swap loadNicheConfig() to
 * read from `niche_templates` again (the table and types remain intact).
 */

export async function loadNicheConfig(slug: NicheSlug): Promise<NicheConfig> {
  return getInCodeNicheConfig(slug);
}

export interface NicheConfigWithMeta extends NicheConfig {
  /** Reserved for the future live-edit layer; always null in the
   *  code-driven mode the dashboard runs in today. */
  updatedAt: string | null;
  source: "code";
}

export async function loadAllNiches(): Promise<NicheConfigWithMeta[]> {
  return ALL_NICHES.map((cfg) => ({
    ...cfg,
    updatedAt: null,
    source: "code" as const,
  }));
}
