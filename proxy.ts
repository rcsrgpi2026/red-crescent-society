import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  defaultLocale,
  hasLocalePrefix,
  isLocale,
} from "@/lib/i18n/config";

/**
 * Preferred locale: the language switcher's cookie first, then the browser's
 * Accept-Language, then the default ("en").
 */
function getPreferredLocale(request: NextRequest): string {
  const cookie = request.cookies.get("locale")?.value;
  if (isLocale(cookie)) return cookie;

  const acceptLang = request.headers.get("accept-language") ?? "";
  for (const part of acceptLang.split(",")) {
    const code = part.trim().split(";")[0].slice(0, 2);
    if (isLocale(code)) return code;
  }

  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // These paths are locale-independent: admin stays English, and the special
  // route-handler files are not part of the [lang] tree.
  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico";

  if (!isExcluded && !hasLocalePrefix(pathname)) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, images and the Next.js
     * internal routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
