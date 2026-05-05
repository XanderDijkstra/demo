import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { loadAllNiches } from "@/lib/template-store";
import { isNicheSlug, type NicheSlug } from "@/lib/templates";
import type { TemplateReference } from "@/lib/supabase/types";

import { TemplateEditor } from "./_editor";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplateEditorPage({ params }: RouteProps) {
  const { slug } = await params;
  if (!isNicheSlug(slug)) notFound();

  const supabase = getSupabaseAdmin();
  const [all, refsRes] = await Promise.all([
    loadAllNiches(),
    supabase
      .from("template_references")
      .select("*")
      .eq("niche_slug", slug)
      .order("uploaded_at", { ascending: false }),
  ]);
  const meta = all.find((n) => n.slug === slug);
  if (!meta) notFound();

  // Strip the meta fields back down to a plain NicheConfig for the form.
  const { source, updatedAt: _updatedAt, ...config } = meta;
  const references = (refsRes.data ?? []) as TemplateReference[];

  return (
    <>
      <Topbar
        title={meta.displayName}
        description={`Mal · ${meta.slug}`}
        actions={
          <Link
            href="/admin/templates"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Alle maler
          </Link>
        }
      />

      <TemplateEditor
        slug={slug as NicheSlug}
        initial={config}
        isCustomised={source === "db"}
        previewUrl={`/preview/${slug}`}
        references={references}
      />
    </>
  );
}
