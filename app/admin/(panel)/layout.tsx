import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { ROLE_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  if (!profile) redirect("/admin/login");
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  return (
    <div className="min-h-screen bg-mist/60">
      {/* Desktop sidebar — fixed left navigation panel */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-white/10 lg:block">
        <AdminSidebar />
      </aside>

      {/* Main column — offset by the sidebar width on desktop */}
      <div className="min-h-screen lg:pl-[264px]">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 shadow-sm shadow-black/[0.03] backdrop-blur sm:px-6">
          {/* Brand gradient hairline */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand via-crescent to-poly"
            aria-hidden
          />
          <div className="flex items-center gap-3">
            <AdminMobileNav />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-foreground">Management Dashboard</p>
              <p className="text-xs text-muted-foreground">
                Rajshahi Polytechnic Institute Red Crescent Society
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="hidden items-center gap-1.5 border-brand/20 bg-brand-soft text-brand-ink sm:inline-flex"
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {roleLabel}
            </Badge>
            <Link
              href="/admin/settings"
              className="text-xs font-semibold text-brand hover:underline"
            >
              Settings
            </Link>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
