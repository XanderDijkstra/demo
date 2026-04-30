import { MobileNav, Sidebar } from "@/components/admin/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <MobileNav />
        {children}
      </div>
    </div>
  );
}
