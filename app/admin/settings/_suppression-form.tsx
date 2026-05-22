"use client";

import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OutreachSuppression } from "@/lib/supabase/types";

import { addManualSuppression, removeSuppression } from "./_actions";

interface Props {
  suppressions: OutreachSuppression[];
}

const REASON_LABEL: Record<OutreachSuppression["reason"], string> = {
  bounced: "bounce",
  complained: "complaint",
  manual: "manual",
  unsubscribed: "avmeldt",
};

const REASON_VARIANT: Record<
  OutreachSuppression["reason"],
  "destructive" | "warning" | "outline"
> = {
  bounced: "destructive",
  complained: "destructive",
  manual: "outline",
  unsubscribed: "warning",
};

export function SuppressionManager({ suppressions }: Props) {
  const [pending, startTransition] = useTransition();

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addManualSuppression(formData);
      if (result.ok) toast.success(result.message ?? "Lagt til");
      else toast.error(result.error);
    });
  }

  function handleRemove(email: string) {
    startTransition(async () => {
      const result = await removeSuppression(email);
      if (result.ok) toast.success(result.message ?? "Removeet");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-4">
      <form action={handleAdd} className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5 flex-1 min-w-56">
          <Label htmlFor="supp-email" className="text-xs">
            Legg til adresse
          </Label>
          <Input
            id="supp-email"
            name="email"
            type="email"
            placeholder="navn@selskap.no"
            disabled={pending}
            required
          />
        </div>
        <div className="space-y-1.5 flex-1 min-w-40">
          <Label htmlFor="supp-notes" className="text-xs">
            Notat (optional)
          </Label>
          <Input
            id="supp-notes"
            name="notes"
            placeholder="Bakgrunn / referanse"
            disabled={pending}
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Plus />}
          Suppress
        </Button>
      </form>

      {suppressions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No addresses in the suppression list. Bounces and complaints
          from Resend are added automatically via webhook.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {suppressions.map((s) => (
            <li
              key={s.email}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <Badge variant={REASON_VARIANT[s.reason]}>
                {REASON_LABEL[s.reason]}
              </Badge>
              <span className="font-mono text-xs flex-1 min-w-0 truncate">
                {s.email}
              </span>
              {s.notes ? (
                <span
                  className="text-xs text-muted-foreground truncate max-w-40"
                  title={s.notes}
                >
                  {s.notes}
                </span>
              ) : null}
              <span
                className="text-[11px] text-muted-foreground whitespace-nowrap"
                title={s.created_at}
              >
                {formatDistanceToNow(new Date(s.created_at), {
                  addSuffix: true,
                  locale: nb,
                })}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(s.email)}
                disabled={pending}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label="Remove"
                title="Remove fra suppression list"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
