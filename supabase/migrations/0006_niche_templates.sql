-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0006_niche_templates
--
-- Move editable niche config (colors, copy, services, CTA) out of code into
-- the database so the operator can tweak templates from /admin/templates
-- without redeploying. The React layout itself stays in code.
-- ─────────────────────────────────────────────────────────────────────────────

create table niche_templates (
  slug text primary key,
  display_name text not null,
  primary_color text not null,
  accent_color text not null,
  hero_image_keyword text not null,
  cta_text text not null,
  services jsonb not null default '[]',     -- [{title, description}, ...] (3 items)
  benefit_tags jsonb not null default '[]', -- ["chip 1", "chip 2", "chip 3"]
  updated_at timestamptz not null default now()
);

create trigger niche_templates_updated_at
  before update on niche_templates
  for each row execute function set_updated_at();

alter table niche_templates enable row level security;

-- Seed with current in-code defaults. Re-runnable.
insert into niche_templates
  (slug, display_name, primary_color, accent_color, hero_image_keyword, cta_text, services, benefit_tags)
values
  (
    'plumber',
    'Rørlegger',
    'oklch(0.55 0.16 245)',
    'oklch(0.92 0.04 245)',
    'plumber',
    'Bestill befaring',
    '[
      {"title":"Akutt rørleggerhjelp","description":"Vannlekkasje, tett avløp eller frosne rør? Vi rykker ut samme dag."},
      {"title":"Bad og våtrom","description":"Komplett renovering med våtromssertifikat og fagansvar fra start til slutt."},
      {"title":"Service og vedlikehold","description":"Faste serviceavtaler som forebygger lekkasjer og forlenger levetid."}
    ]'::jsonb,
    '["Døgnvakt","Fastpris","5 års garanti"]'::jsonb
  ),
  (
    'electrician',
    'Elektriker',
    'oklch(0.7 0.18 90)',
    'oklch(0.95 0.05 90)',
    'electrician',
    'Be om tilbud',
    '[
      {"title":"El-sjekk for bolig","description":"Få oversikt over anleggets tilstand med rapport og forsikringsgyldig kontroll."},
      {"title":"Smarthus og lading","description":"Installasjon av elbillader, smarte lyskontroller og nettverk i hele boligen."},
      {"title":"Næring og industri","description":"Prosjektering og utførelse for kontorbygg, butikker og verksteder."}
    ]'::jsonb,
    '["NEK 400","Sentral godkjenning","Fast elektriker"]'::jsonb
  ),
  (
    'restaurant',
    'Restaurant',
    'oklch(0.55 0.18 30)',
    'oklch(0.95 0.04 30)',
    'restaurant',
    'Reserver bord',
    '[
      {"title":"Lunsj og middag","description":"Fersk meny basert på sesongens råvarer fra lokale produsenter."},
      {"title":"Selskap og catering","description":"Bryllup, runde tall, firmafest. Vi planlegger og leverer hele opplevelsen."},
      {"title":"Take-away","description":"Bestill via nett — klart til avhentning på 20 minutter."}
    ]'::jsonb,
    '["Lokale råvarer","Catering","Vegetar / vegan"]'::jsonb
  ),
  (
    'salon',
    'Frisør',
    'oklch(0.6 0.16 350)',
    'oklch(0.96 0.04 350)',
    'hair-salon',
    'Book time',
    '[
      {"title":"Klipp og styling","description":"Personlig konsultasjon, presisjonsklipp og moderne styling for alle hårtyper."},
      {"title":"Farge og striper","description":"Balayage, highlights og fargefornying med skånsomme, profesjonelle produkter."},
      {"title":"Brud og bryllup","description":"Hår og oppsett til den store dagen — prøvetime inkludert."}
    ]'::jsonb,
    '["Online booking","Erfarne frisører","Plant-based produkter"]'::jsonb
  ),
  (
    'auto_repair',
    'Bilverksted',
    'oklch(0.5 0.2 25)',
    'oklch(0.95 0.04 25)',
    'auto-repair',
    'Bestill verkstedtime',
    '[
      {"title":"EU-kontroll","description":"Godkjent kontrollverksted. Vi henter og leverer bilen om du ønsker."},
      {"title":"Service og reparasjon","description":"Fra olje­skift til motorrenovering — alle merker, fast pris på vanlige jobber."},
      {"title":"Dekk og hjul","description":"Hjulskift, oppbevaring av dekk og avansert hjulstilling i moderne lokaler."}
    ]'::jsonb,
    '["Lånebil","Alle merker","Fast pris"]'::jsonb
  ),
  (
    'generic',
    'Generell',
    'oklch(0.6 0.118 184.704)',
    'oklch(0.95 0.03 184)',
    'norwegian-business',
    'Ta kontakt',
    '[
      {"title":"Personlig service","description":"Vi tar oss tid til å forstå behovene dine og leverer løsninger som passer."},
      {"title":"Lokal forankring","description":"Etablert i nærområdet med kjennskap til kundene og markedet i regionen."},
      {"title":"Kvalitet i alle ledd","description":"Fra første kontakt til ferdig leveranse — kvalitet er hovedfokus."}
    ]'::jsonb,
    '["Lokal","Erfaren","Pålitelig"]'::jsonb
  )
on conflict (slug) do nothing;
