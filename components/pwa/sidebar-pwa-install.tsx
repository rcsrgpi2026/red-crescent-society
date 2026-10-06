"use client";

import { useEffect, useState } from "react";
import { Download, Share, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function SidebarPwaInstall({ onInstalled }: { onInstalled?: () => void }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone PWA mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if prompt was pre-captured
    if ((window as any).__rcyPwaPrompt) {
      setDeferredPrompt((window as any).__rcyPwaPrompt);
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
    if (isIosDevice && isSafari) {
      setIsIOS(true);
    }

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as any).__rcyPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      (window as any).__rcyPwaPrompt = null;
      if (onInstalled) onInstalled();
    };

    const handlePromptReady = () => {
      if ((window as any).__rcyPwaPrompt) {
        setDeferredPrompt((window as any).__rcyPwaPrompt);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforePrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("rcy_pwa_prompt_ready", handlePromptReady);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("rcy_pwa_prompt_ready", handlePromptReady);
    };
  }, [onInstalled]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowGuide((prev) => !prev);
      return;
    }

    const promptEvent = deferredPrompt || (window as any).__rcyPwaPrompt;

    if (promptEvent && typeof promptEvent.prompt === "function") {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice?.outcome === "accepted") {
          setIsStandalone(true);
          if (onInstalled) onInstalled();
        }
        setDeferredPrompt(null);
        (window as any).__rcyPwaPrompt = null;
      } catch (err) {
        console.error("PWA install error:", err);
        setShowGuide(true);
      }
    } else {
      setShowGuide((prev) => !prev);
    }
  };

  if (isStandalone) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 py-2.5 text-xs font-semibold text-emerald-800 shadow-xs">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>App is Installed</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Button
        type="button"
        size="lg"
        onClick={handleInstallClick}
        className="w-full bg-linear-to-r from-brand-dark via-brand to-crescent text-white font-semibold shadow-xs hover:brightness-105 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
      >
        <Download className="h-4 w-4 text-white shrink-0" />
        <span>Install the App</span>
      </Button>

      {showGuide && (
        <div className="mt-2 rounded-xl border border-brand/20 bg-brand-soft/70 p-3 text-xs text-foreground animate-in fade-in duration-200">
          {isIOS ? (
            <div className="space-y-1 text-left">
              <p className="flex items-center gap-1.5 font-semibold text-brand">
                <Share className="h-3.5 w-3.5 text-brand shrink-0" />
                iOS Safari:
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ১. ব্রাউজারের নিচে <strong>Share (শেয়ার)</strong> বাটন চাপুন।
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ২. মেনু থেকে <strong>&quot;Add to Home Screen&quot;</strong> সিলেক্ট করুন।
              </p>
            </div>
          ) : (
            <div className="space-y-1 text-left">
              <p className="flex items-center gap-1.5 font-semibold text-brand">
                <Info className="h-3.5 w-3.5 text-brand shrink-0" />
                Browser Instructions:
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                ব্রাউজারের মেনু (⋮) থেকে <strong>&quot;Install app&quot;</strong> বা অ্যাড্রেস বারের Install (⊕) বাটনে ক্লিক করুন।
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
