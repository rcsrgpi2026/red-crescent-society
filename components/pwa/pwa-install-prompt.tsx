"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Download, X, Info } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  // Check if any popup/modal dialog is currently displayed on screen
  const hasActivePopup = useCallback(() => {
    if (typeof document === "undefined") return false;
    return document.querySelector('[role="dialog"]') !== null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 0. Only show on home screen
    if (pathname !== "/") {
      setIsVisible(false);
      return;
    }

    // 1. Desktop version only (>= 768px) — mobile uses the sidebar option
    if (window.innerWidth < 768) {
      setIsVisible(false);
      return;
    }

    // 2. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // 3. Check dismissal timestamp
    const dismissedAt = sessionStorage.getItem("rcy_pwa_desktop_dismissed");
    if (dismissedAt) return;

    // 4. Check for pre-captured prompt
    if ((window as any).__rcyPwaPrompt) {
      setDeferredPrompt((window as any).__rcyPwaPrompt);
    }

    // 5. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__rcyPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      if (!hasActivePopup() && window.innerWidth >= 768) {
        setIsVisible(true);
      }
    };

    // 6. Hide immediately when app is installed
    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    const handlePromptReady = () => {
      if ((window as any).__rcyPwaPrompt) {
        setDeferredPrompt((window as any).__rcyPwaPrompt);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("rcy_pwa_prompt_ready", handlePromptReady);

    let timer: NodeJS.Timeout | null = null;

    const showPromptSafely = () => {
      if (hasActivePopup() || window.innerWidth < 768) return;
      setIsVisible(true);
    };

    const handlePopupClosed = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!hasActivePopup() && window.innerWidth >= 768) {
          showPromptSafely();
        }
      }, 700);
    };

    window.addEventListener("rcy_announcement_closed", handlePopupClosed);
    window.addEventListener("rcy_popup_closed", handlePopupClosed);

    timer = setTimeout(() => {
      if (!hasActivePopup() && window.innerWidth >= 768) {
        showPromptSafely();
      }
    }, 3500);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("rcy_pwa_prompt_ready", handlePromptReady);
      window.removeEventListener("rcy_announcement_closed", handlePopupClosed);
      window.removeEventListener("rcy_popup_closed", handlePopupClosed);
    };
  }, [pathname, hasActivePopup]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (window as any).__rcyPwaPrompt;

    if (promptEvent && typeof promptEvent.prompt === "function") {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === "accepted") {
          setIsVisible(false);
        }
        setDeferredPrompt(null);
        (window as any).__rcyPwaPrompt = null;
      } catch (err) {
        console.error("Desktop PWA install error:", err);
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowManualGuide(false);
    sessionStorage.setItem("rcy_pwa_desktop_dismissed", Date.now().toString());
  };

  if (!isVisible || pathname !== "/") return null;

  return (
    <aside
      role="region"
      aria-label="Desktop App installation banner"
      className="hidden md:block fixed bottom-6 left-6 z-40 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300"
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
              সহজ ব্যবহারে অ্যাপটি ইনস্টল করুন
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 rounded-full bg-poly px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-poly-dark hover:shadow-md active:scale-95 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              ইনস্টল
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-mist hover:text-foreground cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Installation guide helper (if browser didn't auto-prompt) */}
        {showManualGuide && (
          <div className="mt-3 rounded-xl border border-poly/20 bg-poly-soft/70 p-3 text-xs text-foreground animate-in fade-in duration-200">
            <p className="flex items-center gap-1.5 font-semibold text-poly-dark">
              <Info className="h-3.5 w-3.5 text-poly" aria-hidden />
              ব্রাউজার থেকে সরাসরি ইনস্টল করুন:
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা <strong>Install (⊕)</strong> আইকনে ক্লিক করুন অথবা মেনু (⋮) থেকে <strong>&quot;Install Red Crescent Youth...&quot;</strong> সিলেক্ট করুন।
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
