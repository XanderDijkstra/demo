"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageSquare, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { HeroLayout, NicheConfig } from "@/lib/templates";

interface Props {
  niche: NicheConfig;
  previewUrl: string;
}

const HERO_LAYOUT_LABEL: Record<HeroLayout, string> = {
  split: "Split",
  centered: "Sentrert",
  overlay: "Overlay",
};

export function TemplateViewer({ niche, previewUrl }: Props) {
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);

  function copyChatPrompt() {
    const prompt = `Tweak the "${niche.slug}" template (${niche.displayName}). Here are the screenshots I want it to look like:`;
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      {/* Sidebar — read-only metadata */}
      <aside className="flex flex-col gap-5 overflow-y-auto border-r p-6 bg-card text-sm">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Mal
          </div>
          <div className="mt-1 flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-md"
              style={{
                background: `linear-gradient(135deg, ${niche.primaryColor}, ${niche.accentColor})`,
              }}
            />
            <div>
              <div className="font-semibold">{niche.displayName}</div>
              <div className="font-mono text-[11px] text-muted-foreground">
                {niche.slug}
              </div>
            </div>
          </div>
        </div>

        <Section title="Farger">
          <SwatchRow label="Primær" value={niche.primaryColor} />
          <SwatchRow label="Aksent" value={niche.accentColor} />
        </Section>

        <Section title="Hero">
          <KeyValue label="Layout" value={HERO_LAYOUT_LABEL[niche.heroLayout]} />
          <KeyValue label="Bilde-emne" value={niche.heroImageKeyword} />
          <KeyValue label="CTA" value={niche.ctaText} />
        </Section>

        <Section title="Fordeler">
          <ul className="space-y-1">
            {niche.benefitTags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                {tag}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Tjenester">
          <ul className="space-y-2">
            {niche.services.map((s, i) => (
              <li key={i} className="rounded-md border border-input bg-background p-2">
                <div className="text-xs font-medium">{s.title}</div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-3">
                  {s.description}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <div className="rounded-md border border-dashed bg-muted/40 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <MessageSquare className="h-3.5 w-3.5" />
            Endre denne malen
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Designarbeid skjer i Claude-chatten — del skjermbilder der, så
            oppdateres koden i{" "}
            <code className="font-mono">lib/templates.ts</code>. Endringer vises
            her etter neste deploy.
          </p>
          <button
            type="button"
            onClick={copyChatPrompt}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1 text-[11px] hover:bg-accent",
              copied && "text-emerald-600 border-emerald-300"
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Kopiert" : "Kopier chat-prompt"}
          </button>
        </div>
      </aside>

      {/* Preview — hero of the page */}
      <div className="relative flex flex-col bg-muted/30">
        <div className="flex items-center justify-between gap-2 border-b bg-card px-4 py-2 text-xs">
          <span className="text-muted-foreground">
            Forhåndsvisning · sample-data
          </span>
          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Åpne i ny fane
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="text-muted-foreground/50">·</span>
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Last på nytt
            </button>
          </div>
        </div>
        <iframe
          key={previewKey}
          src={previewUrl}
          title="Mal-forhåndsvisning"
          className="flex-1 w-full bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function SwatchRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-6 w-6 shrink-0 rounded border"
        style={{ background: value }}
        aria-hidden
      />
      <span className="text-xs text-muted-foreground">{label}</span>
      <code className="ml-auto truncate text-[10px]">{value}</code>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
