import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { ensureDealForReply } from "@/lib/deals";
import {
  parseThreadAddress,
  resolveInboundThread,
} from "@/lib/email/threads";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { EmailAttachment } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Resend Inbound webhook.
 *
 * Resend delivers a parsed email payload whenever a lead replies to an
 * address on a domain whose MX records point at Resend's inbound
 * servers. We:
 *   1. Verify the Svix signature (RESEND_WEBHOOK_SECRET).
 *   2. Recover the thread id from the To address (`thread+{uuid}@...`)
 *      with fallbacks to In-Reply-To and References headers.
 *   3. Insert an inbound row in outreach_emails (direction='in').
 *   4. Bump the thread's unread count and last_activity_at.
 *   5. Auto-create a CRM deal in `replied` stage on the first reply.
 *
 * The Resend SDK ships a richer event shape; we only consume the
 * subset we use to thread + display in the inbox. Anything unexpected
 * is logged and dropped gracefully so the webhook keeps a 2xx response.
 */

interface InboundEnvelope {
  type?: string; // "email.received" in Resend's current shape
  created_at?: string;
  data?: {
    email_id?: string;
    from?: string | { email?: string; name?: string };
    to?: string[] | string;
    cc?: string[] | string;
    subject?: string;
    text?: string;
    html?: string;
    headers?: Record<string, string> | Array<{ name: string; value: string }>;
    attachments?: Array<{
      filename?: string;
      content_type?: string;
      contentType?: string;
      size?: number;
      url?: string;
    }>;
    [k: string]: unknown;
  };
}

type HeaderValue =
  | Record<string, string>
  | Array<{ name: string; value: string }>
  | undefined;

function pickHeader(headers: HeaderValue, name: string): string | null {
  if (!headers) return null;
  const lower = name.toLowerCase();
  if (Array.isArray(headers)) {
    const hit = headers.find((h) => h.name?.toLowerCase() === lower);
    return hit?.value ?? null;
  }
  // Object form — match case-insensitively.
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower && typeof v === "string") return v;
  }
  return null;
}

function splitReferences(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("<") && s.endsWith(">"));
}

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

type FromValue = string | { email?: string; name?: string } | undefined;

