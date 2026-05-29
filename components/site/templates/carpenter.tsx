import {
  ArrowRight,
  Check,
  ChevronDown,
  Hammer,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";

import type { GeneratedSiteContent } from "@/lib/supabase/types";
import type { NicheConfig } from "@/lib/templates";

import { CARPENTER_IMAGES } from "./carpenter-images";

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
  { label: "Anmeldelser", href: "#anmeldelser" },
  { label: "Kontakt", href: "#kontakt" },
];

const PILLARS = [
  {
    icon: Wrench,
    title: "Kompromissløst håndverk",
    body: "Hvert prosjekt holdes til høyeste standard for konstruksjon og arkitektonisk finesse — ingen snarveier, ingen kompromisser.",
  },
  {
    icon: ShieldCheck,
    title: "To tiår med erfaring",
    body: "Med over 20 år som snekker bringer vi dyp lokalkunnskap og en dokumentert merittliste til hvert prosjekt.",
  },
  {
    icon: MessageSquare,
    title: "Åpen kommunikasjon",
    body: "Du holdes informert og involvert i hvert ledd — fra første befaring til siste sjekk, ingenting forblir usagt.",
  },
];

const STATS = [
  { number: "20+ år", label: "som snekker i regionen" },
  { number: "150+", label: "prosjekter fullført med glans" },
  { number: "100%", label: "kundefokusert prosjektgjennomføring" },
  { number: "5-stjerner", label: "omdømme blant lokale eiere" },
];

const PROCESS = [
  {
    num: "01",
    title: "Innledende konsultasjon",
    body: "Vi setter oss ned med deg og forstår behovene, drømmene og budsjettet — uten forpliktelser.",
    image: 0,
  },
  {
    num: "02",
    title: "Planlegging og design",
    body: "Vi tegner ut løsningen, henter inn nødvendige tillatelser og leverer et åpent prisestimat.",
    image: 1,
  },
  {
    num: "03",
    title: "Byggekvalitet",
    body: "Vårt erfarne team bygger med presisjon, og du har én prosjektleder som rapporterer hver uke.",
    image: 2,
  },
  {
    num: "04",
    title: "Ferdigstillelse",
    body: "Vi går nøye gjennom alt før overlevering — og er der etterpå hvis noe trenger justering.",
    image: 3,
  },
];

const PROJECTS = [
  { title: "Total boligrenovasjon", caption: "Familiebolig, full overhaling" },
  { title: "Kjøkken og spiseplass", caption: "Skreddersydd snekkerverk" },
  { title: "Stueombygging", caption: "Åpen planløsning og innebygd møblering" },
  { title: "Fasade og uteplass", caption: "Utvendig renovasjon og terrasse" },
];

