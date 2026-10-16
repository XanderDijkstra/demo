import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileCheck,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  Wrench,
} from "lucide-react";

import type { GeneratedSiteContent } from "@/lib/db/types";
import type { NicheConfig } from "@/lib/templates";

import { foundedYear, yearsSinceFounded } from "./company-facts";
import { CONTRACTOR_IMAGES } from "./contractor-images";

/**
 * Bespoke general-contractor template.
 *
 * Design language: warm-charcoal/sand/bronze palette, editorial italic
 * accents in every H2, full-bleed hero with embedded form, dark/light
 * section alternation. Modeled after premium home-services sites.
 *
 * Bronze accent (used for the form's primary CTA) and the warm-charcoal
 * background of the dark sections are hardcoded here as identity signals
 * of this template, not surfaced on the niche config.
 */

const DARK = "oklch(0.18 0.012 70)";
const DARK_SOFT = "oklch(0.24 0.014 70)";
const CREAM = "oklch(0.91 0.04 80)";
const CREAM_LIGHT = "oklch(0.95 0.02 80)";
const BRONZE = "oklch(0.62 0.07 70)";
const BRONZE_DEEP = "oklch(0.46 0.06 60)";

interface Props {
  company: {
    org_nr: string;
    name: string;
    kommune: string | null;
    address_line: string | null;
    postal_code: string | null;
    postal_place: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    website: string | null;
    founded_at: string | null;
  };
  niche: NicheConfig;
  content: GeneratedSiteContent;
}

// Process + FAQ copy describes how a job typically runs, without promising
// timelines, team size, guarantees or anything else we can't know about a
// newly registered company.
const PROCESS_STEPS = [
  {
    num: "01",
    title: "Første samtale",
    body: "Vi går gjennom hva du ønsker å få gjort, og avtaler befaring ved behov.",
  },
  {
    num: "02",
    title: "Planlegging",
    body: "Løsninger, materialvalg og pris avklares før arbeidet starter.",
  },
  {
    num: "03",
    title: "Utførelse",
    body: "Arbeidet gjøres etter det vi har avtalt, og du holdes orientert underveis.",
  },
  {
    num: "04",
    title: "Overlevering",
    body: "Vi går gjennom resultatet sammen med deg når jobben er ferdig.",
  },
];

function faqItems(company: Props["company"]) {
  return [
    {
      q: "Hvor lang tid tar en renovering?",
      a: "Det avhenger av omfang og materialvalg. Ta kontakt, så ser vi på prosjektet ditt og gir deg et anslag.",
    },
    {
      q: "Kan jeg gjøre endringer underveis?",
      a: "Ta det opp med oss så tidlig som mulig, så avtaler vi endringen og eventuell prisjustering før vi går videre.",
    },
    {
      q: "Hvilke områder dekker dere?",
      a: company.kommune
        ? `Vi holder til i ${company.kommune}. Fortell oss hvor prosjektet er, så avklarer vi om vi kan ta oppdraget.`
        : "Fortell oss hvor prosjektet er, så avklarer vi om vi kan ta oppdraget.",
    },
    {
      q: "Kan dere samarbeide med arkitekt eller interiørarkitekt?",
      a: "Ja, vi samarbeider gjerne med arkitekten eller designeren du allerede har valgt.",
    },
  ];
}

const PILLAR_TAGS = [
  "Bolig",
  "Kjøkken",
  "Bad",
  "Tilbygg",
  "Påbygg",
  "Garasje",
  "Loft",
  "Kjeller",
];

function bestPhone(c: Props["company"]): string | null {
  return c.mobile ?? c.phone ?? null;
}

/** "Etablert 2019" only when Brreg's founding date is at least a year back;
 *  brand-new companies get nothing rather than a misleading number. */
function establishedLabel(foundedAt: string | null): string | null {
  return yearsSinceFounded(foundedAt) !== null
    ? `Etablert ${foundedYear(foundedAt)}`
    : null;
}

