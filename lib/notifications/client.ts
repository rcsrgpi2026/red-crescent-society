import { registerPushSubscription } from "./actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export async function getVapidPublicKey(): Promise<string> {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
  try {
    const res = await fetch("/api/push/key");
    const data = await res.json();
    return data.publicKey || "";
  } catch {
    return "";
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function detectPlatformAndBrowser(): { platform: string; browser: string; userAgent: string } {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  let platform = "Desktop";
  if (/Android/i.test(userAgent)) platform = "Android";
  else if (/iPhone|iPad|iPod/i.test(userAgent)) platform = "iOS";

  let browser = "Unknown";
  if (/Edg/i.test(userAgent)) browser = "Edge";
  else if (/Chrome/i.test(userAgent)) browser = "Chrome";
  else if (/Firefox/i.test(userAgent)) browser = "Firefox";
  else if (/Safari/i.test(userAgent)) browser = "Safari";

  return { platform, browser, userAgent };
}

export async function getCurrentPushSubscriptionData(): Promise<{
  endpoint: string;
  p256dh: string;
  auth: string;
  platform: string;
  browser: string;
  userAgent: string;
} | null> {
  if (!isPushSupported()) return null;
  try {
    let reg = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => null as any);
    }
    const swReady = await withTimeout(
      navigator.serviceWorker.ready,
      4000,
      "SW ready timeout"
    ).catch(() => reg);
    if (!swReady?.pushManager) return null;

    let sub = await swReady.pushManager.getSubscription().catch(() => null);

    // If permission is already granted but subscription is missing, subscribe now
    if (!sub && typeof Notification !== "undefined" && Notification.permission === "granted") {
      const vapidKey = await getVapidPublicKey();
      if (vapidKey) {
        const appServerKey = urlBase64ToUint8Array(vapidKey);
        sub = await swReady.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey as unknown as BufferSource,
        }).catch(() => null);
      }
    }

    const json = sub?.toJSON();
    if (json?.endpoint && json?.keys?.p256dh && json?.keys?.auth) {
      const { platform, browser, userAgent } = detectPlatformAndBrowser();
      return {
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        platform,
        browser,
        userAgent,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

export async function subscribeUserToPush(): Promise<{
  success: boolean;
  message?: string;
  permission: NotificationPermission;
}> {
  if (!isPushSupported()) {
    return {
      success: false,
      message: "Push notifications are not supported on this browser.",
      permission: "denied",
    };
  }

  const currentPermission = Notification.permission;
  if (currentPermission === "denied") {
    return {
      success: false,
      message: "Notification permission is blocked in your browser settings. Please allow notifications in site settings.",
      permission: "denied",
    };
  }

  try {
    // 1. Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        message: "Notification permission was not granted.",
        permission,
      };
    }

    // 2. Ensure Service Worker is registered
    let reg: ServiceWorkerRegistration;
    try {
      reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
    } catch {
      reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    }

    // Wait for SW ready with a 6-second safeguard
    const swReady = await withTimeout(
      navigator.serviceWorker.ready,
      6000,
      "Service worker activation timeout."
    ).catch(() => reg);

    // 3. Fetch VAPID Public Key
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      return {
        success: true,
        message: "Notifications enabled!",
        permission: "granted",
      };
    }

    // 4. Try browser push service subscription (REUSE existing subscription if valid!)
    if (swReady?.pushManager) {
      let subscription = await swReady.pushManager.getSubscription().catch(() => null);

      // Only subscribe if not already subscribed
      if (!subscription) {
        try {
          const appServerKey = urlBase64ToUint8Array(vapidKey);
          subscription = await withTimeout(
            swReady.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: appServerKey as unknown as BufferSource,
            }),
            10000,
            "Push service subscription timeout."
          );
        } catch (subErr: any) {
          // Push service might fail in local dev, offline, VPN, or if browser blocks FCM (e.g. Brave, ad-blocker)
          console.warn("Browser push service registration failed:", subErr?.message || subErr);
          return {
            success: false,
            message: subErr?.message || "Push service error. Please check your browser connection or settings.",
            permission: typeof Notification !== "undefined" ? Notification.permission : "default",
          };
        }
      }

      const subJson = subscription?.toJSON();
      if (subJson?.endpoint && subJson?.keys?.p256dh && subJson?.keys?.auth) {
        const { platform, browser, userAgent } = detectPlatformAndBrowser();

        await registerPushSubscription({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          platform,
          browser,
          userAgent,
        });

        return {
          success: true,
          message: "Push alerts enabled on this device!",
          permission: "granted",
        };
      }
    }

    return {
      success: true,
      message: "Alerts enabled on this device!",
      permission: "granted",
    };
  } catch (err: any) {
    console.warn("subscribeUserToPush notice:", err?.message || err);
    return {
      success: false,
      message: err.message || "Failed to enable notifications.",
      permission: typeof Notification !== "undefined" ? Notification.permission : "default",
    };
  }
}

/**
 * Syncs the browser's active push subscription with the backend.
 * Called automatically when logged in (Admin, Volunteer, Student).
 * Ensures the subscription endpoint is linked to the current user ID in the database.
 */
export async function syncPushSubscription(): Promise<boolean> {
  if (!isPushSupported() || getNotificationPermissionState() !== "granted") {
    return false;
  }

  try {
    const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
    const swReady = await withTimeout(navigator.serviceWorker.ready, 5000, "SW ready timeout").catch(() => reg);
    if (!swReady?.pushManager) return false;

    let subscription = await swReady.pushManager.getSubscription().catch(() => null);

    // If permission is granted but subscription is missing, re-subscribe
    if (!subscription) {
      const vapidKey = await getVapidPublicKey();
      if (vapidKey) {
        const appServerKey = urlBase64ToUint8Array(vapidKey);
        subscription = await swReady.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey as unknown as BufferSource,
        }).catch(() => null);
      }
    }

    if (subscription) {
      const subJson = subscription.toJSON();
      if (subJson?.endpoint && subJson?.keys?.p256dh && subJson?.keys?.auth) {
        const { platform, browser, userAgent } = detectPlatformAndBrowser();
        const res = await registerPushSubscription({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          platform,
          browser,
          userAgent,
        });
        return res.success;
      }
    }
  } catch (err) {
    console.warn("syncPushSubscription notice:", err);
  }
  return false;
}
