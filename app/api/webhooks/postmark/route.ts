import { NextResponse } from "next/server";

import { handleInboundEmail } from "@/lib/email/inbound";
import type {
  PostmarkInboundPayload,
  PostmarkOutboundEvent,
} from "@/lib/postmark";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database, OutreachEmailStatus } from "@/lib/supabase/types";

type OutreachEmailUpdate =
  Database["public"]["Tables"]["outreach_emails"]["Update"];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Single Postmark webhook endpoint — handles every record type
 * Postmark posts at us:
 *   Delivery / Bounce / SpamComplaint / Open / Click  → outbound event
 *   Inbound (or any payload with From + To + Subject) → reply parsing
 *
 * Auth: Postmark sends webhooks with HTTP Basic Auth when you set a
 * username + password in their dashboard. We read those from
 * POSTMARK_WEBHOOK_USER / POSTMARK_WEBHOOK_PASSWORD and reject
 * anything else.
 */

interface RawPostmarkPayload extends Partial<PostmarkOutboundEvent>, Partial<PostmarkInboundPayload> {
  [k: string]: unknown;
}

function isAuthorized(request: Request): boolean {
  const user = process.env.POSTMARK_WEBHOOK_USER;
  const pass = process.env.POSTMARK_WEBHOOK_PASSWORD;
  // If neither is set, refuse rather than accept everything.
  if (!user || !pass) return false;
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx < 0) return false;
    const providedUser = decoded.slice(0, idx);
    const providedPass = decoded.slice(idx + 1);
    return providedUser === user && providedPass === pass;
  } catch {
    return false;
  }
}

function looksLikeInbound(payload: RawPostmarkPayload): boolean {
  // Explicit signal from newer Postmark versions.
  if (payload.RecordType && String(payload.RecordType).toLowerCase() === "inbound") {
    return true;
  }
  // Older / no-RecordType variants: detect by inbound-only field shape.
  return !!(payload.From && payload.To && payload.Subject && (payload.TextBody || payload.HtmlBody));
}

/**
 * Translate a Postmark inbound payload into the shape lib/email/inbound.ts
 * expects (it was originally written for Resend, so we adapt). Body
 * fields land in `text`/`html` directly — Postmark ships them, no
 * follow-up fetch needed.
 */
function adaptInbound(p: PostmarkInboundPayload): Record<string, unknown> {
  const headersObj: Record<string, string> = {};
  for (const h of p.Headers ?? []) {
    headersObj[h.Name] = h.Value;
  }
  const from =
    p.FromFull?.Email || p.FromFull?.Name
      ? { email: p.FromFull?.Email ?? p.From, name: p.FromFull?.Name }
      : p.From;
  const to =
    p.ToFull && p.ToFull.length > 0
      ? p.ToFull.map((t) => t.Email ?? "").filter(Boolean)
      : p.To
        ? [p.To]
        : [];
  return {
    email_id: p.MessageID,
    from,
    to,
    cc: p.CcFull?.map((c) => c.Email ?? "").filter(Boolean) ?? (p.Cc ? [p.Cc] : []),
    subject: p.Subject,
    text: p.StrippedTextReply || p.TextBody || null,
    html: p.HtmlBody || null,
    headers: headersObj,
    attachments: (p.Attachments ?? []).map((a) => ({
      filename: a.Name,
      content_type: a.ContentType,
      size: a.ContentLength,
      // Postmark sends attachments as base64 inline. We don't persist
      // bytes here yet — caller stores metadata only.
      url: null,
    })),
  };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: RawPostmarkPayload;
  try {
    payload = (await request.json()) as RawPostmarkPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // ── Inbound ────────────────────────────────────────────────────────
  if (looksLikeInbound(payload)) {
    await supabase.from("audit_log").insert({
      actor: "postmark.webhook",
      action: "inbound.email.received_raw",
      entity_type: "postmark_event",
      entity_id: payload.MessageID ?? null,
      metadata: { provider: "postmark" },
    });
    const adapted = adaptInbound(payload as PostmarkInboundPayload);
    const result = await handleInboundEmail(adapted);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error });
    }
    return NextResponse.json({ ok: true, thread_id: result.threadId });
  }

  // ── Outbound events ────────────────────────────────────────────────
  const recordType = String(payload.RecordType ?? "");
  const messageId = payload.MessageID;
  const eventTime =
    payload.DeliveredAt ?? payload.BouncedAt ?? payload.ReceivedAt ?? new Date().toISOString();

  // Find the matching row by Postmark's MessageID (we store it in
  // resend_id since that column is the provider-id catch-all).
  let row: { id: string; org_nr: string; to_email: string } | null = null;
  if (messageId) {
    const { data } = await supabase
      .from("outreach_emails")
      .select("id, org_nr, to_email")
      .eq("resend_id", messageId)
      .maybeSingle();
    row = data;
  }

  await supabase.from("audit_log").insert({
    actor: "postmark.webhook",
    action: `outreach.event.${recordType.toLowerCase()}`,
    entity_type: row ? "outreach_email" : "postmark_event",
    entity_id: row?.id ?? messageId ?? null,
    metadata: {
      provider: "postmark",
      record_type: recordType,
      recipient: payload.Recipient,
      bounce_type: payload.Type,
      original_link: payload.OriginalLink,
    },
  });

  const baseUpdate: OutreachEmailUpdate = {
    last_event: `postmark.${recordType.toLowerCase()}`,
    last_event_at: eventTime,
  };

  let nextStatus: OutreachEmailStatus | undefined;
  let suppressEmail: { email: string; reason: "bounced" | "complained" } | null =
    null;

  switch (recordType) {
    case "Delivery":
      nextStatus = "delivered";
      baseUpdate.delivered_at = eventTime;
      break;
    case "Bounce":
      nextStatus = "bounced";
      baseUpdate.bounced_at = eventTime;
      baseUpdate.error_message = payload.Description ?? "Bounced";
      if (row) suppressEmail = { email: row.to_email, reason: "bounced" };
      break;
    case "SpamComplaint":
      nextStatus = "complained";
      baseUpdate.complained_at = eventTime;
      if (row) suppressEmail = { email: row.to_email, reason: "complained" };
      break;
    case "Open":
      if (row) {
        const { data } = await supabase
          .from("outreach_emails")
          .select("opened_at, open_count")
          .eq("id", row.id)
          .maybeSingle();
        if (!data?.opened_at) baseUpdate.opened_at = eventTime;
        baseUpdate.open_count = (data?.open_count ?? 0) + 1;
      }
      break;
    case "Click":
      if (row) {
        const { data } = await supabase
          .from("outreach_emails")
          .select("clicked_at, click_count")
          .eq("id", row.id)
          .maybeSingle();
        if (!data?.clicked_at) baseUpdate.clicked_at = eventTime;
        baseUpdate.click_count = (data?.click_count ?? 0) + 1;
      }
      break;
    default:
      return NextResponse.json({ ok: true, ignored: recordType });
  }

  if (row) {
    if (nextStatus) baseUpdate.status = nextStatus;
    await supabase
      .from("outreach_emails")
      .update(baseUpdate)
      .eq("id", row.id);
  }

  if (suppressEmail) {
    await supabase.from("outreach_suppressions").upsert(
      {
        email: suppressEmail.email.toLowerCase(),
        reason: suppressEmail.reason,
        source_org_nr: row?.org_nr ?? null,
      },
      { onConflict: "email" }
    );
  }

  return NextResponse.json({ ok: true });
}
