import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rankRecipients, evaluateCandidate } from "./targeting-engine";
import { sendWebPushNotification } from "./web-push";
import type {
  CandidateUser,
  NotificationDispatchResult,
  NotificationItem,
  NotificationPriority,
  NotificationType,
  PushSubscriptionItem,
  TargetCriteria,
} from "./types";

/**
 * Loads all candidate users and their profiles, roles, volunteer & student links,
 * donor listings, notification preferences, push subscriptions, and recent notification history.
 */
export async function loadCandidateUsers(): Promise<CandidateUser[]> {
  if (!isSupabaseConfigured) return [];

  const admin = createAdminClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Load all profiles, volunteers, students, donors, preferences, and subscriptions concurrently
  const [
    { data: profiles },
    { data: teamMembers },
    { data: students },
    { data: donors },
    { data: preferences },
    { data: subscriptions },
    { data: recentNotifs },
  ] = await Promise.all([
    admin.from("profiles").select("id, role, full_name"),
    admin.from("team_members").select("id, user_id, status, department, rcy_department, blood_group, area"),
    admin.from("students").select("id, user_id, department, session, blood_group"),
    admin.from("blood_donors").select("id, volunteer_id, student_id, blood_group, area, availability, is_active"),
    admin.from("notification_preferences").select("*"),
    admin.from("push_subscriptions").select("*").eq("is_active", true),
    admin.from("user_notifications").select("user_id, status, created_at, notifications(type)").gte("created_at", twentyFourHoursAgo),
  ]);

  if (!profiles) return [];

  // Index auxiliary data by user_id
  const teamByUserId = new Map<string, any>();
  const teamById = new Map<string, any>();
  for (const t of teamMembers ?? []) {
    if (t.user_id) teamByUserId.set(t.user_id, t);
    teamById.set(t.id, t);
  }

  const studentByUserId = new Map<string, any>();
  const studentById = new Map<string, any>();
  for (const s of students ?? []) {
    if (s.user_id) studentByUserId.set(s.user_id, s);
    studentById.set(s.id, s);
  }

  const prefsByUserId = new Map<string, any>();
  for (const p of preferences ?? []) {
    prefsByUserId.set(p.user_id, p);
  }

  const subsByUserId = new Map<string, PushSubscriptionItem[]>();
  for (const sub of subscriptions ?? []) {
    if (sub.user_id) {
      const list = subsByUserId.get(sub.user_id) ?? [];
      list.push(sub);
      subsByUserId.set(sub.user_id, list);
    }
  }

  const notifsByUserId = new Map<string, any[]>();
  for (const un of recentNotifs ?? []) {
    const list = notifsByUserId.get(un.user_id) ?? [];
    list.push(un);
    notifsByUserId.set(un.user_id, list);
  }

  const candidates: CandidateUser[] = [];

  for (const profile of profiles) {
    const userId = profile.id;
    const team = teamByUserId.get(userId);
    const stu = studentByUserId.get(userId);

    // Find donor listing if linked to team member or student
    const donor = (donors ?? []).find(
      (d) =>
        (team && d.volunteer_id === team.id) ||
        (stu && d.student_id === stu.id)
    );

    const bloodGroup = team?.blood_group || stu?.blood_group || donor?.blood_group || null;
    const area = team?.area || null;

    const userNotifs = notifsByUserId.get(userId) ?? [];
    const recentCount24h = userNotifs.length;
    const lastNotif = userNotifs[0]?.created_at || null;

    candidates.push({
      userId,
      fullName: profile.full_name,
      role: profile.role,
      bloodGroup,
      district: area,
      area,
      isVolunteer: !!team,
      volunteerStatus: team?.status || null,
      volunteerDepartment: team?.department || stu?.department || null,
      volunteerRcyDepartment: team?.rcy_department || null,
      isStudent: !!stu,
      isDonor: !!donor && donor.is_active,
      donorAvailability: donor?.availability || null,
      preferences: prefsByUserId.get(userId) || null,
      pushSubscriptions: subsByUserId.get(userId) || [],
      recentNotificationsCount24h: recentCount24h,
      recentSimilarNotificationsCount24h: 0, // Computed dynamically per notification type
      lastNotificationSentAt: lastNotif,
    });
  }

  return candidates;
}

/**
 * Live Recipient Estimator for the Admin Console before sending.
 */