function extractFrom(raw: FromValue): { email: string; name: string | null } {
  if (!raw) return { email: "", name: null };
  if (typeof raw === "string") {
    const m = raw.match(/^(.*?)<([^>]+)>\s*$/);
    if (m) return { name: (m[1] ?? "").trim() || null, email: (m[2] ?? "").trim() };
    return { email: raw.trim(), name: null };
  }
  return { email: raw.email ?? "", name: raw.name ?? null };
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "RESEND_WEBHOOK_SECRET not set" },
      { status: 500 }
    );
  }

  const body = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing Svix headers" },
      { status: 400 }
    );
  }

  let payload: InboundEnvelope;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as InboundEnvelope;
  } catch (err) {
    return NextResponse.json(
      {
        error: "Signature verification failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 401 }
    );
  }

  const data = payload.data ?? {};
  const toAddresses = asArray(data.to);
  const ccAddresses = asArray(data.cc);
  const from = extractFrom(data.from);
  const subject = (data.subject ?? "").slice(0, 998);
  const text = data.text ?? null;
  const html = data.html ?? null;

  const messageId = pickHeader(data.headers, "Message-ID");
  const inReplyTo = pickHeader(data.headers, "In-Reply-To");
  const references = splitReferences(pickHeader(data.headers, "References"));

  // Thread resolution.
  const threadId = await resolveInboundThread({
    toAddresses,
    inReplyTo,
    references,
  });

  const supabase = getSupabaseAdmin();

  // Figure out which lead this thread belongs to. If we couldn't resolve
  // a thread, try to recover the lead by matching the From address to a
  // known company email — best-effort.
  let orgNr: string | null = null;
  if (threadId) {
    const { data: t } = await supabase
      .from("email_threads")
      .select("org_nr")
      .eq("id", threadId)
      .maybeSingle();
    orgNr = t?.org_nr ?? null;
  }
  if (!orgNr && from.email) {
    const { data: company } = await supabase
      .from("companies")
      .select("org_nr")
      .eq("email", from.email.toLowerCase())
      .maybeSingle();
    orgNr = company?.org_nr ?? null;
  }

  // If we have a lead but no thread, open a thread for them now so the
  // inbox can group future replies. Without a lead, we still persist the
  // message into the "Unknown" bucket (thread_id = null, org_nr = null).
  let finalThreadId = threadId;
  if (!finalThreadId && orgNr) {
    const { data: newThread } = await supabase
      .from("email_threads")
      .insert({
        org_nr: orgNr,
        subject,
        last_activity_at: new Date().toISOString(),
        unread_count: 1,
      })
      .select()
      .single();
    finalThreadId = newThread?.id ?? null;
  }

  const attachments: EmailAttachment[] = (data.attachments ?? []).map((a) => ({
    filename: a.filename ?? "attachment",
    size: a.size ?? 0,
    content_type: a.content_type ?? a.contentType ?? "application/octet-stream",
    storage_url: a.url ?? null,
  }));

  const now = new Date().toISOString();

  const { error: insertError } = await supabase.from("outreach_emails").insert({
    org_nr: orgNr ?? "",
    direction: "in",
    thread_id: finalThreadId,
    to_email: toAddresses[0] ?? "",
    from_email: from.email,
    from_name: from.name,
    subject,
    body: text ?? html ?? "",
    body_text: text,
    body_html: html,
    message_id: messageId,
    in_reply_to: inReplyTo,
    references_chain: references.length > 0 ? references : null,
    attachments: attachments.length > 0 ? attachments : null,
    status: "received",
    received_at: now,
    resend_id: data.email_id ?? null,
  });

  if (insertError) {
    // Don't 5xx Resend — log and ack so it doesn't retry forever.
    await supabase.from("audit_log").insert({
      actor: "system",
      action: "inbound.email.insert_failed",
      entity_type: "email",
      entity_id: messageId ?? "unknown",
      metadata: {
        error: insertError.message,
        from: from.email,
        to: toAddresses,
        subject,
      },
    });
    return NextResponse.json({ ok: false, error: insertError.message });
  }

  // Bump thread activity + unread.
  if (finalThreadId) {
    const { data: t } = await supabase
      .from("email_threads")
      .select("unread_count, status")
      .eq("id", finalThreadId)
      .maybeSingle();
    const nextUnread = (t?.unread_count ?? 0) + 1;
    await supabase
      .from("email_threads")
      .update({
        unread_count: nextUnread,
        last_activity_at: now,
        // Snoozed threads come back to the inbox when a reply lands.
        ...(t?.status === "snoozed" ? { status: "open", snooze_until: null } : {}),
      })
      .eq("id", finalThreadId);
  }

  // Mark the matching outbound message as replied (UI signal for the
  // outreach analytics + lead detail).
  if (inReplyTo) {
    await supabase
      .from("outreach_emails")
      .update({ replied_at: now })
      .eq("message_id", inReplyTo)
      .is("replied_at", null);
  }

  // First reply on this lead → ensure a deal exists. ensureDealForReply
  // is idempotent and no-ops when an active deal already exists.
  if (orgNr) {
    await ensureDealForReply(orgNr);
  }

  await supabase.from("audit_log").insert({
    actor: "system",
    action: "inbound.email.received",
    entity_type: "company",
    entity_id: orgNr ?? "unknown",
    metadata: {
      thread_id: finalThreadId,
      from: from.email,
      subject,
      to: toAddresses,
      had_plus_address: toAddresses.some(
        (addr) => !!parseThreadAddress(addr)
      ),
    },
  });

  return NextResponse.json({ ok: true });
}
