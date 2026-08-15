export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "VOLUNTEER_MANAGER"
  | "EVENT_MANAGER"
  | "CONTENT_MANAGER"
  | "USER"
  | "STUDENT"
  | "VOLUNTEER";

export type VolunteerStatus = "PENDING" | "APPROVED" | "REJECTED";
export type BloodRequestStatus =
  | "PENDING"
  | "CONTACTING_DONOR"
  | "DONOR_FOUND"
  | "COMPLETED"
  | "CANCELLED";
export type EmergencyLevel = "EMERGENCY" | "URGENT" | "NORMAL";
export type EventStatus =
  | "UPCOMING"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED"
  | "DRAFT";
export type Availability = "AVAILABLE" | "UNAVAILABLE";
export type TrainingStatus = "UPCOMING" | "ONGOING" | "COMPLETED";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string | null;
  name: string;
  session: string;
  semester: string;
  roll: string;
  department: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Volunteer {
  id: string;
  user_id: string | null;
  member_id: string | null;
  name: string;
  student_id: string | null;
  roll: string | null;
  registration_no: string | null;
  department: string | null;
  semester: string | null;
  phone: string | null;
  email: string | null;
  blood_group: string | null;
  area: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  skills: string[];
  experience: string | null;
  motivation: string | null;
  photo_url: string | null;
  position: string;
  status: VolunteerStatus;
  public_profile: boolean;
  points: number;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Safe, public-facing volunteer record (view). */
export interface PublicVolunteer {
  id: string;
  member_id: string | null;
  name: string;
  department: string | null;
  semester: string | null;
  blood_group: string | null;
  area: string | null;
  photo_url: string | null;
  position: string;
  points: number;
  joined_at: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  photo_url: string | null;
  position: string;
  department: string | null;
  semester: string | null;
  bio: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FounderCategory = "FOUNDER" | "PRINCIPAL";

export interface Founder {
  id: string;
  name: string;
  photo_url: string | null;
  title: string | null;
  bio: string | null;
  category: FounderCategory;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  id: string;
  name: string;
  photo_url: string | null;
  position: string;
  sub_role: string | null;
  level: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BloodDonor {
  id: string;
  volunteer_id: string | null;
  name: string;
  blood_group: string;
  area: string | null;
  availability: Availability;
  last_donation_date: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Safe, public-facing donor record (view). */
export interface PublicBloodDonor {
  id: string;
  name: string;
  blood_group: string;
  area: string | null;
  availability: Availability;
  last_donation_date: string | null;
}

export interface BloodRequest {
  id: string;
  patient_name: string;
  blood_group: string;
  units: number;
  hospital: string | null;
  location: string | null;
  required_date: string | null;
  required_time: string | null;
  requester_name: string;
  contact: string;
  emergency_level: EmergencyLevel;
  additional_info: string | null;
  status: BloodRequestStatus;
  created_at: string;
  updated_at: string;
}

/** Safe, public-facing blood request (view). */
export interface PublicBloodRequest {
  id: string;
  patient_name: string;
  blood_group: string;
  units: number;
  hospital: string | null;
  location: string | null;
  required_date: string | null;
  required_time: string | null;
  emergency_level: EmergencyLevel;
  status: BloodRequestStatus;
  created_at: string;
}

export interface BloodContactRequest {
  id: string;
  donor_id: string;
  requester_name: string;
  requester_contact: string;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  cover_image: string | null;
  description: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  category: string | null;
  organizer: string | null;
  registration_enabled: boolean;
  max_participants: number | null;
  status: EventStatus;
  report: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  volunteer_id: string | null;
  name: string;
  phone: string;
  department: string | null;
  status: "REGISTERED" | "ATTENDED" | "CANCELLED";
  created_at: string;
}

export type ParticipationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ParticipationRequest {
  id: string;
  volunteer_id: string;
  event_id: string | null;
  activity_id: string | null;
  status: ParticipationStatus;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  category: string | null;
  description: string | null;
  images: string[];
  participants: number;
  impact: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  category: string | null;
  pinned: boolean;
  published: boolean;
  publish_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoticeAttachment {
  id: string;
  notice_id: string;
  name: string;
  url: string;
  size: number | null;
  created_at: string;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  event_id: string | null;
  date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: string;
  album_id: string;
  url: string;
  caption: string | null;
  sort: number;
  created_at: string;
}

export interface Training {
  id: string;
  slug: string;
  title: string;
  date: string | null;
  trainer: string | null;
  location: string | null;
  description: string | null;
  category: string | null;
  status: TrainingStatus;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  volunteer_id: string;
  title: string;
  issued_at: string | null;
  file_url: string | null;
  verify_token: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  volunteer_id: string;
  status: "PRESENT" | "ABSENT";
  scanned_at: string;
  created_at: string;
}

export interface VolunteerPoint {
  id: string;
  volunteer_id: string;
  points: number;
  reason: string | null;
  category: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  volunteer_id: string;
  title: string;
  description: string | null;
  date: string | null;
  created_at: string;
}

export interface WebsiteSettings {
  [key: string]: Record<string, string | number>;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "NEW" | "READ" | "ARCHIVED";
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
