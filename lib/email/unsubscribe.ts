import "server-only";

import crypto from "node:crypto";
import { appUrl } from "@/lib/app-url";

/**
 * Cold-outreach unsubscribe tokens.
 *
 * Each outbound email gets a List-Unsubscribe URL keyed on the
 * recipient address. The URL carries an HMAC-SHA256 token derived
 * from the address + a server secret, so:
 *   - The link is unguessable (can't be brute-forced from an address).
 *   - We can verify it without storing anything (stateless).
 *   - It stays valid forever — there's no expiry, since "unsubscribe
 *     me" should still work months after the original send.
 *
 * New links are signed with UNSUBSCRIBE_SECRET. Links already sent were
 * signed with RESEND_WEBHOOK_SECRET (the old fallback), so verification
 * accepts either: rotating the webhook secret must never break an
 * unsubscribe link that's already in someone's inbox.
 */

function secrets(): string[] {
  const list = [process.env.UNSUBSCRIBE_SECRET, process.env.RESEND_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s)
  );
  if (!list.length) throw new Error("UNSUBSCRIBE_SECRET is not set");
  return list;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hmac(secret: string, email: string): string {
  return crypto.createHmac("sha256", secret).update(normalizeEmail(email)).digest("hex").slice(0, 32);
}

export function signUnsubscribeToken(email: string): string {
  return hmac(secrets()[0]!, email);
}

export function verifyUnsubscribeToken(
  email: string,
  token: string
): boolean {
  if (!email || !token || token.length !== 32) return false;
  try {
    return secrets().some((secret) =>
      // Constant-time comparison.
      crypto.timingSafeEqual(Buffer.from(hmac(secret, email), "utf8"), Buffer.from(token, "utf8"))
    );
  } catch {
    return false;
  }
}


export function buildUnsubscribeUrl(email: string): string {
  const token = signUnsubscribeToken(email);
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    token,
  });
  return `${appUrl()}/api/unsubscribe?${params.toString()}`;
}
