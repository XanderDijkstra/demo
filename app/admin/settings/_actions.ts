"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { scoreCompanyInsert } from "@/lib/scoring";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  getScoringWeights,
  getTargetNaceCodes,
} from "@/lib/supabase/queries";
import type { Company, ScoringWeights } from "@/lib/supabase/types";

type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

// ─── Scoring weights ─────────────────────────────────────────────────────────

const WeightsSchema = z.object({
  has_phone: z.coerce.number().int().min(0).max(100),
  org_form_as: z.coerce.number().int().min(0).max(100),
  target_nace: z.coerce.number().int().min(0).max(100),
  has_website: z.coerce.number().int().min(0).max(100),
  has_real_address: z.coerce.number().int().min(0).max(100),
  freshly_founded: z.coerce.number().int().min(0).max(100),
}) satisfies z.ZodType<ScoringWeights>;

export async function saveScoringWeights(
  formData: FormData
): Promise<ActionResult> {
  const parsed = WeightsSchema.safeParse({
    has_phone: formData.get("has_phone"),
    org_form_as: formData.get("org_form_as"),
    target_nace: formData.get("target_nace"),
    has_website: formData.get("has_website"),
    has_real_address: formData.get("has_real_address"),
    freshly_founded: formData.get("freshly_founded"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Ugyldige verdier (0–100 per signal)" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("settings").upsert(
    { key: "scoring_weights", value: parsed.data, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.scoring_weights.updated",
    entity_type: "settings",
    entity_id: "scoring_weights",
    metadata: parsed.data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { ok: true, message: "Vekter oppdatert" };
}

// ─── Target NACE codes ───────────────────────────────────────────────────────

function parseLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveTargetNaceCodes(
  formData: FormData
): Promise<ActionResult> {
  const raw = String(formData.get("codes") ?? "");
  const codes = parseLines(raw);

  // Sanity: NACE codes look like "43.22" or "43.220" — digits and dots.
  const invalid = codes.filter((c) => !/^\d{2}(\.\d{1,3})?$/.test(c));
  if (invalid.length > 0) {
    return {
      ok: false,
      error: `Ugyldige NACE-koder: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`,
    };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("settings").upsert(
    { key: "target_nace_codes", value: codes, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.target_nace_codes.updated",
    entity_type: "settings",
    entity_id: "target_nace_codes",
    metadata: { codes },
  });

  revalidatePath("/admin/settings");
  return { ok: true, message: `Lagret ${codes.length} NACE-koder` };
}

// ─── Excluded org forms ──────────────────────────────────────────────────────

export async function saveExcludedOrgForms(
  formData: FormData
): Promise<ActionResult> {
  const raw = String(formData.get("forms") ?? "");
  const forms = parseLines(raw).map((f) => f.toUpperCase());

  const invalid = forms.filter((f) => !/^[A-Z]{2,8}$/.test(f));
  if (invalid.length > 0) {
    return {
      ok: false,
      error: `Ugyldige selskapsformer: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`,
    };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("settings").upsert(
    { key: "excluded_org_forms", value: forms, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.excluded_org_forms.updated",
    entity_type: "settings",
    entity_id: "excluded_org_forms",
    metadata: { forms },
  });

  revalidatePath("/admin/settings");
  return { ok: true, message: `Lagret ${forms.length} ekskluderte former` };
}

// ─── Outreach FROM address ───────────────────────────────────────────────────

const FromAddressSchema = z
  .string()
  .trim()
  .min(5)
  .max(254)
  // Accept either "name@domain.tld" or "Display Name <name@domain.tld>".
  .regex(
    /^(?:[^<>]+<\s*)?[^\s<>@]+@[^\s<>@]+\.[a-z]{2,}\s*>?$/i,
    "Bruk format «Display Name <addr@domene.no>» eller «addr@domene.no»"
  );

export async function saveOutreachFromAddress(
  formData: FormData
): Promise<ActionResult> {
  const parsed = FromAddressSchema.safeParse(formData.get("from"));
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ugyldig adresse",
    };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("settings").upsert(
    { key: "outreach_email_from", value: parsed.data, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.outreach_email_from.updated",
    entity_type: "settings",
    entity_id: "outreach_email_from",
    metadata: { from: parsed.data },
  });

  revalidatePath("/admin/settings");
  return { ok: true, message: "Avsenderadresse lagret" };
}

// ─── Suppressions ────────────────────────────────────────────────────────────

const ManualSuppressionSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  notes: z.string().trim().max(500).optional().nullable(),
});

export async function addManualSuppression(
  formData: FormData
): Promise<ActionResult> {
  const parsed = ManualSuppressionSchema.safeParse({
    email: formData.get("email"),
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { ok: false, error: "Ugyldig e-postadresse" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("outreach_suppressions").upsert(
    {
      email: parsed.data.email,
      reason: "manual",
      notes: parsed.data.notes ?? null,
    },
    { onConflict: "email" }
  );

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.suppression.added",
    entity_type: "outreach_suppression",
    entity_id: parsed.data.email,
    metadata: { reason: "manual", notes: parsed.data.notes ?? null },
  });

  revalidatePath("/admin/settings");
  return { ok: true, message: "Adresse lagt til i suppression list" };
}

export async function removeSuppression(
  email: string
): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: false, error: "Tom adresse" };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("outreach_suppressions")
    .delete()
    .eq("email", normalized);

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.suppression.removed",
    entity_type: "outreach_suppression",
    entity_id: normalized,
    metadata: { email: normalized },
  });

  revalidatePath("/admin/settings");
  return { ok: true, message: "Fjernet fra suppression list" };
}

// ─── Re-score all leads ──────────────────────────────────────────────────────

export async function rescoreAllLeads(): Promise<
  ActionResult & { count?: number }
> {
  const supabase = getSupabaseAdmin();

  const [weights, targets] = await Promise.all([
    getScoringWeights(),
    getTargetNaceCodes(),
  ]);

  if (!weights || !targets) {
    return { ok: false, error: "Mangler innstillinger i databasen" };
  }

  const { data, error } = await supabase.from("companies").select("*");
  if (error) return { ok: false, error: error.message };

  const all = (data ?? []) as Company[];

  // Compute new score per row and update only that pair of fields.
  // Sequential batches to avoid hammering the DB.
  let updated = 0;
  const BATCH = 100;
  for (let i = 0; i < all.length; i += BATCH) {
    const slice = all.slice(i, i + BATCH);
    const updates = slice.map(async (c) => {
      const { score, breakdown } = scoreCompanyInsert(c, weights, targets);
      const { error: upErr } = await supabase
        .from("companies")
        .update({ score, score_breakdown: breakdown })
        .eq("org_nr", c.org_nr);
      if (upErr) throw new Error(upErr.message);
    });
    await Promise.all(updates);
    updated += slice.length;
  }

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.rescore_all",
    entity_type: "settings",
    entity_id: "rescore",
    metadata: { count: updated },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/leads");
  revalidatePath("/admin");

  return { ok: true, count: updated, message: `${updated} leads rescoret` };
}
