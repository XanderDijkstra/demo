/**
 * Image registry for the carpenter / snekker template (Ekman-style).
 *
 * Picsum seeds are placeholders that GUARANTEE images load. Replace each
 * entry with a curated photo when you find ones you like — the reference
 * design uses warm-toned residential interiors (kitchens, baths) and
 * construction-in-progress shots.
 *
 * To swap:
 *   1. Pick a photo on unsplash.com → right-click image → Copy image address
 *   2. Replace the entry with the URL plus `?w={width}&q=80&auto=format`
 *   3. Or self-host: drop JPG into /public/templates/carpenter/{name}.jpg
 *      and reference as /templates/carpenter/{name}.jpg
 */

const PICSUM = "https://picsum.photos/seed";

export const CARPENTER_IMAGES = {
  /** Hero — luxury kitchen / interior, full-bleed dark overlay. */
  hero: `${PICSUM}/v-carpenter-hero/2000/1200`,

  /** "A Name Built on Integrity" — construction-in-progress portrait. */
  about: `${PICSUM}/v-carpenter-about/900/1100`,

  /** Four square service cards. */
  services: [
    `${PICSUM}/v-carpenter-svc-whole-home/900/900`,
    `${PICSUM}/v-carpenter-svc-kitchen-bath/900/900`,
    `${PICSUM}/v-carpenter-svc-addition/900/900`,
    `${PICSUM}/v-carpenter-svc-new-build/900/900`,
  ],

  /** Split-section large project photo (under "Dream Home Today" stats). */
  splitProject: `${PICSUM}/v-carpenter-split-project/1400/1100`,

  /** Process timeline — one image per step. */
  process: [
    `${PICSUM}/v-carpenter-step-consult/700/500`,
    `${PICSUM}/v-carpenter-step-planning/700/500`,
    `${PICSUM}/v-carpenter-step-build/700/500`,
    `${PICSUM}/v-carpenter-step-complete/700/500`,
  ],

  /** Project gallery — 4 cards, 2x2 grid. */
  projects: [
    `${PICSUM}/v-carpenter-proj-whole-home/1000/700`,
    `${PICSUM}/v-carpenter-proj-kitchen/1000/700`,
    `${PICSUM}/v-carpenter-proj-living/1000/700`,
    `${PICSUM}/v-carpenter-proj-exterior/1000/700`,
  ],
};
