import "server-only";

import { ServerClient } from "postmark";

import type { SendOutreachInput, SendOutreachResult } from "@/lib/resend";

/**
 * Postmark adapter — drop-in alternative to the Resend implementation
 * for both outbound sends and inbound parsing.
 *
 * Why we have both: Resend is great at outbound but doesn't expose
 * inbound bodies via API. Postmark ships the full text + html in its
 * inbound webhook payload, so cold-outreach replies are readable in
 * our inbox without a dashboard side-trip. EMAIL_PROVIDER env var
 * decides which backend `lib/email/provider.ts` routes through.
 */

let cached: ServerClient | null = null;

function getPostmark(): ServerClient {
  if (cached) return cached;
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) {
    throw new Error("POSTMARK_SERVER_TOKEN is not set");
  }
  cached = new ServerClient(token);
  return cached;
}

// ─── Outbound send ──────────────────────────────────────────────────────────

/**
 * Send through Postmark. Same SendOutreachInput contract as the Resend
 * version so the caller (sendLeadEmail / replyToThread / outreach-daily)
 * doesn't have to care which provider is active.
 */
export async function sendOutreachEmailViaPostmark(
  input: SendOutreachInput
): Promise<SendOutreachResult> {
  try {
    const client = getPostmark();

    // Postmark wants headers as an array of {Name, Value} pairs.
    const headers: Array<{ Name: string; Value: string }> = [];
    if (input.messageId) headers.push({ Name: "Message-ID", Value: input.messageId });
    if (input.inReplyTo) headers.push({ Name: "In-Reply-To", Value: input.inReplyTo });
    if (input.references && input.references.length > 0) {
      headers.push({ Name: "References", Value: input.references.join(" ") });
    }

    // Cold-outreach should always go on the "outbound" message stream
    // (Postmark separates transactional vs. broadcast — we use
    // outbound for transactional, which is the right stream for
    // 1:1 cold mails). Operator can override via env if needed.
    const messageStream = process.env.POSTMARK_MESSAGE_STREAM || "outbound";

    const response = await client.sendEmail({
      From: input.from,
      To: input.to,
      Subject: input.subject,
      TextBody: input.body,
      ...(input.replyTo ? { ReplyTo: input.replyTo } : {}),
      ...(headers.length > 0 ? { Headers: headers } : {}),
      MessageStream: messageStream,
    });

    return { ok: true, resendId: response.MessageID };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Inbound webhook payload ────────────────────────────────────────────────

/**
 * Postmark inbound payload — the subset we consume. Postmark's
 * webhook ships the full message including TextBody / HtmlBody, so
 * unlike Resend we don't need a follow-up API call to fetch content.
 *
 * Reference: https://postmarkapp.com/developer/webhooks/inbound-webhook
 */
export interface PostmarkInboundPayload {
  MessageID?: string;
  Date?: string;
  Subject?: string;
  From?: string;
  FromFull?: { Email?: string; Name?: string };
  To?: string;
  ToFull?: Array<{ Email?: string; Name?: string }>;
  Cc?: string;
  CcFull?: Array<{ Email?: string; Name?: string }>;
  TextBody?: string;
  HtmlBody?: string;
  Headers?: Array<{ Name: string; Value: string }>;
  Attachments?: Array<{
    Name?: string;
    Content?: string; // base64
    ContentType?: string;
    ContentLength?: number;
    ContentID?: string;
  }>;
  MailboxHash?: string;
  StrippedTextReply?: string;
  [k: string]: unknown;
}

/**
 * Outbound delivery-event payloads (one event per webhook call). We
 * branch on RecordType: Delivery / Bounce / SpamComplaint / Open /
 * Click. SubscriptionChange is also possible but we don't subscribe.
 */
export interface PostmarkOutboundEvent {
  RecordType:
    | "Delivery"
    | "Bounce"
    | "SpamComplaint"
    | "Open"
    | "Click"
    | string;
  MessageID?: string;
  Recipient?: string;
  Type?: string; // Bounce type
  Description?: string;
  Tag?: string;
  ServerID?: number;
  MessageStream?: string;
  DeliveredAt?: string;
  BouncedAt?: string;
  ReceivedAt?: string;
  OriginalLink?: string;
  [k: string]: unknown;
}
