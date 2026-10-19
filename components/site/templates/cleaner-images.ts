/**
 * Self-hosted image registry for the cleaner / renhold template.
 *
 * Photos live under `/public/templates/cleaner/`. All are free-licence
 * Unsplash photos, see `public/templates/CREDITS.md`. They illustrate the
 * kind of work, never the company's own staff or customers.
 */

const BASE = "/templates/cleaner";

export const CLEANER_IMAGES = {
  /** Hero — bright, tidy Scandinavian living room (portrait). */
  hero: `${BASE}/hero.webp`,

  /** About — hands wiping a kitchen sink. */
  about: `${BASE}/kitchen-sink.webp`,

  /** Service cards, same order as niche.services. */
  services: [
    `${BASE}/wipe.webp`, // Fast hjemmevask
    `${BASE}/duster.webp`, // Storrengjøring
    `${BASE}/stairs.webp`, // Flyttevask
    `${BASE}/desk.webp`, // Kontor og næring
  ] as const,

  /** "Hva inngår" room columns: kitchen, bathroom, living room. */
  rooms: [`${BASE}/kitchen.webp`, `${BASE}/bathroom.webp`, `${BASE}/hero.webp`] as const,
} as const;
