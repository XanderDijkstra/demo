import { type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  trend?: {
    delta: number; // percent
    direction: "up" | "down" | "flat";
  };
  className?: string;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          {trend ? (
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                trend.direction === "up" && "text-emerald-600",
                trend.direction === "down" && "text-destructive",
                trend.direction === "flat" && "text-muted-foreground"
              )}
            >
              {trend.direction === "up" ? "+" : trend.direction === "down" ? "−" : ""}
              {Math.abs(trend.delta)}%
            </span>
          ) : null}
        </div>
        <div className="space-y-0.5">
          <div className="text-[11px] text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </div>
          {hint ? (
            <div className="text-[11px] text-muted-foreground">{hint}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
