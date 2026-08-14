"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import type { HomeStats } from "@/lib/queries";
import { Users, Droplets, CalendarCheck, GraduationCap, HeartPulse, HandHeart } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";

export function Stats({ stats }: { stats: HomeStats }) {
  const { t } = useLocale();
  const STAT_ITEMS: { key: keyof HomeStats; label: string; icon: React.ElementType }[] = [
    { key: "totalVolunteers", label: t.home.stats.activeVolunteers, icon: Users },
    { key: "activeDonors", label: t.home.stats.activeBloodDonors, icon: Droplets },
    { key: "eventsCompleted", label: t.home.stats.eventsCompleted, icon: CalendarCheck },
    { key: "bloodDonations", label: t.home.stats.bloodUnitsDonated, icon: HeartPulse },
    { key: "trainingSessions", label: t.home.stats.trainingSessions, icon: GraduationCap },
    { key: "studentsReached", label: t.home.stats.studentsReached, icon: HandHeart },
  ];

  return (
    <section className="border-b border-line bg-brand-dark">
      <div className="container-site grid grid-cols-2 gap-px overflow-hidden sm:grid-cols-3 lg:grid-cols-6">
        {STAT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex flex-col items-center gap-1.5 bg-brand-dark px-4 py-8 text-center"
            >
              <Icon className="h-5 w-5 text-white/70" aria-hidden />
              <p className="text-3xl font-bold tabular-nums text-white">
                <NumberTicker value={stats[item.key] ?? 0} className="text-white" />
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
