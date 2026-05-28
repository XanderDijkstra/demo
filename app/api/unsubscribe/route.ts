import { NextResponse } from "next/server";

import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Unsubscribe endpoint.
 *
 *   GET  → render a small confirmation page (link in the email body
 *          points here). The page POSTs back when the user confirms.
 *   POST → suppress the address and respond. Used by:
 *            - The confirmation page form.
 *            - Gmail / Outlook "one-click unsubscribe" (per RFC 8058),
 *              which sends `List-Unsubscribe=One-Click` as the body and
 *              expects a 2xx response.
 *
 * Idempotent: re-clicking returns the "already unsubscribed" state.
 */

interface ValidateResult {
  ok: boolean;
  email: string | null;
  error?: string;
}

function validate(searchParams: URLSearchParams): ValidateResult {
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const token = searchParams.get("token") ?? "";
  if (!email || !token) {
    return { ok: false, email: null, error: "Missing email or token" };
  }
  if (!verifyUnsubscribeToken(email, token)) {
    return { ok: false, email, error: "Invalid or expired token" };
  }
  return { ok: true, email };
}

async function suppress(email: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("outreach_suppressions").upsert(
    {
      email,
      reason: "unsubscribed",
      source_org_nr: null,
      notes: "Recipient clicked unsubscribe",
    },
    { onConflict: "email" }
  );
  await supabase.from("audit_log").insert({
    actor: "system",
    action: "outreach.unsubscribed",
    entity_type: "outreach_suppression",
    entity_id: email,
    metadata: { source: "unsubscribe_link" },
  });
}

async function isAlreadySuppressed(email: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("outreach_suppressions")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  return !!data;
}

// ─── GET: confirmation page ─────────────────────────────────────────────────

export async function GET(request: Request) {
  const url = new URL(request.url);
  const v = validate(url.searchParams);

  if (!v.ok || !v.email) {
    return new NextResponse(renderPage({ state: "error", message: v.error ?? "Invalid link" }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const already = await isAlreadySuppressed(v.email);
  return new NextResponse(
    renderPage(
      already
        ? { state: "already", email: v.email }
        : {
            state: "confirm",
            email: v.email,
            actionUrl: `/api/unsubscribe?${url.searchParams.toString()}`,
          }
    ),
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

// ─── POST: actually unsubscribe ────────────────────────────────────────────

export async function POST(request: Request) {
  const url = new URL(request.url);
  const v = validate(url.searchParams);

  if (!v.ok || !v.email) {
    return new NextResponse(renderPage({ state: "error", message: v.error ?? "Invalid link" }), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await suppress(v.email);

  // One-click clients (Gmail / Outlook) send `List-Unsubscribe=One-Click`
  // as the form body and don't render anything. They just need a 2xx.
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    let body = "";
    try {
      body = await request.text();
    } catch {
      // ignore
    }
    if (body.includes("List-Unsubscribe=One-Click")) {
      return NextResponse.json({ ok: true });
    }
  }

  return new NextResponse(
    renderPage({ state: "done", email: v.email }),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

// ─── Confirmation page (no React — keep this endpoint zero-dep) ────────────

type PageState =
  | { state: "confirm"; email: string; actionUrl: string }
  | { state: "done"; email: string }
  | { state: "already"; email: string }
  | { state: "error"; message: string };

function renderPage(s: PageState): string {
  const css = `
    *,*::before,*::after{box-sizing:border-box}
    html,body{margin:0;padding:0;background:#fafafa;color:#0a0a0a;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Helvetica,Arial,sans-serif}
    main{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:440px;width:100%;background:#fff;border:1px solid #e5e5e5;border-radius:14px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
    h1{margin:0 0 8px;font-size:18px;font-weight:600;letter-spacing:-0.01em}
    p{margin:0 0 16px;color:#525252}
    .email{display:inline-block;background:#f5f5f5;border-radius:6px;padding:2px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:#171717}
    button{appearance:none;border:0;background:#171717;color:#fff;font:600 14px/1 inherit;padding:11px 18px;border-radius:8px;cursor:pointer}
    button:hover{background:#000}
    .secondary{background:transparent;color:#525252;padding:11px 0;margin-left:14px}
    .secondary:hover{color:#171717;background:transparent}
    .ok{display:inline-flex;align-items:center;gap:8px;color:#0a7a3a;font-weight:500}
    .ok::before{content:"";width:8px;height:8px;border-radius:50%;background:#22c55e}
    .err{color:#b91c1c;font-weight:500}
    footer{margin-top:24px;padding-top:16px;border-top:1px solid #f0f0f0;font-size:12px;color:#a3a3a3}
  `;
  let inner = "";
  if (s.state === "confirm") {
    inner = `
      <h1>Unsubscribe from FX Media</h1>
      <p>You're about to stop receiving emails from us at <span class="email">${escapeHtml(s.email)}</span>.</p>
      <form method="POST" action="${escapeHtml(s.actionUrl)}">
        <button type="submit">Unsubscribe</button>
        <a class="secondary" href="https://fx-media.no">Cancel</a>
      </form>
      <footer>You won't get any further cold-outreach emails from us. If you change your mind, just reply to one of our previous messages — we'll re-enable.</footer>
    `;
  } else if (s.state === "done") {
    inner = `
      <h1>You're unsubscribed</h1>
      <p><span class="ok">${escapeHtml(s.email)} added to the suppression list.</span></p>
      <p>You won't get any more emails from FX Media. Thanks for letting us know.</p>
      <footer>If this was a mistake, just reply to a previous email and we'll re-enable sending.</footer>
    `;
  } else if (s.state === "already") {
    inner = `
      <h1>Already unsubscribed</h1>
      <p><span class="email">${escapeHtml(s.email)}</span> is already on our suppression list. No further action needed.</p>
    `;
  } else {
    inner = `
      <h1>Couldn't unsubscribe</h1>
      <p class="err">${escapeHtml(s.message)}</p>
      <p>If you keep seeing this, reply to one of our emails and we'll suppress your address manually.</p>
    `;
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribe · FX Media</title><style>${css}</style></head><body><main><div class="card">${inner}</div></main></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
