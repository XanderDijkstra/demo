import { NextResponse } from "next/server";

import { getInboundDomain } from "@/lib/email/threads";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Company, EmailThread, OutreachEmail } from "@/lib/supabase/types";

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
  const { threadId } = await params;
  if (!threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const [threadRes, messagesRes, inboundDomain] = await Promise.all([
    supabase.from("email_threads").select("*").eq("id", threadId).maybeSingle(),
    supabase
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
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("org_nr", thread.org_nr)
      .maybeSingle();
    lead = (data as Company | null) ?? null;
  }

  return NextResponse.json({ thread, messages, lead, inboundDomain });
}
