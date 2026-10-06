"use client";

import { useEffect } from "react";

// Capture beforeinstallprompt as early as possible on window for sidebar install action
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    (window as any).__rcyPwaPrompt = e;
    window.dispatchEvent(new Event("rcy_pwa_prompt_ready"));
  });
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // In development mode, automatically unregister any stale SW to prevent HMR caching errors
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((error) => {
          console.debug("ServiceWorker registration skipped:", error);
        });
    });
  }, []);

  return null;
}
