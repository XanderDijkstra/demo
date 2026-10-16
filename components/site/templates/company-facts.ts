/**
 * Helpers for the few facts the demo templates may state about a company.
 *
 * The demo sites go to real, newly registered companies, so every factual
 * statement must come from Brreg data. Years in business are derived from
 * `founded_at` only, and return null when the company is younger than a
 * full year (most leads are registered yesterday) so templates can simply
 * omit the line instead of printing "0 års erfaring".
 */

export function foundedYear(foundedAt: string | null | undefined): number | null {
  if (!foundedAt) return null;
  const year = Number(foundedAt.slice(0, 4));
  return Number.isFinite(year) && year > 1800 ? year : null;
}

export function yearsSinceFounded(
  foundedAt: string | null | undefined
): number | null {
  const year = foundedYear(foundedAt);
  if (year === null) return null;
  const yrs = new Date().getFullYear() - year;
  return yrs >= 1 ? yrs : null;
}
