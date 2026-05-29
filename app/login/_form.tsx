"use client";

import { useState, useTransition } from "react";
import { Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction } from "./_actions";

export function LoginForm({
  next,
  configured,
}: {
  next: string;
  configured: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs">
          E-post
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          disabled={pending || !configured}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs">
          Passord
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending || !configured}
        />
      </div>

      {!configured ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs leading-snug text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Supabase miljøvariabler er ikke satt. Sjekk at
          <code className="font-mono mx-1">NEXT_PUBLIC_SUPABASE_URL</code>
          og
          <code className="font-mono mx-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          er på plass i Vercel.
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={pending || !configured}
      >
        {pending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        Logg inn
      </Button>
    </form>
  );
}
