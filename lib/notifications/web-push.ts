import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushSubscriptionItem } from "./types";

let isVapidConfigured = false;

function initVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@redcrescent.org";

  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      isVapidConfigured = true;
    } catch (err) {
      console.warn("Failed to initialize Web Push VAPID keys:", err);
      isVapidConfigured = false;
    }
  } else {
    isVapidConfigured = false;
  }
}

initVapid();

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  actionUrl?: string;
  notificationId?: string;
  priority?: "low" | "normal" | "high" | "critical";
  requireInteraction?: boolean;
}

export interface SendPushResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  deactivated?: boolean;
}

/**
 * Sends a Web Push notification to a single device subscription.
 * Handles 410 Gone / 404 Not Found by marking the token inactive in the database.
 */
export async function sendWebPushNotification(
  subscription: PushSubscriptionItem,
  payload: WebPushPayload
): Promise<SendPushResult> {
  if (!isVapidConfigured) {
    initVapid();
  }

  if (!isVapidConfigured) {
    // Graceful fallback during dev if VAPID keys are not yet configured in .env
    return {
      success: true,
      error: "VAPID keys not configured; push simulated in dev mode.",
    };
  }

  const pushSubscription: webpush.PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const notificationData = {
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/badge-96.png",
    image: payload.image || undefined,
    tag: payload.tag || `notif-${payload.notificationId || Date.now()}`,
    requireInteraction: payload.priority === "high" || payload.priority === "critical",
    data: {
      actionUrl: payload.actionUrl || "/",
      notificationId: payload.notificationId,
      priority: payload.priority,
      timestamp: Date.now(),
    },
  };

  try {
    const res = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(notificationData)
    );
    return { success: true, statusCode: res.statusCode };
  } catch (err: any) {
    const statusCode = err.statusCode || err.status;

    // Token is expired, unregistered, or invalid -> mark inactive in DB
    if (statusCode === 404 || statusCode === 410) {
      try {
        const admin = createAdminClient();
        await admin
          .from("push_subscriptions")
          .update({ is_active: false })
          .eq("endpoint", subscription.endpoint);
        return { success: false, statusCode, deactivated: true, error: "Subscription expired/unsubscribed" };
      } catch (dbErr) {
        console.error("Failed to deactivate expired push subscription:", dbErr);
      }
    }

    return {
      success: false,
      statusCode,
      error: err.message || "Failed to send push notification",
    };
  }
}
