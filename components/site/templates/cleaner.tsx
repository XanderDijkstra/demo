import {
  ArrowRight,
  CalendarCheck,
  Check,
  ChevronDown,
  Mail,
  MapPin,
  MessageSquareQuote,
  Phone,
  Sparkles,
} from "lucide-react";

import type { GeneratedSiteContent } from "@/lib/db/types";
import type { NicheConfig } from "@/lib/templates";
import { formatCompanyName } from "@/lib/utils";

import { CLEANER_IMAGES } from "./cleaner-images";
import { CleanerQuote } from "./cleaner-quote";

/**
 * Bespoke cleaning / renhold template.
 *
 * Built from the patterns the strongest cleaning and home-service sites
 * share: phone + price CTA always visible (sticky header, sticky mobile
 * bar), a short step-by-step price request in the hero, services with
 * photos, a room-by-room "what's included" checklist, a three-step "how it
 * works", FAQ, and the CTA repeated at the bottom. Fresh mint/teal on white.
 *
 * Copy rule (see lib/templates.ts): no reviews, years, prices, insurance,
 * approvals or guarantees. The checklist is framed as an example that is
 * agreed with the customer, and the street address is left out because
 * most of these are sole traders registered at home.
 */

const INK = "oklch(0.26 0.04 210)";
const MINT = "oklch(0.78 0.1 170)";
const MINT_DEEP = "oklch(0.5 0.09 175)";
const MIST = "oklch(0.97 0.012 180)";
const SAGE = "oklch(0.93 0.035 170)";

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

const STEPS = [
  {
    title: "Be om pris",
    body: "Fortell hva som skal vaskes, hvor stort det er og hvor ofte. Det tar et minutt.",
  },
  {
    title: "Vi avtaler tidspunkt",
    body: "Vi går gjennom ønskene dine og finner en dag og et tidspunkt som passer.",
  },
  {
    title: "Kom hjem til rent",
    body: "Vasken gjøres slik vi har avtalt. Gi beskjed om noe skal gjøres annerledes neste gang.",
  },
];

const ROOMS = [
  {
    title: "Kjøkken",
    items: [
      "Benkeplater og fronter",
      "Komfyr og koketopp utvendig",
      "Vask og kran",
      "Tørke av hvitevarer",
      "Støvsuge og vaske gulv",
    ],
  },
  {
    title: "Bad",
    items: [
      "Toalett, servant og dusj",
      "Speil og fliser",
      "Kraner og armatur",
      "Tømme søppel",
      "Vaske gulv",
    ],
  },
  {
    title: "Stue og soverom",
    items: [
      "Tørke støv på flater",
      "Støvsuge gulv og tepper",
      "Vaske gulv",
      "Re opp senger ved ønske",
      "Tømme søppel",
    ],
  },
];

const FREQUENCIES = ["Hver uke", "Annenhver uke", "Hver 4. uke", "Én gang"];

function faqItems(area: string | null) {
  return [
    {
      q: "Hva koster det?",
      a: "Prisen avhenger av hvor stort det er, hva som skal gjøres og hvor ofte. Be om pris, så får du et konkret svar.",
    },
    {
      q: "Må jeg være hjemme mens dere vasker?",
      a: "Nei, det avtaler vi. Du kan være hjemme, eller vi avtaler hvordan vi kommer inn.",
    },
    {
      q: "Hvem stiller med vaskemidler og utstyr?",
      a: "Det avklarer vi når vi avtaler oppdraget, ut fra hva du har og hva du ønsker.",
    },
    {
      q: "Kan jeg flytte eller avlyse en vask?",
      a: "Gi beskjed så tidlig som mulig, så finner vi et nytt tidspunkt.",
    },
    {
      q: "Hvilke områder dekker dere?",
      a: area
        ? `Vi holder til i ${area}. Fortell oss hvor du bor, så avklarer vi om vi kan ta oppdraget.`
        : "Fortell oss hvor du bor, så avklarer vi om vi kan ta oppdraget.",
    },
  ];
}

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

/** "Jaren i Gran" / "Gran" / null, title-cased from the Brreg caps. */
function areaLabel(c: Props["company"]): string | null {
  const kommune = c.kommune ? formatCompanyName(c.kommune) : null;
  const place = c.postal_place ? formatCompanyName(c.postal_place) : null;
  if (place && kommune && place !== kommune) return `${place} i ${kommune}`;
  return kommune ?? place;
}

