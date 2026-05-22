import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Topbar } from "@/components/admin/topbar";
import { loadAllNiches } from "@/lib/template-store";
import { isNicheSlug } from "@/lib/templates";

import { TemplateViewer } from "./_viewer";

export const dynamic = "force-dynamic";

interface RouteProps {
  params: Promise<{ slug: string }>;
}

export default async function TemplateViewerPage({ params }: RouteProps) {
  const { slug } = await params;
  if (!isNicheSlug(slug)) notFound();

  const all = await loadAllNiches();
  const meta = all.find((n) => n.slug === slug);
  if (!meta) notFound();

  const { source: _source, updatedAt: _updatedAt, ...config } = meta;

  return (
    <>
      <Topbar
        title={meta.displayName}
        description={`Template · ${meta.slug}`}
        actions={
          <Link
            href="/admin/templates"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All maler
          </Link>
        }
      />

      <TemplateViewer niche={config} previewUrl={`/preview/${slug}`} />
    </>
  );
}
