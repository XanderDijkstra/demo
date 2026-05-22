"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import {
  ExternalLink,
  EyeOff,
  Globe,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ALL_NICHES,
  getNicheConfig,
  type NicheSlug,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

import {
  generateLeadSiteAction,
  unpublishLeadSiteAction,
} from "./_actions";

interface Props {
  orgNr: string;
  detectedNiche: NicheSlug;
  publishedSite: {
    nicheSlug: NicheSlug;
    nicheOverridden: boolean;
    generatedAt: string;
    model: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
  } | null;
  publicUrl: string;
}

export function SiteCard({
  orgNr,
  detectedNiche,
  publishedSite,
  publicUrl,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [unpublishPending, startUnpublishTransition] = useTransition();

  const [selectedNiche, setSelectedNiche] = useState<NicheSlug>(
    publishedSite?.nicheSlug ?? detectedNiche
  );

  const isPublished = !!publishedSite;
  const nicheConfig = getNicheConfig(selectedNiche);
  const isOverride = selectedNiche !== detectedNiche;

  function handleGenerate() {
    startTransition(async () => {
      const override = isOverride ? selectedNiche : null;
      const result = await generateLeadSiteAction(orgNr, override);
      if (result.ok) {
        toast.success(
          isPublished ? "Demo siten er oppdatert" : "Demo siten er publisert"
        );
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    });
  }

  function handleUnpublish() {
    startUnpublishTransition(async () => {
      const result = await unpublishLeadSiteAction(orgNr);
      if (result.ok) {
        toast.success("Demo siten er avpublisert");
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    });
  }

  const totalTokens =
    (publishedSite?.inputTokens ?? 0) + (publishedSite?.outputTokens ?? 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white"
          style={{ background: nicheConfig.primaryColor }}
        >
          <Globe className="h-4 w-4" />
        </div>
        <div className="space-y-0.5 flex-1 min-w-48">
          <div className="flex items-center gap-2">
            {isPublished ? (
              <Badge variant="success">publisert</Badge>
            ) : (
              <Badge variant="outline">ikke generert</Badge>
            )}
            {publishedSite?.nicheOverridden ? (
              <Badge variant="outline" className="text-[10px]">
                manual mal
              </Badge>
            ) : null}
          </div>
          {publishedSite ? (
            <p className="text-xs text-muted-foreground">
              Generert{" "}
              {formatDistanceToNow(new Date(publishedSite.generatedAt), {
                addSuffix: true,
                locale: nb,
              })}
              {publishedSite.model ? ` · ${publishedSite.model}` : null}
              {totalTokens > 0 ? ` · ${totalTokens} tokens` : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No demo site published yet
            </p>
          )}
        </div>
        {isPublished ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-xs hover:bg-accent"
          >
            View site
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="site-niche" className="text-xs">
            Template
          </Label>
          <select
            id="site-niche"
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value as NicheSlug)}
            disabled={pending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ALL_NICHES.map((n) => (
              <option key={n.slug} value={n.slug}>
                {n.displayName}
                {n.slug === detectedNiche ? " (auto)" : ""}
              </option>
            ))}
          </select>
          {isOverride ? (
            <p className="text-[11px] text-amber-700">
              Manuell mal — overstyrer NACE-deteksjon (
              {getNicheConfig(detectedNiche).displayName}).
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "flex flex-wrap gap-2",
            (pending || unpublishPending) && "opacity-70"
          )}
        >
          <Button onClick={handleGenerate} disabled={pending || unpublishPending}>
            {pending ? (
              <Loader2 className="animate-spin" />
            ) : isPublished ? (
              <RefreshCw />
            ) : (
              <Sparkles />
            )}
            {isPublished ? "Regenerate" : "Generate & publish"}
          </Button>
          {isPublished ? (
            <Button
              variant="outline"
              onClick={handleUnpublish}
              disabled={pending || unpublishPending}
            >
              {unpublishPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <EyeOff />
              )}
              Unpublish
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
