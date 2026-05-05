import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { getSetting } from "@/lib/supabase/queries";
import type { HeroLayout, VisionSummary } from "@/lib/supabase/types";

const DEFAULT_MODEL = "claude-haiku-4-5";

let cached: Anthropic | null = null;

function getClient(): Anthropic {
  if (cached) return cached;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  cached = new Anthropic({ apiKey: key });
  return cached;
}

async function getActiveModel(): Promise<string> {
  const value = await getSetting<string>("claude_model");
  return value ?? DEFAULT_MODEL;
}

const SYSTEM_PROMPT = `Du analyserer skjermbilder av nettsidedesign og foreslår design-tokens for en mal.
Du kan motta ett eller flere bilder samtidig — vurder dem som ett designsystem og returner ett samlet sett tokens.

Hvis brukeren legger ved en design-brief skal du la teksten overstyre signaler i bildene
(f.eks. "vår merkefarge er #FF6B35" → bruk den som primary_color uansett hva bildet sier).

Du svarer KUN med gyldig JSON i denne formen, uten kodeblokk-markering:

{
  "primary_color": "<oklch(...) eller hex — den dominerende handlingsfargen>",
  "accent_color": "<oklch(...) eller hex — sekundær / bakgrunn-tone>",
  "hero_layout": "split" | "centered" | "overlay",
  "cta_text": "<kort norsk CTA, 2–4 ord, passer designet>",
  "tone": "<kort beskrivelse på norsk: f.eks. 'minimal og lys', 'kraftig og industriell', 'varm og personlig'>",
  "notes": "<én setning: hva som er karakteristisk ved designet (eller på tvers av bildene)>"
}

Regler:
- hero_layout-veiledning:
    "split"    = tekst og bilde side om side
    "centered" = sentrert tekst, bilde under eller bak
    "overlay"  = full-bredde bilde med tekst oppå
- Bruk OKLCH når du kan (bedre fargejustering), ellers hex.
- CTA skal være på norsk og naturlig for designet.
- Ikke gjett firmanavn eller kopi — bare design-signaler.`;

export type ExtractDesignDnaResult =
  | {
      ok: true;
      summary: VisionSummary;
      model: string;
      usage: { input: number; output: number };
    }
  | { ok: false; error: string };

function isHeroLayout(value: unknown): value is HeroLayout {
  return value === "split" || value === "centered" || value === "overlay";
}

function tryParse(raw: string): VisionSummary | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const summary: VisionSummary = {};

    if (typeof parsed.primary_color === "string") {
      summary.primary_color = parsed.primary_color.trim();
    }
    if (typeof parsed.accent_color === "string") {
      summary.accent_color = parsed.accent_color.trim();
    }
    if (isHeroLayout(parsed.hero_layout)) {
      summary.hero_layout = parsed.hero_layout;
    }
    if (typeof parsed.cta_text === "string") {
      summary.cta_text = parsed.cta_text.trim();
    }
    if (typeof parsed.tone === "string") {
      summary.tone = parsed.tone.trim();
    }
    if (typeof parsed.notes === "string") {
      summary.notes = parsed.notes.trim();
    }

    if (Object.keys(summary).length === 0) return null;
    return summary;
  } catch {
    return null;
  }
}

export interface ExtractDesignDnaInput {
  /** One or more public image URLs. Vision sees them all in a single call. */
  imageUrls: string[];
  /** Operator-written brief in any language; forwarded as text alongside the images. */
  designBrief?: string | null;
}

/**
 * Send the uploaded reference image(s) to Claude vision and parse the
 * design-DNA JSON. Anthropic's API supports remote image URLs directly,
 * and multiple image blocks per message.
 *
 * The optional design brief is appended as a text block — Claude treats
 * it as authoritative when it contradicts a visual signal.
 */
export async function extractDesignDna(
  input: ExtractDesignDnaInput
): Promise<ExtractDesignDnaResult> {
  if (!input.imageUrls.length) {
    return { ok: false, error: "Mangler bilder" };
  }

  const model = await getActiveModel();
  try {
    const client = getClient();

    const content: Anthropic.MessageParam["content"] = input.imageUrls.map(
      (url) =>
        ({
          type: "image",
          source: { type: "url", url },
        }) as const
    );

    const brief = (input.designBrief ?? "").trim();
    const textPrompt =
      brief.length > 0
        ? `Design-brief fra operatøren (autoritativ):\n${brief}\n\nAnalyser ${
            input.imageUrls.length === 1
              ? "designet"
              : `de ${input.imageUrls.length} designene som ett system`
          } og returner JSON-objektet.`
        : `Analyser ${
            input.imageUrls.length === 1
              ? "designet"
              : `de ${input.imageUrls.length} designene som ett system`
          } og returner JSON-objektet.`;

    content.push({ type: "text", text: textPrompt });

    const response = await client.messages.create({
      model,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      return { ok: false, error: "Tomt svar fra Claude" };
    }
    const summary = tryParse(block.text);
    if (!summary) {
      return { ok: false, error: "Klarte ikke å tolke svaret som JSON" };
    }
    return {
      ok: true,
      summary,
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
