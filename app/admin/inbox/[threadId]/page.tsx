import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Deep-link compatibility shim. The inbox is now a single page with
 * the thread loaded inline via `?thread=<id>` — this redirects the old
 * /admin/inbox/[threadId] route into the new search-param URL.
 */
export default async function ThreadDeepLinkPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/admin/inbox?thread=${encodeURIComponent(threadId)}`);
}
