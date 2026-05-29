/**
 * Self-hosted image registry for the carpenter / snekker template.
 *
 * Photos live under `/public/templates/carpenter/`, served straight from
 * the CDN. Filenames mirror the Freepik resource IDs the operator
 * downloaded — keeping them as-is means a re-download from Freepik later
 * will keep the same name and just overwrite cleanly.
 *
 * 5 images mapped across 15 slots — see the table in
 * `public/templates/carpenter/README.md` for the rationale per slot.
 */

const BASE = "/templates/carpenter";

// Source images (5 distinct Freepik downloads).
const CRAFT_CLOSEUP = `${BASE}/134781.webp`;     // hands marking wood
const SAW_WORKSHOP = `${BASE}/18913.webp`;       // table saw cutting
const EXTERIOR_WORK = `${BASE}/2149343676.webp`; // two carpenters, wooden house exterior
const PLANNING_TABLET = `${BASE}/2149343698.webp`; // surveying with tablet
const FRAME_NEW_BUILD = `${BASE}/9828.webp`;     // dramatic framing-stage build

export const CARPENTER_IMAGES = {
  /** Hero — full-bleed, gets dark overlay. */
  hero: FRAME_NEW_BUILD,

  /** "Et navn bygget på integritet" — intimate craftsmanship portrait. */
  about: CRAFT_CLOSEUP,

  /** Four service cards. */
  services: [
    EXTERIOR_WORK,    // Total renovasjon
    SAW_WORKSHOP,     // Kjøkken og bad — finish joinery
    FRAME_NEW_BUILD,  // Tilbygg og påbygg
    PLANNING_TABLET,  // Nybygg
  ],

  /** Large split-section project photo. */
  splitProject: EXTERIOR_WORK,

  /** Process timeline. */
  process: [
    PLANNING_TABLET, // Konsultasjon
    CRAFT_CLOSEUP,   // Planlegging — drawing lines
    SAW_WORKSHOP,    // Bygging
    EXTERIOR_WORK,   // Ferdigstillelse
  ],

  /** 2×2 project gallery. */
  projects: [
    FRAME_NEW_BUILD,
    EXTERIOR_WORK,
    CRAFT_CLOSEUP,
    SAW_WORKSHOP,
  ],
};
