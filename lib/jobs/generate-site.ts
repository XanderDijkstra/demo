import "server-only";

import { generateSiteCopy } from "@/lib/claude";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getNicheConfig,
  isNicheSlug,
  pickNicheFromNace,
  type NicheSlug,
} from "@/lib/templates";

export interface GenerateLeadSiteResult {
  ok: boolean;
  error?: string;
  siteUrl?: string;
  niche?: NicheSlug;
  model?: string;
}

function buildSiteUrl(orgNr: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  // Trim trailing slash so we don't end up with "//".
  const normalized = base.replace(/\/$/, "");
  return `${normalized}/p/${orgNr}`;
}

/**
 * Generate (or regenerate) a demo site for a given lead.
 *
 * If `nicheOverride` is supplied it bypasses NACE-based detection and
 * marks the row as operator-overridden. Otherwise the niche is derived
 * from the company's NACE code (falls back to "generic").
 *
 * Atomic upsert at the end — a Claude failure leaves any previous
 * published version intact.
 */
export async function runGenerateLeadSite(params: {
  orgNr: string;
  nicheOverride?: NicheSlug | null;
}): Promise<GenerateLeadSiteResult> {
  if (!/^\d{9}$/.test(params.orgNr)) {
    return { ok: false, error: "Ugyldig org.nr" };
  }
  if (params.nicheOverride && !isNicheSlug(params.nicheOverride)) {
    return { ok: false, error: "Ugyldig niche" };
  }

  const supabase = getSupabaseAdmin();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("org_nr, name, kommune, nace_code, nace_description")
    .eq("org_nr", params.orgNr)
    .maybeSingle();

  if (companyError) return { ok: false, error: companyError.message };
  if (!company) return { ok: false, error: "Lead ikke funnet" };

  const niche: NicheSlug =
    params.nicheOverride ?? pickNicheFromNace(company.nace_code);
  const nicheConfig = getNicheConfig(niche);

  const result = await generateSiteCopy({
    company: {
      name: company.name,
      kommune: company.kommune,
      nace_description: company.nace_description,
    },
    niche: nicheConfig,
  });

  if (!result.ok) {
    await supabase.from("audit_log").insert({
      actor: "manual",
      action: "site.generate.failed",
      entity_type: "company",
      entity_id: company.org_nr,
      metadata: { niche, error: result.error },
    });
    return { ok: false, error: result.error };
  }

  const { error: upsertError } = await supabase.from("generated_sites").upsert(
    {
      org_nr: company.org_nr,
      niche_slug: niche,
      niche_overridden: !!params.nicheOverride,
      content_json: result.content,
      generated_at: new Date().toISOString(),
      generated_by_model: result.model,
      generation_input_tokens: result.usage.input,
      generation_output_tokens: result.usage.output,
    },
    { onConflict: "org_nr" }
  );

  if (upsertError) return { ok: false, error: upsertError.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "site.generate.success",
    entity_type: "company",
    entity_id: company.org_nr,
    metadata: {
      niche,
      overridden: !!params.nicheOverride,
      model: result.model,
      usage: result.usage,
    },
  });

  return {
    ok: true,
    niche,
    model: result.model,
    siteUrl: buildSiteUrl(company.org_nr),
  };
}

export async function unpublishLeadSite(
  orgNr: string
): Promise<{ ok: boolean; error?: string }> {
  if (!/^\d{9}$/.test(orgNr)) {
    return { ok: false, error: "Ugyldig org.nr" };
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("generated_sites")
    .delete()
    .eq("org_nr", orgNr);

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "site.unpublished",
    entity_type: "company",
    entity_id: orgNr,
  });

  return { ok: true };
}

export function publicSiteUrl(orgNr: string): string {
  return buildSiteUrl(orgNr);
}
