# Carpenter / snekker template images

Drop your photos in **this folder** using the exact filenames below. They're
served from the CDN at `/templates/carpenter/<name>.jpg` and read by
`components/site/templates/carpenter-images.ts`. No API, no cost, no
watermark.

JPG is assumed. If you use `.png` / `.webp`, update the matching line in
`carpenter-images.ts`. Optimise before committing (aim < 400 KB each;
[squoosh.app](https://squoosh.app) works well) so the demo loads fast.

| Filename            | Use                                   | Recommended size | What it should show |
|---------------------|---------------------------------------|------------------|---------------------|
| `hero.jpg`          | Full-bleed hero background            | ~2000 × 1200     | A bright, premium kitchen or interior (gets a dark overlay) |
| `about.jpg`         | "Et navn bygget på integritet"        | ~900 × 1100 (tall) | Construction / carpentry in progress |
| `service-1.jpg`     | Service card: Total renovasjon        | ~900 × 900 (square) | Finished renovated room |
| `service-2.jpg`     | Service card: Kjøkken og bad          | ~900 × 900 (square) | Kitchen or bathroom |
| `service-3.jpg`     | Service card: Tilbygg og påbygg       | ~900 × 900 (square) | Exterior / extension |
| `service-4.jpg`     | Service card: Nybygg                  | ~900 × 900 (square) | Framing / new build |
| `split-project.jpg` | Large split-section photo             | ~1400 × 1100     | A project mid-build (workers, scaffolding) |
| `process-1.jpg`     | Step 1 — Konsultasjon                 | ~700 × 500       | Meeting / plans |
| `process-2.jpg`     | Step 2 — Planlegging                  | ~700 × 500       | Drawings / design |
| `process-3.jpg`     | Step 3 — Bygging                      | ~700 × 500       | Active construction |
| `process-4.jpg`     | Step 4 — Ferdigstillelse              | ~700 × 500       | Finished, handover |
| `project-1.jpg`     | Gallery card 1                        | ~1000 × 700      | A completed project |
| `project-2.jpg`     | Gallery card 2                        | ~1000 × 700      | A completed project |
| `project-3.jpg`     | Gallery card 3                        | ~1000 × 700      | A completed project |
| `project-4.jpg`     | Gallery card 4                        | ~1000 × 700      | A completed project |

## Shortcut

Short on images? **Reuse is fine** — point several slots at the same file by
editing `carpenter-images.ts`. The highest-impact set is: `hero`, `about`,
the four `service-*`, and the four `project-*`. You can repeat those for
`split-project` and the `process-*` shots.

The same pattern works for the other bespoke templates
(`/public/templates/contractor/`, `/public/templates/landscaper/`) if you
want to self-host their images too — just ask.
