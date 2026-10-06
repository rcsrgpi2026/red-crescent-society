"use client";

import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import type { HomeStats } from "@/lib/queries";
import { Users, Droplets, CalendarCheck, GraduationCap, HeartPulse, HandHeart } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function Stats({
  stats,
  isAdmin = true,
}: {
  stats: HomeStats;
  /** Team-related stats (Active Team Members) are admin-only. */
  isAdmin?: boolean;
}) {
  const { t } = useLocale();
  const ALL_STAT_ITEMS: {
    key: keyof HomeStats;
    label: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }[] = [
    { key: "totalVolunteers", label: t.home.stats.activeVolunteers, icon: Users },
    { key: "activeDonors", label: t.home.stats.activeBloodDonors, icon: Droplets },
    { key: "eventsCompleted", label: t.home.stats.eventsCompleted, icon: CalendarCheck },
    { key: "bloodDonations", label: t.home.stats.bloodUnitsDonated, icon: HeartPulse },
    { key: "trainingSessions", label: t.home.stats.trainingSessions, icon: GraduationCap },
    { key: "studentsReached", label: t.home.stats.studentsReached, icon: HandHeart },
  ];
  const STAT_ITEMS = isAdmin
    ? ALL_STAT_ITEMS
    : ALL_STAT_ITEMS.filter((item) => item.key !== "totalVolunteers");

  return (
    <section className="relative border-b border-crescent-dark/20 bg-crescent text-white">
      {/* Mobile view (< sm): narrow single line with smooth left-to-right auto-scroll marquee */}
      <div className="relative overflow-hidden py-3 sm:hidden">
        <Marquee
          pauseOnHover
          reverse
          className="[--duration:28s] [--gap:0.75rem] py-0"
        >
          {STAT_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = stats[item.key] ?? 0;
            return (
              <div
                key={item.key}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 select-none"
              >
                <Icon className="h-3.5 w-3.5 text-white/90 shrink-0" aria-hidden />
                <span className="text-sm font-bold tabular-nums text-white">
                  {value}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-white/85 whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            );
          })}
        </Marquee>
        {/* Subtle left & right edge fades for seamless ticker appearance */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-crescent to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-crescent to-transparent z-10" />
      </div>

      {/* Desktop / Tablet view (sm+): full responsive grid with number ticker animation */}
      <div
        className={cn(
          "container-site hidden gap-px overflow-hidden sm:grid sm:grid-cols-3",
          isAdmin ? "lg:grid-cols-6" : "lg:grid-cols-5"
        )}
      >
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex flex-col items-center gap-1.5 bg-crescent px-4 py-8 text-center"
            >
              <Icon className="h-5 w-5 text-white/80" aria-hidden />
              <p className="text-3xl font-bold tabular-nums text-white">
                <NumberTicker value={stats[item.key] ?? 0} className="text-white" />
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/75">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

