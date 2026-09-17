import type { RcyRoute } from "../types";
import discoveredRoutes from "./discovered-routes.json";

/**
 * Deterministic Route Registry for RCY RGPI Website.
 * Strictly populated from verified actual routes in app/(site) and app/(portal).
 * AI actions MUST validate against this registry to avoid hallucinated URLs.
 */
export const RCY_ROUTES: RcyRoute[] = [
  {
    id: "home",
    path: "/",
    title: "Home",
    titleBn: "মূল পাতা",
    description: "RCY RGPI official homepage, latest announcements, stats and highlights.",
    descriptionBn: "যুব রেড ক্রিসেন্ট আরজিপিআই-এর মূল পাতা, সাম্প্রতিক ঘোষণা ও কার্যক্রম।",
    keywords: ["home", "homepage", "main", "মূল পাতা", "হোম", "শুরু"],
    isPublic: true,
    requiresAuth: false,
    category: "general",
  },
  {
    id: "blood-support",
    path: "/blood-support",
    title: "Blood Support & Donor Directory",
    titleBn: "রক্ত সহায়তা ও রক্তদাতা ডিরেক্টরি",
    description: "Search for eligible blood donors by blood group and area, view active requests.",
    descriptionBn: "রক্তের গ্রুপ ও এলাকা অনুযায়ী রক্তদাতা খুঁজুন এবং সক্রিয় রক্তের আবেদন দেখুন।",
    keywords: [
      "blood",
      "donor",
      "donors",
      "blood group",
      "rocto",
      "rokto",
      "dondata",
      "রক্ত",
      "রক্তদাতা",
      "রক্তের গ্রুপ",
      "ডোনার",
      "রক্ত সহায়তা",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "blood",
  },
  {
    id: "blood-request",
    path: "/blood-support/request",
    title: "Request Blood",
    titleBn: "রক্তের আবেদন করুন",
    description: "Submit an emergency or regular blood request for patients.",
    descriptionBn: "রোগীর জন্য জরুরি অথবা সাধারণ রক্তের আবেদন ফর্ম জমা দিন।",
    keywords: [
      "blood request",
      "request blood",
      "need blood",
      "rocto lagbe",
      "rokto chai",
      "patient blood",
      "রক্ত চাই",
      "রক্ত লাগবে",
      "রক্তের আবেদন",
      "ব্লাড রিকোয়েস্ট",
      "আবেদন ফর্ম",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "blood",
  },
  {
    id: "apply-volunteer",
    path: "/apply-volunteer",
    title: "Volunteer Application",
    titleBn: "স্বেচ্ছাসেবক আবেদন",
    description: "Apply to become a registered volunteer of Red Crescent Youth RGPI.",
    descriptionBn: "রেড ক্রিসেন্ট যুব দল আরজিপিআই-এ নতুন স্বেচ্ছাসেবক হিসেবে আবেদন করুন।",
    keywords: [
      "volunteer",
      "apply",
      "recruitment",
      "join volunteer",
      "member",
      "registration",
      "ভলান্টিয়ার",
      "স্বেচ্ছাসেবক",
      "যোগদান",
      "রিক্রুটমেন্ট",
      "সদস্য আবেদন",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "volunteer",
  },
  {
    id: "emergency",
    path: "/emergency",
    title: "Emergency Support",
    titleBn: "জরুরি সেবা ও হটলাইন",
    description: "Urgent emergency guidelines, blood helpline and contact numbers.",
    descriptionBn: "জরুরি রক্তের হটলাইন, অ্যাম্বুলেন্স ও তাৎক্ষণিক সহায়তা যোগাযোগ।",
    keywords: [
      "emergency",
      "urgent",
      "helpline",
      "hotline",
      "phone number",
      "zoruri",
      "জরুরি",
      "হটলাইন",
      "হেল্পলাইন",
      "জরুরি নম্বর",
      "তাৎক্ষণিক সহায়তা",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "blood",
  },
  {
    id: "notices",
    path: "/notices",
    title: "Notices & Announcements",
    titleBn: "বিজ্ঞপ্তি ও ঘোষণা",
    description: "Official notices, circulars, meeting schedules and announcements.",
    descriptionBn: "অফিসিয়াল নোটিশ, মিটিংয়ের সূচি, সার্কুলার ও গুরুত্বপূর্ণ ঘোষণা।",
    keywords: [
      "notice",
      "notices",
      "circular",
      "announcement",
      "bikkopti",
      "নোটিশ",
      "বিজ্ঞপ্তি",
      "ঘোষণা",
      "সার্কুলার",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "info",
  },
  {
    id: "events",
    path: "/events",
    title: "Events & Programs",
    titleBn: "ইভেন্ট ও কার্যক্রম",
    description: "Upcoming and past humanitarian events, campaigns, and workshops.",
    descriptionBn: "আসন্ন ও পূর্ববর্তী মানবিক ইভেন্ট, ক্যাম্পেইন ও কর্মশালার বিবরণ।",
    keywords: [
      "event",
      "events",
      "program",
      "campaign",
      "workshop",
      "ইভেন্ট",
      "অনুষ্ঠান",
      "কর্মসূচি",
      "ক্যাম্পেইন",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "info",
  },
  {
    id: "activities",
    path: "/activities",
    title: "Activities & Operations",
    titleBn: "কার্যক্রম ও ফিল্ড ওয়ার্ক",
    description: "Regular social, disaster response, and health initiatives by RCY.",
    descriptionBn: "নিয়মিত সামাজিক ও দুর্যোগ মোকাবিলা কার্যক্রম এবং স্বাস্থ্য সচেতনতা উদ্যোগ।",
    keywords: [
      "activity",
      "activities",
      "work",
      "relief",
      "কার্যক্রম",
      "ত্রাণ",
      "ফিল্ড ওয়ার্ক",
      "সামাজিক কাজ",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "info",
  },
  {
    id: "training",
    path: "/training",
    title: "Training Programs",
    titleBn: "প্রশিক্ষণ কর্মসূচি",
    description: "First aid, disaster management, and youth development training courses.",
    descriptionBn: "প্রাথমিক চিকিৎসা (First Aid), দুর্যোগ ব্যবস্থাপনা ও দক্ষতা উন্নয়ন প্রশিক্ষণ।",
    keywords: [
      "training",
      "first aid",
      "course",
      "workshop",
      "certificate",
      "proshikkhoon",
      "প্রশিক্ষণ",
      "ফার্স্ট এইড",
      "প্রাথমিক চিকিৎসা",
      "কোর্স",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "info",
  },
  {
    id: "gallery",
    path: "/gallery",
    title: "Photo & Media Gallery",
    titleBn: "ছবি ও মিডিয়া গ্যালারি",
    description: "Photo archives of past campaigns, voluntary drives, and awards.",
    descriptionBn: "আমাদের অতীত ক্যাম্পেইন, রক্তদান কর্মসূচি ও স্বেচ্ছাসেবী কাজের ছবির অ্যালবাম।",
    keywords: [
      "gallery",
      "photos",
      "album",
      "pictures",
      "images",
      "ছবি",
      "গ্যালারি",
      "ফটোগ্রাফি",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "info",
  },
  {
    id: "team",
    path: "/team",
    title: "Executive Team & Volunteers",
    titleBn: "কার্যনির্বাহী কমিটি ও স্বেচ্ছাসেবী",
    description: "Executive committee members, youth leaders, and active volunteers.",
    descriptionBn: "বর্তমান কার্যনির্বাহী কমিটির সদস্য, দলনেতা ও সক্রিয় স্বেচ্ছাসেবীদের তালিকা।",
    keywords: [
      "team",
      "committee",
      "leaders",
      "members",
      "executive",
      "কমিটি",
      "টিম",
      "দলনেতা",
      "টিম লিডার",
      "নেতৃত্ব",
      "সদস্যবৃন্দ",
      "কার্যনির্বাহী",
    ],
    isPublic: false,
    requiresAuth: true,
    category: "organization",
  },
  {
    id: "founders",
    path: "/founders",
    title: "Founders & Pioneers",
    titleBn: "প্রতিষ্ঠাতা ও পথপ্রদর্শক",
    description: "Honoring the founding leaders of Red Crescent Youth RGPI unit.",
    descriptionBn: "আরজিপিআই যুব রেড ক্রিসেন্ট দলের প্রতিষ্ঠাতা ও অগ্রজ নেতৃবৃন্দের ইতিহাস।",
    keywords: [
      "founders",
      "founder",
      "history",
      "pioneers",
      "incharge",
      "teacher",
      "ইনচার্জ",
      "শিক্ষক",
      "টিচার",
      "অধ্যক্ষ",
      "প্রিন্সিপাল",
      "উপদেষ্টা",
      "প্রতিষ্ঠাতা",
      "ইতিহাস",
      "সূচনা",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "organization",
  },
  {
    id: "legacy-members",
    path: "/legacy-members",
    title: "Legacy & Alumni Members",
    titleBn: "প্রাক্তন ও আজীবন সদস্য",
    description: "Distinguished alumni and former youth leaders of our institution.",
    descriptionBn: "আমাদের প্রতিষ্ঠানের প্রাক্তন যুব প্রধান ও সম্মানিত প্রাক্তন সদস্যদের তালিকা।",
    keywords: [
      "legacy",
      "alumni",
      "former members",
      "seniors",
      "প্রাক্তন",
      "অ্যালামনাই",
      "লেগ্যাসি",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "organization",
  },
  {
    id: "contact",
    path: "/contact",
    title: "Contact Us",
    titleBn: "যোগাযোগ",
    description: "Office location, email, social links, and message submission form.",
    descriptionBn: "আমাদের কার্যালয়ের ঠিকানা, ইমেইল, সোশ্যাল মিডিয়া ও মেসেজ পাঠানোর ফর্ম।",
    keywords: [
      "contact",
      "address",
      "location",
      "email",
      "office",
      "যোগাযোগ",
      "ঠিকানা",
      "অফিস",
      "ইমেইল",
      "বার্তা",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "general",
  },
  {
    id: "join",
    path: "/join",
    title: "Join Red Crescent Youth",
    titleBn: "যুব রেড ক্রিসেন্টে যোগ দিন",
    description: "Overview of joining as a student or volunteer in our humanitarian mission.",
    descriptionBn: "আরজিপিআই যুব রেড ক্রিসেন্ট দলের সাথে যুক্ত হওয়ার নিয়ম ও দিকনির্দেশনা।",
    keywords: [
      "join",
      "how to join",
      "membership",
      "কেন যোগ দিব",
      "যোগ দিন",
      "সদস্য হওয়া",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "volunteer",
  },
  {
    id: "student-login",
    path: "/student/login",
    title: "Student Portal Login",
    titleBn: "শিক্ষার্থী পোর্টাল লগইন",
    description: "Access student profile, verify ID, and check donation records.",
    descriptionBn: "শিক্ষার্থী অ্যাকাউন্টে লগইন করুন, প্রোফাইল ও রক্তদানের হিসেব দেখুন।",
    keywords: ["student login", "student portal", "শিক্ষার্থী লগইন", "পোর্টাল লগইন"],
    isPublic: true,
    requiresAuth: false,
    category: "portal",
  },
  {
    id: "volunteer-login",
    path: "/volunteer/login",
    title: "Volunteer / Member Portal Login & Registration",
    titleBn: "সদস্য ও স্বেচ্ছাসেবক পোর্টাল লগইন ও নিবন্ধন",
    description: "Access volunteer dashboard, assigned tasks, and register member profile.",
    descriptionBn: "সদস্য ও স্বেচ্ছাসেবকদের নিজস্ব ড্যাশবোর্ড এবং মেম্বার অ্যাকাউন্ট নিবন্ধন পেজ।",
    keywords: [
      "volunteer login",
      "volunteer portal",
      "স্বেচ্ছাসেবক লগইন",
      "ভলান্টিয়ার পোর্টাল",
      "member login",
      "member registration",
      "মেম্বার রেজিস্ট্রেশন",
      "সদস্য নিবন্ধন",
      "মেম্বার লগইন",
    ],
    isPublic: true,
    requiresAuth: false,
    category: "portal",
  },
];

/**
 * Returns all registered application routes.
 */
export function getAllRegisteredRoutes(): RcyRoute[] {
  return RCY_ROUTES;
}

/**
 * Finds a route by exact path.
 */
export function findRouteByPath(path: string): RcyRoute | null {
  const cleanPath = path.trim().toLowerCase();
  return RCY_ROUTES.find((r) => r.path.toLowerCase() === cleanPath) || null;
}

/**
 * Validates whether a target path is allowed for AI navigation.
 * Strict Allowlist: rejects arbitrary external links, non-registered paths, and admin paths.
 */
export function isRegisteredRoute(targetPath: string): boolean {
  if (!targetPath || typeof targetPath !== "string") return false;
  const clean = targetPath.trim().toLowerCase().split("?")[0].split("#")[0];

  // Disallow non-paths, external URLs, admin panels, team directory (admin-only), and security paths
  if (!clean.startsWith("/")) return false;
  if (
    clean.startsWith("/admin") ||
    clean.startsWith("/api") ||
    clean === "/team" ||
    clean.startsWith("/team/") ||
    clean.includes("..")
  ) {
    return false;
  }

  // 1. Exact match against public registered routes
  if (RCY_ROUTES.some((r) => r.path.toLowerCase() === clean && r.isPublic)) {
    return true;
  }

  // 2. Exact match against auto-discovered public routes (from app/ directory)
  if (Array.isArray(discoveredRoutes) && discoveredRoutes.includes(clean)) {
    return true;
  }

  // 3. Dynamic public subroutes allowed:
  // - /blood-support/request/[id] (tracking)
  // - /blood-support/contact-request/[id] (contacting donor)
  // - /notices/[slug]
  // - /events/[slug]
  // - /activities/[slug]
  // - /founders/[id]
  // - /gallery/[slug]
  // - /verify/certificate/[token]
  if (
    clean.startsWith("/blood-support/request/") ||
    clean.startsWith("/blood-support/contact-request/") ||
    clean.startsWith("/notices/") ||
    clean.startsWith("/events/") ||
    clean.startsWith("/activities/") ||
    clean.startsWith("/founders/") ||
    clean.startsWith("/gallery/") ||
    clean.startsWith("/verify/certificate/")
  ) {
    return true;
  }

  return false;
}

/**
 * Deterministically matches user natural language query to the most relevant route.
 * Returns null if no strong keyword match is found.
 */
export function matchRouteByQuery(query: string): RcyRoute | null {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // High-priority exact keyword matches
  if (
    q.includes("blood request") ||
    q.includes("request blood") ||
    q.includes("রক্তের আবেদন") ||
    q.includes("রক্ত চাই") ||
    q.includes("রক্ত লাগবে") ||
    q.includes("ব্লাড রিকোয়েস্ট")
  ) {
    return findRouteByPath("/blood-support/request");
  }

  if (
    q.includes("volunteer") ||
    q.includes("ভলান্টিয়ার") ||
    q.includes("স্বেচ্ছাসেবক") ||
    q.includes("রিক্রুটমেন্ট") ||
    q.includes("recruitment")
  ) {
    if (q.includes("login") || q.includes("লগইন")) {
      return findRouteByPath("/volunteer/login");
    }
    return findRouteByPath("/apply-volunteer");
  }

  if (
    q.includes("donor") ||
    q.includes("ডোনার") ||
    q.includes("রক্তদাতা") ||
    q.includes("blood support") ||
    q.includes("রক্ত সহায়তা")
  ) {
    return findRouteByPath("/blood-support");
  }

  if (
    q.includes("জরুরি") ||
    q.includes("emergency") ||
    q.includes("helpline") ||
    q.includes("হটলাইন") ||
    q.includes("অ্যাম্বুলেন্স")
  ) {
    return findRouteByPath("/emergency");
  }

  if (q.includes("notice") || q.includes("নোটিশ") || q.includes("বিজ্ঞপ্তি")) {
    return findRouteByPath("/notices");
  }

  if (q.includes("event") || q.includes("ইভেন্ট") || q.includes("কর্মসূচি")) {
    return findRouteByPath("/events");
  }

  if (q.includes("training") || q.includes("প্রশিক্ষণ") || q.includes("ফার্স্ট এইড")) {
    return findRouteByPath("/training");
  }

  if (q.includes("contact") || q.includes("যোগাযোগ") || q.includes("ঠিকানা") || q.includes("অফিস")) {
    return findRouteByPath("/contact");
  }

  // Generalized keyword score scan
  let bestRoute: RcyRoute | null = null;
  let maxScore = 0;

  for (const route of RCY_ROUTES) {
    if (!route.isPublic) continue;
    let score = 0;
    for (const kw of route.keywords) {
      if (q.includes(kw.toLowerCase())) {
        score += kw.length > 4 ? 3 : 1;
      }
    }
    if (score > maxScore && score >= 2) {
      maxScore = score;
      bestRoute = route;
    }
  }

  return bestRoute;
}
