import {
  ArrowLeft,
  ArrowRight,
  ChevronsRight,
  Eye,
  HandHeart,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  Sparkles,
  Star,
} from "lucide-react";

import type { GeneratedSiteContent } from "@/lib/supabase/types";
import type { NicheConfig } from "@/lib/templates";

/**
 * Bespoke landscaper / anleggsgartner template.
 *
 * Modeled after Hagenouw Greenwork-style designs: cream + dark forest green
 * + lime CTA, mixed serif/sans typography with italic accents, embedded
 * contact form on hero, six-card services grid, dark CTA panel, numbered
 * process steps.
 *
 * Lime green is hardcoded here (not on niche config) because it's an
 * identity signal of this template, not a per-deploy tweakable.
 */

const LIME = "oklch(0.88 0.18 122)"; // CTA / accent highlight
const CREAM_DEEP = "oklch(0.93 0.025 80)"; // page background
const STONE = "oklch(0.32 0.05 145)"; // dark forest green

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

const STATS = [
  { value: "10+", label: "Erfaring i faget" },
  { value: "150+", label: "Fullførte prosjekter" },
  { value: "100%", label: "Fornøyde kunder" },
  { value: "10/10", label: "Anbefalingsscore" },
];

const PROCESS_STEPS = [
  {
    num: "(001)",
    title: "Få tilbud",
    description:
      "Beskriv prosjektet, så får du et åpent tilbud uten skjulte kostnader.",
  },
  {
    num: "(002)",
    title: "Planlegg avtalen",
    description:
      "Vi avtaler oppstart og går gjennom plan, materialer og dato sammen.",
  },
  {
    num: "(003)",
    title: "Utførelse & overlevering",
    description:
      "Vi gjennomfører arbeidet ryddig og presist — og overleverer en hage du er stolt av.",
  },
  {
    num: "(004)",
    title: "Etteroppfølging",
    description:
      "Vi følger opp etter ferdigstillelse og er der når du trenger oss igjen.",
  },
];

const FEATURES = [
  {
    icon: HandHeart,
    title: "10+ års erfaring",
    description:
      "Vi bringer lidenskap og håndverk til hvert eneste prosjekt — fra liten forhage til full renovasjon.",
  },
  {
    icon: Leaf,
    title: "Øye for detalj",
    description:
      "Vi jobber nøyaktig, bruker beste materialer og forlater alltid arbeidsstedet pent.",
  },
  {
    icon: Sparkles,
    title: "Personlig & direkte",
    description:
      "Ingen mellommenn. Du har direkte kontakt med fagmannen for ærlig råd og rask kommunikasjon.",
  },
];

const SERVICE_IMAGE_KEYWORDS = [
  "lawn",
  "paving-stones",
  "garden-fence",
  "garden-renovation",
  "groundwork",
  "garden-maintenance",
];

const TESTIMONIALS = [
  {
    body: "Det er sjelden vi anbefaler en håndverker uten å nøle, men her måtte vi. Plenen ble lagt presist, alt rundt ble kostet og ryddet, og prisen lå akkurat der vi var enige om. Nabolaget har spurt om kontaktinfo flere ganger.",
    author: "R. Haren",
  },
  {
    body: "Vi fikk hele bakhagen renovert — drenering, brostein og en ny plen. Jobben ble levert på dagen, kommunikasjonen var ærlig hele veien, og resultatet er bare bedre enn det vi hadde forestilt oss.",
    author: "M. Solberg",
  },
  {
    body: "Profesjonell, hyggelig og uten overraskelser. Han forklarte hva som skulle gjøres, hvorfor og hvor lang tid det ville ta. Anbefales på det varmeste til alle som tar hagen sin på alvor.",
    author: "K. Aune",
  },
];

const PROJECT_IMAGES = [
  // Tre kolonner, midten har tall image som spenner over to rader.
  { src: "https://source.unsplash.com/700x500/?lawn-mower,gardener", alt: "Plenklipping" },
  {
    src: "https://source.unsplash.com/700x900/?house-garden,curb-appeal",
    alt: "Hageprosjekt",
    tall: true,
  },
  { src: "https://source.unsplash.com/700x500/?garden-edging,grass", alt: "Plenkanting" },
  { src: "https://source.unsplash.com/700x500/?rose-bush-pruning", alt: "Beskjæring" },
  { src: "https://source.unsplash.com/700x500/?garden-spraying", alt: "Plantebehandling" },
];