export function ContractorTemplate({ company, niche, content }: Props) {
  const phone = bestPhone(company);
  const headline =
    content.hero_headline ??
    `Bygg og oppussing${company.kommune ? ` i ${company.kommune}` : ""}`;
  const subheadline =
    content.hero_subheadline ??
    `Renovering, tilbygg, kjøkken og bad. Ta kontakt for en prat om prosjektet ditt.`;
  const aboutBody =
    content.about_paragraph ??
    `${company.name} tar oppdrag innen bygg og oppussing${
      company.kommune ? ` i ${company.kommune}` : ""
    }. Fortell oss hva du planlegger, så finner vi ut av resten sammen.`;

  return (
    <div
      className="min-h-screen text-[color:var(--ink)]"
      style={
        {
          "--ink": DARK,
          "--ink-soft": DARK_SOFT,
          "--cream": CREAM,
          "--cream-light": CREAM_LIGHT,
          "--bronze": BRONZE,
          "--bronze-deep": BRONZE_DEEP,
          background: CREAM,
        } as React.CSSProperties
      }
    >
      <Hero
        company={company}
        phone={phone}
        headline={headline}
        subheadline={subheadline}
      />
      <Pillars company={company} />
      <About company={company} body={aboutBody} />
      <ServicesBanner niche={niche} />
      <Services niche={niche} />
      <Process />
      <Testimonials />
      <Projects />
      <FaqAndCta company={company} />
      <FinalCta company={company} phone={phone} />
      <Footer company={company} phone={phone} />
    </div>
  );
}

// ─── Header (sticky over hero) ───────────────────────────────────────────────

function Header({
  company,
  phone,
  variant,
}: {
  company: Props["company"];
  phone: string | null;
  variant: "over-hero" | "solid";
}) {
  const onHero = variant === "over-hero";
  return (
    <header
      className={
        onHero
          ? "absolute inset-x-0 top-0 z-30 px-6 pt-6 md:px-10"
          : "border-b border-[color:var(--ink)]/10 bg-[color:var(--cream)] px-6 py-5 md:px-10"
      }
    >
      <div
        className={
          onHero
            ? "mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full bg-[color:var(--cream-light)]/90 px-5 py-2.5 shadow-[0_8px_30px_rgba(20,15,10,0.08)] ring-1 ring-[color:var(--ink)]/10 backdrop-blur-md"
            : "mx-auto flex max-w-7xl items-center justify-between gap-4"
        }
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-[color:var(--cream-light)]"
            style={{ background: DARK }}
          >
            <span className="font-medium text-[13px] italic">{company.name.charAt(0)}</span>
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink)]/60">
              {company.name}
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-7 text-sm text-[color:var(--ink)]/80 md:flex">
          <a href="#hjem" className="hover:text-[color:var(--ink)]">Hjem</a>
          <a href="#prosjekter" className="hover:text-[color:var(--ink)]">Prosjekter</a>
          <a href="#om" className="hover:text-[color:var(--ink)]">Om oss</a>
          <a href="#tjenester" className="hover:text-[color:var(--ink)]">Tjenester</a>
          <a href="#anbefalinger" className="hover:text-[color:var(--ink)]">Kundeomtaler</a>
          <a href="#kontakt" className="hover:text-[color:var(--ink)]">Kontakt</a>
        </nav>

        <div className="flex items-center gap-4">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="hidden text-sm tabular-nums text-[color:var(--ink)] md:inline"
            >
              {phone}
            </a>
          ) : null}
          <a
            href="#kontakt"
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-medium text-[color:var(--cream-light)] hover:bg-[color:var(--ink-soft)]"
          >
            Be om tilbud
          </a>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({
  company,
  phone,
  headline,
  subheadline,
}: {
  company: Props["company"];
  phone: string | null;
  headline: string;
  subheadline: string;
}) {
  return (
    <section id="hjem" className="relative isolate overflow-hidden">
      <Header company={company} phone={phone} variant="over-hero" />

      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CONTRACTOR_IMAGES.hero}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/10" />
      </div>

      <div className="mx-auto grid max-w-7xl items-end gap-10 px-6 pt-40 pb-12 md:px-10 md:pt-48 lg:grid-cols-[1.1fr_minmax(360px,420px)] lg:gap-16 lg:items-end">
        {/* Left: kicker + headline + subhead + ctas */}
        <div className="space-y-6 text-[color:var(--cream-light)] md:space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/35 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--cream-light)]/85 ring-1 ring-white/15 backdrop-blur">
            <Check className="h-3 w-3" style={{ color: BRONZE }} />
            Bygg og oppussing
            {company.kommune ? ` · ${company.kommune}` : ""}
          </div>
          <h1 className="font-medium text-5xl font-medium leading-[0.98] tracking-tight md:text-7xl lg:text-[5.5rem]">
            {headline.split(" ").map((word, i, arr) => {
              // Italicize the last word as the editorial accent.
              const isLast = i === arr.length - 1;
              return isLast ? (
                <em key={i} className="font-medium italic">
                  {word}
                </em>
              ) : (
                <span key={i}>{word} </span>
              );
            })}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[color:var(--cream-light)]/85 md:text-lg">
            {subheadline}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--cream-light)] px-5 py-2.5 text-sm font-semibold text-[color:var(--ink)] hover:bg-white"
            >
              Be om tilbud
              <ArrowRight className="h-4 w-4" />
            </a>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="group inline-flex items-center gap-3 rounded-full px-2 py-1 text-sm text-[color:var(--cream-light)]/95"
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur transition-colors group-hover:bg-white/25"
                >
                  <Phone className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-[color:var(--cream-light)]/65">
                    Ring oss
                  </span>
                  <span className="block tabular-nums">{phone}</span>
                </span>
              </a>
            ) : null}
          </div>

          {/* Fact strip — Brreg data only. */}
          <div className="grid grid-cols-2 gap-y-4 pt-6 sm:grid-cols-3">
            {company.kommune ? (
              <Stat value={company.kommune} label="Kommune" />
            ) : null}
            <Stat value={company.org_nr} label="Org.nr" />
            {establishedLabel(company.founded_at) ? (
              <Stat
                value={String(foundedYear(company.founded_at))}
                label="Etablert"
              />
            ) : null}
          </div>
        </div>

        {/* Right: dark form card */}
        <HeroForm />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="border-l border-white/15 pl-3 first:border-l-0 first:pl-0">
      <div className="font-medium text-3xl tracking-tight">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-[color:var(--cream-light)]/65">
        {label}
      </div>
    </div>
  );
}

