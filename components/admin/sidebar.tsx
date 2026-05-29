"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Handshake,
  Inbox,
  LayoutDashboard,
  Mail,
  Palette,
  Settings,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { LogoutButton } from "./logout-button";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** When set, navItem renders a badge with this count (hidden when 0). */
  badgeKey?: "inbox";
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: Users },
  { label: "Inbox", href: "/admin/inbox", icon: Inbox, badgeKey: "inbox" },
  { label: "CRM", href: "/admin/crm", icon: Handshake },
  { label: "Templates", href: "/admin/templates", icon: Palette },
  { label: "Outreach", href: "/admin/outreach", icon: Mail },
  { label: "Flows", href: "/admin/flows", icon: Workflow },
  { label: "Queue", href: "/admin/queue", icon: Activity },
  { label: "Other", href: "/admin/other", icon: Boxes },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export interface SidebarBadges {
  inbox?: number;
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ badges }: { badges?: SidebarBadges }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-sidebar md:text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b px-4">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
          V
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Vekst-Systemet</span>
          <span className="text-[11px] text-muted-foreground">FX Media</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const badge =
              item.badgeKey && badges ? badges[item.badgeKey] : undefined;
            return (
              <li key={item.href}>
                <Link
                  href={item.href as never}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {badge && badge > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold tabular-nums text-primary-foreground">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center justify-between gap-2 border-t p-3 text-[11px] text-muted-foreground">
        <span>v1 · {new Date().getFullYear()}</span>
        <LogoutButton />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex md:hidden border-b bg-card">
      <ul className="flex w-full overflow-x-auto px-2 py-1.5 gap-1">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href as never}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs whitespace-nowrap transition-colors",
                  active
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
