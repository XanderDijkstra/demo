-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0005_generated_sites
--
-- One row per published demo site. Row exists → site is live at
-- /p/{org_nr}. Deleting the row unpublishes.
-- ─────────────────────────────────────────────────────────────────────────────

create table generated_sites (
  org_nr text primary key references companies(org_nr) on delete cascade,
  niche_slug text not null,
  niche_overridden boolean not null default false,
  content_json jsonb not null default '{}',
  generated_at timestamptz not null default now(),
  generated_by_model text,
  generation_input_tokens int,
  generation_output_tokens int
);

create index idx_generated_sites_generated_at on generated_sites(generated_at desc);

alter table generated_sites enable row level security;

-- Default Claude model for generateSiteCopy().
insert into settings (key, value)
values ('claude_model', '"claude-haiku-4-5"'::jsonb)
on conflict (key) do nothing;