const FAQS = [
  {
    q: "Hvor raskt kan jeg forvente et tilbud?",
    a: "Vi tar kontakt innen 24 timer etter forespørselen din. Som regel avtaler vi en kort befaring først, og du får et åpent og forutsigbart tilbud rett etterpå.",
  },
  {
    q: "Hvilket område dekker dere?",
    a: "Vi jobber i kommunen og nærliggende områder. Si fra hvor du holder til, så bekrefter vi om vi har kapasitet eller anbefaler en kollega vi stoler på.",
  },
  {
    q: "Tar dere med dere hageavfallet?",
    a: "Ja — vi rydder etter oss og tar med kvist, gress og rester til godkjent mottak. Det er inkludert i tilbudet med mindre annet er avtalt.",
  },
  {
    q: "Gir dere garanti på steinarbeidet?",
    a: "Ja, vi gir flere års garanti på steinleggingen. Bruker du oss til vedlikehold etterpå forlenger vi garantien tilsvarende.",
  },
  {
    q: "Når er beste tid for å legge plen?",
    a: "Vår og tidlig høst gir best etablering, men vi kan legge plen gjennom hele sesongen. Vi tilpasser jobben etter været og hvordan tomten din er.",
  },
];

const BLOG_POSTS = [
  {
    date: "1. desember 2025",
    title: "5 tips til varig steinarbeid som ikke synker",
    image:
      "https://source.unsplash.com/600x400/?stone-paving,driveway",
  },
  {
    date: "15. desember 2025",
    title: "Hagerenovasjon: fra villmark til drømmehage",
    image:
      "https://source.unsplash.com/600x400/?garden-renovation,lawn",
  },
  {
    date: "5. januar 2026",
    title: "Grunnarbeid: det usynlige fundamentet",
    image:
      "https://source.unsplash.com/600x400/?garden-pruning,gloves",
  },
];

function bestPhone(c: Props["company"]): string | null {
  return c.mobile ?? c.phone ?? null;
}

function whatsappLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return null;
  // Norwegian numbers — prepend country code if missing.
  const withCc = digits.length === 8 ? `47${digits}` : digits;
  return `https://wa.me/${withCc}`;
}

