"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  getOne1881Config,
  lookupByOrgNr,
  type One1881Contact,
} from "@/lib/enrichment/one1881";
import { runBrregDailyScrape } from "@/lib/jobs/brreg-daily";
import { enrich1881Batch } from "@/lib/jobs/enrich-1881-batch";
import { scrapeEmailsBatch } from "@/lib/jobs/scrape-emails-batch";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function triggerScrapeNow(formData: FormData) {
  const dateRaw = formData.get("date");
  const date =
    typeof dateRaw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateRaw)
      ? dateRaw
      : undefined;

  const result = await runBrregDailyScrape({
    targetDate: date,
    triggeredBy: "manual",
  });

  revalidatePath("/admin/queue");
  revalidatePath("/admin");
  revalidatePath("/admin/leads");

  return result;
}

export async function triggerEmailBatchScrape(formData: FormData) {
  const daysRaw = formData.get("days");
  const limitRaw = formData.get("limit");

  const daysSince =
    typeof daysRaw === "string" && /^\d+$/.test(daysRaw)
      ? Math.max(1, Math.min(30, parseInt(daysRaw, 10)))
      : 4;
  const limit =
    typeof limitRaw === "string" && /^\d+$/.test(limitRaw)
      ? Math.max(1, Math.min(200, parseInt(limitRaw, 10)))
      : 50;

  try {
    const result = await scrapeEmailsBatch({ daysSince, limit });
    revalidatePath("/admin/queue");
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return result;
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Cron settings ────────────────────────────────────────────────────────

const CronSettingsSchema = z.object({
  enabled: z.coerce.boolean(),
  day_offset: z.coerce.number().int().min(0).max(365),
});

export type CronSettingsResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export async function saveBrregCronSettings(
  formData: FormData
): Promise<CronSettingsResult> {
  const parsed = CronSettingsSchema.safeParse({
    // Unchecked checkboxes don't submit a value — treat absence as false.
    enabled: formData.get("enabled") === "on",
    day_offset: formData.get("day_offset"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ugyldig verdi",
    };
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const [r1, r2] = await Promise.all([
    supabase.from("settings").upsert(
      { key: "brreg_cron_enabled", value: parsed.data.enabled, updated_at: now },
      { onConflict: "key" }
    ),
    supabase.from("settings").upsert(
      {
        key: "brreg_cron_day_offset",
        value: parsed.data.day_offset,
        updated_at: now,
      },
      { onConflict: "key" }
    ),
  ]);
  if (r1.error || r2.error) {
    return {
      ok: false,
      error: r1.error?.message ?? r2.error?.message ?? "Unknown DB error",
    };
  }

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "settings.brreg_cron.updated",
    entity_type: "settings",
    entity_id: "brreg_cron",
    metadata: parsed.data,
  });

  revalidatePath("/admin/queue");
  return {
    ok: true,
    message: parsed.data.enabled ? "Cron aktivert" : "Cron pauset",
  };
}

// ─── 1881 enrichment ──────────────────────────────────────────────────────

export type Test1881Result =
  | {
      ok: true;
      configured: true;
      contact: One1881Contact;
      topLevelKeys: string[];
      foundIn: string[];
      status: number;
    }
  | { ok: false; configured: boolean; error: string };

/**
 * One-off lookup so the operator can see exactly what 1881 returns for
 * a real org.nr before running a batch — and so we can calibrate the
 * field mapping to the actual response shape.
 */
export async function testEnrich1881Lookup(
  formData: FormData
): Promise<Test1881Result> {
  const orgNr = String(formData.get("orgnr") ?? "").trim();
  if (!/^\d{9}$/.test(orgNr)) {
    return { ok: false, configured: !!getOne1881Config(), error: "Org.nr må være 9 siffer" };
  }
  if (!getOne1881Config()) {
    return {
      ok: false,
      configured: false,
      error: "1881 ikke konfigurert — sett ONE1881_API_KEY i Vercel",
    };
  }

  const result = await lookupByOrgNr(orgNr);
  if (!result.ok) {
    return { ok: false, configured: true, error: result.error };
  }
  return {
    ok: true,
    configured: true,
    contact: result.contact,
    topLevelKeys: result.topLevelKeys,
    foundIn: result.foundIn,
    status: result.status,
  };
}

export async function triggerEnrich1881Batch(formData: FormData) {
  const daysRaw = formData.get("days");
  const limitRaw = formData.get("limit");

  const daysSince =
    typeof daysRaw === "string" && /^\d+$/.test(daysRaw)
      ? Math.max(1, Math.min(30, parseInt(daysRaw, 10)))
      : 4;
  const limit =
    typeof limitRaw === "string" && /^\d+$/.test(limitRaw)
      ? Math.max(1, Math.min(200, parseInt(limitRaw, 10)))
      : 50;

  try {
    const result = await enrich1881Batch({ daysSince, limit });
    revalidatePath("/admin/queue");
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
    return result;
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