function HeroForm() {
  return (
    <div
      className="relative rounded-[28px] p-7 text-[color:var(--cream-light)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] ring-1 ring-white/10 md:p-8"
      style={{ background: DARK }}
    >
      <div className="flex items-center gap-3 pb-5 text-[11px] uppercase tracking-[0.22em] text-[color:var(--cream-light)]/60">
        <span aria-hidden className="h-px w-6 bg-[color:var(--cream-light)]/30" />
        Be om tilbud
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Navn">
          <FakeInput placeholder="Fullt navn" />
        </FormField>
        <FormField label="E-post">
          <FakeInput placeholder="navn@eksempel.no" type="email" />
        </FormField>
      </div>
      <div className="mt-3">
        <FormField label="Hva kan vi hjelpe med?">
          <select
            disabled
            className="w-full appearance-none rounded-md bg-[color:var(--ink-soft)] px-3 py-2.5 text-sm text-[color:var(--cream-light)]/90 ring-1 ring-white/10 focus:outline-none"
          >
            <option>Velg prosjekttype</option>
            <option>Total boligrenovasjon</option>
            <option>Kjøkken / stue</option>
            <option>Bad og våtrom</option>
            <option>Tilbygg / påbygg</option>
          </select>
        </FormField>
      </div>
      <button
        type="button"
        disabled
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--cream-light)] hover:opacity-90"
        style={{ background: BRONZE_DEEP }}
      >
        Send
      </button>
      <p className="mt-3 text-center text-[10px] text-[color:var(--cream-light)]/40">
        Demo-skjema. Ta direkte kontakt på telefon eller e-post.
      </p>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--cream-light)]/55">
        {label}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function FakeInput({
  placeholder,
  type = "text",
}: {
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      disabled
      placeholder={placeholder}
      className="w-full rounded-md bg-[color:var(--ink-soft)] px-3 py-2.5 text-sm text-[color:var(--cream-light)]/90 placeholder:text-[color:var(--cream-light)]/35 ring-1 ring-white/10 focus:outline-none"
    />
  );
}

