/**
 * Core Type Definitions for RCY AI Website Assistant
 * Strict, deterministic contracts for Intents, Routes, Forms, Actions, and Sanitized Live DTOs.
 */

export type AssistantIntent =
  | "NAVIGATION"
  | "LIVE_DATA"
  | "SITE_STATS"
  | "BLOOD_SUPPORT"
  | "EVENT_ACTIVITY"
  | "TEAM_FOUNDER"
  | "NOTICE"
  | "RECRUITMENT"
  | "FORM_GUIDANCE"
  | "FAQ"
  | "TROUBLESHOOTING"
  | "KNOWLEDGE"
  | "EMERGENCY"
  | "UNRELATED"
  | "UNKNOWN";

export type RouteCategory =
  | "blood"
  | "volunteer"
  | "info"
  | "portal"
  | "organization"
  | "general";

export interface RcyRoute {
  id: string;
  path: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  keywords: string[];
  isPublic: boolean;
  requiresAuth: boolean;
  category: RouteCategory;
}

export interface FormFieldMetadata {
  name: string;
  label: string;
  labelBn: string;
  type: "text" | "select" | "number" | "date" | "time" | "textarea" | "radio" | "email" | "tel";
  required: boolean;
  description: string;
  descriptionBn: string;
  options?: string[];
  placeholder?: string;
}

export interface FormDefinition {
  id: string;
  name: string;
  nameBn: string;
  route: string;
  purpose: string;
  purposeBn: string;
  fields: FormFieldMetadata[];
  requiredFields: string[];
  commonErrorsBn: string[];
  instructionsBn: string[];
}

export type ActionType =
  | "navigate"
  | "external_link"
  | "scroll_to"
  | "contact"
  | "retry";

export interface AssistantAction {
  type: ActionType;
  label: string;
  target?: string;
}

export type SourceType =
  | "route"
  | "database"
  | "form"
  | "knowledge"
  | "rag"
  | "mixed"
  | "fallback";

export interface AssistantResponse {
  message: string;
  actions?: AssistantAction[];
  sourceType?: SourceType;
  intent?: AssistantIntent;
  dataSummary?: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*                          Sanitized Public DTOs                             */
/* -------------------------------------------------------------------------- */

export interface SanitizedBloodRequestItem {
  id: string;
  patientName?: string;
  bloodGroup: string;
  units: number;
  hospital?: string;
  location?: string;
  hospitalOrLocation: string;
  emergencyLevel: string;
  status: string;
  requiredDate: string | null;
  requiredTime?: string | null;
}

export interface SanitizedBloodSummary {
  activeCount: number;
  totalUnitsNeeded: number;
  groupBreakdown: Record<string, number>;
  availableDonorsByGroup: Record<string, number>;
  emergencyCount: number;
  recentRequests: SanitizedBloodRequestItem[];
}

export interface SanitizedNoticeItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
  hasAttachment?: boolean;
}

export interface SanitizedEventItem {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  status: string;
  location?: string | null;
  category?: string | null;
}

export interface SanitizedRecruitmentSummary {
  isActive: boolean;
  title: string | null;
  description: string | null;
  deadline: string | null;
}

export interface SanitizedHelplineSummary {
  bloodHelpline: string;
  emergencyContact: string;
}

export interface SanitizedSiteImpactStats {
  totalBloodDonations: number;
  completedBloodRequests: number;
  activeDonors: number;
  availableDonorsByGroup: Record<string, number>;
  totalVolunteers: number;
  eventsCompleted: number;
  trainingSessions: number;
  studentsReached: number;
}

export interface SanitizedTrainingItem {
  id: string;
  title: string;
  category: string;
  date: string | null;
  status: string;
  location?: string | null;
}

export interface SanitizedLegacyItem {
  id: string;
  name: string;
  position?: string | null;
  designation?: string | null;
  session?: string | null;
  department?: string | null;
}

export interface SanitizedActivityItem {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  category: string | null;
  description?: string | null;
  impact?: string | null;
  participants?: number | null;
}
