import { NextResponse } from "next/server";

import { processFlows } from "@/lib/jobs/flows-processor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Vercel Cron entrypoint for follow-up flows. Authenticated with
 * CRON_SECRET like the other cron routes. Scans for outreach emails
 * that went unanswered past each flow's delay and sends the follow-up.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processFlows({ triggeredBy: "cron" });
  return NextResponse.json(result);
}
