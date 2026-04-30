-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0003_outreach_events
--
-- Webhook event tracking on outreach_emails + suppression list.
-- Run this AFTER 0002_outreach_emails.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- Update default FROM to kontakt@fx-media.no (the verified mailbox).
-- Also handles the case where 0002 already ran with the previous default.
update settings
   set value = '"FX Media <kontakt@fx-media.no>"'::jsonb,
       updated_at = now()
 where key = 'outreach_email_from';

-- Ensure a row exists even on fresh installs that skip 0002's insert.
insert into settings (key, value)
values ('outreach_email_from', '"FX Media <kontakt@fx-media.no>"'::jsonb)
on conflict (key) do nothing;

-- ─── Webhook event columns on outreach_emails ────────────────────────────────
-- Each timestamp is set the first time the corresponding event arrives.
alter table outreach_emails
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at   timestamptz,
  add column if not exists complained_at timestamptz,
  add column if not exists opened_at    timestamptz,
  add column if not exists clicked_at   timestamptz,
  add column if not exists last_event   text,
  add column if not exists last_event_at timestamptz,
  add column if not exists open_count   int not null default 0,
  add column if not exists click_count  int not null default 0;

-- Allow the new "delivered" status alongside the existing values.
alter table outreach_emails drop constraint if exists outreach_emails_status_check;
alter table outreach_emails
  add constraint outreach_emails_status_check
  check (status in ('queued', 'sent', 'delivered', 'bounced', 'complained', 'failed'));

create index if not exists idx_outreach_emails_resend_id
  on outreach_emails(resend_id);

create index if not exists idx_outreach_emails_to_email
  on outreach_emails(to_email);

-- ─── outreach_suppressions ───────────────────────────────────────────────────
-- An email lands here when:
--   * Resend reports a hard bounce → never send again.
--   * The recipient marks as spam/complaint → never send again.
--   * An operator manually adds an unsubscribe.
create table if not exists outreach_suppressions (
  email text primary key,
  reason text not null
    check (reason in ('bounced', 'complained', 'manual', 'unsubscribed')),
  source_org_nr text references companies(org_nr) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_outreach_suppressions_created
  on outreach_suppressions(created_at desc);

alter table outreach_suppressions enable row level security;
