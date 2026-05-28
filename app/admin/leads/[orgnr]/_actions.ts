"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createManualDeal,
  ensureDealForReply,
  isValidDealStage,
  setDealStage,
  updateDealFields,
} from "@/lib/deals";
import {
  runGenerateLeadSite,
  unpublishLeadSite,
  publicSiteUrl,
} from "@/lib/jobs/generate-site";
import {
  scrapeWebsiteEmail,
  type EmailCandidate,
} from "@/lib/jobs/scrape-website-email";
import {
  ensureOutboundThread,
  getInboundDomain,
  makeMessageId,
  touchThread,
} from "@/lib/email/threads";
import { sendEmail } from "@/lib/email/provider";
import {
  applyPlaceholders,
  getOutreachFromAddress,
  getOutreachReplyTo,
  isSuppressed,
} from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CompanyStatus, DealStage } from "@/lib/supabase/types";
import { isNicheSlug, type NicheSlug } from "@/lib/templates";

type ActionResult = { ok: true } | { ok: false; error: string };

const VALID_STATUSES: CompanyStatus[] = [
  "new",
  "reviewed",
  "qualified",
  "rejected",
];

function isValidOrgNr(orgNr: string): boolean {
  return /^\d{9}$/.test(orgNr);
}

export async function updateLeadStatus(
  orgNr: string,
  status: CompanyStatus
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) {
    return { ok: false, error: "Invalid org.nr" };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("companies")
    .update({ status })
    .eq("org_nr", orgNr);

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: `lead.status.${status}`,
    entity_type: "company",
    entity_id: orgNr,
    metadata: { status },
  });

  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");

  return { ok: true };
}

// ─── Contact person ──────────────────────────────────────────────────────────

const ContactNameSchema = z.string().trim().min(1).max(120);

export async function updateLeadContactName(
  orgNr: string,
  name: string | null
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) {
    return { ok: false, error: "Invalid org.nr" };
  }

  let normalized: string | null;
  if (name == null || name.trim() === "") {
    normalized = null;
  } else {
    const parsed = ContactNameSchema.safeParse(name);
    if (!parsed.success) return { ok: false, error: "Invalid name" };
    normalized = parsed.data;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("companies")
    .update({ contact_name: normalized })
    .eq("org_nr", orgNr);

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "lead.contact_name.updated",
    entity_type: "company",
    entity_id: orgNr,
    metadata: { contact_name: normalized },
  });

  revalidatePath(`/admin/leads/${orgNr}`);
  return { ok: true };
}

// ─── Email enrichment from website ───────────────────────────────────────────

export type ScrapeEmailActionResult =
  | {
      ok: true;
      saved: boolean;
      best: EmailCandidate;
      candidates: EmailCandidate[];
      fetchedUrls: string[];
    }
  | { ok: false; error: string; fetchedUrls: string[] };

export async function scrapeLeadEmail(
  orgNr: string
): Promise<ScrapeEmailActionResult> {
  if (!isValidOrgNr(orgNr)) {
    return { ok: false, error: "Invalid org.nr", fetchedUrls: [] };
  }

  const supabase = getSupabaseAdmin();
  const { data: lead, error: leadError } = await supabase
    .from("companies")
    .select("org_nr, website, email")
    .eq("org_nr", orgNr)
    .maybeSingle();

  if (leadError) {
    return { ok: false, error: leadError.message, fetchedUrls: [] };
  }
  if (!lead) {
    return { ok: false, error: "Lead not found", fetchedUrls: [] };
  }
  if (!lead.website) {
    return {
      ok: false,
      error: "No website to scrape — add a homepage first",
      fetchedUrls: [],
    };
  }

  const result = await scrapeWebsiteEmail(lead.website);
  if (!result.ok) {
    await supabase.from("audit_log").insert({
      actor: "manual",
      action: "lead.email.scrape.failed",
      entity_type: "company",
      entity_id: orgNr,
      metadata: {
        website: lead.website,
        error: result.error,
        fetched_urls: result.fetchedUrls,
      },
    });
    return result;
  }

  // Auto-save only when (a) there is no email yet AND (b) the top candidate
  // is clearly the best (score gap of ≥ 30 over second place, or it's the only
  // same-domain hit). Otherwise leave it to the operator to pick.
  let saved = false;
  if (!lead.email) {
    const top = result.best;
    const second = result.candidates[1];
    const isClearWinner =
      !second ||
      top.score - second.score >= 30 ||
      top.score >= 100;
    if (isClearWinner) {
      const { error: updateError } = await supabase
        .from("companies")
        .update({ email: top.email })
        .eq("org_nr", orgNr);
      if (!updateError) {
        saved = true;
      }
    }
  }

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: saved
      ? "lead.email.scrape.auto_saved"
      : "lead.email.scrape.candidates",
    entity_type: "company",
    entity_id: orgNr,
    metadata: {
      website: lead.website,
      best: result.best.email,
      saved,
      candidate_count: result.candidates.length,
      fetched_urls: result.fetchedUrls,
    },
  });

  revalidatePath(`/admin/leads/${orgNr}`);

  return {
    ok: true,
    saved,
    best: result.best,
    candidates: result.candidates,
    fetchedUrls: result.fetchedUrls,
  };
}

