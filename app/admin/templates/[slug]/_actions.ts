"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  deleteTemplateReferenceFile,
  uploadTemplateReference,
} from "@/lib/storage";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  resetNicheTemplate,
  saveNicheTemplate,
} from "@/lib/template-store";
import { extractDesignDna } from "@/lib/template-vision";
import { isNicheSlug } from "@/lib/templates";
import type { VisionSummary } from "@/lib/supabase/types";

type ActionResult = { ok: true } | { ok: false; error: string };

const ServiceSchema = z.object({
  title: z.string().trim().min(1, "Tittel mangler").max(80),
  description: z.string().trim().min(1, "Beskrivelse mangler").max(280),
});

const SaveSchema = z.object({
  display_name: z.string().trim().min(1).max(40),
  primary_color: z.string().trim().min(3).max(80),
  accent_color: z.string().trim().min(3).max(80),
  hero_image_keyword: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9 ,\-]+$/i, "Bare bokstaver, tall, mellomrom og bindestrek"),
  hero_layout: z.enum(["split", "centered", "overlay"]),
  cta_text: z.string().trim().min(1).max(40),
  services: z.array(ServiceSchema).length(3, "Trenger nøyaktig 3 tjenester"),
  benefit_tags: z
    .array(z.string().trim().min(1).max(40))
    .length(3, "Trenger nøyaktig 3 fordeler"),
  design_brief: z
    .string()
    .trim()
    .max(2000, "Maks 2000 tegn")
    .optional()
    .nullable(),
});

