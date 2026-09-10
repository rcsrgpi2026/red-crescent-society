"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { HeartHandshake, X, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecruitmentCampaign } from "@/types/database";

interface RecruitmentPopupProps {
  campaign: RecruitmentCampaign | null;
}

export function RecruitmentPopup({ campaign }: RecruitmentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!campaign || !campaign.is_active) {
      setIsOpen(false);
      return;
    }

    try {
      const storageKey = `rcy_popup_seen_${campaign.id}`;
      const hasSeen = localStorage.getItem(storageKey);
      if (!hasSeen) {
        // Slight delay so the homepage loads smoothly first before the popup animates in
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 900);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback if localStorage is restricted
      setIsOpen(true);
    }
  }, [campaign]);

  const handleClose = () => {
    if (campaign?.id) {
      try {
        localStorage.setItem(`rcy_popup_seen_${campaign.id}`, "true");
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
  };

  if (!campaign || !campaign.is_active) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recruitment-popup-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-white shadow-2xl z-10"
          >
            {/* Top decorative gradient bar */}
            <div className="h-2 bg-gradient-to-r from-brand via-crescent to-brand-dark" />

            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-mist text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground"
              aria-label="Close recruitment announcement"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6 sm:p-8 text-center">
              {/* Animated Icon Emblem */}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-lg shadow-brand/25">
                <HeartHandshake className="h-8 w-8 text-white animate-bounce duration-1000" />
              </div>

              <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-dark">
                <Sparkles className="h-3.5 w-3.5 text-brand" />
                Volunteer Recruitment is Open
              </div>

              <h2
                id="recruitment-popup-title"
                className="mt-3 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl"
              >
                {campaign.popup_title || "Join RGPI Red Crescent Youth"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {campaign.popup_description ||
                  "Become part of our humanitarian youth team, learn life-saving skills, and serve the community."}
              </p>

              {/* Eligibility Pill */}
              {campaign.allowed_semesters && campaign.allowed_semesters.length > 0 && (
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-2xl border border-line bg-mist/60 px-3.5 py-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="h-3.5 w-3.5 text-brand" />
                  <span>
                    Open for:{" "}
                    <strong className="text-foreground">
                      {campaign.allowed_semesters.map((s) => `${s} Sem`).join(", ")}
                    </strong>
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Maybe Later
                </Button>

                <Button
                  asChild
                  size="lg"
                  onClick={handleClose}
                  className="gap-2 bg-crescent hover:bg-crescent-dark text-white shadow-md shadow-crescent/25 font-bold"
                >
                  <Link href="/apply-volunteer">
                    Apply Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
