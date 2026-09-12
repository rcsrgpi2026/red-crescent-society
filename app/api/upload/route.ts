import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCloudinaryConfigured, uploadBufferToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (supports both images and PDF documents)

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
  "application/pdf",
]);

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the caller (Bearer token or cookie session)
    let user = null;
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js");
      const client = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await client.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }

    if (!user) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to upload files." },
        { status: 401 }
      );
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";
    const slot = formData.get("slot") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type (${file.type}). Allowed formats: PNG, JPG, WebP, GIF, AVIF, SVG, PDF.` },
        { status: 400 }
      );
    }

    // 3. Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          fallbackToSupabase: true,
          message: "Cloudinary is not configured. Fallback to Supabase.",
        },
        { status: 200 }
      );
    }

    // 4. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Build Cloudinary options
    let publicId: string | undefined;
    let overwrite = false;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (folder === "logos" && slot) {
      publicId = slot === "rpi" ? "rpi-logo" : "rcr-logo";
      overwrite = true;
    }

    // 6. Upload to Cloudinary
    const url = await uploadBufferToCloudinary(buffer, {
      folder,
      publicId,
      overwrite,
      isPdf,
    });

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
