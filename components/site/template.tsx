import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";

import type { NicheConfig } from "@/lib/templates";
import type { GeneratedSiteContent } from "@/lib/supabase/types";
import { formatCompanyName } from "@/lib/utils";

interface SiteTemplateProps {
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

function bestPhone(c: SiteTemplateProps["company"]): string | null {
  return c.mobile ?? c.phone ?? null;
}

export function SiteTemplate({
  company: companyRaw,
  niche,
  content,
}: SiteTemplateProps) {
  // Title-case the ALL-CAPS Brreg name once; every section below reads
  // company.name / companyName from this normalized object.
  const company = { ...companyRaw, name: formatCompanyName(companyRaw.name) };
  const heroImage = `https://source.unsplash.com/1600x900/?${encodeURIComponent(niche.heroImageKeyword)}`;
  const phone = bestPhone(company);
  const headline = content.hero_headline ?? company.name;
  const subheadline =
    content.hero_subheadline ??
    `${niche.displayName.toLowerCase()}${company.kommune ? ` i ${company.kommune}` : ""}.`;
  const about =
    content.about_paragraph ??
    `${company.name} er en ${niche.displayName.toLowerCase()}${
      company.kommune ? ` etablert i ${company.kommune}` : ""
    }.`;

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={
        {
          "--site-primary": niche.primaryColor,
          "--site-accent": niche.accentColor,
        } as React.CSSProperties
      }
    >
      <TopBar
        company={company}
        ctaText={niche.ctaText}
        primary={niche.primaryColor}
      />

      {niche.heroLayout === "centered" ? (
        <CenteredHero
          niche={niche}
          headline={headline}
          subheadline={subheadline}
          phone={phone}
          heroImage={heroImage}
          companyName={company.name}
        />
      ) : niche.heroLayout === "overlay" ? (
        <OverlayHero
          niche={niche}
          headline={headline}
          subheadline={subheadline}
          phone={phone}
          heroImage={heroImage}
          companyName={company.name}
        />
      ) : (
        <SplitHero
          niche={niche}
          headline={headline}
          subheadline={subheadline}
          phone={phone}
          heroImage={heroImage}
          companyName={company.name}
        />
      )}

      <ServicesSection niche={niche} />
      <AboutSection company={company} about={about} />
      <ContactSection company={company} niche={niche} phone={phone} />
      <Footer company={company} />
    </div>
  );
}

// ─── Sections ───────────────────────────────────────────────────────────────

function TopBar({
  company,
  ctaText,
  primary,
}: {
  company: SiteTemplateProps["company"];
  ctaText: string;
  primary: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div
            className="inline-flex h-8 w-8 items-center justify-center rounded-md font-bold text-white text-sm"
            style={{ background: primary }}
          >
            {company.name.charAt(0)}
          </div>
          <span className="font-semibold tracking-tight truncate max-w-64">
            {company.name}
          </span>
        </div>
        <a
          href="#kontakt"
          className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ background: primary }}
        >
          {ctaText}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </header>
  );
}

interface HeroSectionProps {
  niche: NicheConfig;
  headline: string;
  subheadline: string;
  phone: string | null;
  heroImage: string;
  companyName: string;
}

