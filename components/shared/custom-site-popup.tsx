"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, ExternalLink } from "lucide-react";
import type { CustomPopupConfig } from "@/types/database";

interface CustomSitePopupProps {
  config: CustomPopupConfig | null;
}

export function CustomSitePopup({ config }: CustomSitePopupProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!config || !config.enabled || !config.imageUrl?.trim()) {
      return;
    }

    // Check scope
    if (config.showScope === "home_only" && pathname !== "/") {
      return;
    }

    // Check expiration (if an end date is configured)
    const now = new Date();
    if (config.endDate && now > new Date(config.endDate)) {
      return;
    }

    // Check dismissal based on frequency and version
    const versionKey = config.updatedAt ? `rcy_popup_${config.updatedAt}` : "rcy_popup_v1";

    if (!config.frequency || config.frequency === "once_per_session") {
      try {
        if (sessionStorage.getItem(versionKey)) return;
      } catch {}
    } else if (config.frequency === "once_per_day") {
      try {
        const lastSeen = localStorage.getItem(versionKey);
        if (lastSeen && now.getTime() - Number(lastSeen) < 24 * 60 * 60 * 1000) {
          return;
        }
      } catch {}
    }

    // Function to safely trigger the popup
    const showPopup = () => {
      setOpen(true);
      // Mark as seen immediately in session / local storage so page transitions do not re-open
      try {
        if (!config.frequency || config.frequency === "once_per_session") {
          sessionStorage.setItem(versionKey, "true");
        } else if (config.frequency === "once_per_day") {
          localStorage.setItem(versionKey, Date.now().toString());
        }
      } catch {}
    };

    // Listen for when the main site announcement modal closes, so custom popup appears right after
    const onAnnouncementClosed = () => {
      setTimeout(() => {
        showPopup();
      }, 400);
    };

    window.addEventListener("rcy_announcement_closed", onAnnouncementClosed);

    // If an announcement modal is already visible on the screen, wait for it to close
    const hasActiveModal = document.querySelector('[role="dialog"]') !== null;
    let timer: NodeJS.Timeout | null = null;

    if (!hasActiveModal) {
      // Delay so page loads smoothly before animating in
      timer = setTimeout(() => {
        // Double check in case another modal just appeared
        const activeNow = document.querySelector('[role="dialog"]') !== null;
        if (!activeNow) {
          showPopup();
        }
      }, 900);
    }

    return () => {
      window.removeEventListener("rcy_announcement_closed", onAnnouncementClosed);
      if (timer) clearTimeout(timer);
    };
  }, [config, pathname]);

  if (!open || !config) return null;

  const handleDismiss = () => {
    setOpen(false);
    const versionKey = config.updatedAt ? `rcy_popup_${config.updatedAt}` : "rcy_popup_v1";
    try {
      if (!config.frequency || config.frequency === "once_per_session") {
        sessionStorage.setItem(versionKey, "true");
      } else if (config.frequency === "once_per_day") {
        localStorage.setItem(versionKey, Date.now().toString());
      }
    } catch {}
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rcy_popup_closed"));
    }
  };

  const rawUrl = (config.buttonUrl ?? "").trim();
  const formattedUrl = /^www\./i.test(rawUrl) ? `https://${rawUrl}` : rawUrl;
  const isExternal =
    formattedUrl.startsWith("http://") || formattedUrl.startsWith("https://");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={config.title || "Announcement"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-300"
      onClick={handleDismiss}
    >
      <div
        className="relative w-[92vw] max-w-[360px] sm:w-full sm:max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Header Banner (Matches Main Announcement Theme) */}
        <div className="relative bg-gradient-to-br from-brand-dark via-brand to-crescent px-4 py-4 sm:px-6 sm:py-5 text-white shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3.5 top-3.5 rounded-full bg-black/20 p-1.5 text-white/80 transition-colors hover:bg-black/40 hover:text-white sm:right-4 sm:top-4"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="text-left pr-8 sm:pr-10">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
              {config.title || "জরুরি বিজ্ঞপ্তি ও তথ্য"}
            </h2>
            <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-white/90">
              {config.description || "বিস্তারিত নিচে দেখে জেনে নিন।"}
            </p>
          </div>
        </div>

        {/* Modal Body with 3:4 Poster Image */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 bg-white">
          {/* 3:4 Poster Image Container */}
          <div className="relative w-full aspect-[3/4] max-h-[52vh] rounded-2xl overflow-hidden border border-line/80 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 flex items-center justify-center shadow-xs shrink-0">
            <Image
              src={config.imageUrl}
              alt={config.imageAlt || config.title || "Announcement Poster"}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 420px"
              className={config.imageFit === "cover" ? "object-cover" : "object-contain"}
            />
          </div>

          {/* Action CTA Button */}
          {config.buttonUrl && (
            <div>
              {isExternal ? (
                <a
                  href={formattedUrl}
                  target={config.buttonOpenInNewTab ? "_blank" : undefined}
                  rel={config.buttonOpenInNewTab ? "noopener noreferrer" : undefined}
                  onClick={handleDismiss}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-crescent px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:bg-crescent-dark active:scale-[0.99]"
                >
                  <span>{config.buttonText || "Learn More"}</span>
                  {config.buttonOpenInNewTab ? (
                    <ExternalLink className="h-4 w-4 transition-transform group-hover:scale-110" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </a>
              ) : (
                <Link
                  href={formattedUrl}
                  onClick={handleDismiss}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-crescent px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all duration-200 hover:bg-crescent-dark active:scale-[0.99]"
                >
                  <span>{config.buttonText || "Learn More"}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </div>
          )}

          {/* Footer with "Got it, Close" Button */}
          <div className="flex items-center justify-end pt-2 border-t border-line/60">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-xl border border-line bg-mist/50 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-mist hover:text-foreground"
            >
              Got it, Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
