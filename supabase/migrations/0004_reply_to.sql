-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0004_reply_to
--
-- The verified Resend domain is the SUBDOMAIN kontakt.fx-media.no, so all
-- valid FROM addresses must end in @kontakt.fx-media.no. Replies to that
-- subdomain go nowhere — set a Reply-To pointing at the real inbox
-- (info@fx-media.no) so recipients can reply normally.
-- ─────────────────────────────────────────────────────────────────────────────

-- Update FROM to use the verified subdomain.
update settings
   set value = '"FX Media <info@kontakt.fx-media.no>"'::jsonb,
       updated_at = now()
 where key = 'outreach_email_from';

insert into settings (key, value)
values ('outreach_email_from', '"FX Media <info@kontakt.fx-media.no>"'::jsonb)
on conflict (key) do nothing;

-- Reply-To address. Should be a real, monitored mailbox.
insert into settings (key, value)
values ('outreach_email_reply_to', '"info@fx-media.no"'::jsonb)
on conflict (key) do nothing;
