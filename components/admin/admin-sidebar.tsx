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
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SiteLogo } from "@/components/layout/site-logo";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Volunteers", href: "/admin/volunteers", icon: Users },
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

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
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
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <SiteLogo variant="society" className="w-9" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-brand-dark">Society Admin</p>
          <p className="truncate text-[11px] text-muted-foreground">RPI Red Crescent</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted-foreground hover:bg-mist hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-mist hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          View website
        </Link>
        <button
          onClick={signOut}
          disabled={signingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-crescent transition-colors hover:bg-crescent-soft disabled:opacity-60"
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

export function MobileAdminNav({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-4 z-10 rounded-full bg-mist p-1.5 text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        <AdminSidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
