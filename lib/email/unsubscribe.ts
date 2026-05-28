import "server-only";

import crypto from "node:crypto";

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
 * Falls back to RESEND_WEBHOOK_SECRET if UNSUBSCRIBE_SECRET isn't set,
 * so we don't add yet another env var the operator has to remember.
 */

function getSecret(): string {
  const s =
    process.env.UNSUBSCRIBE_SECRET || process.env.RESEND_WEBHOOK_SECRET;
  if (!s) {
    throw new Error(
      "UNSUBSCRIBE_SECRET (or RESEND_WEBHOOK_SECRET as fallback) is not set"
    );
  }
  return s;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function signUnsubscribeToken(email: string): string {
  const secret = getSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(normalizeEmail(email))
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(
  email: string,
  token: string
): boolean {
  if (!email || !token) return false;
  try {
    const expected = signUnsubscribeToken(email);
    // Constant-time comparison.
    if (expected.length !== token.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(token, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Absolute https URL for the unsubscribe page. Same fallback chain as
 * lib/jobs/generate-site.ts so a misconfigured NEXT_PUBLIC_APP_URL on
 * Vercel doesn't produce broken links.
 */
function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) {
    const trimmed = explicit.trim().replace(/\/$/, "");
    if (trimmed) {
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    }
  }
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return `https://${prod.replace(/\/$/, "")}`;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function buildUnsubscribeUrl(email: string): string {
  const token = signUnsubscribeToken(email);
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    token,
  });
  return `${appBaseUrl()}/api/unsubscribe?${params.toString()}`;
}
