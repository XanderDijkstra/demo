import {
  Award,
  Check,
  ChevronDown,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Sparkles,
} from "lucide-react";

import type { GeneratedSiteContent } from "@/lib/supabase/types";
import type { NicheConfig } from "@/lib/templates";

/**
 * Anleggsgartner template — visual recreation of the Hagenouw Greenwork /
 * Ezra Framer design, rebuilt as a fully parameterised React + Tailwind
 * component so the company name, phone, kommune, AI-generated hero copy,
 * and niche services all flow through from lead data.
 *
 * Design language: cream backgrounds, dark forest-green panels, lime CTA
 * accent, generous rounded radii, large display-weight headlines with
 * occasional italic accents. Single-column on mobile, two-column hero with
 * a floating contact form on lg+.
 */

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
  };
  niche: NicheConfig;
  content: GeneratedSiteContent;
}

const LIME = "#beDd25";
const FOREST = "#274839";
const CREAM = "#f5f1e3";

const PICSUM = "https://picsum.photos/seed";

function bestPhone(c: Props["company"]): string | null {
  return c.mobile?.trim() || c.phone?.trim() || null;
}

function telLink(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return null;
  const withCc = digits.length === 8 ? `47${digits}` : digits;
  return `https://wa.me/${withCc}`;
}

function brandInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "L";
  const word = trimmed.split(/\s+/)[0] ?? "";
  return (word.charAt(0) || "L").toUpperCase();
}