export async function estimateAudience(
  type: NotificationType,
  priority: NotificationPriority,
  criteria: TargetCriteria = {}
): Promise<{
  estimatedCount: number;
  totalCandidates: number;
  anonymousDeviceCount?: number;
  sampleRecipients: { name: string; role?: string | null; score: number; pushReady: boolean }[];
}> {
  const candidates = await loadCandidateUsers();
  const ranked = rankRecipients(candidates, type, priority, criteria);

  let anonCount = 0;
  if (type === "blood_request" && !criteria?.specificUserIds && !criteria?.roles?.length && isSupabaseConfigured) {
    try {
      const admin = createAdminClient();
      const { count } = await admin
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .is("user_id", null)
        .eq("is_active", true);
      anonCount = count || 0;
    } catch {
      // ignore
    }
  }

  return {
    estimatedCount: ranked.length + anonCount,
    totalCandidates: candidates.length + anonCount,
    anonymousDeviceCount: anonCount,
    sampleRecipients: ranked.slice(0, 10).map((r) => ({
      name: r.candidate.fullName || "User",
      role: r.candidate.role,
      score: r.score,
      pushReady: r.candidate.pushSubscriptions.length > 0,
    })),
  };
}

/**
 * Creates and dispatches a Smart Notification to targeted recipients.
 */
export async function createAndDispatchNotification(
  notification: {
    title: string;
    body: string;
    type: NotificationType;
    priority?: NotificationPriority;
    imageUrl?: string | null;
    actionUrl?: string | null;
    metadata?: Record<string, unknown>;
  },
  criteria: TargetCriteria = {},
  createdByUserId?: string | null
): Promise<NotificationDispatchResult> {
  if (!isSupabaseConfigured) {
    throw new Error("Database is not configured.");
  }

  const priority = notification.priority || "normal";
  const candidates = await loadCandidateUsers();

  // 1. Run smart targeting & scoring
  const ranked = rankRecipients(candidates, notification.type, priority, criteria);

  const admin = createAdminClient();

  // 2. Persist main notification record
  const { data: createdNotif, error: notifErr } = await admin
    .from("notifications")
    .insert({
      title: notification.title,
      body: notification.body,
      type: notification.type,
      priority,
      image_url: notification.imageUrl || null,
      action_url: notification.actionUrl || null,
      metadata: notification.metadata || {},
      target_criteria: criteria,
      created_by: createdByUserId || null,
    })
    .select("id")
    .single();

  if (notifErr || !createdNotif) {
    console.error("Failed to create notification:", notifErr);
    throw new Error("Could not create notification record.");
  }

  const notificationId = createdNotif.id;

  if (ranked.length === 0) {
    return {
      notificationId,
      totalEvaluated: candidates.length,
      totalEligible: 0,
      totalSent: 0,
      totalPushSent: 0,
      totalPushFailed: 0,
      inAppCreated: 0,
    };
  }

  // 3. Batch insert user_notifications
  const userNotifRows = ranked.map((r) => ({
    notification_id: notificationId,
    user_id: r.candidate.userId,
    status: "sent",
    score: r.score,
    sent_at: new Date().toISOString(),
  }));

  const { error: unErr } = await admin.from("user_notifications").insert(userNotifRows);
  if (unErr) {
    console.error("Failed to insert user notifications:", unErr);
  }

  // 4. Dispatch Web Push notifications to active subscriptions (including non-signed in visitors)
  let totalPushSent = 0;
  let totalPushFailed = 0;

  const pushPromises: Promise<void>[] = [];

  // Registered user subscriptions
  for (const r of ranked) {
    for (const sub of r.candidate.pushSubscriptions) {
      pushPromises.push(
        (async () => {
          const res = await sendWebPushNotification(sub, {
            title: notification.title,
            body: notification.body,
            image: notification.imageUrl || undefined,
            actionUrl: notification.actionUrl || undefined,
            notificationId,
            priority,
          });
          if (res.success) {
            totalPushSent++;
          } else {
            totalPushFailed++;
          }
        })()
      );
    }
  }

  // Non-signed in (anonymous) device subscriptions — ONLY receive blood requests
  if (notification.type === "blood_request" && !criteria?.specificUserIds && !criteria?.roles?.length) {
    const { data: anonSubs } = await admin
      .from("push_subscriptions")
      .select("*")
      .is("user_id", null)
      .eq("is_active", true);

    for (const sub of anonSubs ?? []) {
      pushPromises.push(
        (async () => {
          const res = await sendWebPushNotification(sub, {
            title: notification.title,
            body: notification.body,
            image: notification.imageUrl || undefined,
            actionUrl: notification.actionUrl || undefined,
            notificationId,
            priority,
          });
          if (res.success) {
            totalPushSent++;
          } else {
            totalPushFailed++;
          }
        })()
      );
    }
  }

  await Promise.allSettled(pushPromises);

  return {
    notificationId,
    totalEvaluated: candidates.length,
    totalEligible: ranked.length,
    totalSent: ranked.length,
    totalPushSent,
    totalPushFailed,
    inAppCreated: ranked.length,
  };
}