export function CleanerTemplate({ company: companyRaw, niche, content }: Props) {
  const company = { ...companyRaw, name: formatCompanyName(companyRaw.name) };
  const phone = bestPhone(company);
  const phoneDisplay = formatPhone(phone);
  const area = areaLabel(company);
  const kommune = company.kommune ? formatCompanyName(company.kommune) : null;

  const headline = content.hero_headline ?? "Et rent hjem, uten at du må løfte en finger";
  const subheadline =
    content.hero_subheadline ??
    `${company.name} tar oppdrag med hjemmevask, storrengjøring, flyttevask og kontorrenhold${kommune ? ` i ${kommune} og omegn` : ""}.`;
  const about =
    content.about_paragraph ??
    `${company.name} er et rengjøringsfirma${area ? ` fra ${area}` : ""}. Vi tar oppdrag for private hjem og bedrifter, og avtaler alltid innholdet i vasken med deg på forhånd.`;

  return (
    <div
      className="min-h-screen bg-white pb-20 text-[color:var(--ink)] md:pb-0"
      style={
        {
          "--ink": INK,
          "--mint": MINT,
          "--mint-deep": MINT_DEEP,
          "--mist": MIST,
          "--sage": SAGE,
        } as React.CSSProperties
      }
    >
      <TopStrip area={area} phone={phone} phoneDisplay={phoneDisplay} />
      <Header name={company.name} phone={phone} phoneDisplay={phoneDisplay} cta={niche.ctaText} />
      <Hero
        company={company}
        headline={headline}
        subheadline={subheadline}
        phone={phone}
        phoneDisplay={phoneDisplay}
      />
      <Services niche={niche} />
      <Frequency />
      <Included />
      <HowItWorks />
      <About name={company.name} body={about} area={area} />
      <Reviews />
      <Faq area={area} />
      <FinalCta phone={phone} phoneDisplay={phoneDisplay} email={company.email} cta={niche.ctaText} />
      <Footer company={company} area={area} phone={phone} phoneDisplay={phoneDisplay} />
      <MobileBar phone={phone} cta={niche.ctaText} />
    </div>
  );
}

// ─── Top strip + header ──────────────────────────────────────────────────────

function TopStrip({
  area,
  phone,
  phoneDisplay,
}: {
  area: string | null;
  phone: string | null;
  phoneDisplay: string | null;
}) {
  return (
    <div className="hidden bg-[color:var(--ink)] px-6 py-2 text-xs text-white/80 md:block md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {area ? `Rengjøring i ${area} og omegn` : "Rengjøring for hjem og bedrift"}
        </span>
        {phone ? (
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-white">
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Ring {phoneDisplay}
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Header({
  name,
  phone,
  phoneDisplay,
  cta,
}: {
  name: string;
  phone: string | null;
  phoneDisplay: string | null;
  cta: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--ink)]/8 bg-white/90 px-6 py-3.5 backdrop-blur-md md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <a href="#hjem" className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--sage)] text-[color:var(--mint-deep)]">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <span className="truncate text-base font-semibold tracking-tight">{name}</span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-[color:var(--ink)]/75 lg:flex">
          <a href="#tjenester" className="hover:text-[color:var(--ink)]">Tjenester</a>
          <a href="#inngar" className="hover:text-[color:var(--ink)]">Hva inngår</a>
          <a href="#slik" className="hover:text-[color:var(--ink)]">Slik fungerer det</a>
          <a href="#om" className="hover:text-[color:var(--ink)]">Om oss</a>
          <a href="#faq" className="hover:text-[color:var(--ink)]">Spørsmål</a>
        </nav>
        <div className="flex items-center gap-3">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="hidden items-center gap-1.5 text-sm font-medium tabular-nums md:inline-flex"
            >
              <Phone className="h-4 w-4 text-[color:var(--mint-deep)]" aria-hidden />
              {phoneDisplay}
            </a>
          ) : null}
          <a
            href="#pris"
            className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ink)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {cta}
          </a>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({
  company,
  headline,
  subheadline,
  phone,
  phoneDisplay,
}: {
  company: Props["company"];
  headline: string;
  subheadline: string;
  phone: string | null;
  phoneDisplay: string | null;
}) {
  return (
    <section
      id="hjem"
      className="relative overflow-hidden px-6 pt-12 pb-20 md:px-10 md:pt-16 md:pb-28"
      style={{ background: `linear-gradient(180deg, ${MIST} 0%, #fff 100%)` }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--sage)] px-3 py-1 text-xs font-semibold text-[color:var(--mint-deep)]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Hjemmevask · Flyttevask · Kontor
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight md:text-5xl lg:text-[3.6rem]">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[color:var(--ink)]/70">{subheadline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pris"
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Få pris
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ink)]/15 bg-white px-6 py-3.5 text-sm font-semibold hover:bg-[color:var(--mist)]"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {phoneDisplay}
              </a>
            ) : null}
          </div>
          <ul className="mt-8 grid max-w-md gap-2.5 text-sm text-[color:var(--ink)]/75 sm:grid-cols-2">
            {["Privat og bedrift", "Fast avtale eller én gang", "Innholdet avtales med deg", "Ta kontakt for pris"].map(
              (t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--sage)]">
                    <Check className="h-3 w-3 text-[color:var(--mint-deep)]" aria-hidden />
                  </span>
                  {t}
                </li>
              )
            )}
          </ul>
        </div>

        <div id="pris" className="relative scroll-mt-28">
          <img
            src={CLEANER_IMAGES.hero}
            alt=""
            className="absolute -top-6 right-0 hidden h-[115%] w-[78%] rounded-[2rem] object-cover lg:block"
          />
          <img
            src={CLEANER_IMAGES.hero}
            alt=""
            className="mb-[-3rem] aspect-[16/10] w-full rounded-3xl object-cover lg:hidden"
          />
          <div className="relative mx-3 lg:mx-0 lg:mr-[38%] lg:mt-24">
            <CleanerQuote
              companyName={company.name}
              email={company.email}
              phone={phone}
              phoneDisplay={phoneDisplay}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

