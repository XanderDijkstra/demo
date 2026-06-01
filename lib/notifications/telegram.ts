/**
 * Telegram notifier (single-operator). Sends a DM to the configured chat
 * when something noteworthy happens — currently just inbound lead replies.
 *
 * Setup (one-time):
 *   1. Open Telegram, DM @BotFather → /newbot → follow prompts → it gives
 *      you a token like "123456:ABC-DEF…". Set TELEGRAM_BOT_TOKEN.
 *   2. Start a chat with your new bot (search for the @username from step
 *      1, hit Start). Then in a browser hit:
 *        https://api.telegram.org/bot<TOKEN>/getUpdates
 *      Find the `chat.id` (a small integer or negative for groups). Set
 *      TELEGRAM_CHAT_ID.
 *
 * Fail-soft: if env is missing or the API call errors, we swallow it.
 * Inbound processing must never break on a notification side-effect.
 */

import "server-only";

const API_BASE = "https://api.telegram.org";

interface TelegramConfig {
  token: string;
  chatId: string;
}

function getConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return null;
  return { token: token.trim(), chatId: chatId.trim() };
}

/**
 * Escape HTML special chars for Telegram's `parse_mode=HTML`. Only the
 * five entities Telegram accepts; everything else passes through.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendMessage(html: string): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;

  try {
    const res = await fetch(`${API_BASE}/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: html,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      // Telegram is fast but cap so a slow API can't stall inbound.
      signal: AbortSignal.timeout(5000),
    });
    // Best-effort. We don't surface 400s anywhere — they'd just be noise.
    if (!res.ok) {
      // swallow
    }
  } catch {
    // swallow
  }
}

export interface InboundReplyNotifyArgs {
  /** Sender's display name from the inbound mail (e.g. "Kari Hansen"). */
  fromName: string | null;
  fromEmail: string;
  /** Resolved company name (already prettified) — null if thread unlinked. */
  companyName: string | null;
  /** Lead org.nr for the deep-link, when known. */
  orgNr: string | null;
  /** Email subject. */
  subject: string | null;
  /** First lines of the reply (already stripped of quoted parts). */
  preview: string | null;
  /** Absolute base URL for deep links — read from APP_URL / VERCEL_URL. */
  appUrl?: string;
}

function publicBase(appUrl?: string): string | null {
  if (appUrl) return appUrl.replace(/\/+$/, "");
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return null;
}

/**
 * Send a "lead replied" notification. Called from the inbound handler
 * after a reply is successfully threaded.
 */
export async function notifyInboundReply(
  args: InboundReplyNotifyArgs
): Promise<void> {
  const sender = args.fromName
    ? `${args.fromName} (${args.fromEmail})`
    : args.fromEmail;
  const company = args.companyName ?? "Ukjent bedrift";
  const subject = args.subject?.trim() ?? "(uten emne)";
  const preview = (args.preview ?? "").trim().slice(0, 320);

  const lines: string[] = [
    `📩 <b>Ny reply fra ${escapeHtml(company)}</b>`,
    `<i>${escapeHtml(sender)}</i>`,
    "",
    `<b>${escapeHtml(subject)}</b>`,
  ];
  if (preview) {
    lines.push("", escapeHtml(preview));
  }

  const base = publicBase(args.appUrl);
  if (base && args.orgNr) {
    lines.push("", `<a href="${base}/admin/leads/${args.orgNr}">Åpne lead →</a>`);
  } else if (base) {
    lines.push("", `<a href="${base}/admin/inbox">Åpne innboks →</a>`);
  }

  await sendMessage(lines.join("\n"));
}
