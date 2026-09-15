import "server-only";

import { getPublicClient } from "@/lib/supabase/public";
import type {
  SanitizedBloodSummary,
  SanitizedNoticeItem,
  SanitizedEventItem,
  SanitizedRecruitmentSummary,
  SanitizedHelplineSummary,
  SanitizedSiteImpactStats,
  SanitizedTrainingItem,
  SanitizedLegacyItem,
  SanitizedActivityItem,
} from "../types";
import { findRelevantKnowledge } from "../knowledge/knowledge-base";
import { DEFAULT_COMMUNITY_MEMBERS, resolveEventStatus } from "@/lib/constants";

/**
 * Server-Side Live Supabase Data Resolvers for the RCY AI Assistant.
 * Optimized with in-memory caching (60s TTL), targeted search, and semantic filtering.
 */

// In-memory 60s cache store
const memCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

async function getCached<T>(key: string, fetcher: () => Promise<T>, ttlMs = CACHE_TTL_MS): Promise<T> {
  const cached = memCache.get(key);
  const now = Date.now();
  if (cached && cached.expiry > now) {
    return cached.data as T;
  }
  const fresh = await fetcher();
  memCache.set(key, { data: fresh, expiry: now + ttlMs });
  return fresh;
}

/**
 * Invalidates cached leadership summary when an admin updates committee members.
 */
export function invalidateLeadershipCache(): void {
  memCache.delete("team_leadership_v4");
}

/**
 * Resolves real-time active blood requests summary from Supabase.
 */
export async function getActiveBloodRequestsSummary(): Promise<SanitizedBloodSummary> {
  return getCached("active_blood_requests", async () => {
    const emptyResult: SanitizedBloodSummary = {
      activeCount: 0,
      totalUnitsNeeded: 0,
      groupBreakdown: {},
      availableDonorsByGroup: {},
      emergencyCount: 0,
      recentRequests: [],
    };

    try {
      const supabase = getPublicClient();
      if (!supabase) return emptyResult;

      const [requestsRes, donorsRes] = await Promise.all([
        supabase
          .from("public_blood_requests")
          .select("id, patient_name, blood_group, units, hospital, location, required_date, required_time, emergency_level, status, created_at")
          .eq("status", "PENDING")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("public_blood_donors")
          .select("blood_group")
          .eq("availability", "AVAILABLE"),
      ]);

      const data = requestsRes.data || [];
      const donorsData = donorsRes.data || [];

      const groupBreakdown: Record<string, number> = {};
      let totalUnits = 0;
      let emergencyCount = 0;

      for (const req of data) {
        const bg = req.blood_group || "Unknown";
        groupBreakdown[bg] = (groupBreakdown[bg] || 0) + 1;
        totalUnits += Number(req.units) || 1;
        if (req.emergency_level === "EMERGENCY" || req.emergency_level === "URGENT") {
          emergencyCount++;
        }
      }

      const availableDonorsByGroup: Record<string, number> = {};
      for (const d of donorsData) {
        const bg = d.blood_group || "Unknown";
        availableDonorsByGroup[bg] = (availableDonorsByGroup[bg] || 0) + 1;
      }

      const recent = data.slice(0, 10).map((req) => ({
        id: req.id,
        patientName: req.patient_name || "অজ্ঞাত",
        bloodGroup: req.blood_group,
        units: req.units || 1,
        hospital: req.hospital || "",
        location: req.location || "",
        hospitalOrLocation: [req.hospital, req.location].filter(Boolean).join(", ") || "Rajshahi",
        emergencyLevel: req.emergency_level || "NORMAL",
        status: req.status || "PENDING",
        requiredDate: req.required_date || null,
        requiredTime: req.required_time || null,
      }));

      return {
        activeCount: data.length,
        totalUnitsNeeded: totalUnits,
        groupBreakdown,
        availableDonorsByGroup,
        emergencyCount,
        recentRequests: recent,
      };
    } catch (err) {
      console.error("[AI LiveData Exception] getActiveBloodRequestsSummary:", err);
      return emptyResult;
    }
  }, 20_000); // 20s TTL for blood requests to stay fresh
}

/**
 * Resolves aggregate site impact and platform statistics.
 * Reflects total blood donations, donors, events, trainings, and volunteer metrics.
 */
