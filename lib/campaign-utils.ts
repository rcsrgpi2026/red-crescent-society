import { getAppUrl } from "@/lib/constants";

/**
 * Client-safe campaign utility functions
 */

/**
 * Sanitizes and normalizes campaign button URLs, stripping typos like leading colons or trailing periods.
 */
export function sanitizeCampaignUrl(url?: string | null): string {
  if (!url) return "";
  let clean = url.trim();
  // Strip accidental leading colons, semicolons, quotes, slashes, or whitespace (e.g. ":https://...")
  clean = clean.replace(/^[:;,\s"']+/, "");
  // Strip accidental trailing periods, commas, colons, semicolons, quotes, or whitespace (e.g. "...app.")
  clean = clean.replace(/[:;,\s"'.]+$/, "");
  if (!clean) return "";

  const publicBase = "https://rgpircy.vercel.app";

  // Never send localhost or loopback links in emails over the internet
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(clean)) {
    return clean.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, publicBase);
  }

  // Relative path like "/notices"
  if (clean.startsWith("/")) {
    return `${publicBase}${clean}`;
  }

  // Absolute with protocol
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  // Domain like "rgpircy.vercel.app" or "facebook.com"
  if (clean.includes(".")) {
    return `https://${clean}`;
  }

  return `${publicBase}/${clean}`;
}
