/**
 * Hand-written types matching supabase/migrations/0001_initial_schema.sql.
 *
 * These mirror the Supabase generated types but are kept in-repo so that
 * compilation doesn't depend on having a Supabase project provisioned.
 * Regenerate from `supabase gen types typescript` once the CLI is wired up.
 */

export type CompanyStatus = "new" | "reviewed" | "qualified" | "rejected";
export type ScrapeRunStatus = "running" | "success" | "failed";
export type ScrapeTriggeredBy = "cron" | "manual";

export interface ScoreBreakdown {
  has_phone?: number;
  org_form_as?: number;
  target_nace?: number;
  has_website?: number;
  has_real_address?: number;
  freshly_founded?: number;
  [key: string]: number | undefined;
}

export interface ScoringWeights {
  has_phone: number;
  org_form_as: number;
  target_nace: number;
  has_website: number;
  has_real_address: number;
  freshly_founded: number;
}

export interface AgencyInfo {
  name: string;
  domain: string;
}

export interface Company {
  org_nr: string;
  name: string;

  org_form: string | null;
  org_form_description: string | null;

  nace_code: string | null;
  nace_description: string | null;

  address_line: string | null;
  postal_code: string | null;
  postal_place: string | null;
  kommune: string | null;
  kommune_nr: string | null;
  country_code: string | null;

  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;

  employee_count: number | null;
  vat_registered: boolean;
  bankrupt: boolean;
  under_dissolution: boolean;
  forced_dissolution: boolean;

  founded_at: string | null;
  registered_at: string | null;

  score: number;
  score_breakdown: ScoreBreakdown;

  status: CompanyStatus;
  notes: string | null;

  raw_data: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
}

export interface CompanyInsert {
  org_nr: string;
  name: string;
  org_form?: string | null;
  org_form_description?: string | null;
  nace_code?: string | null;
  nace_description?: string | null;
  address_line?: string | null;
  postal_code?: string | null;
  postal_place?: string | null;
  kommune?: string | null;
  kommune_nr?: string | null;
  country_code?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  employee_count?: number | null;
  vat_registered?: boolean;
  bankrupt?: boolean;
  under_dissolution?: boolean;
  forced_dissolution?: boolean;
  founded_at?: string | null;
  registered_at?: string | null;
  score?: number;
  score_breakdown?: ScoreBreakdown;
  status?: CompanyStatus;
  notes?: string | null;
  raw_data?: Record<string, unknown> | null;
}

export interface ScrapeRun {
  id: string;
  target_date: string;
  status: ScrapeRunStatus;
  fetched_count: number;
  inserted_count: number;
  skipped_count: number;
  error_message: string | null;
  duration_ms: number | null;
  triggered_by: ScrapeTriggeredBy;
  started_at: string;
  finished_at: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SettingRow<V = unknown> {
  key: string;
  value: V;
  updated_at: string;
}

/**
 * Supabase generated `Database` shape. Only the columns we use are typed.
 */
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: Partial<CompanyInsert>;
      };
      scrape_runs: {
        Row: ScrapeRun;
        Insert: Omit<
          ScrapeRun,
          "id" | "started_at" | "finished_at" | "duration_ms"
        > & {
          id?: string;
          started_at?: string;
          finished_at?: string | null;
          duration_ms?: number | null;
        };
        Update: Partial<ScrapeRun>;
      };
      audit_log: {
        Row: AuditLogEntry;
        Insert: Omit<AuditLogEntry, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AuditLogEntry>;
      };
      settings: {
        Row: SettingRow;
        Insert: { key: string; value: unknown; updated_at?: string };
        Update: Partial<{ key: string; value: unknown; updated_at: string }>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
