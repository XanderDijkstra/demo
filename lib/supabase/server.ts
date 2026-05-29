import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "./types";

type CookieSetTuple = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for server components and server actions. Reads + writes
 * the session cookies via next/headers, so `supabase.auth.getUser()` here
 * returns the real authenticated user.
 *
 * This client uses the ANON key — Row Level Security applies, which is
 * what we want for anything tied to a user session. For trusted
 * service-role work (cron, webhooks) keep using `getSupabaseAdmin`.
 */
export async function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const store = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet: CookieSetTuple[]) {
        // In a pure Server Component this throws (cookies are read-only
        // outside actions); middleware refreshes the cookies on every
        // request, so the swallow is safe.
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // ignore
        }
      },
    },
  });
}