export function LandscaperTemplate({ company, niche, content }: Props) {
  const phone = bestPhone(company);
  const whatsapp = whatsappLink(phone);
  const headline =
    content.hero_headline ?? "Drømmehagen din — uten bekymringer";
  const subheadline =
    content.hero_subheadline ??
    `Vi forvandler uteområdet ditt med stramt steinarbeid, frodig plen og førsteklasses renovasjoner${
      company.kommune ? ` i ${company.kommune}` : ""
    }.`;
  const about =
    content.about_paragraph ??
    `Hos ${company.name} handler alt om håndverk. Vi skaper og vedlikeholder hager som ikke bare er pene, men der du faktisk slapper av.`;

  return (
    <div
      className="min-h-screen bg-stone-50 text-stone-900"
      style={{
        background: CREAM_DEEP,
        ["--lime" as string]: LIME,
        ["--forest" as string]: STONE,
      }}
    >
      <Header company={company} phone={phone} />
      <Hero
        company={company}
        phone={phone}
        whatsapp={whatsapp}
        headline={headline}
        subheadline={subheadline}
      />
      <Features />
      <About company={company} about={about} />
      <Services services={niche.services} />
      <Stats />
      <BigCta company={company} />
      <Process />
      <Testimonials />
      <ProjectsGallery />
      <Faq company={company} />
      <Blog />
      <BottomCta company={company} />
      <Footer company={company} />
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
    <header className="absolute inset-x-0 top-0 z-30 px-6 pt-6 md:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-stone-900/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
            style={{ background: STONE }}
          >
            <Leaf className="h-4 w-4" />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-semibold tracking-tight truncate text-sm uppercase">
              {company.name}
            </div>
            <div className="font-serif italic text-[11px] text-stone-500">
              Anleggsgartner
            </div>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-stone-700 md:flex">
          <a href="#hjem" className="hover:text-stone-900">
            Hjem
          </a>
          <a href="#om" className="hover:text-stone-900">
            Om oss
          </a>
          <a href="#tjenester" className="hover:text-stone-900">
            Tjenester
          </a>
          <a href="#kontakt" className="hover:text-stone-900">
            Kontakt
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="hidden border-b border-stone-900/30 pb-0.5 text-sm font-medium tabular-nums hover:border-stone-900 sm:inline"
            >
              {phone}
            </a>
          ) : null}
          <a
            href="#kontakt"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-stone-900 transition-opacity hover:opacity-90"
            style={{ background: LIME }}
          >
            Gratis tilbud
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
  whatsapp,
  headline,
  subheadline,
}: {
  company: Props["company"];
  phone: string | null;
  whatsapp: string | null;
  headline: string;
  subheadline: string;
}) {
  const heroImage =
    "https://source.unsplash.com/1800x1200/?japanese-garden,landscape";

  return (
    <section
      id="hjem"
      className="relative isolate overflow-hidden text-white"
    >
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt="Frodig hage"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/85 via-stone-950/60 to-stone-950/30" />
      </div>

      <div className="mx-auto grid max-w-7xl items-start gap-10 px-6 pt-36 pb-24 md:px-10 md:pt-44 md:pb-32 lg:grid-cols-[1.1fr_minmax(380px,1fr)] lg:items-center">
        {/* Left: headline + ctas */}
        <div className="space-y-7">
          <p className="font-serif text-base italic tracking-tight text-white/80">
            Håndverk i hver meter —
          </p>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            {headline}
          </h1>
          <p className="max-w-xl text-lg text-white/80">{subheadline}</p>

          <div className="flex flex-wrap gap-3 pt-2">
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
              >
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-900"
                  style={{ background: LIME }}
                >
                  <Phone className="h-4 w-4" />
                </span>
                <span className="leading-tight text-left">
                  <span className="block text-[11px] text-white/70">
                    Ring meg
                  </span>
                  <span className="block tabular-nums">{phone}</span>
                </span>
              </a>
            ) : null}
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-stone-900">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span className="leading-tight text-left">
                  <span className="block text-[11px] text-white/70">
                    Send melding
                  </span>
                  <span className="block">WhatsApp</span>
                </span>
              </a>
            ) : null}
          </div>
        </div>

        {/* Right: contact form card */}
        <ContactFormCard />
      </div>

      {/* Stats banner overlapping the bottom of the hero */}
      <div className="relative z-10 mx-auto -mb-16 max-w-7xl px-6 md:px-10">
        <div
          className="grid grid-cols-2 gap-y-4 rounded-3xl px-6 py-5 text-stone-900 shadow-md ring-1 ring-stone-900/5 md:grid-cols-4 md:py-6"
          style={{ background: CREAM_DEEP }}
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={
                i > 0
                  ? "border-stone-900/10 md:border-l md:pl-6"
                  : "md:pl-2"
              }
            >
              <div className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-stone-600">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactFormCard() {
  return (
    <div className="rounded-3xl bg-white p-6 text-stone-900 shadow-xl ring-1 ring-stone-900/5 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Navn">
          <FakeInput placeholder="Fullt navn" />
        </FormField>
        <FormField label="E-post">
          <FakeInput placeholder="navn@eksempel.no" type="email" />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField label="Telefon">
          <FakeInput placeholder="Telefonnummer" type="tel" />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField label="Adresse">
          <FakeInput placeholder="Gate & postnummer" />
        </FormField>
      </div>
      <div className="mt-4">
        <FormField label="Melding">
          <textarea
            disabled
            rows={4}
            placeholder="Beskriv prosjektet ditt"
            className="w-full resize-none rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none"
          />
        </FormField>
      </div>
      <button
        type="button"
        disabled
        className="mt-5 w-full rounded-full px-5 py-3 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90"
        style={{ background: LIME }}
      >
        Send
      </button>
      <p className="mt-3 text-center text-[11px] text-stone-400">
        Demo-skjema — ta direkte kontakt på telefon eller e-post.
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
      <span className="text-xs font-medium text-stone-700">{label}</span>
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
      placeholder={placeholder}
      disabled
      className="w-full rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none"
    />
  );
}

