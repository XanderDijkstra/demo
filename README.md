# Vekst-Systemet

Internt verktøy for **FX Media** — automatisert salgsprospektering mot norske selskaper.

Et admin-dashboard som hver morgen henter selskaper registrert i Brønnøysundregistrene dagen før, scorer dem, og lar deg gå gjennom ukens topp-leads for manuell oppfølging.

---

## What it does (v1)

1. **Daily Brreg scrape** — every morning, an Inngest cron pulls every entity registered in Brreg the previous day.
2. **Scoring** — each lead is scored 0–100 based on phone presence, org form, NACE code, address quality, and freshness. Weights are tunable from the admin UI.
3. **Weekly review** — `/admin/leads` defaults to a "This week" tab so you can scan the week's batch and pick interesting leads.
4. **Lead detail** — read-only view of all Brreg fields per company.

Outreach (postcards, email) and AI-generated demo sites are **not** in v1 — they layer on next.

## Stack

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres + Auth)
- Inngest (background jobs)
- Brreg public API (no key required)

## Getting started

```bash
pnpm install
cp .env.local.example .env.local   # fill in Supabase values once project exists
pnpm dev
```

Open <http://localhost:3000>.

## Deploy

Vercel + Supabase integration auto-injects `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` manually from the Inngest dashboard.

Database schema lives in `supabase/migrations/`. Paste the SQL into Supabase's SQL editor (or run with the Supabase CLI) once the project exists.

## Project layout

```
app/                    Next.js App Router pages
  (auth)/login          Login page
  admin/                Protected admin UI
  api/                  Server routes (incl. Inngest webhook)
components/
  ui/                   shadcn primitives
  admin/                Admin-specific components
lib/
  brreg.ts              Brreg API client
  scoring.ts            Lead scoring logic
  supabase/             Supabase clients (browser/server/middleware)
  inngest/              Background job definitions
supabase/migrations/    SQL schema migrations
```

## Roadmap

- v1 (current): scrape + score + review
- v2: select leads → generate landing pages with Claude
- v3: outreach (postcards via Ekopost, email via TBD)
- v4: scan tracking + conversion analytics

---

Made for [vekst-systemet.no](https://vekst-systemet.no). Demo at [demo.vekst-systemet.no](https://demo.vekst-systemet.no).
