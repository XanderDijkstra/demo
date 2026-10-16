import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCheck,
  Hammer,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  Wrench,
} from "lucide-react";

import type { GeneratedSiteContent } from "@/lib/db/types";
import type { NicheConfig } from "@/lib/templates";

import { CARPENTER_IMAGES } from "./carpenter-images";
import { foundedYear, yearsSinceFounded } from "./company-facts";

/**
 * Bespoke carpenter / snekker template.
 *
 * Design language: editorial premium-contractor look. Warm cream + dark
 * navy palette, mixed sans (Inter) + serif italic accents (Cormorant
 * Garamond) on every H2, full-bleed dark hero with an embedded contact
 * form on the right, image-heavy services + projects. Modeled after the
 * Ekman & Associates reference layout.
 *
 * The serif italic and a couple of accent colours (deep navy CTA, sand
 * pill) are hardcoded here as identity signals of THIS template, not
 * surfaced on the niche config.
 */

const NAVY = "oklch(0.22 0.04 250)";
const NAVY_DARK = "oklch(0.16 0.04 250)";
const SAND = "oklch(0.86 0.05 70)";
const SAND_LIGHT = "oklch(0.93 0.025 80)";
const CREAM = "oklch(0.96 0.018 80)";
const TAUPE = "oklch(0.55 0.04 60)";

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

const NAV = [
  { label: "Hjem", href: "#hjem" },
  { label: "Prosjekter", href: "#prosjekter" },
  { label: "Om oss", href: "#om-oss" },
  { label: "Tjenester", href: "#tjenester" },
  { label: "Kundeomtaler", href: "#anmeldelser" },
  { label: "Kontakt", href: "#kontakt" },
];

// Everything below is generic process copy. No years, counts, ratings,
// guarantees or team claims: the demo goes to newly registered companies.
function pillars(company: Props["company"]) {
  return [
    {
      icon: MapPin,
      title: company.kommune ? `Lokalt i ${company.kommune}` : "Lokal snekker",
      body: company.kommune
        ? `${company.name} holder til i ${company.kommune}.`
        : `Ta kontakt med ${company.name} for å høre om oppdraget ditt.`,
    },
    {
      icon: Wrench,
      title: "Snekkerarbeid",
      body: "Vi tar oppdrag innen renovering, kjøkken, tilbygg og nybygg.",
    },
    {
      icon: FileCheck,
      title: "Registrert i Brønnøysund",
      body: `Org.nr ${company.org_nr}.`,
    },
  ];
}

/** Hero fact strip, Brreg data only. "Etablert" only shows once the company
 *  is at least a year old. */
function facts(company: Props["company"]) {
  const list: { number: string; label: string }[] = [];
  if (company.kommune) list.push({ number: company.kommune, label: "Kommune" });
  list.push({ number: company.org_nr, label: "Org.nr" });
  if (yearsSinceFounded(company.founded_at) !== null) {
    list.push({
      number: String(foundedYear(company.founded_at)),
      label: "Etablert",
    });
  }
  return list;
}

const PROCESS = [
  {
    num: "01",
    title: "Første samtale",
    body: "Vi går gjennom hva du ønsker å få gjort, og avtaler befaring ved behov.",
    image: 0,
  },
  {
    num: "02",
    title: "Planlegging",
    body: "Løsning, materialvalg og pris avklares før arbeidet starter.",
    image: 1,
  },
  {
    num: "03",
    title: "Bygging",
    body: "Arbeidet gjøres etter det vi har avtalt, og du holdes orientert underveis.",
    image: 2,
  },
  {
    num: "04",
    title: "Ferdigstillelse",
    body: "Vi går gjennom resultatet sammen med deg når jobben er ferdig.",
    image: 3,
  },
];

const PROJECTS = [
  { title: "Kjøkken", caption: "Eksempelbilde" },
  { title: "Interiør", caption: "Eksempelbilde" },
  { title: "Uterom", caption: "Eksempelbilde" },
  { title: "Nybygg", caption: "Eksempelbilde" },
];