// ─── Features row ────────────────────────────────────────────────────────────

function Features() {
  return (
    <section
      className="px-6 pt-32 pb-20 md:px-10 md:pt-36"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3 md:divide-x md:divide-stone-900/10">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className={
                i > 0 ? "px-6 text-center md:pl-10" : "px-6 text-center"
              }
            >
              <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md text-stone-900" style={{ background: LIME }}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {f.title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone-600">
                {f.description}
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
  about,
}: {
  company: Props["company"];
  about: string;
}) {
  return (
    <section
      id="om"
      className="px-6 pb-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-stone-300 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://source.unsplash.com/900x900/?gardener,topiary"
            alt={`${company.name} på jobb`}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Lidenskap for et{" "}
            <em className="font-serif italic">strakt uteområde</em>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-stone-700">
            {about}
          </p>

          <div className="mt-7 space-y-4 text-base leading-relaxed text-stone-700">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-stone-900">
                Kvalitet du kan bygge på
              </h3>
              <p className="mt-1.5">
                Vi tror på solide materialer og en finish helt ned til de minste
                detaljene. Pålitelig, stramt og alltid etter avtale.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-stone-900">
                Personlig tilnærming
              </h3>
              <p className="mt-1.5">
                Hver hage er unik. Vi lytter til ønskene dine og tenker proaktivt
                med deg om hvordan vi kan hente det meste ut av uteområdet.
              </p>
            </div>
          </div>

          <a
            href="#tjenester"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90"
            style={{ background: LIME }}
          >
            Oppdag historien vår
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

function Services({
  services,
}: {
  services: NicheConfig["services"];
}) {
  // Render up to 6 services in a 3-column grid.
  const list = services.slice(0, 6);

  return (
    <section
      id="tjenester"
      className="px-6 py-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          Våre faglige <em className="font-serif italic">tjenester</em>
        </h2>

        <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => {
            const keyword =
              SERVICE_IMAGE_KEYWORDS[i] ?? SERVICE_IMAGE_KEYWORDS[0]!;
            return (
              <article key={s.title}>
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-stone-300 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://source.unsplash.com/600x450/?${encodeURIComponent(keyword)}`}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  />
                </div>
                <h3 className="mt-5 text-2xl font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-600">
                  {s.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <a
            href="#kontakt"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90"
            style={{ background: LIME }}
          >
            Se våre tjenester
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Stats / testimonial banner ──────────────────────────────────────────────

function Stats() {
  return (
    <section
      className="px-6 pb-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          Vurdert <em className="font-serif italic">10/10</em> av kundene
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-600">
          Kundene våre stoler på oss for hagestell og anlegg utført med
          lidenskap og presisjon — fra periodisk vedlikehold til full
          forvandling.
        </p>
      </div>

      <div
        className="mx-auto mt-12 max-w-5xl rounded-3xl px-8 py-8 ring-1 ring-stone-900/10 md:py-10"
        style={{ background: "rgba(255,255,255,0.5)" }}
      >
        <div className="grid grid-cols-2 gap-y-6 md:grid-cols-4 md:divide-x md:divide-stone-900/10">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={i === 0 ? "text-center" : "text-center md:px-6"}
            >
              <div className="font-serif text-4xl font-semibold tracking-tight">
                {s.value}
              </div>
              <div className="mt-2 text-xs text-stone-600">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Big CTA — image left, dark panel right ──────────────────────────────────

function BigCta({ company }: { company: Props["company"] }) {
  return (
    <section className="grid lg:grid-cols-2">
      <div className="relative aspect-[4/3] lg:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://source.unsplash.com/1200x900/?gardener-tools,grass-trimmer"
          alt="Anleggsgartner i arbeid"
          className="h-full w-full object-cover"
        />
      </div>
      <div
        className="flex items-center px-8 py-16 text-white md:px-12 lg:py-24"
        style={{ background: STONE }}
      >
        <div className="max-w-lg">
          <h2 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight md:text-5xl">
            Et uteområde som{" "}
            <em
              className="font-serif italic"
              style={{ color: LIME }}
            >
              naturlig stråler
            </em>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/80">
            Vi bruker bærekraftige materialer og fagkyndige teknikker for å
            skape en hage som lever. Din visjon, vårt håndverk —{" "}
            {company.kommune ? `i ${company.kommune} og omegn.` : "året rundt."}
          </p>

          <ul className="mt-7 space-y-3">
            <li className="flex items-start gap-3 text-base text-white/90">
              <ChevronsRight
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: LIME }}
              />
              Gratis befaring og rådgivning på stedet
            </li>
            <li className="flex items-start gap-3 text-base text-white/90">
              <ChevronsRight
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: LIME }}
              />
              Ærlig kommunikasjon og stram planlegging
            </li>
            <li className="flex items-start gap-3 text-base text-white/90">
              <ChevronsRight
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: LIME }}
              />
              Erfaring fra hundrevis av hager — store som små
            </li>
          </ul>

          <a
            href="#kontakt"
            className="mt-9 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90"
            style={{ background: LIME }}
          >
            Be om tilbud
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── Process steps (staircase layout) ───────────────────────────────────────

function Process() {
  // Each step starts lower than the last on desktop — like steps descending.
  // On mobile they collapse to a single column without offsets.
  const offsets = ["lg:pt-0", "lg:pt-24", "lg:pt-48", "lg:pt-72"];

  return (
    <section
      className="px-6 py-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {PROCESS_STEPS.map((step, i) => (
            <article
              key={step.num}
              className={`space-y-4 ${offsets[i] ?? ""}`}
            >
              <div className="font-mono text-sm text-stone-500">{step.num}</div>
              <h3 className="font-serif text-2xl font-semibold tracking-tight">
                {step.title}
              </h3>
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-stone-300 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://source.unsplash.com/600x450/?garden,${encodeURIComponent(step.title)}`}
                  alt={step.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-sm leading-relaxed text-stone-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ───────────────────────────────────────────────────────────

function Testimonials() {
  // Static for v1 — show the first testimonial. The arrow buttons are rendered
  // for visual fidelity but don't cycle yet (would require a client component).
  const t = TESTIMONIALS[0]!;
  return (
    <section
      className="px-6 py-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          Fornøyde <em className="font-serif italic">kunder</em>
        </h2>

        <div className="mt-10 rounded-3xl bg-white px-8 py-10 shadow-sm ring-1 ring-stone-900/5 md:px-14 md:py-14">
          <div className="flex gap-1 text-amber-500">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <p className="mt-6 text-lg leading-relaxed text-stone-800 md:text-xl">
            &ldquo;{t.body}&rdquo;
          </p>
          <p className="mt-8 text-sm text-stone-500">— {t.author}</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled
            aria-label="Forrige anbefaling"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm ring-1 ring-stone-900/5 disabled:opacity-60"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="rounded-full bg-white px-6 py-2 text-sm font-mono text-stone-700 shadow-sm ring-1 ring-stone-900/5">
            (01 / {String(TESTIMONIALS.length).padStart(2, "0")})
          </div>
          <button
            type="button"
            disabled
            aria-label="Neste anbefaling"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-stone-900 shadow-sm disabled:opacity-90"
            style={{ background: LIME }}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Projects gallery (3-col grid, middle column is taller) ─────────────────

function ProjectsGallery() {
  return (
    <section
      className="px-6 py-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            Våre <em className="font-serif italic">prosjekter</em>
          </h2>
          <a
            href="#kontakt"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90"
            style={{ background: LIME }}
          >
            Se mer
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:auto-rows-[16rem]">
          {PROJECT_IMAGES.map((img, i) => (
            <div
              key={i}
              className={`overflow-hidden rounded-2xl bg-stone-300 shadow-sm ${
                img.tall ? "md:row-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ + side CTA card ────────────────────────────────────────────────────

function Faq({ company }: { company: Props["company"] }) {
  return (
    <section
      className="px-6 py-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            Ofte stilte <em className="font-serif italic">spørsmål</em>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-stone-600">
            Lurer du på noe om hvordan vi jobber eller hva vi tilbyr? Her er
            svarene på det vi får oftest.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* Side CTA card */}
          <div
            className="flex flex-col items-center justify-center gap-5 rounded-3xl px-8 py-12 text-center"
            style={{ background: "rgba(196, 233, 50, 0.18)" }}
          >
            <h3 className="text-2xl font-semibold tracking-tight">
              Forvandle hagen din i dag
            </h3>
            <p className="max-w-xs text-sm leading-relaxed text-stone-700">
              Få hagen til å leve med fagkyndig stell og stramt anlegg. Teamet
              vårt er klart til å ta på seg prosjekter — store som små.
            </p>
            <a
              href={
                company.email ? `mailto:${company.email}` : "#kontakt"
              }
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90"
              style={{ background: LIME }}
            >
              Ta kontakt
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-stone-900/10 bg-white/40 p-5 open:bg-[rgba(196,233,50,0.18)] open:border-stone-900/20"
                {...(i === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold tracking-tight">
                  <span>{item.q}</span>
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-900 group-open:hidden"
                    style={{ background: LIME }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                  <span
                    className="hidden h-7 w-7 items-center justify-center rounded-md text-stone-900 group-open:inline-flex"
                    style={{ background: LIME }}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-stone-700">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Blog ───────────────────────────────────────────────────────────────────

function Blog() {
  return (
    <section
      className="px-6 py-24 md:px-10"
      style={{ background: CREAM_DEEP }}
    >
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-serif text-4xl font-semibold tracking-tight md:text-5xl">
          Grønt liv <em className="font-serif italic">— bloggen vår</em>
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.title}
              className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-900/5"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-stone-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="px-2 pt-5 pb-3">
                <p className="text-xs text-stone-500">— {post.date}</p>
                <h3 className="mt-3 text-xl font-semibold leading-snug tracking-tight">
                  {post.title}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Bottom dark CTA — image right, dark panel left ─────────────────────────

function BottomCta({ company }: { company: Props["company"] }) {
  return (
    <section className="grid lg:grid-cols-2">
      <div
        className="flex items-center px-8 py-16 text-white md:px-12 lg:py-24"
        style={{ background: STONE }}
      >
        <div className="max-w-lg">
          <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
            Forvandle hagen din{" "}
            <em className="font-serif italic" style={{ color: LIME }}>
              med fagmannen
            </em>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/80">
            Slapp av og nyt et grønnere, vakrere uteområde — fagmessig
            gjennomført etter dine ønsker. Vi tar den tunge jobben, så du kan
            bruke hagen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-stone-900 transition-opacity hover:opacity-90"
              style={{ background: LIME }}
            >
              Be om tilbud
              <ArrowRight className="h-4 w-4" />
            </a>
            {company.phone || company.mobile ? (
              <a
                href={`tel:${company.mobile ?? company.phone}`}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20"
              >
                <Phone className="h-4 w-4" />
                Ring oss
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="relative aspect-[4/3] lg:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://source.unsplash.com/1200x900/?landscape-garden,backyard"
          alt="Hagen i full vekst"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer({ company }: { company: Props["company"] }) {
  const phone = bestPhone(company);

  return (
    <footer
      id="kontakt"
      className="px-6 py-16 text-white md:px-10 md:py-20"
      style={{ background: STONE }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <div
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-stone-900"
              style={{ background: LIME }}
            >
              <Leaf className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold uppercase tracking-tight">
                {company.name}
              </div>
              <div className="font-serif text-xs italic text-white/70">
                Anleggsgartner
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Hageanlegg, vedlikehold og renovasjon med fokus på håndverk og
            lokal forankring.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Kontakt
          </div>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            {phone ? (
              <li>
                <a
                  href={`tel:${phone}`}
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Phone className="h-3.5 w-3.5" /> {phone}
                </a>
              </li>
            ) : null}
            {company.email ? (
              <li>
                <a
                  href={`mailto:${company.email}`}
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" /> {company.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Adresse
          </div>
          <div className="mt-3 flex items-start gap-2 text-sm text-white/85">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              {company.address_line ?? "—"}
              {company.postal_code || company.postal_place ? (
                <div>
                  {company.postal_code} {company.postal_place}
                </div>
              ) : null}
              {company.kommune ? (
                <div className="text-white/60">{company.kommune}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
        <div>
          © {new Date().getFullYear()} {company.name} · Org.nr {company.org_nr}
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <Eye className="h-3 w-3" />
          Demonstrasjon laget av FX Media
        </div>
      </div>
    </footer>
  );
}
