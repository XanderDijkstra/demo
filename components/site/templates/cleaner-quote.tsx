"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, Phone } from "lucide-react";

/**
 * Three-step price request for the cleaner template: service → home size →
 * frequency. Nothing is posted anywhere; the last step hands the answers to
 * the visitor's own mail app (mailto with a pre-filled body) or the phone.
 * A small first question gets the commitment before contact details, which
 * is the pattern home-service sites use for quote forms.
 */

const SERVICES = ["Fast hjemmevask", "Storrengjøring", "Flyttevask", "Kontor og næring"];
const SIZES = ["Under 50 m²", "50–100 m²", "100–150 m²", "Over 150 m²"];
const FREQUENCIES = ["Hver uke", "Annenhver uke", "Hver 4. uke", "Én gang"];

const STEPS = [
  { title: "Hva trenger du hjelp med?", options: SERVICES },
  { title: "Hvor stort er det?", options: SIZES },
  { title: "Hvor ofte?", options: FREQUENCIES },
] as const;

export function CleanerQuote({
  companyName,
  email,
  phone,
  phoneDisplay,
}: {
  companyName: string;
  email: string | null;
  phone: string | null;
  phoneDisplay: string | null;
}) {
  const [answers, setAnswers] = useState<string[]>([]);
  const step = answers.length;
  const current = STEPS[step];

  const choose = (value: string) => setAnswers((a) => [...a, value]);
  const back = () => setAnswers((a) => a.slice(0, -1));

  const body = [
    "Hei!",
    "",
    "Jeg ønsker pris på rengjøring:",
    `Tjeneste: ${answers[0] ?? ""}`,
    `Størrelse: ${answers[1] ?? ""}`,
    `Hvor ofte: ${answers[2] ?? ""}`,
    "Adresse: ",
    "",
    "Hilsen",
  ].join("\n");
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(`Prisforespørsel til ${companyName}`)}&body=${encodeURIComponent(body)}`
    : null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[0_30px_80px_-30px_rgba(10,40,45,0.35)] ring-1 ring-[color:var(--ink)]/10 md:p-7">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--mint-deep)]">
          Få pris
        </span>
        <span className="text-xs tabular-nums text-[color:var(--ink)]/50">
          {!current ? "Klar" : `Steg ${step + 1} av ${STEPS.length}`}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {STEPS.map((s, i) => (
          <span
            key={s.title}
            className={`h-1 flex-1 rounded-full ${i < step ? "bg-[color:var(--mint)]" : "bg-[color:var(--ink)]/10"}`}
          />
        ))}
      </div>

      {current ? (
        <>
          <h3 className="mt-5 text-lg font-semibold text-[color:var(--ink)]">
            {current.title}
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {current.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => choose(opt)}
                className="rounded-xl border border-[color:var(--ink)]/12 bg-[color:var(--mist)] px-3 py-3.5 text-left text-sm font-medium text-[color:var(--ink)] transition hover:border-[color:var(--mint)] hover:bg-white"
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h3 className="mt-5 text-lg font-semibold text-[color:var(--ink)]">
            Send forespørselen
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--ink)]/80">
            {answers.map((a) => (
              <li key={a} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[color:var(--mint-deep)]" aria-hidden />
                {a}
              </li>
            ))}
          </ul>
          <div className="mt-5 grid gap-2.5">
            {mailto ? (
              <a
                href={mailto}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--ink)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                <Mail className="h-4 w-4" aria-hidden />
                Send på e-post
              </a>
            ) : null}
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--ink)]/15 px-5 py-3 text-sm font-semibold text-[color:var(--ink)] hover:bg-[color:var(--mist)]"
              >
                <Phone className="h-4 w-4" aria-hidden />
                Ring {phoneDisplay}
              </a>
            ) : null}
          </div>
        </>
      )}

      {step > 0 ? (
        <button
          type="button"
          onClick={back}
          className="mt-4 inline-flex items-center gap-1 text-xs text-[color:var(--ink)]/55 hover:text-[color:var(--ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Tilbake
        </button>
      ) : (
        <p className="mt-4 flex items-center gap-1 text-xs text-[color:var(--ink)]/50">
          Tre raske valg, så sender du forespørselen
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </p>
      )}
    </div>
  );
}