function faqs(company: Props["company"]) {
  return [
    {
      q: "Hvilke områder dekker dere?",
      a: company.kommune
        ? `Vi holder til i ${company.kommune}. Fortell oss hvor oppdraget er, så avklarer vi om vi kan ta det.`
        : "Fortell oss hvor oppdraget er, så avklarer vi om vi kan ta det.",
    },
    {
      q: "Hvor lang tid tar en renovering?",
      a: "Det avhenger av omfang og materialvalg. Ta kontakt, så ser vi på prosjektet ditt og gir deg et anslag.",
    },
    {
      q: "Kan jeg gjøre endringer underveis?",
      a: "Ta det opp med oss så tidlig som mulig, så avtaler vi endringen og eventuell prisjustering før vi går videre.",
    },
    {
      q: "Hva bør jeg ha klart før jeg tar kontakt?",
      a: "En kort beskrivelse av hva du ønsker, gjerne med bilder og omtrentlige mål. Det gjør det enklere å gi deg et anslag.",
    },
    {
      q: "Samarbeider dere med arkitekt eller interiørarkitekt?",
      a: "Ja, vi samarbeider gjerne med arkitekten eller designeren du allerede har valgt.",
    },
  ];
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function bestPhone(c: Props["company"]): string | null {
  return c.mobile ?? c.phone ?? null;
}

function formatPhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "").replace(/^0047/, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  }
  return raw;
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  return (words[0]?.[0] ?? "").toUpperCase();
}

// ─── root ────────────────────────────────────────────────────────────────────

export function CarpenterTemplate({ company, niche, content }: Props) {
  const phone = bestPhone(company);
  const phoneDisplay = formatPhone(phone);

  const headline = content.hero_headline ?? `Bygger din visjon, skaper varige rom`;
  const subheadline =
    content.hero_subheadline ??
    `Fra nybygg til kjøkken og bad: ${company.name} tar oppdrag innen snekkerarbeid${
      company.kommune ? ` i ${company.kommune}` : ""
    }.`;
  const about =
    content.about_paragraph ??
    `${company.name} er en snekkerbedrift${
      company.kommune ? ` i ${company.kommune}` : ""
    }. Fortell oss hva du planlegger, så finner vi ut av resten sammen.`;

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background: CREAM,
        // Editorial italic serif on every "swash" headline. Loaded
        // self-contained so the template doesn't need next/font wiring.
        // Fraunces italic for the editorial swash accent — more
        // character than Cormorant, variable optical sizing scales
        // beautifully at hero/headline size.
        ["--site-serif" as string]:
          'Fraunces, "Cormorant Garamond", "Playfair Display", Georgia, serif',
        ["--site-sans" as string]:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        ["--site-navy" as string]: NAVY,
        ["--site-navy-dark" as string]: NAVY_DARK,
        ["--site-sand" as string]: SAND,
        ["--site-sand-light" as string]: SAND_LIGHT,
        ["--site-cream" as string]: CREAM,
        ["--site-taupe" as string]: TAUPE,
        fontFamily: "var(--site-sans)",
      } as React.CSSProperties}
    >
      {/* Self-contained font loader. Adds <link> to the head client-side
          so the editorial italic ships with the page. */}
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,500;1,9..144,600;1,9..144,700&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <TopBar company={company} phone={phone} phoneDisplay={phoneDisplay} />

      <Hero
        company={company}
        phone={phone}
        phoneDisplay={phoneDisplay}
        headline={headline}
        subheadline={subheadline}
      />

      <Pillars company={company} />

      <About company={company} about={about} />

      <Services niche={niche} />

      <DreamHome />

      <Process />

      <Testimonials />

      <Projects />

      <FAQ company={company} />

      <FinalCta company={company} phone={phone} phoneDisplay={phoneDisplay} />

      <Footer company={company} phone={phone} phoneDisplay={phoneDisplay} />
    </div>
  );
}

// ─── topbar ─────────────────────────────────────────────────────────────────