const FAQS = [
  {
    q: "Hvilke områder dekker dere?",
    a: "Vi tar oppdrag i hele regionen — boliger, hytter og næringsbygg. Ta kontakt så avklarer vi raskt om vi når frem til deg.",
  },
  {
    q: "Hvor lang tid tar et typisk hjemmebygg eller renovering?",
    a: "Det avhenger av omfang — et bad kan ta 4-6 uker, mens en totalrenovering tar 3-6 måneder. Du får alltid en realistisk tidsplan før vi starter.",
  },
  {
    q: "Kan dere lage endringer underveis i et oppdrag?",
    a: "Ja, så lenge det er forsvarlig. Vi dokumenterer endringer skriftlig og du får oppdatert pris før vi går videre.",
  },
  {
    q: "Hva inngår i et tilbud fra dere?",
    a: "Befaring, detaljert beskrivelse av arbeidet, åpen pris med materialer og arbeid, samt tidsplan. Tilbudet er gratis og uforpliktende.",
  },
  {
    q: "Jobber dere sammen med eksterne arkitekter eller designere?",
    a: "Absolutt — vi samarbeider gjerne med din arkitekt eller interiørdesigner, eller leverer egen prosjektering hvis du foretrekker det.",
  },
];

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
    `Fra skreddersydde nybygg til kjøkken- og badrenoveringer — ${company.name} kombinerer 20+ år med pålitelig håndverk og ærlig prosjektledelse i hvert eneste hjem vi tar i.`;
  const about =
    content.about_paragraph ??
    `${company.name} er en familieeid snekkerbedrift med over 20 års erfaring i regionen. Vi tar personlig hånd om hvert prosjekt, med ærlige priser, nitid fokus på detaljer og en stødig prosess fra første konsultasjon til siste finish.`;

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{
        background: CREAM,
        // Editorial italic serif on every "swash" headline. Loaded
        // self-contained so the template doesn't need next/font wiring.
        ["--site-serif" as string]:
          '"Cormorant Garamond", "Playfair Display", Georgia, serif',
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
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap"
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

      <Pillars />

      <About company={company} about={about} />

      <Services niche={niche} />

      <DreamHome />

      <Process />

      <Testimonials company={company} />

      <Projects />

      <FAQ />

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
    <div className="sticky top-0 z-30 px-4 pt-3 sm:px-6 sm:pt-4">
      <header className="mx-auto flex max-w-6xl items-center gap-4 rounded-xl border border-black/5 bg-white/95 px-5 py-3 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] backdrop-blur">
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
            Få et gratis tilbud
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
  // Italicise the middle ~third of the headline for the editorial mix.
  // Falls back gracefully on short headlines.
  let leading = headline;
  let italic = "";
  let trailing = "";
  if (splitWords.length >= 4) {
    const start = Math.floor(splitWords.length / 2) - 1;
    const end = start + Math.max(1, Math.floor(splitWords.length / 3));
    leading = splitWords.slice(0, start).join(" ") + " ";
    italic = splitWords.slice(start, end).join(" ");
    trailing = " " + splitWords.slice(end).join(" ");
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

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-14 lg:py-32">
        {/* Left — copy */}
        <div className="space-y-7 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            {company.kommune
              ? `${company.kommune}s foretrukne snekker`
              : "Regionens foretrukne snekker"}
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
              Få et gratis tilbud
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
                    Snakk med en fagperson
                  </span>
                  <span className="block font-medium">{phoneDisplay}</span>
                </span>
              </a>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-6 border-t border-white/15 pt-7 sm:grid-cols-4">
            {STATS.map((s) => (
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

        {/* Right — embedded contact panel */}
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
          placeholder="Fortell oss litt om planene dine — så kommer vi tilbake til deg samme dag."
          className="w-full resize-none rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-700 focus:outline-none"
        />
      </Field>

      <label className="mt-3 flex items-start gap-2 text-[11px] leading-snug text-slate-700">
        <input
          type="checkbox"
          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-400"
        />
        <span>
          Jeg ønsker av og til å motta nyhetsbrev og tips om
          oppussingsprosjekter.
        </span>
      </label>

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

function Pillars() {
  return (
    <section
      className="py-14 sm:py-16"
      style={{ background: SAND }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-3 sm:gap-12">
        {PILLARS.map((p, i) => (
          <div
            key={p.title}
            className={
              "text-center sm:px-4" +
              (i > 0 ? " sm:border-l sm:border-black/15" : "")
            }
          >
            <div className="mx-auto mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md text-white">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-md"
                style={{ background: NAVY_DARK }}
              >
                <p.icon className="h-5 w-5" />
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
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
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="overflow-hidden rounded-xl shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)]">
          <img
            src={CARPENTER_IMAGES.about}
            alt="Pågående snekkerarbeid"
            className="aspect-[4/5] h-full w-full object-cover"
          />
        </div>

        <div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Et navn bygget
            <br />
            <span
              style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
              className="font-medium"
            >
              på integritet
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-700">
            {about}
          </p>

          <div className="mt-8 space-y-6">
            <Subblock
              title={`Tillit fra ${company.kommune ?? "lokale"} huseiere`}
              body="Vårt omdømme er bygget på tiår med ærlig, pålitelig service og den typen tillit som bare kommer av å levere det vi lover — gang etter gang."
            />
            <Subblock
              title="Visjonen din, ekspertgjennomført"
              body="Enten det er en kjøkkenforvandling eller en total renovering, styres hvert valg av hva som er best for hjemmet ditt og familien din."
            />
          </div>

          <a
            href="#tjenester"
            className="mt-9 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: NAVY }}
          >
            Møt teamet vårt
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
      <div className="mx-auto max-w-6xl px-6">
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
      <div className="mx-auto max-w-6xl px-6 pt-20 sm:pt-24">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
          Skap ditt
          <br />
          <span
            style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
            className="font-medium"
          >
            drømmehjem
          </span>{" "}
          i dag
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-slate-700">
          Våre kunder stoler på at vi tar hånd om utvidelser og oppussing med
          omtanke, kompetanse og oppmerksomhet på detaljene.
        </p>

        <div
          className="mt-12 rounded-2xl px-8 py-10 text-white sm:px-12"
          style={{ background: NAVY_DARK }}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.number}>
                <div className="text-2xl font-semibold sm:text-3xl">
                  {s.number}
                </div>
                <div className="mt-1 text-xs leading-snug text-white/70">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Split: photo left, dark panel right */}
      <div className="mt-12 grid lg:grid-cols-2">
        <div className="relative aspect-[5/3] lg:aspect-auto lg:min-h-[480px]">
          <img
            src={CARPENTER_IMAGES.splitProject}
            alt="Pågående byggeprosjekt"
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
              Teamet vårt bruker profesjonell prosjektledelse og høyverdig
              håndverk for å sikre at hjemmet ditt blir gjenfødt med finesse.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                Gratis innledende konsultasjon
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                Realistisk prisplanlegging og oppfølging
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                Én prosjektleder gjennom hele prosessen
              </li>
            </ul>

            <a
              href="#kontakt"
              className="mt-8 inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-slate-900 transition-opacity hover:opacity-95"
              style={{ background: SAND }}
            >
              Få et gratis tilbud
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
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Innledende{" "}
            <span
              style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
              className="font-medium"
            >
              konsultasjon
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

function Testimonials({ company }: { company: Props["company"] }) {
  return (
    <section
      id="anmeldelser"
      className="py-20 sm:py-24 text-white"
      style={{ background: NAVY_DARK }}
    >
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Anbefalt av{" "}
          <span
            style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
            className="font-medium text-white/90"
          >
            våre kunder
          </span>
        </h2>

        <div className="mx-auto mt-10 max-w-xl rounded-xl bg-white p-7 text-left text-slate-900 shadow-lg">
          <div className="flex items-center gap-0.5 text-amber-500">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-4 w-4 fill-amber-500" />
            ))}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-800">
            «{company.name} leverte langt over forventning. Hele teamet var
            ordentlige, presise og åpne om priser hele veien — en av få
            entreprenører jeg faktisk ville anbefale videre.»
          </p>
          <div className="mt-5 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
              {initials("Kari Hansen")}
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">
                Kari Hansen
              </div>
              <div className="text-xs text-slate-500">
                Privatkunde i {company.kommune ?? "regionen"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
        </div>
      </div>
    </section>
  );
}

// ─── projects ───────────────────────────────────────────────────────────────

function Projects() {
  return (
    <section id="prosjekter" className="py-20 sm:py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Våre bygge{" "}
            <span
              style={{ fontFamily: "var(--site-serif)", fontStyle: "italic" }}
              className="font-medium"
            >
              prosjekter
            </span>
          </h2>
          <a
            href="#kontakt"
            className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
          >
            Se alle prosjekter →
          </a>
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

function FAQ() {
  return (
    <section className="py-20 sm:py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-6xl px-6">
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
            {FAQS.map((f) => (
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
            med eksperter
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
            La oss ta praten. Vi gir deg et åpent prisestimat, en realistisk
            tidsplan og en stødig prosess fra første dag — uten forpliktelser.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-white/95"
            >
              Få et gratis tilbud
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
                    Snakk med en fagperson
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
      <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:grid-cols-3">
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
            Snekkerbedrift med ærlige priser, dokumentert kvalitet og en stødig
            prosess.
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

      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 px-6 pt-6 text-[11px] text-white/45 flex flex-wrap items-center justify-between gap-3">
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
