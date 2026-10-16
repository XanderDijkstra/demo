import { MobileNav, Sidebar } from "@/components/admin/sidebar";
import { getDb } from "@/lib/db";

async function fetchInboxUnread(): Promise<number> {
  try {
    const db = getDb();
    const { data } = await db
      .from("email_threads")
      .select("unread_count")
      .eq("status", "open")
      .gt("unread_count", 0);
    return (data ?? []).reduce(
      (sum, row) => sum + (row.unread_count ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const inboxUnread = await fetchInboxUnread();
  return (
    <div className="flex flex-1">
      <Sidebar badges={{ inbox: inboxUnread }} />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileNav />
        {children}
      </div>
    </div>
  );
}
