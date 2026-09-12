"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  HandHeart,
  Droplets,
  Siren,
  Building2,
  HeartPulse,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatEventDateRange } from "@/lib/constants";
import type {
  Notice,
  Event,
  Training,
  RecruitmentCampaign,
  Activity,
  PublicBloodRequest,
} from "@/types/database";

interface SiteAnnouncementModalProps {
  notices?: Notice[];
  events?: Event[];
  trainings?: Training[];
  activities?: Activity[];
  recruitmentCampaign?: RecruitmentCampaign | null;
  liveBloodRequest?: PublicBloodRequest | null;
  /** Custom storage key prefix so volunteer portal or homepage can track separately if desired */
  storageKey?: string;
  /** Optional trigger label shown on page so members can open the announcements anytime */
  showTrigger?: boolean;
}

export function SiteAnnouncementModal({
  notices = [],
  events = [],
  trainings = [],
  activities = [],
  recruitmentCampaign = null,
  liveBloodRequest = null,
  storageKey = "rcy_latest_announcement_seen",
  showTrigger = true,
}: SiteAnnouncementModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"updates" | "recruitment">("updates");
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);

  const hasEmergencyBlood = Boolean(
    liveBloodRequest &&
      liveBloodRequest.status !== "COMPLETED" &&
      liveBloodRequest.status !== "CANCELLED"
  );
  const hasNotices = notices.length > 0;
  const hasEvents = events.length > 0;
  const hasTrainings = trainings.length > 0;
  const hasActivities = activities.length > 0;
  const hasRecruitment = Boolean(recruitmentCampaign?.is_active);

  // If there is literally nothing to announce, don't show the popup
  const hasAnyContent =
    hasEmergencyBlood ||
    hasNotices ||
    hasEvents ||
    hasTrainings ||
    hasActivities ||
    hasRecruitment;

  // Compute a distinct fingerprint for the latest items so any new publication re-triggers the modal
  const fingerprint = [
    hasEmergencyBlood ? `blood_${liveBloodRequest?.id}` : "",
    notices[0]?.id ?? "",
    events[0]?.id ?? "",
    trainings[0]?.id ?? "",
    activities[0]?.id ?? "",
    activities[0]?.updated_at ?? "",
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
          className={`relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all ${
            hasEmergencyBlood
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-line bg-white/90 text-foreground hover:border-brand/40 hover:bg-white hover:text-brand"
          }`}
          aria-label="View latest updates and notices"
        >
          {hasEmergencyBlood ? (
            <Droplets className="h-3.5 w-3.5 text-red-600 fill-red-600" />
          ) : (
            <Bell className="h-3.5 w-3.5 text-brand" />
          )}
          <span>{hasEmergencyBlood ? "জরুরি রক্ত ও নোটিশ" : "Notices & Updates"}</span>
          {(hasNewAnnouncements || hasEmergencyBlood) && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-600 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
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

            <DialogHeader className="text-left pr-8 sm:pr-10">
              <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {activeTab === "updates"
                  ? hasEmergencyBlood
                    ? "জরুরি রক্তের আবেদন ও সর্বশেষ তথ্য"
                    : "Latest Notices, Events & Activities"
                  : "New Member Recruitment"}
              </DialogTitle>
              <p className="mt-1 text-[11px] sm:text-sm leading-relaxed text-white/90">
                {activeTab === "updates"
                  ? hasEmergencyBlood
                    ? "জীবন বাঁচাতে জরুরি রক্ত প্রয়োজন! নিচে বিস্তারিত দেখে পাশে দাঁড়ান।"
                    : "Stay updated with recent notices, activities, events and training sessions"
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
                  {hasEmergencyBlood ? (
                    <span className="flex items-center gap-1 text-red-600 font-bold">
                      <Droplets className="h-3 w-3 fill-current animate-pulse" />
                      1. Updates
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                    </span>
                  ) : (
                    <>
                      <Megaphone className="h-3 w-3" />
                      1. Updates
                    </>
                  )}
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
              {/* Urgent Emergency Blood Request Alert (Life-Saving, if active) */}
              {hasEmergencyBlood && liveBloodRequest && (
                <div className="relative overflow-hidden rounded-2xl border-2 border-red-500 bg-gradient-to-br from-red-50 via-rose-50/80 to-red-100/60 p-3.5 sm:p-4 shadow-sm shadow-red-500/10">
                  {/* Alert Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-700">
                        <Siren className="h-4 w-4 text-red-600 animate-pulse" />
                        জরুরি রক্তের আবেদন
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-0.5 text-xs font-black text-white shadow-xs">
                      <Droplets className="h-3.5 w-3.5 fill-white" />
                      {liveBloodRequest.blood_group}
                    </span>
                  </div>

                  {/* Patient & Need Details */}
                  <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {liveBloodRequest.patient_name
                          ? `রোগী: ${liveBloodRequest.patient_name}`
                          : "জরুরি রক্ত প্রয়োজন"}
                        {liveBloodRequest.units ? ` · ${liveBloodRequest.units} ব্যাগ প্রয়োজন` : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600">
                        {liveBloodRequest.hospital && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0 text-red-500" />
                            <span className="truncate max-w-[180px] sm:max-w-[240px] font-medium">
                              {liveBloodRequest.hospital}
                            </span>
                          </span>
                        )}
                        {liveBloodRequest.location && !liveBloodRequest.hospital && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                            <span className="truncate max-w-[180px] sm:max-w-[240px] font-medium">
                              {liveBloodRequest.location}
                            </span>
                          </span>
                        )}
                        {liveBloodRequest.required_date && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="h-3 w-3 shrink-0" />
                            {formatDate(liveBloodRequest.required_date)}
                            {liveBloodRequest.required_time ? ` (${liveBloodRequest.required_time})` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/blood-support/request/${liveBloodRequest.id}`}
                      onClick={handleClose}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <HeartPulse className="h-3.5 w-3.5" />
                      রক্ত দিন / বিস্তারিত
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}
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
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {n.cover_image && (
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-line bg-mist mt-0.5">
                              <Image
                                src={n.cover_image}
                                alt={n.title}
                                fill
                                sizes="44px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
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
                                {formatEventDateRange(e.date, e.end_date)} {e.time ? `· ${e.time}` : ""}
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

              {/* Latest Activities */}
              {hasActivities && (
                <div className="space-y-2 sm:space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <HandHeart className="h-3.5 w-3.5 text-emerald-600" />
                      Recent Activities & Field Work
                    </h4>
                    <Link
                      href="/gallery#activities"
                      onClick={handleClose}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {activities.slice(0, 2).map((act) => (
                      <Link
                        key={act.id}
                        href={`/activities/${act.slug}`}
                        onClick={handleClose}
                        className="group flex items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-line/80 bg-mist/30 p-2.5 sm:p-3 transition-colors hover:border-emerald-500/40 hover:bg-white"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {act.images?.[0] ? (
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-line bg-mist shadow-2xs">
                              <Image
                                src={act.images[0]}
                                alt={act.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                              <HandHeart className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground group-hover:text-emerald-700 transition-colors sm:text-sm line-clamp-1">
                              {act.title}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground">
                              {act.date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(act.date)}
                                </span>
                              )}
                              {act.category && (
                                <span className="rounded bg-poly-soft px-1.5 py-0.2 font-semibold text-poly">
                                  {act.category}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-700 transition-colors" />
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
