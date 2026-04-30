-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0002_outreach_emails
--
-- Email outreach via Resend. One row per send attempt.
-- ─────────────────────────────────────────────────────────────────────────────

create table outreach_emails (
  id uuid primary key default gen_random_uuid(),
  org_nr text not null references companies(org_nr) on delete cascade,

  to_email text not null,
  from_email text not null,
  subject text not null,
  body text not null,

  -- Resend's response: message id on success, error message on failure.
  resend_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed')),
  error_message text,

  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_outreach_emails_org_nr on outreach_emails(org_nr);
create index idx_outreach_emails_created_at on outreach_emails(created_at desc);
create index idx_outreach_emails_status on outreach_emails(status);

alter table outreach_emails enable row level security;

-- The FROM address used when composing emails. Editable from /admin/settings.
insert into settings (key, value) values
  (
    'outreach_email_from',
    '"FX Media <noreply@vekst-systemet.no>"'::jsonb
  )
on conflict (key) do nothing;
