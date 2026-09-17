"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Droplets, X, ShieldCheck } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { BLOOD_GROUPS } from "@/lib/constants";
import { DonorCard } from "@/components/blood/donor-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { PublicBloodDonor } from "@/types/database";

interface DonorDirectoryProps {
  allDonors: PublicBloodDonor[];
  initialBloodGroup?: string;
  initialArea?: string;
  counts?: { counts: Record<string, number>; total: number };
  texts: {
    availableDonors: string;
    availableDonorsText: string;
    noDonorsMatch: string;
    noDonorsMatchText: string;
    noDonorsYet: string;
    noDonorsYetText: string;
    privacyFirst: string;
    privacyText: string;
  };
}

export function DonorDirectory({
  allDonors,
  initialBloodGroup,
  initialArea,
  counts,
  texts,
}: DonorDirectoryProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(
    initialBloodGroup
  );
  const [areaInput, setAreaInput] = useState<string>(initialArea ?? "");

  // Synchronize state if URL query params change externally
  useEffect(() => {
    setSelectedGroup(initialBloodGroup);
  }, [initialBloodGroup]);

  useEffect(() => {
    setAreaInput(initialArea ?? "");
  }, [initialArea]);

  // Update browser URL silently without triggering Next.js route navigation / scroll jump
  const updateUrlSilently = (group?: string, area?: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (group) params.set("bloodGroup", group);
    if (area?.trim()) params.set("area", area.trim());
    const query = params.toString();
    const newUrl = `/blood-support${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  };

  const handleSelectGroup = (bg?: string) => {
    const next = bg === selectedGroup ? undefined : bg;
    setSelectedGroup(next);
    updateUrlSilently(next, areaInput);
  };

  const handleClearAll = () => {
    setSelectedGroup(undefined);
    setAreaInput("");
    updateUrlSilently(undefined, undefined);
  };

  // Instant client-side filtering (0ms latency, zero scroll jump)
  const filteredDonors = useMemo(() => {
    const normalizedArea = areaInput.trim().toLowerCase();

    return allDonors.filter((donor) => {
      // 1. Blood group check
      if (selectedGroup && donor.blood_group !== selectedGroup) {
        return false;
      }
      // 2. Area search check
      if (normalizedArea) {
        const dArea = (donor.area ?? "").toLowerCase();
        const dName = (donor.name ?? "").toLowerCase();
        if (!dArea.includes(normalizedArea) && !dName.includes(normalizedArea)) {
          return false;
        }
      }
      return true;
    });
  }, [allDonors, selectedGroup, areaInput]);

  const hasFilter = Boolean(selectedGroup || areaInput.trim());
  const totalDonors = counts?.total ?? allDonors.length;

  return (
    <div id="donor-directory-section">
      <h2 className="text-2xl font-bold text-foreground">
        {texts.availableDonors}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {texts.availableDonorsText}
      </p>

      {/* Search & Quick Blood Group Pills Card */}
      <div className="mt-6 rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-5">
        {/* 1. Area Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateUrlSilently(selectedGroup, areaInput);
            }}
            className="relative flex-1"
          >
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              name="area"
              value={areaInput}
              onChange={(e) => {
                const val = e.target.value;
                setAreaInput(val);
                updateUrlSilently(selectedGroup, val);
              }}
              placeholder="Search by area / hospital (e.g. Kazla, RMCH, Talaimari)…"
              className="h-11 rounded-full pl-10 pr-10 text-sm bg-slate-50/70 border-slate-200 focus:bg-white focus:border-crescent transition-all"
              aria-label="Search donors by area"
            />
            {areaInput && (
              <button
                type="button"
                onClick={() => {
                  setAreaInput("");
                  updateUrlSilently(selectedGroup, undefined);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Clear area input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            {hasFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-11 rounded-full px-4 text-xs font-semibold text-muted-foreground hover:text-crescent"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* 2. Quick Blood Group Pills Bar (Touch Swiper on Mobile, Wrap on Desktop) */}
        <div className="mt-4 pt-3.5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-crescent" />
              Filter by Blood Group / রক্তের গ্রুপ সিলেক্ট করুন
            </p>
            {selectedGroup && (
              <span className="text-xs font-semibold text-crescent">
                Active: {selectedGroup}
              </span>
            )}
          </div>

          <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none sm:flex-wrap">
              {/* 'All' Button */}
              <button
                type="button"
                onClick={() => handleSelectGroup(undefined)}
                className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                  !selectedGroup
                    ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20 ring-2 ring-slate-900/10"
                    : "bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60"
                }`}
              >
                <span>All</span>
                {totalDonors > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      !selectedGroup
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {totalDonors}
                  </span>
                )}
              </button>

              {/* Individual Blood Group Pills */}
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = selectedGroup === bg;
                const count = counts?.counts?.[bg] ?? 0;

                return (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => handleSelectGroup(bg)}
                    className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-crescent to-rose-600 text-white shadow-md shadow-crescent/25 ring-2 ring-crescent/30 ring-offset-1"
                        : "bg-white text-slate-800 border border-slate-200/90 shadow-2xs hover:border-crescent/40 hover:bg-rose-50/40"
                    }`}
                  >
                    <Droplets
                      className={`h-3 w-3 ${
                        isSelected
                          ? "fill-white text-white"
                          : "text-crescent fill-crescent/30"
                      }`}
                    />
                    <span>{bg}</span>
                    {count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                          isSelected
                            ? "bg-white/25 text-white"
                            : "bg-slate-100 text-slate-600 group-hover:bg-rose-100 group-hover:text-crescent"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Donor List Results (Zero Scroll Jump) */}
      {filteredDonors.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDonors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <EmptyState
            icon={Droplets}
            title={hasFilter ? texts.noDonorsMatch : texts.noDonorsYet}
            description={
              hasFilter ? texts.noDonorsMatchText : texts.noDonorsYetText
            }
          />
        </div>
      )}

      {/* 4. Privacy Banner */}
      <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-brand/20 bg-white p-4 text-sm text-brand-ink shadow-2xs">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
        <p>
          <span className="font-semibold">{texts.privacyFirst}</span>{" "}
          {texts.privacyText}
        </p>
      </div>
    </div>
  );
}
