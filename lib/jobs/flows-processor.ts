/**
 * Flows processor — sends follow-up reminders to leads who were emailed
 * but never replied.
 *
 * Trigger model (v1): "no reply". For each enabled flow we look at the
 * original outreach emails (the first outbound on a thread) that were
 * sent at least `delay_hours` ago. If that thread has received no
 * inbound reply and hasn't already been followed up, we send the flow's
 * follow-up as a reply on the same thread.
 *
 * Guard rails:
 *   - A thread gets at most ONE follow-up across all flows (unique
 *     constraint on flow_runs.thread_id + an explicit pre-check).
 *   - Suppressed recipients (unsubscribed / bounced) are skipped and
 *     logged, never mailed.
 *   - Per-run cap so a backlog can't fire a huge blast at once.
 *
 * Never throws — failures are captured per-lead into flow_runs and the
 * batch keeps going.
 */

import "server-only";

import { sendEmail } from "@/lib/email/provider";
import {
  getInboundDomain,
  makeMessageId,
  touchThread,
} from "@/lib/email/threads";
import { publicSiteUrl } from "@/lib/jobs/generate-site";
import { fylkeFromKommuneNr } from "@/lib/regions";
import {
  applyPlaceholders,
  getOutreachFromAddress,
  getOutreachReplyTo,
  isSuppressed,
} from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Flow } from "@/lib/supabase/types";
import { formatCompanyName } from "@/lib/utils";

/** Max follow-ups sent in a single processor run (across all flows). */
const MAX_PER_RUN = 25;
/** How many candidate originals to scan per flow. */
const SCAN_LIMIT = 200;

export interface FlowsProcessResult {
  ok: true;
  flowsProcessed: number;
  sent: number;
  skippedReplied: number;
  skippedSuppressed: number;
  skippedNoEmail: number;
  failed: number;
  durationMs: number;
}

