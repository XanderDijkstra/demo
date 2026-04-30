import { NextResponse } from "next/server";

import { runBrregDailyScrape } from "@/lib/jobs/brreg-daily";

// This route runs the Brreg scrape. It must not be cached or pre-rendered.
export const dynamic = "force-dynamic";
// 5 minutes is plenty for ~300 records; bumps Vercel's default 10s cap.
export const maxDuration = 300;

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
  const targetDate = url.searchParams.get("date") ?? undefined;
  const triggeredBy = url.searchParams.get("trigger") === "manual"
    ? "manual"
    : "cron";

  const result = await runBrregDailyScrape({
    targetDate,
    triggeredBy,
  });

  const status = result.status === "success" ? 200 : 500;
  return NextResponse.json(result, { status });
}

// Vercel Cron sends GET; allow POST too so the manual trigger from /admin/queue
// can use the same handler with no extra plumbing.
export const POST = GET;
