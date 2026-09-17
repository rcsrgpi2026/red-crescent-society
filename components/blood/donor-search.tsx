"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, Loader2, Droplets, X, Filter } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { BLOOD_GROUPS } from "@/lib/constants";

interface DonorSearchProps {
  current: { bloodGroup?: string; area?: string };
  counts?: { counts: Record<string, number>; total: number };
}

export function DonorSearch({ current, counts }: DonorSearchProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [areaInput, setAreaInput] = useState(current.area ?? "");

  useEffect(() => {
    setAreaInput(current.area ?? "");
  }, [current.area]);

  const apply = (next: { bloodGroup?: string; area?: string }) => {
    const params = new URLSearchParams();
    if (next.bloodGroup) params.set("bloodGroup", next.bloodGroup);
    if (next.area?.trim()) params.set("area", next.area.trim());
    startTransition(() => {
      const q = params.toString();
      router.push(`/blood-support${q ? `?${q}` : ""}`, { scroll: false });
    });
  };

  const handleSelectGroup = (bg?: string) => {
    if (!bg || bg === current.bloodGroup) {
      // Toggle off / select All
      apply({ area: current.area });
    } else {
      apply({ bloodGroup: bg, area: current.area });
    }
  };

  const handleClearAll = () => {
    setAreaInput("");
    startTransition(() => router.push("/blood-support", { scroll: false }));
  };

  const hasFilter = Boolean(current.bloodGroup || current.area);
  const totalDonors = counts?.total ?? 0;

  return (
    <div className="rounded-3xl border border-line bg-white p-4 shadow-sm sm:p-5">
      {/* 1. Area Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply({ bloodGroup: current.bloodGroup, area: areaInput });
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
            onChange={(e) => setAreaInput(e.target.value)}
            placeholder="Search by area / hospital (e.g. Kazla, RMCH, Talaimari)…"
            className="h-11 rounded-full pl-10 pr-10 text-sm bg-slate-50/70 border-slate-200 focus:bg-white focus:border-crescent transition-all"
            aria-label="Search donors by area"
          />
          {areaInput && (
            <button
              type="button"
              onClick={() => {
                setAreaInput("");
                apply({ bloodGroup: current.bloodGroup, area: undefined });
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <Button
            type="button"
            onClick={() => apply({ bloodGroup: current.bloodGroup, area: areaInput })}
            className="h-11 rounded-full bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 active:scale-95"
          >
            {pending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Filter className="mr-1.5 h-3.5 w-3.5" />
            )}
            Search Area
          </Button>

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-11 rounded-full px-3.5 text-xs text-muted-foreground hover:text-crescent"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 2. Quick Blood Group Pills Bar (Mobile-First Touch Swiper) */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-crescent" />
            Filter by Blood Group / রক্তের গ্রুপ সিলেক্ট করুন
          </p>
          {current.bloodGroup && (
            <span className="text-xs font-semibold text-crescent">
              Active: {current.bloodGroup}
            </span>
          )}
        </div>

        {/* Scrollable Container on Small Screens, Flex Wrap on Desktop */}
        <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none sm:flex-wrap">
            {/* 'All' Button */}
            <button
              type="button"
              onClick={() => handleSelectGroup(undefined)}
              className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                !current.bloodGroup
                  ? "bg-slate-900 text-white shadow-sm shadow-slate-900/20 ring-2 ring-slate-900/10"
                  : "bg-slate-100/90 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60"
              }`}
            >
              <span>All</span>
              {totalDonors > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                    !current.bloodGroup
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
              const isSelected = current.bloodGroup === bg;
              const count = counts?.counts?.[bg] ?? 0;

              return (
                <button
                  key={bg}
                  type="button"
                  onClick={() => handleSelectGroup(bg)}
                  className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                    isSelected
                      ? "bg-gradient-to-r from-crescent to-rose-600 text-white shadow-md shadow-crescent/25 ring-2 ring-crescent/30 ring-offset-1"
                      : "bg-white text-slate-800 border border-slate-200/90 shadow-2xs hover:border-crescent/40 hover:bg-rose-50/40"
                  }`}
                >
                  <Droplets
                    className={`h-3 w-3 ${
                      isSelected ? "fill-white text-white" : "text-crescent fill-crescent/30"
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
  );
}
