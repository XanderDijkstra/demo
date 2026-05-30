import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { getSetting } from "@/lib/supabase/queries";
import type { NicheConfig } from "@/lib/templates";

const DEFAULT_MODEL = "claude-haiku-4-5";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  cached = new Anthropic({ apiKey });
  return cached;
}

async function getActiveModel(): Promise<string> {
  const value = await getSetting<string>("claude_model");
  return value ?? DEFAULT_MODEL;
}

export interface AiSiteContent {
  hero_headline: string;
  hero_subheadline: string;
  about_paragraph: string;
}

interface SiteCopyArgs {
  company: {
    name: string;
    kommune: string | null;
    nace_description: string | null;
  };
  niche: NicheConfig;
}

export type GenerateSiteCopyResult =
  | {
      ok: true;
      content: AiSiteContent;
      model: string;
      usage: { input: number; output: number };
    }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `Du er en norsk copywriter for premium håndverkere og småbedrifter. Du skriver med personlighet, ikke som en mal.

Svar KUN med gyldig JSON i denne nøyaktige formen — ingen kodeblokker, ingen forklaring:

{
  "hero_headline": "<3–7 ord, konkret og selvsikker. Ikke generisk.>",
  "hero_subheadline": "<én setning, 14–22 ord, gir en grunn til å bli nysgjerrig>",
  "about_paragraph": "<2–4 setninger, 50–80 ord, snakker som mennesket bak selskapet>"
}

═══ HEADLINEN ═══

Tenk slogan, ikke beskrivelse. Den skal:
- vekke en følelse (stolthet, trygghet, presisjon, omsorg)
- ELLER love noe konkret (resultat, fordel, kvalitet)
- ELLER si noe overraskende (en kontrast, en innsikt)

GODE eksempler (ulike næringer, ulik tone):
- "Tegninger som tåler norske vintre"
- "Hver fuge en signatur"
- "Større prosjekter, samme presisjon"
- "Snekkerverk laget for å bli"
- "Ditt nye bad, ferdig om seks uker"
- "Vi bygger, du flytter inn"

DÅRLIGE eksempler — IKKE skriv slik:
- "Snekkerarbeid som holder" (intetsigende, klisjé)
- "Din lokale rørlegger" (kjedelig, sier ingenting)
- "Kvalitet du kan stole på" (tomt løfte)
- "Vi leverer det du trenger" (selger ingenting)
- "Ekspertise innen [bransje]" (corporate-prat)

═══ SUBHEADLINE ═══

Gi én konkret grunn til å lese videre. Spesifikt for dette selskapet eller distriktet. Ikke gjenta headlinen med andre ord. Nevn kommunen naturlig hvis oppgitt.

═══ OM-OSS ═══

Skriv som selskapet selv forteller, ikke som markedsfører. Konkret detalj > generisk påstand. Hvis du vet kommunen, plant det her hvis ikke i subheadline.

═══ HARDE REGLER ═══

- Aldri "X leverer Y i Z"-strukturen.
- Aldri ord som: førstevalg, kvalitet, ekspertise, totalleverandør, profesjonell, dedikert, dynamisk, skreddersydd, helhetlig, omfattende.
- Aldri lov priser, tidsfrister eller garantier som ikke er gitt.
- Bruk selskapsnavnet maks én gang per felt — det er ikke nødvendig at det er i headlinen.
- Tone: varm, selvsikker, jordnær. Norsk bokmål.`;

function buildUserPrompt(args: SiteCopyArgs): string {
  const { company, niche } = args;
  return [
    `Company: ${company.name}`,
    `Bransje: ${niche.displayName}`,
    company.kommune ? `Kommune: ${company.kommune}` : "Kommune: ukjent",
    company.nace_description
      ? `Brreg-beskrivelse: ${company.nace_description}`
      : null,
    "",
    "Generer hero-overskrift, hero-underoverskrift og en kort om-oss-paragraf.",
    "Svar med JSON-objektet, noneting annet.",
  ]
    .filter(Boolean)
    .join("\n");
}

function tryParse(raw: string): AiSiteContent | null {
  // Trim possible code fence even though we asked Claude not to use one.
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<AiSiteContent>;
    if (
      typeof parsed.hero_headline === "string" &&
      typeof parsed.hero_subheadline === "string" &&
      typeof parsed.about_paragraph === "string"
    ) {
      return {
        hero_headline: parsed.hero_headline.trim(),
        hero_subheadline: parsed.hero_subheadline.trim(),
        about_paragraph: parsed.about_paragraph.trim(),
      };
    }
  } catch {
    // fall through
  }
  return null;
}

export async function generateSiteCopy(
  args: SiteCopyArgs
): Promise<GenerateSiteCopyResult> {
  const model = await getActiveModel();

  try {
    const client = getClient();
    const response = await client.messages.create({
      model,
      max_tokens: 600,
      // Higher than the old 0.7 — the prompt now forbids the bland safe
      // patterns Claude defaults to at low temperatures, so we want more
      // creative variance per lead.
      temperature: 0.9,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(args) }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { ok: false, error: "Tomt svar fra Claude" };
    }

    const content = tryParse(textBlock.text);
    if (!content) {
      return {
        ok: false,
        error: "Klarte ikke å tolke svaret som JSON",
      };
    }

    return {
      ok: true,
      content,
      model,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