// ─── Pillars (3-col strip with hairlines) ────────────────────────────────────

function Pillars({ company }: { company: Props["company"] }) {
  const pillars = [
    {
      icon: MapPin,
      title: company.kommune ? `Lokalt i ${company.kommune}` : "Lokalt firma",
      body: company.kommune
        ? `${company.name} holder til i ${company.kommune}.`
        : `Ta kontakt med ${company.name} for å høre om oppdraget ditt.`,
    },
    {
      icon: Wrench,
      title: "Bygg og oppussing",
      body: "Vi tar oppdrag innen renovering, tilbygg, kjøkken, bad og uterom.",
    },
    {
      icon: FileCheck,
      title: "Registrert i Brønnøysund",
      body: `Org.nr ${company.org_nr}.`,
    },
  ];
  return (
    <section
      className="border-y border-[color:var(--ink)]/10 px-6 py-10 md:px-10"
      style={{ background: BRONZE_DEEP }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 text-[color:var(--cream-light)] md:grid-cols-3 md:divide-x md:divide-white/15 md:gap-0">
        {pillars.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className={
                i === 0 ? "md:pr-8" : i === pillars.length - 1 ? "md:pl-8" : "md:px-8"
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" style={{ color: BRONZE }} />
                <h3 className="text-sm font-semibold tracking-tight">
                  {p.title}
                </h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--cream-light)]/75">
                {p.body}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── About ───────────────────────────────────────────────────────────────────

function About({
  company,
  body,
}: {
  company: Props["company"];
  body: string;
}) {
  return (
    <section id="om" className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-20">
        <div className="relative">
          <div className="aspect-[5/6] overflow-hidden rounded-[6px] bg-[color:var(--ink)]/10 shadow-[0_30px_60px_-30px_rgba(20,15,10,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CONTRACTOR_IMAGES.about}
              alt="Eksempelbilde: sparkling av vegg"
              className="h-full w-full object-cover"
            />
          </div>
          {establishedLabel(company.founded_at) ? (
            <div
              className="absolute -bottom-6 -right-6 hidden rounded-full bg-[color:var(--ink)] px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-[color:var(--cream-light)] sm:inline-flex md:-bottom-8 md:-right-8 md:px-5 md:py-2.5"
            >
              {establishedLabel(company.founded_at)}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55">
            <span aria-hidden className="h-px w-8 bg-[color:var(--ink)]/30" />
            Om {company.name}
          </div>
          <h2 className="mt-5 font-medium text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            Dedikert til å bygge din{" "}
            <em className="font-medium italic">visjon</em>.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--ink)]/75">
            {body}
          </p>

          <div className="mt-9 grid gap-7 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Hva vi tar på oss
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink)]/65">
                Renovering, tilbygg, kjøkken, bad og uterom. Se tjenestene
                lenger ned.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">
                Hvor vi holder til
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink)]/65">
                {company.kommune
                  ? `Vi holder til i ${company.kommune}. `
                  : ""}
                Ta kontakt for å høre om vi kan ta oppdraget ditt.
              </p>
            </div>
          </div>

          <a
            href="#tjenester"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-5 py-2.5 text-sm font-medium text-[color:var(--cream-light)] hover:bg-[color:var(--ink-soft)]"
          >
            Se tjenestene
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Services banner (thin earth-toned strip) ────────────────────────────────

function ServicesBanner({ niche: _niche }: { niche: NicheConfig }) {
  return (
    <section
      id="tjenester"
      className="relative isolate overflow-hidden px-6 py-20 text-[color:var(--cream-light)] md:px-10"
      style={{ background: DARK }}
    >
      <div className="mx-auto max-w-6xl text-center">
        <div className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--cream-light)]/55">
          <span aria-hidden className="h-px w-8 bg-[color:var(--cream-light)]/30" />
          Tjenester
          <span aria-hidden className="h-px w-8 bg-[color:var(--cream-light)]/30" />
        </div>
        <h2 className="mt-5 font-medium text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
          Våre fagtjenester{" "}
          <em className="font-medium italic">i dag</em>.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm text-[color:var(--cream-light)]/65 md:text-base">
          Et utvalg av oppdragene vi tar på oss.
        </p>
      </div>

      <div className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-2">
        {PILLAR_TAGS.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[color:var(--cream-light)]/15 px-3.5 py-1 text-xs text-[color:var(--cream-light)]/75"
          >
            {tag}
          </span>
        ))}
      </div>
    </section>
  );
}

