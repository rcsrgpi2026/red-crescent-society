import type { UserRole } from "@/types/database";

export type NotificationType =
  | "notice"
  | "blood_request"
  | "emergency"
  | "volunteer"
  | "event"
  | "system";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export type DeliveryStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "dismissed"
  | "responded"
  | "failed";

export interface TargetCriteria {
  roles?: UserRole[];
  bloodGroups?: string[];
  districts?: string[];
  departments?: string[];
  rcyDepartments?: string[];
  specificUserIds?: string[];
  isVolunteerOnly?: boolean;
  isDonorOnly?: boolean;
  availableOnly?: boolean;
  minScoreThreshold?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  priority: NotificationPriority;
  image_url?: string | null;
  action_url?: string | null;
  metadata?: Record<string, unknown>;
  target_criteria?: TargetCriteria;
  created_by?: string | null;
  created_at: string;
  scheduled_at?: string | null;
  expires_at?: string | null;
}

export interface UserNotificationItem {
  id: string;
  notification_id: string;
  user_id: string;
  status: DeliveryStatus;
  score: number;
  sent_at?: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  responded_at?: string | null;
  created_at: string;
  notification?: NotificationItem;
}

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  general_notice: boolean;
  blood_request: boolean;
  emergency_alert: boolean;
  volunteer_notification: boolean;
  event_notification: boolean;
  system_notification: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at?: string;
  updated_at?: string;
}

export interface PushSubscriptionItem {
  id?: string;
  user_id?: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  platform?: string | null;
  browser?: string | null;
  device_name?: string | null;
  user_agent?: string | null;
  is_active: boolean;
  created_at?: string;
  last_used_at?: string;
}

export interface CandidateUser {
  userId: string;
  fullName?: string | null;
  role?: UserRole | null;
  bloodGroup?: string | null;
  district?: string | null;
  area?: string | null;
  isVolunteer: boolean;
  volunteerStatus?: string | null;
  volunteerDepartment?: string | null;
  volunteerRcyDepartment?: string | null;
  isStudent: boolean;
  isDonor: boolean;
  donorAvailability?: string | null;
  preferences?: NotificationPreferences | null;
  pushSubscriptions: PushSubscriptionItem[];
  recentNotificationsCount24h: number;
  recentSimilarNotificationsCount24h: number;
  lastNotificationSentAt?: string | null;
}

export interface UserScoringEvaluation {
  candidate: CandidateUser;
  score: number;
  eligible: boolean;
  rejectionReason?: string;
  scoreBreakdown: Record<string, number>;
}

export interface NotificationDispatchResult {
  notificationId: string;
  totalEvaluated: number;
  totalEligible: number;
  totalSent: number;
  totalPushSent: number;
  totalPushFailed: number;
  inAppCreated: number;
}
