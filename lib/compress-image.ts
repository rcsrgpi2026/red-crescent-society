/**
 * Client-side image compression for uploads — every admin-uploaded photo is
 * re-encoded as WebP (smaller than JPEG/PNG, alpha supported) and scaled down
 * to at most `maxDimension`, so pages stay fast. Uses the browser's canvas,
 * so there is no server cost and no extra dependency.
 *
 * Formats that can't be safely re-encoded (animated GIF, AVIF) are returned
 * unchanged.
 */

export interface CompressOptions {
  /** Longest edge in pixels after compression. */
  maxDimension?: number;
  /** WebP quality 0–1. */
  quality?: number;
}

const RECOMPRESSABLE = ["image/png", "image/jpeg", "image/webp"] as const;

export function canCompress(type: string): boolean {
  return (RECOMPRESSABLE as readonly string[]).includes(type);
}

/**
 * Returns a compressed File when the source is larger than the WebP output,
 * otherwise returns the original File untouched.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const { maxDimension = 1600, quality = 0.8 } = options;

  if (!canCompress(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      );
      if (!blob || blob.size >= file.size) return file;

      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      return new File([blob], `${base}.webp`, { type: "image/webp" });
    } finally {
      bitmap.close();
    }
  } catch {
    // Some browsers can't decode certain images via createImageBitmap —
    // upload the original instead of failing.
    return file;
  }
}
