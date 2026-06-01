/**
 * Brønnøysundregistrene (Brreg) — Enhetsregisteret API client.
 *
 * Public API, no auth required.
 * https://data.brreg.no/enhetsregisteret/api/docs/index.html
 *
 * v1 only uses the date-range endpoint to pull entities registered on a
 * specific day (the previous day, in the default cron flow).
 */

import { z } from "zod";

import type { CompanyInsert } from "@/lib/supabase/types";

const BRREG_BASE_URL = "https://data.brreg.no/enhetsregisteret/api";
// Brreg caps page size at 10 000 but rejects huge pages in practice;
// 200 strikes a good balance for ~250-companies/day workloads.
const PAGE_SIZE = 200;

// ─── Response schema ─────────────────────────────────────────────────────────
// Only fields we actually consume are typed; everything else lands in raw_data.
const AddressSchema = z
  .object({
    adresse: z.array(z.string()).optional(),
    postnummer: z.string().optional(),
    poststed: z.string().optional(),
    kommune: z.string().optional(),
    kommunenummer: z.string().optional(),
    landkode: z.string().optional(),
  })
  .passthrough();

const CodeSchema = z
  .object({
    kode: z.string(),
    beskrivelse: z.string().optional(),
  })
  .passthrough();

const EnhetSchema = z
  .object({
    organisasjonsnummer: z.string(),
    navn: z.string(),
    organisasjonsform: CodeSchema.optional(),
    naeringskode1: CodeSchema.optional(),
    forretningsadresse: AddressSchema.optional(),
    postadresse: AddressSchema.optional(),
    antallAnsatte: z.number().int().nullable().optional(),
    // Brreg uses these exact keys: epostadresse (NOT "epost"), mobil,
    // telefon, hjemmeside. We also accept a couple of legacy aliases so a
    // schema tweak on their side can't silently null these out again.
    telefon: z.string().nullable().optional(),
    telefonnummer: z.string().nullable().optional(),
    mobil: z.string().nullable().optional(),
    mobiltelefon: z.string().nullable().optional(),
    epostadresse: z.string().nullable().optional(),
    epost: z.string().nullable().optional(),
    hjemmeside: z.string().nullable().optional(),
    stiftelsesdato: z.string().nullable().optional(),
    registreringsdatoEnhetsregisteret: z.string().nullable().optional(),
    registrertIMvaregisteret: z.boolean().optional(),
    konkurs: z.boolean().optional(),
    underAvvikling: z.boolean().optional(),
    underTvangsavviklingEllerTvangsopplosning: z.boolean().optional(),
  })
  .passthrough();

export type BrregEnhet = z.infer<typeof EnhetSchema>;

const PageSchema = z.object({
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
  number: z.number(),
});

const ListResponseSchema = z.object({
  _embedded: z
    .object({
      enheter: z.array(EnhetSchema),
    })
    .optional(),
  page: PageSchema,
});

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch every entity registered in Brreg between `from` and `to` (inclusive).
 *
 * Both dates are ISO yyyy-MM-dd. Pass the same value to both for a single-day
 * pull (the typical daily cron case).
 */
export async function fetchEnheterRegisteredBetween(
  from: string,
  to: string,
  options: { signal?: AbortSignal } = {}
): Promise<BrregEnhet[]> {
  const enheter: BrregEnhet[] = [];
  let page = 0;

  // Paginate until we've consumed every page or hit a hard cap (defense-
  // in-depth — daily volume is ~300, but a misconfigured query could blow up).
  const HARD_CAP_PAGES = 50;

  while (page < HARD_CAP_PAGES) {
    const url = new URL(`${BRREG_BASE_URL}/enheter`);
    url.searchParams.set("fraRegistreringsdatoEnhetsregisteret", from);
    url.searchParams.set("tilRegistreringsdatoEnhetsregisteret", to);
    url.searchParams.set("size", String(PAGE_SIZE));
    url.searchParams.set("page", String(page));

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: options.signal,
      // Disable Next.js fetch caching — this is a one-shot request from a job.
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(
        `Brreg request failed: ${res.status} ${res.statusText} (page ${page})`
      );
    }

    const json = (await res.json()) as unknown;
    const parsed = ListResponseSchema.parse(json);
    const batch = parsed._embedded?.enheter ?? [];
    enheter.push(...batch);

    if (page >= parsed.page.totalPages - 1) break;
    page += 1;
  }

  return enheter;
}

/**
 * Fetch a single enheter by org.nr. Used by the manual "Add lead to
 * CRM" flow, where the operator types an org.nr that isn't yet in the
 * local DB. Returns null on 404 (org.nr not in Brreg).
 */
export async function fetchEnhetByOrgNr(
  orgNr: string
): Promise<BrregEnhet | null> {
  const url = `${BRREG_BASE_URL}/enheter/${encodeURIComponent(orgNr)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) {
    throw new Error(`Brreg HTTP ${res.status} for orgnr ${orgNr}`);
  }
  const json = await res.json();
  const parsed = EnhetSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Uventet Brreg-format for ${orgNr}`);
  }
  return parsed.data;
}

// ─── Mapping ─────────────────────────────────────────────────────────────────

function pickAddressLine(addr?: BrregEnhet["forretningsadresse"]): string | null {
  const lines = addr?.adresse;
  if (!lines || lines.length === 0) return null;
  return lines.filter(Boolean).join(", ");
}

/**
 * Map a Brreg enhet to the shape we insert into Postgres.
 * The full enhet payload is preserved in raw_data for forensics.
 */
export function mapEnhetToCompanyInsert(enhet: BrregEnhet): CompanyInsert {
  const forretning = enhet.forretningsadresse;

  return {
    org_nr: enhet.organisasjonsnummer,
    name: enhet.navn,
    org_form: enhet.organisasjonsform?.kode ?? null,
    org_form_description: enhet.organisasjonsform?.beskrivelse ?? null,
    nace_code: enhet.naeringskode1?.kode ?? null,
    nace_description: enhet.naeringskode1?.beskrivelse ?? null,
    address_line: pickAddressLine(forretning),
    postal_code: forretning?.postnummer ?? null,
    postal_place: forretning?.poststed ?? null,
    kommune: forretning?.kommune ?? null,
    kommune_nr: forretning?.kommunenummer ?? null,
    country_code: forretning?.landkode ?? "NO",
    phone: enhet.telefon ?? enhet.telefonnummer ?? null,
    mobile: enhet.mobil ?? enhet.mobiltelefon ?? null,
    // The actual Brreg key is `epostadresse`. Reading `epost` (which
    // doesn't exist) silently nulled every lead's email. Keep `epost`
    // as a fallback only.
    email: enhet.epostadresse ?? enhet.epost ?? null,
    website: enhet.hjemmeside ?? null,
    employee_count: enhet.antallAnsatte ?? null,
    vat_registered: enhet.registrertIMvaregisteret ?? false,
    bankrupt: enhet.konkurs ?? false,
    under_dissolution: enhet.underAvvikling ?? false,
    forced_dissolution:
      enhet.underTvangsavviklingEllerTvangsopplosning ?? false,
    founded_at: enhet.stiftelsesdato ?? null,
    registered_at: enhet.registreringsdatoEnhetsregisteret ?? null,
    raw_data: enhet as unknown as Record<string, unknown>,
  };
}
