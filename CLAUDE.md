@AGENTS.md

# Vekst-Systemet — project notes

- Internal outreach tool for FX Media, single operator. UI language: Norwegian bokmål.
- Hosting: Cloudflare Workers (OpenNext) + D1. Deploy with `npm run deploy`; a push to `main` does not deploy.
- Use npm, not pnpm: pnpm's symlinked node_modules break the OpenNext build on Windows (EPERM symlink).
- DB access goes through `getDb()` (lib/db) — PostgREST-style builder over D1. JSON columns, booleans and
  timestamps are converted there; timestamps are ISO UTC strings and compare as text. Raw SQL: `d1()`.
- Every server action must start with `await requireOperator()` (lib/auth.ts) — the /admin path gate alone
  does not cover server actions.
- Demo sites (/p/[orgnr]) go to real, brand-new companies: never put invented facts in templates or prompts
  (reviews, years, project counts, certifications, guarantees). Use only Brreg data.
- Test data must say "Test migrering", never "Claude"; test emails never go to real leads.
