import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

/**
 * Tiered score chip:
 *   70+  → strong (teal, brand color)
 *   40-69 → moderate (amber)
 *   <40   → weak (muted)
 */
export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const tier =
    score >= 70 ? "strong" : score >= 40 ? "moderate" : "weak";

  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
        tier === "strong" && "bg-primary/15 text-primary",
        tier === "moderate" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
        tier === "weak" && "bg-muted text-muted-foreground",
        className
      )}
    >
      {score}
    </span>
  );
}
