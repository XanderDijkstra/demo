import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieSetTuple = { name: string; value: string; options: CookieOptions };

/**
 * Gate the operator-facing routes behind Supabase Auth.
 *
 * Anyone hitting /admin/* or /preview/* without a valid Supabase session
 * is redirected to /login with the original path in ?next=. The webhook,
 * cron, and public demo routes (`/p/[orgnr]`) stay open — they have
 * their own signed auth or are intentionally public.
 *
 * Edge-runtime safe. Uses the anon key + the request/response cookie
 * jar so Supabase can transparently refresh its session token.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Auth not configured → fail closed, but allow /login through so the
  // operator gets a clear "set env vars" message there instead of a
  // redirect loop.
  if (!url || !anonKey) {
    if (request.nextUrl.pathname.startsWith("/login")) {
      return response;
    }
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    next.search = "";
    return NextResponse.redirect(next);
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieSetTuple[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() (not getSession()) so the JWT is actually
  // verified against Supabase, not just trusted from the cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = request.nextUrl.clone();
    next.pathname = "/login";
    next.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search
    );
    return NextResponse.redirect(next);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/preview/:path*"],
};
