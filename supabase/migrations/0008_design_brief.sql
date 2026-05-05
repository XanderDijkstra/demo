-- ─────────────────────────────────────────────────────────────────────────────
-- Vekst-Systemet · 0008_design_brief
--
-- Operator-written notes that augment Claude vision extraction
-- ("modern, lots of whitespace, brand orange #FF6B35"), plus persisted
-- combined-DNA results from running vision across every reference for a
-- niche at once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table niche_templates
  add column if not exists design_brief text,
  add column if not exists combined_dna_summary jsonb,
  add column if not exists combined_dna_extracted_at timestamptz,
  add column if not exists combined_dna_model text;
