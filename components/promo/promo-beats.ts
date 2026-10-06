export type PromoBeat = {
  id: string;
  time: string;
  kicker: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  camera: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  accent: string;
  start: number;
  end: number;
};

/**
 * 60-second storyboard from PROMO_FEATURES.md, mapped to scroll progress.
 * 00:00-00:08 hero → 00:08-00:20 blood → 00:20-00:32 AI →
 * 00:32-00:44 trust (ID + certificate) → 00:44-00:54 community/PWA → 00:54-01:00 CTA
 */
export const promoBeats: PromoBeat[] = [
  {
    id: "hero",
    time: "00:00 – 00:08",
    kicker: "Rajshahi Polytechnic • Red Crescent Youth",
    title: "Every second counts",
    body: "Empowering youth, saving lives, and digitizing humanitarian service — now in its digital era.",
    camera: { x: 0, y: 0.7, z: 8 },
    target: { x: 0, y: 0, z: 0 },
    accent: "#006f45",
    start: 0,
    end: 16,
  },
  {
    id: "blood",
    time: "00:08 – 00:20",
    kicker: "Showstopper • Emergency Blood Network",
    title: "Blood request → donors in seconds",
    body: "One-click O+ request, searchable donor directory, triple-channel alerts: email, web push, Telegram.",
    cta: { label: "Request blood", href: "/blood-support/request" },
    camera: { x: 2.6, y: 1.3, z: 5.4 },
    target: { x: 0, y: 0.2, z: 0 },
    accent: "#ed1c24",
    start: 16,
    end: 38,
  },
  {
    id: "ai",
    time: "00:20 – 00:32",
    kicker: "Showstopper • RCY AI Assistant",
    title: "২৪/৭ AI মানবিক গাইড",
    body: "Live database answers in Bangla & English — leaders, urgent blood needs, first-aid training dates.",
    camera: { x: -2.4, y: -0.4, z: 4.6 },
    target: { x: 0, y: 0, z: 0 },
    accent: "#2e9e74",
    start: 38,
    end: 58,
  },
  {
    id: "trust",
    time: "00:32 – 00:44",
    kicker: "Trust • ID cards + certificates",
    title: "Scan. Verify. Done.",
    body: "Printable volunteer ID with live QR profile, tamper-proof certificate tokens — zero fraud, 100% authentic.",
    cta: { label: "Verify a certificate", href: "/verify" },
    camera: { x: 0, y: 1.9, z: 3.4 },
    target: { x: 0, y: 0.3, z: 0 },
    accent: "#1769aa",
    start: 58,
    end: 78,
  },
  {
    id: "community",
    time: "00:44 – 00:54",
    kicker: "Community • Portals + PWA",
    title: "Learn. Serve. Lead.",
    body: "Student & volunteer dashboards, points + leaderboard, 2-minute recruitment, installable offline-ready PWA.",
    cta: { label: "Join as volunteer", href: "/apply-volunteer" },
    camera: { x: 1.4, y: -1.1, z: 5.8 },
    target: { x: 0, y: -0.1, z: 0 },
    accent: "#f2a900",
    start: 78,
    end: 92,
  },
  {
    id: "cta",
    time: "00:54 – 01:00",
    kicker: "Join the mission",
    title: "Save lives with us",
    body: "rgpircy.vercel.app — join the global Red Cross & Red Crescent movement.",
    cta: { label: "Open the platform", href: "/" },
    camera: { x: 0, y: 0.3, z: 9 },
    target: { x: 0, y: 0, z: 0 },
    accent: "#006f45",
    start: 92,
    end: 100,
  },
];
