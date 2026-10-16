"use server";

import { requireOperator } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runDailyOutreach } from "@/lib/jobs/outreach-daily";
import { getDb } from "@/lib/db";

type ActionResult<T = unknown> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string };

const CampaignSchema = z.object({
  enabled: z.boolean(),
  subject: z.string().trim().min(1).max(998),
  body: z.string().trim().min(1).max(50_000),
  minScore: z.coerce.number().int().min(0).max(100),
  maxPerDay: z.coerce.number().int().min(0).max(1000),
  allowedOrgForms: z.array(z.string()).default([]),
  excludedNacePrefixes: z.array(z.string()).default([]),
});

function parseLines(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function saveCampaignConfig(
  formData: FormData
): Promise<ActionResult> {
  await requireOperator();
  const parsed = CampaignSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    subject: formData.get("subject"),
    body: formData.get("body"),
    minScore: formData.get("min_score"),
    maxPerDay: formData.get("max_per_day"),
    allowedOrgForms: parseLines(String(formData.get("allowed_org_forms") ?? ""))
      .map((s) => s.toUpperCase()),
    excludedNacePrefixes: parseLines(
      String(formData.get("excluded_nace_prefixes") ?? "")
    ),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ugyldig input",
    };
  }

  const db = getDb();
  const now = new Date().toISOString();
  const rows = [
    { key: "daily_outreach_enabled", value: parsed.data.enabled },
    { key: "daily_outreach_subject", value: parsed.data.subject },
    { key: "daily_outreach_body", value: parsed.data.body },
    { key: "daily_outreach_min_score", value: parsed.data.minScore },
    { key: "daily_outreach_max_per_day", value: parsed.data.maxPerDay },
    {
      key: "daily_outreach_allowed_org_forms",
      value: parsed.data.allowedOrgForms,
    },
    {
      key: "daily_outreach_excluded_nace_prefixes",
      value: parsed.data.excludedNacePrefixes,
    },
  ];
  for (const row of rows) {
    const { error } = await db
      .from("settings")
      .upsert(
        { ...row, value: row.value as never, updated_at: now },
        { onConflict: "key" }
      );
    if (error) return { ok: false, error: error.message };
  }

  await db.from("audit_log").insert({
    actor: "manual",
    action: "settings.daily_outreach.updated",
    entity_type: "settings",
    entity_id: "daily_outreach",
    metadata: {
      enabled: parsed.data.enabled,
      min_score: parsed.data.minScore,
      max_per_day: parsed.data.maxPerDay,
    },
  });

  revalidatePath("/admin/outreach");
  return { ok: true, message: "Kampanjen er lagret" };
}

export async function runCampaignNow(): Promise<
  ActionResult<{
    candidates: number;
    sent: number;
    skipped: number;
    failed: number;
  }>
> {
  await requireOperator();
  const result = await runDailyOutreach({ triggeredBy: "manual" });
  revalidatePath("/admin/outreach");
  return {
    ok: true,
    message: `Sendte ${result.sent} av ${result.candidates} kandidater`,
    data: {
      candidates: result.candidates,
      sent: result.sent,
      skipped: result.skipped,
      failed: result.failed,
    },
  };
}

export async function previewCandidateCount(): Promise<
  ActionResult<{ count: number }>
> {
  await requireOperator();
  const result = await runDailyOutreach({
    triggeredBy: "manual",
    dryRun: true,
  });
  return { ok: true, data: { count: result.candidates } };
}
