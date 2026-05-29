import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/server";

import { LoginForm } from "./_form";

export const dynamic = "force-dynamic";

interface RouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickNext(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !v.startsWith("/") || v.startsWith("//")) return "/admin";
  return v;
}

export default async function LoginPage({ searchParams }: RouteProps) {
  const params = await searchParams;
  const next = pickNext(params.next);

  // Already signed in? Bounce straight to the destination.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = !!(url && anonKey);

  if (configured) {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect(next as never);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-7 shadow-sm">
        <div className="space-y-1.5">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            V
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            Vekst-Systemet
          </h1>
          <p className="text-sm text-muted-foreground">
            Logg inn for å fortsette.
          </p>
        </div>

        <LoginForm next={next} configured={configured} />
      </div>
    </div>
  );
}
