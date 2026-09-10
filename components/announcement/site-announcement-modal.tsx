"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/constants";
import type { Notice, Event, Training, RecruitmentCampaign } from "@/types/database";

interface SiteAnnouncementModalProps {
  notices?: Notice[];
  events?: Event[];
  trainings?: Training[];
  recruitmentCampaign?: RecruitmentCampaign | null;
  /** Custom storage key prefix so volunteer portal or homepage can track separately if desired */
  storageKey?: string;
  /** Optional trigger label shown on page so members can open the announcements anytime */
  showTrigger?: boolean;
}

export function SiteAnnouncementModal({
  notices = [],
  events = [],
  trainings = [],
  recruitmentCampaign = null,
  storageKey = "rcy_latest_announcement_seen",
  showTrigger = true,
}: SiteAnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"updates" | "recruitment">("updates");
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);

  const hasNotices = notices.length > 0;
  const hasEvents = events.length > 0;
  const hasTrainings = trainings.length > 0;
  const hasRecruitment = Boolean(recruitmentCampaign?.is_active);

  // If there is literally nothing to announce, don't show the popup
  const hasAnyContent = hasNotices || hasEvents || hasTrainings || hasRecruitment;

  // Compute a distinct fingerprint for the latest items so any new publication re-triggers the modal
  const fingerprint = [
    notices[0]?.id ?? "",
    events[0]?.id ?? "",
    trainings[0]?.id ?? "",
    recruitmentCampaign?.id ?? "",
    recruitmentCampaign?.is_active ? "rec_on" : "rec_off",
  ].join("_");

  useEffect(() => {
    if (!hasAnyContent) return;

    try {
      const storedFingerprint = localStorage.getItem(storageKey);
      if (storedFingerprint !== fingerprint) {
        setHasNewAnnouncements(true);
        const timer = setTimeout(() => {
          setOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore in private modes
    }
  }, [fingerprint, hasAnyContent, storageKey]);

  function handleClose() {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, fingerprint);
      setHasNewAnnouncements(false);
    } catch {
      // ignore
    }
  }

  if (!hasAnyContent) return null;

  return (
    <>
      {/* Manual button to reopen updates anytime */}
      {showTrigger && (
        <button
          type="button"
          onClick={() => {
            setActiveTab("updates");
            setOpen(true);
          }}
          className="relative inline-flex items-center gap-1.5 rounded-full border border-line bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-brand/40 hover:bg-white hover:text-brand"
          aria-label="View latest updates and notices"
        >
          <Bell className="h-3.5 w-3.5 text-brand" />
          <span>Notices & Updates</span>
          {hasNewAnnouncements && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crescent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-crescent" />
            </span>
          )}
        </button>
      )}

      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else setOpen(true);
      }}>
        <DialogContent
          showCloseButton={false}
          className="w-[90vw] max-w-[360px] sm:w-full sm:max-w-xl overflow-hidden rounded-3xl border border-line bg-white p-0 shadow-2xl"
        >
          {/* Top Banner & Tab Navigation */}
          <div className="relative bg-gradient-to-br from-brand-dark via-brand to-crescent px-4 py-4 sm:px-6 sm:py-5 text-white">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3.5 top-3.5 rounded-full bg-black/20 p-1.5 text-white/80 transition-colors hover:bg-black/40 hover:text-white sm:right-4 sm:top-4"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-medium backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                <span>Red Crescent Updates</span>
              </div>
            </div>

            <DialogHeader className="mt-2.5 sm:mt-3 text-left">
              <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {activeTab === "updates" ? "Latest Notices, Events & Trainings" : "New Member Recruitment"}
              </DialogTitle>
              <p className="mt-1 text-[11px] sm:text-sm leading-relaxed text-white/90">
                {activeTab === "updates"
                  ? "Stay updated with recent notices, events and training sessions"
                  : "Join the Red Crescent Youth Unit today"}
              </p>
            </DialogHeader>

            {/* Step / Page Indicators if recruitment is active */}
            {hasRecruitment && (
              <div className="mt-3.5 sm:mt-4 flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("updates")}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors ${
                    activeTab === "updates"
                      ? "bg-white text-brand-dark shadow-xs"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Megaphone className="h-3 w-3" />
                  1. Updates
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("recruitment")}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors ${
                    activeTab === "recruitment"
                      ? "bg-white text-brand-dark shadow-xs"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Users className="h-3 w-3" />
                  2. Recruitment
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Updates (Notices, Events, Trainings) */}
          {activeTab === "updates" && (
            <div className="space-y-3.5 sm:space-y-4 max-h-[68vh] overflow-y-auto p-4 sm:p-6">
              {/* Recruitment Active Teaser Banner */}
              {hasRecruitment && (
                <button
                  type="button"
                  onClick={() => setActiveTab("recruitment")}
                  className="group flex w-full items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-3 sm:p-3.5 text-left transition-all hover:bg-amber-100/90 hover:shadow-xs"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-crescent text-white shadow-xs shadow-crescent/20">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-950 sm:text-sm truncate">
                        🎉 Member Recruitment Open!
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-amber-800 line-clamp-1">
                        {recruitmentCampaign?.popup_title || "Apply now to join Red Crescent Youth"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] sm:text-xs font-bold text-crescent shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    Details <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              )}

              {/* Latest Notices */}
              {hasNotices && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Bell className="h-3.5 w-3.5 text-crescent" />
                      Important Notices
                    </h4>
                    <Link
                      href="/notices"
                      onClick={handleClose}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {notices.slice(0, 2).map((n) => (
                      <Link
                        key={n.id}
                        href={`/notices/${n.slug}`}
                        onClick={handleClose}
                        className="group flex items-start justify-between gap-2.5 sm:gap-3 rounded-2xl border border-line/80 bg-mist/30 p-2.5 sm:p-3 transition-colors hover:border-crescent/40 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {n.category && (
                              <span className="inline-block rounded-md bg-crescent-soft px-1.5 py-0.5 text-[10px] font-bold text-crescent">
                                {n.category}
                              </span>
                            )}
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                              {formatDate(n.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs font-semibold text-foreground group-hover:text-brand transition-colors sm:text-sm">
                            {n.title}
                          </p>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Events */}
              {hasEvents && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-brand" />
                      Upcoming Events
                    </h4>
                    <Link
                      href="/events"
                      onClick={handleClose}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {events.slice(0, 2).map((e) => (
                      <Link
                        key={e.id}
                        href={`/events/${e.slug}`}
                        onClick={handleClose}
                        className="group flex items-start justify-between gap-2.5 sm:gap-3 rounded-2xl border border-line/80 bg-mist/30 p-2.5 sm:p-3 transition-colors hover:border-brand/40 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-brand transition-colors sm:text-sm line-clamp-1">
                            {e.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
                            {e.date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(e.date)} {e.time ? `· ${e.time}` : ""}
                              </span>
                            )}
                            {e.location && (
                              <span className="flex items-center gap-1 truncate max-w-[150px]">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{e.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-brand transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Trainings */}
              {hasTrainings && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                      Trainings & Workshops
                    </h4>
                    <Link
                      href="/training"
                      onClick={handleClose}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {trainings.slice(0, 2).map((tr) => (
                      <Link
                        key={tr.id}
                        href="/training"
                        onClick={handleClose}
                        className="group flex items-start justify-between gap-2.5 sm:gap-3 rounded-2xl border border-line/80 bg-mist/30 p-2.5 sm:p-3 transition-colors hover:border-emerald-500/40 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-emerald-700 transition-colors sm:text-sm line-clamp-1">
                            {tr.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
                            {tr.date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(tr.date)}
                              </span>
                            )}
                            {tr.trainer && <span>Trainer: {tr.trainer}</span>}
                          </div>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-700 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Row */}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
                {hasRecruitment ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("recruitment")}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-crescent px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-crescent-dark"
                  >
                    <span>Next: Recruitment</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-mist/50 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-mist hover:text-foreground"
                >
                  Got it, Close
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Recruitment Campaign Slide */}
          {activeTab === "recruitment" && recruitmentCampaign && (
            <div className="space-y-3.5 sm:space-y-4 max-h-[68vh] overflow-y-auto p-4 sm:p-6">
              {/* Campaign Highlight Box */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 sm:p-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-crescent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Recruitment Open
                </span>
                <h3 className="mt-1.5 sm:mt-2 text-sm sm:text-base font-bold text-amber-950">
                  {recruitmentCampaign.popup_title || recruitmentCampaign.title}
                </h3>
                {recruitmentCampaign.popup_description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-amber-900/90 whitespace-pre-line">
                    {recruitmentCampaign.popup_description}
                  </p>
                )}
              </div>

              {/* Key Highlights Grid */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-mist/30 p-2.5 sm:p-3">
                  <span className="block text-[10px] sm:text-[11px] font-semibold text-muted-foreground">
                    Eligible Semesters
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-foreground">
                    {recruitmentCampaign.allowed_semesters?.length
                      ? recruitmentCampaign.allowed_semesters.join(", ")
                      : "All Semesters"}
                  </span>
                </div>
                <div className="rounded-xl border border-line bg-mist/30 p-2.5 sm:p-3">
                  <span className="block text-[10px] sm:text-[11px] font-semibold text-muted-foreground">
                    Application Deadline
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-crescent">
                    {recruitmentCampaign.end_date
                      ? formatDate(recruitmentCampaign.end_date)
                      : "Ongoing (Ending Soon)"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2.5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("updates")}
                  className="inline-flex items-center justify-center gap-1 rounded-xl border border-line bg-mist/50 px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-mist"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/apply-volunteer"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-crescent px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-crescent-dark"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center rounded-xl border border-line px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-mist"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
