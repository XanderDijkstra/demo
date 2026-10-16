-- Vekst-Systemet on Cloudflare D1 (SQLite).
--
-- Consolidates the 15 Supabase migrations (kept for history in
-- supabase/migrations/) into the schema the app actually uses, including
-- the `deals` table and `outreach_emails.replied_at`, which existed in the
-- live Supabase DB but never in a migration file.
--
-- Conventions (see lib/db/index.ts): booleans 0/1, JSON as text, timestamps
-- ISO-8601 UTC with milliseconds (same format as Date#toISOString, so they
-- compare correctly as text), dates YYYY-MM-DD, ids are UUID v4 strings.
--
-- Dropped: niche_templates, template_references and the storage bucket —
-- templates are code-driven (lib/template-store.ts) and nothing reads them.

-- ─── companies ───────────────────────────────────────────────────────────
create table companies (
  org_nr text primary key,
  name text not null,
  org_form text,
  org_form_description text,
  nace_code text,
  nace_description text,
  address_line text,
  postal_code text,
  postal_place text,
  kommune text,
  kommune_nr text,
  country_code text default 'NO',
  phone text,
  mobile text,
  email text,
  website text,
  contact_name text,
  employee_count integer,
  vat_registered integer not null default 0,
  bankrupt integer not null default 0,
  under_dissolution integer not null default 0,
  forced_dissolution integer not null default 0,
  founded_at text,
  registered_at text,
  score integer not null default 0,
  score_breakdown text not null default '{}',
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'qualified', 'rejected')),
  notes text,
  raw_data text,
  -- Website email scraper bookkeeping, so failed sites aren't retried forever.
  email_scrape_attempted_at text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index idx_companies_registered_at on companies(registered_at desc);
create index idx_companies_status_score on companies(status, score desc);
create index idx_companies_nace on companies(nace_code);
create index idx_companies_kommune on companies(kommune_nr);
create index idx_companies_org_form on companies(org_form);
-- Inbound replies match the sender against the stored Brreg email, case-insensitively.
create index idx_companies_email_lower on companies(lower(trim(email)));

create trigger companies_updated_at after update on companies
  when new.updated_at is old.updated_at
  begin
    update companies set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') where org_nr = new.org_nr;
  end;

-- ─── scrape_runs ─────────────────────────────────────────────────────────
create table scrape_runs (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  target_date text not null,
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  fetched_count integer not null default 0,
  inserted_count integer not null default 0,
  skipped_count integer not null default 0,
  error_message text,
  duration_ms integer,
  triggered_by text not null default 'cron' check (triggered_by in ('cron', 'manual')),
  started_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  finished_at text
);
create index idx_scrape_runs_target_date on scrape_runs(target_date desc);
create index idx_scrape_runs_started_at on scrape_runs(started_at desc);

