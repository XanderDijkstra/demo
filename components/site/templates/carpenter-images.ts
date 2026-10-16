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

// Finished-result shots for the example gallery, self-hosted and shared
// with the contractor/landscaper templates (credits in
// public/templates/CREDITS.md). Labelled "Eksempelbilde" in the template.
const KITCHEN = "/templates/contractor/hero.webp";
const INTERIOR = "/templates/contractor/kitchen2.webp";
const OUTDOOR = "/templates/landscaper/deck.webp";

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

  /** Process timeline. Carpenter shots so each step shows phase-appropriate
   *  work (planning → drawing → cutting → finished exterior). */
  process: [
    PLANNING_TABLET, // Konsultasjon
    CRAFT_CLOSEUP,   // Planlegging (drawing pencil lines)
    SAW_WORKSHOP,    // Bygging
    EXTERIOR_WORK,   // Ferdigstillelse
  ],

  /** 2×2 example gallery (Kjøkken, Interiør, Uterom, Nybygg). */
  projects: [KITCHEN, INTERIOR, OUTDOOR, FRAME_NEW_BUILD],
};
