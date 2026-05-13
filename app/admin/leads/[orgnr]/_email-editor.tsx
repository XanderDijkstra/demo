"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail, Pencil, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { scrapeLeadEmail, updateLeadEmail } from "./_actions";
import type { ScrapeEmailActionResult } from "./_actions";

interface Props {
  orgNr: string;
  initialEmail: string | null;
  /** When true, surfaces the "Finn e-post" scrape button. */
  hasWebsite: boolean;
}

type ScrapeSuccess = Extract<ScrapeEmailActionResult, { ok: true }>;

export function EmailEditor({ orgNr, initialEmail, hasWebsite }: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [editing, setEditing] = useState(initialEmail == null);
  const [savePending, startSave] = useTransition();
  const [scrapePending, startScrape] = useTransition();
  const [scrapeResult, setScrapeResult] = useState<ScrapeSuccess | null>(null);

  function save() {
    const next = email.trim() || null;
    startSave(async () => {
      const result = await updateLeadEmail(orgNr, next);
      if (result.ok) {
        toast.success(next ? "E-post oppdatert" : "E-post fjernet");
        setEditing(false);
        setScrapeResult(null);
      } else {
        toast.error(result.error);
      }
    });
  }

  function cancel() {
    setEmail(initialEmail ?? "");
    setEditing(initialEmail == null);
    setScrapeResult(null);
  }

  function scrape() {
    setScrapeResult(null);
    startScrape(async () => {
      const result = await scrapeLeadEmail(orgNr);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.saved) {
        toast.success(`Fant e-post: ${result.best.email}`);
        setEmail(result.best.email);
        setEditing(false);
        return;
      }
      // Need operator pick — surface the candidate list.
      toast.message(
        `Fant ${result.candidates.length} kandidat${result.candidates.length === 1 ? "" : "er"} — velg én`
      );
      setScrapeResult(result);
      setEditing(true);
    });
  }

  function pickCandidate(value: string) {
    setEmail(value);
    setScrapeResult(null);
    // Persist immediately so the operator doesn't have to also click Save.
    startSave(async () => {
      const result = await updateLeadEmail(orgNr, value);
      if (result.ok) {
        toast.success(`Lagret ${value}`);
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!editing && initialEmail) {
    return (
      <div className="flex items-start gap-2">
        <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">E-post</div>
          <div className="flex items-center gap-2 group">
            <a
              href={`mailto:${initialEmail}`}
              className="break-words hover:underline text-sm"
            >
              {initialEmail}
            </a>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              aria-label="Rediger e-post"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const busy = savePending || scrapePending;

  return (
    <div className="flex items-start gap-2">
      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="text-xs text-muted-foreground">E-post</div>
        <div className={cn("flex items-center gap-1.5", busy && "opacity-70")}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="navn@selskap.no"
            className="h-8 text-sm"
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            autoFocus={initialEmail == null}
          />
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            aria-label="Lagre"
          >
            {savePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
          {initialEmail ? (
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Avbryt"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {hasWebsite ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={scrape}
            disabled={busy}
            className="h-7 px-2.5 text-[11px]"
          >
            {scrapePending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Finn e-post fra nettsiden
          </Button>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Brreg har ingen e-post-data — legg til manuelt etter research.
          </p>
        )}

        {scrapeResult ? (
          <div className="mt-1.5 space-y-1 rounded-md border bg-muted/30 p-2 text-[11px]">
            <div className="font-medium text-muted-foreground">
              Velg én av {scrapeResult.candidates.length} treff:
            </div>
            <ul className="space-y-0.5">
              {scrapeResult.candidates.slice(0, 6).map((c) => (
                <li key={c.email}>
                  <button
                    type="button"
                    onClick={() => pickCandidate(c.email)}
                    disabled={busy}
                    className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left hover:bg-accent disabled:cursor-not-allowed"
                  >
                    <span className="truncate font-mono">{c.email}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {c.source === "mailto"
                        ? "mailto"
                        : c.source === "deobfuscated"
                          ? "(at)"
                          : "tekst"}
                      {c.fromPath !== "/" ? ` · ${c.fromPath}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