// ─── Services list (alternating image-text rows) ────────────────────────────

function Services({ niche }: { niche: NicheConfig }) {
  const list = niche.services.slice(0, 6);
  return (
    <section className="px-6 py-24 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {list.map((s, i) => {
            const image =
              CONTRACTOR_IMAGES.services[i] ?? CONTRACTOR_IMAGES.services[0]!;
            return (
              <article
                key={s.title}
                className="group rounded-[10px] bg-[color:var(--cream-light)] p-3 ring-1 ring-[color:var(--ink)]/8 hover:shadow-[0_20px_40px_-25px_rgba(20,15,10,0.35)]"
              >
                <div className="aspect-[3/2] overflow-hidden rounded-[6px] bg-[color:var(--ink)]/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex items-start justify-between gap-3 px-2 py-4">
                  <div>
                    <h3 className="text-xl font-medium tracking-tight">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[color:var(--ink)]/65">
                      {s.description}
                    </p>
                  </div>
                  <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[color:var(--ink)]/45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Process (4 numbered cards) ─────────────────────────────────────────────

function Process() {
  return (
    <section
      className="border-y border-[color:var(--ink)]/10 px-6 py-24 md:px-10"
      style={{ background: CREAM_LIGHT }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ink)]/30" />
              Prosess
            </div>
            <h2 className="mt-5 font-medium text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
              Slik bygger vi{" "}
              <em className="font-medium italic">sammen</em>.
            </h2>
          </div>
          <p className="hidden max-w-sm text-sm text-[color:var(--ink)]/65 md:block">
            Slik foregår et typisk oppdrag, fra første samtale til ferdig
            resultat.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS_STEPS.map((step, i) => (
            <article key={step.num} className="group relative flex flex-col">
              <div className="font-medium text-xs italic text-[color:var(--ink)]/40 tabular-nums">
                {step.num}
              </div>
              <h3 className="mt-2 font-medium text-2xl font-medium tracking-tight">
                {step.title}
              </h3>
              <div className="mt-5 aspect-[5/4] overflow-hidden rounded-[6px] bg-[color:var(--ink)]/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    CONTRACTOR_IMAGES.process[i] ??
                    CONTRACTOR_IMAGES.process[0]!
                  }
                  alt={step.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <p className="mt-5 text-sm leading-relaxed text-[color:var(--ink)]/65">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials placeholder (dark) ────────────────────────────────────────
// No reviews are shown: the company is new and anything here would be
// invented. The slot is visibly marked as a place for their own reviews.

function Testimonials() {
  return (
    <section
      id="anbefalinger"
      className="px-6 py-24 text-[color:var(--cream-light)] md:px-10 md:py-32"
      style={{ background: DARK }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--cream-light)]/55">
          <span aria-hidden className="h-px w-8 bg-[color:var(--cream-light)]/30" />
          Kundeomtaler
          <span aria-hidden className="h-px w-8 bg-[color:var(--cream-light)]/30" />
        </div>
        <h2 className="mt-5 font-medium text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
          Hva kundene{" "}
          <em className="font-medium italic">sier</em>.
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-3xl rounded-[10px] border border-dashed border-[color:var(--cream-light)]/25 p-8 text-center md:p-12">
        <MessageSquareQuote
          className="mx-auto h-7 w-7 text-[color:var(--cream-light)]/40"
          aria-hidden
        />
        <p className="mt-5 text-lg text-[color:var(--cream-light)]/80 md:text-xl">
          Her kommer kundeomtalene deres
        </p>
        <p className="mt-3 text-sm text-[color:var(--cream-light)]/50">
          Eksempelplass. Når de første kundene har gitt tilbakemelding, kan
          omtalene vises her.
        </p>
      </div>
    </section>
  );
}

// ─── Projects gallery ──────────────────────────────────────────────────────

function Projects() {
  return (
    <section id="prosjekter" className="px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55">
              <span aria-hidden className="h-px w-8 bg-[color:var(--ink)]/30" />
              Prosjekter
            </div>
            <h2 className="mt-5 font-medium text-4xl font-medium tracking-tight md:text-5xl lg:text-6xl">
              Plass til deres{" "}
              <em className="font-medium italic">prosjekter</em>.
            </h2>
          </div>
          <p className="max-w-sm text-sm text-[color:var(--ink)]/60">
            Bildene under er eksempelbilder og byttes ut med bilder fra egne
            oppdrag.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:gap-7">
          {CONTRACTOR_IMAGES.projects.map((p) => (
            <article
              key={p.title}
              className="group rounded-[10px] bg-[color:var(--cream-light)] p-3 ring-1 ring-[color:var(--ink)]/8 hover:shadow-[0_20px_40px_-25px_rgba(20,15,10,0.35)]"
            >
              <div className="aspect-[3/2] overflow-hidden rounded-[6px] bg-[color:var(--ink)]/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-2 py-4">
                <div>
                  <h3 className="font-medium text-xl font-medium tracking-tight">
                    {p.title}
                  </h3>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink)]/55">
                    Eksempelbilde
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ + side CTA card (dark) ────────────────────────────────────────────

function FaqAndCta({ company }: { company: Props["company"] }) {
  return (
    <section
      className="px-6 py-24 text-[color:var(--cream-light)] md:px-10 md:py-32"
      style={{ background: DARK }}
    >
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12">
        {/* Side CTA card */}
        <aside
          className="relative flex flex-col justify-between overflow-hidden rounded-[14px] p-8 ring-1 ring-white/10"
          style={{ background: DARK_SOFT }}
        >
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--cream-light)]/55">
              La oss snakkes
            </div>
            <h3 className="mt-4 font-medium text-3xl font-medium leading-[1.05] tracking-tight md:text-4xl">
              Har du et{" "}
              <em className="font-medium italic">prosjekt</em> på gang?
            </h3>
            <p className="mt-5 text-sm leading-relaxed text-[color:var(--cream-light)]/70">
              Fortell oss hva du planlegger, så tar vi en prat om muligheter
              og pris.
            </p>
          </div>
          <a
            href={
              company.email ? `mailto:${company.email}` : "#kontakt"
            }
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-[color:var(--cream-light)] px-5 py-3 text-sm font-medium text-[color:var(--ink)] hover:bg-white"
          >
            Ta kontakt
            <ArrowRight className="h-4 w-4" />
          </a>
        </aside>

        {/* FAQ accordion */}
        <div className="space-y-3">
          {faqItems(company).map((item, i) => (
            <details
              key={item.q}
              className="group rounded-[10px] bg-[color:var(--ink-soft)] p-5 ring-1 ring-white/10 open:bg-[color:var(--ink-soft)]"
              {...(i === 0 ? { open: true } : {})}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[15px] font-medium tracking-tight">
                <span>{item.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--cream-light)]/60 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-sm leading-relaxed text-[color:var(--cream-light)]/70">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA (cream with bg image) ───────────────────────────────────────

function FinalCta({
  company,
  phone,
}: {
  company: Props["company"];
  phone: string | null;
}) {
  return (
    <section className="relative isolate overflow-hidden px-6 py-28 md:px-10 md:py-36">
      <div className="absolute inset-0 -z-10 opacity-15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={CONTRACTOR_IMAGES.finalCta}
          alt=""
          className="h-full w-full object-cover"
          aria-hidden
        />
      </div>
      <div className="absolute inset-0 -z-10" style={{ background: CREAM }} />

      <div className="mx-auto max-w-3xl text-center">
        <div className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--ink)]/55">
          <span aria-hidden className="h-px w-8 bg-[color:var(--ink)]/30" />
          {company.kommune ?? "Ditt nabolag"}
          <span aria-hidden className="h-px w-8 bg-[color:var(--ink)]/30" />
        </div>
        <h2 className="mt-6 font-medium text-5xl font-medium leading-[1.02] tracking-tight md:text-7xl">
          Klar for neste{" "}
          <em className="font-medium italic">prosjekt</em>?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[color:var(--ink)]/70">
          Ta kontakt for å snakke om hva du ønsker å få gjort.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#kontakt"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-medium text-[color:var(--cream-light)] hover:bg-[color:var(--ink-soft)]"
          >
            Be om tilbud
            <ArrowRight className="h-4 w-4" />
          </a>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--cream-light)] px-6 py-3 text-sm font-medium text-[color:var(--ink)] ring-1 ring-[color:var(--ink)]/10 hover:bg-white"
            >
              <Phone className="h-4 w-4" />
              {phone}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────

function Footer({
  company,
  phone,
}: {
  company: Props["company"];
  phone: string | null;
}) {
  return (
    <footer
      id="kontakt"
      className="px-6 pt-20 pb-10 text-[color:var(--cream-light)] md:px-10"
      style={{ background: DARK }}
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm"
              style={{ background: BRONZE }}
            >
              <span className="font-medium text-base italic text-[color:var(--ink)]">
                {company.name.charAt(0)}
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-[0.22em]">
                {company.name}
              </div>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm text-[color:var(--cream-light)]/65">
            Bygg og oppussing
            {company.kommune ? ` i ${company.kommune}` : ""}.
          </p>
          <a
            href="#kontakt"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--cream-light)] px-4 py-2 text-sm font-medium text-[color:var(--ink)] hover:bg-white"
          >
            Ta kontakt
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <FooterColumn title="Navigasjon">
          <FooterLink href="#hjem">Hjem</FooterLink>
          <FooterLink href="#prosjekter">Prosjekter</FooterLink>
          <FooterLink href="#om">Om oss</FooterLink>
          <FooterLink href="#tjenester">Tjenester</FooterLink>
          <FooterLink href="#anbefalinger">Kundeomtaler</FooterLink>
        </FooterColumn>

        <FooterColumn title="Tjenester">
          <FooterLink href="#tjenester">Boligrenovasjon</FooterLink>
          <FooterLink href="#tjenester">Kjøkken og stue</FooterLink>
          <FooterLink href="#tjenester">Bad og våtrom</FooterLink>
          <FooterLink href="#tjenester">Tilbygg / påbygg</FooterLink>
          <FooterLink href="#tjenester">Snekker og innredning</FooterLink>
        </FooterColumn>

        <FooterColumn title="Kontakt">
          {company.email ? (
            <a
              href={`mailto:${company.email}`}
              className="inline-flex items-center gap-2 text-sm text-[color:var(--cream-light)]/80 hover:text-[color:var(--cream-light)]"
            >
              <Mail className="h-3.5 w-3.5" />
              {company.email}
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 text-sm text-[color:var(--cream-light)]/80 hover:text-[color:var(--cream-light)]"
            >
              <Phone className="h-3.5 w-3.5" />
              {phone}
            </a>
          ) : null}
          {company.address_line || company.postal_place ? (
            <div className="flex items-start gap-2 text-sm text-[color:var(--cream-light)]/65">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {company.address_line}
                {company.postal_code || company.postal_place ? (
                  <div>
                    {company.postal_code} {company.postal_place}
                  </div>
                ) : null}
              </span>
            </div>
          ) : null}
        </FooterColumn>
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-[color:var(--cream-light)]/45 md:flex-row md:items-center md:justify-between">
        <div>
          © {new Date().getFullYear()} {company.name} · Org.nr {company.org_nr}
        </div>
        <div>Demonstrasjon laget av FX Media</div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--cream-light)]/45">
        {title}
      </div>
      <div className="mt-4 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-sm text-[color:var(--cream-light)]/80 hover:text-[color:var(--cream-light)]"
    >
      {children}
    </a>
  );
}
