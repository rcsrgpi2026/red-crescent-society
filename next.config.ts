import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Browser API endpoints (Supabase REST + realtime websocket). Derived from the
// existing env var so nothing new needs configuring.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseHost = supabaseUrl.replace(/^https?:\/\//, "");

/*
 * Content-Security-Policy — intentionally permissive where the app needs it:
 * - script-src 'unsafe-inline': Next.js App Router bootstraps its runtime with
 *   inline scripts (self.__next_f.push). Nonce-based CSP would force every page
 *   to dynamic rendering and disable CDN caching, which changes how the site
 *   works — so we keep the documented config-level approach.
 * - style-src 'unsafe-inline': components render inline style attributes
 *   (e.g. motion animations), which nonces cannot cover.
 * - style-src https://fonts.googleapis.com + font-src https://fonts.gstatic.com:
 *   the membership card's selectable fonts (see components/id-card/card-fonts.tsx)
 *   are loaded from Google Fonts at runtime.
 * - connect-src also allows the Google Fonts hosts: the PNG/PDF export pipeline
 *   (lib/id-card/export.ts) fetches the font files with fetch() to inline them
 *   into the capture — without this, the CSP blocks those fetches and the
 *   exported card silently falls back to Arial.
 * - img-src https:: admin-configured image URLs can point at any host
 *   (next.config images.remotePatterns is "**"), so https: preserves that.
 * - 'unsafe-eval' and the local websocket are development-only (React devtools).
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com${supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : ""}${
    isDev ? " ws://localhost:*" : ""
  }`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Public team directory moved from /volunteers to /team
      { source: "/volunteers", destination: "/team", permanent: true },
      {
        source: "/volunteers/:path*",
        destination: "/team/:path*",
        permanent: true,
      },
      // Locale-prefixed old URLs (en/bn)
      {
        source: "/:locale(en|bn)/volunteers",
        destination: "/:locale/team",
        permanent: true,
      },
      {
        source: "/:locale(en|bn)/volunteers/:path*",
        destination: "/:locale/team/:path*",
        permanent: true,
      },
      // Activities listing merged into the Gallery of Activities (/gallery).
      // Activity detail pages stay at /activities/:slug.
      {
        source: "/activities",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/:locale(en|bn)/activities",
        destination: "/:locale/gallery",
        permanent: true,
      },
      // Admin panel moved from /admin/volunteers to /admin/team
      {
        source: "/admin/volunteers",
        destination: "/admin/team",
        permanent: true,
      },
      {
        source: "/admin/volunteers/:path*",
        destination: "/admin/team/:path*",
        permanent: true,
      },
      // Team member profile pages were removed — the cards show all details.
      // Stale links and printed QR scans land on the team directory.
      {
        source: "/team/:path+",
        destination: "/team",
        permanent: true,
      },
      {
        source: "/:locale(en|bn)/team/:path+",
        destination: "/:locale/team",
        permanent: true,
      },
      // Principal message and founders archive pages were removed — the
      // homepage founders section still shows both groups.
      {
        source: "/principal",
        destination: "/#founders",
        permanent: true,
      },
      {
        source: "/:locale(en|bn)/principal",
        destination: "/:locale#founders",
        permanent: true,
      },
      {
        source: "/founders",
        destination: "/#founders",
        permanent: true,
      },
      {
        source: "/:locale(en|bn)/founders",
        destination: "/:locale#founders",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