export async function processFlows(opts: {
  triggeredBy?: "cron" | "manual";
} = {}): Promise<FlowsProcessResult> {
  const triggeredBy = opts.triggeredBy ?? "cron";
  const startedAt = Date.now();
  const supabase = getSupabaseAdmin();

  const result: FlowsProcessResult = {
    ok: true,
    flowsProcessed: 0,
    sent: 0,
    skippedReplied: 0,
    skippedSuppressed: 0,
    skippedNoEmail: 0,
    failed: 0,
    durationMs: 0,
  };

  const { data: flowsData } = await supabase
    .from("flows")
    .select("*")
    .eq("enabled", true)
    .order("created_at", { ascending: true });

  const flows = (flowsData ?? []) as Flow[];

  const [fromAddress, replyTo, inboundDomain] = await Promise.all([
    getOutreachFromAddress(),
    getOutreachReplyTo(),
    getInboundDomain(),
  ]);

  let budget = MAX_PER_RUN;

  for (const flow of flows) {
    if (budget <= 0) break;
    result.flowsProcessed += 1;

    const cutoff = new Date(
      Date.now() - flow.delay_hours * 60 * 60 * 1000
    ).toISOString();

    // Candidate originals: the FIRST outbound on a thread (in_reply_to
    // null), actually sent, old enough.
    const { data: candidates } = await supabase
      .from("outreach_emails")
      .select("id, org_nr, thread_id, subject, message_id, sent_at")
      .eq("direction", "out")
      .is("in_reply_to", null)
      .in("status", ["sent", "delivered"])
      .not("thread_id", "is", null)
      .not("sent_at", "is", null)
      .lte("sent_at", cutoff)
      .order("sent_at", { ascending: true })
      .limit(SCAN_LIMIT);

    const seenThreads = new Set<string>();

    for (const original of candidates ?? []) {
      if (budget <= 0) break;
      const threadId = original.thread_id;
      if (!threadId || seenThreads.has(threadId)) continue;
      seenThreads.add(threadId);

      // Already followed up on this thread (any flow)? Skip silently.
      const { data: existingRun } = await supabase
        .from("flow_runs")
        .select("id")
        .eq("thread_id", threadId)
        .maybeSingle();
      if (existingRun) continue;

      // Did the lead reply? Any inbound on the thread = replied.
      const { count: inboundCount } = await supabase
        .from("outreach_emails")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", threadId)
        .eq("direction", "in");
      if ((inboundCount ?? 0) > 0) {
        await logRun(flow.id, original, "skipped_replied");
        result.skippedReplied += 1;
        continue;
      }

      // Load the lead for email + placeholders.
      const { data: lead } = await supabase
        .from("companies")
        .select(
          "org_nr, name, email, kommune, kommune_nr, contact_name"
        )
        .eq("org_nr", original.org_nr)
        .maybeSingle();

      if (!lead?.email) {
        await logRun(flow.id, original, "skipped_no_email");
        result.skippedNoEmail += 1;
        continue;
      }

      const sup = await isSuppressed(lead.email);
      if (sup.suppressed) {
        await logRun(flow.id, original, "skipped_suppressed");
        result.skippedSuppressed += 1;
        continue;
      }

      // Build the follow-up. It threads onto the original via In-Reply-To
      // + References so it lands in the same Gmail conversation.
      const { data: siteRow } = await supabase
        .from("generated_sites")
        .select("org_nr")
        .eq("org_nr", lead.org_nr)
        .maybeSingle();

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
      const subject = applyPlaceholders(flow.follow_up_subject, placeholders);
      const body = applyPlaceholders(flow.follow_up_body, placeholders);

      // References chain = every prior message_id on the thread.
      const { data: prior } = await supabase
        .from("outreach_emails")
        .select("message_id, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });
      const priorIds = (prior ?? [])
        .map((m) => m.message_id)
        .filter((v): v is string => !!v);
      const lastMessageId = priorIds[priorIds.length - 1] ?? null;

      const messageId = makeMessageId(inboundDomain);

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
        await logRun(
          flow.id,
          original,
          "failed",
          null,
          insertError?.message ?? "insert failed"
        );
        result.failed += 1;
        continue;
      }

      const sendResult = await sendEmail({
        to: lead.email,
        from: fromAddress,
        subject,
        body,
        replyTo,
        messageId,
        inReplyTo: lastMessageId ?? undefined,
        references: priorIds.length > 0 ? priorIds : undefined,
      });

      if (sendResult.ok) {
        await supabase
          .from("outreach_emails")
          .update({
            status: "sent",
            resend_id: sendResult.resendId ?? null,
            sent_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        await touchThread({ threadId });
        await logRun(flow.id, original, "sent", row.id);
        result.sent += 1;
        budget -= 1;
      } else {
        await supabase
          .from("outreach_emails")
          .update({ status: "failed", error_message: sendResult.error ?? null })
          .eq("id", row.id);
        await logRun(
          flow.id,
          original,
          "failed",
          row.id,
          sendResult.error ?? "send failed"
        );
        result.failed += 1;
      }
    }
  }

  result.durationMs = Date.now() - startedAt;

  await supabase.from("audit_log").insert({
    actor: triggeredBy === "cron" ? "cron" : "manual",
    action: "flows.process",
    entity_type: "flow",
    entity_id: "all",
    metadata: {
      flows_processed: result.flowsProcessed,
      sent: result.sent,
      skipped_replied: result.skippedReplied,
      skipped_suppressed: result.skippedSuppressed,
      skipped_no_email: result.skippedNoEmail,
      failed: result.failed,
      duration_ms: result.durationMs,
    },
  });

  return result;

  // ── helper ──────────────────────────────────────────────────────────
  async function logRun(
    flowId: string,
    original: { org_nr: string; thread_id: string | null; id: string },
    status: string,
    followUpEmailId: string | null = null,
    errorMessage: string | null = null
  ): Promise<void> {
    if (!original.thread_id) return;
    // onConflict on thread_id: if a run already exists we don't clobber it.
    await supabase.from("flow_runs").upsert(
      {
        flow_id: flowId,
        org_nr: original.org_nr,
        thread_id: original.thread_id,
        source_email_id: original.id,
        status,
        follow_up_email_id: followUpEmailId,
        error_message: errorMessage,
      },
      { onConflict: "thread_id", ignoreDuplicates: true }
    );
  }
}