export async function getSiteImpactStats(): Promise<SanitizedSiteImpactStats> {
  return getCached("site_impact_stats", async () => {
    const defaultStats: SanitizedSiteImpactStats = {
      totalBloodDonations: 0,
      completedBloodRequests: 0,
      activeDonors: 0,
      availableDonorsByGroup: {},
      totalVolunteers: 0,
      eventsCompleted: 0,
      trainingSessions: 0,
      studentsReached: 0,
    };

    try {
      const supabase = getPublicClient();
      if (!supabase) return defaultStats;

      const [teamMembers, donors, events, trainings, requests, activities] = await Promise.all([
        supabase.from("public_team_members").select("id", { count: "exact", head: true }),
        supabase
          .from("public_blood_donors")
          .select("blood_group")
          .eq("availability", "AVAILABLE"),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
        supabase.from("training").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
        supabase
          .from("public_blood_requests")
          .select("units, units_donated, donation_confirmed")
          .eq("status", "COMPLETED"),
        supabase.from("activities").select("participants"),
      ]);

      const availableDonorsByGroup: Record<string, number> = {};
      const activeDonorsList = donors.data ?? [];
      for (const d of activeDonorsList) {
        const bg = d.blood_group || "Unknown";
        availableDonorsByGroup[bg] = (availableDonorsByGroup[bg] || 0) + 1;
      }

      const completedReqs = requests.data ?? [];
      const bloodUnits = completedReqs.reduce((sum, r) => {
        if (r.donation_confirmed === false) return sum;
        return sum + (r.units_donated ?? r.units ?? 0);
      }, 0);

      const reached = (activities.data ?? []).reduce((sum, a) => sum + (a.participants ?? 0), 0);

      return {
        totalBloodDonations: bloodUnits,
        completedBloodRequests: completedReqs.length,
        activeDonors: activeDonorsList.length,
        availableDonorsByGroup,
        totalVolunteers: teamMembers.count ?? 0,
        eventsCompleted: events.count ?? 0,
        trainingSessions: trainings.count ?? 0,
        studentsReached: reached,
      };
    } catch (err) {
      console.error("[AI LiveData Exception] getSiteImpactStats:", err);
      return defaultStats;
    }
  }, 30_000); // 30s cache
}

/**
 * Resolves upcoming and completed training programs for AI grounding.
 */
export async function getPublicTrainingsSummary(limit = 6): Promise<SanitizedTrainingItem[]> {
  return getCached(`public_trainings_${limit}`, async () => {
    try {
      const supabase = getPublicClient();
      if (!supabase) return [];

      const { data } = await supabase
        .from("training")
        .select("id, title, category, date, status, location")
        .order("date", { ascending: false })
        .limit(limit);

      if (!data) return [];
      return data.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category || "General Training",
        date: t.date || null,
        status: t.status,
        location: t.location || "RGPI Campus",
      }));
    } catch (err) {
      console.error("[AI LiveData Exception] getPublicTrainingsSummary:", err);
      return [];
    }
  });
}

/**
 * Resolves distinguished legacy / alumni members for AI grounding.
 */
export async function getLegacyMembersSummary(limit = 6): Promise<SanitizedLegacyItem[]> {
  return getCached(`legacy_members_${limit}`, async () => {
    try {
      const supabase = getPublicClient();
      if (!supabase) return [];

      const { data } = await supabase
        .from("team_members")
        .select("id, name, position, legacy_designation, session, department")
        .eq("is_legacy", true)
        .eq("status", "APPROVED")
        .limit(limit);

      if (!data) return [];
      return data.map((l) => ({
        id: l.id,
        name: l.name,
        position: l.position,
        designation: l.legacy_designation,
        session: l.session,
        department: l.department,
      }));
    } catch {
      return [];
    }
  });
}

/**
 * Resolves current published notices for AI grounding.
 */
export async function getRecentNoticesSummary(limit = 4): Promise<SanitizedNoticeItem[]> {
  return getCached(`recent_notices_${limit}`, async () => {
    try {
      const supabase = getPublicClient();
      if (!supabase) return [];

      const { data, error } = await supabase
        .from("notices")
        .select("id, title, slug, category, published_at, notice_attachments(id)")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return data.map((n: any) => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        category: n.category || "General",
        publishedAt: n.published_at,
        hasAttachment: Array.isArray(n.notice_attachments) && n.notice_attachments.length > 0,
      }));
    } catch (err) {
      console.error("[AI LiveData Exception] getRecentNoticesSummary:", err);
      return [];
    }
  });
}