// ─── Email field ─────────────────────────────────────────────────────────────

const EmailSchema = z.string().trim().email().max(254);

export async function updateLeadEmail(
  orgNr: string,
  email: string | null
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) {
    return { ok: false, error: "Invalid org.nr" };
  }

  let normalized: string | null;
  if (email == null || email.trim() === "") {
    normalized = null;
  } else {
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) return { ok: false, error: "Invalid email address" };
    normalized = parsed.data;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("companies")
    .update({ email: normalized })
    .eq("org_nr", orgNr);

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "lead.email.updated",
    entity_type: "company",
    entity_id: orgNr,
    metadata: { email: normalized },
  });

  revalidatePath(`/admin/leads/${orgNr}`);
  return { ok: true };
}

// ─── Send outreach email ─────────────────────────────────────────────────────

const SendSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(998),
  body: z.string().trim().min(1, "Body is required").max(50_000),
});

export async function sendLeadEmail(
  orgNr: string,
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  if (!isValidOrgNr(orgNr)) {
    return { ok: false, error: "Invalid org.nr" };
  }

  const parsed = SendSchema.safeParse({
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

  // Load the lead so we can validate email + apply placeholders.
  const { data: lead, error: leadError } = await supabase
    .from("companies")
    .select("org_nr, name, email, kommune, contact_name")
    .eq("org_nr", orgNr)
    .maybeSingle();

  if (leadError) return { ok: false, error: leadError.message };
  if (!lead) return { ok: false, error: "Lead not found" };
  if (!lead.email) {
    return { ok: false, error: "No email address on lead" };
  }

  // Hard block: email is on the suppression list.
  const suppression = await isSuppressed(lead.email);
  if (suppression.suppressed) {
    return {
      ok: false,
      error: `Addressn er suppressed (${suppression.reason}) og kan ikke kontaktes`,
    };
  }

  const [fromAddress, replyTo, siteRow, inboundDomain] = await Promise.all([
    getOutreachFromAddress(),
    getOutreachReplyTo(),
    supabase
      .from("generated_sites")
      .select("org_nr")
      .eq("org_nr", orgNr)
      .maybeSingle(),
    getInboundDomain(),
  ]);
  const firstName = lead.contact_name?.trim().split(/\s+/)[0] ?? null;
  const placeholders = {
    company_name: lead.name,
    kommune: lead.kommune,
    org_nr: lead.org_nr,
    site_url: siteRow.data ? publicSiteUrl(orgNr) : "",
    contact_name: lead.contact_name,
    contact_first_name: firstName,
  };
  const subject = applyPlaceholders(parsed.data.subject, placeholders);
  const body = applyPlaceholders(parsed.data.body, placeholders);

  // Thread the send. Re-use an open thread with the same subject so
  // follow-ups stay grouped; otherwise open a new one.
  const thread = await ensureOutboundThread({ orgNr, subject });

  // Reply-To is the operator-configured address (e.g.
  // info@kontakt.fx-media.no). We rely on RFC 5322 Message-ID +
  // In-Reply-To + References headers for thread continuity, plus
  // sender-email fallback on the inbound side — no more plus-addressed
  // Reply-To, which looked ugly in recipients' mail clients.
  const messageId = makeMessageId(inboundDomain);

  // Build References from any prior outbound messages in this thread so
  // mail clients thread the conversation natively.
  const { data: priorMessages } = await supabase
    .from("outreach_emails")
    .select("message_id, in_reply_to, references_chain")
    .eq("thread_id", thread.id)
    .order("created_at", { ascending: true });
  const priorIds = (priorMessages ?? [])
    .map((m) => m.message_id)
    .filter((v): v is string => !!v);
  const lastMessageId = priorIds[priorIds.length - 1] ?? null;
  const references = priorIds;

  // Open a row up front so we have an audit trail even if Resend errors.
  const { data: row, error: insertError } = await supabase
    .from("outreach_emails")
    .insert({
      org_nr: orgNr,
      to_email: lead.email,
      from_email: fromAddress,
      subject,
      body,
      status: "queued",
      direction: "out",
      thread_id: thread.id,
      message_id: messageId,
      in_reply_to: lastMessageId,
      references_chain: references.length > 0 ? references : null,
    })
    .select()
    .single();

  if (insertError || !row) {
    return {
      ok: false,
      error: insertError?.message ?? "Could not log send",
    };
  }

  const result = await sendEmail({
    to: lead.email,
    from: fromAddress,
    subject,
    body,
    replyTo,
    messageId,
    inReplyTo: lastMessageId ?? undefined,
    references: references.length > 0 ? references : undefined,
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

    await touchThread({ threadId: thread.id });

    await supabase.from("audit_log").insert({
      actor: "manual",
      action: "outreach.email.sent",
      entity_type: "company",
      entity_id: orgNr,
      metadata: {
        to: lead.email,
        subject,
        resend_id: result.resendId,
        thread_id: thread.id,
      },
    });

    revalidatePath(`/admin/leads/${orgNr}`);
    revalidatePath("/admin/inbox");
    return { ok: true, id: row.id };
  }

  await supabase
    .from("outreach_emails")
    .update({
      status: "failed",
      error_message: result.error ?? null,
    })
    .eq("id", row.id);

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: "outreach.email.failed",
    entity_type: "company",
    entity_id: orgNr,
    metadata: { to: lead.email, subject, error: result.error },
  });

  revalidatePath(`/admin/leads/${orgNr}`);
  return { ok: false, error: result.error ?? "Send failed" };
}

// ─── Demo site (Claude-generated landing page) ──────────────────────────────

export async function generateLeadSiteAction(
  orgNr: string,
  nicheOverride: NicheSlug | null
): Promise<ActionResult & { siteUrl?: string; niche?: NicheSlug }> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Invalid org.nr" };
  if (nicheOverride && !isNicheSlug(nicheOverride)) {
    return { ok: false, error: "Invalid niche" };
  }

  const result = await runGenerateLeadSite({
    orgNr,
    nicheOverride: nicheOverride ?? undefined,
  });

  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath(`/p/${orgNr}`);

  if (!result.ok) {
    return { ok: false, error: result.error ?? "Generation failed" };
  }
  return { ok: true, siteUrl: result.siteUrl, niche: result.niche };
}

