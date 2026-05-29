import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Norwegian org-form suffixes + common acronyms that should stay
// uppercase rather than being title-cased.
const UPPERCASE_TOKENS = new Set([
  "AS",
  "ASA",
  "ANS",
  "DA",
  "BA",
  "SA",
  "BL",
  "KS",
  "NUF",
  "SE",
  "IKS",
  "KF",
  "FKF",
  "AL",
  "II",
  "III",
  "AB", // Swedish AB shows up on cross-border entities
]);

/**
 * Brreg stores company names in ALL CAPS ("NAMDAL BYGG AS"). Convert to
 * natural title case for display + email bodies ("Namdal Bygg AS") while
 * keeping org-form suffixes and common acronyms uppercase.
 *
 * - Only reformats names that are essentially all-caps; a name that's
 *   already mixed-case (operator-edited, or an intentionally styled name)
 *   is left untouched.
 * - Handles hyphens and slashes ("BYGG-OG ANLEGG" → "Bygg-Og Anlegg").
 * - Leaves the canonical stored value alone — this is presentation only.
 */
export function formatCompanyName(raw: string | null | undefined): string {
  if (!raw) return "";
  const name = raw.trim();
  if (!name) return "";

  // If it already contains lowercase letters, assume it's intentionally
  // cased and leave it be.
  if (/[a-zæøå]/.test(name)) return name;

  return name
    .toLocaleLowerCase("nb-NO")
    .split(/(\s+)/) // keep the whitespace runs as separators
    .map((part) => {
      if (/^\s+$/.test(part) || part === "") return part;
      // Split on hyphen/slash/ampersand so each sub-token gets cased too.
      return part
        .split(/([-/&])/)
        .map((sub) => {
          if (sub === "-" || sub === "/" || sub === "&" || sub === "") return sub;
          const upper = sub.toLocaleUpperCase("nb-NO");
          if (UPPERCASE_TOKENS.has(upper)) return upper;
          return (
            sub.charAt(0).toLocaleUpperCase("nb-NO") + sub.slice(1)
          );
        })
        .join("");
    })
    .join("");
}
