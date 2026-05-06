/**
 * Image registry for the contractor / general-contractor template.
 *
 * Picsum seeds are placeholders that GUARANTEE images load. They're not
 * themed — replace each entry with a curated photo when you find ones you
 * like. The reference design uses warm-toned residential interiors and
 * exteriors (kitchens, living rooms, suburban houses), so look for those.
 *
 * To swap:
 *   1. Pick a photo on unsplash.com → right-click image → Copy image address
 *   2. Replace the entry with the URL plus `?w={width}&q=80&auto=format`
 *   3. Or self-host: drop JPG into /public/templates/contractor/{name}.jpg
 *      and reference as /templates/contractor/{name}.jpg
 */

const PICSUM = "https://picsum.photos/seed";

export const CONTRACTOR_IMAGES = {
  /** Hero — full-bleed warm interior (kitchen / living room). */
  hero: `${PICSUM}/v-contractor-hero/2000/1200`,

  /** About — tall portrait of construction / interior work in progress. */
  about: `${PICSUM}/v-contractor-about/900/1100`,

  /** Process steps (4 cards: consultation, design, construction, completion). */
  process: [
    `${PICSUM}/v-contractor-step-1/640/480`,
    `${PICSUM}/v-contractor-step-2/640/480`,
    `${PICSUM}/v-contractor-step-3/640/480`,
    `${PICSUM}/v-contractor-step-4/640/480`,
  ] as const,

  /** Project gallery (4 cards in a 2x2 grid). */
  projects: [
    {
      src: `${PICSUM}/v-contractor-proj-1/900/600`,
      title: "Total boligrenovasjon",
      location: "Oslo",
    },
    {
      src: `${PICSUM}/v-contractor-proj-2/900/600`,
      title: "Kjøkken og stueoppussing",
      location: "Bergen",
    },
    {
      src: `${PICSUM}/v-contractor-proj-3/900/600`,
      title: "Påbygg",
      location: "Stavanger",
    },
    {
      src: `${PICSUM}/v-contractor-proj-4/900/600`,
      title: "Total uteplass",
      location: "Trondheim",
    },
  ] as const,

  /** Final CTA — subtle warm interior used as background watermark. */
  finalCta: `${PICSUM}/v-contractor-cta/1800/900`,
} as const;
