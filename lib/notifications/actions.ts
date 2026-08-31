"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, logAudit } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  createAndDispatchNotification,
  estimateAudience,
} from "./notification-service";
import type {
  NotificationPreferences,
  NotificationPriority,
  NotificationType,
  PushSubscriptionItem,
  TargetCriteria,
  UserNotificationItem,
} from "./types";
import type { ActionResult } from "@/lib/actions";

/**
 * Gets the current user's in-app notifications.
 */
export async function getMyNotifications(
  limit: number = 30
): Promise<UserNotificationItem[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("user_notifications")
    .select("*, notification:notifications(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getMyNotifications error:", error);
    return [];
  }

  return (data ?? []) as UserNotificationItem[];
}

/**
 * Gets recent public blood request notifications for non-registered visitors.
 */
export async function getPublicBloodNotifications(
  limit: number = 10
): Promise<UserNotificationItem[]> {
  if (!isSupabaseConfigured) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("type", "blood_request")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((n) => ({
    id: `public-${n.id}`,
    notification_id: n.id,
    user_id: "",
    status: "delivered",
    score: 100,
    created_at: n.created_at,
    notification: n,
  }));
}

/**
 * Gets the count of unread notifications for the SiteHeader bell icon.
 */
export async function getMyUnreadNotificationCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["pending", "sent", "delivered"]);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

/**
 * Marks a single notification as opened when clicked.
 */
export async function markNotificationOpened(
  userNotificationId: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("user_notifications")
    .update({
      status: "opened",
      opened_at: new Date().toISOString(),
    })
    .eq("id", userNotificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

/**
 * Marks all notifications as opened.
 */
export async function markAllNotificationsOpened(): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase.rpc("mark_all_my_notifications_as_opened");
  if (error) {
    // Fallback if RPC not applied yet
    await supabase
      .from("user_notifications")
      .update({ status: "opened", opened_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .in("status", ["pending", "sent", "delivered"]);
  }

  return { success: true };
}

/**
 * Loads the current user's notification preferences.
 */
export async function getMyNotificationPreferences(): Promise<NotificationPreferences | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data && !error) {
    // Auto-create default preferences
    const { data: created } = await supabase
      .from("notification_preferences")
      .insert({ user_id: user.id })
      .select("*")
      .maybeSingle();
    return created as NotificationPreferences | null;
  }

  return data as NotificationPreferences | null;
}

/**
 * Updates the current user's notification preferences.
 */
export async function updateMyNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false, message: "Database not configured." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Not authenticated." };

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Notification preferences updated successfully." };
}

/**
 * Registers or updates a client push subscription.
 */
export async function registerPushSubscription(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
    platform?: string;
    browser?: string;
    userAgent?: string;
  }
): Promise<ActionResult> {
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data?.user?.id ?? null;
  } catch {
    userId = null;
  }

  const admin = createAdminClient();

  const { error } = await admin.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      platform: subscription.platform ?? null,
      browser: subscription.browser ?? null,
      user_agent: subscription.userAgent ?? null,
      is_active: true,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("registerPushSubscription error:", error);
    return { success: false, message: error.message };
  }

  return { success: true };
}

/**
 * Unregisters a push subscription.
 */
export async function unregisterPushSubscription(
  endpoint: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { success: false };

  const admin = createAdminClient();
  await admin
    .from("push_subscriptions")
    .update({ is_active: false })
    .eq("endpoint", endpoint);

  return { success: true };
}

// ------------------------------------------------------------
// Admin Panel Actions
// ------------------------------------------------------------

export async function adminEstimateAudienceAction(
  type: NotificationType,
  priority: NotificationPriority,
  criteria: TargetCriteria
) {
  const profile = await requireAdmin();
  if (!profile) throw new Error("Unauthorized");

  return estimateAudience(type, priority, criteria);
}

export async function adminBroadcastNotification(
  formData: FormData
): Promise<ActionResult> {
  const profile = await requireAdmin();
  if (!profile) return { success: false, message: "Unauthorized." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const type = String(formData.get("type") ?? "notice") as NotificationType;
  const priority = String(formData.get("priority") ?? "normal") as NotificationPriority;
  const actionUrl = String(formData.get("actionUrl") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim() || null;

  const roles = (formData.getAll("roles") as string[]).filter(Boolean);
  const bloodGroups = (formData.getAll("bloodGroups") as string[]).filter(Boolean);
  const districts = (formData.getAll("districts") as string[]).filter(Boolean);
  const departments = (formData.getAll("departments") as string[]).filter(Boolean);
  const isVolunteerOnly = formData.get("isVolunteerOnly") === "on";
  const isDonorOnly = formData.get("isDonorOnly") === "on";
  const availableOnly = formData.get("availableOnly") === "on";

  if (!title || !body) {
    return { success: false, message: "Title and message body are required." };
  }

  const criteria: TargetCriteria = {
    roles: roles.length > 0 ? (roles as any) : undefined,
    bloodGroups: bloodGroups.length > 0 ? bloodGroups : undefined,
    districts: districts.length > 0 ? districts : undefined,
    departments: departments.length > 0 ? departments : undefined,
    isVolunteerOnly: isVolunteerOnly || undefined,
    isDonorOnly: isDonorOnly || undefined,
    availableOnly: availableOnly || undefined,
  };

  try {
    const result = await createAndDispatchNotification(
      {
        title,
        body,
        type,
        priority,
        actionUrl,
        imageUrl,
      },
      criteria,
      profile.id
    );

    await logAudit("notification_broadcast", "notification", result.notificationId, {
      title,
      type,
      priority,
      sentCount: result.totalSent,
      pushSent: result.totalPushSent,
    });

    revalidatePath("/admin/notifications");
    return {
      success: true,
      message: `Notification broadcasted successfully to ${result.totalSent} recipient(s) (${result.totalPushSent} push messages sent).`,
      data: result,
    };
  } catch (err: any) {
    console.error("adminBroadcastNotification error:", err);
    return { success: false, message: err.message || "Failed to broadcast notification." };
  }
}

export async function adminGetNotificationHistory(): Promise<any[]> {
  const profile = await requireAdmin();
  if (!profile) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select(`
      *,
      user_notifications(
        id,
        status,
        opened_at,
        responded_at
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((n) => {
    const un = n.user_notifications || [];
    const sentCount = un.length;
    const openedCount = un.filter((u: any) => u.opened_at !== null || u.status === "opened").length;
    const respondedCount = un.filter((u: any) => u.responded_at !== null || u.status === "responded").length;

    return {
      ...n,
      stats: {
        sentCount,
        openedCount,
        respondedCount,
        openRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0,
      },
    };
  });
}
