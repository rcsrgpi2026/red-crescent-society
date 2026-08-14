import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const ACCEPTED_LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB (matches the bucket file_size_limit)

export const ACCEPTED_IMAGE_LABEL = "PNG, JPG, WebP, GIF";

export const ACCEPTED_LOGO_LABEL = "PNG, JPG, WebP, SVG";

interface UploadOptions {
  /** Set to false to upload the raw file (only used for formats we can't re-encode). */
  compress?: boolean;
  maxDimension?: number;
}

/**
 * Uploads an image to the public "images" bucket and returns its public URL.
 * Images are compressed client-side (WebP + downscaling) before upload so the
 * public site stays fast. Throws on failure so callers can surface a friendly
 * error.
 */
export async function uploadImageToStorage(
  file: File,
  folder: string,
  options: UploadOptions = {}
): Promise<string> {
  const uploadFile =
    options.compress === false
      ? file
      : await compressImage(file, {
          maxDimension: options.maxDimension,
        });

  const supabase = createClient();
  const ext = uploadFile.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, uploadFile, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Uploads a cropped logo (already produced by the crop dialog) to the public
 * "logos" bucket and returns its public URL, including a version query string
 * so browsers never serve a stale cached logo after a change.
 */
export async function uploadLogoToStorage(
  file: File,
  slot: "rpi" | "rcs"
): Promise<string> {
  const uploadFile = await compressImage(file, { maxDimension: 1024, quality: 0.9 });

  const supabase = createClient();
  const ext = uploadFile.name.split(".").pop()?.toLowerCase() || "png";
  const path = `logos/${slot === "rpi" ? "rpi-logo" : "rcr-logo"}.${ext}`;
  const { error } = await supabase.storage.from("logos").upload(path, uploadFile, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
