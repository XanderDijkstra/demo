import type { GeneratedSiteContent } from "@/lib/supabase/types";
import type { NicheConfig } from "@/lib/templates";

import { EzraPage } from "./ezra/page";

/**
 * Anleggsgartner template — Framer-exported "Ezra" design (translated
 * to Norwegian) from the Hagenouw Greenwork landscape architect site.
 *
 * Replaces the previous Tailwind landscaper layout. Props are accepted
 * to keep the call sites stable, but the Framer export bakes its
 * content in (hero copy, services, stats, FAQ, etc.) — none of the
 * lead-derived fields flow through yet. Wiring Property Controls in
 * Framer + a re-export is the next step to make this data-driven.
 */
interface Props {
  company: {
    org_nr: string;
    name: string;
    kommune: string | null;
    address_line: string | null;
    postal_code: string | null;
    postal_place: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
  };
  niche: NicheConfig;
  content: GeneratedSiteContent;
}

export function LandscaperTemplate(_: Props) {
  return <EzraPage />;
}
