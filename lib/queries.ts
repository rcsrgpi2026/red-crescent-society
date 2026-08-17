import "server-only";

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_COMMUNITY_MEMBERS } from "@/lib/constants";
import type {
  Achievement,
  Activity,
  Attendance,
  BloodContactRequest,
  BloodDonor,
  BloodRequest,
  Certificate,
  CommunityMember,
  Event,
  EventRegistration,
  Founder,
  GalleryAlbum,
  GalleryImage,
  Notice,
  NoticeAttachment,
  ParticipationRequest,
  AdminTrainingParticipant,
  DonorContactNotification,
  MyTrainingEnrollment,
  PublicBloodDonor,
  PublicBloodRequest,
  PublicTeamMember,
  Student,
  TeamMember,
  TeamMemberPoint,
  Training,
} from "@/types/database";

/**
 * Public queries are wrapped in `unstable_cache` (tagged + 60s revalidate):
 * the public site is served from cache while admins invalidate instantly via
 * `revalidateTag` in lib/admin-actions.ts. Admin queries stay uncached —
 * they are session/role dependent and must always read fresh.
 */

async function db() {
  if (!isSupabaseConfigured) return null;
  return createClient();
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const getSettings = unstable_cache(
  async (): Promise<Record<string, Record<string, string | number>>> => {
    const supabase = getPublicClient();
    if (!supabase) return {};
    const { data } = await supabase.from("website_settings").select("key, value");
    const settings: Record<string, Record<string, string | number>> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value as Record<string, string | number>;
    }
    return settings;
  },
  ["settings"],
  { tags: ["settings"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Homepage / public
// ---------------------------------------------------------------------------

export interface HomeStats {
  totalVolunteers: number;
  activeDonors: number;
  eventsCompleted: number;
  trainingSessions: number;
  bloodDonations: number;
  studentsReached: number;
}

const EMPTY_STATS: HomeStats = {
  totalVolunteers: 0,
  activeDonors: 0,
  eventsCompleted: 0,
  trainingSessions: 0,
  bloodDonations: 0,
  studentsReached: 0,
};

// Home stats are fetched live (uncached) so the blood counters update
// the moment a request is confirmed or a donor registers.
export async function getHomeStats(): Promise<HomeStats> {
    const supabase = getPublicClient();
    if (!supabase) return EMPTY_STATS;
    const [teamMembers, donors, events, trainings, requests, activities] = await Promise.all([
      supabase.from("public_team_members").select("id", { count: "exact", head: true }),
      supabase
        .from("public_blood_donors")
        .select("id", { count: "exact", head: true })
        .eq("availability", "AVAILABLE"),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
      supabase.from("training").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
      // Only count units after the admin confirmed the donation happened —
      // a COMPLETED request alone is not enough. Sum the units actually
      // donated (recorded at confirmation), falling back to the requested
      // units for requests confirmed before that field existed.
      supabase
        .from("public_blood_requests")
        .select("units, units_donated")
        .eq("status", "COMPLETED")
        .eq("donation_confirmed", true),
      supabase.from("activities").select("participants"),
    ]);

    const bloodUnits = (requests.data ?? []).reduce(
      (sum, r) => sum + (r.units_donated ?? r.units ?? 0),
      0
    );
    const reached = (activities.data ?? []).reduce((sum, a) => sum + (a.participants ?? 0), 0);

    return {
      totalVolunteers: teamMembers.count ?? 0,
      activeDonors: donors.count ?? 0,
      eventsCompleted: events.count ?? 0,
      trainingSessions: trainings.count ?? 0,
      bloodDonations: bloodUnits,
      studentsReached: reached,
    };
  }

export const getFounders = unstable_cache(
  async (): Promise<Founder[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("founders")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("display_order", { ascending: true });
    return data ?? [];
  },
  ["founders"],
  { tags: ["founders"], revalidate: 60 }
);

export const getCommunityMembers = unstable_cache(
  async (): Promise<CommunityMember[]> => {
    const supabase = getPublicClient();
    // No database (or no members yet): show the default leadership tree so the
    // page is never empty. Real data replaces it as soon as it exists.
    if (!supabase) {
      return DEFAULT_COMMUNITY_MEMBERS.map(defaultCommunityMember);
    }
    const { data } = await supabase
      .from("community_members")
      .select("*")
      .eq("is_active", true)
      .order("level", { ascending: true })
      .order("display_order", { ascending: true });
    const members = data ?? [];
    return members.length > 0 ? members : DEFAULT_COMMUNITY_MEMBERS.map(defaultCommunityMember);
  },
  ["community-members"],
  { tags: ["community"], revalidate: 60 }
);

/** Maps a default/demo member entry to the full CommunityMember shape. */
function defaultCommunityMember(
  m: (typeof DEFAULT_COMMUNITY_MEMBERS)[number],
  index: number
): CommunityMember {
  const now = new Date().toISOString();
  return {
    id: `demo-${index}`,
    name: m.name,
    photo_url: null,
    position: m.position,
    sub_role: m.sub_role,
    level: m.level,
    display_order: m.display_order,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export const getUpcomingEvents = unstable_cache(
  async (limit = 3): Promise<Event[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["UPCOMING", "ONGOING"])
      .order("date", { ascending: true })
      .limit(limit);
    return data ?? [];
  },
  ["upcoming-events"],
  { tags: ["events"], revalidate: 60 }
);

export const getPublishedNotices = unstable_cache(
  async (limit = 4): Promise<Notice[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["published-notices"],
  { tags: ["notices"], revalidate: 60 }
);

export const getRecentActivities = unstable_cache(
  async (limit = 6): Promise<Activity[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["recent-activities"],
  { tags: ["activities"], revalidate: 60 }
);

export const getAlbums = unstable_cache(
  async (limit = 6): Promise<GalleryAlbum[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("gallery_albums")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    return data ?? [];
  },
  ["albums"],
  { tags: ["gallery"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Volunteers (public)
// ---------------------------------------------------------------------------

export const getPublicTeamMembers = unstable_cache(
  async (params?: {
    search?: string;
    department?: string;
    limit?: number;
  }): Promise<PublicTeamMember[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    let query = supabase.from("public_team_members").select("*");

    if (params?.search) {
      query = query.ilike("name", `%${params.search}%`);
    }
    if (params?.department) {
      query = query.eq("department", params.department);
    }

    const { data } = await query
      .order("points", { ascending: false })
      .limit(params?.limit ?? 100);
    return data ?? [];
  },
  ["public-volunteers"],
  { tags: ["volunteers"], revalidate: 60 }
);

export const getTeamMemberAchievements = unstable_cache(
  async (teamMemberId: string): Promise<Achievement[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("achievements")
      .select("*")
      .eq("volunteer_id", teamMemberId)
      .order("date", { ascending: false });
    return data ?? [];
  },
  ["volunteer-achievements"],
  { tags: ["volunteers"], revalidate: 60 }
);

export const getTeamMemberCertificates = unstable_cache(
  async (teamMemberId: string): Promise<Certificate[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("certificates")
      .select("*")
      .eq("volunteer_id", teamMemberId)
      .order("issued_at", { ascending: false });
    return data ?? [];
  },
  ["volunteer-certificates"],
  { tags: ["certificates"], revalidate: 60 }
);

export interface TeamMemberParticipationHistoryItem {
  id: string;
  title: string;
  type: "event" | "activity";
  date: string | null;
  category: string | null;
}

export const getTeamMemberParticipationHistory = unstable_cache(
  async (teamMemberId: string): Promise<TeamMemberParticipationHistoryItem[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("participation_requests")
      .select(
        "id, event_id, activity_id, status, " +
          "events(id, title, date, category, status), activities(id, title, date, category)"
      )
      .eq("volunteer_id", teamMemberId)
      .eq("status", "APPROVED");

    const items: TeamMemberParticipationHistoryItem[] = [];
    for (const row of ((data ?? []) as any[])) {
      if (row.events) {
        if (row.events.status === "COMPLETED" || row.events.status === "ONGOING") {
          items.push({
            id: row.events.id,
            title: row.events.title,
            type: "event",
            date: row.events.date,
            category: row.events.category,
          });
        }
      } else if (row.activities) {
        items.push({
          id: row.activities.id,
          title: row.activities.title,
          type: "activity",
          date: row.activities.date,
          category: row.activities.category,
        });
      }
    }
    return items;
  },
  ["volunteer-participation-history"],
  { tags: ["volunteers", "events", "activities"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Blood support (public)
// ---------------------------------------------------------------------------

// Blood queries are fetched live (uncached) so new donors, requests and
// status changes appear immediately — including public self-service actions
// that don't run through the admin tag-revalidation path.
export async function getDonors(params?: {
  bloodGroup?: string;
  area?: string;
}): Promise<PublicBloodDonor[]> {
    const supabase = getPublicClient();
    if (!supabase) return [];
    let query = supabase
      .from("public_blood_donors")
      .select("*")
      .eq("availability", "AVAILABLE");

    if (params?.bloodGroup) {
      query = query.eq("blood_group", params.bloodGroup);
    }
    if (params?.area) {
      query = query.ilike("area", `%${params.area}%`);
    }

    const { data } = await query.order("name", { ascending: true });
    return data ?? [];
  }

export async function getPublicBloodRequests(): Promise<PublicBloodRequest[]> {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("public_blood_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    return data ?? [];
  }

export async function getPublicBloodRequestById(id: string): Promise<PublicBloodRequest | null> {
    const supabase = getPublicClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("public_blood_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data;
  }

// ---------------------------------------------------------------------------
// Events (public)
// ---------------------------------------------------------------------------

export const getPublicEvents = unstable_cache(
  async (params?: {
    category?: string;
    status?: string;
    limit?: number;
  }): Promise<Event[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    let query = supabase.from("events").select("*");

    if (params?.category) query = query.eq("category", params.category);
    if (params?.status) query = query.eq("status", params.status);

    const { data } = await query
      .order("date", { ascending: true })
      .limit(params?.limit ?? 60);
    return data ?? [];
  },
  ["public-events"],
  { tags: ["events"], revalidate: 60 }
);

export const getPublicEventBySlug = unstable_cache(
  async (slug: string): Promise<Event | null> => {
    const supabase = getPublicClient();
    if (!supabase) return null;
    const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
    return data;
  },
  ["public-event"],
  { tags: ["events"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Activities / notices / gallery / training (public)
// ---------------------------------------------------------------------------

export const getPublicActivities = unstable_cache(
  async (): Promise<Activity[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("activities")
      .select("*")
      .order("date", { ascending: false });
    return data ?? [];
  },
  ["public-activities"],
  { tags: ["activities"], revalidate: 60 }
);

export const getPublicNotices = unstable_cache(
  async (): Promise<Notice[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    return data ?? [];
  },
  ["public-notices"],
  { tags: ["notices"], revalidate: 60 }
);

export const getPublicNoticeBySlug = unstable_cache(
  async (slug: string): Promise<Notice | null> => {
    const supabase = getPublicClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("notices")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data;
  },
  ["public-notice"],
  { tags: ["notices"], revalidate: 60 }
);

export const getNoticeAttachments = unstable_cache(
  async (noticeId: string): Promise<NoticeAttachment[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("notice_attachments")
      .select("*")
      .eq("notice_id", noticeId);
    return data ?? [];
  },
  ["notice-attachments"],
  { tags: ["notices"], revalidate: 60 }
);

export const getAllAlbums = unstable_cache(
  async (): Promise<GalleryAlbum[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("gallery_albums")
      .select("*")
      .order("date", { ascending: false });
    return data ?? [];
  },
  ["all-albums"],
  { tags: ["gallery"], revalidate: 60 }
);

export const getAlbumBySlug = unstable_cache(
  async (slug: string): Promise<GalleryAlbum | null> => {
    const supabase = getPublicClient();
    if (!supabase) return null;
    const { data } = await supabase
      .from("gallery_albums")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data;
  },
  ["album"],
  { tags: ["gallery"], revalidate: 60 }
);

export const getAlbumImages = unstable_cache(
  async (albumId: string): Promise<GalleryImage[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("album_id", albumId)
      .order("sort", { ascending: true });
    return data ?? [];
  },
  ["album-images"],
  { tags: ["gallery"], revalidate: 60 }
);

export const getPublicTrainings = unstable_cache(
  async (): Promise<Training[]> => {
    const supabase = getPublicClient();
    if (!supabase) return [];
    const { data } = await supabase
      .from("training")
      .select("*")
      .order("date", { ascending: false });
    return data ?? [];
  },
  ["public-trainings"],
  { tags: ["training"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Participation (public counts)
// ---------------------------------------------------------------------------

export interface ParticipationCounts {
  events: Record<string, number>;
  activities: Record<string, number>;
}

/** Approved participant counts per event / activity, for the public pages. */
export const getParticipationCounts = unstable_cache(
  async (): Promise<ParticipationCounts> => {
    const supabase = getPublicClient();
    const counts: ParticipationCounts = { events: {}, activities: {} };
    if (!supabase) return counts;
    const { data } = await supabase
      .from("public_participation_counts")
      .select("event_id, activity_id, approved_count");
    for (const row of data ?? []) {
      if (row.event_id) counts.events[row.event_id] = row.approved_count;
      if (row.activity_id) counts.activities[row.activity_id] = row.approved_count;
    }
    return counts;
  },
  ["participation-counts"],
  // Approved requests change the counts, so both content tags invalidate them.
  { tags: ["events", "activities"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Certificate verification (public)
// ---------------------------------------------------------------------------

export interface CertificateVerification {
  certificate_title: string;
  issued_at: string | null;
  volunteer_name: string;
  member_id: string | null;
  valid: boolean;
}

export const getCertificateVerification = unstable_cache(
  async (token: string): Promise<CertificateVerification | null> => {
    const supabase = getPublicClient();
    if (!supabase) return null;
    const { data } = await supabase.rpc("verify_certificate", { p_token: token });
    return data && data.length > 0 ? data[0] : null;
  },
  ["certificate-verification"],
  { tags: ["certificates"], revalidate: 60 }
);

// ---------------------------------------------------------------------------
// Admin-only reads (RLS enforces the role; never cached — always fresh)
// ---------------------------------------------------------------------------

export async function adminGetTeamMembers(params?: {
  status?: string;
  search?: string;
  department?: string;
  publicProfile?: boolean;
  limit?: number;
}): Promise<TeamMember[]> {
  const supabase = await db();
  if (!supabase) return [];
  let query = supabase.from("team_members").select("*");
  if (params?.status) query = query.eq("status", params.status);
  if (params?.search) query = query.ilike("name", `%${params.search}%`);
  if (params?.department) query = query.eq("department", params.department);
  if (params?.publicProfile !== undefined) query = query.eq("public_profile", params.publicProfile);
  const { data } = await query.order("created_at", { ascending: false }).limit(params?.limit ?? 200);
  return data ?? [];
}

export async function adminGetTeamMember(id: string): Promise<TeamMember | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase.from("team_members").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function adminGetStudents(): Promise<Student[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("students")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetBloodRequests(): Promise<BloodRequest[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blood_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetDonors(): Promise<BloodDonor[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blood_donors")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetContactRequests(): Promise<BloodContactRequest[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("blood_contact_requests")
    .select("*, blood_donors(name, blood_group)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetEvents(): Promise<Event[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("event_registrations")
    .select("*, team_members(member_id, name), students(roll, name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function adminGetFounders(): Promise<Founder[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("founders")
    .select("*")
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });
  return data ?? [];
}

export async function adminGetCommunityMembers(): Promise<CommunityMember[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("community_members")
    .select("*")
    .order("level", { ascending: true })
    .order("display_order", { ascending: true });
  return data ?? [];
}

export async function adminGetNotices(): Promise<Notice[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notices")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetNoticeAttachments(noticeId: string) {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notice_attachments")
    .select("*")
    .eq("notice_id", noticeId);
  return data ?? [];
}

export async function adminGetActivities(): Promise<Activity[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetTrainings(): Promise<Training[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("training")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetAlbums(): Promise<GalleryAlbum[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("gallery_albums")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export interface AdminMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export async function adminGetMessages(): Promise<AdminMessage[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, status, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetUnreadMessageCount(): Promise<number> {
  const supabase = await db();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "NEW");
  return count ?? 0;
}

export async function adminGetTrainingParticipants(
  trainingId: string
): Promise<AdminTrainingParticipant[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("training_participants")
    .select("*, team_members(name, member_id, position)")
    .eq("training_id", trainingId)
    .order("created_at", { ascending: true });
  return (data ?? []) as AdminTrainingParticipant[];
}

export async function getMyCertificates(
  teamMemberId: string
): Promise<Certificate[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("volunteer_id", teamMemberId)
    .order("issued_at", { ascending: false });
  return (data ?? []) as Certificate[];
}

export async function getMyTrainingEnrollments(
  teamMemberId: string
): Promise<MyTrainingEnrollment[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("training_participants")
    .select("id, training_id, status, created_at, training(title, date, category, status)")
    .eq("volunteer_id", teamMemberId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as MyTrainingEnrollment[];
}

export async function adminGetAttendanceForEvent(eventId: string): Promise<Attendance[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("event_id", eventId);
  return data ?? [];
}

export async function adminGetPoints(teamMemberId: string): Promise<TeamMemberPoint[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("volunteer_points")
    .select("*")
    .eq("volunteer_id", teamMemberId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function adminGetCertificates(): Promise<Certificate[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Count of certificates issued per training (only certificates linked to a
 * training — i.e. issued from the training participants dialog).
 */
export async function adminGetTrainingCertificateCounts(): Promise<Record<string, number>> {
  const supabase = await db();
  if (!supabase) return {};
  const { data } = await supabase
    .from("certificates")
    .select("training_id")
    .not("training_id", "is", null);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.training_id) counts[row.training_id] = (counts[row.training_id] ?? 0) + 1;
  }
  return counts;
}

export interface AdminParticipationRequest {
  id: string;
  volunteer_id: string;
  event_id: string | null;
  activity_id: string | null;
  status: string;
  created_at: string;
  volunteer_name: string;
  volunteer_member_id: string | null;
  event_title: string | null;
  activity_title: string | null;
}

interface ParticipationRequestRow {
  id: string;
  volunteer_id: string;
  event_id: string | null;
  activity_id: string | null;
  status: string;
  created_at: string;
  team_members?: { name: string | null; member_id: string | null } | null;
  events?: { title: string | null } | null;
  activities?: { title: string | null } | null;
}

export async function adminGetParticipationRequests(): Promise<AdminParticipationRequest[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("participation_requests")
    .select(
      "id, volunteer_id, event_id, activity_id, status, created_at, " +
        "team_members(name, member_id), events(title), activities(title)"
    )
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as ParticipationRequestRow[]).map((r) => ({
    id: r.id,
    volunteer_id: r.volunteer_id,
    event_id: r.event_id,
    activity_id: r.activity_id,
    status: r.status,
    created_at: r.created_at,
    volunteer_name: r.team_members?.name ?? "Unknown",
    volunteer_member_id: r.team_members?.member_id ?? null,
    event_title: r.events?.title ?? null,
    activity_title: r.activities?.title ?? null,
  }));
}

export async function getTeamMemberParticipation(
  teamMemberId: string
): Promise<ParticipationRequest[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("participation_requests")
    .select("*")
    .eq("volunteer_id", teamMemberId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Pending "Request Contact" submissions for the current user's own
 * donor listing(s) — shown as a notification in their portal. The
 * RPC is security-definer and resolves the donor via the session
 * user's team member / student account, so it never leaks another
 * donor's requests.
 */
export async function getMyDonorContactRequests(): Promise<DonorContactNotification[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_my_donor_contact_requests");
  if (error) {
    console.error("getMyDonorContactRequests error:", error);
    return [];
  }
  return (data ?? []) as DonorContactNotification[];
}

export async function adminGetAuditLogs(limit = 50) {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
