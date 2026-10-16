import "server-only";

import {
  sendOutreachEmail,
  type SendOutreachInput,
  type SendOutreachResult,
} from "@/lib/resend";

/**
 * Single send entry point for every call site (sendLeadEmail,
 * replyToThread, the daily outreach and flows jobs). Resend is the only
 * provider; it adds the unsubscribe footer + List-Unsubscribe headers.
 */
export async function sendEmail(
  input: SendOutreachInput
): Promise<SendOutreachResult> {
  return sendOutreachEmail(input);
}