-- ─── audit_log ───────────────────────────────────────────────────────────
create table audit_log (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  actor text,
  action text not null,
  entity_type text,
  entity_id text,
  metadata text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index idx_audit_log_created_at on audit_log(created_at desc);
create index idx_audit_log_action on audit_log(action);

-- ─── settings ────────────────────────────────────────────────────────────
create table settings (
  key text primary key,
  value text not null,
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create trigger settings_updated_at after update on settings
  when new.updated_at is old.updated_at
  begin
    update settings set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') where key = new.key;
  end;

-- ─── email_threads ───────────────────────────────────────────────────────
create table email_threads (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  org_nr text references companies(org_nr) on delete set null,
  subject text,
  last_activity_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  unread_count integer not null default 0,
  status text not null default 'open' check (status in ('open', 'snoozed', 'archived')),
  snooze_until text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index idx_email_threads_last_activity on email_threads(last_activity_at desc);
create index idx_email_threads_org_nr on email_threads(org_nr);
create index idx_email_threads_status on email_threads(status, last_activity_at desc);

-- ─── outreach_emails ─────────────────────────────────────────────────────
create table outreach_emails (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  org_nr text references companies(org_nr) on delete cascade,
  to_email text not null,
  from_email text not null,
  subject text not null,
  body text not null,
  resend_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed', 'received')),
  error_message text,
  sent_at text,
  delivered_at text,
  bounced_at text,
  complained_at text,
  opened_at text,
  clicked_at text,
  replied_at text,
  last_event text,
  last_event_at text,
  open_count integer not null default 0,
  click_count integer not null default 0,
  direction text not null default 'out' check (direction in ('out', 'in')),
  thread_id text references email_threads(id) on delete set null,
  message_id text,
  in_reply_to text,
  references_chain text,
  from_name text,
  body_text text,
  body_html text,
  attachments text,
  received_at text,
  read_at text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index idx_outreach_emails_org_nr on outreach_emails(org_nr, direction);
create index idx_outreach_emails_created_at on outreach_emails(created_at desc);
create index idx_outreach_emails_status on outreach_emails(status);
create index idx_outreach_emails_resend_id on outreach_emails(resend_id);
create index idx_outreach_emails_to_email on outreach_emails(to_email);
create index idx_outreach_emails_thread on outreach_emails(thread_id, created_at);
create index idx_outreach_emails_message_id on outreach_emails(message_id);
create index idx_outreach_emails_in_reply_to on outreach_emails(in_reply_to);
create index idx_outreach_emails_direction_sent on outreach_emails(direction, sent_at);
-- A webhook retry must not store the same inbound reply twice.
create unique index uq_outreach_emails_inbound_message on outreach_emails(message_id)
  where direction = 'in' and message_id is not null;

-- ─── outreach_suppressions ───────────────────────────────────────────────
create table outreach_suppressions (
  email text primary key,
  reason text not null check (reason in ('bounced', 'complained', 'manual', 'unsubscribed')),
  source_org_nr text references companies(org_nr) on delete set null,
  notes text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index idx_outreach_suppressions_created on outreach_suppressions(created_at desc);

-- ─── generated_sites ─────────────────────────────────────────────────────
create table generated_sites (
  org_nr text primary key references companies(org_nr) on delete cascade,
  niche_slug text not null,
  niche_overridden integer not null default 0,
  content_json text not null default '{}',
  generated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  generated_by_model text,
  generation_input_tokens integer,
  generation_output_tokens integer
);
create index idx_generated_sites_generated_at on generated_sites(generated_at desc);

-- ─── deals (CRM) ─────────────────────────────────────────────────────────
create table deals (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  org_nr text not null references companies(org_nr) on delete cascade,
  stage text not null default 'replied'
    check (stage in ('replied', 'in_conversation', 'proposal_sent', 'won', 'lost')),
  value_nok integer,
  notes text,
  lost_reason text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  stage_changed_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  won_at text,
  lost_at text
);
create index idx_deals_org_nr on deals(org_nr);
create index idx_deals_stage on deals(stage, stage_changed_at desc);

create trigger deals_updated_at after update on deals
  when new.updated_at is old.updated_at
  begin
    update deals set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') where id = new.id;
  end;

-- ─── flows ───────────────────────────────────────────────────────────────
create table flows (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  name text not null,
  enabled integer not null default 0,
  trigger_type text not null default 'no_reply',
  trigger_stage text,
  delay_hours integer not null default 72,
  follow_up_subject text not null,
  follow_up_body text not null,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create trigger flows_updated_at after update on flows
  when new.updated_at is old.updated_at
  begin
    update flows set updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') where id = new.id;
  end;

create table flow_runs (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  flow_id text not null references flows(id) on delete cascade,
  org_nr text not null,
  thread_id text not null unique,
  source_email_id text,
  status text not null,
  follow_up_email_id text,
  error_message text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
create index idx_flow_runs_flow on flow_runs(flow_id, created_at desc);

create table flow_enrollments (
  id text primary key default (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', 1 + (abs(random()) % 4), 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6)))),
  flow_id text not null references flows(id) on delete cascade,
  org_nr text not null,
  due_at text not null,
  status text not null default 'pending',
  thread_id text,
  sent_email_id text,
  error_message text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  processed_at text,
  unique (flow_id, org_nr)
);
create index idx_flow_enrollments_due on flow_enrollments(status, due_at);

-- ─── webhook idempotency ─────────────────────────────────────────────────
-- Svix message ids already handled, so a Resend retry is a no-op.
create table webhook_events (
  id text primary key,
  received_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
