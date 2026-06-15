"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  getInboundDomain,
  makeMessageId,
  touchThread,
} from "@/lib/email/threads";
import { sendEmail } from "@/lib/email/provider";
import { publicSiteUrl } from "@/lib/jobs/generate-site";
import {
  applyPlaceholders,
  getOutreachFromAddress,
  getOutreachReplyTo,
  isSuppressed,
} from "@/lib/resend";
import { fylkeFromKommuneNr } from "@/lib/regions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { formatCompanyName } from "@/lib/utils";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Clear the unread badge on a thread. Called when the operator opens
 * the thread page (server-rendered effect, no UI control).
 *
 * Intentionally NO revalidatePath — calling that during a server
 * component render can trigger a refetch loop / page error. The
 * unread count will stay stale until the next navigation, which is
 * fine for a single-operator MVP.
 */
export async function markThreadRead(threadId: string): Promise<void> {
  if (!threadId) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("email_threads")
      .update({ unread_count: 0 })
      .eq("id", threadId);
    await supabase
      .from("outreach_emails")
      .update({ read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .eq("direction", "in")
      .is("read_at", null);
  } catch {
    // Don't fail the page render if this can't update — it's just
    // the unread-badge UX, not the message content.
  }
}

const ReplySchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(998),
  body: z.string().trim().min(1, "Body is required").max(50_000),
});

/**
 * Send a reply on an existing thread. Mirrors sendLeadEmail's wiring
 * (Reply-To, Message-ID, References, suppression check, audit log) but
 * uses the thread's id directly so we don't depend on subject matching.
 */