function TopBar({
  company,
  phone,
  phoneDisplay,
}: {
  company: Props["company"];
  phone: string | null;
  phoneDisplay: string | null;
}) {
  return (
    <div className="fixed left-0 right-0 top-0 z-30 px-4 pt-3 sm:px-6 sm:pt-4">
      <header className="mx-auto flex max-w-7xl items-center gap-4 rounded-xl border border-black/5 bg-white/95 px-5 py-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur">
        <a href="#hjem" className="flex items-center gap-2.5 shrink-0">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white font-bold text-sm shadow-sm"
            style={{ background: NAVY }}
          >
            {initials(company.name)}
          </span>
          <span className="hidden sm:block text-[13px] font-semibold tracking-wider uppercase text-slate-900 leading-tight max-w-44 truncate">
            {company.name}
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-7 mx-auto text-sm text-slate-700">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="hover:text-slate-950 transition-colors"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="hidden md:inline-flex text-sm text-slate-800 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-700"
            >
              {phoneDisplay}
            </a>
          ) : null}
          <a
            href="#kontakt"
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: NAVY }}
          >
            Be om tilbud
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>
    </div>
  );
}

// ─── hero ───────────────────────────────────────────────────────────────────

function Hero({
  company,
  phone,
  phoneDisplay,
  headline,
  subheadline,
}: {
  company: Props["company"];
  phone: string | null;
  phoneDisplay: string | null;
  headline: string;
  subheadline: string;
}) {
  const splitWords = headline.trim().split(/\s+/);
  // Italicise a chunk of the headline for the editorial mix. Long
  // headlines get a middle-third italic; short 2–3-word headlines get
  // just the LAST word italicised (which still lands the swash accent
  // without leaving the sentence flat).
  let leading = headline;
  let italic = "";
  let trailing = "";
  if (splitWords.length >= 4) {
    const start = Math.floor(splitWords.length / 2) - 1;
    const end = start + Math.max(1, Math.floor(splitWords.length / 3));
    leading = splitWords.slice(0, start).join(" ") + " ";
    italic = splitWords.slice(start, end).join(" ");
    trailing = " " + splitWords.slice(end).join(" ");
  } else if (splitWords.length >= 2) {
    leading = splitWords.slice(0, -1).join(" ") + " ";
    italic = splitWords[splitWords.length - 1] ?? "";
    trailing = "";
  }

  return (
    <section id="hjem" className="relative isolate">
      <div className="absolute inset-0 -z-10">
        <img
          src={CARPENTER_IMAGES.hero}
          alt=""
          className="h-full w-full object-cover"
          loading="eager"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(15,20,40,0.62) 0%, rgba(15,20,40,0.38) 50%, rgba(15,20,40,0.18) 100%)",
          }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-14 lg:py-32">
        {/* Left, copy */}
        <div className="space-y-7 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            {company.kommune ? `Snekker i ${company.kommune}` : "Snekker"}
          </span>

          <h1
            className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--site-sans)" }}
          >
            {leading}
            {italic ? (
              <span
                style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
                className="font-medium text-white/95"
              >
                {italic}
              </span>
            ) : null}
            {trailing}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {subheadline}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-white/90"
            >
              Be om tilbud
              <ArrowRight className="h-4 w-4" />
            </a>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-3 rounded-md border border-white/30 px-4 py-2.5 text-sm text-white/90 hover:bg-white/10"
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <Phone className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase tracking-wider text-white/60">
                    Ring oss
                  </span>
                  <span className="block font-medium">{phoneDisplay}</span>
                </span>
              </a>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-white/15 pt-7 sm:grid-cols-3">
            {facts(company).map((s) => (
              <div key={s.number}>
                <div className="text-2xl font-semibold text-white sm:text-3xl">
                  {s.number}
                </div>
                <div className="mt-1 text-[11px] leading-snug text-white/70 sm:text-xs">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right, embedded contact panel */}
        <div className="lg:pl-2">
          <HeroForm />
        </div>
      </div>
    </section>
  );
}

