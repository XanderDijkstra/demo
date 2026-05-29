"use server";

import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/server";

export type LoginResult = { ok: true } | { ok: false; error: string };

function sanitizeNext(raw: string | null): string {
  if (!raw) return "/admin";
  // Only allow same-origin relative paths so an attacker can't redirect
  // the operator off-site by crafting a malicious ?next=.
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/admin";
  return raw;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = sanitizeNext(String(formData.get("next") ?? ""));

  if (!email) return { ok: false, error: "Skriv inn e-post" };
  if (!password) return { ok: false, error: "Skriv inn passord" };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Don't leak whether email or password was wrong — generic message.
    return { ok: false, error: "Feil e-post eller passord" };
  }

  // `next` is a runtime-sanitized relative path; the typed-routes check
  // wants a known Route literal, so cast through `never`.
  redirect(next as never);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