/**
 * Resolves programs and events from the database with full metadata (dates & locations).
 */
export async function getUpcomingEventsSummary(limit = 8): Promise<SanitizedEventItem[]> {
  return getCached(`events_summary_${limit}`, async () => {
    try {
      const supabase = getPublicClient();
      if (!supabase) return [];

      const { data, error } = await supabase
        .from("events")
        .select("id, title, slug, date, category, status, location")
        .order("date", { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return data.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        date: e.date || null,
        status: resolveEventStatus(e),
        location: e.location || null,
        category: e.category || null,
      }));
    } catch (err) {
      console.error("[AI LiveData Exception] getUpcomingEventsSummary:", err);
      return [];
    }
  });
}

/**
 * Resolves recent activities for gallery grounding.
 */
/**
 * Resolves recent on-ground humanitarian activities & operations from Supabase.
 */
export async function getRecentActivitiesSummary(limit = 6): Promise<SanitizedActivityItem[]> {
  return getCached(`activities_summary_${limit}`, async () => {
    try {
      const supabase = getPublicClient();
      if (!supabase) return [];

      const { data, error } = await supabase
        .from("activities")
        .select("id, title, slug, date, category, description, impact, participants")
        .order("date", { ascending: false })
        .limit(limit);

      if (error || !data) return [];
      return data.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        date: a.date || null,
        category: a.category || "Community Service",
        description: a.description ? a.description.slice(0, 300) : null,
        impact: a.impact || null,
        participants: a.participants || null,
      }));
    } catch {
      return [];
    }
  });
}

export interface SanitizedLeadershipSummary {
  inchargeTeacher: { name: string; position: string; photoUrl?: string | null } | null;
  principal: { name: string; position: string; bio?: string | null } | null;
  founders: Array<{ name: string; position: string }>;
  keyLeaders: Array<{ name: string; position: string; level: string; subRole?: string | null }>;
}

/**
 * Resolves verified incharge teacher, principal, founders, and key committee leaders.
 */
export async function getLeadershipSummary(): Promise<SanitizedLeadershipSummary> {
  return getCached("team_leadership_v4", async () => {
    const defaultLeaders = DEFAULT_COMMUNITY_MEMBERS.filter((m) => m.level > 1).map((m) => ({
      name: m.name,
      position: m.position,
      level: `Level ${m.level}`,
      subRole: m.sub_role || null,
    }));

    const defaultData: SanitizedLeadershipSummary = {
      inchargeTeacher: { name: "Md. Nurul Amin", position: "ইনচার্জ শিক্ষক (Incharge Teacher)" },
      principal: { name: "Engr Ajm Masudur Rahman", position: "অধ্যক্ষ ও প্রধান উপদেষ্টা (Principal Sir)" },
      founders: [
        { name: "Engr. Md. Rashidul Amin", position: "উপাধ্যক্ষ ও প্রতিষ্ঠাতা (Vice-Principal & Founder)" },
        { name: "MD Nurul Amin", position: "ইনচার্জ শিক্ষক ও প্রতিষ্ঠাতা (Incharge Teacher)" },
      ],
      keyLeaders: defaultLeaders,
    };

    try {
      const supabase = getPublicClient();
      if (!supabase) return defaultData;

      const [communityRes, foundersRes, teamRes] = await Promise.all([
        supabase
          .from("community_members")
          .select("name, position, sub_role, level, photo_url, display_order")
          .eq("is_active", true)
          .order("level", { ascending: true })
          .order("display_order", { ascending: true })
          .limit(30),
        supabase
          .from("founders")
          .select("name, title, category, bio")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(6),
        supabase
          .from("team_members")
          .select("name, position, level")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(8),
      ]);

      const community = communityRes.data || [];
      const founders = foundersRes.data || [];
      const team = teamRes.data || [];

      // Find incharge teacher (Level 1 in community_members or matching in founders)
      const inchargeFromComm = community.find(
        (c) => c.level === 1 || (c.position && c.position.toLowerCase().includes("incharge"))
      );
      const inchargeFromFounders = founders.find(
        (f) =>
          (f.title && f.title.toLowerCase().includes("incharge")) ||
          f.name.toLowerCase().includes("nurul amin")
      );

      const inchargeTeacher = inchargeFromComm
        ? {
            name: inchargeFromComm.name,
            position: "ইনচার্জ শিক্ষক (Incharge Teacher)",
            photoUrl: inchargeFromComm.photo_url || null,
          }
        : inchargeFromFounders
        ? {
            name: inchargeFromFounders.name,
            position: "ইনচার্জ শিক্ষক (Incharge Teacher)",
            photoUrl: null,
          }
        : defaultData.inchargeTeacher;

      // Find Principal
      const principalFounder = founders.find(
        (f) => f.category === "PRINCIPAL" || (f.title && f.title.toLowerCase().includes("principal"))
      );
      const principal = principalFounder
        ? {
            name: principalFounder.name,
            position: "অধ্যক্ষ ও প্রধান উপদেষ্টা (Principal Sir)",
            bio: principalFounder.bio || null,
          }
        : defaultData.principal;

      // Extract founders list
      const foundersList = founders.map((f) => ({
        name: f.name,
        position:
          f.category === "PRINCIPAL"
            ? "অধ্যক্ষ (Principal)"
            : f.title || "প্রতিষ্ঠাতা ও পথপ্রদর্শক (Founder)",
      }));

      // Extract youth committee leaders
      const leadersSource = community.length > 0 ? community.filter((c) => c.level > 1) : defaultLeaders;
      const keyLeaders = leadersSource.map((m: any) => ({
        name: m.name,
        position: m.position,
        level: m.level ? `Level ${m.level}` : "Executive",
        subRole: m.sub_role || null,
      }));

      return {
        inchargeTeacher,
        principal,
        founders: foundersList.length > 0 ? foundersList : defaultData.founders,
        keyLeaders: keyLeaders.length > 0 ? keyLeaders : defaultData.keyLeaders,
      };
    } catch (err) {
      console.error("[AI LiveData Exception] getLeadershipSummary:", err);
      return defaultData;
    }
  });
}

