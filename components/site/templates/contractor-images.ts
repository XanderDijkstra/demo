/**
 * Self-hosted image registry for the contractor / entreprenør template.
 *
 * Photos live under `/public/templates/contractor/` (plus a couple reused
 * from the landscaper + carpenter folders). All are free-licence Unsplash
 * photos, see `public/templates/CREDITS.md`. They are stock examples, never
 * presented as the company's own work: the projects gallery labels each
 * one "Eksempelbilde".
 */

const BASE = "/templates/contractor";

const KITCHEN_FINISHED = `${BASE}/hero.webp`; // bright finished kitchen, island
const KITCHEN_GALLEY = `${BASE}/kitchen2.webp`; // wood + white galley kitchen
const PLASTER_HANDS = `${BASE}/plaster.webp`; // hands with taping knives
const ROOM_GUTTED = `${BASE}/renovation.webp`; // gutted room with props
const KITCHEN_COVERED = `${BASE}/kitchen-reno.webp`; // kitchen under renovation
const BLUEPRINTS = `${BASE}/blueprints.webp`; // reading drawings on site (from behind)
const OSB_EXTENSION = `${BASE}/osb.webp`; // OSB walls, extension in progress
const DECK_STONE = "/templates/landscaper/deck.webp"; // wooden deck + stone wall
const TABLE_SAW = "/templates/carpenter/18913.webp"; // table saw cutting

export const CONTRACTOR_IMAGES = {
  /** Hero — full-bleed warm interior. */
  hero: KITCHEN_FINISHED,

  /** About — tall crop of interior work in progress. */
  about: PLASTER_HANDS,

  /** Service cards (6 cards in a 3x2 grid), same order as niche.services. */
  services: [
    ROOM_GUTTED, // Boligrenovasjon
    KITCHEN_GALLEY, // Kjøkken og stue
    OSB_EXTENSION, // Tilbygg og påbygg
    KITCHEN_COVERED, // Bad og våtrom (generic interior-reno shot)
    DECK_STONE, // Terrasse og uterom
    TABLE_SAW, // Snekkerarbeid
  ] as const,

  /** Process steps (consultation, planning, construction, handover). */
  process: [BLUEPRINTS, KITCHEN_COVERED, PLASTER_HANDS, KITCHEN_FINISHED] as const,

  /** Example gallery (2x2). Labelled "Eksempelbilde" in the template. */
  projects: [
    { src: KITCHEN_FINISHED, title: "Kjøkken" },
    { src: KITCHEN_GALLEY, title: "Kjøkken og stue" },
    { src: OSB_EXTENSION, title: "Tilbygg" },
    { src: DECK_STONE, title: "Uteplass" },
  ] as const,

  /** Final CTA — subtle background watermark. */
  finalCta: KITCHEN_GALLEY,
} as const;
