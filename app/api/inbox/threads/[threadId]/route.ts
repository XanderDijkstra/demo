import { requireOperator } from "@/lib/auth";
import { NextResponse } from "next/server";

import { getInboundDomain } from "@/lib/email/threads";
import { getDb } from "@/lib/db";
import type { Company, EmailThread, OutreachEmail } from "@/lib/db/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Inbox detail endpoint — returns one thread plus its messages and the
 * linked lead. Used by `_inbox-client.tsx` so the operator can flick
 * between emails without forcing a full server-rendered route change.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    await requireOperator();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  const { threadId } = await params;
  if (!threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }

  const db = getDb();

  const [threadRes, messagesRes, inboundDomain] = await Promise.all([
    db.from("email_threads").select("*").eq("id", threadId).maybeSingle(),
    db
      .from("outreach_emails")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true }),
    getInboundDomain(),
  ]);

  const thread = threadRes.data as EmailThread | null;
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const messages = (messagesRes.data ?? []) as OutreachEmail[];

  let lead: Company | null = null;
  if (thread.org_nr) {
    const { data } = await db
      .from("companies")
      .select("*")
      .eq("org_nr", thread.org_nr)
      .maybeSingle();
    lead = (data as Company | null) ?? null;
  }

  return NextResponse.json({ thread, messages, lead, inboundDomain });
}
