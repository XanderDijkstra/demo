"use client";

import "./_responsive-runtime.css";
import "./ezra-overrides.css";

import Link from "next/link";

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
// @ts-expect-error -- no .d.ts
import { WithBreakpoints } from "./_responsive-runtime.js";

// Map each section's Framer variant ids (Desktop / Tablet / Phone) onto
// our breakpoints so the runtime hook picks the correct one per viewport.
const HERO_V = { lg: "LV87zzXaA", md: "EYN0s8m_3", base: "zf6fgjHIZ" };
const WHYCHOOSE_V = { lg: "mSjgD8pWD", md: "YtzUMC5oa", base: "I9gmGEPOT" };
const ABOUT_V = { lg: "rVEFYaO2Z", md: "NrpFbqg3r", base: "jmhnJmVun" };
const SERVICE_V = { lg: "lk_8NvRIs", md: "Omv2emDwo", base: "uGZ3BMCEy" };
const STATS_V = { lg: "b64B5bfwi", md: "VNvtjuctp", base: "VhR1nC7ED" };
const OUTDOOR_V = { lg: "EbrnYbH8A", md: "hxvAbGpJd", base: "OX5dFEqa1" };
const HOWITWORK_V = { lg: "IN3k5i1VJ", md: "tjRJvXGfs", base: "DZvwzY6Z5" };
const REVIEW_V = { lg: "yj1roa9nj", md: "ZIjP51lgn", base: "NH1rgPr2n" };
const GALLERY_V = { lg: "OGkuJwpqq", md: "Et2lwO06o", base: "ggitDlngd" };
const FAQ_V = { lg: "awrgypdto", md: "FsYTuPPCq", base: "k86CvSwA1" };

const NAV_LINKS = [
  { label: "Hjem", href: "#hero" },
  { label: "Om oss", href: "#about" },
  { label: "Tjenester", href: "#service" },
  { label: "Galleri", href: "#gallery" },
  { label: "FAQ", href: "#faq" },
];

export function EzraPage() {
  return (
    <div className="ezra-fullwidth bg-white text-black min-h-screen">
      <EzraHeader />
      <main className="w-full">
        <section id="hero">
          <WithBreakpoints Component={Hero} variants={HERO_V} />
        </section>
        <section id="why-choose">
          <WithBreakpoints Component={WhyChoose} variants={WHYCHOOSE_V} />
        </section>
        <section id="about">
          <WithBreakpoints Component={About} variants={ABOUT_V} />
        </section>
        <section id="service">
          <WithBreakpoints Component={Service} variants={SERVICE_V} />
        </section>
        <section id="stats">
          <WithBreakpoints Component={Stats} variants={STATS_V} />
        </section>
        <section id="outdoor">
          <WithBreakpoints Component={Outdoor} variants={OUTDOOR_V} />
        </section>
        <section id="how-it-works">
          <WithBreakpoints Component={HowItWork} variants={HOWITWORK_V} />
        </section>
        <section id="review">
          <WithBreakpoints Component={Review} variants={REVIEW_V} />
        </section>
        <section id="gallery">
          <WithBreakpoints Component={Gallery} variants={GALLERY_V} />
        </section>
        <section id="faq">
          <WithBreakpoints Component={Faq} variants={FAQ_V} />
        </section>
      </main>
    </div>
  );
}

function EzraHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-6">
        <Link
          href="#hero"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#beDd25] text-black text-sm font-bold">
            E
          </span>
          <span>Ezra Hagenouw</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-black/70 transition-colors hover:text-black"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="tel:+31614377968"
            className="hidden text-sm font-medium tabular-nums text-black/80 hover:text-black sm:inline"
          >
            +31 6 14377968
          </a>
          <a
            href="#contact"
            className="inline-flex h-9 items-center rounded-full bg-[#beDd25] px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            Gratis befaring
          </a>
        </div>
      </div>
    </header>
  );
}
