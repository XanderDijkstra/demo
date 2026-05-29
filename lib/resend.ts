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

/**
 * Fetch the full text/html body of an email Resend has on file. Used
 * by the inbound webhook when the webhook payload only contained
 * metadata — Resend exposes the body via REST even when they skip it
 * in the webhook event.
 *
 * Tries the SDK's emails.get() first (typed for sent emails); falls
 * back to a raw fetch against the API since the SDK method may not
 * cover inbound message responses in all versions.
 *
 * Returns the body fields it found, the keys present on the response
 * (for debugging), and whether either call actually returned data.
 */
export interface EmailBodyFetchResult {
  text: string | null;
  html: string | null;
  /** Keys present on whichever response we ended up using. Helps when
   *  text/html came back null — tells us what Resend DID return. */
  responseKeys: string[];
  source: "sdk" | "rest" | "none";
  /** Per-URL diagnostic trail so audit_log shows exactly what each
   *  endpoint replied with. */
  attempts: Array<{
    where: string;
    status: number | null;
    keys?: string[];
    error?: string;
  }>;
}

function readBodyFields(obj: Record<string, unknown>): {
  text: string | null;
  html: string | null;
} {
  const text =
    (typeof obj.text === "string" ? obj.text : null) ??
    (typeof obj.bodyText === "string" ? obj.bodyText : null) ??
    (typeof obj.body_text === "string" ? obj.body_text : null) ??
    (typeof obj.plain === "string" ? obj.plain : null) ??
    null;
  const html =
    (typeof obj.html === "string" ? obj.html : null) ??
    (typeof obj.bodyHtml === "string" ? obj.bodyHtml : null) ??
    (typeof obj.body_html === "string" ? obj.body_html : null) ??
    null;
  return { text, html };
}

