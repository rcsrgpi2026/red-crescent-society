"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Power,
  Calendar,
  Layers,
  Megaphone,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SEMESTERS } from "@/lib/constants";
import { adminSaveRecruitmentCampaign, adminToggleRecruitment } from "@/lib/recruitment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RecruitmentCampaign } from "@/types/database";

interface RecruitmentSettingsFormProps {
  campaign: RecruitmentCampaign | null;
}

export function RecruitmentSettingsForm({ campaign }: RecruitmentSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();

  const [isActive, setIsActive] = useState<boolean>(campaign?.is_active ?? false);
  const [title, setTitle] = useState(campaign?.title || "Volunteer Recruitment 2026");
  const [popupTitle, setPopupTitle] = useState(
    campaign?.popup_title || "🤝 Volunteer Recruitment is Open!"
  );
  const [popupDescription, setPopupDescription] = useState(
    campaign?.popup_description ||
      "Join RGPI Red Crescent Youth and become part of our humanitarian volunteer community."
  );
  const [bannerTitle, setBannerTitle] = useState(
    campaign?.banner_title || "🤝 VOLUNTEER RECRUITMENT IS NOW OPEN"
  );
  const [bannerSubtitle, setBannerSubtitle] = useState(
    campaign?.banner_subtitle ||
      "Become a volunteer and make a difference with RGPI Red Crescent Youth."
  );
  const [allowedSemesters, setAllowedSemesters] = useState<string[]>(
    campaign?.allowed_semesters || ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]
  );
  const [startDate, setStartDate] = useState(
    campaign?.start_date ? campaign.start_date.split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    campaign?.end_date ? campaign.end_date.split("T")[0] : ""
  );
  const [maxApplications, setMaxApplications] = useState<string>(
    campaign?.max_applications ? String(campaign.max_applications) : ""
  );

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const toggleSemester = (sem: string) => {
    setAllowedSemesters((prev) =>
      prev.includes(sem) ? prev.filter((s) => s !== sem) : [...prev, sem]
    );
  };

  const selectAllSemesters = () => {
    setAllowedSemesters([...SEMESTERS]);
  };

  const clearAllSemesters = () => {
    setAllowedSemesters([]);
  };

  const handleToggleStatus = () => {
    const nextState = !isActive;

    if (!campaign?.id) {
      // Auto-save/create new campaign with the next state
      const fd = new FormData();
      fd.append("title", title || "Volunteer Recruitment Campaign");
      fd.append("isActive", nextState ? "true" : "false");
      fd.append("popupTitle", popupTitle || "Join RGPI Red Crescent Youth");
      fd.append(
        "popupDescription",
        popupDescription ||
          "Become part of our humanitarian community, gain first aid & leadership skills, and serve society."
      );
      fd.append("bannerTitle", bannerTitle || "🤝 VOLUNTEER RECRUITMENT IS NOW OPEN");
      fd.append(
        "bannerSubtitle",
        bannerSubtitle ||
          "Become a volunteer and make a difference with RGPI Red Crescent Youth."
      );
      (allowedSemesters.length > 0 ? allowedSemesters : SEMESTERS).forEach((sem) =>
        fd.append("allowedSemesters", sem)
      );
      if (startDate) fd.append("startDate", startDate);
      if (endDate) fd.append("endDate", endDate);
      if (maxApplications) fd.append("maxApplications", maxApplications);

      startToggleTransition(async () => {
        setFeedback(null);
        const res = await adminSaveRecruitmentCampaign(fd);
        if (res.success) {
          setIsActive(nextState);
          setFeedback({
            type: "success",
            text: `Recruitment campaign created and turned ${nextState ? "ON" : "OFF"}.`,
          });
        } else {
          setFeedback({
            type: "error",
            text: res.message || "Failed to toggle recruitment status.",
          });
        }
      });
      return;
    }

    startToggleTransition(async () => {
      setFeedback(null);
      const res = await adminToggleRecruitment(campaign.id, nextState);
      if (res.success) {
        setIsActive(nextState);
        setFeedback({
          type: "success",
          text: res.message || "Recruitment status updated.",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to toggle status.",
        });
      }
    });
  };


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFeedback(null);

    if (allowedSemesters.length === 0) {
      setFeedback({
        type: "error",
        text: "Please select at least one eligible semester.",
      });
      return;
    }

    const fd = new FormData();
    if (campaign?.id) fd.append("id", campaign.id);
    fd.append("title", title);
    fd.append("isActive", isActive ? "true" : "false");
    fd.append("popupTitle", popupTitle);
    fd.append("popupDescription", popupDescription);
    fd.append("bannerTitle", bannerTitle);
    fd.append("bannerSubtitle", bannerSubtitle);
    allowedSemesters.forEach((sem) => fd.append("allowedSemesters", sem));
    if (startDate) fd.append("startDate", startDate);
    if (endDate) fd.append("endDate", endDate);
    if (maxApplications) fd.append("maxApplications", maxApplications);

    startTransition(async () => {
      const res = await adminSaveRecruitmentCampaign(fd);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || "Campaign saved successfully!",
        });
      } else {
        setFeedback({
          type: "error",
          text: res.message || "Failed to save campaign settings.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Master Recruitment ON / OFF Status Card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border p-6 shadow-sm transition-all sm:p-8",
          isActive
            ? "border-emerald-300 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white"
            : "border-slate-300 bg-gradient-to-br from-slate-200/50 via-slate-100/30 to-white"
        )}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-colors",
                isActive
                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                  : "bg-slate-500 text-white"
              )}
            >
              <Power className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground sm:text-xl">
                  Volunteer Recruitment Status
                </h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase",
                    isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                    )}
                  />
                  {isActive ? "OPEN / ACTIVE" : "CLOSED / INACTIVE"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {isActive
                  ? "Recruitment is currently active on the public website. Visitors will see the popup modal and top recruitment banner."
                  : "Recruitment is currently closed. Public banners, popups and application access are hidden."}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              size="lg"
              onClick={handleToggleStatus}
              disabled={isToggling}
              className={cn(
                "gap-2 font-semibold shadow-md transition-all cursor-pointer",
                isActive
                  ? "bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/10"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              )}
            >
              {isToggling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Power className="h-4 w-4" />
              )}
              {isActive ? "Turn Recruitment OFF" : "Turn Recruitment ON"}
            </Button>
          </div>

        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-2xl p-4 text-sm font-medium",
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-crescent/30 bg-crescent-soft text-crescent"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{feedback.text}</p>
        </div>
      )}

      {/* 2. Campaign Settings Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 space-y-8"
      >
        <div className="border-b border-line pb-4">
          <h2 className="text-lg font-bold text-foreground">
            Recruitment Campaign & Eligibility Configuration
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Configure campaign title, eligible semesters, popup text, and announcement banner details.
          </p>
        </div>

        {/* Campaign Title */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="camp-title">Campaign Title</Label>
            <Input
              id="camp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Volunteer Recruitment 2026"
              className="mt-1.5"
              required
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Internal campaign reference name.
            </p>
          </div>

          <div>
            <Label htmlFor="camp-max">Max Applications (Optional)</Label>
            <Input
              id="camp-max"
              type="number"
              value={maxApplications}
              onChange={(e) => setMaxApplications(e.target.value)}
              placeholder="e.g. 100 (Leave blank for unlimited)"
              className="mt-1.5"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Optional applicant cap for this recruitment round.
            </p>
          </div>
        </div>

        {/* Eligible Semesters Selection */}
        <div className="rounded-2xl border border-line bg-mist/30 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand" />
                <Label className="text-sm font-bold text-foreground">
                  Eligible Semesters (Multi-Select)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Only students in the selected semesters will be allowed to submit a volunteer application.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllSemesters}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Select All
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={clearAllSemesters}
                className="text-xs font-semibold text-muted-foreground hover:text-crescent"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {SEMESTERS.map((sem) => {
              const isSelected = allowedSemesters.includes(sem);
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => toggleSemester(sem)}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-all",
                    isSelected
                      ? "border-brand bg-brand text-white shadow-sm shadow-brand/20"
                      : "border-line bg-white text-muted-foreground hover:border-brand/40 hover:text-foreground"
                  )}
                >
                  <span>{sem} Semester</span>
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border text-[10px]",
                      isSelected
                        ? "border-white bg-white text-brand"
                        : "border-slate-300"
                    )}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>
          {allowedSemesters.length === 0 && (
            <p className="text-xs font-medium text-crescent">
              ⚠️ Warning: No semesters selected. Students will not be eligible to apply.
            </p>
          )}
        </div>

        {/* Homepage Popup Content */}
        <div className="rounded-2xl border border-line p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand" />
            <h4 className="text-sm font-bold text-foreground">
              Homepage Automatic Popup Modal
            </h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="popup-title">Popup Title</Label>
              <Input
                id="popup-title"
                value={popupTitle}
                onChange={(e) => setPopupTitle(e.target.value)}
                placeholder="e.g. 🤝 Volunteer Recruitment is Open!"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="popup-desc">Popup Description</Label>
              <Textarea
                id="popup-desc"
                rows={2}
                value={popupDescription}
                onChange={(e) => setPopupDescription(e.target.value)}
                placeholder="Short motivational invitation message..."
                className="mt-1.5"
                required
              />
            </div>
          </div>
        </div>

        {/* Persistent Banner Content */}
        <div className="rounded-2xl border border-line p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-brand" />
            <h4 className="text-sm font-bold text-foreground">
              Homepage Persistent Recruitment Banner
            </h4>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="banner-title">Banner Headline</Label>
              <Input
                id="banner-title"
                value={bannerTitle}
                onChange={(e) => setBannerTitle(e.target.value)}
                placeholder="e.g. 🤝 VOLUNTEER RECRUITMENT IS NOW OPEN"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="banner-sub">Banner Subtitle</Label>
              <Input
                id="banner-sub"
                value={bannerSubtitle}
                onChange={(e) => setBannerSubtitle(e.target.value)}
                placeholder="e.g. Become a volunteer and make a difference with RGPI Red Crescent Youth."
                className="mt-1.5"
                required
              />
            </div>
          </div>
        </div>

        {/* Optional Schedule Dates */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="camp-start">Start Date (Optional)</Label>
            <Input
              id="camp-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="camp-end">End Date (Optional)</Label>
            <Input
              id="camp-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-line">
          <p className="text-xs text-muted-foreground">
            Changes will immediately take effect on the public homepage.
          </p>
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Saving Settings…" : "Save Campaign Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
