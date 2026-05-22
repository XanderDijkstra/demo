/**
 * Best-effort email enrichment from a company's published website.
 *
 * Strategy:
 *   1. Fetch the homepage HTML (≤ 2 MB, 10 s timeout, follow redirects).
 *   2. Pull every email candidate from the page — mailto: links first, then
 *      raw text patterns, plus simple "info (at) domain.no" deobfuscations.
 *   3. If nothing useful on the root, follow one likely contact-page link
 *      (/kontakt, /kontakt-oss, /om-oss, /om, /contact) and repeat.
 *   4. Rank candidates:
 *        - on the same domain as the website   (+strong)
 *        - common business prefixes            (+small)
 *        - from a mailto: vs raw text          (+small)
 *      Drop role addresses for unrelated providers (webmaster@webdesigner.no
 *      etc.) and image-asset / tracking junk.
 *
 * No external API, no auth — just `fetch` against the lead's own site.
 */

import "server-only";

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 2 * 1024 * 1024;
const USER_AGENT =
  "Mozilla/5.0 (compatible; VekstSystemetBot/1.0; +https://demo.vekst-systemet.no)";

const PREFERRED_PREFIXES = [
  "post",
  "kontakt",
  "hei",
  "hallo",
  "info",
  "hello",
  "contact",
  "salg",
  "sales",
  "booking",
  "support",
];

// Subpath candidates to try if the root has no useful email.
const CONTACT_PATH_HINTS = [
  "/kontakt",
  "/kontakt-oss",
  "/kontaktoss",
  "/contact",
  "/contact-us",
  "/om-oss",
  "/om",
  "/about",
];

const EMAIL_REGEX = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Capture obfuscations like "info (at) example (dot) no" or
// "info [at] example [dot] no" — common on Norwegian small-business sites.
const OBFUSCATED_REGEX =
  /([a-z0-9._%+-]+)\s*[\[(]?\s*(?:at|@|snabel-?a)\s*[\])]?\s*([a-z0-9.-]+)\s*[\[(]?\s*(?:dot|punktum|\.)\s*[\])]?\s*([a-z]{2,})/gi;

export interface EmailCandidate {
  email: string;
  source: "mailto" | "text" | "deobfuscated";
  fromPath: string;
  /** Higher = better. */
  score: number;
}

export type ScrapeWebsiteEmailResult =
  | {
      ok: true;
      candidates: EmailCandidate[];
      best: EmailCandidate;
      fetchedUrls: string[];
    }
  | { ok: false; error: string; fetchedUrls: string[] };

export function normalizeWebsite(raw: string | null): URL | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProto);
  } catch {
    return null;
  }
}

function getRegistrableDomain(host: string): string {
  // Cheap "registrable domain" approximation: last two labels.
  // Good enough for Norwegian .no sites; misses .co.uk but we don't target UK.
  const parts = host.toLowerCase().split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  return parts.slice(-2).join(".");
}

