"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  resetNicheTemplate,
  saveNicheTemplate,
} from "@/lib/template-store";
import { isNicheSlug } from "@/lib/templates";

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
  cta_text: z.string().trim().min(1).max(40),
  services: z.array(ServiceSchema).length(3, "Trenger nøyaktig 3 tjenester"),
  benefit_tags: z
    .array(z.string().trim().min(1).max(40))
    .length(3, "Trenger nøyaktig 3 fordeler"),
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

  const parsed = SaveSchema.safeParse({
    display_name: formData.get("display_name"),
    primary_color: formData.get("primary_color"),
    accent_color: formData.get("accent_color"),
    hero_image_keyword: formData.get("hero_image_keyword"),
    cta_text: formData.get("cta_text"),
    services,
    benefit_tags,
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