export async function fetchEmailBody(
  emailId: string
): Promise<EmailBodyFetchResult> {
  const attempts: EmailBodyFetchResult["attempts"] = [];

  // 1. SDK
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.get(emailId);
    if (error) {
      attempts.push({ where: "sdk", status: null, error: error.message });
    } else if (data) {
      const obj = data as unknown as Record<string, unknown>;
      attempts.push({ where: "sdk", status: 200, keys: Object.keys(obj) });
      const { text, html } = readBodyFields(obj);
      if (text || html) {
        return {
          text,
          html,
          responseKeys: Object.keys(obj),
          source: "sdk",
          attempts,
        };
      }
    } else {
      attempts.push({ where: "sdk", status: null, error: "no data" });
    }
  } catch (err) {
    attempts.push({
      where: "sdk",
      status: null,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 2. Raw REST — the correct endpoint for inbound bodies per Resend
  // support is GET /emails/receiving/{id}. The SDK's emails.get() is
  // sent-only and 404s on inbound IDs. We try /emails/receiving/{id}
  // first, fall back to a couple other historical variants in case the
  // path changes again.
  const key = process.env.RESEND_API_KEY;
  if (key) {
    const urls = [
      `https://api.resend.com/emails/receiving/${emailId}`,
      `https://api.resend.com/emails/${emailId}`,
      `https://api.resend.com/v1/emails/receiving/${emailId}`,
    ];
    for (const url of urls) {
      const where = url.replace("https://api.resend.com", "");
      try {
        const r = await fetch(url, {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!r.ok) {
          attempts.push({ where, status: r.status });
          continue;
        }
        const json = (await r.json()) as Record<string, unknown>;
        attempts.push({ where, status: 200, keys: Object.keys(json) });
        const { text, html } = readBodyFields(json);
        if (text || html) {
          return {
            text,
            html,
            responseKeys: Object.keys(json),
            source: "rest",
            attempts,
          };
        }
      } catch (err) {
        attempts.push({
          where,
          status: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return {
    text: null,
    html: null,
    responseKeys: [],
    source: "none",
    attempts,
  };
}

export async function getOutreachFromAddress(): Promise<string> {
  const value = await getSetting<string>("outreach_email_from");
  return value ?? "FX Media <info@kontakt.fx-media.no>";
}

export async function getOutreachReplyTo(): Promise<string> {
  // Explicit operator-configured Reply-To wins.
  const explicit = await getSetting<string>("outreach_email_reply_to");
  if (explicit) return explicit;

  // Otherwise auto-derive from the inbound domain so replies route
  // through the webhook and not the operator's personal inbox.
  // settings.resend_inbound_domain is set to e.g. "kontakt.fx-media.no"
  // — we put "info@" on the front. Operator can override per-mailbox.
  const inboundDomain = await getSetting<string>("resend_inbound_domain");
  if (inboundDomain && inboundDomain.trim()) {
    return `info@${inboundDomain.trim()}`;
  }

  // Last-resort fallback. Replies won't be threaded into the inbox
  // until the operator configures one of the above.
  return "info@fx-media.no";
}

/**
 * Replace {{placeholders}} in a string.
 *
 * - Known key, value present → substitute the value.
 * - Known key, value null/empty → substitute an empty string. This is the
 *   common case (e.g. {{contact_first_name}} when we never found a contact
 *   on file). Leaving the literal token in place would ship "Hei
 *   {{contact_first_name}}," to the lead, which is what we used to do.
 * - Unknown key → leave the literal {{key}} so the operator notices the typo
 *   in the template. Don't silently swallow it.
 */
export function applyPlaceholders(
  template: string,
  vars: Record<string, string | null>
): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, key: string) => {
    if (!(key in vars)) return `{{${key}}}`;
    const v = vars[key];
    return v && v.trim() ? v : "";
  });
}

/**
 * Append a visible "unsubscribe" line to the plain-text body. Plain
 * text needs the URL spelled out — text-only clients have no other
 * way to render the link. Idempotent: skipped if the body already
 * contains the URL.
 */
function appendUnsubscribeFooterText(body: string, unsubUrl: string): string {
  if (body.includes(unsubUrl)) return body;
  const trimmed = body.replace(/\s+$/, "");
  return `${trimmed}\n\n—\nIkke interessert? Meld deg av: ${unsubUrl}`;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
function htmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

/**
 * Convert the operator's plain-text body into a minimal HTML version:
 *   - escape any chars that would break HTML
 *   - auto-linkify http(s) URLs so the demo site URL renders as a
 *     clickable link (still showing the URL text)
 *   - turn newlines into <br>
 *   - append a hyperlinked "Meld deg av" footer (not the raw URL —
 *     that's only in the plain-text fallback)
 *
 * Kept deliberately ugly-simple: no images, no inline CSS frameworks,
 * no tracking pixels, no fancy fonts. Inbox placement loves boring.
 */
function buildHtmlBody(body: string, unsubUrl: string): string {
  // Strip the auto-appended unsubscribe line from the text version
  // (we add a hyperlinked footer instead).
  const cleaned = body
    .replace(/\n+—\nIkke interessert\? Meld deg av:.*$/s, "")
    .trimEnd();

  const escaped = htmlEscape(cleaned);
  const linkified = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}" style="color:#0a66c2;text-decoration:none">${url}</a>`
  );
  const withBreaks = linkified.replace(/\n/g, "<br>");

  return `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff"><div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:580px;padding:8px 0">${withBreaks}<div style="margin-top:28px;padding-top:14px;border-top:1px solid #eaeaea;color:#888;font-size:12px;line-height:1.5">Ikke interessert? <a href="${htmlEscape(unsubUrl)}" style="color:#888;text-decoration:underline">Meld deg av her</a></div></div></body></html>`;
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

    const bodyWithFooter = appendUnsubscribeFooterText(input.body, unsubUrl);
    const htmlBody = buildHtmlBody(input.body, unsubUrl);

    const { data, error } = await resend.emails.send({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      // Send both — recipients on rich clients (Gmail / Outlook) see
      // the hyperlinked HTML; text-only clients fall back to the
      // plain version with the spelled-out URL.
      text: bodyWithFooter,
      html: htmlBody,
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
