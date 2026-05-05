"use client";

import { useRef, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TemplateReference, VisionSummary } from "@/lib/supabase/types";

import {
  deleteReferenceAction,
  extractCombinedDnaAction,
  extractDnaAction,
  uploadReferenceAction,
} from "./_actions";

export interface ExtractedDnaPatch {
  primary_color?: string;
  accent_color?: string;
  hero_layout?: "split" | "centered" | "overlay";
  cta_text?: string;
}

interface Props {
  slug: string;
  references: TemplateReference[];
  onApply: (patch: ExtractedDnaPatch) => void;
  designBrief: string;
  initialCombinedDna: {
    summary: VisionSummary | null;
    extractedAt: string | null;
    model: string | null;
  };
}

export function ReferencesPanel({
  slug,
  references,
  onApply,
  designBrief,
  initialCombinedDna,
}: Props) {
  const [pendingUpload, startUploadTransition] = useTransition();
  const [pendingDelete, startDeleteTransition] = useTransition();
  const [pendingCombined, startCombinedTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openRef, setOpenRef] = useState<TemplateReference | null>(null);
  const [combinedDna, setCombinedDna] = useState<{
    summary: VisionSummary | null;
    extractedAt: string | null;
    model: string | null;
  }>(initialCombinedDna);

  function handleExtractCombined() {
    startCombinedTransition(async () => {
      const result = await extractCombinedDnaAction(slug);
      if (result.ok && result.summary) {
        setCombinedDna({
          summary: result.summary,
          extractedAt: new Date().toISOString(),
          model: result.model ?? null,
        });
        toast.success(
          `Samlet DNA hentet fra ${result.referenceCount ?? 0} referanser`
        );
      } else if (!result.ok) {
        toast.error(`Henting feilet: ${result.error}`);
      }
    });
  }

  function applyCombined() {
    if (!combinedDna.summary) return;
    const patch: ExtractedDnaPatch = {};
    const s = combinedDna.summary;
    if (s.primary_color) patch.primary_color = s.primary_color;
    if (s.accent_color) patch.accent_color = s.accent_color;
    if (s.hero_layout) patch.hero_layout = s.hero_layout;
    if (s.cta_text) patch.cta_text = s.cta_text;
    onApply(patch);
    toast.success("Verdier kopiert til skjemaet");
  }

  const canExtractCombined =
    references.length > 0 || (designBrief?.trim().length ?? 0) > 0;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    const fd = new FormData();
    fd.set("file", file);
    startUploadTransition(async () => {
      const result = await uploadReferenceAction(slug, fd);
      if (result.ok) {
        toast.success("Referanse lastet opp");
      } else {
        toast.error(`Opplasting feilet: ${result.error}`);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function handleDelete(ref: TemplateReference) {
    if (!window.confirm("Slett denne referansen?")) return;
    startDeleteTransition(async () => {
      const result = await deleteReferenceAction(slug, ref.id);
      if (result.ok) {
        toast.success("Slettet");
        if (openRef?.id === ref.id) setOpenRef(null);
      } else {
        toast.error(`Sletting feilet: ${result.error}`);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Designreferanser
        </div>
        <span className="text-[11px] text-muted-foreground">
          {references.length} stk
        </span>
      </div>

      <label
        htmlFor={`file-${slug}`}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-input bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition-colors hover:bg-muted/40 cursor-pointer",
          pendingUpload && "opacity-70 cursor-wait"
        )}
      >
        {pendingUpload ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
        <span className="text-xs">
          {pendingUpload ? "Laster opp…" : "Klikk eller dra et bilde hit"}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          PNG / JPEG / WebP, maks 10 MB
        </span>
        <input
          id={`file-${slug}`}
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          className="hidden"
          disabled={pendingUpload}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {references.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {references.map((ref) => (
            <button
              key={ref.id}
              type="button"
              onClick={() => setOpenRef(ref)}
              className="group relative aspect-square overflow-hidden rounded-md border border-input bg-muted/30 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ref.public_url}
                alt={ref.label ?? "Designreferanse"}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              {ref.vision_summary ? (
                <div className="absolute bottom-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                  <Sparkles className="h-2.5 w-2.5" />
                </div>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-md border bg-muted/20 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-medium">Samlet design-DNA</div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Analyserer alle referansene + design-notatet i én Claude-call.
              {references.length > 0 ? (
                <>
                  {" "}
                  Bruker opptil 8 nyligste bilder ({references.length} lastet
                  opp).
                </>
              ) : null}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canExtractCombined || pendingCombined}
            onClick={handleExtractCombined}
            title={
              canExtractCombined
                ? "Hent samlet DNA"
                : "Last opp en referanse eller skriv en design-brief først"
            }
          >
            {pendingCombined ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            {combinedDna.summary ? "Hent på nytt" : "Hent fra alle"}
          </Button>
        </div>

        {combinedDna.summary ? (
          <div className="space-y-3">
            <SummaryView summary={combinedDna.summary} />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {combinedDna.extractedAt ? (
                  <>
                    Hentet{" "}
                    {formatDistanceToNow(new Date(combinedDna.extractedAt), {
                      addSuffix: true,
                      locale: nb,
                    })}
                  </>
                ) : null}
                {combinedDna.model ? ` · ${combinedDna.model}` : null}
              </span>
              <button
                type="button"
                onClick={applyCombined}
                className="font-medium text-primary hover:underline"
              >
                Bruk i skjemaet
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <ReferenceLightbox
        ref={openRef}
        slug={slug}
        onClose={() => setOpenRef(null)}
        onDelete={handleDelete}
        onApply={onApply}
        deletePending={pendingDelete}
      />
    </div>
  );
}

// ─── Lightbox ───────────────────────────────────────────────────────────────

interface LightboxProps {
  ref: TemplateReference | null;
  slug: string;
  onClose: () => void;
  onDelete: (ref: TemplateReference) => void;
  onApply: (patch: ExtractedDnaPatch) => void;
  deletePending: boolean;
}

function ReferenceLightbox({
  ref,
  slug,
  onClose,
  onDelete,
  onApply,
  deletePending,
}: LightboxProps) {
  const [extractPending, startExtractTransition] = useTransition();
  const [latest, setLatest] = useState<VisionSummary | null>(null);

  // Prefer the freshly extracted summary, fall back to the persisted one.
  const summary: VisionSummary | null =
    latest ?? (ref?.vision_summary as VisionSummary | null) ?? null;

  function handleExtract() {
    if (!ref) return;
    startExtractTransition(async () => {
      const result = await extractDnaAction(slug, ref.id);
      if (result.ok && result.summary) {
        setLatest(result.summary);
        toast.success("Design-DNA hentet");
      } else if (!result.ok) {
        toast.error(`Henting feilet: ${result.error}`);
      }
    });
  }

  function applySummary() {
    if (!summary) return;
    const patch: ExtractedDnaPatch = {};
    if (summary.primary_color) patch.primary_color = summary.primary_color;
    if (summary.accent_color) patch.accent_color = summary.accent_color;
    if (summary.hero_layout) patch.hero_layout = summary.hero_layout;
    if (summary.cta_text) patch.cta_text = summary.cta_text;
    onApply(patch);
    toast.success("Verdier kopiert til skjemaet");
  }

  return (
    <Dialog open={!!ref} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent className="max-w-3xl">
        {ref ? (
          <>
            <DialogHeader>
              <DialogTitle>Designreferanse</DialogTitle>
              <DialogDescription>
                Lastet opp{" "}
                {formatDistanceToNow(new Date(ref.uploaded_at), {
                  addSuffix: true,
                  locale: nb,
                })}
                {ref.vision_extracted_at ? (
                  <>
                    {" · "}DNA hentet{" "}
                    {formatDistanceToNow(new Date(ref.vision_extracted_at), {
                      addSuffix: true,
                      locale: nb,
                    })}
                  </>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-[1fr_280px]">
              <div className="overflow-hidden rounded-md border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ref.public_url}
                  alt={ref.label ?? "Designreferanse"}
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-3 text-sm">
                {summary ? (
                  <SummaryView summary={summary} />
                ) : (
                  <p className="text-muted-foreground">
                    Ingen DNA hentet enda. Klikk under for å la Claude
                    foreslå farger, hero-layout og CTA basert på dette
                    designet.
                  </p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleExtract}
                  disabled={extractPending}
                >
                  {extractPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Sparkles />
                  )}
                  {summary ? "Hent på nytt" : "Hent design-DNA"}
                </Button>

                {summary ? (
                  <Button
                    type="button"
                    className="w-full"
                    onClick={applySummary}
                  >
                    Bruk i skjemaet
                  </Button>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onDelete(ref)}
                disabled={deletePending}
                className="text-destructive hover:text-destructive"
              >
                {deletePending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
                Slett
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                <X />
                Lukk
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SummaryView({ summary }: { summary: VisionSummary }) {
  return (
    <div className="space-y-2">
      {summary.primary_color ? (
        <ColorRow label="Primær" value={summary.primary_color} />
      ) : null}
      {summary.accent_color ? (
        <ColorRow label="Aksent" value={summary.accent_color} />
      ) : null}
      {summary.hero_layout ? (
        <KeyValue label="Hero" value={summary.hero_layout} />
      ) : null}
      {summary.cta_text ? (
        <KeyValue label="CTA" value={summary.cta_text} />
      ) : null}
      {summary.tone ? (
        <KeyValue label="Tone" value={summary.tone} />
      ) : null}
      {summary.notes ? (
        <p className="rounded-md border bg-muted/30 p-2 text-xs italic text-muted-foreground">
          {summary.notes}
        </p>
      ) : null}
    </div>
  );
}

function ColorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-6 w-6 shrink-0 rounded border"
        style={{ background: value }}
        aria-hidden
      />
      <div className="text-xs text-muted-foreground">{label}</div>
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
