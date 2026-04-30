"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Mail, Pencil, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { updateLeadEmail } from "./_actions";

interface Props {
  orgNr: string;
  initialEmail: string | null;
}

export function EmailEditor({ orgNr, initialEmail }: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [editing, setEditing] = useState(initialEmail == null);
  const [pending, startTransition] = useTransition();

  function save() {
    const next = email.trim() || null;
    startTransition(async () => {
      const result = await updateLeadEmail(orgNr, next);
      if (result.ok) {
        toast.success(next ? "E-post oppdatert" : "E-post fjernet");
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function cancel() {
    setEmail(initialEmail ?? "");
    setEditing(initialEmail == null);
  }

  if (!editing && initialEmail) {
    return (
      <div className="flex items-start gap-2">
        <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">E-post</div>
          <div className="flex items-center gap-2 group">
            <a
              href={`mailto:${initialEmail}`}
              className="break-words hover:underline text-sm"
            >
              {initialEmail}
            </a>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              aria-label="Rediger e-post"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="text-xs text-muted-foreground">E-post</div>
        <div className={cn("flex items-center gap-1.5", pending && "opacity-70")}>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="navn@selskap.no"
            className="h-8 text-sm"
            disabled={pending}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            autoFocus={initialEmail == null}
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            aria-label="Lagre"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
          {initialEmail ? (
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Avbryt"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Brreg har ingen e-post-data — legg til manuelt etter research.
        </p>
      </div>
    </div>
  );
}
