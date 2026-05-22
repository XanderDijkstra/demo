"use client";

import { useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ListFormProps {
  inputName: string;
  initial: string[];
  description: string;
  placeholder: string;
  saveAction: (formData: FormData) => Promise<
    { ok: true; message?: string } | { ok: false; error: string }
  >;
}

export function ListForm({
  inputName,
  initial,
  description,
  placeholder,
  saveAction,
}: ListFormProps) {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await saveAction(formData);
      if (result.ok) toast.success(result.message ?? "Saved");
      else toast.error(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={inputName} className="text-xs">
          {description}
        </Label>
        <textarea
          id={inputName}
          name={inputName}
          defaultValue={initial.join("\n")}
          placeholder={placeholder}
          rows={Math.max(4, initial.length + 1)}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring resize-y"
          disabled={pending}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save
        </Button>
      </div>
    </form>
  );
}
