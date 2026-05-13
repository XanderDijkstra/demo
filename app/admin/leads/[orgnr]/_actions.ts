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
  applyPlaceholders,
  getOutreachFromAddress,
  getOutreachReplyTo,
  isSuppressed,
  sendOutreachEmail,
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
    return { ok: false, error: "Ugyldig org.nr" };
  }
  if (!VALID_STATUSES.includes(status)) {
    return { ok: false, error: "Ugyldig status" };
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
    return { ok: false, error: "Ugyldig org.nr" };
  }

  let normalized: string | null;
  if (name == null || name.trim() === "") {
    normalized = null;
  } else {
    const parsed = ContactNameSchema.safeParse(name);
    if (!parsed.success) return { ok: false, error: "Ugyldig navn" };
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
    return { ok: false, error: "Ugyldig org.nr", fetchedUrls: [] };
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
    return { ok: false, error: "Lead ikke funnet", fetchedUrls: [] };
  }
  if (!lead.website) {
    return {
      ok: false,
      error: "Ingen nettside å skrape — legg til hjemmeside først",
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
    return { ok: false, error: "Ugyldig org.nr" };
  }

  let normalized: string | null;
  if (email == null || email.trim() === "") {
    normalized = null;
  } else {
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) return { ok: false, error: "Ugyldig e-postadresse" };
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
  subject: z.string().trim().min(1, "Emne mangler").max(998),
  body: z.string().trim().min(1, "Innhold mangler").max(50_000),
});

export async function sendLeadEmail(
  orgNr: string,
  formData: FormData
): Promise<ActionResult & { id?: string }> {
  if (!isValidOrgNr(orgNr)) {
    return { ok: false, error: "Ugyldig org.nr" };
  }

  const parsed = SendSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Ugyldig input",
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
  if (!lead) return { ok: false, error: "Lead ikke funnet" };
  if (!lead.email) {
    return { ok: false, error: "Ingen e-postadresse på leadet" };
  }

  // Hard block: email is on the suppression list.
  const suppression = await isSuppressed(lead.email);
  if (suppression.suppressed) {
    return {
      ok: false,
      error: `Adressen er suppressed (${suppression.reason}) og kan ikke kontaktes`,
    };
  }

  const [fromAddress, replyTo, siteRow] = await Promise.all([
    getOutreachFromAddress(),
    getOutreachReplyTo(),
    supabase
      .from("generated_sites")
      .select("org_nr")
      .eq("org_nr", orgNr)
      .maybeSingle(),
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
    })
    .select()
    .single();

  if (insertError || !row) {
    return {
      ok: false,
      error: insertError?.message ?? "Kunne ikke logge utsendelse",
    };
  }

  const result = await sendOutreachEmail({
    to: lead.email,
    from: fromAddress,
    subject,
    body,
    replyTo,
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

    await supabase.from("audit_log").insert({
      actor: "manual",
      action: "outreach.email.sent",
      entity_type: "company",
      entity_id: orgNr,
      metadata: { to: lead.email, subject, resend_id: result.resendId },
    });

    revalidatePath(`/admin/leads/${orgNr}`);
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
  return { ok: false, error: result.error ?? "Send feilet" };
}

// ─── Demo site (Claude-generated landing page) ──────────────────────────────

export async function generateLeadSiteAction(
  orgNr: string,
  nicheOverride: NicheSlug | null
): Promise<ActionResult & { siteUrl?: string; niche?: NicheSlug }> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Ugyldig org.nr" };
  if (nicheOverride && !isNicheSlug(nicheOverride)) {
    return { ok: false, error: "Ugyldig niche" };
  }

  const result = await runGenerateLeadSite({
    orgNr,
    nicheOverride: nicheOverride ?? undefined,
  });

  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath(`/p/${orgNr}`);

  if (!result.ok) {
    return { ok: false, error: result.error ?? "Generering feilet" };
  }
  return { ok: true, siteUrl: result.siteUrl, niche: result.niche };
}

export async function unpublishLeadSiteAction(
  orgNr: string
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Ugyldig org.nr" };

  const result = await unpublishLeadSite(orgNr);
  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath(`/p/${orgNr}`);
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Avpublisering feilet" };
  }
  return { ok: true };
}

// ─── Mark a single outreach email as replied / unreplied ────────────────────

export async function toggleEmailReplied(
  orgNr: string,
  emailId: string,
  markReplied: boolean
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Ugyldig org.nr" };
  if (!emailId) return { ok: false, error: "Mangler email-id" };

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
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Ugyldig org.nr" };
  const deal = await createManualDeal(orgNr);
  if (!deal) return { ok: false, error: "Kunne ikke opprette deal" };
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
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Ugyldig org.nr" };
  if (!isValidDealStage(stage)) return { ok: false, error: "Ugyldig stage" };
  const deal = await setDealStage(dealId, stage, { lostReason });
  if (!deal) return { ok: false, error: "Stage-endring feilet" };
  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/crm");
  return { ok: true };
}

export async function updateDealFieldsAction(
  orgNr: string,
  dealId: string,
  patch: { value_nok?: number | null; notes?: string | null }
): Promise<ActionResult> {
  if (!isValidOrgNr(orgNr)) return { ok: false, error: "Ugyldig org.nr" };
  const deal = await updateDealFields(dealId, patch);
  if (!deal) return { ok: false, error: "Oppdatering feilet" };
  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/crm");
  return { ok: true };
}
