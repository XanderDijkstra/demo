"use client";

import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { testFreepikSearch } from "./_actions";

interface StockResult {
  images: Array<{ id: string | null; previewUrl: string; title: string | null }>;
  topLevelKeys: string[];
  status: number;
}

export function StockForm({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("luxury kitchen interior");
  const [result, setResult] = useState<StockResult | null>(null);

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const r = await testFreepikSearch(formData);
      if (r.ok) {
        setResult({
          images: r.images,
          topLevelKeys: r.topLevelKeys,
          status: r.status,
        });
        toast.success(`Fant ${r.images.length} bilder (HTTP ${r.status})`);
      } else {
        setResult(null);
        toast.error(r.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {!configured ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <code className="font-mono">FREEPIK_API_KEY</code> er ikke satt. Legg
          inn API-nøkkelen fra Freepik/Magnific i Vercel-miljøvariablene.
          (Valgfritt: <code className="font-mono">FREEPIK_BASE_URL</code>,{" "}
          <code className="font-mono">FREEPIK_API_HEADER</code> — Magnific bruker{" "}
          <code className="font-mono">x-magnific-api-key</code>.)
        </div>
      ) : null}

      <form action={onSubmit} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-56 space-y-1.5">
          <Label htmlFor="stock-query" className="text-xs">
            Test søk
          </Label>
          <Input
            id="stock-query"
            name="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="f.eks. luxury kitchen interior"
            disabled={pending || !configured}
          />
        </div>
        <Button type="submit" variant="outline" disabled={pending || !configured}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          Søk
        </Button>
      </form>

      {result ? (
        result.images.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {result.images.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id ?? i}
                src={img.previewUrl}
                alt={img.title ?? ""}
                title={img.title ?? undefined}
                className="aspect-[4/3] w-full rounded-md border object-cover"
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-amber-700 dark:text-amber-400">
            Svaret hadde ingen gjenkjente bilde-URLer. Topp-nøkler:{" "}
            <span className="font-mono">
              {result.topLevelKeys.join(", ") || "(ingen)"}
            </span>
            . Del responsen så justerer jeg parseren.
          </div>
        )
      ) : null}
    </div>
  );
}
