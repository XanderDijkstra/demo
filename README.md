# Vekst-Systemet (demo.vekst-systemet.no)

Internal FX Media sales tool: finds companies registered in Brønnøysund the day before, scores them, builds each one a demo website, emails them the link, and handles replies in an inbox + CRM. Single operator (Xander). Not the public vekst-systemet.no marketing site; that's a separate repo (`vekst-system`) that only takes inbound leads.

## What runs when (UTC, Workers cron triggers in `wrangler.jsonc`)

| Cron | Job | Route |
|---|---|---|
| 06:00 | Brreg scrape of yesterday's registrations + scoring | `/api/cron/brreg-daily` |
| 08:00 | Daily cold email (only when enabled in Utsendelse) | `/api/cron/outreach-daily` |
| 09:00 | Follow-up flows (no reply / CRM stage entered) | `/api/cron/flows` |

Daily outreach: leads with status new/qualified, an email, score ≥ min, allowed org form, non-excluded NACE, never emailed, not suppressed. Max `maxPerDay` per Oslo day (manual sends count). A lead without a demo site gets one generated first; if that fails it is skipped, so no email goes out without a working link.

## Stack

- Next.js 16 (App Router) on **Cloudflare Workers** via OpenNext (`custom-worker.js` adds the cron handler)
- **D1** (SQLite) — schema in `migrations/`, accessed through the typed query layer in `lib/db`
- **Cloudflare Access** (team `fx-media`, email one-time code) in front of `/admin`, `/preview`, `/api/inbox`; the app re-verifies the Access JWT in middleware and in every server action (`lib/auth.ts`)
- Resend (email in/out), Claude (demo-site copy), Brreg API, optional 1881 + Telegram
- Public routes: `/p/[orgnr]` (demo sites, noindex), `/api/unsubscribe`, `/api/webhooks/resend`

## Commands

```bash
npm install
npm run dev                # local, with a local D1 (run db:migrate:local first); set ADMIN_DEV_EMAIL in .dev.vars
npm run db:migrate         # apply migrations/ to the remote D1
npm run deploy             # build + wrangler deploy (pushing to main does NOT deploy)
npx tsc --noEmit           # typecheck before every push
```

Secrets: see `.env.example`. Worker name `vekst-demo`, D1 `vekst-demo`, Access app "Vekst-Systemet admin".

## History

Built April–June 2026 on Vercel + Supabase (`supabase/migrations/` kept for reference). Moved to Cloudflare in October 2026; `scripts/move-from-vercel.mjs` did the one-time data and secret copy.
