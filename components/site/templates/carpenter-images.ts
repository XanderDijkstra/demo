/**
 * Self-hosted image registry for the carpenter / snekker template.
 *
 * Drop real photos into `/public/templates/carpenter/` using the exact
 * filenames below — they're served straight from the Vercel CDN, no API,
 * no cost, no watermark. See the README.md in that folder for the
 * recommended dimensions and what each shot should show.
 *
 * Until a file is committed, its <img> renders broken — so upload the set
 * (or point several slots at the same file) before publishing a carpenter
 * site. Reuse is fine: e.g. set `splitProject` to the same file as a
 * project shot if you're short on images.
 */

const BASE = "/templates/carpenter";

export const CARPENTER_IMAGES = {
  /** Hero — full-bleed luxury kitchen / interior (≈2000×1200, landscape). */
  hero: `${BASE}/hero.jpg`,

  /** About — construction-in-progress, tall portrait (≈900×1100). */
  about: `${BASE}/about.jpg`,

  /** Four square service cards (≈900×900 each). */
  services: [
    `${BASE}/service-1.jpg`, // Total renovasjon
    `${BASE}/service-2.jpg`, // Kjøkken og bad
    `${BASE}/service-3.jpg`, // Tilbygg og påbygg
    `${BASE}/service-4.jpg`, // Nybygg
  ],

  /** Large split-section project photo (≈1400×1100). */
  splitProject: `${BASE}/split-project.jpg`,

  /** Process timeline — one per step (≈700×500, landscape). */
  process: [
    `${BASE}/process-1.jpg`, // Konsultasjon
    `${BASE}/process-2.jpg`, // Planlegging
    `${BASE}/process-3.jpg`, // Bygging
    `${BASE}/process-4.jpg`, // Ferdigstillelse
  ],

  /** Project gallery — 2×2 grid (≈1000×700, landscape). */
  projects: [
    `${BASE}/project-1.jpg`,
    `${BASE}/project-2.jpg`,
    `${BASE}/project-3.jpg`,
    `${BASE}/project-4.jpg`,
  ],
};
