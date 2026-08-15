"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Handshake,
  Network,
  Droplets,
  HeartPulse,
  CalendarDays,
  HandHeart,
  Megaphone,
  Images,
  GraduationCap,
  Award,
  ClipboardCheck,
  MessageSquare,
  Settings,
  ScrollText,
  LogOut,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SiteLogo } from "@/components/layout/site-logo";
import { UnreadDot } from "@/components/admin/unread-dot";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Volunteers", href: "/admin/volunteers", icon: Users },
  { label: "Students", href: "/admin/students", icon: GraduationCap },
  { label: "Team", href: "/admin/team", icon: UserCog },
  { label: "Founders", href: "/admin/founders", icon: Handshake },
  { label: "Community", href: "/admin/community", icon: Network },
  { label: "Blood Donors", href: "/admin/donors", icon: Droplets },
  { label: "Blood Requests", href: "/admin/blood-requests", icon: HeartPulse },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Activities", href: "/admin/activities", icon: HandHeart },
  { label: "Notices", href: "/admin/notices", icon: Megaphone },
  { label: "Gallery", href: "/admin/gallery", icon: Images },
  { label: "Training", href: "/admin/training", icon: GraduationCap },
  { label: "Certificates", href: "/admin/certificates", icon: Award },
  { label: "Attendance", href: "/admin/attendance", icon: ClipboardCheck },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
];

/**
 * The admin sidebar content. Renders as a full-height column:
 *
 *   Header (logo + title + optional close button)
 *   Navigation (the only scrollable area)
 *   Footer (view website / sign out)
 *
 * `onClose` is provided by the mobile drawer; when present a close button is
 * shown at the top-right of the header (mobile only).
 */
export function AdminSidebar({
  onClose,
  unreadMessages = 0,
}: {
  onClose?: () => void;
  unreadMessages?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-gradient-to-b from-brand-dark to-[#043c28] text-white">
      {/* Decorative glow */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-crescent/10 blur-3xl"
        aria-hidden
      />

      {/* Header */}
      <div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <SiteLogo variant="society" className="w-9 shrink-0" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-bold text-white">Society Admin</p>
          <p className="truncate text-[11px] text-white/60">RPI Red Crescent</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/10 p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Scrollable navigation — the only scroll container in the sidebar */}
      <nav
        className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
        aria-label="Admin navigation"
      >
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-brand-soft text-brand-ink shadow-lg shadow-black/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <span
                  className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-crescent"
                  aria-hidden
                />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-200",
                  !active && "group-hover:scale-110 group-hover:text-brand-soft"
                )}
                aria-hidden
              />
              {item.label}
              {item.href === "/admin/messages" && (
                <UnreadDot initialCount={unreadMessages} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative shrink-0 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          View website
        </Link>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-crescent transition-colors hover:bg-white/5 disabled:opacity-60"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden />
          )}
          Sign out
        </button>
      </div>
    </div>
  );
}

/**
 * Mobile off-canvas drawer. Mounted only while open, so the drawer starts
 * fully outside the viewport (it is not rendered at all) and slides in from
 * the left on mount. The backdrop closes it on click.
 *
 * Rendered through a portal to <body> on purpose: the topbar header uses
 * `backdrop-blur`, and `backdrop-filter` makes that header a containing
 * block for `position: fixed` descendants — which would otherwise shrink
 * the drawer to the header's height instead of the viewport.
 */
export function MobileAdminNav({
  onClose,
  unreadMessages = 0,
}: {
  onClose: () => void;
  unreadMessages?: number;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Admin menu"
    >
      {/* Backdrop */}
      <button
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in bg-black/50 backdrop-blur-sm"
        aria-label="Close menu"
      />
      {/* Drawer panel */}
      <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] animate-in slide-in-from-left duration-300 ease-out shadow-2xl">
        <AdminSidebar onClose={onClose} unreadMessages={unreadMessages} />
      </div>
    </div>,
    document.body
  );
}
