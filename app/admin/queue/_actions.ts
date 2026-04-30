"use server";

import { revalidatePath } from "next/cache";

import { runBrregDailyScrape } from "@/lib/jobs/brreg-daily";

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
