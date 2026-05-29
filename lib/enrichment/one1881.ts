/**
 * 1881 (Opplysningen 1881 / api1881.no) contact-data enrichment.
 *
 * The point of this over the website scraper: 1881 has contact details
 * for companies that have NO website — which is exactly the segment the
 * email scraper can't help, and where almost all our high-score leads
 * sit (Brreg rarely carries an email).
 *
 * The api1881.no "Søkeoppslag" product is an Azure API Management
 * gateway. The exact gateway URL, the company-lookup path, and the
 * response field names depend on the subscribed product/plan and live
 * behind the developer login. Rather than hardcode a guess, everything
 * is env-configurable:
 *
 *   ONE1881_API_KEY            (required) subscription key
 *   ONE1881_BASE_URL           gateway origin (default api1881.no APIM)
 *   ONE1881_LOOKUP_PATH        path template with {orgnr} placeholder
 *   ONE1881_SUBSCRIPTION_HEADER auth header name (APIM default)
 *
 * The response parser is deliberately tolerant — it deep-walks whatever
 * JSON comes back and pulls out the first email / phone / mobile /
 * contact-name it can find by key name or value shape. After the first
 * real test lookup we can tighten it to the actual field names.
 */

import "server-only";

const FETCH_TIMEOUT_MS = 10_000;

export interface One1881Config {
  apiKey: string;
  baseUrl: string;
  lookupPath: string;
  headerName: string;
}

/**
 * Read the env config. Returns null when the API key is missing so
 * callers can surface a friendly "not configured yet" message instead
 * of throwing.
 */
export function getOne1881Config(): One1881Config | null {
  const apiKey = process.env.ONE1881_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return {
    apiKey: apiKey.trim(),
    baseUrl: (process.env.ONE1881_BASE_URL ?? "https://api.api1881.no").replace(
      /\/+$/,
      ""
    ),
    // {orgnr} is substituted at call time. Override once the real path
    // is known from the portal docs.
    lookupPath:
      process.env.ONE1881_LOOKUP_PATH ?? "/lookup/v1/companies/{orgnr}",
    headerName:
      process.env.ONE1881_SUBSCRIPTION_HEADER ?? "Ocp-Apim-Subscription-Key",
  };
}

export interface One1881Contact {
  email: string | null;
  phone: string | null;
  mobile: string | null;
  contactName: string | null;
}

export type One1881LookupResult =
  | {
      ok: true;
      contact: One1881Contact;
      status: number;
      /** Top-level keys of the response — handy for the test UI. */
      topLevelKeys: string[];
      /** Human-readable note of which fields each value came from. */
      foundIn: string[];
      raw: unknown;
    }
  | { ok: false; error: string; status: number | null; raw?: unknown };

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

function normalizePhone(raw: string): string {
  // Keep leading +, strip spaces/dashes/parens.
  return raw.replace(/[^\d+]/g, "");
}

function looksLikePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  // Norwegian numbers are 8 digits; allow country-code prefixed too.
  return digits.length >= 8 && digits.length <= 13;
}

type Visitor = (key: string, value: unknown) => void;

function walk(node: unknown, visit: Visitor, key = ""): void {
  if (node == null) return;
  if (Array.isArray(node)) {
    for (const v of node) walk(v, visit, key);
    return;
  }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      visit(k, v);
      walk(v, visit, k);
    }
    return;
  }
  // primitive at array position — visit under the parent key
  if (key) visit(key, node);
}

/**
 * Deep-scan a 1881 response for usable contact fields. Email is matched
 * by value shape (most reliable); phone/mobile/name by key name. First
 * confident hit per field wins.
 */
export function extractContact(raw: unknown): {
  contact: One1881Contact;
  foundIn: string[];
} {
  let email: string | null = null;
  let phone: string | null = null;
  let mobile: string | null = null;
  let contactName: string | null = null;
  const foundIn: string[] = [];

  walk(raw, (key, value) => {
    if (typeof value !== "string" || !value.trim()) return;
    const k = key.toLowerCase();
    const v = value.trim();

    if (!email && EMAIL_RE.test(v)) {
      const m = v.match(EMAIL_RE);
      if (m) {
        email = m[0].toLowerCase();
        foundIn.push(`email ← "${key}"`);
      }
    }

    if (looksLikePhone(v)) {
      if (!mobile && /mobil|cell/.test(k)) {
        mobile = normalizePhone(v);
        foundIn.push(`mobile ← "${key}"`);
      } else if (
        !phone &&
        /(tlf|telefon|phone|number|nummer|contactnumber)/.test(k)
      ) {
        phone = normalizePhone(v);
        foundIn.push(`phone ← "${key}"`);
      }
    }

    if (
      !contactName &&
      /(kontaktperson|contactperson|contact_name|contactname|daglig.?leder)/.test(
        k
      )
    ) {
      contactName = v;
      foundIn.push(`contactName ← "${key}"`);
    }
  });

  return { contact: { email, phone, mobile, contactName }, foundIn };
}

/**
 * Look up a single company by org.nr. Never throws — returns a typed
 * result so batch callers can keep going on failure.
 */
export async function lookupByOrgNr(
  orgNr: string,
  config?: One1881Config
): Promise<One1881LookupResult> {
  const cfg = config ?? getOne1881Config();
  if (!cfg) {
    return {
      ok: false,
      error: "1881 ikke konfigurert — sett ONE1881_API_KEY",
      status: null,
    };
  }

  const path = cfg.lookupPath.replace("{orgnr}", encodeURIComponent(orgNr));
  const url = `${cfg.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        [cfg.headerName]: cfg.apiKey,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    let raw: unknown = null;
    const text = await res.text();
    try {
      raw = text ? JSON.parse(text) : null;
    } catch {
      raw = text;
    }

    if (!res.ok) {
      return {
        ok: false,
        error: `1881 HTTP ${res.status}`,
        status: res.status,
        raw,
      };
    }

    const { contact, foundIn } = extractContact(raw);
    const topLevelKeys =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? Object.keys(raw as Record<string, unknown>)
        : Array.isArray(raw)
          ? [`array[${(raw as unknown[]).length}]`]
          : [];

    return {
      ok: true,
      contact,
      status: res.status,
      topLevelKeys,
      foundIn,
      raw,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      status: null,
    };
  } finally {
    clearTimeout(timer);
  }
}
