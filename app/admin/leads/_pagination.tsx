"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function LeadsPagination({ page, pageSize, total }: PaginationProps) {
  const params = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function hrefFor(targetPage: number) {
    const next = new URLSearchParams(params.toString());
    if (targetPage <= 1) next.delete("page");
    else next.set("page", String(targetPage));
    const qs = next.toString();
    return `/admin/leads${qs ? `?${qs}` : ""}`;
  }

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-muted-foreground">
        Viser{" "}
        <span className="text-foreground font-medium tabular-nums">
          {from}-{to}
        </span>{" "}
        av{" "}
        <span className="text-foreground font-medium tabular-nums">
          {total}
        </span>
      </p>

      <div className="flex items-center gap-1">
        <Link
          href={hrefFor(page - 1) as never}
          aria-disabled={prevDisabled}
          tabIndex={prevDisabled ? -1 : 0}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs",
            prevDisabled
              ? "pointer-events-none opacity-40"
              : "hover:bg-accent"
          )}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Forrige
        </Link>

        <span className="px-2 text-xs text-muted-foreground tabular-nums">
          {page} / {totalPages}
        </span>

        <Link
          href={hrefFor(page + 1) as never}
          aria-disabled={nextDisabled}
          tabIndex={nextDisabled ? -1 : 0}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs",
            nextDisabled
              ? "pointer-events-none opacity-40"
              : "hover:bg-accent"
          )}
        >
          Neste
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
