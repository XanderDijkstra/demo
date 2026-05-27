import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSetting } from "@/lib/supabase/queries";
import type { EmailThread } from "@/lib/supabase/types";

/**
 * The subdomain whose MX records point to Resend Inbound (e.g.
 * "reply.fx-media.no"). Configured in settings.resend_inbound_domain.
 * Required for two-way email — every outbound Reply-To is built from this.
 */
export async function getInboundDomain(): Promise<string | null> {
  const v = await getSetting<string>("resend_inbound_domain");
  return v && v.trim() ? v.trim().toLowerCase() : null;
}

/**
 * Generate a fresh RFC 5322 Message-ID. We use the inbound domain (when
 * configured) so the message looks like it belongs to a single
 * infrastructure, falling back to a stable placeholder otherwise.
 */
export function makeMessageId(domain: string | null): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) +
        Date.now().toString(36);
  const host = domain || "send.local";
  return `<${rand}@${host}>`;
}

/**
 * Build the plus-addressed Reply-To we set on every outbound mail.
 * Lead replies hitting `thread+{uuid}@INBOUND_DOMAIN` route through the
 * inbound webhook with the thread id recoverable from the address even
 * if the recipient's mail client strips headers.
 */
export function buildThreadReplyTo(
  threadId: string,
  inboundDomain: string
): string {
  return `thread+${threadId}@${inboundDomain}`;
}

/**
 * Parse a `thread+{uuid}@host` address into the thread id, or null if
 * the address doesn't match the plus-addressing scheme.
 */
export function parseThreadAddress(address: string): string | null {
  // Tolerate display-name wrappers ("Foo Bar <thread+...@x>") and casing.
  const angle = address.match(/<([^>]+)>/);
  const bare = (angle?.[1] ?? address).trim().toLowerCase();
  const m = bare.match(/^thread\+([0-9a-f-]{36})@/i);
  return m ? m[1] ?? null : null;
}

/**
 * Get or create a thread for an outbound send.
 *
 * Strategy: re-use the most recent open thread for this lead with a
 * matching subject (case-insensitive, "Re:" prefix stripped). If none,
 * open a new one. Keeps follow-ups in the same conversation without
 * fragmenting on every reply.
 */
export async function ensureOutboundThread(args: {
  orgNr: string;
  subject: string;
}): Promise<EmailThread> {
  const supabase = getSupabaseAdmin();
  const normalized = normalizeSubject(args.subject);

  const { data: existing } = await supabase
    .from("email_threads")
    .select("*")
    .eq("org_nr", args.orgNr)
    .eq("status", "open")
    .order("last_activity_at", { ascending: false })
    .limit(20);

  const match = (existing ?? []).find(
    (t) => normalizeSubject(t.subject ?? "") === normalized
  );
  if (match) return match as EmailThread;

  const { data, error } = await supabase
    .from("email_threads")
    .insert({
      org_nr: args.orgNr,
      subject: args.subject,
      last_activity_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create email thread: ${error?.message}`);
  }
  return data as EmailThread;
}

/** Strip "Re:" / "Fwd:" prefixes for thread-matching. */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(\s*(re|sv|fwd|fw|aw|vs)\s*:\s*)+/i, "")
    .trim()
    .toLowerCase();
}

/**
 * Bump thread activity + (when inbound) unread count. Called from both
 * the send action and the inbound webhook.
 */
export async function touchThread(args: {
  threadId: string;
  incrementUnread?: boolean;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  if (args.incrementUnread) {
    // Read-modify-write. Postgres triggers / a stored proc would avoid
    // lost-update races, but for a single-operator MVP it's fine.
    const { data } = await supabase
      .from("email_threads")
      .select("unread_count")
      .eq("id", args.threadId)
      .maybeSingle();
    const next = (data?.unread_count ?? 0) + 1;
    await supabase
      .from("email_threads")
      .update({ unread_count: next, last_activity_at: now })
      .eq("id", args.threadId);
  } else {
    await supabase
      .from("email_threads")
      .update({ last_activity_at: now })
      .eq("id", args.threadId);
  }
}

/**
 * Resolve a thread for an inbound message. Tries, in order:
 *   1. The plus-addressed `to` address (`thread+{uuid}@inbound-domain`)
 *   2. In-Reply-To matching an existing message_id
 *   3. Any entry in the References chain matching an existing message_id
 * Returns the thread id, or null when none could be inferred (the
 * caller should drop the message into the "Unknown" bucket).
 */
export async function resolveInboundThread(args: {
  toAddresses: string[];
  inReplyTo: string | null;
  references: string[];
}): Promise<string | null> {
  // 1. Plus address
  for (const addr of args.toAddresses) {
    const tid = parseThreadAddress(addr);
    if (tid) return tid;
  }

  const supabase = getSupabaseAdmin();

  // 2. In-Reply-To
  if (args.inReplyTo) {
    const { data } = await supabase
      .from("outreach_emails")
      .select("thread_id")
      .eq("message_id", args.inReplyTo)
      .not("thread_id", "is", null)
      .maybeSingle();
    if (data?.thread_id) return data.thread_id as string;
  }

  // 3. References chain (try each)
  for (const ref of args.references) {
    if (!ref) continue;
    const { data } = await supabase
      .from("outreach_emails")
      .select("thread_id")
      .eq("message_id", ref)
      .not("thread_id", "is", null)
      .maybeSingle();
    if (data?.thread_id) return data.thread_id as string;
  }

  return null;
}
