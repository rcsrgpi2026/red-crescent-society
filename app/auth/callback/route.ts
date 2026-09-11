import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/reset-password";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    console.error("[Auth Callback] Error received:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/forgot-password?error=${encodeURIComponent(
          errorDescription || error
        )}`,
        request.url
      )
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    console.error(
      "[Auth Callback] exchangeCodeForSession failed:",
      exchangeError.message
    );
    return NextResponse.redirect(
      new URL(
        `/forgot-password?error=${encodeURIComponent(exchangeError.message)}`,
        request.url
      )
    );
  }

  // If no code is present in query parameters, fallback to the intended destination.
  return NextResponse.redirect(new URL(next, request.url));
}
