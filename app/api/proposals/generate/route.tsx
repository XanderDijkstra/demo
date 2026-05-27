import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { z } from "zod";

import { advanceActiveDealStage } from "@/lib/deals";
import {
  buildProposalData,
  formatNorwegianDate,
} from "@/lib/proposals/build";
import { ProposalDocument } from "@/lib/proposals/pdf";

export const runtime = "nodejs"; // react-pdf needs Node, not Edge
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FormSchema = z.object({
  service_type: z.enum([
    "website",
    "meta_ads",
    "seo",
    "google_ads",
    "reviews",
  ]),
  client_name: z.string().trim().min(1).max(120),
  client_contact: z.string().trim().max(120).default(""),
  /** Either an ISO yyyy-MM-dd (we'll format to Norwegian) or a pre-formatted string. */
  proposal_date: z.string().trim().min(4).max(40),
  monthly_price_nok: z.coerce.number().int().min(0).max(1_000_000),
  free_setup: z.coerce.boolean().default(true),
  binding: z.string().trim().max(40).default("Ingen"),
  ad_budget: z.string().trim().max(40).optional(),
  /** Optional org.nr — when supplied, the active deal (if any) is
   *  auto-advanced to `proposal_sent` after a successful render. */
  org_nr: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Org.nr må være 9 siffer")
    .optional(),
});

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9æøåÆØÅ\-_. ]/g, "").trim() || "Tobud";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = FormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid input",
        issues: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  // Accept either yyyy-MM-dd (from <input type="date">) or pre-formatted text.
  const proposal_date = /^\d{4}-\d{2}-\d{2}$/.test(input.proposal_date)
    ? formatNorwegianDate(input.proposal_date)
    : input.proposal_date;

  const data = buildProposalData({
    service_type: input.service_type,
    client_name: input.client_name,
    client_contact: input.client_contact,
    proposal_date,
    monthly_price_nok: input.monthly_price_nok,
    free_setup: input.free_setup,
    binding: input.binding,
    ad_budget: input.ad_budget,
  });

  try {
    const buffer = await renderToBuffer(<ProposalDocument data={data} />);
    const filename = sanitizeFilename(
      `FX Media - ${data.proposal_title} - ${data.client_name}.pdf`
    );

    // Auto-advance the deal to "Proposal sent" if there's an active one.
    // No-op when no deal exists or no org_nr was passed (preview / ad-hoc).
    if (input.org_nr) {
      await advanceActiveDealStage(input.org_nr, "proposal_sent");
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "PDF-generering failed",
      },
      { status: 500 }
    );
  }
}
