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

const SYSTEM_PROMPT = `Du er en norsk copywriter som skriver kort, varm og presis nettsidekopi for små norske selskaper.

Du svarer KUN med gyldig JSON i denne nøyaktige formen, uten kodeblokk-markering, uten noe forklaring rundt:

{
  "hero_headline": "<5–9 ord, fanger oppmerksomhet, naturlig norsk>",
  "hero_subheadline": "<én setning, 12–20 ord, spesifikk for selskapet og kommunen>",
  "about_paragraph": "<2–4 setninger, 50–80 ord, skrives som om selskapet selv forteller>"
}

Regler:
- Bruk selskapsnavnet naturlig — ikke press det inn i hver setning.
- Hvis kommune er oppgitt, nevn den minst én gang i subheadline eller about.
- Aldri bruk klisjeer som "ditt førstevalg", "vi går den ekstra milen".
- Aldri lov noe konkret om priser, timer, garantier hvis det ikke er gitt.
- Tone: varm, troverdig, kortfattet. Norsk bokmål.`;

function buildUserPrompt(args: SiteCopyArgs): string {
  const { company, niche } = args;
  return [
    `Selskap: ${company.name}`,
    `Bransje: ${niche.displayName}`,
    company.kommune ? `Kommune: ${company.kommune}` : "Kommune: ukjent",
    company.nace_description
      ? `Brreg-beskrivelse: ${company.nace_description}`
      : null,
    "",
    "Generer hero-overskrift, hero-underoverskrift og en kort om-oss-paragraf.",
    "Svar med JSON-objektet, ingenting annet.",
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
