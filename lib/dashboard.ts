import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Company, ScrapeRun } from "@/lib/supabase/types";

export interface DashboardStats {
  totalLeads: number;
  weekLeads: number;
  weekLeadsPrev: number;
  weekHighQuality: number;
  weekAvgScore: number;
  lastRun: ScrapeRun | null;
  dailyIntake: Array<{ date: string; count: number }>;
  scoreDistribution: Array<{ bucket: string; count: number }>;
  topNace: Array<{ code: string; description: string; count: number }>;
  topLeads: Array<
    Pick<
      Company,
      | "org_nr"
      | "name"
      | "score"
      | "kommune"
      | "nace_description"
      | "registered_at"
      | "phone"
      | "mobile"
      | "website"
      | "status"
    >
  >;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function bucketFor(score: number): string {
  if (score >= 80) return "80–100";
  if (score >= 60) return "60–79";
  if (score >= 40) return "40–59";
  if (score >= 20) return "20–39";
  return "0–19";
}

const SCORE_BUCKETS = ["0–19", "20–39", "40–59", "60–79", "80–100"];

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabaseAdmin();
  const since14 = isoDaysAgo(14);
  const since7 = isoDaysAgo(7);
  const since14To8 = { from: isoDaysAgo(14), to: isoDaysAgo(8) };

  const [
    totalRes,
    weekRes,
    weekPrevRes,
    weekHighQualityRes,
    lastRunRes,
    last14DaysRes,
    weekRowsRes,
    topLeadsRes,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .gte("registered_at", since7),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .gte("registered_at", since14To8.from)
      .lte("registered_at", since14To8.to),
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .gte("registered_at", since7)
      .gte("score", 70),
    supabase
      .from("scrape_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Last 14 days of registered_at + score for the chart and avg.
    supabase
      .from("companies")
      .select("registered_at, score, nace_code, nace_description")
      .gte("registered_at", since14),
    // Week rows for distribution + NACE breakdown.
    supabase
      .from("companies")
      .select("score, nace_code, nace_description")
      .gte("registered_at", since7),
    supabase
      .from("companies")
      .select(
        "org_nr, name, score, kommune, nace_description, registered_at, phone, mobile, website, status"
      )
      .gte("registered_at", since7)
      .order("score", { ascending: false })
      .order("registered_at", { ascending: false, nullsFirst: false })
      .limit(10),
  ]);

  // Daily intake: bucket by date.
  const dailyMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    dailyMap.set(isoDaysAgo(i), 0);
  }
  for (const row of (last14DaysRes.data ?? []) as Array<{
    registered_at: string | null;
  }>) {
    if (!row.registered_at) continue;
    const key = row.registered_at.slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }
  }
  const dailyIntake = Array.from(dailyMap, ([date, count]) => ({ date, count }));

  // Average score this week.
  const weekRows = (weekRowsRes.data ?? []) as Array<{
    score: number;
    nace_code: string | null;
    nace_description: string | null;
  }>;
  const weekAvgScore =
    weekRows.length === 0
      ? 0
      : Math.round(
          weekRows.reduce((sum, r) => sum + (r.score ?? 0), 0) / weekRows.length
        );

  // Score distribution this week.
  const distMap = new Map<string, number>(SCORE_BUCKETS.map((b) => [b, 0]));
  for (const row of weekRows) {
    const b = bucketFor(row.score ?? 0);
    distMap.set(b, (distMap.get(b) ?? 0) + 1);
  }
  const scoreDistribution = SCORE_BUCKETS.map((bucket) => ({
    bucket,
    count: distMap.get(bucket) ?? 0,
  }));

  // Top NACE codes this week.
  const naceMap = new Map<
    string,
    { code: string; description: string; count: number }
  >();
  for (const row of weekRows) {
    if (!row.nace_code) continue;
    const existing = naceMap.get(row.nace_code);
    if (existing) {
      existing.count += 1;
    } else {
      naceMap.set(row.nace_code, {
        code: row.nace_code,
        description: row.nace_description ?? "",
        count: 1,
      });
    }
  }
  const topNace = Array.from(naceMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalLeads: totalRes.count ?? 0,
    weekLeads: weekRes.count ?? 0,
    weekLeadsPrev: weekPrevRes.count ?? 0,
    weekHighQuality: weekHighQualityRes.count ?? 0,
    weekAvgScore,
    lastRun: (lastRunRes.data as ScrapeRun | null) ?? null,
    dailyIntake,
    scoreDistribution,
    topNace,
    topLeads: (topLeadsRes.data ?? []) as DashboardStats["topLeads"],
  };
}
