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
  CheckCircle2,
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
          <span>নোটিশ ও আপডেট</span>
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
          className="max-w-xl overflow-hidden rounded-3xl border border-line bg-white p-0 shadow-2xl"
        >
          {/* Top Banner & Tab Navigation */}
          <div className="relative bg-gradient-to-br from-brand-dark via-brand to-crescent px-6 py-5 text-white">
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full bg-black/20 p-1.5 text-white/80 transition-colors hover:bg-black/40 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                <span>রেড ক্রিসেন্ট সোসাইটি আপডেট</span>
              </div>
            </div>

            <DialogHeader className="mt-3 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                {activeTab === "updates" ? "সর্বশেষ নোটিশ, ইভেন্ট ও ট্রেনিং" : "নতুন সদস্য নিয়োগ বিজ্ঞপ্তি"}
              </DialogTitle>
              <p className="mt-1 text-xs leading-relaxed text-white/90 sm:text-sm">
                {activeTab === "updates"
                  ? "সোসাইটির সাম্প্রতিক কার্যক্রম ও গুরুত্বপূর্ণ নোটিশসমূহ জেনে নিন"
                  : "রেড ক্রিসেন্ট যুব দলের সদস্য হিসেবে যোগ দেওয়ার সুযোগ"}
              </p>
            </DialogHeader>

            {/* Step / Page Indicators if recruitment is active */}
            {hasRecruitment && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("updates")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    activeTab === "updates"
                      ? "bg-white text-brand-dark shadow-xs"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Megaphone className="h-3 w-3" />
                  ১. নোটিশ ও আপডেট
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("recruitment")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    activeTab === "recruitment"
                      ? "bg-white text-brand-dark shadow-xs"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <Users className="h-3 w-3" />
                  ২. নিয়োগ বিজ্ঞপ্তি
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Updates (Notices, Events, Trainings) */}
          {activeTab === "updates" && (
            <div className="space-y-4 max-h-[68vh] overflow-y-auto p-5 sm:p-6">
              {/* Recruitment Active Teaser Banner */}
              {hasRecruitment && (
                <button
                  type="button"
                  onClick={() => setActiveTab("recruitment")}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 text-left transition-all hover:bg-amber-100/90 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crescent text-white shadow-xs shadow-crescent/20">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-amber-950 sm:text-sm">
                        🎉 নতুন সদস্য নিয়োগ চলছে!
                      </p>
                      <p className="text-[11px] text-amber-800">
                        {recruitmentCampaign?.popup_title || "রেড ক্রিসেন্ট যুব ইউনিটে যুক্ত হতে এখনই আবেদন করুন"}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-crescent shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    নিয়োগ দেখুন <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              )}

              {/* Latest Notices */}
              {hasNotices && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Bell className="h-3.5 w-3.5 text-crescent" />
                      জরুরি নোটিশ
                    </h4>
                    <Link
                      href="/notices"
                      onClick={handleClose}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      সব নোটিশ
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {notices.slice(0, 2).map((n) => (
                      <Link
                        key={n.id}
                        href={`/notices/${n.slug}`}
                        onClick={handleClose}
                        className="group flex items-start justify-between gap-3 rounded-2xl border border-line/80 bg-mist/30 p-3 transition-colors hover:border-crescent/40 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {n.category && (
                              <span className="inline-block rounded-md bg-crescent-soft px-1.5 py-0.5 text-[10px] font-bold text-crescent">
                                {n.category}
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">
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
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-brand" />
                      আসন্ন ইভেন্ট
                    </h4>
                    <Link
                      href="/events"
                      onClick={handleClose}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      সব ইভেন্ট
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {events.slice(0, 2).map((e) => (
                      <Link
                        key={e.id}
                        href={`/events/${e.slug}`}
                        onClick={handleClose}
                        className="group flex items-start justify-between gap-3 rounded-2xl border border-line/80 bg-mist/30 p-3 transition-colors hover:border-brand/40 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-brand transition-colors sm:text-sm">
                            {e.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            {e.date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(e.date)} {e.time ? `· ${e.time}` : ""}
                              </span>
                            )}
                            {e.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {e.location}
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
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                      ট্রেনিং ও ওয়ার্কশপ
                    </h4>
                    <Link
                      href="/training"
                      onClick={handleClose}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      সব ট্রেনিং
                    </Link>
                  </div>
                  <div className="grid gap-2">
                    {trainings.slice(0, 2).map((tr) => (
                      <Link
                        key={tr.id}
                        href="/training"
                        onClick={handleClose}
                        className="group flex items-start justify-between gap-3 rounded-2xl border border-line/80 bg-mist/30 p-3 transition-colors hover:border-emerald-500/40 hover:bg-white"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-emerald-700 transition-colors sm:text-sm">
                            {tr.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                            {tr.date && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(tr.date)}
                              </span>
                            )}
                            {tr.trainer && <span>প্রশিক্ষক: {tr.trainer}</span>}
                          </div>
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-emerald-700 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Action Row */}
              <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:justify-between">
                {hasRecruitment ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab("recruitment")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-crescent px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-crescent-dark"
                  >
                    <span>পরবর্তী: নিয়োগ বিজ্ঞপ্তি</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center rounded-xl border border-line bg-mist/50 px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-mist hover:text-foreground"
                >
                  বুঝেছি, বন্ধ করুন
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Recruitment Campaign Slide */}
          {activeTab === "recruitment" && recruitmentCampaign && (
            <div className="space-y-4 max-h-[68vh] overflow-y-auto p-5 sm:p-6">
              {/* Campaign Highlight Box */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-crescent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  নিয়োগ চলছে
                </span>
                <h3 className="mt-2 text-base font-bold text-amber-950 sm:text-lg">
                  {recruitmentCampaign.popup_title || recruitmentCampaign.title}
                </h3>
                {recruitmentCampaign.popup_description && (
                  <p className="mt-2 text-xs leading-relaxed text-amber-900/90 sm:text-sm whitespace-pre-line">
                    {recruitmentCampaign.popup_description}
                  </p>
                )}
              </div>

              {/* Key Highlights Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-mist/30 p-3">
                  <span className="block text-[11px] font-semibold text-muted-foreground">
                    আবেদনযোগ্য সেমিস্টার
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-foreground">
                    {recruitmentCampaign.allowed_semesters?.length
                      ? recruitmentCampaign.allowed_semesters.join(", ")
                      : "সকল সেমিস্টার"}
                  </span>
                </div>
                <div className="rounded-xl border border-line bg-mist/30 p-3">
                  <span className="block text-[11px] font-semibold text-muted-foreground">
                    আবেদনের শেষ সময়
                  </span>
                  <span className="mt-0.5 block text-xs font-bold text-crescent">
                    {recruitmentCampaign.end_date
                      ? formatDate(recruitmentCampaign.end_date)
                      : "চলমান (শীঘ্রই সমাপ্ত হবে)"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("updates")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-mist/50 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-mist"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>আগের পৃষ্ঠা</span>
                </button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/apply-volunteer"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-crescent px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-crescent-dark"
                  >
                    <span>এখনই আবেদন করুন</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center justify-center rounded-xl border border-line px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-mist"
                  >
                    পরে দেখব
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
