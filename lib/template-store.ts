import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type {
  NicheTemplateRow,
  NicheTemplateUpdate,
} from "@/lib/supabase/types";
import {
  ALL_NICHES,
  getNicheConfig as getInCodeNicheConfig,
  isNicheSlug,
  type NicheConfig,
  type NicheSlug,
} from "@/lib/templates";

/**
 * The DB row shape may drift from the in-code defaults over time
 * (operator edits). This helper coerces the row into the strict
 * NicheConfig shape the renderer expects, falling back to in-code
 * defaults when the row is missing or malformed.
 */
function rowToConfig(slug: NicheSlug, row: NicheTemplateRow): NicheConfig {
  const fallback = getInCodeNicheConfig(slug);

  const services = Array.isArray(row.services)
    ? row.services
        .filter(
          (s): s is { title: string; description: string } =>
            !!s &&
            typeof s === "object" &&
            typeof (s as { title: unknown }).title === "string" &&
            typeof (s as { description: unknown }).description === "string"
        )
        .slice(0, 3)
    : [];
  while (services.length < 3) services.push(fallback.services[services.length]!);

  const benefits = Array.isArray(row.benefit_tags)
    ? row.benefit_tags.filter((b): b is string => typeof b === "string").slice(0, 3)
    : [];
  while (benefits.length < 3) benefits.push(fallback.benefitTags[benefits.length]!);

  return {
    slug,
    displayName: row.display_name || fallback.displayName,
    primaryColor: row.primary_color || fallback.primaryColor,
    accentColor: row.accent_color || fallback.accentColor,
    heroImageKeyword: row.hero_image_keyword || fallback.heroImageKeyword,
    ctaText: row.cta_text || fallback.ctaText,
    services: services as NicheConfig["services"],
    benefitTags: benefits as NicheConfig["benefitTags"],
  };
}

/**
 * Load a single niche config from the DB, falling back to the in-code
 * default if the row is missing.
 */
export async function loadNicheConfig(slug: NicheSlug): Promise<NicheConfig> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("niche_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return getInCodeNicheConfig(slug);
  return rowToConfig(slug, data as NicheTemplateRow);
}

export interface NicheConfigWithMeta extends NicheConfig {
  updatedAt: string | null;
  source: "db" | "default";
}

/**
 * Load every niche config, joined to the in-code list so newly added
 * niches surface in the admin UI even if their DB row hasn't been
 * seeded yet.
 */
export async function loadAllNiches(): Promise<NicheConfigWithMeta[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("niche_templates").select("*");
  const byKey = new Map<string, NicheTemplateRow>();
  for (const row of (data ?? []) as NicheTemplateRow[]) {
    byKey.set(row.slug, row);
  }

  return ALL_NICHES.map((fallback) => {
    const row = byKey.get(fallback.slug);
    if (row) {
      return {
        ...rowToConfig(fallback.slug, row),
        updatedAt: row.updated_at,
        source: "db" as const,
      };
    }
    return { ...fallback, updatedAt: null, source: "default" as const };
  });
}

export interface SaveNicheTemplateInput {
  display_name: string;
  primary_color: string;
  accent_color: string;
  hero_image_keyword: string;
  cta_text: string;
  services: Array<{ title: string; description: string }>;
  benefit_tags: string[];
}

export async function saveNicheTemplate(
  slug: string,
  input: SaveNicheTemplateInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isNicheSlug(slug)) {
    return { ok: false, error: "Ugyldig mal-slug" };
  }

  const supabase = getSupabaseAdmin();
  const update: NicheTemplateUpdate = {
    display_name: input.display_name,
    primary_color: input.primary_color,
    accent_color: input.accent_color,
    hero_image_keyword: input.hero_image_keyword,
    cta_text: input.cta_text,
    services: input.services,
    benefit_tags: input.benefit_tags,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("niche_templates").upsert(
    {
      slug,
      ...update,
      // Required fields on insert — Update is partial.
      display_name: update.display_name!,
      primary_color: update.primary_color!,
      accent_color: update.accent_color!,
      hero_image_keyword: update.hero_image_keyword!,
      cta_text: update.cta_text!,
    },
    { onConflict: "slug" }
  );

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "templates.niche.updated",
    entity_type: "niche_template",
    entity_id: slug,
  });

  return { ok: true };
}

/**
 * Delete the DB row so the niche reverts to the in-code default.
 */
export async function resetNicheTemplate(
  slug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isNicheSlug(slug)) return { ok: false, error: "Ugyldig mal-slug" };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("niche_templates")
    .delete()
    .eq("slug", slug);
  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "templates.niche.reset",
    entity_type: "niche_template",
    entity_id: slug,
  });

  return { ok: true };
}
