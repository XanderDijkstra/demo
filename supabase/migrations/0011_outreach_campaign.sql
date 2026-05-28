-- Daily outreach campaign settings.
--
-- The cron job at /api/cron/outreach-daily reads these to decide who
-- gets sent today, what's in the email, and how many to cap at. All
-- editable from /admin/outreach.

insert into settings (key, value) values
  ('daily_outreach_enabled', 'false'::jsonb),
  ('daily_outreach_subject', '"Lagde en demoside til {{company_name}}"'::jsonb),
  ('daily_outreach_body',
    to_jsonb(E'Hei{{contact_first_name}}!\n\nJeg så at dere driver i {{kommune}} og bygde en kjapp demoside til {{company_name}} for å vise hvordan det kunne se ut.\n\nHelt gratis å ta en titt: {{site_url}}\n\nHvis det treffer, kan vi sette den live på eget domene.\nHvis ikke — ingen stress, du har siden uansett.\n\n— Xander\nFX Media'::text)),
  -- Conservative starting values. Warm the domain slowly: bump
  -- max_per_day after 2 weeks of clean deliverability + low bounce
  -- rate. Public-sector / healthcare / education / finance NACE codes
  -- are excluded by default — they don't buy from cold outreach and
  -- are more likely to complain.
  ('daily_outreach_min_score', '70'::jsonb),
  ('daily_outreach_max_per_day', '10'::jsonb),
  ('daily_outreach_allowed_org_forms', '["AS","ASA"]'::jsonb),
  ('daily_outreach_excluded_nace_prefixes',
    '["84.","85.","86.","87.","88.","94.","64.","65.","66."]'::jsonb)
on conflict (key) do nothing;
