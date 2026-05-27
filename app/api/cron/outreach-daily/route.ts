import { NextResponse } from "next/server";

import { runDailyOutreach } from "@/lib/jobs/outreach-daily";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Vercel Cron entrypoint for the daily outreach send.
 *
 * vercel.json schedules this; CRON_SECRET (set in Vercel env vars) is
 * passed as the Authorization header by Vercel's cron infrastructure.
 * Reject everything else so a public URL can't trigger a mail blast.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not set" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyOutreach({ triggeredBy: "cron" });
  return NextResponse.json({ ok: true, ...result });
}
