-- Add a single editable "contact person" field per company.
-- Brreg does not expose person names directly (only roles for AS via /roller),
-- so this is operator-populated for now: filled in from research after the
-- lead lands in the queue, or auto-set later by an enrichment job.

alter table companies
  add column if not exists contact_name text;

create index if not exists idx_companies_contact_name_nonnull
  on companies (org_nr)
  where contact_name is not null;
