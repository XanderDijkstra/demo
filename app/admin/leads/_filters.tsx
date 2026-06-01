"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuser" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "qualified", label: "Qualified" },
  { value: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { value: "score", label: "Score (highest)" },
  { value: "registered", label: "Neweste" },
  { value: "name", label: "Name (A–Å)" },
];

const MIN_SCORE_OPTIONS = [
  { value: "", label: "All scores" },
  { value: "30", label: "≥ 30" },
  { value: "50", label: "≥ 50" },
  { value: "70", label: "≥ 70" },
  { value: "90", label: "≥ 90" },
];

const PRESENCE_OPTIONS = [
  { value: "", label: "Uansett" },
  { value: "yes", label: "Has" },
  { value: "no", label: "Mangler" },
];

export function LeadsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    }
    // Any filter change resets pagination.
    if (!("page" in patch)) next.delete("page");
    startTransition(() => {
      router.replace(`/admin/leads?${next.toString()}`);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = String(fd.get("q") ?? "").trim();
    update({ q: q || undefined });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-3",
        pending && "opacity-70 transition-opacity"
      )}
    >
      <form onSubmit={onSubmit} className="space-y-1.5 flex-1 min-w-56">
        <Label htmlFor="leads-search" className="text-xs">
          Search
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="leads-search"
            name="q"
            defaultValue={params.get("q") ?? ""}
            placeholder="Companysnavn eller org.nr"
            className="pl-8"
          />
        </div>
      </form>

      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <select
          value={params.get("status") ?? ""}
          onChange={(e) => update({ status: e.target.value || undefined })}
          className="flex h-9 w-44 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Min. score</Label>
        <select
          value={params.get("minScore") ?? ""}
          onChange={(e) => update({ minScore: e.target.value || undefined })}
          className="flex h-9 w-36 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {MIN_SCORE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">E-post</Label>
        <select
          value={params.get("hasEmail") ?? ""}
          onChange={(e) => update({ hasEmail: e.target.value || undefined })}
          className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PRESENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Telefon</Label>
        <select
          value={params.get("hasPhone") ?? ""}
          onChange={(e) => update({ hasPhone: e.target.value || undefined })}
          className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PRESENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="leads-date-from" className="text-xs">
          Registrert fra
        </Label>
        <Input
          id="leads-date-from"
          type="date"
          value={params.get("dateFrom") ?? ""}
          onChange={(e) => update({ dateFrom: e.target.value || undefined })}
          className="w-40 tabular-nums"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="leads-date-to" className="text-xs">
          Registrert til
        </Label>
        <Input
          id="leads-date-to"
          type="date"
          value={params.get("dateTo") ?? ""}
          onChange={(e) => update({ dateTo: e.target.value || undefined })}
          className="w-40 tabular-nums"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Sortering</Label>
        <select
          value={params.get("sort") ?? "score"}
          onChange={(e) => update({ sort: e.target.value })}
          className="flex h-9 w-44 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
