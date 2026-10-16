import { NextResponse, type NextRequest } from "next/server";

import { operatorEmail } from "@/lib/auth";

/**
 * Operator-only routes. Cloudflare Access already stops anyone else at the
 * edge; this re-verifies the Access JWT so a misconfigured Access app can't
 * open the admin. Public routes (/p/[orgnr], /api/unsubscribe,
 * /api/webhooks/*) are not matched and have their own checks.
 */
export async function middleware(request: NextRequest) {
  if (await operatorEmail(request.headers)) return NextResponse.next();
  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/admin/:path*", "/preview/:path*", "/api/inbox/:path*"],
};