function BenefitChips({ tags }: { tags: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function HeroCtas({
  ctaText,
  phone,
  primary,
}: {
  ctaText: string;
  phone: string | null;
  primary: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <a
        href="#kontakt"
        className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
        style={{ background: primary }}
      >
        {ctaText}
        <ArrowRight className="h-4 w-4" />
      </a>
      {phone ? (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 shadow-sm hover:border-slate-400"
        >
          <Phone className="h-4 w-4" />
          {phone}
        </a>
      ) : null}
    </div>
  );
}

function SplitHero({
  niche,
  headline,
  subheadline,
  phone,
  heroImage,
  companyName,
}: HeroSectionProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: niche.accentColor }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24 md:gap-16">
        <div className="flex flex-col justify-center space-y-6">
          <BenefitChips tags={niche.benefitTags} />
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl leading-[1.1]">
            {headline}
          </h1>
          <p className="max-w-lg text-lg text-slate-700">{subheadline}</p>
          <HeroCtas
            ctaText={niche.ctaText}
            phone={phone}
            primary={niche.primaryColor}
          />
        </div>
        <div className="relative">
          <div
            className="absolute -inset-3 rounded-[2rem] opacity-30 blur-2xl"
            style={{ background: niche.primaryColor }}
          />
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200"
            style={{ background: niche.primaryColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt={`${niche.displayName} – ${companyName}`}
              className="h-full w-full object-cover mix-blend-luminosity opacity-90"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CenteredHero({
  niche,
  headline,
  subheadline,
  phone,
  heroImage,
  companyName,
}: HeroSectionProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: niche.accentColor }}
    >
      <div className="mx-auto max-w-3xl px-6 pt-20 pb-12 text-center md:pt-28">
        <div className="flex flex-col items-center space-y-6">
          <BenefitChips tags={niche.benefitTags} />
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl leading-[1.05]">
            {headline}
          </h1>
          <p className="max-w-2xl text-lg text-slate-700">{subheadline}</p>
          <HeroCtas
            ctaText={niche.ctaText}
            phone={phone}
            primary={niche.primaryColor}
          />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 pb-16">
        <div
          className="relative aspect-[16/8] overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200"
          style={{ background: niche.primaryColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt={`${niche.displayName} – ${companyName}`}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function OverlayHero({
  niche,
  headline,
  subheadline,
  phone,
  heroImage,
  companyName,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt={`${niche.displayName} – ${companyName}`}
          className="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.85) 100%)`,
          }}
        />
        <div
          className="absolute inset-0 mix-blend-multiply opacity-50"
          style={{ background: niche.primaryColor }}
        />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 py-32 md:py-44 text-white">
        <div className="space-y-6">
          <BenefitChips tags={niche.benefitTags} />
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl leading-[1.05] max-w-3xl">
            {headline}
          </h1>
          <p className="max-w-2xl text-lg text-white/90">{subheadline}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: niche.primaryColor }}
            >
              {niche.ctaText}
              <ArrowRight className="h-4 w-4" />
            </a>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur hover:bg-white/20"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ niche }: { niche: NicheConfig }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-10 max-w-2xl">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: niche.primaryColor }}
        >
          Tjenester
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          Det vi gjør for deg
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {niche.services.map((s, i) => (
          <div
            key={s.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
              style={{ background: niche.primaryColor }}
            >
              <span className="text-sm font-bold">{i + 1}</span>
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AboutSection({
  company,
  about,
}: {
  company: SiteTemplateProps["company"];
  about: string;
}) {
  return (
    <section
      className="border-y"
      style={{ background: "var(--site-accent)" }}
    >
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--site-primary)" }}
        >
          Om oss
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {company.name}
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
          {about}
        </p>
      </div>
    </section>
  );
}

function ContactSection({
  company,
  niche,
  phone,
}: {
  company: SiteTemplateProps["company"];
  niche: NicheConfig;
  phone: string | null;
}) {
  return (
    <section id="kontakt" className="mx-auto max-w-4xl px-6 py-20">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-3">
            <p
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: niche.primaryColor }}
            >
              Kontakt
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Klar når du er.
            </h2>
            <p className="text-slate-600">
              Send oss en melding eller ring direkte — vi svarer raskt.
            </p>
            <div className="space-y-2 pt-3 text-sm">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
                >
                  <Phone className="h-4 w-4" /> {phone}
                </a>
              ) : null}
              {company.email ? (
                <a
                  href={`mailto:${company.email}`}
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
                >
                  <Mail className="h-4 w-4" /> {company.email}
                </a>
              ) : null}
              {company.address_line || company.postal_place ? (
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {company.address_line}
                    {company.postal_code || company.postal_place ? (
                      <>
                        <br />
                        {company.postal_code} {company.postal_place}
                      </>
                    ) : null}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <form
            action="#"
            className="space-y-3"
            aria-label="Kontaktskjema (demo)"
          >
            <input
              type="text"
              placeholder="Navn"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: niche.primaryColor }}
            />
            <input
              type="email"
              placeholder="E-post"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: niche.primaryColor }}
            />
            <textarea
              placeholder="Hva kan vi hjelpe med?"
              rows={4}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: niche.primaryColor }}
            />
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
              style={{ background: niche.primaryColor }}
            >
              {niche.ctaText}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-[11px] text-slate-500">
              Demo-skjemaet er deaktivert. Ta kontakt på telefon eller
              e-post over.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer({ company }: { company: SiteTemplateProps["company"] }) {
  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
        <div>
          © {new Date().getFullYear()} {company.name} · Org.nr {company.org_nr}
        </div>
        <div className="text-slate-400">
          Demonstrasjon laget av FX Media
        </div>
      </div>
    </footer>
  );
}
