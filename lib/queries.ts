import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEFAULT_COMMUNITY_MEMBERS } from "@/lib/constants";
import type {
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
  PublicBloodDonor,
  PublicBloodRequest,
  PublicVolunteer,
  TeamMember,
  Training,
  Volunteer,
  VolunteerPoint,
} from "@/types/database";

async function db() {
  if (!isSupabaseConfigured) return null;
  return createClient();
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<Record<string, Record<string, string | number>>> {
  const supabase = await db();
  if (!supabase) return {};
  const { data } = await supabase.from("website_settings").select("key, value");
  const settings: Record<string, Record<string, string | number>> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value as Record<string, string | number>;
  }
  return settings;
}

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

export async function getHomeStats(): Promise<HomeStats> {
  const supabase = await db();
  if (!supabase) return EMPTY_STATS;
  const [volunteers, donors, events, trainings, requests, activities] = await Promise.all([
    supabase.from("public_volunteers").select("id", { count: "exact", head: true }),
    supabase
      .from("public_blood_donors")
      .select("id", { count: "exact", head: true })
      .eq("availability", "AVAILABLE"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
    supabase.from("training").select("id", { count: "exact", head: true }).eq("status", "COMPLETED"),
    supabase.from("public_blood_requests").select("units").eq("status", "COMPLETED"),
    supabase.from("activities").select("participants"),
  ]);

  const bloodUnits = (requests.data ?? []).reduce((sum, r) => sum + (r.units ?? 0), 0);
  const reached = (activities.data ?? []).reduce((sum, a) => sum + (a.participants ?? 0), 0);

  return {
    totalVolunteers: volunteers.count ?? 0,
    activeDonors: donors.count ?? 0,
    eventsCompleted: events.count ?? 0,
    trainingSessions: trainings.count ?? 0,
    bloodDonations: bloodUnits,
    studentsReached: reached,
  };
}

export async function getTopVolunteers(limit = 6): Promise<PublicVolunteer[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_volunteers")
    .select("*")
    .order("points", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  return data ?? [];
}

export async function getFounders(): Promise<Founder[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("founders")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });
  return data ?? [];
}

export async function getCommunityMembers(): Promise<CommunityMember[]> {
  const supabase = await db();
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
}

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

export async function getUpcomingEvents(limit = 3): Promise<Event[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("events")
    .select("*")
    .in("status", ["UPCOMING", "ONGOING"])
    .order("date", { ascending: true })
    .limit(limit);
  return data ?? [];
}

export async function getPublishedNotices(limit = 4): Promise<Notice[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notices")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getRecentActivities(limit = 6): Promise<Activity[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("activities")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getAlbums(limit = 6): Promise<GalleryAlbum[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("gallery_albums")
    .select("*")
    .order("date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Volunteers (public)
// ---------------------------------------------------------------------------

export async function getPublicVolunteers(params?: {
  search?: string;
  department?: string;
  semester?: string;
  limit?: number;
}): Promise<PublicVolunteer[]> {
  const supabase = await db();
  if (!supabase) return [];
  let query = supabase.from("public_volunteers").select("*");

  if (params?.search) {
    query = query.ilike("name", `%${params.search}%`);
  }
  if (params?.department) {
    query = query.eq("department", params.department);
  }
  if (params?.semester) {
    query = query.eq("semester", params.semester);
  }

  const { data } = await query
    .order("points", { ascending: false })
    .limit(params?.limit ?? 100);
  return data ?? [];
}

export async function getPublicVolunteer(id: string): Promise<PublicVolunteer | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("public_volunteers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function getVolunteerByMemberId(memberId: string): Promise<PublicVolunteer | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("public_volunteers")
    .select("*")
    .eq("member_id", memberId)
    .maybeSingle();
  return data;
}

export async function getVolunteerAchievements(volunteerId: string) {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("achievements")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .order("date", { ascending: false });
  return data ?? [];
}

export async function getVolunteerCertificates(volunteerId: string): Promise<Certificate[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("volunteer_id", volunteerId)
    .order("issued_at", { ascending: false });
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Blood support (public)
// ---------------------------------------------------------------------------

export async function getDonors(params?: {
  bloodGroup?: string;
  area?: string;
}): Promise<PublicBloodDonor[]> {
  const supabase = await db();
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
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("public_blood_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Events (public)
// ---------------------------------------------------------------------------

export async function getPublicEvents(params?: {
  category?: string;
  status?: string;
  limit?: number;
}): Promise<Event[]> {
  const supabase = await db();
  if (!supabase) return [];
  let query = supabase.from("events").select("*");

  if (params?.category) query = query.eq("category", params.category);
  if (params?.status) query = query.eq("status", params.status);

  const { data } = await query
    .order("date", { ascending: true })
    .limit(params?.limit ?? 60);
  return data ?? [];
}

export async function getPublicEventBySlug(slug: string): Promise<Event | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// Activities / notices / gallery / training (public)
// ---------------------------------------------------------------------------

export async function getPublicActivities(): Promise<Activity[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("activities")
    .select("*")
    .order("date", { ascending: false });
  return data ?? [];
}

export async function getPublicNotices(): Promise<Notice[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notices")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPublicNoticeBySlug(slug: string): Promise<Notice | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("notices")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getNoticeAttachments(noticeId: string) {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notice_attachments")
    .select("*")
    .eq("notice_id", noticeId);
  return data ?? [];
}

export async function getAllAlbums(): Promise<GalleryAlbum[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("gallery_albums")
    .select("*")
    .order("date", { ascending: false });
  return data ?? [];
}

export async function getAlbumBySlug(slug: string): Promise<GalleryAlbum | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase
    .from("gallery_albums")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getAlbumImages(albumId: string): Promise<GalleryImage[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("gallery_images")
    .select("*")
    .eq("album_id", albumId)
    .order("sort", { ascending: true });
  return data ?? [];
}

export async function getPublicTrainings(): Promise<Training[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("training")
    .select("*")
    .order("date", { ascending: false });
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Admin-only reads (RLS enforces the role)
// ---------------------------------------------------------------------------

export async function adminGetVolunteers(params?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<Volunteer[]> {
  const supabase = await db();
  if (!supabase) return [];
  let query = supabase.from("volunteers").select("*");
  if (params?.status) query = query.eq("status", params.status);
  if (params?.search) query = query.ilike("name", `%${params.search}%`);
  const { data } = await query.order("created_at", { ascending: false }).limit(params?.limit ?? 200);
  return data ?? [];
}

export async function adminGetVolunteer(id: string): Promise<Volunteer | null> {
  const supabase = await db();
  if (!supabase) return null;
  const { data } = await supabase.from("volunteers").select("*").eq("id", id).maybeSingle();
  return data;
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
    .select("*")
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
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function adminGetTeam(): Promise<TeamMember[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("team_members")
    .select("*")
    .order("display_order", { ascending: true });
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

export async function adminGetMessages(): Promise<
  { id: string; name: string; subject: string | null; status: string; created_at: string }[]
> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, subject, status, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
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

export async function adminGetPoints(volunteerId: string): Promise<VolunteerPoint[]> {
  const supabase = await db();
  if (!supabase) return [];
  const { data } = await supabase
    .from("volunteer_points")
    .select("*")
    .eq("volunteer_id", volunteerId)
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
