"use client";

import { usePathname } from "next/navigation";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/components/providers/locale-provider";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";
import { stripLocalePrefix } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale } = useLocale();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    // Writing the preferred locale cookie is a deliberate DOM side effect.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const rest = stripLocalePrefix(pathname);
    const target =
      next === "en" ? (rest === "/" ? "/" : rest) : `/${next}${rest === "/" ? "" : rest}`;
    window.location.assign(target);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand-dark"
        aria-label="Change language"
      >
        <Globe className="h-3.5 w-3.5" aria-hidden />
        {localeNames[locale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {locales.map((l) => (
          <DropdownMenuItem key={l} onClick={() => switchTo(l)}>
            <span>{localeNames[l]}</span>
            {l === locale && <Check className="ml-auto h-4 w-4 text-brand" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
