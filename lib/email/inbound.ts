import "server-only";

import { ensureDealForReply } from "@/lib/deals";
import {
  parseThreadAddress,
  resolveInboundThread,
} from "@/lib/email/threads";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { EmailAttachment } from "@/lib/supabase/types";

/**
 * Resend inbound email payload (the subset we actually consume).
 *
 * Shape is what Resend posts for `email.received` / `email.inbound`-
 * style events. Field names are tolerated in either snake_case or
 * camelCase since we've seen both in the wild and across SDK versions.
 */
export interface ResendInboundPayload {
  email_id?: string;
  from?: string | { email?: string; name?: string };
  to?: string[] | string;
  cc?: string[] | string;
  subject?: string;
  text?: string;
  html?: string;
  headers?:
    | Record<string, string>
    | Array<{ name: string; value: string }>;
  attachments?: Array<{
    filename?: string;
    content_type?: string;
    contentType?: string;
    size?: number;
    url?: string;
  }>;
  [k: string]: unknown;
}

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function pickHeader(
  headers: ResendInboundPayload["headers"],
  name: string
): string | null {
  if (!headers) return null;
  const lower = name.toLowerCase();
  if (Array.isArray(headers)) {
    const hit = headers.find((h) => h.name?.toLowerCase() === lower);
    return hit?.value ?? null;
  }
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

function extractFrom(
  raw: ResendInboundPayload["from"]
): { email: string; name: string | null } {
  if (!raw) return { email: "", name: null };
  if (typeof raw === "string") {
    const m = raw.match(/^(.*?)<([^>]+)>\s*$/);
    if (m) {
      return { name: (m[1] ?? "").trim() || null, email: (m[2] ?? "").trim() };
    }
    return { email: raw.trim(), name: null };
  }
  return { email: raw.email ?? "", name: raw.name ?? null };
}

/**
 * Persist an inbound email, thread it, and side-effect (deal create,
 * mark outbound as replied, audit log). Returns the thread id when
 * resolved — useful for the caller's response payload.
 *
 * Caller is responsible for Svix signature verification.
 */
export async function handleInboundEmail(
  data: ResendInboundPayload
): Promise<{ ok: true; threadId: string | null } | { ok: false; error: string }> {
  const toAddresses = asArray(data.to);
  const from = extractFrom(data.from);
  const subject = (data.subject ?? "").slice(0, 998);
  const text = data.text ?? null;
  const html = data.html ?? null;

  const messageId = pickHeader(data.headers, "Message-ID");
  const inReplyTo = pickHeader(data.headers, "In-Reply-To");
  const references = splitReferences(pickHeader(data.headers, "References"));

  const threadId = await resolveInboundThread({
    toAddresses,
    inReplyTo,
    references,
  });

  const supabase = getSupabaseAdmin();

  // Figure out which lead this thread belongs to. If we couldn't
  // resolve a thread, try matching the From address to a known company.
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

  // If we have a lead but no thread, open one now so future replies
  // group under it. Without a lead → save anyway with thread_id=null
  // so the message lands in the "Unknown" bucket.
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
    return { ok: false, error: insertError.message };
  }

  // Bump thread unread + activity. Snoozed → re-open.
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
        ...(t?.status === "snoozed"
          ? { status: "open", snooze_until: null }
          : {}),
      })
      .eq("id", finalThreadId);
  }

  // Mark the matching outbound message as replied (UI signal).
  if (inReplyTo) {
    await supabase
      .from("outreach_emails")
      .update({ replied_at: now })
      .eq("message_id", inReplyTo)
      .is("replied_at", null);
  }

  // First reply on this lead → ensure a CRM deal exists.
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

  return { ok: true, threadId: finalThreadId };
}
