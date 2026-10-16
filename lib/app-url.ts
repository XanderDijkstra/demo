/**
 * Public base URL of this app, for links that leave it (demo sites,
 * unsubscribe links, Telegram deep links). Read at runtime from APP_URL
 * (a Worker var) — deliberately not NEXT_PUBLIC_*, which Next inlines at
 * build time.
 */
export function appUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (configured) return /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://demo.vekst-systemet.no";
}
