-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0007_template_references
--
-- Operator can upload design references (screenshots, mockups) per niche.
-- Claude vision extracts a "design DNA" (colors, CTA, hero layout) that
-- the operator can apply to the niche template with one click.
--
-- Adds a public storage bucket for the uploads, a references table, and
-- a hero_layout column on niche_templates so the renderer can switch
-- between layout variants.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Storage bucket ─────────────────────────────────────────────────────────
-- Public-read so we can serve thumbnails directly. Writes go through the
-- service-role key from server actions, never from the browser.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'template-references',
  'template-references',
  true,
  10485760, -- 10 MB
  array['image/png','image/jpeg','image/jpg','image/webp','image/avif','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── template_references ─────────────────────────────────────────────────────
create table template_references (
  id uuid primary key default gen_random_uuid(),
  niche_slug text not null,
  storage_path text not null,           -- key inside the bucket
  public_url text not null,             -- denormalised for fast list queries
  label text,                           -- operator-supplied note, optional
  vision_summary jsonb,                 -- last extracted design DNA
  vision_model text,
  vision_extracted_at timestamptz,
  uploaded_at timestamptz not null default now()
);

create index idx_template_references_niche on template_references(niche_slug);
create index idx_template_references_uploaded on template_references(uploaded_at desc);

alter table template_references enable row level security;

-- ─── niche_templates.hero_layout ─────────────────────────────────────────────
-- Three layout variants the renderer supports:
--   split    — hero text + image side-by-side (current default)
--   centered — single column, centered text, image below
--   overlay  — full-bleed image background with overlaid text
alter table niche_templates
  add column if not exists hero_layout text not null default 'split'
    check (hero_layout in ('split', 'centered', 'overlay'));
