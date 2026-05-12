import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { OutreachEmail, SuppressionReason } from "@/lib/supabase/types";

export type WindowDays = 7 | 14 | 30 | 90;

export interface OutreachKpis {
  /** Rolling-window counts. */
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  complained: number;
  failed: number;
  /** Prior equal-length window for trend comparisons. */
  prevSent: number;
  prevDelivered: number;
  prevOpened: number;
  prevReplied: number;
}

export interface OutreachStats {
  windowDays: WindowDays;
  kpis: OutreachKpis;
  /** Daily count series — exactly windowDays entries from oldest to today. */
  daily: Array<{ date: string; sent: number; replied: number }>;
  /** Suppression list size, broken down by reason. */
  suppressions: { total: number; byReason: Record<SuppressionReason, number> };
  /** Last N outreach rows for the activity strip. */
  recent: OutreachEmail[];
  /** Top leads ranked by engagement (opens + clicks + replies). */
  topEngaged: Array<{
    org_nr: string;
    name: string | null;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
  }>;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function isoDateKey(d: string | Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

type EmailWindowRow = Pick<
  OutreachEmail,
  | "id"
  | "org_nr"
  | "status"
  | "sent_at"
  | "delivered_at"
  | "bounced_at"
  | "complained_at"
  | "opened_at"
  | "clicked_at"
  | "replied_at"
  | "open_count"
  | "click_count"
  | "created_at"
>;

function countNonNull<K extends keyof EmailWindowRow>(
  rows: EmailWindowRow[],
  key: K
): number {
  return rows.reduce((n, r) => (r[key] != null ? n + 1 : n), 0);
}

export async function fetchOutreachStats(
  windowDays: WindowDays = 30
): Promise<OutreachStats> {
  const supabase = getSupabaseAdmin();
  const since = isoDaysAgo(windowDays);
  const sincePrev = isoDaysAgo(windowDays * 2);

  // Single broad fetch — at any realistic volume (<10k/window) this is fine
  // and avoids a fan-out of count queries.
  const [windowRes, prevRes, suppressionsRes, leadsRes, recentRes] = await Promise.all([
    supabase
      .from("outreach_emails")
      .select(
        "id, org_nr, status, sent_at, delivered_at, bounced_at, complained_at, opened_at, clicked_at, replied_at, open_count, click_count, created_at"
      )
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase
      .from("outreach_emails")
      .select(
        "id, status, sent_at, delivered_at, opened_at, replied_at, created_at"
      )
      .gte("created_at", sincePrev)
      .lt("created_at", since),
    supabase.from("outreach_suppressions").select("reason"),
    supabase.from("companies").select("org_nr, name"),
    supabase
      .from("outreach_emails")
      .select(
        "id, org_nr, to_email, from_email, subject, body, resend_id, status, error_message, sent_at, delivered_at, bounced_at, complained_at, opened_at, clicked_at, replied_at, last_event, last_event_at, open_count, click_count, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const rows = (windowRes.data ?? []) as EmailWindowRow[];
  const prev = (prevRes.data ?? []) as EmailWindowRow[];

  const sent = rows.filter((r) => r.status !== "queued").length;
  const delivered = countNonNull(rows, "delivered_at");
  const opened = countNonNull(rows, "opened_at");
  const clicked = countNonNull(rows, "clicked_at");
  const replied = countNonNull(rows, "replied_at");
  const bounced = countNonNull(rows, "bounced_at");
  const complained = countNonNull(rows, "complained_at");
  const failed = rows.filter((r) => r.status === "failed").length;

  const kpis: OutreachKpis = {
    sent,
    delivered,
    opened,
    clicked,
    replied,
    bounced,
    complained,
    failed,
    prevSent: prev.filter((r) => r.status !== "queued").length,
    prevDelivered: countNonNull(prev, "delivered_at"),
    prevOpened: countNonNull(prev, "opened_at"),
    prevReplied: countNonNull(prev, "replied_at"),
  };

  // Daily series — seed every day with zero so the chart has a continuous x-axis.
  const dailyMap = new Map<string, { sent: number; replied: number }>();
  for (let i = windowDays - 1; i >= 0; i--) {
    dailyMap.set(isoDateKey(isoDaysAgo(i)), { sent: 0, replied: 0 });
  }
  for (const r of rows) {
    const day = isoDateKey(r.created_at);
    const entry = dailyMap.get(day);
    if (entry) entry.sent += 1;
    if (r.replied_at) {
      const repliedDay = isoDateKey(r.replied_at);
      const replyEntry = dailyMap.get(repliedDay);
      if (replyEntry) replyEntry.replied += 1;
    }
  }
  const daily = Array.from(dailyMap, ([date, v]) => ({ date, ...v }));

  // Suppression breakdown
  const suppressionRows = (suppressionsRes.data ?? []) as Array<{
    reason: SuppressionReason;
  }>;
  const byReason: Record<SuppressionReason, number> = {
    bounced: 0,
    complained: 0,
    manual: 0,
    unsubscribed: 0,
  };
  for (const s of suppressionRows) {
    if (s.reason in byReason) byReason[s.reason] += 1;
  }

  // Top engaged leads — only those with at least one send in the window.
  const nameByOrgNr = new Map<string, string>();
  for (const l of (leadsRes.data ?? []) as Array<{ org_nr: string; name: string | null }>) {
    if (l.org_nr && l.name) nameByOrgNr.set(l.org_nr, l.name);
  }
  const perLead = new Map<
    string,
    { sent: number; opened: number; clicked: number; replied: number }
  >();
  for (const r of rows) {
    const slot = perLead.get(r.org_nr) ?? {
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
    };
    if (r.status !== "queued") slot.sent += 1;
    if (r.opened_at) slot.opened += 1;
    if (r.clicked_at) slot.clicked += 1;
    if (r.replied_at) slot.replied += 1;
    perLead.set(r.org_nr, slot);
  }
  const topEngaged = Array.from(perLead, ([org_nr, v]) => ({
    org_nr,
    name: nameByOrgNr.get(org_nr) ?? null,
    ...v,
  }))
    .sort((a, b) => {
      const aScore = a.replied * 5 + a.clicked * 2 + a.opened;
      const bScore = b.replied * 5 + b.clicked * 2 + b.opened;
      return bScore - aScore;
    })
    .slice(0, 8);

  return {
    windowDays,
    kpis,
    daily,
    suppressions: { total: suppressionRows.length, byReason },
    recent: (recentRes.data ?? []) as OutreachEmail[],
    topEngaged,
  };
}

// ─── Helpers used by the page for percentage formatting ─────────────────────

export function pct(n: number, of: number): number {
  if (of <= 0) return 0;
  return Math.round((n / of) * 100);
}

export function trend(current: number, previous: number):
  | { delta: number; direction: "up" | "down" | "flat" } {
  if (previous === 0) {
    return current === 0
      ? { delta: 0, direction: "flat" }
      : { delta: 100, direction: "up" };
  }
  const delta = Math.round(((current - previous) / previous) * 100);
  if (delta === 0) return { delta: 0, direction: "flat" };
  return { delta: Math.abs(delta), direction: delta > 0 ? "up" : "down" };
}
