"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, ChevronDown, HeartPulse } from "lucide-react";
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
import { useLocale } from "@/components/providers/locale-provider";
import { stripLocalePrefix } from "@/lib/i18n";

type NavKey = keyof typeof import("@/lib/i18n/messages").messages.nav;

const NAV_LINKS: { key: NavKey; href: string; highlight?: boolean }[] = [
  { key: "about", href: "/about" },
  { key: "community", href: "/community" },
  { key: "volunteers", href: "/volunteers" },
  { key: "bloodSupport", href: "/blood-support", highlight: true },
  { key: "events", href: "/events" },
  { key: "activities", href: "/activities" },
  { key: "contact", href: "/contact" },
];

const MORE_LINKS: { key: NavKey; href: string }[] = [
  { key: "training", href: "/training" },
  { key: "team", href: "/about#team" },
  { key: "gallery", href: "/gallery" },
  { key: "notices", href: "/notices" },
  { key: "emergency", href: "/emergency" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { t } = useLocale();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    const p = stripLocalePrefix(pathname);
    if (href === "/") return p === "/";
    return p.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top strip */}
      <div className="bg-brand-dark text-white">
        <div className="container-site flex h-9 items-center justify-between text-xs">
          <p className="min-w-0 truncate font-medium tracking-wide">{t.meta.siteName}</p>
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
          "border-b bg-white/95 backdrop-blur transition-shadow",
          scrolled ? "border-line shadow-sm" : "border-transparent"
        )}
      >
        <div className="container-site flex h-16 items-center justify-between gap-4 lg:h-[4.5rem]">
          {/* Identity */}
          <Link href="/" className="flex items-center gap-3" aria-label={t.nav.home}>
            <SiteLogo variant="institute" className="w-10" />
            <span className="hidden h-9 w-px bg-line md:block" aria-hidden />
            <span className="flex items-center gap-2.5">
              <SiteLogo variant="society" className="w-9" />
              <span className="leading-tight">
                <span className="block whitespace-nowrap text-sm font-bold text-brand-dark sm:text-base">
                  {t.nav.redCrescentSociety}
                </span>
                <span className="hidden whitespace-nowrap text-[11px] font-medium text-muted-foreground sm:block">
                  {t.nav.rajshahiPolytechnic}
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
            <LanguageSwitcher />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/join">{t.nav.joinUs}</Link>
            </Button>

            {/* Mobile menu */}
            <Sheet>
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
                      {t.nav.redCrescentSociety}
                      <span className="block whitespace-nowrap text-[11px] font-normal text-muted-foreground">
                        {t.nav.rajshahiPolytechnic}
                      </span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
                  <MobileLink href="/" label={t.nav.home} onActive={isActive("/")} />
                  {NAV_LINKS.map((item) => (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      label={t.nav[item.key]}
                      onActive={isActive(item.href)}
                      highlight={item.highlight}
                    />
                  ))}
                  {MORE_LINKS.map((item) => (
                    <MobileLink
                      key={item.href}
                      href={item.href}
                      label={t.nav[item.key]}
                      onActive={isActive(item.href)}
                    />
                  ))}
                  <div className="mt-3">
                    <LanguageSwitcher />
                  </div>
                  <Button asChild size="lg" className="mt-3">
                    <Link href="/join">{t.nav.joinUs}</Link>
                  </Button>
                  <Button asChild size="lg" variant="destructive" className="mt-2">
                    <Link href="/emergency">{t.nav.emergencySupport}</Link>
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
}: {
  href: string;
  label: string;
  onActive: boolean;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
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
