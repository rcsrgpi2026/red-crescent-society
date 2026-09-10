import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  defaultLocale,
  hasLocalePrefix,
  isLocale,
} from "@/lib/i18n/config";

/**
 * Preferred locale: locked to English as the primary site language.
 */
function getPreferredLocale(_request: NextRequest): string {
  return defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Immediately redirect any /bn links or legacy bookmarks to /en
  if (pathname === "/bn" || pathname.startsWith("/bn/")) {
    const rest = pathname.replace(/^\/bn/, "");
    const url = request.nextUrl.clone();
    url.pathname = `/en${rest === "" ? "" : rest}`;
    const response = NextResponse.redirect(url, { status: 301 });
    response.cookies.set("locale", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  // These paths are locale-independent: admin stays English, the student and
  // volunteer portals are functional areas, and the special route-handler
  // files are not part of the [lang] tree.
  //
  // Prefix matching must be exact per segment: "/team" (the public
  // directory) must NOT match the "/volunteer" portal prefix.
  const isExcluded =
    pathname.startsWith("/api/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/student" ||
    pathname.startsWith("/student/") ||
    pathname === "/volunteer" ||
    pathname.startsWith("/volunteer/") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js";

  if (!isExcluded && !hasLocalePrefix(pathname)) {
    const locale = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // Ensure any visitor's stale 'bn' cookie is reset to 'en'
  if (request.cookies.get("locale")?.value === "bn") {
    const response = await updateSession(request);
    response.cookies.set("locale", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets, images and the Next.js
     * internal routes.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|json|js)$).*)",
  ],
};