export async function replyToThread(
  threadId: string,
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  if (!threadId) return { ok: false, error: "Missing thread id" };

  const parsed = ReplySchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const supabase = getSupabaseAdmin();

  // Load thread.
  const { data: thread, error: threadError } = await supabase
    .from("email_threads")
    .select("id, org_nr")
    .eq("id", threadId)
    .maybeSingle();
  if (threadError) return { ok: false, error: threadError.message };
  if (!thread) return { ok: false, error: "Thread not found" };

  // Build send config first — common to linked + unlinked replies.
  const [fromAddress, replyTo, inboundDomain, priorRes] = await Promise.all([
    getOutreachFromAddress(),
    getOutreachReplyTo(),
    getInboundDomain(),
    supabase
      .from("outreach_emails")
      .select("message_id, from_email, direction, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true }),
  ]);

  const priorMessages = priorRes.data ?? [];
  const priorIds = priorMessages
    .map((m) => m.message_id)
    .filter((v): v is string => !!v);
  const lastMessageId = priorIds[priorIds.length - 1] ?? null;
  const messageId = makeMessageId(inboundDomain);

  // ── Unlinked thread: send straight to the most recent inbound sender,
  //    skip lead/placeholder logic entirely. ──────────────────────────
  if (!thread.org_nr) {
    const lastInbound = [...priorMessages]
      .reverse()
      .find((m) => m.direction === "in" && m.from_email);
    if (!lastInbound?.from_email) {
      return {
        ok: false,
        error: "Ingen avsender å svare til på denne tråden",
      };
    }
    const toAddr = lastInbound.from_email;

    const sup = await isSuppressed(toAddr);
    if (sup.suppressed) {
      return { ok: false, error: `Adressen er suppressed (${sup.reason})` };
    }

    // Placeholders resolve to empty for unlinked replies — lead context
    // isn't available. Raw subject + body get sent as-is.
    const subject = applyPlaceholders(parsed.data.subject, {});
    const body = applyPlaceholders(parsed.data.body, {});

    const { data: row, error: insertError } = await supabase
      .from("outreach_emails")
      .insert({
        org_nr: null,
        to_email: toAddr,
        from_email: fromAddress,
        subject,
        body,
        status: "queued",
        direction: "out",
        thread_id: threadId,
        message_id: messageId,
        in_reply_to: lastMessageId,
        references_chain: priorIds.length > 0 ? priorIds : null,
      })
      .select()
      .single();
    if (insertError || !row) {
      return { ok: false, error: insertError?.message ?? "Could not log send" };
    }

    const result = await sendEmail({
      to: toAddr,
      from: fromAddress,
      subject,
      body,
      replyTo,
      messageId,
      inReplyTo: lastMessageId ?? undefined,
      references: priorIds.length > 0 ? priorIds : undefined,
    });

    if (result.ok) {
      await supabase
        .from("outreach_emails")
        .update({
          status: "sent",
          resend_id: result.resendId ?? null,
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      await touchThread({ threadId });
      revalidatePath("/admin/inbox");
      return { ok: true, id: row.id };
    }
    await supabase
      .from("outreach_emails")
      .update({ status: "failed", error_message: result.error ?? null })
      .eq("id", row.id);
    return { ok: false, error: result.error ?? "Send failed" };
  }

  // ── Linked thread: full lead-aware path. ────────────────────────────
  const { data: lead, error: leadError } = await supabase
    .from("companies")
    .select("org_nr, name, email, kommune, kommune_nr, contact_name")
    .eq("org_nr", thread.org_nr)
    .maybeSingle();
  if (leadError) return { ok: false, error: leadError.message };
  if (!lead?.email) {
    return { ok: false, error: "Lead has no email address" };
  }

  // Suppression check.
  const sup = await isSuppressed(lead.email);
  if (sup.suppressed) {
    return {
      ok: false,
      error: `Address is suppressed (${sup.reason})`,
    };
  }

  // Look up whether a demo site is published for this lead so
  // {{site_url}} actually resolves in templates like "Send demoside".
  // Before this fix the URL was hardcoded as "", which silently dropped
  // the placeholder (and any trailing punctuation looked broken in the
  // delivered email).
  const { data: siteRow } = await supabase
    .from("generated_sites")
    .select("org_nr")
    .eq("org_nr", lead.org_nr)
    .maybeSingle();

  // Placeholders match the lead-detail send modal.
  const firstName = lead.contact_name?.trim().split(/\s+/)[0] ?? null;
  const placeholders = {
    company_name: formatCompanyName(lead.name),
    kommune: lead.kommune,
    region: fylkeFromKommuneNr(lead.kommune_nr),
    org_nr: lead.org_nr,
    site_url: siteRow ? publicSiteUrl(lead.org_nr) : "",
    contact_name: lead.contact_name,
    contact_first_name: firstName,
  };
  const subject = applyPlaceholders(parsed.data.subject, placeholders);
  const body = applyPlaceholders(parsed.data.body, placeholders);

  const { data: row, error: insertError } = await supabase
    .from("outreach_emails")
    .insert({
      org_nr: lead.org_nr,
      to_email: lead.email,
      from_email: fromAddress,
      subject,
      body,
      status: "queued",
      direction: "out",
      thread_id: threadId,
      message_id: messageId,
      in_reply_to: lastMessageId,
      references_chain: priorIds.length > 0 ? priorIds : null,
    })
    .select()
    .single();
  if (insertError || !row) {
    return { ok: false, error: insertError?.message ?? "Could not log send" };
  }

  const result = await sendEmail({
    to: lead.email,
    from: fromAddress,
    subject,
    body,
    replyTo,
    messageId,
    inReplyTo: lastMessageId ?? undefined,
    references: priorIds.length > 0 ? priorIds : undefined,
  });

  if (result.ok) {
    await supabase
      .from("outreach_emails")
      .update({
        status: "sent",
        resend_id: result.resendId ?? null,
        sent_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    await touchThread({ threadId });
    await supabase.from("audit_log").insert({
      actor: "manual",
      action: "inbox.reply.sent",
      entity_type: "company",
      entity_id: lead.org_nr,
      metadata: { thread_id: threadId, resend_id: result.resendId },
    });
    revalidatePath("/admin/inbox");
    revalidatePath(`/admin/inbox/${threadId}`);
    revalidatePath(`/admin/leads/${lead.org_nr}`);
    return { ok: true, id: row.id };
  }

  await supabase
    .from("outreach_emails")
    .update({ status: "failed", error_message: result.error ?? null })
    .eq("id", row.id);
  return { ok: false, error: result.error ?? "Send failed" };
}
