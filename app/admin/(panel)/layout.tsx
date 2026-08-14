import Link from "next/link";
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
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  return (
    <div className="min-h-screen bg-mist/60">
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line lg:block">
          <AdminSidebar />
        </aside>

        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
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
    </div>
  );
}
