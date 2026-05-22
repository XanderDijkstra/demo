"use client";

import { useTransition } from "react";
import { Check, Loader2, Reply } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { toggleEmailReplied } from "./_actions";

interface Props {
  orgNr: string;
  emailId: string;
  replied: boolean;
}

export function ReplyToggle({ orgNr, emailId, replied }: Props) {
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const result = await toggleEmailReplied(orgNr, emailId, !replied);
      if (result.ok) {
        toast.success(replied ? "Marked as not replied" : "Marked as replied");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
        replied
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
          : "border border-input text-muted-foreground hover:bg-accent",
        pending && "opacity-60"
      )}
      title={replied ? "Click to remove reply marker" : "Mark as replied"}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : replied ? (
        <Check className="h-3 w-3" />
      ) : (
        <Reply className="h-3 w-3" />
      )}
      {replied ? "Replied" : "Mark as replied"}
    </button>
  );
}
