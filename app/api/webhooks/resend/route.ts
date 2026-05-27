import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { handleInboundEmail, type ResendInboundPayload } from "@/lib/email/inbound";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database, OutreachEmailStatus } from "@/lib/supabase/types";

type OutreachEmailUpdate =
  Database["public"]["Tables"]["outreach_emails"]["Update"];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Single Resend webhook. Resend signs every event with Svix using the
 * same secret per webhook config — so we verify once and dispatch on
 * `event.type`:
 *
 *   - email.sent / delivered / opened / clicked / bounced / complained /
 *     failed / delivery_delayed → update the matching outreach_emails
 *     row (status, timestamps, suppression list on bounce/complaint).
 *   - email.received (any inbound shape) → persist the parsed reply,
 *     thread it, ensureDealForReply, bump unread on the inbox. Logic
 *     lives in lib/email/inbound.ts.
 *
 * Domain/contact events (domain.updated, etc.) are audit-logged and
 * acknowledged with a no-op so Resend doesn't retry.
 */

type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked"
  | "email.delivery_delayed"
  | "email.failed"
  | "email.received"
  | "email.inbound"
  | string;

interface ResendEventPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id?: string;
    to?: string[] | string;
    from?: string | { email?: string; name?: string };
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
    bounce?: { type?: string; subType?: string; message?: string };
    click?: { link?: string; ipAddress?: string; userAgent?: string };
    [key: string]: unknown;
  };
}

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function isInboundEventType(type: string): boolean {
  // Resend has evolved this name across versions. Match the most likely
  // variants so we don't drop messages because of a rename.
  const lower = type.toLowerCase();
  return (
    lower === "email.received" ||
    lower === "email.inbound" ||
    lower === "inbound.email.received" ||
    lower === "inbound.email" ||
    lower.startsWith("inbound.")
  );
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
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  let event: ResendEventPayload;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, headers) as ResendEventPayload;
  } catch (err) {
    return NextResponse.json(
      {
        error: "invalid signature",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 401 }
    );
  }

  // ── Inbound ────────────────────────────────────────────────────────
  if (isInboundEventType(event.type)) {
    const result = await handleInboundEmail(event.data as ResendInboundPayload);
    if (!result.ok) {
      // Ack with 200 anyway — Resend would otherwise retry forever and
      // the audit log already records the failure.
      return NextResponse.json({ ok: false, error: result.error });
    }
    return NextResponse.json({ ok: true, thread_id: result.threadId });
  }

  // ── Outbound events ────────────────────────────────────────────────
  const supabase = getSupabaseAdmin();
  const emailId = event.data.email_id;
  const eventTime = event.created_at ?? new Date().toISOString();

  // Find the matching outreach row by Resend's id. Test events or
  // domain/contact events have no email_id → just no-op gracefully.
  let row: { id: string; org_nr: string; to_email: string } | null = null;
  if (emailId) {
    const { data } = await supabase
      .from("outreach_emails")
      .select("id, org_nr, to_email")
      .eq("resend_id", emailId)
      .maybeSingle();
    row = data;
  }

  // Always audit-log the raw event for forensics.
  await supabase.from("audit_log").insert({
    actor: "resend.webhook",
    action: `outreach.event.${event.type.replace("email.", "")}`,
    entity_type: row ? "outreach_email" : "resend_event",
    entity_id: row?.id ?? emailId ?? null,
    metadata: {
      type: event.type,
      created_at: event.created_at,
      to: asArray(
        typeof event.data.to === "string" || Array.isArray(event.data.to)
          ? event.data.to
          : undefined
      ),
      bounce: event.data.bounce,
      click: event.data.click,
    },
  });

  const baseUpdate: OutreachEmailUpdate = {
    last_event: event.type,
    last_event_at: eventTime,
  };

  let nextStatus: OutreachEmailStatus | undefined;
  let suppressEmail: { email: string; reason: "bounced" | "complained" } | null =
    null;

  switch (event.type) {
    case "email.sent":
      nextStatus = "sent";
      baseUpdate.sent_at = eventTime;
      break;
    case "email.delivered":
      nextStatus = "delivered";
      baseUpdate.delivered_at = eventTime;
      break;
    case "email.bounced":
      nextStatus = "bounced";
      baseUpdate.bounced_at = eventTime;
      baseUpdate.error_message = event.data.bounce?.message ?? "Bounced";
      if (row) suppressEmail = { email: row.to_email, reason: "bounced" };
      break;
    case "email.complained":
      nextStatus = "complained";
      baseUpdate.complained_at = eventTime;
      if (row) suppressEmail = { email: row.to_email, reason: "complained" };
      break;
    case "email.opened":
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
    case "email.clicked":
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
    case "email.delivery_delayed":
      // No status change — message is still in flight.
      break;
    case "email.failed":
      nextStatus = "failed";
      baseUpdate.error_message =
        (event.data.bounce?.message as string | undefined) ?? "Failed";
      break;
    default:
      // Unknown / non-email event (e.g. domain.updated, contact.created).
      // Already audit-logged above. Just ack.
      return NextResponse.json({ ok: true, ignored: event.type });
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
