import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database, OutreachEmailStatus } from "@/lib/supabase/types";

type OutreachEmailUpdate =
  Database["public"]["Tables"]["outreach_emails"]["Update"];

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Resend signs webhooks via Svix. Verify the signature before trusting
 * any payload — without this, anyone could mark our emails as bounced.
 */
type ResendEventType =
  | "email.sent"
  | "email.delivered"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked"
  | "email.delivery_delayed"
  | "email.failed";

interface ResendEventPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id?: string;
    to?: string[] | string;
    from?: string;
    subject?: string;
    bounce?: { type?: string; subType?: string; message?: string };
    click?: { link?: string; ipAddress?: string; userAgent?: string };
    [key: string]: unknown;
  };
}

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
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

  const supabase = getSupabaseAdmin();
  const emailId = event.data.email_id;
  const eventTime = event.created_at ?? new Date().toISOString();

  // Find the matching outreach row by Resend's id.
  // If we never sent through this app (e.g., test events), no-op gracefully.
  let row: { id: string; org_nr: string; to_email: string } | null = null;
  if (emailId) {
    const { data } = await supabase
      .from("outreach_emails")
      .select("id, org_nr, to_email")
      .eq("resend_id", emailId)
      .maybeSingle();
    row = data;
  }

  // Always log the raw event for debugging.
  await supabase.from("audit_log").insert({
    actor: "resend.webhook",
    action: `outreach.event.${event.type.replace("email.", "")}`,
    entity_type: row ? "outreach_email" : "resend_event",
    entity_id: row?.id ?? emailId ?? null,
    metadata: {
      type: event.type,
      created_at: event.created_at,
      to: asArray(event.data.to),
      bounce: event.data.bounce,
      click: event.data.click,
    },
  });

  // Compute the per-row patch from the event type.
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
      baseUpdate.error_message =
        event.data.bounce?.message ?? "Bounced";
      if (row) {
        suppressEmail = { email: row.to_email, reason: "bounced" };
      }
      break;
    case "email.complained":
      nextStatus = "complained";
      baseUpdate.complained_at = eventTime;
      if (row) {
        suppressEmail = { email: row.to_email, reason: "complained" };
      }
      break;
    case "email.opened":
      // Only set opened_at on the first open.
      if (row) {
        const { data } = await supabase
          .from("outreach_emails")
          .select("opened_at, open_count")
          .eq("id", row.id)
          .maybeSingle();
        if (!data?.opened_at) {
          baseUpdate.opened_at = eventTime;
        }
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
        if (!data?.clicked_at) {
          baseUpdate.clicked_at = eventTime;
        }
        baseUpdate.click_count = (data?.click_count ?? 0) + 1;
      }
      break;
    case "email.delivery_delayed":
      // No status change — the message is still in flight.
      break;
    case "email.failed":
      nextStatus = "failed";
      baseUpdate.error_message =
        (event.data.bounce?.message as string | undefined) ?? "Failed";
      break;
    default:
      // Unknown event — already audit-logged, just return ok.
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
