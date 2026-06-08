import "server-only";

import { ensureDealForReply } from "@/lib/deals";
import { cancelPendingEnrollments } from "@/lib/flows-enroll";
import { notifyInboundReply } from "@/lib/notifications/telegram";
import {
  parseThreadAddress,
  resolveInboundThread,
} from "@/lib/email/threads";
import { fetchEmailBody } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { EmailAttachment } from "@/lib/supabase/types";
import { formatCompanyName } from "@/lib/utils";

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
  // Body content lives under different keys across Resend versions —
  // we read whichever is present.
  text?: string;
  html?: string;
  body_text?: string;
  body_html?: string;
  plain?: string;
  body?: string | { text?: string; html?: string; plain?: string };
  content?: { text?: string; html?: string };
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

/**
 * Find the plain-text and HTML bodies regardless of which key Resend
 * has put them under in this version. Returns nulls when the payload
 * is metadata-only (some integrations require a follow-up API fetch
 * for the body — log this case so we notice).
 */
function extractBody(
  data: ResendInboundPayload
): { text: string | null; html: string | null } {
  const bodyObj =
    typeof data.body === "object" && data.body !== null ? data.body : null;
  const bodyStr = typeof data.body === "string" ? data.body : null;

  const text =
    data.text ??
    data.body_text ??
    data.plain ??
    bodyStr ??
    bodyObj?.text ??
    bodyObj?.plain ??
    data.content?.text ??
    null;
  const html =
    data.html ??
    data.body_html ??
    bodyObj?.html ??
    data.content?.html ??
    null;
  return { text: text ?? null, html: html ?? null };
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
  let { text, html } = extractBody(data);

  const messageId = pickHeader(data.headers, "Message-ID");
  const inReplyTo = pickHeader(data.headers, "In-Reply-To");
  const references = splitReferences(pickHeader(data.headers, "References"));

  const supabase = getSupabaseAdmin();

  // Resend's inbound webhook only ships metadata in some setups —
  // the actual body lives on their API. If the webhook didn't include
  // text/html, fetch the full email by id and merge.
  let fetchSource: string = "webhook";
  let fetchedKeys: string[] = [];
  let fetchAttempts: unknown[] = [];
  if (!text && !html && data.email_id) {
    const fetched = await fetchEmailBody(data.email_id);
    text = fetched.text;
    html = fetched.html;
    fetchSource = fetched.source;
    fetchedKeys = fetched.responseKeys;
    fetchAttempts = fetched.attempts;
  }

  // Still nothing? Log everything we know about the payload + API
  // response so we can see exactly what Resend gave us.
  if (!text && !html) {
    await supabase.from("audit_log").insert({
      actor: "system",
      action: "inbound.email.body_missing",
      entity_type: "email",
      entity_id: messageId ?? "unknown",
      metadata: {
        from: from.email,
        subject,
        webhook_payload_keys: Object.keys(data ?? {}).slice(0, 30),
        had_email_id: !!data.email_id,
        fetch_source: fetchSource,
        fetch_response_keys: fetchedKeys,
        fetch_attempts: fetchAttempts,
      },
    });
  }

  const threadId = await resolveInboundThread({
    toAddresses,
    inReplyTo,
    references,
  });

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

  // If we have no matching thread, open one now — even when no lead
  // could be matched. Without this the message gets thread_id=null,
  // and the inbox (which queries email_threads) never shows it. An
  // unlinked thread (org_nr=null) still surfaces in the inbox as
  // "Unknown sender" so the operator can read it and link manually.
  let finalThreadId = threadId;
  if (!finalThreadId) {
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
    // null when the inbound can't be tied to a company (orphaned
    // thread, manual test, or company row was deleted after the
    // outbound). Used to be "" which fired the FK constraint.
    org_nr: orgNr ?? null,
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

  // First reply on this lead → ensure a CRM deal exists, and promote
  // the lead's status so they show up as engaged in the leads list /
  // dashboard. We never DEMOTE — already qualified / rejected leads
  // keep their status unchanged.
  let companyName: string | null = null;
  if (orgNr) {
    // Reply = hard stop: pull this lead out of any pending automated
    // follow-ups so a flow nudge can't land in a live conversation.
    await cancelPendingEnrollments(orgNr, "lead replied");
    await ensureDealForReply(orgNr);
    const { data: company } = await supabase
      .from("companies")
      .select("name, status")
      .eq("org_nr", orgNr)
      .maybeSingle();
    companyName = company?.name ? formatCompanyName(company.name) : null;
    if (company?.status === "new" || company?.status === "reviewed") {
      await supabase
        .from("companies")
        .update({ status: "qualified" })
        .eq("org_nr", orgNr);
      await supabase.from("audit_log").insert({
        actor: "system",
        action: "lead.status.qualified",
        entity_type: "company",
        entity_id: orgNr,
        metadata: {
          trigger: "inbound_reply",
          previous: company.status,
        },
      });
    }
  }

  // Telegram ping (fire-and-forget). Only fires when the bot is
  // configured; otherwise this is a no-op and won't slow anything down.
  await notifyInboundReply({
    fromName: from.name ?? null,
    fromEmail: from.email,
    companyName,
    orgNr,
    subject,
    preview: (text ?? "").split(/\n\s*\n/)[0]?.trim() ?? null,
  });

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
