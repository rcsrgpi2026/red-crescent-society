import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      return NextResponse.json(
        { error: "Invalid or missing url parameter" },
        { status: 400 }
      );
    }

    // Fetch the remote asset server-side without CORS limitations
    const res = await fetch(targetUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch remote image (status ${res.status})` },
        { status: 502 }
      );
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json(
      { dataUrl },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (error: any) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
