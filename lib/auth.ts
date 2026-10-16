/**
 * Operator auth via Cloudflare Access (email one-time code).
 *
 * Access sits in front of /admin, /preview and /api/inbox
 * and signs every request it lets through with a JWT in the
 * `Cf-Access-Jwt-Assertion` header. We verify that JWT ourselves too
 * (middleware + every server action + protected API route), so the app
 * stays locked even if the Access app were misconfigured. Fails closed.
 *
 * Env: ACCESS_TEAM_DOMAIN (fx-media.cloudflareaccess.com), ACCESS_AUD (the
 * Access application's audience tag), ADMIN_EMAILS (comma-separated).
 * Local dev only: ADMIN_DEV_EMAIL skips the check when NODE_ENV=development.
 *
 * Edge-safe: Web Crypto only, no Node APIs.
 */

type Jwk = JsonWebKey & { kid?: string };

let certs: { keys: Jwk[]; fetched: number } | null = null;

function b64urlToBytes(s: string): Uint8Array<ArrayBuffer> {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

function b64urlJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s))) as Record<string, unknown>;
}

async function signingKey(teamDomain: string, kid: string): Promise<CryptoKey> {
  if (!certs || Date.now() - certs.fetched > 3_600_000 || !certs.keys.some((k) => k.kid === kid)) {
    const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
    if (!res.ok) throw new Error(`Access certs ${res.status}`);
    certs = { keys: ((await res.json()) as { keys: Jwk[] }).keys, fetched: Date.now() };
  }
  const jwk = certs.keys.find((k) => k.kid === kid);
  if (!jwk) throw new Error("unknown Access signing key");
  return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
}

/** The verified operator email for this request, or null. */
export async function operatorEmail(headers: Headers): Promise<string | null> {
  if (process.env.NODE_ENV === "development" && process.env.ADMIN_DEV_EMAIL) {
    return process.env.ADMIN_DEV_EMAIL;
  }

  const teamDomain = process.env.ACCESS_TEAM_DOMAIN;
  const audience = process.env.ACCESS_AUD;
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!teamDomain || !audience || !allowed.length) return null;

  const token = headers.get("cf-access-jwt-assertion");
  if (!token) return null;

  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const header = b64urlJson(h);
    const payload = b64urlJson(p);
    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      await signingKey(teamDomain, header.kid),
      b64urlToBytes(s),
      new TextEncoder().encode(`${h}.${p}`)
    );
    if (!valid) return null;

    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(audience)) return null;
    if (payload.iss !== `https://${teamDomain}`) return null;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;

    const email = String(payload.email ?? "").toLowerCase();
    return allowed.includes(email) ? email : null;
  } catch (err) {
    console.error("access jwt", String(err));
    return null;
  }
}

/**
 * Throw unless the current request comes from the operator. Call at the
 * top of every server action and protected route handler: server actions
 * can be invoked by POSTing their id to any page URL, so the /admin path
 * gate alone doesn't cover them.
 */
export async function requireOperator(): Promise<string> {
  const { headers } = await import("next/headers");
  const email = await operatorEmail(await headers());
  if (!email) throw new Error("Unauthorized");
  return email;
}
