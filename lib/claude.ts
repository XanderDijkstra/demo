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
  /** 50-word concrete diagnosis of the lead's online gap. */
  diagnosis: string;
  /** Subject line for a per-lead cold pitch (≤8 words). */
  cold_message_subject: string;
  /** 70-word personalized cold message body. Uses {{site_url}} placeholder. */
  cold_message_body: string;
}

interface SiteCopyArgs {
  company: {
    name: string;
    kommune: string | null;
    nace_description: string | null;
    has_website: boolean;
    has_phone: boolean;
    founded_year: number | null;
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

const SYSTEM_PROMPT = `Du er en norsk copywriter og salgsstrateg for små norske selskaper.

Du svarer KUN med gyldig JSON i denne nøyaktige formen, uten kodeblokk-markering, uten forklaring rundt:

{
  "hero_headline": "<5–9 ord, fanger oppmerksomhet, naturlig norsk>",
  "hero_subheadline": "<én setning, 12–20 ord, spesifikt for selskapet og kommunen>",
  "about_paragraph": "<2–4 setninger, 50–80 ord, skrives som om selskapet selv forteller>",
  "diagnosis": "<MAKS 50 ord. Konkret diagnose av selskapets digitale fotavtrykk: hva mangler, hvor lekker omsetningen, hva en ny side ville endret. Ingen buzzwords. Skriv som intern analyse, ikke til kunden.>",
  "cold_message_subject": "<MAKS 8 ord. Spesifikk for dette selskapet. Eks: 'Lagde en demo til [navn]', 'Demo-side til [navn]'. Ingen klisjeer som 'rask spørsmål' eller 'forbedre nettsiden'.>",
  "cold_message_body": "<MAKS 70 ord. Personlig, åpner med én konkret observasjon om DETTE selskapet (kommune, alder, bransje, kontakt-kanal som mangler), refererer faktisk tjeneste, slutter med myk forespørsel om de vil se demoen. Inkluder lenken som teksten {{site_url}} (vil bli erstattet automatisk). Skriv som en ekte person som har slått opp selskapet — ikke markedsføringstone.>"
}

Regler:
- Bruk selskapsnavnet naturlig — ikke press det inn i hver setning.
- Hvis kommune er oppgitt, nevn den i subheadline ELLER cold_message_body.
- ALDRI nevn AI, Claude, Lovable, eller andre verktøy.
- ALDRI bruk klisjeer: "ditt førstevalg", "vi går den ekstra milen", "I hope this email finds you well", "let me know your thoughts", "synergi", "leverage", "i dagens raske marked".
- ALDRI lov pris, garantier, timer eller responsetider hvis det ikke er gitt i input.
- Cold message skal aldri starte med "Hei, jeg håper du har det bra" eller liknende.
- Diagnosis skal være konkret. Eks: "Org.nr og navnet vises i Brreg, men ingen nettside finnes — potensielle kunder som søker [tjeneste] [kommune] på Google finner deg ikke. Du tjener i dag på munn-til-munn, men misser alle som leter aktivt."
- Tone: varm, troverdig, kortfattet. Norsk bokmål.`;

function buildUserPrompt(args: SiteCopyArgs): string {
  const { company, niche } = args;
  const presence: string[] = [];
  presence.push(
    company.has_website
      ? "har en nettside oppført"
      : "har INGEN nettside oppført i Brreg"
  );
  presence.push(
    company.has_phone
      ? "har telefon i Brreg"
      : "har ikke telefon i Brreg"
  );
  if (company.founded_year != null) {
    const age = new Date().getFullYear() - company.founded_year;
    presence.push(
      age <= 1
        ? `nystiftet (${company.founded_year})`
        : `etablert ${company.founded_year} (${age} år)`
    );
  }

  return [
    `Selskap: ${company.name}`,
    `Bransje: ${niche.displayName}`,
    company.kommune ? `Kommune: ${company.kommune}` : "Kommune: ukjent",
    company.nace_description
      ? `Brreg-beskrivelse: ${company.nace_description}`
      : null,
    `Tilstand: ${presence.join("; ")}`,
    "",
    "Generer alle 6 felter i ett JSON-objekt. Svar med kun objektet, ingenting annet.",
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
      typeof parsed.about_paragraph === "string" &&
      typeof parsed.diagnosis === "string" &&
      typeof parsed.cold_message_subject === "string" &&
      typeof parsed.cold_message_body === "string"
    ) {
      return {
        hero_headline: parsed.hero_headline.trim(),
        hero_subheadline: parsed.hero_subheadline.trim(),
        about_paragraph: parsed.about_paragraph.trim(),
        diagnosis: parsed.diagnosis.trim(),
        cold_message_subject: parsed.cold_message_subject.trim(),
        cold_message_body: parsed.cold_message_body.trim(),
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
      max_tokens: 1200,
      temperature: 0.7,
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
