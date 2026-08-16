import type { UserRole } from "@/types/database";

export const SITE_NAME = "Rajshahi Polytechnic Institute Red Crescent Society";
export const SITE_SHORT_NAME = "RPI Red Crescent Society";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const DEPARTMENTS = [
  "Computer Science & Technology",
  "Electronics Technology",
  "Electrical Technology",
  "Mechanical Technology",
  "Civil Technology",
  "Power Technology",
  "Food Technology",
  "Automobile Technology",
  "Architecture & Interior Design",
  "Refrigeration & Air Conditioning",
  "Other",
] as const;

export const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"] as const;

export const SESSIONS = ["22-23", "23-24", "24-25", "25-26", "26-27"] as const;

/** Leadership hierarchy — the admin declares each member's position. */
export const TEAM_POSITIONS = [
  "Team Leader",
  "Deputy Team Leader",
  "Group Leader",
  "Assistant Group Leader",
  "General Member",
] as const;

/**
 * Society-wide leadership positions that are not tied to any RCY department —
 * Team Leader and Deputy Team Leader oversee all wings, so they never get a
 * department assignment.
 */
export const NON_DEPARTMENT_POSITIONS = ["Team Leader", "Deputy Team Leader"] as const;

/** Red Crescent Youth internal departments — the admin assigns one to each member. */
export const RCY_DEPARTMENTS = [
  "Administration, Organisation & Recruitment",
  "Training and Co-Curriculum",
  "ICT Media & Communication",
  "Disaster & Humanitarian Response",
  "Health & Services",
  "Resource Mobilization",
] as const;

export const TRAINING_PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending approval",
  APPROVED: "Enrolled",
  REJECTED: "Not approved",
  COMPLETED: "Completed",
  DROPPED: "Not enrolled",
};

export const EVENT_CATEGORIES = [
  "Blood Donation",
  "First Aid",
  "Disaster Response",
  "Awareness",
  "Community Service",
  "Training",
  "Campus Activity",
  "Seminar",
  "Other",
] as const;

export const ACTIVITY_CATEGORIES = [
  "Blood Donation",
  "First Aid",
  "Disaster Preparedness",
  "Awareness",
  "Clean Campus",
  "Community Service",
  "Educational Program",
  "Other",
] as const;

export const TRAINING_CATEGORIES = [
  "First Aid",
  "CPR",
  "Disaster Management",
  "Blood Donation Awareness",
  "Leadership",
  "Team Member Orientation",
  "Other",
] as const;

export const NOTICE_CATEGORIES = [
  "General",
  "Blood Donation",
  "Training",
  "Event",
  "Meeting",
  "Urgent",
  "Other",
] as const;

export const FOUNDER_CATEGORIES = [
  { value: "FOUNDER", label: "Founder" },
  { value: "PRINCIPAL", label: "Principal" },
] as const;

export const FOUNDER_CATEGORY_LABELS: Record<string, string> = {
  FOUNDER: "Founder",
  PRINCIPAL: "Principal",
};

export const COMMUNITY_LEVELS = [
  { value: 1, label: "Incharge Teacher" },
  { value: 2, label: "Team Leader" },
  { value: 3, label: "Deputy Leader" },
  { value: 4, label: "Group Leader" },
  { value: 5, label: "Assistant Group Leader" },
] as const;

export const COMMUNITY_LEVEL_LABELS: Record<number, string> = {
  1: "Incharge Teacher",
  2: "Team Leader",
  3: "Deputy Leader",
  4: "Group Leader",
  5: "Assistant Group Leader",
};

export const COMMUNITY_POSITIONS = [
  "INCHARGE TEACHER",
  "TEAM LEADER",
  "DEPUTY LEADER",
  "GROUP LEADER",
  "ASST. GROUP LEADER",
] as const;

/**
 * Demo/default leadership tree shown on the /community page whenever the
 * database has no members yet (Supabase not configured, or table empty).
 * Once the admin adds their own members these are replaced by real data.
 * Photos are intentionally null — the page shows a silhouette avatar.
 */
export const DEFAULT_COMMUNITY_MEMBERS: {
  name: string;
  position: string;
  sub_role: string | null;
  level: number;
  display_order: number;
}[] = [
  { name: "Md. Nurul Amin", position: "INCHARGE TEACHER", sub_role: null, level: 1, display_order: 0 },
  { name: "MD. Rejwan", position: "TEAM LEADER", sub_role: null, level: 2, display_order: 0 },
  { name: "Hossain Mohammad Esam", position: "DEPUTY LEADER - 01", sub_role: null, level: 3, display_order: 0 },
  { name: "Most. Nusrat Jahan", position: "DEPUTY LEADER - 02", sub_role: null, level: 3, display_order: 1 },
  { name: "MD. Sojol", position: "GROUP LEADER", sub_role: "Administration, Organisation & Recruitment", level: 4, display_order: 0 },
  { name: "Oliullah Shawon", position: "GROUP LEADER", sub_role: "Training and Co-Curriculum", level: 4, display_order: 1 },
  { name: "Minhajul Abadin Pius", position: "GROUP LEADER", sub_role: "ICT Media & Communication", level: 4, display_order: 2 },
  { name: "Md. Jakariya", position: "GROUP LEADER", sub_role: "Disaster & Humanitarian Response", level: 4, display_order: 3 },
  { name: "Saifullah Mansur Noman", position: "GROUP LEADER", sub_role: "Health & Services", level: 4, display_order: 4 },
  { name: "Md. Istiyak Ahmed Ihan", position: "GROUP LEADER", sub_role: "Resource Mobilization", level: 4, display_order: 5 },
  { name: "Noor Muhammad Ali", position: "ASST. GROUP LEADER", sub_role: "Administration, Organisation & Recruitment", level: 5, display_order: 0 },
  { name: "Suraiaya Yasmin Setu", position: "ASST. GROUP LEADER", sub_role: "Training and Co-Curriculum", level: 5, display_order: 1 },
  { name: "Md. Sayem Shahadat", position: "ASST. GROUP LEADER", sub_role: "ICT Media & Communication", level: 5, display_order: 2 },
  { name: "Md. Tamim Hossain", position: "ASST. GROUP LEADER", sub_role: "Disaster & Humanitarian Response", level: 5, display_order: 3 },
  { name: "Md. Abdul Bari", position: "ASST. GROUP LEADER", sub_role: "Health & Services", level: 5, display_order: 4 },
  { name: "Md. Maruf Islam", position: "ASST. GROUP LEADER", sub_role: "Resource Mobilization", level: 5, display_order: 5 },
];

export const ADMIN_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "VOLUNTEER_MANAGER",
  "EVENT_MANAGER",
  "CONTENT_MANAGER",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  VOLUNTEER_MANAGER: "Team Manager",
  EVENT_MANAGER: "Event Manager",
  CONTENT_MANAGER: "Content Manager",
  USER: "User",
  STUDENT: "Student",
  VOLUNTEER: "Team Member",
};

export const POINT_CATEGORIES = {
  EVENT_PARTICIPATION: 5,
  TRAINING: 10,
  BLOOD_DONATION: 20,
  CAMPAIGN_PARTICIPATION: 5,
  LEADERSHIP: 15,
} as const;

export const TEAM_MEMBER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const BLOOD_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONTACTING_DONOR: "Contacting Donor",
  DONOR_FOUND: "Donor Found",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Upcoming",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
};

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(
  date: string | Date | null | undefined,
  locale = "en-GB"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(
  date: string | Date | null | undefined,
  locale = "en-GB"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
