import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
];

export const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ACCEPTED_IMAGE_LABEL = "PNG, JPG, WebP, GIF, PDF";

export const ACCEPTED_LOGO_LABEL = "PNG, JPG, WebP, SVG";

interface UploadOptions {
  /** Set to false to upload the raw file (only used for formats we can't re-encode). */
  compress?: boolean;
  maxDimension?: number;
}

/**
 * Fallback to direct Supabase storage upload if Cloudinary is not configured.
 */
async function uploadToSupabaseImages(file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const path = `${sanitizedFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Fallback to direct Supabase storage logo upload if Cloudinary is not configured.
 */
async function uploadToSupabaseLogos(file: File, slot: "rpi" | "rcs"): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const path = `logos/${slot === "rpi" ? "rpi-logo" : "rcr-logo"}.${ext}`;
  const { error } = await supabase.storage.from("logos").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/**
 * Uploads an image or PDF. Prioritizes Cloudinary (via /api/upload) and seamlessly falls back
 * to Supabase storage if Cloudinary is not configured.
 *
 * Images are compressed client-side (WebP + downscaling) before upload so the
 * upload and delivery stay fast. PDFs are uploaded raw.
 */
export async function uploadImageToStorage(
  file: File,
  folder: string,
  options: UploadOptions = {}
): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type (${file.type || "unknown"}). Allowed formats: ${ACCEPTED_IMAGE_LABEL}.`);
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  const uploadFile =
    options.compress === false || isPdf
      ? file
      : await compressImage(file, {
          maxDimension: options.maxDimension,
        });

  try {
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("folder", folder);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
      if (data.fallbackToSupabase) {
        return await uploadToSupabaseImages(uploadFile, folder);
      }
    } else {
      const errData = await res.json().catch(() => null);
      // If 401 (unauthorized) or specific error, throw
      if (res.status === 401) {
        throw new Error(errData?.error || "Authentication required to upload images");
      }
      console.warn("Cloudinary upload failed, falling back to Supabase storage:", errData?.error);
    }
  } catch (err: any) {
    // If it was an auth error, rethrow
    if (err?.message?.includes("Authentication required")) {
      throw err;
    }
    console.warn("API upload failed, attempting Supabase fallback:", err);
  }

  // Fallback to Supabase
  return await uploadToSupabaseImages(uploadFile, folder);
}

/**
 * Uploads a cropped logo to Cloudinary with fallback to Supabase logos bucket.
 */
export async function uploadLogoToStorage(
  file: File,
  slot: "rpi" | "rcs"
): Promise<string> {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`Logo file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 5 MB.`);
  }

  if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
    throw new Error(`Invalid logo file type. Allowed formats: ${ACCEPTED_LOGO_LABEL}.`);
  }

  const uploadFile = await compressImage(file, { maxDimension: 1024, quality: 0.9 });

  try {
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("folder", "logos");
    formData.append("slot", slot);

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      headers,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
      if (data.fallbackToSupabase) {
        return await uploadToSupabaseLogos(uploadFile, slot);
      }
    } else {
      const errData = await res.json().catch(() => null);
      if (res.status === 401) {
        throw new Error(errData?.error || "Authentication required to upload logos");
      }
      console.warn("Cloudinary logo upload failed, falling back to Supabase:", errData?.error);
    }
  } catch (err: any) {
    if (err?.message?.includes("Authentication required")) {
      throw err;
    }
    console.warn("API logo upload failed, attempting Supabase fallback:", err);
  }

  // Fallback to Supabase
  return await uploadToSupabaseLogos(uploadFile, slot);
}
