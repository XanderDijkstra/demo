import "server-only";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Company, CompanyStatus } from "@/lib/supabase/types";

export type LeadsTab = "week" | "all";
export type LeadsSort = "score" | "registered" | "name";

export interface LeadsQuery {
  tab: LeadsTab;
  q?: string;
  status?: CompanyStatus;
  minScore?: number;
  sort: LeadsSort;
  page: number;
  pageSize: number;
}

export const DEFAULT_PAGE_SIZE = 25;

export function parseLeadsQuery(
  searchParams: Record<string, string | string[] | undefined>
): LeadsQuery {
  function pickString(key: string): string | undefined {
    const v = searchParams[key];
    if (Array.isArray(v)) return v[0];
    return v;
  }

  const rawTab = pickString("tab");
  const tab: LeadsTab = rawTab === "all" ? "all" : "week";

  const rawSort = pickString("sort");
  const sort: LeadsSort =
    rawSort === "registered" || rawSort === "name" ? rawSort : "score";

  const rawStatus = pickString("status");
  const status: CompanyStatus | undefined =
    rawStatus === "new" ||
    rawStatus === "reviewed" ||
    rawStatus === "qualified" ||
    rawStatus === "rejected"
      ? rawStatus
      : undefined;

  const rawMinScore = pickString("minScore");
  const minScoreNum = rawMinScore ? Number(rawMinScore) : NaN;
  const minScore =
    Number.isFinite(minScoreNum) && minScoreNum >= 0 && minScoreNum <= 100
      ? Math.floor(minScoreNum)
      : undefined;

  const rawPage = pickString("page");
  const pageNum = rawPage ? Number(rawPage) : 1;
  const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;

  const q = pickString("q")?.trim() || undefined;

  return {
    tab,
    q,
    status,
    minScore,
    sort,
    page,
    pageSize: DEFAULT_PAGE_SIZE,
  };
}

export interface LeadsResult {
  rows: Company[];
  total: number;
}

export async function fetchLeads(query: LeadsQuery): Promise<LeadsResult> {
  const supabase = getSupabaseAdmin();

  let req = supabase.from("companies").select("*", { count: "exact" });

  if (query.tab === "week") {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    req = req.gte("registered_at", since);
  }

  if (query.status) {
    req = req.eq("status", query.status);
  }

  if (typeof query.minScore === "number") {
    req = req.gte("score", query.minScore);
  }

  if (query.q) {
    // Case-insensitive search across name and org_nr.
    // Org numbers are 9 digits — if the query is all digits, prefix-match by org_nr.
    if (/^\d+$/.test(query.q)) {
      req = req.like("org_nr", `${query.q}%`);
    } else {
      req = req.ilike("name", `%${query.q}%`);
    }
  }

  switch (query.sort) {
    case "registered":
      req = req
        .order("registered_at", { ascending: false, nullsFirst: false })
        .order("score", { ascending: false });
      break;
    case "name":
      req = req.order("name", { ascending: true });
      break;
    case "score":
    default:
      req = req
        .order("score", { ascending: false })
        .order("registered_at", { ascending: false, nullsFirst: false });
      break;
  }

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  req = req.range(from, to);

  const { data, error, count } = await req;
  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return { rows: (data ?? []) as Company[], total: count ?? 0 };
}

/**
 * Counts used to populate the tab labels.
 */
export async function fetchLeadsTotals(): Promise<{ week: number; all: number }> {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [weekRes, allRes] = await Promise.all([
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .gte("registered_at", since),
    supabase.from("companies").select("*", { count: "exact", head: true }),
  ]);

  return {
    week: weekRes.count ?? 0,
    all: allRes.count ?? 0,
  };
}

export async function fetchLeadByOrgNr(orgNr: string): Promise<Company | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("org_nr", orgNr)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch lead: ${error.message}`);
  return (data as Company | null) ?? null;
}
