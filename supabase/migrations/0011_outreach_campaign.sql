-- Daily outreach campaign settings.
--
-- The cron job at /api/cron/outreach-daily reads these to decide who
-- gets sent today, what's in the email, and how many to cap at. All
-- editable from /admin/outreach.

insert into settings (key, value) values
  ('daily_outreach_enabled', 'false'::jsonb),
  ('daily_outreach_subject', '"Idea for {{company_name}}"'::jsonb),
  ('daily_outreach_body',
    to_jsonb(E'Hei!\n\nLagde en kjapp demoside til {{company_name}} basert på det jeg så.\n\nSe den her: {{site_url}}\n\nHvis det treffer, ta en lyd. Hvis ikke, ingen stress.\n\n— Xander\nFX Media')),
  ('daily_outreach_min_score', '60'::jsonb),
  ('daily_outreach_max_per_day', '25'::jsonb),
  ('daily_outreach_allowed_org_forms', '["AS","ASA","ENK"]'::jsonb),
  ('daily_outreach_excluded_nace_prefixes', '[]'::jsonb)
on conflict (key) do nothing;
