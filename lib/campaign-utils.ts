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

  // Relative path like "/notices"
  if (clean.startsWith("/")) {
    const base = getAppUrl();
    return `${base}${clean}`;
  }

  // Absolute with protocol
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  // Domain like "rgpircy.vercel.app" or "facebook.com"
  if (clean.includes(".")) {
    return `https://${clean}`;
  }

  const base = getAppUrl();
  return `${base}/${clean}`;
}
