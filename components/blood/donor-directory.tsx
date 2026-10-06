"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Droplets, X } from "lucide-react";
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
  texts?: {
    availableDonors?: string;
    availableDonorsText?: string;
    noDonorsMatch?: string;
    noDonorsMatchText?: string;
    noDonorsYet?: string;
    noDonorsYetText?: string;
    privacyFirst?: string;
    privacyText?: string;
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
    <div id="donor-directory-section" className="space-y-4">
      {/* 1. Square Blood Group Filter Buttons */}
      <div className="rounded-2xl border border-line bg-white p-3 sm:p-4 shadow-xs">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
          {/* 'All' Square Button */}
          <button
            type="button"
            onClick={() => handleSelectGroup(undefined)}
            className={`aspect-square flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 text-center transition-all duration-150 active:scale-95 cursor-pointer ${
              !selectedGroup
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/25 ring-2 ring-slate-900/10 font-black"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-line font-bold"
            }`}
          >
            <span className="text-xs sm:text-sm">All</span>
            {totalDonors > 0 && (
              <span className="text-[10px] opacity-75 font-semibold mt-0.5">
                {totalDonors}
              </span>
            )}
          </button>

          {/* Individual Blood Group Square Buttons */}
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = selectedGroup === bg;
            const count = counts?.counts?.[bg] ?? 0;

            return (
              <button
                key={bg}
                type="button"
                onClick={() => handleSelectGroup(bg)}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 text-center transition-all duration-150 active:scale-95 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-br from-crescent to-rose-600 text-white shadow-md shadow-crescent/25 ring-2 ring-crescent/30 ring-offset-1 font-black"
                    : "bg-white text-slate-800 border border-line hover:border-crescent/40 hover:bg-rose-50/40 font-bold"
                }`}
              >
                <span className="text-xs sm:text-sm tracking-tight">{bg}</span>
                <span className="text-[10px] opacity-75 font-semibold mt-0.5">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 2. Area Search Bar */}
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-line/60">
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
              placeholder="Search area, hospital, or donor name (e.g. Kazla, RMCH, Talaimari)..."
              className="h-10 rounded-xl pl-10 pr-10 text-xs sm:text-sm bg-slate-50/70 border-line focus:bg-white focus:border-crescent transition-all"
              aria-label="Search donors by area"
            />
            {areaInput && (
              <button
                type="button"
                onClick={() => {
                  setAreaInput("");
                  updateUrlSilently(selectedGroup, undefined);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Clear area input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-10 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:text-crescent"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* 3. Donor List Results */}
      {filteredDonors.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDonors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-8">
          <EmptyState
            icon={Droplets}
            title={
              hasFilter
                ? (texts?.noDonorsMatch ?? "No matching donors found")
                : (texts?.noDonorsYet ?? "No registered donors yet")
            }
            description={
              hasFilter
                ? (texts?.noDonorsMatchText ?? "Try clearing filters or searching another area.")
                : (texts?.noDonorsYetText ?? "Registered blood donors will appear here.")
            }
          />
        </div>
      )}
    </div>
  );
}
