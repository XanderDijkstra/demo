import { MobileNav, Sidebar } from "@/components/admin/sidebar";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

async function fetchInboxUnread(): Promise<number> {
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
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
