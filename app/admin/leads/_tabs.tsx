"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import type { LeadsTab } from "@/lib/leads";

interface TabsProps {
  active: LeadsTab;
  counts: { week: number; all: number };
}

export function LeadsTabs({ active, counts }: TabsProps) {
  const params = useSearchParams();

  function hrefForTab(tab: LeadsTab) {
    const next = new URLSearchParams(params.toString());
    if (tab === "all") next.set("tab", "all");
    else next.delete("tab");
    next.delete("page");
    const qs = next.toString();
    return `/admin/leads${qs ? `?${qs}` : ""}`;
  }

  const items: Array<{ key: LeadsTab; label: string; count: number }> = [
    { key: "week", label: "Denne uken", count: counts.week },
    { key: "all", label: "Alle", count: counts.all },
  ];

  return (
    <div className="flex border-b">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={hrefForTab(item.key) as never}
            className={cn(
              "relative -mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm transition-colors",
              isActive
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{item.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {item.count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
