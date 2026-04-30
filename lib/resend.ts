import "server-only";

import { Resend } from "resend";

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

export interface SendOutreachInput {
  to: string;
  from: string;
  subject: string;
  body: string;
  replyTo?: string;
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
    const { data, error } = await resend.emails.send({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      text: input.body,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
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
