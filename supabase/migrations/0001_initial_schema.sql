-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0001_initial_schema
--
-- v1 schema: companies harvested daily from Brreg, scored and reviewable.
-- Outreach (postcards/email) and AI-generated sites layer on in v2+.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── companies ───────────────────────────────────────────────────────────────
-- One row per Norwegian entity we've pulled from Brreg.
create table companies (
  org_nr text primary key,
  name text not null,

  -- Org form (AS, ASA, ENK, KBO, ...) and human-readable
  org_form text,
  org_form_description text,

  -- Primary NACE / industry classification
  nace_code text,
  nace_description text,

  -- Business address (forretningsadresse) — what we'd print on a postcard
  address_line text,
  postal_code text,
  postal_place text,
  kommune text,
  kommune_nr text,
  country_code text default 'NO',

  -- Contact (rarely populated by Brreg, but worth capturing when present)
  phone text,
  mobile text,
  email text,
  website text,

  -- Firmographics
  employee_count int,
  vat_registered boolean default false,
  bankrupt boolean default false,
  under_dissolution boolean default false,
  forced_dissolution boolean default false,

  -- Dates from Brreg
  founded_at date,             -- stiftelsesdato (when company itself was founded)
  registered_at date,          -- registreringsdatoEnhetsregisteret (when added to Brreg)

  -- Scoring (computed at scrape time, recomputable any time)
  score int not null default 0,
  score_breakdown jsonb not null default '{}',

  -- Lifecycle
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'qualified', 'rejected')),
  notes text,

  -- Forensics — full raw payload for any future field we forgot to extract
  raw_data jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_companies_registered_at on companies(registered_at desc);
create index idx_companies_status on companies(status);
create index idx_companies_score on companies(score desc);
create index idx_companies_nace on companies(nace_code);
create index idx_companies_kommune on companies(kommune_nr);
create index idx_companies_org_form on companies(org_form);

-- Auto-bump updated_at on row updates
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- ─── scrape_runs ─────────────────────────────────────────────────────────────
-- One row per daily Brreg pull. Visible in /admin/queue.
create table scrape_runs (
  id uuid primary key default gen_random_uuid(),
  -- The registration date we asked Brreg for (yesterday, usually)
  target_date date not null,
  status text not null default 'running'
    check (status in ('running', 'success', 'failed')),
  fetched_count int not null default 0,
  inserted_count int not null default 0,
  skipped_count int not null default 0,
  error_message text,
  duration_ms int,
  triggered_by text not null default 'cron'
    check (triggered_by in ('cron', 'manual')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index idx_scrape_runs_target_date on scrape_runs(target_date desc);
create index idx_scrape_runs_started_at on scrape_runs(started_at desc);

-- ─── audit_log ───────────────────────────────────────────────────────────────
-- Free-form trail of admin actions. Useful when multi-user later.
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text,                  -- email or 'system' (no auth yet, so mostly 'system')
  action text not null,        -- e.g. 'lead.qualified', 'settings.updated', 'scrape.manual'
  entity_type text,            -- 'company', 'settings', 'scrape_run'
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_created_at on audit_log(created_at desc);
create index idx_audit_log_action on audit_log(action);

-- ─── settings ────────────────────────────────────────────────────────────────
-- Tunable knobs. Tweak via /admin/settings, no redeploy.
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at
  before update on settings
  for each row execute function set_updated_at();

-- Default config — scoring weights, target niches, exclusions.
insert into settings (key, value) values
  (
    'scoring_weights',
    '{
      "has_phone": 30,
      "org_form_as": 20,
      "target_nace": 20,
      "has_website": 10,
      "has_real_address": 10,
      "freshly_founded": 10
    }'::jsonb
  ),
  (
    'target_nace_codes',
    -- Service businesses we have (or will have) templates for.
    -- NACE codes are matched as prefixes (e.g. "43.22" matches "43.220").
    '["43.22", "43.21", "56.10", "96.02", "45.20", "43.32", "43.33", "43.34", "81.10", "81.21"]'::jsonb
  ),
  (
    'excluded_org_forms',
    -- Bankruptcy estates, forced liquidations, foreign branches, govt entities.
    '["KBO", "UTLA", "STAT", "FYLK", "KOMM", "ORGL"]'::jsonb
  ),
  (
    'agency_info',
    '{
      "name": "FX Media",
      "domain": "vekst-systemet.no"
    }'::jsonb
  );

-- ─── Row Level Security ──────────────────────────────────────────────────────
-- Enable RLS on every table with NO policies → anon key cannot read/write.
-- All app access goes through the service-role key on the server.
-- When auth is added later, add appropriate policies here.

alter table companies     enable row level security;
alter table scrape_runs   enable row level security;
alter table audit_log     enable row level security;
alter table settings      enable row level security;
