"use client";

import { useState, useTransition } from "react";
import { Loader2, RefreshCw, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { NicheConfig } from "@/lib/templates";

import { resetTemplateAction, saveTemplateAction } from "./_actions";

interface Props {
  slug: string;
  initial: NicheConfig;
  isCustomised: boolean;
  previewUrl: string;
}

export function TemplateEditor({
  slug,
  initial,
  isCustomised,
  previewUrl,
}: Props) {
  const [pending, startSaveTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();
  // Cache-buster for the preview iframe — we bump it after each save so
  // the iframe re-fetches and shows the freshly-saved values.
  const [previewKey, setPreviewKey] = useState(0);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [heroKeyword, setHeroKeyword] = useState(initial.heroImageKeyword);
  const [ctaText, setCtaText] = useState(initial.ctaText);
  const [services, setServices] = useState(initial.services.map((s) => ({ ...s })));
  const [benefits, setBenefits] = useState<string[]>([...initial.benefitTags]);

  function onSave(formData: FormData) {
    startSaveTransition(async () => {
      const result = await saveTemplateAction(slug, formData);
      if (result.ok) {
        toast.success("Mal lagret");
        setPreviewKey((k) => k + 1);
      } else {
        toast.error(`Kunne ikke lagre: ${result.error}`);
      }
    });
  }

  function onReset() {
    if (
      !window.confirm(
        "Tilbakestill malen til standardverdiene fra koden? Dine endringer går tapt."
      )
    ) {
      return;
    }
    startResetTransition(async () => {
      const result = await resetTemplateAction(slug);
      if (result.ok) {
        toast.success("Mal tilbakestilt");
      } else {
        toast.error(`Kunne ikke tilbakestille: ${result.error}`);
      }
    });
  }

  const updateService = (idx: number, patch: Partial<{ title: string; description: string }>) =>
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const updateBenefit = (idx: number, value: string) =>
    setBenefits((prev) => prev.map((b, i) => (i === idx ? value : b)));

  return (
    <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      {/* Form column */}
      <form
        action={onSave}
        className={cn(
          "flex flex-col gap-5 overflow-y-auto border-r p-6 bg-card",
          pending && "opacity-70"
        )}
      >
        <Section title="Identitet">
          <Field label="Navn">
            <Input
              name="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={pending}
            />
          </Field>
          <Field
            label="Primærfarge"
            hint="oklch(...) eller hex / annen CSS-farge."
          >
            <ColorRow>
              <ColorSwatch value={primaryColor} />
              <Input
                name="primary_color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                required
                disabled={pending}
                className="font-mono text-xs"
              />
            </ColorRow>
          </Field>
          <Field label="Aksentfarge" hint="Brukes til hero-bakgrunn og myk seksjon.">
            <ColorRow>
              <ColorSwatch value={accentColor} />
              <Input
                name="accent_color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                required
                disabled={pending}
                className="font-mono text-xs"
              />
            </ColorRow>
          </Field>
        </Section>

        <Section title="Hero">
          <Field label="Bilde-emne (Unsplash)" hint="F.eks. plumber, restaurant.">
            <Input
              name="hero_image_keyword"
              value={heroKeyword}
              onChange={(e) => setHeroKeyword(e.target.value)}
              required
              disabled={pending}
            />
          </Field>
          <Field label="CTA-knapp">
            <Input
              name="cta_text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              required
              disabled={pending}
            />
          </Field>
          <Field label="Fordeler-chips" hint="Tre korte stikkord under hero.">
            <div className="space-y-2">
              {benefits.map((b, i) => (
                <Input
                  key={i}
                  name={`benefit_${i}`}
                  value={b}
                  onChange={(e) => updateBenefit(i, e.target.value)}
                  required
                  disabled={pending}
                />
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Tjenester">
          {services.map((svc, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <div className="text-[11px] font-medium text-muted-foreground">
                Tjeneste {i + 1}
              </div>
              <Input
                name={`service_${i}_title`}
                value={svc.title}
                onChange={(e) => updateService(i, { title: e.target.value })}
                placeholder="Tittel"
                required
                disabled={pending}
              />
              <textarea
                name={`service_${i}_description`}
                value={svc.description}
                onChange={(e) =>
                  updateService(i, { description: e.target.value })
                }
                rows={3}
                placeholder="Beskrivelse"
                required
                disabled={pending}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
            </div>
          ))}
        </Section>

        <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-between gap-2 border-t bg-card px-6 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending || resetPending || !isCustomised}
            onClick={onReset}
            title={
              isCustomised
                ? "Tilbakestill til kode-defaults"
                : "Allerede på defaults"
            }
          >
            {resetPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            Tilbakestill
          </Button>
          <Button type="submit" disabled={pending || resetPending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            Lagre mal
          </Button>
        </div>
      </form>

      {/* Preview column */}
      <div className="relative flex flex-col bg-muted/30">
        <div className="flex items-center justify-between gap-2 border-b bg-card px-4 py-2 text-xs">
          <span className="text-muted-foreground">
            Forhåndsvisning · sample-data
          </span>
          <button
            type="button"
            onClick={() => setPreviewKey((k) => k + 1)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
            Last på nytt
          </button>
        </div>
        <iframe
          key={previewKey}
          src={previewUrl}
          title="Mal-forhåndsvisning"
          className="flex-1 w-full bg-white"
          // Sandbox the iframe but allow forms to render (the demo's contact form).
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
    <div className="space-y-3">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ColorRow({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

function ColorSwatch({ value }: { value: string }) {
  return (
    <div
      className="h-9 w-9 shrink-0 rounded-md border"
      style={{ background: value }}
      aria-hidden
    />
  );
}
