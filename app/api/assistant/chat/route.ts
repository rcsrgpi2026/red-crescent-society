import { NextRequest, NextResponse } from "next/server";
import { processAssistantMessage } from "@/lib/ai/service";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const { message, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    // Extract client IP address for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || "127.0.0.1";

    // Detect authenticated session if present
    let userId: string | null = null;
    let isAuthenticated = false;

    try {
      const user = await getCurrentUser();
      if (user?.id) {
        userId = user.id;
        isAuthenticated = true;
      }
    } catch {
      // Unauthenticated / public visitor
      isAuthenticated = false;
    }

    const response = await processAssistantMessage({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      userId,
      clientIp,
      isAuthenticated,
    });

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (err: any) {
    console.error("[API Assistant Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred.",
        response: {
          message:
            "দুঃখিত, এই মুহূর্তে সার্ভারে একটি ত্রুটি হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
          sourceType: "fallback",
        },
      },
      { status: 500 }
    );
  }
}
