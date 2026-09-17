"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Award, Users, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

export type CommitteeTab = "legacy" | "active" | "founders";

interface CommitteeTabsProps {
  activeTab: CommitteeTab;
  counts?: {
    legacy?: number;
    active?: number;
    founders?: number;
  };
}

export function CommitteeTabs({ activeTab, counts }: CommitteeTabsProps) {
  const searchParams = useSearchParams();

  const tabs: {
    id: CommitteeTab;
    label: string;
    subLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    activeBadgeBg: string;
    badgeCount?: number;
  }[] = [
    {
      id: "legacy",
      label: "সাবেক কার্যনির্বাহী পরিষদ",
      subLabel: "Legacy & Alumni Archives",
      icon: Award,
      color: "text-amber-700",
      activeBadgeBg: "bg-amber-100 text-amber-900 border-amber-300",
      badgeCount: counts?.legacy,
    },
    {
      id: "active",
      label: "বর্তমান পরিষদ",
      subLabel: "Active Executive Team",
      icon: Users,
      color: "text-brand",
      activeBadgeBg: "bg-brand/10 text-brand border-brand/20",
      badgeCount: counts?.active,
    },
    {
      id: "founders",
      label: "প্রতিষ্ঠাতা ও উপদেষ্টা",
      subLabel: "Founders & Advisory Council",
      icon: Landmark,
      color: "text-poly",
      activeBadgeBg: "bg-poly/10 text-poly border-poly/20",
      badgeCount: counts?.founders,
    },
  ];

  function getHref(tabId: CommitteeTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    // Reset session filter when switching tabs
    if (tabId !== "legacy") {
      params.delete("session");
    }
    return `/legacy-members?${params.toString()}`;
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-line bg-mist/60 p-1.5 backdrop-blur-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={getHref(tab.id)}
              className={cn(
                "group relative flex flex-1 min-w-[200px] items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 text-center text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-white text-foreground shadow-sm ring-1 ring-black/5"
                  : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive ? "bg-mist text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive && tab.color)} />
              </span>

              <div className="text-left leading-tight">
                <span className="block text-xs font-bold tracking-tight">
                  {tab.label}
                </span>
                <span className="block text-[10px] font-medium text-muted-foreground">
                  {tab.subLabel}
                </span>
              </div>

              {typeof tab.badgeCount === "number" && (
                <span
                  className={cn(
                    "ml-auto rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    isActive
                      ? tab.activeBadgeBg
                      : "border-line bg-white/70 text-muted-foreground"
                  )}
                >
                  {tab.badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
