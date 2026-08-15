"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, ChevronDown, HeartPulse, LogIn, LayoutDashboard, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SiteLogo } from "@/components/layout/site-logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useLocale } from "@/components/providers/locale-provider";
import { stripLocalePrefix } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type NavKey = keyof typeof import("@/lib/i18n/messages").messages.nav;

const NAV_LINKS: { key: NavKey; href: string; highlight?: boolean }[] = [
  { key: "team", href: "/team" },
  { key: "bloodSupport", href: "/blood-support", highlight: true },
  { key: "events", href: "/events" },
  { key: "activities", href: "/activities" },
  { key: "contact", href: "/contact" },
];

const MORE_LINKS: { key: NavKey; href: string }[] = [
  { key: "training", href: "/training" },
  { key: "gallery", href: "/gallery" },
  { key: "notices", href: "/notices" },
  { key: "emergency", href: "/emergency" },
];

export function SiteHeader({
  societyName,
  siteName,
  collegeName,
  tagline,
}: {
  /** Society short name from Admin → Settings (shown next to the logo). */
  societyName?: string;
  /** Full society name from Admin → Settings (shown in the top strip). */
  siteName?: string;
  /** College / institute name from Admin → Settings (shown under the logo). */
  collegeName?: string;
  /** Society tagline from Admin → Settings (shown in the top strip). */
  tagline?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string | null } | null>(null);
  const pathname = usePathname();
  const { t } = useLocale();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();
        setCurrentUser({ id: session.user.id, role: profile?.role ?? null });
      } else {
        setCurrentUser(null);
      }
    }
    loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser();
      } else {
        setCurrentUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const isActive = (href: string) => {
    const p = stripLocalePrefix(pathname);
    if (href === "/") return p === "/";
    return p.startsWith(href);
  };

  const isStaff =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "VOLUNTEER_MANAGER" ||
    currentUser?.role === "EVENT_MANAGER" ||
    currentUser?.role === "CONTENT_MANAGER";

  const dashboardHref = isStaff
    ? "/admin"
    : currentUser?.role === "STUDENT"
      ? "/student"
      : "/volunteer";

  const dashboardLabel = isStaff
    ? "Admin Dashboard"
    : currentUser?.role === "STUDENT"
      ? "Student Portal"
      : "Team Member Portal";

  return (
    <header className="sticky top-0 z-50">
      {/* Top strip */}
      <div className="bg-brand-dark text-white">
        <div className="container-site flex h-9 items-center justify-between text-xs">
          <p className="min-w-0 truncate font-medium tracking-wide">
            {tagline ?? siteName ?? t.meta.siteName}
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <span className="flex items-center gap-1.5 text-white/90">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span>{t.nav.emergencyStrip}</span>
            </span>
            <Link
              href="/emergency"
              className="flex items-center gap-1.5 rounded-full bg-crescent px-3 py-0.5 font-semibold text-white transition-colors hover:bg-crescent-dark"
            >
              <HeartPulse className="h-3.5 w-3.5" aria-hidden />
              {t.nav.emergency}
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={cn(
          "border-b bg-white transition-shadow",
          scrolled ? "border-line shadow-sm" : "border-transparent"
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          {/* Identity */}
          <Link href="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={t.nav.home}>
            <SiteLogo variant="institute" className="hidden w-8 shrink-0 sm:block sm:w-10" />
            <span className="hidden h-9 w-px bg-line sm:block" aria-hidden />
            <span className="flex min-w-0 items-center gap-2">
              <SiteLogo variant="society" className="w-8 shrink-0 sm:w-9" />
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13px] font-bold text-brand-dark sm:text-base">
                  {societyName ?? t.nav.redCrescentSociety}
                </span>
                <span className="hidden truncate text-[11px] font-medium text-muted-foreground sm:block">
                  {collegeName ?? t.nav.rajshahiPolytechnic}
                </span>
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  item.highlight
                    ? "text-crescent hover:bg-crescent-soft"
                    : "text-foreground/80 hover:bg-mist hover:text-brand-dark",
                  isActive(item.href) && (item.highlight ? "bg-crescent-soft" : "bg-mist text-brand-dark")
                )}
              >
                {t.nav[item.key]}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-0.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-mist hover:text-brand-dark">
                {t.nav.more}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {MORE_LINKS.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>{t.nav[item.key]}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {currentUser ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild size="sm" variant="outline" className="gap-1.5 border-line">
                  <Link href={dashboardHref}>
                    {isStaff ? <LayoutDashboard className="h-4 w-4 text-brand" /> : <User className="h-4 w-4 text-brand" />}
                    {dashboardLabel}
                  </Link>
                </Button>
                <SignOutButton size="sm" variant="ghost" className="text-muted-foreground hover:text-crescent" />
              </div>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-lg border-line"
                      aria-label={t.nav.login}
                    >
                      <LogIn className="h-4.5 w-4.5" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem asChild>
                      <Link href="/student/login">{t.nav.studentPortal}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/volunteer/login">{t.nav.volunteerPortal}</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/volunteer/login">{t.nav.joinUs}</Link>
                </Button>
              </>
            )}

            {/* Mobile menu */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="xl:hidden"
                  aria-label={t.nav.openMenu}
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[20rem] p-0">
                <SheetHeader className="border-b px-5 py-4">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <SiteLogo variant="society" className="w-8" />
                    <span className="whitespace-nowrap text-sm leading-tight text-brand-dark">
                      {societyName ?? t.nav.redCrescentSociety}
                      <span className="block whitespace-nowrap text-[11px] font-normal text-muted-foreground">
                        {collegeName ?? t.nav.rajshahiPolytechnic}
                      </span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
                  <MobileLink
                    href="/"
                    label={t.nav.home}
                    onActive={isActive("/")}
                    onClick={() => setMenuOpen(false)}
                  />
                  {NAV_LINKS.map((item) => (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      label={t.nav[item.key]}
                      onActive={isActive(item.href)}
                      highlight={item.highlight}
                      onClick={() => setMenuOpen(false)}
                    />
                  ))}
                  {MORE_LINKS.map((item) => (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      label={t.nav[item.key]}
                      onActive={isActive(item.href)}
                      onClick={() => setMenuOpen(false)}
                    />
                  ))}
                  <div className="mt-3">
                    <LanguageSwitcher />
                  </div>

                  {currentUser ? (
                    <div className="mt-4 space-y-2 border-t border-line pt-4">
                      <Button asChild size="lg" className="w-full">
                        <Link href={dashboardHref} onClick={() => setMenuOpen(false)}>
                          {dashboardLabel}
                        </Link>
                      </Button>
                      <SignOutButton className="w-full justify-center" />
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2 border-t border-line pt-4">
                      <Button asChild size="lg" className="w-full">
                        <Link href="/volunteer/login" onClick={() => setMenuOpen(false)}>
                          {t.nav.joinUs}
                        </Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="w-full">
                        <Link href="/student/login" onClick={() => setMenuOpen(false)}>
                          {t.nav.studentPortal}
                        </Link>
                      </Button>
                    </div>
                  )}

                  <Button asChild size="lg" variant="destructive" className="mt-2">
                    <Link href="/emergency" onClick={() => setMenuOpen(false)}>
                      {t.nav.emergencySupport}
                    </Link>
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileLink({
  href,
  label,
  onActive,
  highlight,
  onClick,
}: {
  href: string;
  label: string;
  onActive: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        highlight ? "text-crescent" : "text-foreground/85",
        onActive ? "bg-mist text-brand-dark" : "hover:bg-mist"
      )}
    >
      {label}
    </Link>
  );
}