/**
 * Checks whether volunteer recruitment is currently open or closed.
 */
export async function getVolunteerRecruitmentStatus(): Promise<SanitizedRecruitmentSummary> {
  return getCached("recruitment_status", async () => {
    const defaultStatus: SanitizedRecruitmentSummary = {
      isActive: false,
      title: null,
      description: null,
      deadline: null,
    };

    try {
      const supabase = getPublicClient();
      if (!supabase) return defaultStatus;

      const { data, error } = await supabase
        .from("recruitment_campaigns")
        .select("title, description, end_date, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return defaultStatus;

      return {
        isActive: true,
        title: data.title || "Volunteer Recruitment Campaign",
        description: data.description || null,
        deadline: data.end_date || null,
      };
    } catch (err) {
      console.error("[AI LiveData Exception] getVolunteerRecruitmentStatus:", err);
      return defaultStatus;
    }
  });
}

/**
 * Resolves official emergency hotlines from settings.
 */
export async function getEmergencyHelpline(): Promise<SanitizedHelplineSummary> {
  return getCached("emergency_helpline", async () => {
    const defaultHelpline: SanitizedHelplineSummary = {
      bloodHelpline: "",
      emergencyContact: "",
    };

    try {
      const supabase = getPublicClient();
      if (!supabase) return defaultHelpline;

      // Fetch both "emergency" and "contact" settings in one query
      const { data } = await supabase
        .from("website_settings")
        .select("key, value")
        .in("key", ["emergency", "contact"]);

      const rows: Record<string, Record<string, unknown>> = {};
      for (const row of data ?? []) {
        rows[row.key] = (row.value as Record<string, unknown>) || {};
      }

      const emergency = rows.emergency ?? {};
      const contact = rows.contact ?? {};

      // Priority: emergency.bloodHelpline (if explicitly set) > contact.phone
      const helpline =
        (typeof emergency.bloodHelpline === "string" && emergency.bloodHelpline.trim()) ||
        (typeof contact.phone === "string" && contact.phone.trim()) ||
        "";

      return {
        bloodHelpline: helpline,
        emergencyContact: helpline,
      };
    } catch (err) {
      console.error("[AI LiveData Exception] getEmergencyHelpline:", err);
      return defaultHelpline;
    }
  });
}

/**
 * Targeted keyword and historical entity search across events, notices, activities, and team.
 * This guarantees the AI can recall ANY item ever recorded in the database, regardless of age.
 */
export async function searchHistoricalEntities(query: string): Promise<string[]> {
  const clean = query.trim().toLowerCase();
  const searchTerms = clean
    .split(/\s+/)
    .map((w) => w.replace(/[?.,!]/g, "").trim())
    .filter((w) => w.length >= 2 && !["what", "when", "where", "how", "the", "and", "কার", "কি", "কী", "আছে", "হবে", "হয়েছিল", "চাই", "কবে"].includes(w));

  if (searchTerms.length === 0) return [];

  const results: string[] = [];
  const supabase = getPublicClient();
  if (!supabase) return [];

  try {
    for (const term of searchTerms.slice(0, 3)) {
      // 1. Search events
      const { data: matchedEvents } = await supabase
        .from("events")
        .select("title, slug, date, location, category, status")
        .or(`title.ilike.%${term}%,location.ilike.%${term}%,category.ilike.%${term}%`)
        .limit(3);

      if (matchedEvents && matchedEvents.length > 0) {
        for (const e of matchedEvents) {
          results.push(
            `Matched Event: "${e.title}" (Date: ${e.date || "অনির্দিষ্ট"}, Location: "${e.location || "Rajshahi"}", Category: ${e.category || "General"}, Status: ${e.status}, Link: /events/${e.slug})`
          );
        }
      }

      // 2. Search notices
      const { data: matchedNotices } = await supabase
        .from("notices")
        .select("title, slug, category, published_at")
        .ilike("title", `%${term}%`)
        .eq("is_published", true)
        .limit(2);

      if (matchedNotices && matchedNotices.length > 0) {
        for (const n of matchedNotices) {
          results.push(
            `Matched Notice: "${n.title}" (${n.category}, Published: ${n.published_at?.slice(0, 10) || "Recent"}, Link: /notices/${n.slug})`
          );
        }
      }

      // 3. Search community members & incharge teacher
      const { data: matchedComm } = await supabase
        .from("community_members")
        .select("name, position, level")
        .or(`name.ilike.%${term}%,position.ilike.%${term}%`)
        .eq("is_active", true)
        .limit(2);

      if (matchedComm && matchedComm.length > 0) {
        for (const c of matchedComm) {
          results.push(`Matched Leadership / Incharge: "${c.name}" - ${c.position} (Level ${c.level})`);
        }
      }

      // 4. Search founders & principal
      const { data: matchedFounders } = await supabase
        .from("founders")
        .select("name, title, category")
        .or(`name.ilike.%${term}%,title.ilike.%${term}%,category.ilike.%${term}%`)
        .eq("is_active", true)
        .limit(2);

      if (matchedFounders && matchedFounders.length > 0) {
        for (const f of matchedFounders) {
          results.push(`Matched Founder / Principal: "${f.name}" - ${f.title || f.category}`);
        }
      }

      // 5. Search team members
      const { data: matchedMembers } = await supabase
        .from("team_members")
        .select("name, position, level")
        .ilike("name", `%${term}%`)
        .eq("is_active", true)
        .limit(2);

      if (matchedMembers && matchedMembers.length > 0) {
        for (const m of matchedMembers) {
          results.push(
            `Matched Team Member: "${m.name}" - ${m.position} (${m.level})`
          );
        }
      }
      // 6. Search trainings
      const { data: matchedTrainings } = await supabase
        .from("training")
        .select("title, category, date, status, location")
        .or(`title.ilike.%${term}%,category.ilike.%${term}%`)
        .limit(2);

      if (matchedTrainings && matchedTrainings.length > 0) {
        for (const tr of matchedTrainings) {
          results.push(
            `Matched Training: "${tr.title}" (${tr.category}, Date: ${tr.date || "শীঘ্রই আসছে"}, Status: ${tr.status}, Venue: "${tr.location || "RGPI"}", Link: /training)`
          );
        }
      }

      // 7. Search field activities & operations
      const { data: matchedActs } = await supabase
        .from("activities")
        .select("title, slug, date, category, impact, description")
        .or(`title.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`)
        .limit(2);

      if (matchedActs && matchedActs.length > 0) {
        for (const a of matchedActs) {
          results.push(
            `Matched Activity (/activities): "${a.title}" (Date: ${a.date || "সাম্প্রতিক"}, Category: "${a.category || "Community Work"}", Impact: "${a.impact || ""}", Link: /activities/${a.slug})`
          );
        }
      }
    }
  } catch (err) {
    console.warn("[AI Search Entity Exception]:", err);
  }

  return Array.from(new Set(results));
}

/**
 * Dynamically assembles a token-optimized, intent-filtered live context block.
 * Injects verified live database facts, platform statistics, and curated organizational knowledge.
 */
export async function buildTrustedLiveContext(intent: string, query?: string): Promise<string> {
  if (intent === "UNRELATED") return "";

  const parts: string[] = [];
  const q = query || "";

  // 1. Check for targeted historical entity matches first (e.g. "12 september", "first aid", "ডেঙ্গু")
  const specificMatches = q ? await searchHistoricalEntities(q) : [];
  if (specificMatches.length > 0) {
    parts.push(`[SPECIFIC SEARCH MATCHES FOR USER QUERY]`);
    specificMatches.forEach((m) => parts.push(`- ${m}`));
    parts.push("");
  }

  // 2. Global Live Platform Impact Statistics & Recruitment Status
  const [impact, recruitment] = await Promise.all([
    getSiteImpactStats(),
    getVolunteerRecruitmentStatus(),
  ]);

  parts.push(`[LIVE RCY PORTAL STATE & IMPACT STATISTICS]`);
  parts.push(`- Total Blood Units Donated (সর্বমোট রক্তদান সম্পন্ন): ${impact.totalBloodDonations} ব্যাগ/ইউনিট (সফল রক্তদান আবেদন: ${impact.completedBloodRequests}টি)`);
  parts.push(`- Active Registered Blood Donors (নিবন্ধিত রক্তদাতা): ${impact.activeDonors} জন`);
  if (Object.keys(impact.availableDonorsByGroup).length > 0) {
    const donorsByGroupStr = Object.entries(impact.availableDonorsByGroup)
      .map(([bg, count]) => `${bg}: ${count} জন`)
      .join(", ");
    parts.push(`- Available Donors by Blood Group (গ্রুপভিত্তিক সক্রিয় রক্তদাতা): ${donorsByGroupStr}`);
  } else {
    parts.push(`- Available Donors by Blood Group: বর্তমানে নির্দিষ্ট গ্রুপে কোনো সক্রিয় ডোনার লিস্টেড নেই।`);
  }
  parts.push(`- Total Volunteers & Team Members (স্বেচ্ছাসেবক ও সদস্য): ${impact.totalVolunteers} জন`);
  parts.push(
    `- Volunteer Recruitment Status: ${
      recruitment.isActive
        ? `ACTIVE (নতুন সদস্য আবেদন চালু আছে) - শেষ তারিখ: ${recruitment.deadline || "শীঘ্রই"}, শিরোনাম: "${recruitment.title}"`
        : `CLOSED (বর্তমানে নতুন সদস্য আবেদন সাময়িকভাবে বন্ধ রয়েছে। পরবর্তী ক্যাম্পেইন নোটিশ বোর্ডে জানানো হবে)`
    }`
  );
  parts.push(`- Completed Humanitarian Events (সম্পন্ন কর্মসূচি): ${impact.eventsCompleted}টি`);
  parts.push(`- Training Sessions Conducted (প্রশিক্ষণ কর্মসূচি): ${impact.trainingSessions}টি`);
  if (impact.studentsReached > 0) {
    parts.push(`- Students Reached (উপকৃত শিক্ষার্থী): ${impact.studentsReached}+ জন`);
  }
  parts.push("");

  // 3. Semantic Intent-Based Context Injection
  if (intent === "EMERGENCY" || intent === "BLOOD_SUPPORT") {
    // Focus strictly on blood requests & helpline (token diet: ~200 tokens)
    const [blood, helpline] = await Promise.all([
      getActiveBloodRequestsSummary(),
      getEmergencyHelpline(),
    ]);

    parts.push(`🚨 EMERGENCY BLOOD HOTLINE: ${helpline.bloodHelpline}`);
    parts.push(`- Active Blood Requests in System: ${blood.activeCount}`);
    if (blood.activeCount > 0) {
      const groups = Object.entries(blood.groupBreakdown)
        .map(([g, count]) => `${g}: ${count}টি`)
        .join(", ");
      parts.push(`- Groups Needed for Patients: ${groups}`);
      parts.push(`- Detailed List of Active Blood Requests:`);
      for (const req of blood.recentRequests) {
        parts.push(
          `  * [রক্তের আবেদন #${req.id.slice(0, 8)}] রক্তের গ্রুপ: ${req.bloodGroup}, পরিমাণ: ${req.units} ব্যাগ, রোগী: "${req.patientName || "নাম গোপন"}", হাসপাতাল: "${req.hospital || req.hospitalOrLocation}", অবস্থান/ওয়ার্ড: "${req.location || ""}", তারিখ: ${req.requiredDate || "তাৎক্ষণিক"}, জরুরি মাত্রা: ${req.emergencyLevel}, লিঙ্ক: /blood-support`
        );
      }
    } else {
      parts.push(`- Currently NO pending blood requests in system.`);
    }
    parts.push(`- Blood Support Directory: /blood-support | Request Blood Form: /blood-support/request`);

  } else if (intent === "SITE_STATS") {
    // Focus on platform impact, blood donation totals, donors, and activities (~200 tokens)
    const [blood, helpline] = await Promise.all([
      getActiveBloodRequestsSummary(),
      getEmergencyHelpline(),
    ]);

    parts.push(`- Current Pending Blood Requests: ${blood.activeCount}টি`);
    parts.push(`- Emergency Helpline: ${helpline.bloodHelpline}`);
    parts.push(`- Blood Directory: /blood-support | Request Blood: /blood-support/request`);
    parts.push(`- Events: /events | Training: /training | Volunteer Application: /apply-volunteer`);

  } else if (intent === "EVENT_ACTIVITY") {
    // Focus strictly on events, activities & trainings (~350 tokens)
    const [events, activities, trainings] = await Promise.all([
      getUpcomingEventsSummary(8),
      getRecentActivitiesSummary(6),
      getPublicTrainingsSummary(6),
    ]);

    const isActivityQuery =
      q.includes("activit") ||
      q.includes("কার্যক্রম") ||
      q.includes("কাজ") ||
      q.includes("অ্যাক্টিভিটি") ||
      q.includes("ফিল্ড");

    if (isActivityQuery) {
      parts.push(`[SPECIFIC FOCUS: RCY ON-GROUND FIELD ACTIVITIES - /activities]`);
      if (activities.length > 0) {
        for (const a of activities) {
          parts.push(
            `  * [Activity] "${a.title}" [Date: ${a.date || "সাম্প্রতিক"}, Category: "${a.category || "Community Service"}", Impact: "${a.impact || ""}", Description: "${a.description || ""}", Link: /activities/${a.slug}]`
          );
        }
        parts.push(`  * All Activities Directory: /activities`);
      }
      parts.push(
        `[INSTRUCTION FOR AI: The user specifically asked for RCY Activities (কার্যক্রম/অ্যাক্টিভিটি). You MUST describe the on-ground activity above (e.g. "${activities[0]?.title}"), detail what the volunteers did, and attach a button to "/activities/${activities[0]?.slug || ""}" or "/activities". DO NOT replace this with a scheduled Event like Dengue Campaign!]`
      );
    } else {
      const upcomingEvents = events.filter((e) => e.status === "UPCOMING" || e.status === "ONGOING");
      const completedEvents = events.filter((e) => e.status === "COMPLETED");

      if (upcomingEvents.length > 0) {
        parts.push(`- Upcoming / Scheduled Events (/events):`);
        for (const e of upcomingEvents) {
          parts.push(
            `  * [Upcoming Event] "${e.title}" [Date: ${e.date || "অনির্দিষ্ট"}, Location: "${e.location || "Rajshahi"}", Category: "${e.category || "General"}", Link: /events/${e.slug}]`
          );
        }
      } else {
        parts.push(`- Upcoming Events: Currently NO upcoming events scheduled in the portal calendar.`);
      }

      if (completedEvents.length > 0) {
        parts.push(`- Past Completed Events (/events):`);
        for (const e of completedEvents) {
          parts.push(
            `  * [Completed Event] "${e.title}" [Completed Date: ${e.date || "Past"}, Location: "${e.location || "Rajshahi"}", Category: "${e.category || "General"}", Link: /events/${e.slug}]`
          );
        }
      }

      if (activities.length > 0) {
        parts.push(`- On-Ground Field Activities & Social Operations (/activities):`);
        for (const a of activities) {
          parts.push(
            `  * [Activity] "${a.title}" [Date: ${a.date || "N/A"}, Category: "${a.category}", Impact: "${a.impact || ""}", Link: /activities/${a.slug}]`
          );
        }
      }

      if (trainings.length > 0) {
        parts.push(`- Training Programs in Database:`);
        for (const t of trainings) {
          parts.push(
            `  * "${t.title}" [Category: ${t.category}, Date: ${t.date || "শীঘ্রই আসছে"}, Status: ${t.status}, Location: "${t.location || "RGPI"}", Link: /training]`
          );
        }
      }
    }

  } else if (intent === "TEAM_FOUNDER") {
    // Focus on incharge teacher, principal, founders, and youth committee (~200 tokens)
    const leadership = await getLeadershipSummary();
    parts.push(`- Official Incharge Teacher & Leadership Directory:`);
    if (leadership.inchargeTeacher) {
      parts.push(`  * ইনচার্জ শিক্ষক (Incharge Teacher): ${leadership.inchargeTeacher.name} [পদবী: ${leadership.inchargeTeacher.position}]`);
    }
    if (leadership.principal) {
      parts.push(`  * অধ্যক্ষ ও প্রধান উপদেষ্টা (Principal Sir): ${leadership.principal.name} [${leadership.principal.position}]`);
    }
    if (leadership.founders && leadership.founders.length > 0) {
      parts.push(`  * প্রতিষ্ঠাতা ও পথপ্রদর্শক (Founders & Pioneers):`);
      leadership.founders.forEach((f) => parts.push(`    - ${f.name} (${f.position})`));
    }
    if (leadership.keyLeaders && leadership.keyLeaders.length > 0) {
      parts.push(`  * যুব দল ও কার্যনির্বাহী পরিষদ (Youth Leadership & Executive Committee):`);
      leadership.keyLeaders.forEach((l) => {
        const wingInfo = l.subRole ? ` [উইং/বিভাগ: ${l.subRole}]` : "";
        parts.push(`    - ${l.position}${wingInfo}: ${l.name} (${l.level})`);
      });
    }
    parts.push(`- Founders & Advisors Page: /founders | Join & About: /join (Note: /team is private staff-only, never link it)`);

  } else if (intent === "NOTICE") {
    // Focus on notices (~120 tokens)
    const notices = await getRecentNoticesSummary(5);
    if (notices.length > 0) {
      parts.push(`- Published Notices:`);
      notices.forEach((n) =>
        parts.push(
          `  * "${n.title}" (${n.category}, Link: /notices/${n.slug}${n.hasAttachment ? ", অফিশিয়াল সার্কুলার ফাইল সংযুক্ত" : ""})`
        )
      );
      parts.push(`- Notices Page: /notices`);
    }

  } else if (intent === "RECRUITMENT") {
    // Focus on recruitment campaign & volunteer forms (~100 tokens)
    parts.push(
      recruitment.isActive
        ? `- Volunteer Recruitment: Currently ACTIVE (Open until ${recruitment.deadline || "announced date"}, Title: "${recruitment.title}")`
        : `- Volunteer Recruitment: Currently CLOSED (নতুন সদস্য আবেদন সাময়িকভাবে বন্ধ আছে)`
    );
    parts.push(`- Volunteer Application Form: /apply-volunteer | Volunteer Info: /volunteer`);

  } else {
    // General Digest: concise 1-2 line summary of each section (~350 tokens)
    const [blood, helpline, notices, events] = await Promise.all([
      getActiveBloodRequestsSummary(),
      getEmergencyHelpline(),
      getRecentNoticesSummary(3),
      getUpcomingEventsSummary(4),
    ]);

    parts.push(`- Active Blood Requests: ${blood.activeCount} (Helpline: ${helpline.bloodHelpline})`);
    parts.push(
      recruitment.isActive
        ? `- Volunteer Recruitment: ACTIVE`
        : `- Volunteer Recruitment: CLOSED`
    );

    if (notices.length > 0) {
      parts.push(`- Recent Notices: ` + notices.map((n) => `"${n.title}" (/notices/${n.slug})`).join("; "));
    }

    if (events.length > 0) {
      parts.push(`- Events: ` + events.map((e) => `"${e.title}" [${e.date || "TBA"}, ${e.status}] (/events/${e.slug})`).join("; "));
    }
  }

  // 3. Inject curated organizational knowledge if relevant
  if (q) {
    const knowledgeSnippet = await findRelevantKnowledge(q);
    if (knowledgeSnippet) {
      parts.push(`\n[ORGANIZATIONAL KNOWLEDGE]\n${knowledgeSnippet}`);
    }
  }

  return parts.join("\n");
}
