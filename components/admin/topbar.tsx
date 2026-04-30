import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-6">
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <h1 className="text-base font-semibold leading-tight truncate">
            {title}
          </h1>
          {description ? (
            <p className="text-[11px] text-muted-foreground leading-tight truncate">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
          v1
        </Badge>
      </div>
    </header>
  );
}
