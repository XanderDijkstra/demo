import { NextResponse } from "next/server";

import { dateWithOffset, runBrregDailyScrape } from "@/lib/jobs/brreg-daily";
import { getDb } from "@/lib/db";
import { getSetting } from "@/lib/db/queries";

// This route runs the Brreg scrape. It must not be cached or pre-rendered.
export const dynamic = "force-dynamic";
// 5 minutes is plenty for ~300 records; bumps Vercel's default 10s cap.

/**
 * Authenticate the request as either:
 *   - A Vercel cron invocation (Authorization: Bearer ${CRON_SECRET})
 *   - A manual trigger from the admin UI (same secret, server-action sends it)
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // No secret configured → reject. Production must have one set.
    return false;
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Optional `?date=YYYY-MM-DD` for backfills. Defaults to yesterday.
  const url = new URL(request.url);
  const explicitDate = url.searchParams.get("date") ?? undefined;
  const triggeredBy = url.searchParams.get("trigger") === "manual"
    ? "manual"
    : "cron";

  // Operator-controlled kill switch. Only honoured for unattended cron
  // runs — a manual trigger from /admin/queue always proceeds so the
  // operator can ad-hoc backfill while the schedule is paused.
  if (triggeredBy === "cron") {
    const enabled = await getSetting<boolean>("brreg_cron_enabled");
    if (enabled === false) {
      await getDb().from("audit_log").insert({
        actor: "cron",
        action: "brreg.cron.skipped",
        entity_type: "settings",
        entity_id: "brreg_cron_enabled",
        metadata: { reason: "disabled" },
      });
      return NextResponse.json({ status: "skipped", reason: "disabled" });
    }
  }

  // Pick the target date. Explicit `?date=` always wins (backfills);
  // otherwise use the operator-configured offset (default 1 day back).
  let targetDate = explicitDate;
  if (!targetDate) {
    const offset = await getSetting<number>("brreg_cron_day_offset");
    targetDate = dateWithOffset(typeof offset === "number" ? offset : 1);
  }

  // Catch up: earlier days (up to a week back) whose scrape never succeeded,
  // e.g. after a Brreg outage. Re-running a day is safe (inserts skip
  // existing org.nrs). At most 3 per run to stay well inside time limits.
  const catchUp: Awaited<ReturnType<typeof runBrregDailyScrape>>[] = [];
  if (!explicitDate) {
    for (const day of await missedDays(targetDate)) {
      catchUp.push(await runBrregDailyScrape({ targetDate: day, triggeredBy }));
    }
  }

  const result = await runBrregDailyScrape({
    targetDate,
    triggeredBy,
  });

  const status = result.status === "success" ? 200 : 500;
  return NextResponse.json(catchUp.length ? { ...result, catchUp } : result, { status });
}

// Vercel Cron sends GET; allow POST too so the manual trigger from /admin/queue
// can use the same handler with no extra plumbing.
export const POST = GET;

/** Days in the week before `targetDate` without a successful scrape run, oldest first (max 3). */
async function missedDays(targetDate: string): Promise<string[]> {
  const days: string[] = [];
  const base = new Date(`${targetDate}T12:00:00Z`);
  for (let i = 7; i >= 1; i--) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const { data } = await getDb()
    .from("scrape_runs")
    .select("target_date")
    .eq("status", "success")
    .in("target_date", days);
  const done = new Set((data ?? []).map((r) => r.target_date));
  // Only days the system was already running for (a run row exists), so a
  // fresh install doesn't back-fill a week on its first night.
  const { data: attempted } = await getDb()
    .from("scrape_runs")
    .select("target_date")
    .in("target_date", days);
  const tried = new Set((attempted ?? []).map((r) => r.target_date));
  return days.filter((d) => tried.has(d) && !done.has(d)).slice(0, 3);
}
