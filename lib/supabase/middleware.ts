import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isLocale } from "@/lib/i18n/config";

export async function updateSession(request: NextRequest) {
  // Without Supabase credentials there is no session to refresh — let requests
  // through and the app renders its empty states / setup notices.
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and
  // supabase.auth.getUser() — a simple mistake can break the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Safe redirect for deprecated separate admin login route
  if (pathname === "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/volunteer/login";
    return NextResponse.redirect(url);
  }

  // Exact per-segment matching: "/team" (now admin-only) is NOT the
  // "/volunteer" portal area, and "/admins"/"/students" don't exist anyway.
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const isStudentArea =
    (pathname === "/student" || pathname.startsWith("/student/")) &&
    pathname !== "/student/login";
  const isVolunteerArea =
    (pathname === "/volunteer" || pathname.startsWith("/volunteer/")) &&
    pathname !== "/volunteer/login";

  // The team directory is admin-only. Strip the locale segment so "/team"
  // and "/:locale/team" are matched the same way.
  const segments = pathname.split("/").filter(Boolean);
  const hasLocale = segments.length > 0 && isLocale(segments[0]);
  const basePath = hasLocale ? `/${segments[0]}` : "/";
  const teamRest = (hasLocale ? segments.slice(1) : segments).join("/");
  const isTeamArea = teamRest === "team" || teamRest.startsWith("team/");

  // Protect the admin, student and volunteer areas.
  if ((isAdminArea || isStudentArea || isVolunteerArea) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = isStudentArea ? "/student/login" : "/volunteer/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged-out visitors are sent home from the team directory.
  if (isTeamArea && !user) {
    const url = request.nextUrl.clone();
    url.pathname = basePath;
    return NextResponse.redirect(url);
  }

  // Role-based protection for authenticated users
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;
    const isStaff =
      role === "SUPER_ADMIN" ||
      role === "ADMIN" ||
      role === "VOLUNTEER_MANAGER" ||
      role === "EVENT_MANAGER" ||
      role === "CONTENT_MANAGER";

    // Signed-in users don't need a login page — send them to their own area.
    const isLoginPage =
      pathname === "/admin/login" ||
      pathname === "/student/login" ||
      pathname === "/volunteer/login";

    if (isLoginPage) {
      let home = isStaff ? "/admin" : role === "STUDENT" ? "/student" : "/volunteer";
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    // Protect admin area from non-staff roles
    if (isAdminArea && !isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = role === "STUDENT" ? "/student" : "/volunteer";
      return NextResponse.redirect(url);
    }

    // Team directory is admin-only — students and volunteers are sent to
    // their own portal.
    if (isTeamArea && !isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = role === "STUDENT" ? "/student" : "/volunteer";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
