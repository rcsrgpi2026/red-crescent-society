"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Share, Info } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Global listener to capture the event as early as possible
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    (window as any).__rcyPwaPrompt = e;
  });
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // 1. Wipe any legacy 7-day localStorage blocker from previous version
    try {
      localStorage.removeItem("rcy_pwa_install_dismissed");
    } catch {}

    // 2. Check if already running in standalone PWA mode (app opened as installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 3. Check dismissal timestamp (suppress for 3 minutes if dismissed via 'X')
    const dismissedAt = sessionStorage.getItem("rcy_pwa_dismissed_time");
    if (dismissedAt) {
      const minutesPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60);
      if (minutesPassed < 3) return;
    }

    // 4. Check for pre-captured prompt
    if ((window as any).__rcyPwaPrompt) {
      setDeferredPrompt((window as any).__rcyPwaPrompt);
    }

    // 5. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    if (isIosDevice && isSafari) {
      setIsIOS(true);
    }

    // 6. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__rcyPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setIsVisible(true);
    };

    // 7. Hide immediately when app is installed
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 8. Unconditionally trigger visibility after 1.5s delay if not standalone
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // If iOS Safari, show guide
    if (isIOS) {
      setShowManualGuide((prev) => !prev);
      return;
    }

    // Check current state or global window reference
    const promptEvent = deferredPrompt || (window as any).__rcyPwaPrompt;

    if (promptEvent && typeof promptEvent.prompt === "function") {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") {
          setIsVisible(false);
        }
        setDeferredPrompt(null);
        (window as any).__rcyPwaPrompt = null;
      } catch (err) {
        console.error("PWA install error:", err);
        setShowManualGuide(true);
      }
    } else {
      // Browser didn't provide beforeinstallprompt (e.g. desktop Chrome already showing address bar icon or Firefox)
      setShowManualGuide((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowManualGuide(false);
    sessionStorage.setItem("rcy_pwa_dismissed_time", Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="App installation banner"
      className="fixed bottom-4 left-4 right-4 z-[90] mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 sm:left-auto sm:right-6 sm:bottom-6"
    >
      <div className="relative overflow-hidden rounded-2xl border border-poly/20 bg-white/95 p-4 shadow-xl shadow-poly/10 backdrop-blur-md dark:border-poly/30 dark:bg-slate-900/95">
        <div className="flex items-center gap-3.5">
          {/* App Icon */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-line bg-mist shadow-xs">
            <Image
              src="/icon-192.png"
              alt="Red Crescent Youth App"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Text Content */}
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-bold text-foreground">
              Red Crescent Youth App
            </h4>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              সহজ ব্যবহারে হোমস্ক্রিনে অ্যাপটি যোগ করুন
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-poly px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-poly-dark hover:shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              ইনস্টল
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-mist hover:text-foreground cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Installation guide helper (if iOS or browser didn't auto-prompt) */}
        {showManualGuide && (
          <div className="mt-3 rounded-xl border border-poly/20 bg-poly-soft/70 p-3 text-xs text-foreground animate-in fade-in duration-200">
            {isIOS ? (
              <>
                <p className="flex items-center gap-1.5 font-semibold text-brand">
                  <Share className="h-3.5 w-3.5 text-brand" aria-hidden />
                  Safari থেকে ইনস্টল করার নিয়ম:
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  নিচের <strong>Share (শেয়ার)</strong> বাটন চাপুন ➔ তারপর <strong>&quot;Add to Home Screen&quot; (হোম স্ক্রিনে যোগ করুন)</strong> সিলেক্ট করুন।
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-1.5 font-semibold text-poly-dark">
                  <Info className="h-3.5 w-3.5 text-poly" aria-hidden />
                  ব্রাউজার থেকে সরাসরি ইনস্টল করুন:
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা <strong>Install (⊕)</strong> আইকনে ক্লিক করুন অথবা মেনু (⋮) থেকে <strong>&quot;Install Red Crescent Youth...&quot;</strong> সিলেক্ট করুন।
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
