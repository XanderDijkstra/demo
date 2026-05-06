/**
 * Image registry for the landscaper template.
 *
 * Why this file exists:
 *   The previous version used `https://source.unsplash.com/?keyword` URLs.
 *   Unsplash deprecated that endpoint in 2024 — those URLs return errors
 *   instead of images, which is why the template was rendering blank.
 *
 * What's here today:
 *   Picsum.photos with deterministic seeds. These are GUARANTEED to load
 *   but they're random photos, not garden-themed. They're good enough to
 *   prove the layout works while you pick real imagery.
 *
 * How to swap in real photos:
 *   1. Browse https://unsplash.com/, pick a photo, click it.
 *   2. Right-click the image and "Copy image address". You'll get a URL
 *      like `https://images.unsplash.com/photo-xxxx?ixlib=...`.
 *   3. Replace the corresponding entry below with that URL.
 *      Add `&w=1600&q=80&auto=format` (or similar) to control delivery size.
 *
 *   Or self-host: drop JPGs into `/public/templates/landscaper/{name}.jpg`
 *   and reference them as `/templates/landscaper/{name}.jpg`.
 */

const PICSUM = "https://picsum.photos/seed";

export const LANDSCAPER_IMAGES = {
  /** Hero — full-bleed darkened backdrop. */
  hero: `${PICSUM}/v-landscaper-hero/1800/1200`,

  /** About section — square portrait of a gardener at work. */
  about: `${PICSUM}/v-landscaper-about/900/900`,

  /** BigCta — anleggsgartner med verktøy / image-left half. */
  bigCta: `${PICSUM}/v-landscaper-bigcta/1200/900`,

  /** Bottom dark CTA — image-right half. */
  bottomCta: `${PICSUM}/v-landscaper-bottom/1200/900`,

  /** Six service cards in the services grid. */
  services: [
    `${PICSUM}/v-svc-lawn/640/480`,
    `${PICSUM}/v-svc-paving/640/480`,
    `${PICSUM}/v-svc-fence/640/480`,
    `${PICSUM}/v-svc-renovation/640/480`,
    `${PICSUM}/v-svc-groundwork/640/480`,
    `${PICSUM}/v-svc-maintenance/640/480`,
  ] as const,

  /** Four process step cards. */
  process: [
    `${PICSUM}/v-step-quote/640/480`,
    `${PICSUM}/v-step-plan/640/480`,
    `${PICSUM}/v-step-execute/640/480`,
    `${PICSUM}/v-step-aftercare/640/480`,
  ] as const,

  /** Five photos in the asymmetric projects gallery. Second one is the tall
   *  image that spans two grid rows on desktop. */
  projects: [
    { src: `${PICSUM}/v-proj-mow/700/500`, alt: "Plenklipping", tall: false },
    { src: `${PICSUM}/v-proj-house/700/900`, alt: "Hageprosjekt", tall: true },
    { src: `${PICSUM}/v-proj-edge/700/500`, alt: "Plenkanting", tall: false },
    { src: `${PICSUM}/v-proj-prune/700/500`, alt: "Beskjæring", tall: false },
    { src: `${PICSUM}/v-proj-spray/700/500`, alt: "Plantebehandling", tall: false },
  ] as const,

  /** Three blog post thumbnails. */
  blog: [
    `${PICSUM}/v-blog-paving/720/540`,
    `${PICSUM}/v-blog-renovation/720/540`,
    `${PICSUM}/v-blog-pruning/720/540`,
  ] as const,
} as const;
