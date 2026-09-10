import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Immediately redirect any /en or /bn links or legacy bookmarks to clean unprefixed paths
  if (
    pathname === "/en" ||
    pathname.startsWith("/en/") ||
    pathname === "/bn" ||
    pathname.startsWith("/bn/")
  ) {
    const rest = pathname.replace(/^\/(?:en|bn)/, "");
    const url = request.nextUrl.clone();
    url.pathname = rest === "" ? "/" : rest;
    const response = NextResponse.redirect(url, { status: 301 });
    response.cookies.set("locale", "en", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
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
