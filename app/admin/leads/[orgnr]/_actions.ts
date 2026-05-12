"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  runGenerateLeadSite,
  unpublishLeadSite,
  publicSiteUrl,
} from "@/lib/jobs/generate-site";
import {
  applyPlaceholders,
  getOutreachFromAddress,
  getOutreachReplyTo,
  isSuppressed,
  sendOutreachEmail,
} from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { CompanyStatus } from "@/lib/supabase/types";
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
    .select("org_nr, name, email, kommune")
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
  const placeholders = {
    company_name: lead.name,
    kommune: lead.kommune,
    org_nr: lead.org_nr,
    site_url: siteRow.data ? publicSiteUrl(orgNr) : "",
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

  revalidatePath(`/admin/leads/${orgNr}`);
  revalidatePath("/admin/outreach");
  return { ok: true };
}
