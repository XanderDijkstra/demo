import Link from "next/link";

import { Topbar } from "@/components/admin/topbar";
import { Badge } from "@/components/ui/badge";
import { loadCampaignConfig } from "@/lib/outreach/campaign";
import { cn } from "@/lib/utils";

import { CampaignTab } from "./_campaign-tab";
import { LogTab } from "./_log-tab";
import { parseWindow, StatsTab, WINDOW_OPTIONS } from "./_stats-tab";

export const dynamic = "force-dynamic";

type TabId = "campaign" | "log" | "stats";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "campaign", label: "Campaign" },
  { id: "log", label: "Log" },
  { id: "stats", label: "Stats" },
];

function parseTab(value: string | string[] | undefined): TabId {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "log" || v === "stats" || v === "campaign" ? v : "campaign";
}

interface RouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OutreachPage({ searchParams }: RouteProps) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const windowDays = parseWindow(params.window);
  const config = await loadCampaignConfig();

  return (
    <>
      <Topbar
        title="Outreach"
        description={
          tab === "campaign"
            ? "Daily campaign — filter who gets emailed and tweak the template"
            : tab === "log"
              ? "See exactly which leads got an email today, yesterday, all of it"
              : "Send / delivery / open / click / reply analytics"
        }
        actions={
          <div className="flex items-center gap-2">
            {config.enabled ? (
              <Badge variant="success" className="text-[10px]">
                Daily ON
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">
                Daily OFF
              </Badge>
            )}
            {tab === "stats" ? (
              <div className="hidden items-center gap-1 rounded-md border bg-background p-0.5 text-xs sm:inline-flex">
                {WINDOW_OPTIONS.map((w) => {
                  const active = w === windowDays;
                  return (
                    <Link
                      key={w}
                      href={`/admin/outreach?tab=stats&window=${w}`}
                      className={cn(
                        "rounded px-2 py-1 transition-colors",
                        active
                          ? "bg-foreground text-background font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {w}d
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        }
      />

      {/* Tab strip */}
      <div className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-6">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <Link
                key={t.id}
                href={`/admin/outreach?tab=${t.id}` as never}
                className={cn(
                  "relative -mb-px inline-flex h-10 items-center border-b-2 px-3 text-sm transition-colors",
                  active
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {tab === "campaign" ? (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <CampaignTab initial={config} />
          </div>
        </div>
      ) : tab === "log" ? (
        <LogTab />
      ) : (
        <StatsTab windowDays={windowDays} />
      )}
    </>
  );
}