function Services({ niche }: { niche: NicheConfig }) {
  return (
    <section id="tjenester" className="scroll-mt-20 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Tjenester" title="Hjelp med det du ikke rekker" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {niche.services.map((s, i) => (
            <article
              key={s.title}
              className="group overflow-hidden rounded-3xl bg-[color:var(--mist)] ring-1 ring-[color:var(--ink)]/6"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={CLEANER_IMAGES.services[i % CLEANER_IMAGES.services.length]}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--ink)]/70">{s.description}</p>
                <a
                  href="#pris"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--mint-deep)]"
                >
                  Få pris
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Frequency() {
  return (
    <section className="px-6 md:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-3xl bg-[color:var(--ink)] px-7 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex items-center gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <CalendarCheck className="h-6 w-6 text-[color:var(--mint)]" aria-hidden />
          </span>
          <div>
            <h3 className="text-xl font-semibold">Du bestemmer hvor ofte</h3>
            <p className="text-sm text-white/65">Fast avtale eller en enkelt vask, det du trenger.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((f) => (
            <span key={f} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
              {f}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── What's included ─────────────────────────────────────────────────────────

function Included() {
  return (
    <section id="inngar" className="scroll-mt-20 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          eyebrow="Hva inngår"
          title="Rom for rom"
          lead="Et eksempel på hva en vanlig vask kan inneholde. Vi avtaler alltid innholdet med deg, og legger til eller tar bort etter ønske."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {ROOMS.map((room, i) => (
            <div key={room.title} className="overflow-hidden rounded-3xl ring-1 ring-[color:var(--ink)]/8">
              <img src={CLEANER_IMAGES.rooms[i]} alt="" className="aspect-[16/10] w-full object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-semibold">{room.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {room.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[color:var(--ink)]/75">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--mint-deep)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section id="slik" className="scroll-mt-20 bg-[color:var(--mist)] px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHead eyebrow="Slik fungerer det" title="Tre steg til et rent hjem" />
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-3xl bg-white p-7 ring-1 ring-[color:var(--ink)]/6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--mint)] text-sm font-bold text-[color:var(--ink)]">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--ink)]/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── About ───────────────────────────────────────────────────────────────────

function About({ name, body, area }: { name: string; body: string; area: string | null }) {
  return (
    <section id="om" className="scroll-mt-20 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <img src={CLEANER_IMAGES.about} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover" />
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mint-deep)]">
            Om oss
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{name}</h2>
          <p className="mt-5 text-lg text-[color:var(--ink)]/70">{body}</p>
          {area ? (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-[color:var(--sage)] px-4 py-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-[color:var(--mint-deep)]" aria-hidden />
              {area}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="px-6 pb-20 md:px-10 md:pb-28">
      <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-[color:var(--ink)]/20 p-8 text-center md:p-12">
        <MessageSquareQuote className="mx-auto h-7 w-7 text-[color:var(--ink)]/35" aria-hidden />
        <p className="mt-4 text-lg font-medium">Her kommer kundeomtalene deres</p>
        <p className="mt-2 text-sm text-[color:var(--ink)]/55">
          Eksempelplass. Når de første kundene har gitt tilbakemelding, kan omtalene vises her.
        </p>
      </div>
    </section>
  );
}

// ─── FAQ + final CTA ─────────────────────────────────────────────────────────

function Faq({ area }: { area: string | null }) {
  return (
    <section id="faq" className="scroll-mt-20 bg-[color:var(--mist)] px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHead eyebrow="Spørsmål" title="Ofte stilte spørsmål" center />
        <div className="mt-10 divide-y divide-[color:var(--ink)]/10 rounded-3xl bg-white px-6 ring-1 ring-[color:var(--ink)]/6">
          {faqItems(area).map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-[color:var(--ink)]/45 transition group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-3 text-sm text-[color:var(--ink)]/70">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({
  phone,
  phoneDisplay,
  email,
  cta,
}: {
  phone: string | null;
  phoneDisplay: string | null;
  email: string | null;
  cta: string;
}) {
  return (
    <section className="px-6 py-20 md:px-10 md:py-24">
      <div
        className="mx-auto max-w-6xl rounded-[2rem] px-8 py-14 text-center md:px-16 md:py-20"
        style={{ background: `linear-gradient(135deg, ${SAGE} 0%, ${MINT} 100%)` }}
      >
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Klar for et renere hjem?</h2>
        <p className="mx-auto mt-4 max-w-xl text-[color:var(--ink)]/75">
          Fortell oss hva du trenger, så tar vi kontakt med en pris.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#pris"
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-6 py-3.5 text-sm font-semibold text-white hover:opacity-90"
          >
            {cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold hover:bg-white/80"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {phoneDisplay}
            </a>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold hover:bg-white/80"
            >
              <Mail className="h-4 w-4" aria-hidden />
              E-post
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── Footer + mobile bar ─────────────────────────────────────────────────────

function Footer({
  company,
  area,
  phone,
  phoneDisplay,
}: {
  company: Props["company"];
  area: string | null;
  phone: string | null;
  phoneDisplay: string | null;
}) {
  return (
    <footer id="kontakt" className="bg-[color:var(--ink)] px-6 pt-16 pb-10 text-white md:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[color:var(--mint)]">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-base font-semibold">{company.name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-white/60">
            Rengjøring for hjem og bedrift{area ? ` i ${area} og omegn` : ""}.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Tjenester</h4>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li><a href="#tjenester" className="hover:text-white">Fast hjemmevask</a></li>
            <li><a href="#tjenester" className="hover:text-white">Storrengjøring</a></li>
            <li><a href="#tjenester" className="hover:text-white">Flyttevask</a></li>
            <li><a href="#tjenester" className="hover:text-white">Kontor og næring</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Kontakt</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            {phone ? (
              <li>
                <a href={`tel:${phone}`} className="inline-flex items-center gap-2 hover:text-white">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {phoneDisplay}
                </a>
              </li>
            ) : null}
            {company.email ? (
              <li>
                <a href={`mailto:${company.email}`} className="inline-flex items-center gap-2 break-all hover:text-white">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {company.email}
                </a>
              </li>
            ) : null}
            {area ? (
              <li className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {area}
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-6xl flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/45 md:flex-row md:justify-between">
        <div>
          © {new Date().getFullYear()} {company.name} · Org.nr {company.org_nr}
        </div>
        <div>Demonstrasjon laget av FX Media</div>
      </div>
    </footer>
  );
}

function MobileBar({ phone, cta }: { phone: string | null; cta: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-[color:var(--ink)]/10 bg-white/95 p-3 backdrop-blur md:hidden">
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--ink)]/15 py-3 text-sm font-semibold"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Ring
        </a>
      ) : (
        <span />
      )}
      <a
        href="#pris"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--ink)] py-3 text-sm font-semibold text-white"
      >
        {cta}
      </a>
    </div>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function SectionHead({
  eyebrow,
  title,
  lead,
  center,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "text-center" : "max-w-2xl"}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mint-deep)]">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {lead ? <p className="mt-4 text-[color:var(--ink)]/70">{lead}</p> : null}
    </div>
  );
}
