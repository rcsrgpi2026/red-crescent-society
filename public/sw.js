// Service Worker for Red Crescent Youth PWA
const CACHE_NAME = "rcs-rgpi-pwa-v2";
const OFFLINE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Let browser handle API / dynamic POST requests naturally
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful GET responses for assets / pages
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/");
        });
      })
  );
});

// ============================================================
// Smart Push Notification Handlers
// ============================================================

self.addEventListener("push", (event) => {
  let data = {
    title: "Red Crescent Youth",
    body: "You have a new update from Red Crescent Youth.",
    icon: "/icon-192.png",
    badge: "/apple-touch-icon.png",
    data: { actionUrl: "/" },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || "/icon-192.png",
        badge: payload.badge || "/apple-touch-icon.png",
        image: payload.image || undefined,
        tag: payload.tag || `rcy-${Date.now()}`,
        requireInteraction: true,
        data: payload.data || { actionUrl: payload.actionUrl || "/" },
      };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    image: data.image,
    tag: data.tag,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: data.data,
  };

  event.waitUntil(
    self.registration
      .showNotification(data.title, options)
      .catch((err) => console.error("[SW] showNotification error:", err))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const actionUrl = (event.notification.data && event.notification.data.actionUrl) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If an open window matches our origin, focus and navigate it
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(actionUrl);
            }
            return;
          }
        }
        // Otherwise, open a new browser window
        if (self.clients.openWindow) {
          return self.clients.openWindow(actionUrl);
        }
      })
  );
});
