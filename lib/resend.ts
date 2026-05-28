import "server-only";

import { Resend } from "resend";

import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSetting } from "@/lib/supabase/queries";

let cached: Resend | null = null;

function getResend(): Resend {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  cached = new Resend(key);
  return cached;
}

export async function getOutreachFromAddress(): Promise<string> {
  const value = await getSetting<string>("outreach_email_from");
  return value ?? "FX Media <info@kontakt.fx-media.no>";
}

export async function getOutreachReplyTo(): Promise<string> {
  const value = await getSetting<string>("outreach_email_reply_to");
  return value ?? "info@fx-media.no";
}

/**
 * Replace {{placeholders}} in a string. Unknown keys are left as-is so
 * the operator notices and fixes the template.
 */
export function applyPlaceholders(
  template: string,
  vars: Record<string, string | null>
): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => {
    const v = vars[key];
    return v ?? `{{${key}}}`;
  });
}

/**
 * Append a visible "unsubscribe" line to the body. Plain-text email
 * needs the link in the body too — the List-Unsubscribe header alone
 * is for mail clients; recipients reading the message need a click
 * target. Idempotent: skipped if the body already contains the URL
 * (e.g. operator manually added a {{unsubscribe_url}} placeholder).
 */
function appendUnsubscribeFooter(body: string, unsubUrl: string): string {
  if (body.includes(unsubUrl)) return body;
  const trimmed = body.replace(/\s+$/, "");
  return `${trimmed}\n\n—\nIkke interessert? Meld deg av: ${unsubUrl}`;
}

export interface SendOutreachInput {
  to: string;
  from: string;
  subject: string;
  body: string;
  replyTo?: string;
  /** RFC 5322 Message-ID for the new outbound mail. Resend lets us set
   *  custom headers; this lets mail clients thread us correctly and
   *  lets our inbound webhook match replies via In-Reply-To. */
  messageId?: string;
  /** Most recent message_id in the thread (the one we're replying to). */
  inReplyTo?: string;
  /** Full RFC 5322 References chain (oldest first). */
  references?: string[];
}

export interface SendOutreachResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

/**
 * Check whether a given email is on the suppression list (bounced,
 * complained, or manually unsubscribed). Lowercases the input.
 */
export async function isSuppressed(
  email: string
): Promise<{ suppressed: true; reason: string } | { suppressed: false }> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("outreach_suppressions")
    .select("email, reason")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (data) return { suppressed: true, reason: data.reason };
  return { suppressed: false };
}

export async function sendOutreachEmail(
  input: SendOutreachInput
): Promise<SendOutreachResult> {
  try {
    const resend = getResend();

    // Custom RFC 5322 headers for thread continuity + List-Unsubscribe
    // for deliverability (RFC 8058 one-click).
    const headers: Record<string, string> = {};
    if (input.messageId) headers["Message-ID"] = input.messageId;
    if (input.inReplyTo) headers["In-Reply-To"] = input.inReplyTo;
    if (input.references && input.references.length > 0) {
      headers["References"] = input.references.join(" ");
    }

    // Unsubscribe — every cold outbound carries a signed token URL that
    // both the visible body link and the mail-client one-click button
    // post to. Gmail / Outlook count this as a strong "this sender is
    // legitimate" signal.
    const unsubUrl = buildUnsubscribeUrl(input.to);
    headers["List-Unsubscribe"] = `<${unsubUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";

    const bodyWithFooter = appendUnsubscribeFooter(input.body, unsubUrl);

    const { data, error } = await resend.emails.send({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      text: bodyWithFooter,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      headers,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, resendId: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
