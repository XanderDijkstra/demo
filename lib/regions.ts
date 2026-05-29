import "server-only";

/**
 * Map a Norwegian kommunenummer to its fylke (county) name.
 *
 * The first two digits of a kommunenummer are the fylkesnummer. We key on
 * that prefix. Numbering follows the post-2024 county structure (Trøndelag
 * = 50xx, which is what the {{region}} placeholder keys off for the
 * "vi hjelper bedrifter i Trøndelag" angle).
 */
const FYLKE_BY_PREFIX: Record<string, string> = {
  "03": "Oslo",
  "11": "Rogaland",
  "15": "Møre og Romsdal",
  "18": "Nordland",
  "31": "Østfold",
  "32": "Akershus",
  "33": "Buskerud",
  "34": "Innlandet",
  "39": "Vestfold",
  "40": "Telemark",
  "42": "Agder",
  "46": "Vestland",
  "50": "Trøndelag",
  "55": "Troms",
  "56": "Finnmark",
};

export function fylkeFromKommuneNr(
  kommuneNr: string | null | undefined
): string | null {
  if (!kommuneNr) return null;
  const digits = kommuneNr.trim().replace(/\D/g, "");
  if (digits.length < 4) return null;
  return FYLKE_BY_PREFIX[digits.slice(0, 2)] ?? null;
}
