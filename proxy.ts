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

  // These paths are locale-independent: admin stays English, the student and
  // volunteer portals are functional areas, and the special route-handler
  // files are not part of the [lang] tree.
  //
  // Prefix matching must be exact per segment: "/team" (the public
  // directory) must NOT match the "/volunteer" portal prefix.
  const isExcluded =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/volunteer" ||
    pathname.startsWith("/volunteer/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico";

  if (!isExcluded && !hasLocalePrefix(pathname)) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Visitors who land on a locale-prefixed page (typed URL or shared link)
  // get the locale cookie, so their next click on an unprefixed link stays in
  // that language instead of falling back to the browser default. Same format
  // as the language switcher writes, so the two never fight.
  if (hasLocalePrefix(pathname)) {
    const locale = pathname.split("/")[1] ?? "";
    if (isLocale(locale) && request.cookies.get("locale")?.value !== locale) {
      const response = await updateSession(request);
      response.cookies.set("locale", locale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }
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
