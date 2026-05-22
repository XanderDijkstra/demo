"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Pencil, User, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { updateLeadContactName } from "./_actions";

interface Props {
  orgNr: string;
  initialName: string | null;
}

export function ContactNameEditor({ orgNr, initialName }: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [editing, setEditing] = useState(initialName == null);
  const [pending, startTransition] = useTransition();

  function save() {
    const next = name.trim() || null;
    startTransition(async () => {
      const result = await updateLeadContactName(orgNr, next);
      if (result.ok) {
        toast.success(next ? "Name saved" : "Name removed");
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  function cancel() {
    setName(initialName ?? "");
    setEditing(initialName == null);
  }

  if (!editing && initialName) {
    return (
      <div className="flex items-start gap-2">
        <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">Contact person</div>
          <div className="flex items-center gap-2 group">
            <span className="break-words text-sm">{initialName}</span>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
              aria-label="Edit contact person"
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
      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="text-xs text-muted-foreground">Contact person</div>
        <div className={cn("flex items-center gap-1.5", pending && "opacity-70")}>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="First Last"
            className="h-8 text-sm"
            disabled={pending}
            maxLength={120}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            autoFocus={initialName == null}
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            aria-label="Save"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
          {initialName ? (
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Used as &quot;Hi {`{{contact_first_name}}`}&quot; in email templates.
        </p>
      </div>
    </div>
  );
}
