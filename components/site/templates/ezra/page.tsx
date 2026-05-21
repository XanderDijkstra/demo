"use client";

import "./_responsive-runtime.css";

// Framer's exported components are .js with no useful default-export
// type — only an internal variant enum. We default-import them and
// silence the "no declaration file" error per-line.

// @ts-expect-error -- no .d.ts
import About from "./About.js";
// @ts-expect-error -- no .d.ts
import Faq from "./Faq.js";
// @ts-expect-error -- no .d.ts
import Gallery from "./Gallery.js";
// @ts-expect-error -- no .d.ts
import Hero from "./Hero.js";
// @ts-expect-error -- no .d.ts
import HowItWork from "./HowItWork.js";
// @ts-expect-error -- no .d.ts
import Outdoor from "./Outdoor.js";
// @ts-expect-error -- no .d.ts
import Review from "./Review.js";
// @ts-expect-error -- no .d.ts
import Service from "./Service.js";
// @ts-expect-error -- no .d.ts
import Stats from "./Stats.js";
// @ts-expect-error -- no .d.ts
import WhyChoose from "./WhyChoose.js";

export function EzraPage() {
  return (
    <main className="bg-white text-black">
      <Hero />
      <WhyChoose />
      <About />
      <Service />
      <Stats />
      <Outdoor />
      <HowItWork />
      <Review />
      <Gallery />
      <Faq />
    </main>
  );
}
