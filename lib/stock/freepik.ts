/**
 * Freepik / Magnific stock-content adapter.
 *
 * Goal: replace the Picsum placeholders in the generated demo sites with
 * real, themed photos from the operator's Freepik stock library.
 *
 * The Stock Content API is `GET /v1/resources` (search) + `GET
 * /v1/resources/{id}/download` (licensed asset). The exact gateway host,
 * auth header, and response field names depend on the product/account and
 * aren't fully public, so everything is env-configurable and the response
 * parser is tolerant — it deep-walks whatever JSON comes back and pulls
 * out image URLs by key name / value shape.
 *
 *   FREEPIK_API_KEY      (required) the stock API key
 *   FREEPIK_BASE_URL     gateway origin (default https://api.freepik.com)
 *   FREEPIK_API_HEADER   auth header name (default x-freepik-api-key;
 *                        Magnific docs use x-magnific-api-key)
 *
 * Use the test search on /admin/settings to confirm the right combo and
 * see whether previews are watermarked before wiring this into
 * generation.
 */

import "server-only";

const FETCH_TIMEOUT_MS = 12_000;

export interface FreepikConfig {
  apiKey: string;
  baseUrl: string;
  headerName: string;
}

export function getFreepikConfig(): FreepikConfig | null {
  const apiKey = process.env.FREEPIK_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return {
    apiKey: apiKey.trim(),
    baseUrl: (process.env.FREEPIK_BASE_URL ?? "https://api.freepik.com").replace(
      /\/+$/,
      ""
    ),
    headerName: process.env.FREEPIK_API_HEADER ?? "x-freepik-api-key",
  };
}

export interface StockImage {
  id: string | null;
  previewUrl: string;
  title: string | null;
}

export type StockSearchResult =
  | {
      ok: true;
      status: number;
      images: StockImage[];
      topLevelKeys: string[];
      raw: unknown;
    }
  | { ok: false; status: number | null; error: string; raw?: unknown };

const IMG_EXT_RE = /\.(jpe?g|png|webp|avif)(\?|#|$)/i;
const URL_KEY_RE = /^(url|source|src|preview|thumbnail|thumb|image)$/i;

function isHttp(v: unknown): v is string {
  return typeof v === "string" && /^https?:\/\//i.test(v);
}

/**
 * Find the best image URL inside an arbitrary node. Prefers values under
 * url/source/preview/thumbnail keys; falls back to any http string that
 * looks like an image file.
 */
function findImageUrl(node: unknown): string | null {
  let keyed: string | null = null;
  let extMatch: string | null = null;

  function walk(n: unknown, key: string): void {
    if (n == null) return;
    if (typeof n === "string") {
      if (!isHttp(n)) return;
      if (!keyed && URL_KEY_RE.test(key)) keyed = n;
      else if (!extMatch && IMG_EXT_RE.test(n)) extMatch = n;
      return;
    }
    if (Array.isArray(n)) {
      for (const v of n) walk(v, key);
      return;
    }
    if (typeof n === "object") {
      for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
        walk(v, k);
      }
    }
  }

  walk(node, "");
  return keyed ?? extMatch;
}

function strField(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

export interface StockSearchOptions {
  limit?: number;
  /** Best-effort filter; ignored by the API if the param name differs. */
  orientation?: "landscape" | "portrait" | "square";
}

export async function searchStock(
  query: string,
  opts: StockSearchOptions = {}
): Promise<StockSearchResult> {
  const cfg = getFreepikConfig();
  if (!cfg) {
    return {
      ok: false,
      status: null,
      error: "Freepik ikke konfigurert — sett FREEPIK_API_KEY",
    };
  }

  const params = new URLSearchParams();
  params.set("term", query);
  params.set("limit", String(Math.max(1, Math.min(50, opts.limit ?? 12))));
  // Bias toward photos. Param shape varies; harmless if ignored.
  params.set("filters[content_type][photo]", "1");
  if (opts.orientation) {
    params.set(`filters[orientation][${opts.orientation}]`, "1");
  }

  const url = `${cfg.baseUrl}/v1/resources?${params.toString()}`;
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

    const text = await res.text();
    let raw: unknown = null;
    try {
      raw = text ? JSON.parse(text) : null;
    } catch {
      raw = text;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `Freepik HTTP ${res.status}`,
        raw,
      };
    }

    const topLevelKeys =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? Object.keys(raw as Record<string, unknown>)
        : [];

    // The list usually lives under `data` (array). Fall back to the root
    // if it's already an array.
    const list: unknown[] = Array.isArray(raw)
      ? (raw as unknown[])
      : raw && typeof raw === "object" && Array.isArray((raw as Record<string, unknown>).data)
        ? ((raw as Record<string, unknown>).data as unknown[])
        : [];

    const images: StockImage[] = [];
    for (const item of list) {
      const previewUrl = findImageUrl(item);
      if (!previewUrl) continue;
      const obj =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      images.push({
        id: strField(obj, "id", "uuid", "slug"),
        title: strField(obj, "title", "name", "description"),
        previewUrl,
      });
    }

    return { ok: true, status: res.status, images, topLevelKeys, raw };
  } catch (err) {
    return {
      ok: false,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve the licensed/download URL for a resource id. Returns the first
 * http URL found in the response. Note: these are often temporary signed
 * URLs — re-host the bytes if you need a stable link on a public page.
 */
export async function downloadStock(
  id: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const cfg = getFreepikConfig();
  if (!cfg) return { ok: false, error: "Freepik ikke konfigurert" };

  const url = `${cfg.baseUrl}/v1/resources/${encodeURIComponent(id)}/download`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { [cfg.headerName]: cfg.apiKey, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let raw: unknown = null;
    try {
      raw = text ? JSON.parse(text) : null;
    } catch {
      raw = text;
    }
    if (!res.ok) return { ok: false, error: `Freepik HTTP ${res.status}` };
    const found = findImageUrl(raw);
    if (!found) return { ok: false, error: "Fant ingen nedlastings-URL i svaret" };
    return { ok: true, url: found };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}
