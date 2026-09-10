"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, HeartHandshake, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecruitmentCampaign } from "@/types/database";

interface RecruitmentBannerProps {
  campaign: RecruitmentCampaign | null;
}

export function RecruitmentBanner({ campaign }: RecruitmentBannerProps) {
  if (!campaign || !campaign.is_active) return null;

  return (
    <aside
      aria-label="Volunteer recruitment announcement"
      className="relative z-20 border-b border-brand-dark/20 bg-gradient-to-r from-[#022c1e] via-brand-dark to-[#033f2a] text-white shadow-sm"
    >
      <div className="container-site flex flex-col items-center justify-between gap-3 py-3 sm:flex-row sm:py-3.5">
        <div className="flex min-w-0 items-center gap-3 text-center sm:text-left">
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-crescent text-white shadow-sm sm:flex">
            <HeartHandshake className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-crescent/20 border border-crescent/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-crescent-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-crescent animate-ping" />
                Recruitment Open
              </span>
              <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
                {campaign.banner_title || "🤝 VOLUNTEER RECRUITMENT IS NOW OPEN"}
              </p>
            </div>
            <p className="hidden text-xs text-white/80 md:block mt-0.5 truncate">
              {campaign.banner_subtitle || "Become a volunteer and make a difference with RGPI Red Crescent Youth."}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Button
            asChild
            size="sm"
            className="gap-1.5 bg-crescent hover:bg-crescent-dark text-white font-bold shadow-sm shadow-crescent/30 text-xs sm:text-sm h-8 sm:h-9 px-4 rounded-full transition-transform hover:scale-105"
          >
            <Link href="/apply-volunteer">
              <span>Apply Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
