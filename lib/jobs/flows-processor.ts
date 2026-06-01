/**
 * Flows processor — runs two kinds of follow-up automation.
 *
 *  1. "no_reply"      — a lead was emailed and never replied. After the
 *                       flow's delay we send a reminder on the same thread.
 *  2. "stage_entered" — a lead was moved into a CRM stage (swiped into the
 *                       pipeline, dragged on the kanban, …). They're
 *                       enrolled at that moment (lib/flows-enroll) and the
 *                       email goes out once the enrollment's due_at passes.
 *
 * Guard rails (both kinds):
 *   - At most one follow-up per thread for no_reply (unique flow_runs).
 *   - One enrollment per (flow, lead) for stage flows (unique constraint).
 *   - Suppressed recipients are skipped + logged, never mailed.
 *   - Shared per-run cap so a backlog can't fire a huge blast.
 *
 * Never throws — failures are captured per-lead and the batch continues.
 */

import "server-only";

import { sendEmail } from "@/lib/email/provider";
import {
  ensureOutboundThread,
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

const MAX_PER_RUN = 25;
const SCAN_LIMIT = 200;

type Supa = ReturnType<typeof getSupabaseAdmin>;

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

interface SendContext {
  fromAddress: string;
  replyTo: string;
  inboundDomain: string | null;
}

interface LeadRow {
  org_nr: string;
  name: string;
  email: string | null;
  kommune: string | null;
  kommune_nr: string | null;
  contact_name: string | null;
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
  const ctx: SendContext = { fromAddress, replyTo, inboundDomain };

  let budget = MAX_PER_RUN;

  // ── 1. no_reply flows ──────────────────────────────────────────────
  for (const flow of flows) {
    if (budget <= 0) break;
    if (flow.trigger_type !== "no_reply") continue;
    result.flowsProcessed += 1;
    budget = await processNoReplyFlow(supabase, flow, ctx, budget, result);
  }

  // ── 2. stage_entered enrollments that are due ──────────────────────
  if (budget > 0) {
    budget = await processDueEnrollments(supabase, flows, ctx, budget, result);
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
}

// ─── no_reply ─────────────────────────────────────────────────────────

async function processNoReplyFlow(
  supabase: Supa,
  flow: Flow,
  ctx: SendContext,
  budgetIn: number,
  result: FlowsProcessResult
): Promise<number> {
  let budget = budgetIn;
  const cutoff = new Date(
    Date.now() - flow.delay_hours * 60 * 60 * 1000
  ).toISOString();

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

    const { data: existingRun } = await supabase
      .from("flow_runs")
      .select("id")
      .eq("thread_id", threadId)
      .maybeSingle();
    if (existingRun) continue;

    const { count: inboundCount } = await supabase
      .from("outreach_emails")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId)
      .eq("direction", "in");
    if ((inboundCount ?? 0) > 0) {
      await logRun(supabase, flow.id, original, "skipped_replied");
      result.skippedReplied += 1;
      continue;
    }

    // Orphaned outbound with no company link — nothing to follow up on,
    // skip silently (logRun also no-ops on null org_nr).
    if (!original.org_nr) continue;
    const lead = await loadLead(supabase, original.org_nr);
    if (!lead?.email) {
      await logRun(supabase, flow.id, original, "skipped_no_email");
      result.skippedNoEmail += 1;
      continue;
    }

    const sup = await isSuppressed(lead.email);
    if (sup.suppressed) {
      await logRun(supabase, flow.id, original, "skipped_suppressed");
      result.skippedSuppressed += 1;
      continue;
    }

    const sendRes = await sendFollowUpOnThread(supabase, ctx, {
      lead,
      threadId,
      flow,
    });

    if (sendRes.ok) {
      await logRun(supabase, flow.id, original, "sent", sendRes.emailId);
      result.sent += 1;
      budget -= 1;
    } else {
      await logRun(supabase, flow.id, original, "failed", null, sendRes.error);
      result.failed += 1;
    }
  }

  return budget;
}

