"use server";

import { revalidatePath } from "next/cache";

import { runBrregDailyScrape } from "@/lib/jobs/brreg-daily";
import { scrapeEmailsBatch } from "@/lib/jobs/scrape-emails-batch";

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
