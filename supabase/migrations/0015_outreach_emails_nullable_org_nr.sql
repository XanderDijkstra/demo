-- Allow inbound emails on unlinked or orphaned threads to be stored.
--
-- email_threads.org_nr has always been nullable (we render unlinked
-- threads in the inbox UI), but outreach_emails.org_nr was NOT NULL,
-- so a reply on a thread whose company had been deleted (or never
-- existed — e.g. a test send) would fail the FK and drop on the floor.
-- Run this once in the Supabase SQL editor.

alter table outreach_emails alter column org_nr drop not null;
