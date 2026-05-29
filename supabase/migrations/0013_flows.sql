-- Follow-up flows.
--
-- A flow is an automation: when a lead was sent an outreach email and
-- has NOT replied after `delay_hours`, send them a follow-up reminder.
-- Processed by the cron at /api/cron/flows; managed from /admin/flows.
--
-- v1 trigger is "no_reply" only (open-tracking is unreliable). The
-- trigger_type column is here so we can add variants later without a
-- schema change.

create table if not exists flows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default false,
  trigger_type text not null default 'no_reply',
  delay_hours int not null default 72,
  follow_up_subject text not null,
  follow_up_body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per follow-up evaluation. A thread gets at most one follow-up
-- across all flows (enforced by the unique constraint), so enabling a
-- second flow never double-mails a lead.
create table if not exists flow_runs (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references flows(id) on delete cascade,
  org_nr text not null,
  thread_id uuid not null,
  source_email_id uuid,
  status text not null,            -- sent | skipped_replied | skipped_suppressed | failed
  follow_up_email_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  unique (thread_id)
);

create index if not exists idx_flow_runs_flow on flow_runs(flow_id, created_at desc);

alter table flows enable row level security;
alter table flow_runs enable row level security;

-- A sensible starter flow (disabled until the operator turns it on).
insert into flows (name, enabled, trigger_type, delay_hours, follow_up_subject, follow_up_body)
values (
  'Påminnelse etter 3 dager',
  false,
  'no_reply',
  72,
  'Re: {{company_name}}',
  E'Hei{{contact_first_name}},\n\nBare en kjapp påminnelse i tilfelle forrige e-post forsvant i innboksen.\n\nJeg hjelper bedrifter i {{region}} med å komme raskt på nett — og demosiden til {{company_name}} ligger fortsatt klar hvis du vil ta en titt.\n\nGi meg gjerne et napp om det er interessant.\n\n— Xander\nFX Media'
)
on conflict do nothing;