export async function saveTemplateAction(
  slug: string,
  formData: FormData
): Promise<ActionResult> {
  if (!isNicheSlug(slug)) return { ok: false, error: "Ugyldig mal" };

  const services = [0, 1, 2].map((i) => ({
    title: String(formData.get(`service_${i}_title`) ?? ""),
    description: String(formData.get(`service_${i}_description`) ?? ""),
  }));
  const benefit_tags = [0, 1, 2].map((i) =>
    String(formData.get(`benefit_${i}`) ?? "")
  );

  const briefRaw = formData.get("design_brief");
  const parsed = SaveSchema.safeParse({
    display_name: formData.get("display_name"),
    primary_color: formData.get("primary_color"),
    accent_color: formData.get("accent_color"),
    hero_image_keyword: formData.get("hero_image_keyword"),
    hero_layout: formData.get("hero_layout"),
    cta_text: formData.get("cta_text"),
    services,
    benefit_tags,
    design_brief:
      typeof briefRaw === "string" && briefRaw.trim() ? briefRaw : null,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ugyldig input",
    };
  }

  const result = await saveNicheTemplate(slug, parsed.data);
  if (!result.ok) return result;

  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${slug}`);
  revalidatePath(`/preview/${slug}`);
  // Already-published demo sites will reflect the new niche styling
  // because they call loadNicheConfig() at render time.
  return { ok: true };
}

export async function resetTemplateAction(
  slug: string
): Promise<ActionResult> {
  if (!isNicheSlug(slug)) return { ok: false, error: "Ugyldig mal" };
  const result = await resetNicheTemplate(slug);
  if (!result.ok) return result;
  revalidatePath("/admin/templates");
  revalidatePath(`/admin/templates/${slug}`);
  revalidatePath(`/preview/${slug}`);
  return { ok: true };
}

// ─── Design references ──────────────────────────────────────────────────────

export async function uploadReferenceAction(
  slug: string,
  formData: FormData
): Promise<ActionResult & { id?: string; url?: string }> {
  if (!isNicheSlug(slug)) return { ok: false, error: "Ugyldig mal" };

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Mangler fil" };
  }
  const labelRaw = formData.get("label");
  const label =
    typeof labelRaw === "string" && labelRaw.trim()
      ? labelRaw.trim().slice(0, 120)
      : null;

  const upload = await uploadTemplateReference(slug, file);
  if (!upload.ok) return { ok: false, error: upload.error };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("template_references")
    .insert({
      niche_slug: slug,
      storage_path: upload.reference.storagePath,
      public_url: upload.reference.publicUrl,
      label,
    })
    .select("id, public_url")
    .single();

  if (error) {
    // Best-effort cleanup of the orphaned storage object.
    await deleteTemplateReferenceFile(upload.reference.storagePath);
    return { ok: false, error: error.message };
  }

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "templates.reference.uploaded",
    entity_type: "niche_template",
    entity_id: slug,
    metadata: { id: data.id, label },
  });

  revalidatePath(`/admin/templates/${slug}`);
  return { ok: true, id: data.id, url: data.public_url };
}

export async function deleteReferenceAction(
  slug: string,
  referenceId: string
): Promise<ActionResult> {
  if (!isNicheSlug(slug)) return { ok: false, error: "Ugyldig mal" };

  const supabase = getSupabaseAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("template_references")
    .select("storage_path, niche_slug")
    .eq("id", referenceId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!row || row.niche_slug !== slug) {
    return { ok: false, error: "Referanse ikke funnet" };
  }

  await deleteTemplateReferenceFile(row.storage_path);

  const { error: deleteError } = await supabase
    .from("template_references")
    .delete()
    .eq("id", referenceId);

  if (deleteError) return { ok: false, error: deleteError.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "templates.reference.deleted",
    entity_type: "niche_template",
    entity_id: slug,
    metadata: { reference_id: referenceId },
  });

  revalidatePath(`/admin/templates/${slug}`);
  return { ok: true };
}

export async function extractDnaAction(
  slug: string,
  referenceId: string
): Promise<ActionResult & { summary?: VisionSummary }> {
  if (!isNicheSlug(slug)) return { ok: false, error: "Ugyldig mal" };

  const supabase = getSupabaseAdmin();
  const { data: row, error: fetchError } = await supabase
    .from("template_references")
    .select("public_url, niche_slug")
    .eq("id", referenceId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: fetchError.message };
  if (!row || row.niche_slug !== slug) {
    return { ok: false, error: "Referanse ikke funnet" };
  }

  // Pull the niche's design brief so it influences the per-image extraction
  // too — the operator's authoritative notes always travel with the call.
  const { data: nicheRow } = await supabase
    .from("niche_templates")
    .select("design_brief")
    .eq("slug", slug)
    .maybeSingle();

  const result = await extractDesignDna({
    imageUrls: [row.public_url],
    designBrief: nicheRow?.design_brief ?? null,
  });
  if (!result.ok) return { ok: false, error: result.error };

  const { error: updateError } = await supabase
    .from("template_references")
    .update({
      vision_summary: result.summary,
      vision_model: result.model,
      vision_extracted_at: new Date().toISOString(),
    })
    .eq("id", referenceId);

  if (updateError) return { ok: false, error: updateError.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "templates.reference.dna_extracted",
    entity_type: "niche_template",
    entity_id: slug,
    metadata: {
      reference_id: referenceId,
      model: result.model,
      usage: result.usage,
      summary: result.summary,
    },
  });

  revalidatePath(`/admin/templates/${slug}`);
  return { ok: true, summary: result.summary };
}

/**
 * Run Claude vision across every reference for a niche in one call,
 * augmented by the niche's design_brief. The combined summary is
 * persisted on the niche_templates row so it survives reloads.
 */
export async function extractCombinedDnaAction(
  slug: string
): Promise<
  ActionResult & {
    summary?: VisionSummary;
    referenceCount?: number;
    model?: string;
  }
> {
  if (!isNicheSlug(slug)) return { ok: false, error: "Ugyldig mal" };

  const supabase = getSupabaseAdmin();
  const [refsRes, nicheRes] = await Promise.all([
    supabase
      .from("template_references")
      .select("public_url")
      .eq("niche_slug", slug)
      .order("uploaded_at", { ascending: false })
      .limit(8), // Cap to keep the request and token usage bounded.
    supabase
      .from("niche_templates")
      .select("design_brief")
      .eq("slug", slug)
      .maybeSingle(),
  ]);

  if (refsRes.error) return { ok: false, error: refsRes.error.message };
  const urls = (refsRes.data ?? []).map((r) => r.public_url);
  const brief = nicheRes.data?.design_brief ?? null;

  if (urls.length === 0 && !brief?.trim()) {
    return {
      ok: false,
      error: "Ingen referanser eller design-notat å analysere",
    };
  }

  const result = await extractDesignDna({
    imageUrls: urls,
    designBrief: brief,
  });
  if (!result.ok) return { ok: false, error: result.error };

  const { error: updateError } = await supabase
    .from("niche_templates")
    .update({
      combined_dna_summary: result.summary,
      combined_dna_extracted_at: new Date().toISOString(),
      combined_dna_model: result.model,
    })
    .eq("slug", slug);

  if (updateError) return { ok: false, error: updateError.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "templates.combined_dna_extracted",
    entity_type: "niche_template",
    entity_id: slug,
    metadata: {
      reference_count: urls.length,
      brief_length: brief?.length ?? 0,
      model: result.model,
      usage: result.usage,
      summary: result.summary,
    },
  });

  revalidatePath(`/admin/templates/${slug}`);
  return {
    ok: true,
    summary: result.summary,
    referenceCount: urls.length,
    model: result.model,
  };
}
