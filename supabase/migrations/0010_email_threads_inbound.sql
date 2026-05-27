-- Two-way email: threads + inbound messages.
--
-- We extend the existing outreach_emails table with a `direction` column
-- ('out' for sends, 'in' for received replies) plus the RFC 5322 headers
-- needed to thread messages, and a per-row read flag. A separate
-- email_threads table groups messages so the inbox UI can list threads
-- sorted by most-recent activity with unread counts.
--
-- Existing rows are backfilled with direction='out' so historical sends
-- stay queryable.

create table if not exists email_threads (
  id uuid primary key default gen_random_uuid(),
  org_nr text references companies(org_nr) on delete set null,
  subject text,
  last_activity_at timestamptz not null default now(),
  unread_count int not null default 0,
  status text not null default 'open' check (status in ('open', 'snoozed', 'archived')),
  snooze_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_threads_last_activity on email_threads(last_activity_at desc);
create index if not exists idx_email_threads_org_nr on email_threads(org_nr);
create index if not exists idx_email_threads_status on email_threads(status, last_activity_at desc);

alter table email_threads enable row level security;

-- Extend outreach_emails. We add NOT NULL columns with defaults so
-- existing rows backfill safely as outbound sends.

alter table outreach_emails
  add column if not exists direction text not null default 'out'
    check (direction in ('out', 'in'));

alter table outreach_emails
  add column if not exists thread_id uuid references email_threads(id) on delete set null;

alter table outreach_emails
  add column if not exists message_id text;        -- RFC 5322 Message-ID of THIS message
alter table outreach_emails
  add column if not exists in_reply_to text;       -- RFC 5322 In-Reply-To header
alter table outreach_emails
  add column if not exists references_chain text[]; -- RFC 5322 References header, split

-- Inbound-specific fields. Outbound rows leave these null.
alter table outreach_emails
  add column if not exists from_name text;
alter table outreach_emails
  add column if not exists body_text text;
alter table outreach_emails
  add column if not exists body_html text;
alter table outreach_emails
  add column if not exists attachments jsonb;     -- [{filename, size, content_type, storage_url}]
alter table outreach_emails
  add column if not exists received_at timestamptz;
alter table outreach_emails
  add column if not exists read_at timestamptz;

create index if not exists idx_outreach_emails_thread on outreach_emails(thread_id, created_at);
create index if not exists idx_outreach_emails_message_id on outreach_emails(message_id);
create index if not exists idx_outreach_emails_in_reply_to on outreach_emails(in_reply_to);
create index if not exists idx_outreach_emails_direction on outreach_emails(direction);

-- Inbound config in settings (set via /admin/settings or directly here):
--   resend_inbound_domain — e.g. "reply.fx-media.no" — the subdomain whose
--   MX records point at Resend's inbound mail servers. Operator-editable
--   so we don't hardcode the domain in code.

insert into settings (key, value)
values ('resend_inbound_domain', '""'::jsonb)
on conflict (key) do nothing;