function HeroForm() {
  // Server component: no event handlers. This is a presentational demo
  // form (the real lead-capture wiring happens later), so the button is
  // a plain non-submitting button and there's no onSubmit.
  return (
    <form
      className="rounded-2xl p-6 sm:p-7 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.55)]"
      style={{ background: SAND }}
    >
      <Field label="Fullt navn *">
        <input
          type="text"
          placeholder="Ola Nordmann"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none"
        />
      </Field>
      <Field label="Telefon">
        <input
          type="tel"
          placeholder="900 00 000"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none"
        />
      </Field>
      <Field label="E-post *">
        <input
          type="email"
          placeholder="post@eksempel.no"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none"
        />
      </Field>
      <Field label="Kort melding om prosjektet *">
        <textarea
          rows={4}
          placeholder="Fortell oss litt om planene dine."
          className="w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none"
        />
      </Field>

      <button
        type="button"
        className="mt-5 w-full rounded-md px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-95"
        style={{ background: NAVY_DARK }}
      >
        Send
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[12px] font-semibold text-slate-800">
        {label}
      </span>
      {children}
    </label>
  );
}

// ─── pillars ────────────────────────────────────────────────────────────────

function Pillars({ company }: { company: Props["company"] }) {
  const list = pillars(company);
  return (
    <section
      className="py-9 sm:py-11"
      style={{ background: SAND }}
    >
      <div className="mx-auto grid max-w-7xl gap-7 px-6 sm:grid-cols-3 sm:gap-10">
        {list.map((p, i) => (
          <div
            key={p.title}
            className={
              "text-center sm:px-4" +
              (i > 0 ? " sm:border-l sm:border-black/15" : "")
            }
          >
            <div className="mx-auto mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-white">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-md"
                style={{ background: NAVY_DARK }}
              >
                <p.icon className="h-4 w-4" />
              </span>
            </div>
            <h3 className="text-[15px] font-semibold text-slate-900">{p.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-700">
              {p.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── about ──────────────────────────────────────────────────────────────────

function About({
  company,
  about,
}: {
  company: Props["company"];
  about: string;
}) {
  return (
    <section id="om-oss" className="py-20 sm:py-24" style={{ background: CREAM }}>
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="overflow-hidden rounded-xl shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
          <img
            src={CARPENTER_IMAGES.about}
            alt="Eksempelbilde: snekkerarbeid"
            className="aspect-[4/5] h-full w-full object-cover"
          />
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Hvem
            <br />
            <span
              style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
              className="font-medium"
            >
              vi er
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-700">
            {about}
          </p>

          <div className="mt-8 space-y-6">
            <Subblock
              title="Hva vi tar på oss"
              body="Renovering, kjøkken og bad, tilbygg og nybygg. Se tjenestene lenger ned."
            />
            <Subblock
              title="Hvor vi holder til"
              body={`${
                company.kommune ? `Vi holder til i ${company.kommune}. ` : ""
              }Ta kontakt for å høre om vi kan ta oppdraget ditt.`}
            />
          </div>

          <a
            href="#tjenester"
            className="mt-9 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: NAVY }}
          >
            Se tjenestene
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Subblock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{body}</p>
    </div>
  );
}

// ─── services ───────────────────────────────────────────────────────────────

function Services({ niche }: { niche: NicheConfig }) {
  // Use the first 4 niche services, padded if needed.
  const services = niche.services.slice(0, 4);
  while (services.length < 4) {
    services.push({ title: "Skreddersydde løsninger", description: "" });
  }

  return (
    <section id="tjenester" className="py-20 sm:py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Slik{" "}
          <span
            style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
            className="font-medium"
          >
            løfter
          </span>{" "}
          vi ditt hjem
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <ServiceCard
              key={s.title}
              title={s.title}
              image={CARPENTER_IMAGES.services[i % CARPENTER_IMAGES.services.length]!}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#kontakt"
            className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: TAUPE }}
          >
            Utforsk våre tjenester
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ title, image }: { title: string; image: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-lg">
      <img
        src={image}
        alt=""
        className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        style={{ filter: "sepia(0.35) saturate(0.85) brightness(0.85)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,20,0.05) 40%, rgba(20,20,20,0.78) 100%)",
        }}
      />
      <div className="absolute inset-x-4 bottom-4 text-white">
        <div className="text-base font-semibold leading-tight sm:text-lg">
          {title}
        </div>
      </div>
    </div>
  );
}

// ─── dream-home (stats banner + split) ──────────────────────────────────────

function DreamHome() {
  return (
    <section className="relative" style={{ background: CREAM }}>
      {/* Split: photo left, dark panel right. The centered headline + stats
          banner that used to sit above this was dropped, stats already
          live in the hero, and the headline repeated below in the dark
          panel. */}
      <div className="grid lg:grid-cols-2">
        <div className="relative aspect-[5/3] lg:aspect-auto lg:min-h-[480px]">
          <img
            src={CARPENTER_IMAGES.splitProject}
            alt="Eksempelbilde: byggeprosjekt"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div
          className="flex items-center px-8 py-14 text-white sm:px-14 lg:py-20"
          style={{ background: NAVY_DARK }}
        >
          <div>
            <h3 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Skap ditt
              <br />
              <span
                style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
                className="font-medium text-white/90"
              >
                drømmehjem
              </span>{" "}
              i dag
            </h3>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              Fortell oss hva du ønsker å få gjort, så finner vi en løsning
              som passer boligen din.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                Renovering og tilbygg
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                Kjøkken og bad
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                Nybygg
              </li>
            </ul>

            <a
              href="#kontakt"
              className="mt-8 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-slate-900 transition-opacity hover:opacity-95"
              style={{ background: SAND }}
            >
              Be om tilbud
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── process timeline ───────────────────────────────────────────────────────

function Process() {
  return (
    <section className="py-20 sm:py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Vår{" "}
            <span
              style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
              className="font-medium"
            >
              prosess
            </span>
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((step) => (
            <div key={step.num} className="flex flex-col">
              <div className="overflow-hidden rounded-lg">
                <img
                  src={CARPENTER_IMAGES.process[step.image]!}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                  style={{ filter: "saturate(0.9)" }}
                />
              </div>
              <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {step.num}
              </div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── testimonials ───────────────────────────────────────────────────────────

function Testimonials() {
  // Placeholder only: a new company has no reviews, and invented ones
  // would be misleading. Clearly marked as a slot for their own.
  return (
    <section
      id="anmeldelser"
      className="py-20 sm:py-24 text-white"
      style={{ background: NAVY_DARK }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Hva{" "}
          <span
            style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
            className="font-medium text-white/90"
          >
            kundene sier
          </span>
        </h2>

        <div className="mx-auto mt-10 max-w-xl rounded-xl border border-dashed border-white/25 p-7 text-center">
          <MessageSquareQuote className="mx-auto h-6 w-6 text-white/40" aria-hidden />
          <p className="mt-4 text-[15px] text-white/80">
            Her kommer kundeomtalene deres
          </p>
          <p className="mt-2 text-xs text-white/50">
            Eksempelplass. Når de første kundene har gitt tilbakemelding, kan
            omtalene vises her.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── projects ───────────────────────────────────────────────────────────────

function Projects() {
  return (
    <section id="prosjekter" className="py-20 sm:py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Plass til deres{" "}
            <span
              style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
              className="font-medium"
            >
              prosjekter
            </span>
          </h2>
          <p className="max-w-sm text-sm text-slate-600">
            Bildene under er eksempelbilder og byttes ut med bilder fra egne
            oppdrag.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <div
              key={p.title}
              className="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="overflow-hidden">
                <img
                  src={CARPENTER_IMAGES.projects[i]!}
                  alt=""
                  className="aspect-[16/10] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              </div>
              <div className="px-5 py-4">
                <div className="text-base font-semibold text-slate-900">
                  {p.title}
                </div>
                <div className="mt-1 text-xs text-slate-600">{p.caption}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ────────────────────────────────────────────────────────────────────

function FAQ({ company }: { company: Props["company"] }) {
  return (
    <section className="py-20 sm:py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Ofte stilte{" "}
          <span
            style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
            className="font-medium"
          >
            spørsmål
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-700">
          Planlegger du en renovering eller nytt prosjekt? Her er svarene på
          spørsmålene vi oftest får.
        </p>

        <div className="mx-auto mt-10 grid max-w-5xl gap-3 lg:grid-cols-[1fr_1.4fr]">
          <div
            className="rounded-xl p-7 text-white"
            style={{ background: NAVY_DARK }}
          >
            <Hammer className="h-7 w-7 text-white/80" />
            <h3 className="mt-4 text-xl font-semibold leading-tight">
              Forvandle ditt{" "}
              <span
                style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
                className="font-medium text-white/90"
              >
                bo­rom
              </span>{" "}
              i dag
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Be om en uforpliktende prat med oss. Vi hører gjerne hva du har i
              tankene og foreslår hvordan vi kan bringe det til liv.
            </p>
            <a
              href="#kontakt"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white/95"
            >
              Kontakt oss
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="space-y-3">
            {faqs(company).map((f) => (
              <details
                key={f.q}
                className="group rounded-lg border border-slate-200 bg-white px-5 py-4 open:shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 text-left text-sm font-medium text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── final CTA ──────────────────────────────────────────────────────────────

function FinalCta({
  company,
  phone,
  phoneDisplay,
}: {
  company: Props["company"];
  phone: string | null;
  phoneDisplay: string | null;
}) {
  return (
    <section
      id="kontakt"
      className="relative isolate overflow-hidden text-white"
      style={{ background: NAVY_DARK }}
    >
      <div className="absolute inset-0 -z-10 opacity-25">
        <img
          src={CARPENTER_IMAGES.splitProject}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: NAVY_DARK, opacity: 0.7 }} />
      </div>

      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Bygger din
            <br />
            <span
              style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
              className="font-medium text-white/90"
            >
              visjon
            </span>{" "}
            sammen med deg
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
            Ta kontakt for å snakke om hva du ønsker å få gjort.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-white/95"
            >
              Be om tilbud
              <ArrowRight className="h-4 w-4" />
            </a>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-3 text-sm text-white/85 hover:text-white"
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.12)" }}
                >
                  <Phone className="h-4 w-4" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[10px] uppercase tracking-wider text-white/60">
                    Ring oss
                  </span>
                  <span className="block font-medium">{phoneDisplay}</span>
                </span>
              </a>
            ) : null}
          </div>
          <p className="mt-8 text-xs text-white/60">
            {company.name}
            {company.kommune ? ` • ${company.kommune}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── footer ─────────────────────────────────────────────────────────────────

function Footer({
  company,
  phone,
  phoneDisplay,
}: {
  company: Props["company"];
  phone: string | null;
  phoneDisplay: string | null;
}) {
  const address = [
    company.address_line,
    [company.postal_code, company.postal_place].filter(Boolean).join(" "),
  ]
    .filter((s) => s && s.trim().length > 0)
    .join(", ");

  return (
    <footer className="py-12" style={{ background: "#1a1b1f", color: "white" }}>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white font-bold text-sm"
              style={{ background: NAVY }}
            >
              {initials(company.name)}
            </span>
            <span className="text-[13px] font-semibold tracking-wider uppercase">
              {company.name}
            </span>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/55">
            Snekkerarbeid{company.kommune ? ` i ${company.kommune}` : ""}.
          </p>
        </div>

        <div className="text-sm text-white/75">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
            Navigasjon
          </div>
          <ul className="space-y-1.5">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="hover:text-white">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm text-white/75">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/55">
            Kontakt
          </div>
          <ul className="space-y-2">
            {phone ? (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" />
                <a href={`tel:${phone}`} className="hover:text-white">
                  {phoneDisplay}
                </a>
              </li>
            ) : null}
            {company.email ? (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" />
                <a href={`mailto:${company.email}`} className="hover:text-white">
                  {company.email}
                </a>
              </li>
            ) : null}
            {address ? (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" />
                <span>{address}</span>
              </li>
            ) : null}
            <li className="flex items-start gap-2 pt-1 text-white/55">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Org.nr {company.org_nr}
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-6 pt-6 text-[11px] text-white/45 flex flex-wrap items-center justify-between gap-3">
        <span>
          © {new Date().getFullYear()} {company.name}. Alle rettigheter
          reservert.
        </span>
        <span>
          <a className="hover:text-white/70">Personvern</a>
          {" · "}
          <a className="hover:text-white/70">Brukervilkår</a>
        </span>
      </div>
    </footer>
  );
}
