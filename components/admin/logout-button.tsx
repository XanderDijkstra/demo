"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { logoutAction } from "@/app/login/_actions";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  function onClick() {
    startTransition(async () => {
      await logoutAction();
    });
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50",
        className
      )}
    >
      <LogOut className="h-3 w-3" />
      Logg ut
    </button>
  );
}
