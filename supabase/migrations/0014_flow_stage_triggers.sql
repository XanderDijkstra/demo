-- Stage-triggered flows.
--
-- Extends flows so a flow can fire when a lead ENTERS a CRM stage
-- (e.g. swiped into the pipeline), not just on "no reply". Stage flows
-- need real scheduling — a lead is enrolled the moment they hit the
-- stage and the email goes out `delay_hours` later — so they get their
-- own enrollment table rather than the scan-based no_reply path.

alter table flows add column if not exists trigger_stage text;

create table if not exists flow_enrollments (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references flows(id) on delete cascade,
  org_nr text not null,
  due_at timestamptz not null,
  status text not null default 'pending',  -- pending | sent | skipped_suppressed | skipped_no_email | skipped_replied | failed | cancelled
  thread_id uuid,
  sent_email_id uuid,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  -- One enrollment per (flow, company): re-entering the stage won't
  -- duplicate or reset an existing enrollment.
  unique (flow_id, org_nr)
);

create index if not exists idx_flow_enrollments_due
  on flow_enrollments(status, due_at);

alter table flow_enrollments enable row level security;

-- A starter stage-flow (disabled). Fires when a lead is swiped into
-- "In conversation", waiting 1 day before the nudge.
insert into flows (name, enabled, trigger_type, trigger_stage, delay_hours, follow_up_subject, follow_up_body)
values (
  'Velkommen i pipeline',
  false,
  'stage_entered',
  'in_conversation',
  24,
  'Takk for praten, {{company_name}}',
  E'Hei{{contact_first_name}},\n\nGøy å ha dere i prosessen! Jeg setter sammen et konkret forslag for {{company_name}} og sender det over snart.\n\nHar du noen ønsker eller spørsmål i mellomtiden, bare svar på denne.\n\n— Xander\nFX Media'
)
on conflict do nothing;