function fullAddress(c: Props["company"]): string | null {
  const parts = [
    c.address_line,
    c.postal_code && c.postal_place
      ? `${c.postal_code} ${c.postal_place}`
      : c.postal_place || c.postal_code,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

const STATS = [
  { value: "10+", label: "Års erfaring" },
  { value: "150+", label: "Fullførte prosjekter" },
  { value: "100%", label: "Fornøyde kunder" },
  { value: "10/10", label: "Vurdert av kundene" },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Befaring",
    body: "Vi kommer på et uforpliktende besøk, kartlegger uterommet og lytter til ønskene dine.",
  },
  {
    n: "02",
    title: "Tilbud",
    body: "Du får et tydelig, detaljert tilbud — ingen skjulte kostnader eller overraskelser.",
  },
  {
    n: "03",
    title: "Levering",
    body: "Vi utfører arbeidet med presisjon og rydder pent etter oss. Du nyter resultatet.",
  },
];

const FAQ = [
  {
    q: "Hvor raskt kan jeg vente et tilbud?",
    a: "Vi tar kontakt innen 24 timer etter forespørsel. Som regel avtaler vi befaring i samme uke og leverer skriftlig tilbud kort tid etter.",
  },
  {
    q: "Hvilke områder dekker dere?",
    a: "Vi jobber i og rundt nærområdet — ta kontakt med adresse, så bekrefter vi om det er innenfor vanlig kjøreradius.",
  },
  {
    q: "Tar dere hånd om bortkjøring av hageavfall?",
    a: "Ja. Vi rydder, frakter bort og leverer på godkjent mottak. Det inngår i tilbudet med mindre annet er avtalt.",
  },
  {
    q: "Gir dere garanti på steinarbeid?",
    a: "Ja, vi gir 5 års garanti på fagmessig utført steinlegging og terrassearbeid, forutsatt normal bruk og vedlikehold.",
  },
  {
    q: "Når er det best å anlegge ny plen?",
    a: "April–juni og august–september gir best resultat. Vi planlegger gjerne i god tid for å treffe optimal sesong.",
  },
];

export function LandscaperTemplate({ company, niche, content }: Props) {
  const phone = bestPhone(company);
  const wa = whatsappLink(phone);
  const headline =
    content.hero_headline ??
    `Din drømmehage, realisert med ${company.name}`;
  const subheadline = content.hero_subheadline ?? "Håndverk i hver meter";
  const about =
    content.about_paragraph ??
    `Vi forvandler uterommet ditt med stilren brostein, frodig plen og førsteklasses anlegg. Kvalitet du gleder deg over i mange år.`;
  const address = fullAddress(company);
  const heroBg = `${PICSUM}/v-ezra-hero-${company.org_nr}/1800/1200`;

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased">
      <Header company={company} phone={phone} />

      <main>
        <Hero
          company={company}
          phone={phone}
          wa={wa}
          headline={headline}
          subheadline={subheadline}
          about={about}
          heroBg={heroBg}
        />
        <WhyChoose />
        <About company={company} about={about} />
        <Services niche={niche} company={company} />
        <Stats company={company} />
        <Outdoor company={company} phone={phone} />
        <HowItWorks />
        <Review company={company} />
        <Gallery orgNr={company.org_nr} />
        <Faq company={company} phone={phone} />
      </main>

      <Footer company={company} phone={phone} address={address} />
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({
  company,
  phone,
}: {
  company: Props["company"];
  phone: string | null;
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#hero" className="flex items-center gap-2.5">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-zinc-900"
            style={{ backgroundColor: LIME }}
          >
            {brandInitial(company.name)}
          </span>
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
            {company.name}
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          <a href="#hero" className="text-sm text-zinc-700 hover:text-zinc-900">
            Hjem
          </a>
          <a href="#about" className="text-sm text-zinc-700 hover:text-zinc-900">
            Om oss
          </a>
          <a
            href="#services"
            className="text-sm text-zinc-700 hover:text-zinc-900"
          >
            Tjenester
          </a>
          <a
            href="#gallery"
            className="text-sm text-zinc-700 hover:text-zinc-900"
          >
            Galleri
          </a>
          <a href="#faq" className="text-sm text-zinc-700 hover:text-zinc-900">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {phone ? (
            <a
              href={telLink(phone)}
              className="hidden text-sm font-medium tabular-nums text-zinc-800 hover:text-zinc-950 sm:inline"
            >
              {phone}
            </a>
          ) : null}
          <a
            href="#contact"
            className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90"
            style={{ backgroundColor: LIME }}
          >
            Gratis befaring
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
  wa,
  headline,
  subheadline,
  about,
  heroBg,
}: {
  company: Props["company"];
  phone: string | null;
  wa: string | null;
  headline: string;
  subheadline: string;
  about: string;
  heroBg: string;
}) {
  return (
    <section id="hero" className="relative isolate overflow-hidden">
      <img
        src={heroBg}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/55 to-black/75"
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-24 pt-20 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_minmax(0,520px)] lg:gap-14 lg:pb-32 lg:pt-28">
        <div className="text-white">
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl lg:text-[68px] lg:leading-[1.05]">
            {headline}
          </h1>

          <p
            className="mt-6 max-w-xl text-base text-white/85 sm:text-lg"
            style={{ fontStyle: "italic" }}
          >
            {subheadline}
          </p>

          <p className="mt-4 max-w-xl text-sm text-white/80 sm:text-base sm:leading-relaxed">
            {about}
          </p>

          {phone ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={telLink(phone)}
                className="inline-flex items-center gap-2.5 rounded-full bg-zinc-900/55 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-zinc-900/75"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wider text-white/70">
                    Ring meg
                  </span>
                  <span className="tabular-nums">{phone}</span>
                </span>
              </a>
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Send WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}

          <div
            className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl p-6 sm:grid-cols-4"
            style={{ backgroundColor: CREAM, color: FOREST }}
          >
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-semibold sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-zinc-600 sm:text-[13px]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ContactForm company={company} />
      </div>
    </section>
  );
}

function ContactForm({ company }: { company: Props["company"] }) {
  return (
    <form
      id="contact"
      className="self-start rounded-2xl bg-white p-6 shadow-2xl sm:p-7"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Navn" placeholder="Fullt navn" name="name" />
        <Field label="E-post" placeholder="navn@epost.no" name="email" type="email" />
      </div>
      <div className="mt-4">
        <Field label="Telefon" placeholder="Mobilnummer" name="phone" />
      </div>
      <div className="mt-4">
        <Field
          label="Adresse"
          placeholder="Gate og postnr."
          name="address"
        />
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Melding
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder="Beskriv prosjektet ditt"
          className="block w-full resize-none rounded-lg border border-transparent bg-stone-100 px-3.5 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-zinc-200"
        />
      </div>
      <button
        type="submit"
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90"
        style={{ backgroundColor: LIME }}
      >
        Send forespørsel
      </button>
      <p className="mt-3 text-center text-[11px] text-zinc-500">
        {company.name} svarer normalt innen 24 timer
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-transparent bg-stone-100 px-3.5 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-zinc-200"
      />
    </div>
  );
}

// ─── WhyChoose ───────────────────────────────────────────────────────────────

const WHY = [
  {
    icon: Award,
    title: "Erfaring og kvalitet",
    body: "Bredt fagmiljø og solide referanser fra både private og næring.",
  },
  {
    icon: Sparkles,
    title: "Tydelig leveranse",
    body: "Du vet hva som skjer når, og hva det koster — fra dag én.",
  },
  {
    icon: Leaf,
    title: "Bærekraftig materialvalg",
    body: "Vi prioriterer holdbare materialer og planter tilpasset klimaet.",
  },
];

function WhyChoose() {
  return (
    <section className="py-20 sm:py-24" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Hvorfor velge oss
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Lidenskap for et{" "}
            <em className="font-medium" style={{ fontStyle: "italic" }}>
              naturlig glød
            </em>
          </h2>
          <p className="mt-4 text-zinc-600">
            Kundene våre stoler på oss for hagestell og anlegg med øye for
            detaljer. Fra jevnt vedlikehold til komplette forvandlinger.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {WHY.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.title}
                className="rounded-2xl border border-stone-200 bg-white p-7"
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-900"
                  style={{ backgroundColor: LIME }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">
                  {w.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {w.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── About ───────────────────────────────────────────────────────────────────

function About({
  company,
  about,
}: {
  company: Props["company"];
  about: string;
}) {
  const aboutImg = `${PICSUM}/v-ezra-about-${company.org_nr}/900/700`;
  return (
    <section id="about" className="bg-white py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <img
            src={aboutImg}
            alt=""
            className="aspect-[5/4] w-full rounded-2xl object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Om {company.name}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Kvalitet du kan stole på
          </h2>
          <p className="mt-4 text-zinc-600 sm:text-lg sm:leading-relaxed">
            {about}
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-zinc-700">
            {[
              "Pålitelig service og tydelig kommunikasjon",
              "Erfarne fagfolk i alle ledd",
              "Bærekraftige materialer og metoder",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-900"
                  style={{ backgroundColor: LIME }}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

function Services({
  niche,
  company,
}: {
  niche: NicheConfig;
  company: Props["company"];
}) {
  return (
    <section id="services" className="bg-white pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Tjenester
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Alt vi tar oss av
            </h2>
          </div>
          <a
            href="#contact"
            className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90"
            style={{ backgroundColor: LIME }}
          >
            {niche.ctaText}
          </a>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {niche.services.map((s, i) => {
            const img = `${PICSUM}/v-ezra-svc-${company.org_nr}-${i}/700/500`;
            return (
              <article
                key={s.title}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
              >
                <img
                  src={img}
                  alt=""
                  className="aspect-[7/5] w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {s.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ───────────────────────────────────────────────────────────────────

function Stats({ company }: { company: Props["company"] }) {
  return (
    <section className="py-20" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Vurdert 10/10 av kundene
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Tall som taler for seg selv
          </h2>
          <p className="mt-4 text-zinc-600">
            Kundene våre stoler på {company.name} for hagestell og anlegg
            med lidenskap og sans for detaljer.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-stone-200 bg-white p-6 text-center"
            >
              <div className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-xs uppercase tracking-wider text-zinc-500 sm:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Outdoor (dark CTA) ──────────────────────────────────────────────────────

function Outdoor({
  company,
  phone,
}: {
  company: Props["company"];
  phone: string | null;
}) {
  const bg = `${PICSUM}/v-ezra-outdoor-${company.org_nr}/1800/900`;
  return (
    <section className="relative isolate overflow-hidden py-24 text-white sm:py-28">
      <img
        src={bg}
        alt=""
        aria-hidden
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: `${FOREST}cc` }}
      />

      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <p
          className="text-xs font-semibold uppercase tracking-[0.18em]"
          style={{ color: LIME }}
        >
          Gratis hagebefaring
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          Naturlig glød
        </h2>
        <p className="mt-5 text-base text-white/85 sm:text-lg">
          Vi bruker bærekraftige materialer og solide teknikker for å skape
          en hage som lever. Din visjon, vårt håndverk.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#contact"
            className="inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90"
            style={{ backgroundColor: LIME }}
          >
            Be om gratis befaring
          </a>
          {phone ? (
            <a
              href={telLink(phone)}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/30 px-5 text-sm font-medium text-white transition hover:bg-white/10"
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

// ─── How it works ────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Slik fungerer det
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Forvandle uterommet med ekspertråd
          </h2>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <li
              key={step.n}
              className="rounded-2xl border border-stone-200 p-7"
              style={{ backgroundColor: CREAM }}
            >
              <div className="font-mono text-sm text-zinc-500">{step.n}</div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Review ──────────────────────────────────────────────────────────────────

function Review({ company }: { company: Props["company"] }) {
  return (
    <section className="bg-white pb-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <figure
          className="rounded-2xl p-10 sm:p-14"
          style={{ backgroundColor: CREAM }}
        >
          <blockquote className="text-balance text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
            &ldquo;Helt fantastisk tjeneste. Plenen min har aldri sett så
            grønn og frisk ut. Teamet var profesjonelt, presist og hadde
            øye for hver minste detalj. Hagen min er nå et levende,
            fargerikt paradis.&rdquo;
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3 text-sm">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full font-semibold text-zinc-900"
              style={{ backgroundColor: LIME }}
            >
              D
            </span>
            <span>
              <span className="block font-semibold">Daniel K.</span>
              <span className="block text-zinc-500">
                Eiendomsforvalter — Kunde hos {company.name}
              </span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

function Gallery({ orgNr }: { orgNr: string }) {
  const imgs = Array.from(
    { length: 6 },
    (_, i) => `${PICSUM}/v-ezra-gal-${orgNr}-${i}/800/800`
  );
  return (
    <section id="gallery" className="bg-white pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Galleri
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Våre <em style={{ fontStyle: "italic" }}>prosjekter</em>
            </h2>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {imgs.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`w-full rounded-2xl object-cover ${
                i % 5 === 0 ? "aspect-[3/4]" : "aspect-square"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function Faq({
  company,
  phone,
}: {
  company: Props["company"];
  phone: string | null;
}) {
  return (
    <section id="faq" className="bg-white pb-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <aside
            className="rounded-2xl p-8 sm:p-10"
            style={{ backgroundColor: CREAM }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Spørsmål
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Forvandle hagen din i dag
            </h2>
            <p className="mt-3 text-sm text-zinc-600">
              Bring hagen til live med fagkyndig vedlikehold og stilrent
              anlegg. {company.name} tar seg av prosjektet ditt — stort
              eller lite, med omhu.
            </p>
            <a
              href={phone ? telLink(phone) : "#contact"}
              className="mt-6 inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90"
              style={{ backgroundColor: LIME }}
            >
              Ta kontakt
            </a>
          </aside>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Veiledning
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Vanlige <em style={{ fontStyle: "italic" }}>spørsmål</em>
            </h2>
            <p className="mt-3 text-zinc-600">
              Her finner du svar på de vanligste spørsmålene om hvordan vi
              jobber.
            </p>
            <div className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
              {FAQ.map((item, i) => (
                <details
                  key={item.q}
                  className="group py-5"
                  open={i === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium tracking-tight">
                    <span>{item.q}</span>
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-900"
                      style={{ backgroundColor: LIME }}
                    >
                      <Plus className="h-3.5 w-3.5 group-open:hidden" />
                      <Minus className="hidden h-3.5 w-3.5 group-open:block" />
                    </span>
                  </summary>
                  <p className="mt-3 pr-10 text-sm leading-relaxed text-zinc-600">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer({
  company,
  phone,
  address,
}: {
  company: Props["company"];
  phone: string | null;
  address: string | null;
}) {
  return (
    <footer className="text-white" style={{ backgroundColor: FOREST }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-md font-bold text-zinc-900"
              style={{ backgroundColor: LIME }}
            >
              {brandInitial(company.name)}
            </span>
            <span className="text-base font-semibold tracking-tight">
              {company.name}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Anleggsgartner med fokus på kvalitet, kommunikasjon og
            bærekraftige løsninger for uterommet ditt.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Kontakt
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {phone ? (
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-white/60" />
                <a href={telLink(phone)} className="hover:underline">
                  {phone}
                </a>
              </li>
            ) : null}
            {company.email ? (
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-white/60" />
                <a href={`mailto:${company.email}`} className="hover:underline">
                  {company.email}
                </a>
              </li>
            ) : null}
            {address ? (
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-white/60" />
                <span>{address}</span>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
            Lenker
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="#services" className="text-white/85 hover:underline">
                Tjenester
              </a>
            </li>
            <li>
              <a href="#gallery" className="text-white/85 hover:underline">
                Galleri
              </a>
            </li>
            <li>
              <a href="#faq" className="text-white/85 hover:underline">
                FAQ
              </a>
            </li>
            <li>
              <a href="#contact" className="text-white/85 hover:underline">
                Kontakt
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-white/60 sm:px-8">
          <span>
            © {new Date().getFullYear()} {company.name} · Org.nr {company.org_nr}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ChevronDown className="h-3 w-3 rotate-180" />
            <a href="#hero" className="hover:text-white">
              Til toppen
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