async function logRun(
  supabase: Supa,
  flowId: string,
  original: { org_nr: string | null; thread_id: string | null; id: string },
  status: string,
  followUpEmailId: string | null = null,
  errorMessage: string | null = null
): Promise<void> {
  if (!original.thread_id) return;
  // flow_runs.org_nr is NOT NULL by design (every flow run targets a
  // specific company). Skip logging when an upstream candidate has no
  // org_nr — this can only happen for orphaned threads, which no_reply
  // candidates can't be anyway (they're filtered to outbound rows tied
  // to a company).
  if (!original.org_nr) return;
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

// ─── stage_entered ────────────────────────────────────────────────────

async function processDueEnrollments(
  supabase: Supa,
  flows: Flow[],
  ctx: SendContext,
  budgetIn: number,
  result: FlowsProcessResult
): Promise<number> {
  let budget = budgetIn;
  const nowIso = new Date().toISOString();

  const stageFlowById = new Map(
    flows.filter((f) => f.trigger_type === "stage_entered").map((f) => [f.id, f])
  );

  const { data: dueEnr } = await supabase
    .from("flow_enrollments")
    .select("*")
    .eq("status", "pending")
    .lte("due_at", nowIso)
    .order("due_at", { ascending: true })
    .limit(SCAN_LIMIT);

  const countedFlows = new Set<string>();

  for (const enr of dueEnr ?? []) {
    if (budget <= 0) break;

    const flow = stageFlowById.get(enr.flow_id);
    // Flow disabled / deleted / no longer a stage flow → drop enrollment.
    if (!flow) {
      await supabase
        .from("flow_enrollments")
        .update({ status: "cancelled", processed_at: nowIso })
        .eq("id", enr.id);
      continue;
    }
    if (!countedFlows.has(flow.id)) {
      countedFlows.add(flow.id);
      result.flowsProcessed += 1;
    }

    const lead = await loadLead(supabase, enr.org_nr);
    if (!lead?.email) {
      await finishEnrollment(supabase, enr.id, "skipped_no_email");
      result.skippedNoEmail += 1;
      continue;
    }

    // Reply = hard stop. Even though inbound cancels pending enrollments,
    // re-check here so a reply that landed between cancel and processing
    // can never get an automated nudge into a live conversation.
    const { count: repliedCount } = await supabase
      .from("outreach_emails")
      .select("id", { count: "exact", head: true })
      .eq("org_nr", enr.org_nr)
      .eq("direction", "in");
    if ((repliedCount ?? 0) > 0) {
      await finishEnrollment(supabase, enr.id, "skipped_replied");
      result.skippedReplied += 1;
      continue;
    }

    const sup = await isSuppressed(lead.email);
    if (sup.suppressed) {
      await finishEnrollment(supabase, enr.id, "skipped_suppressed");
      result.skippedSuppressed += 1;
      continue;
    }

    // Reuse the lead's most recent thread if one exists, otherwise open a
    // fresh outbound thread. (Subject is templated below.)
    const subjectPreview = applyPlaceholders(flow.follow_up_subject, {
      company_name: formatCompanyName(lead.name),
    });
    let threadId: string;
    const { data: existingThread } = await supabase
      .from("email_threads")
      .select("id")
      .eq("org_nr", lead.org_nr)
      .order("last_activity_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingThread?.id) {
      threadId = existingThread.id;
    } else {
      try {
        const thread = await ensureOutboundThread({
          orgNr: lead.org_nr,
          subject: subjectPreview,
        });
        threadId = thread.id;
      } catch (err) {
        await finishEnrollment(
          supabase,
          enr.id,
          "failed",
          null,
          err instanceof Error ? err.message : String(err)
        );
        result.failed += 1;
        continue;
      }
    }

    const sendRes = await sendFollowUpOnThread(supabase, ctx, {
      lead,
      threadId,
      flow,
    });

    if (sendRes.ok) {
      await finishEnrollment(supabase, enr.id, "sent", sendRes.emailId, null, threadId);
      result.sent += 1;
      budget -= 1;
    } else {
      await finishEnrollment(supabase, enr.id, "failed", null, sendRes.error, threadId);
      result.failed += 1;
    }
  }

  return budget;
}

async function finishEnrollment(
  supabase: Supa,
  id: string,
  status: string,
  sentEmailId: string | null = null,
  errorMessage: string | null = null,
  threadId: string | null = null
): Promise<void> {
  await supabase
    .from("flow_enrollments")
    .update({
      status,
      sent_email_id: sentEmailId,
      error_message: errorMessage,
      thread_id: threadId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);
}

// ─── shared send ──────────────────────────────────────────────────────

async function loadLead(
  supabase: Supa,
  orgNr: string
): Promise<LeadRow | null> {
  const { data } = await supabase
    .from("companies")
    .select("org_nr, name, email, kommune, kommune_nr, contact_name")
    .eq("org_nr", orgNr)
    .maybeSingle();
  return (data as LeadRow | null) ?? null;
}

/**
 * Send a flow's templated email as a reply on `threadId`. Threads via
 * In-Reply-To + References onto whatever's already on the thread.
 */
async function sendFollowUpOnThread(
  supabase: Supa,
  ctx: SendContext,
  args: { lead: LeadRow; threadId: string; flow: Flow }
): Promise<{ ok: true; emailId: string } | { ok: false; error: string }> {
  const { lead, threadId, flow } = args;

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

  const { data: prior } = await supabase
    .from("outreach_emails")
    .select("message_id, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  const priorIds = (prior ?? [])
    .map((m) => m.message_id)
    .filter((v): v is string => !!v);
  const lastMessageId = priorIds[priorIds.length - 1] ?? null;

  const messageId = makeMessageId(ctx.inboundDomain);

  const { data: row, error: insertError } = await supabase
    .from("outreach_emails")
    .insert({
      org_nr: lead.org_nr,
      to_email: lead.email as string,
      from_email: ctx.fromAddress,
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
    return { ok: false, error: insertError?.message ?? "insert failed" };
  }

  const sendResult = await sendEmail({
    to: lead.email as string,
    from: ctx.fromAddress,
    subject,
    body,
    replyTo: ctx.replyTo,
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
    return { ok: true, emailId: row.id };
  }

  await supabase
    .from("outreach_emails")
    .update({ status: "failed", error_message: sendResult.error ?? null })
    .eq("id", row.id);
  return { ok: false, error: sendResult.error ?? "send failed" };
}
