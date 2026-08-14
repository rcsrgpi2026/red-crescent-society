import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

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

  // Exact per-segment matching: "/volunteers" (public directory) is NOT the
  // "/volunteer" portal area, and "/admins"/"/students" don't exist anyway.
  const isAdminArea =
    (pathname === "/admin" || pathname.startsWith("/admin/")) &&
    pathname !== "/admin/login";
  const isStudentArea =
    (pathname === "/student" || pathname.startsWith("/student/")) &&
    pathname !== "/student/login";
  const isVolunteerArea =
    (pathname === "/volunteer" || pathname.startsWith("/volunteer/")) &&
    pathname !== "/volunteer/login";

  // Protect the admin, student and volunteer areas.
  if ((isAdminArea || isStudentArea || isVolunteerArea) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdminArea
      ? "/admin/login"
      : isStudentArea
        ? "/student/login"
        : "/volunteer/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Signed-in users don't need a login page — send them to their own area.
  const isLoginPage =
    pathname === "/admin/login" ||
    pathname === "/student/login" ||
    pathname === "/volunteer/login";
  if (isLoginPage && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;

    let home = "/admin";
    if (role === "STUDENT") home = "/student";
    else if (role === "VOLUNTEER") home = "/volunteer";

    const url = request.nextUrl.clone();
    url.pathname = home;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
