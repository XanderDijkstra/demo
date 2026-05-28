import "server-only";

import { sendOutreachEmailViaPostmark } from "@/lib/postmark";
import {
  sendOutreachEmail as sendOutreachEmailViaResend,
  type SendOutreachInput,
  type SendOutreachResult,
} from "@/lib/resend";

export type EmailProvider = "resend" | "postmark";

/**
 * Which backend is active. Defaults to "resend" so flipping happens
 * only when EMAIL_PROVIDER=postmark is explicitly set in Vercel env
 * vars (or wherever).
 */
export function getEmailProvider(): EmailProvider {
  const v = (process.env.EMAIL_PROVIDER ?? "").toLowerCase().trim();
  return v === "postmark" ? "postmark" : "resend";
}

/**
 * Send through whichever provider is active. Same input/output shape
 * so every call site (sendLeadEmail, replyToThread, the daily-cron
 * loop) just imports this one function.
 */
export async function sendEmail(
  input: SendOutreachInput
): Promise<SendOutreachResult> {
  if (getEmailProvider() === "postmark") {
    return sendOutreachEmailViaPostmark(input);
  }
  return sendOutreachEmailViaResend(input);
}
