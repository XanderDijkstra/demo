import { ArrowRight, MapPin, Phone, Mail } from "lucide-react";

import type { NicheConfig } from "@/lib/templates";
import type { GeneratedSiteContent } from "@/lib/supabase/types";

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

export function SiteTemplate({ company, niche, content }: SiteTemplateProps) {
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
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div
              className="inline-flex h-8 w-8 items-center justify-center rounded-md font-bold text-white text-sm"
              style={{ background: "var(--site-primary)" }}
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
            style={{ background: "var(--site-primary)" }}
          >
            {niche.ctaText}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--site-accent)" }}
      >
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-24 md:gap-16">
          <div className="flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap gap-2">
              {niche.benefitTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl leading-[1.1]">
              {headline}
            </h1>
            <p className="max-w-lg text-lg text-slate-700">{subheadline}</p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#kontakt"
                className="inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: "var(--site-primary)" }}
              >
                {niche.ctaText}
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
          </div>

          <div className="relative">
            <div
              className="absolute -inset-3 rounded-[2rem] opacity-30 blur-2xl"
              style={{ background: "var(--site-primary)" }}
            />
            <div
              className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-slate-200 shadow-xl ring-1 ring-slate-200"
              style={{ background: "var(--site-primary)" }}
            >
              {/* Unsplash-source image with niche keyword. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt={`${niche.displayName} – ${company.name}`}
                className="h-full w-full object-cover mix-blend-luminosity opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 max-w-2xl">
          <p
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--site-primary)" }}
          >
            Tjenester
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Det vi gjør for deg
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {niche.services.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
                style={{ background: "var(--site-primary)" }}
              >
                <span className="text-sm font-bold">
                  {niche.services.indexOf(s) + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
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

      {/* Contact */}
      <section id="kontakt" className="mx-auto max-w-4xl px-6 py-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-3">
              <p
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: "var(--site-primary)" }}
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
                style={{ ["--tw-ring-color" as string]: "var(--site-primary)" }}
              />
              <input
                type="email"
                placeholder="E-post"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: "var(--site-primary)" }}
              />
              <textarea
                placeholder="Hva kan vi hjelpe med?"
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: "var(--site-primary)" }}
              />
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ background: "var(--site-primary)" }}
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

      {/* Footer */}
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
    </div>
  );
}