async function fetchHtml(
  url: string
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "nb,no;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const ctype = res.headers.get("content-type") ?? "";
    if (ctype && !/text\/html|application\/xhtml/i.test(ctype)) {
      return { ok: false, error: `Uventet content-type: ${ctype}` };
    }
    // Read up to MAX_BYTES then cut off.
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      return { ok: true, html: text.slice(0, MAX_BYTES) };
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
      if (total >= MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const buf = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      buf.set(c, offset);
      offset += c.byteLength;
    }
    return { ok: true, html: new TextDecoder().decode(buf) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

function extractFromHtml(
  html: string,
  fromPath: string
): EmailCandidate[] {
  const seen = new Map<string, EmailCandidate>();

  function add(c: EmailCandidate) {
    const key = c.email.toLowerCase();
    const prev = seen.get(key);
    if (!prev || c.score > prev.score) seen.set(key, { ...c, email: key });
  }

  // 1. mailto links
  const mailtoRegex = /<a[^>]+href\s*=\s*["']mailto:([^"'?#]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRegex.exec(html)) !== null) {
    const raw = m[1]?.trim();
    if (raw && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(raw)) {
      add({ email: raw, source: "mailto", fromPath, score: 0 });
    }
  }

  // 2. plain-text patterns
  EMAIL_REGEX.lastIndex = 0;
  while ((m = EMAIL_REGEX.exec(html)) !== null) {
    const raw = m[0];
    // Skip obvious junk that often appears in <img>, asset URLs, etc.
    if (/\.(png|jpe?g|gif|svg|webp|ico|css|js|woff2?)$/i.test(raw)) continue;
    add({ email: raw, source: "text", fromPath, score: 0 });
  }

  // 3. deobfuscation
  OBFUSCATED_REGEX.lastIndex = 0;
  while ((m = OBFUSCATED_REGEX.exec(html)) !== null) {
    const [, local, domain, tld] = m;
    if (!local || !domain || !tld) continue;
    add({
      email: `${local}@${domain}.${tld}`,
      source: "deobfuscated",
      fromPath,
      score: 0,
    });
  }

  return Array.from(seen.values());
}

function scoreCandidate(
  c: EmailCandidate,
  registrableDomain: string
): number {
  let score = 0;
  const [localRaw, hostRaw] = c.email.split("@");
  if (!localRaw || !hostRaw) return -100;
  const local = localRaw.toLowerCase();
  const host = hostRaw.toLowerCase();

  // Same-domain bonus is the dominant signal.
  if (getRegistrableDomain(host) === registrableDomain) score += 100;
  else score -= 40;

  // Source confidence.
  if (c.source === "mailto") score += 8;
  else if (c.source === "deobfuscated") score += 4;

  // Prefer canonical inbox aliases.
  const prefixIdx = PREFERRED_PREFIXES.indexOf(local);
  if (prefixIdx >= 0) score += 20 - prefixIdx;

  // Penalise emails that look like noreply / webmaster / tracking.
  if (/^(noreply|no-reply|donotreply|webmaster|abuse|admin|postmaster|hostmaster)$/.test(local))
    score -= 80;

  // Penalise obvious tracking-pixel-style hashes (32+ hex chars).
  if (/^[a-f0-9]{32,}$/.test(local)) score -= 80;

  return score;
}

function pickContactSubpath(html: string, base: URL): string | null {
  // Look at all anchor hrefs, pick the first that matches a contact hint.
  const hrefRegex = /<a[^>]+href\s*=\s*["']([^"'#]+)["']/gi;
  let m: RegExpExecArray | null;
  const candidates: string[] = [];
  while ((m = hrefRegex.exec(html)) !== null) {
    const href = m[1];
    if (!href) continue;
    let u: URL;
    try {
      u = new URL(href, base);
    } catch {
      continue;
    }
    if (u.host !== base.host) continue;
    const path = u.pathname.toLowerCase().replace(/\/+$/, "");
    if (path && CONTACT_PATH_HINTS.includes(path)) {
      candidates.push(u.toString());
    }
  }
  return candidates[0] ?? null;
}

/**
 * Scrape `website` for emails. Returns ranked candidates or a failure reason.
 * Performs at most two HTTP requests: root, plus one likely contact subpage.
 */
export async function scrapeWebsiteEmail(
  website: string | null
): Promise<ScrapeWebsiteEmailResult> {
  const fetchedUrls: string[] = [];
  const rootUrl = normalizeWebsite(website);
  if (!rootUrl) {
    return { ok: false, error: "No valid website", fetchedUrls };
  }
  const registrableDomain = getRegistrableDomain(rootUrl.host);

  const rootRes = await fetchHtml(rootUrl.toString());
  fetchedUrls.push(rootUrl.toString());
  if (!rootRes.ok) {
    return {
      ok: false,
      error: `Kunne ikke laste ${rootUrl.host}: ${rootRes.error}`,
      fetchedUrls,
    };
  }

  let candidates = extractFromHtml(rootRes.html, "/");

  const hasSameDomainHit = candidates.some(
    (c) => getRegistrableDomain(c.email.split("@")[1] ?? "") === registrableDomain
  );

  if (!hasSameDomainHit) {
    const contactUrl = pickContactSubpath(rootRes.html, rootUrl);
    if (contactUrl) {
      const subRes = await fetchHtml(contactUrl);
      fetchedUrls.push(contactUrl);
      if (subRes.ok) {
        const subPath = new URL(contactUrl).pathname || "/";
        const subCandidates = extractFromHtml(subRes.html, subPath);
        candidates = [...candidates, ...subCandidates];
      }
    }
  }

  const scored = candidates
    .map((c) => ({ ...c, score: scoreCandidate(c, registrableDomain) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      ok: false,
      error: "Found no email on the website",
      fetchedUrls,
    };
  }

  const best = scored[0];
  if (!best) {
    return {
      ok: false,
      error: "Found no email on the website",
      fetchedUrls,
    };
  }
  return { ok: true, candidates: scored, best, fetchedUrls };
}
