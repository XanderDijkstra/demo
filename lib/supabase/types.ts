/**
 * Hand-written types matching supabase/migrations/0001_initial_schema.sql.
 *
 * Mirror the shape produced by `supabase gen types typescript`. Type aliases
 * (not interfaces) are required for Supabase's strict GenericTable constraint
 * to match — the official generator outputs the same form.
 */

export type CompanyStatus = "new" | "reviewed" | "qualified" | "rejected";
export type ScrapeRunStatus = "running" | "success" | "failed";
export type ScrapeTriggeredBy = "cron" | "manual";
export type OutreachEmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed";
export type SuppressionReason =
  | "bounced"
  | "complained"
  | "manual"
  | "unsubscribed";

export type GeneratedSiteContent = {
  hero_headline?: string;
  hero_subheadline?: string;
  about_paragraph?: string;
};

export type ScoreBreakdown = {
  has_phone?: number;
  org_form_as?: number;
  target_nace?: number;
  has_website?: number;
  has_real_address?: number;
  freshly_founded?: number;
  [key: string]: number | undefined;
};

export type ScoringWeights = {
  has_phone: number;
  org_form_as: number;
  target_nace: number;
  has_website: number;
  has_real_address: number;
  freshly_founded: number;
};

export type AgencyInfo = {
  name: string;
  domain: string;
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      companies: {
        Row: {
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
        };
        Insert: {
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          org_nr?: string;
          name?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scrape_runs: {
        Row: {
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
        };
        Insert: {
          id?: string;
          target_date: string;
          status?: ScrapeRunStatus;
          fetched_count?: number;
          inserted_count?: number;
          skipped_count?: number;
          error_message?: string | null;
          duration_ms?: number | null;
          triggered_by?: ScrapeTriggeredBy;
          started_at?: string;
          finished_at?: string | null;
        };
        Update: {
          id?: string;
          target_date?: string;
          status?: ScrapeRunStatus;
          fetched_count?: number;
          inserted_count?: number;
          skipped_count?: number;
          error_message?: string | null;
          duration_ms?: number | null;
          triggered_by?: ScrapeTriggeredBy;
          started_at?: string;
          finished_at?: string | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          actor: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: unknown;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: unknown;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: unknown;
          updated_at?: string;
        };
        Relationships: [];
      };
      outreach_emails: {
        Row: {
          id: string;
          org_nr: string;
          to_email: string;
          from_email: string;
          subject: string;
          body: string;
          resend_id: string | null;
          status: OutreachEmailStatus;
          error_message: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          bounced_at: string | null;
          complained_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          last_event: string | null;
          last_event_at: string | null;
          open_count: number;
          click_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_nr: string;
          to_email: string;
          from_email: string;
          subject: string;
          body: string;
          resend_id?: string | null;
          status?: OutreachEmailStatus;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          last_event?: string | null;
          last_event_at?: string | null;
          open_count?: number;
          click_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_nr?: string;
          to_email?: string;
          from_email?: string;
          subject?: string;
          body?: string;
          resend_id?: string | null;
          status?: OutreachEmailStatus;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          bounced_at?: string | null;
          complained_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          last_event?: string | null;
          last_event_at?: string | null;
          open_count?: number;
          click_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      outreach_suppressions: {
        Row: {
          email: string;
          reason: SuppressionReason;
          source_org_nr: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          email: string;
          reason: SuppressionReason;
          source_org_nr?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          reason?: SuppressionReason;
          source_org_nr?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      generated_sites: {
        Row: {
          org_nr: string;
          niche_slug: string;
          niche_overridden: boolean;
          content_json: GeneratedSiteContent;
          generated_at: string;
          generated_by_model: string | null;
          generation_input_tokens: number | null;
          generation_output_tokens: number | null;
        };
        Insert: {
          org_nr: string;
          niche_slug: string;
          niche_overridden?: boolean;
          content_json?: GeneratedSiteContent;
          generated_at?: string;
          generated_by_model?: string | null;
          generation_input_tokens?: number | null;
          generation_output_tokens?: number | null;
        };
        Update: {
          org_nr?: string;
          niche_slug?: string;
          niche_overridden?: boolean;
          content_json?: GeneratedSiteContent;
          generated_at?: string;
          generated_by_model?: string | null;
          generation_input_tokens?: number | null;
          generation_output_tokens?: number | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// Convenience aliases used throughout the app.
export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
export type ScrapeRun = Database["public"]["Tables"]["scrape_runs"]["Row"];
export type ScrapeRunInsert =
  Database["public"]["Tables"]["scrape_runs"]["Insert"];
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type AuditLogInsert =
  Database["public"]["Tables"]["audit_log"]["Insert"];
export type SettingRow<V = unknown> = {
  key: string;
  value: V;
  updated_at: string;
};
export type OutreachEmail =
  Database["public"]["Tables"]["outreach_emails"]["Row"];
export type OutreachEmailInsert =
  Database["public"]["Tables"]["outreach_emails"]["Insert"];
export type OutreachSuppression =
  Database["public"]["Tables"]["outreach_suppressions"]["Row"];
export type OutreachSuppressionInsert =
  Database["public"]["Tables"]["outreach_suppressions"]["Insert"];
export type GeneratedSite =
  Database["public"]["Tables"]["generated_sites"]["Row"];
export type GeneratedSiteInsert =
  Database["public"]["Tables"]["generated_sites"]["Insert"];
