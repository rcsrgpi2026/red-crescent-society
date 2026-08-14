import { createClient } from "@/lib/supabase/client";

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB (matches the bucket file_size_limit)

export const ACCEPTED_IMAGE_LABEL = "PNG, JPG, WebP, GIF";

/**
 * Uploads an image to the public "images" bucket and returns its public URL.
 * Throws on failure so callers can surface a friendly error.
 */
export async function uploadImageToStorage(file: File, folder: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}
