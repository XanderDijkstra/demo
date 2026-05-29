/**
 * Self-hosted image registry for the carpenter / snekker template.
 *
 * Photos live under `/public/templates/carpenter/`, served straight from
 * the CDN. Filenames mirror the Freepik resource IDs the operator
 * downloaded, keeping them as-is means a re-download from Freepik later
 * will keep the same name and just overwrite cleanly.
 *
 * 5 images mapped across 15 slots, see the table in
 * `public/templates/carpenter/README.md` for the rationale per slot.
 */

const BASE = "/templates/carpenter";

// Self-hosted source images (5 distinct Freepik downloads).
const CRAFT_CLOSEUP = `${BASE}/134781.webp`;     // hands marking wood
const SAW_WORKSHOP = `${BASE}/18913.webp`;       // table saw cutting
const EXTERIOR_WORK = `${BASE}/2149343676.webp`; // two carpenters, wooden house exterior
const PLANNING_TABLET = `${BASE}/2149343698.webp`; // surveying with tablet
const FRAME_NEW_BUILD = `${BASE}/9828.webp`;     // dramatic framing-stage build

// Unsplash hot-links for the process timeline (varied house shots so the
// 4 steps don't all show carpenters at work). HTTP 200 verified at commit.
const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`;
const HOUSE_GARDEN = UNSPLASH("1572120360610-d971b9d7767c");
const HOUSE_INTERIOR = UNSPLASH("1600585154340-be6161a56a0c");
const HOUSE_POOL = UNSPLASH("1568605114967-8130f3a36994");
const HOUSE_MODERN = UNSPLASH("1605276373954-0c4a0dac5b12");

export const CARPENTER_IMAGES = {
  /** Hero, full-bleed, gets dark overlay. Wants a bright, wide shot with
   *  human presence; the framing-stage photo (9828) was too dim under the
   *  overlay so we use the brighter exterior carpenter shot here. */
  hero: EXTERIOR_WORK,

  /** "Et navn bygget på integritet", intimate craftsmanship portrait. */
  about: CRAFT_CLOSEUP,

  /** Four service cards. */
  services: [
    EXTERIOR_WORK,    // Total renovasjon
    SAW_WORKSHOP,     // Kjøkken og bad, finish joinery
    FRAME_NEW_BUILD,  // Tilbygg og påbygg
    PLANNING_TABLET,  // Nybygg
  ],

  /** Large split-section project photo. */
  splitProject: EXTERIOR_WORK,

  /** Process timeline. Unsplash house shots so this row reads as
   *  varied homes rather than four more carpenter close-ups. */
  process: [
    HOUSE_GARDEN,   // Konsultasjon
    HOUSE_INTERIOR, // Planlegging
    HOUSE_POOL,     // Bygging
    HOUSE_MODERN,   // Ferdigstillelse
  ],

  /** 2×2 project gallery. */
  projects: [
    FRAME_NEW_BUILD,
    EXTERIOR_WORK,
    CRAFT_CLOSEUP,
    SAW_WORKSHOP,
  ],
};
