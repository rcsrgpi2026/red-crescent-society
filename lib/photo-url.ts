/**
 * Resolves a stored photo value into a browser-loadable URL.
 *
 * The database may hold either a complete URL or a bare storage path:
 * - "https://<project>.supabase.co/storage/v1/object/public/images/community/x.webp"
 *   → returned as-is.
 * - "community/x.webp" (or "/community/x.webp" / "images/community/x.webp" /
 *   "storage/v1/object/public/images/community/x.webp") → resolved against the
 *   configured project's public "images" bucket. This happens when an admin
 *   pastes a bucket path instead of a full URL.
 *
 * Returns null for empty values so callers fall back to the initials/avatar
 * placeholder instead of rendering a broken image.
 */
export function resolvePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  const value = photoUrl.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  if (!supabaseUrl) return value;

  let path = value.startsWith("/") ? value.slice(1) : value;
  // Accept an already-absolute storage path without the host, e.g.
  // "storage/v1/object/public/images/community/x.webp".
  if (path.startsWith("storage/v1/object/public/")) {
    path = path.slice("storage/v1/object/public/".length);
  }
  // Avoid duplicating the bucket segment: "images/community/x.webp" → "community/x.webp".
  if (path.startsWith("images/")) {
    path = path.slice("images/".length);
  }
  return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
}