export async function unpublishLeadSiteAction(
  orgNr: string
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Invalid org.nr" };

  const result = await unpublishLeadSite(orgNr);
  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath(`/p/${orgNr}`);
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Unpublish failed" };
  }
  return { ok: true };
}

// ─── Mark a single outreach email as replied / unreplied ────────────────────

export async function toggleEmailReplied(
  orgNr: string,
  emailId: string,
  markReplied: boolean
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Invalid org.nr" };
  if (!emailId) return { ok: false, error: "Missing email id" };

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("outreach_emails")
    .update({ replied_at: markReplied ? new Date().toISOString() : null })
    .eq("id", emailId)
    .eq("org_nr", orgNr);

  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_log").insert({
    actor: "manual",
    action: markReplied ? "outreach.email.replied" : "outreach.email.unreplied",
    entity_type: "outreach_email",
    entity_id: emailId,
    metadata: { org_nr: orgNr },
  });

  // Auto-create a deal on the first reply mark — this is the CRM intake point.
  if (markReplied) {
    await ensureDealForReply(orgNr);
  }

  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/outreach");
  revalidatePath("/admin/crm");
  return { ok: true };
}

// ─── Deal mutations from the lead detail page ───────────────────────────────

export async function createDealAction(orgNr: string): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Invalid org.nr" };
  const deal = await createManualDeal(orgNr);
  if (!deal) return { ok: false, error: "Could not create deal" };
  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function updateDealStageAction(
  orgNr: string,
  dealId: string,
  stage: DealStage,
  lostReason?: string
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Invalid org.nr" };
  if (!isValidDealStage(stage)) return { ok: false, error: "Invalid stage" };
  const deal = await setDealStage(dealId, stage, { lostReason });
  if (!deal) return { ok: false, error: "Stage change failed" };
  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function updateDealFieldsAction(
  orgNr: string,
  dealId: string,
  patch: { value_nok?: number | null; notes?: string | null }
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Invalid org.nr" };
  const deal = await updateDealFields(dealId, patch);
  if (!deal) return { ok: false, error: "Update failed" };
  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/crm");
  return { ok: true };
}
