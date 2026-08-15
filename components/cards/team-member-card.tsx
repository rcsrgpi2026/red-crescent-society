import Image from "next/image";
import { Award, MapPin, HeartPulse } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import type { PublicTeamMember } from "@/types/database";

export function TeamMemberCard({ teamMember }: { teamMember: PublicTeamMember }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      {/* ID header band */}
      <div className="flex items-center gap-2.5 bg-brand-dark px-4 py-2 md:py-2.5">
        <SiteLogo variant="society" className="w-6 shrink-0 md:w-7" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white">
            Red Crescent Society
          </p>
          <p className="truncate text-[9px] font-medium uppercase tracking-wider text-white/50">
            RPI · Rajshahi
          </p>
        </div>
        <HeartPulse className="h-4 w-4 shrink-0 text-crescent" aria-hidden />
      </div>

      {/* Mobile: photo left + details right. Desktop: photo on top, full width. */}
      <div className="flex gap-4 p-4 md:flex-col md:gap-0 md:p-0">
        {/* Photo — full picture, never cropped or zoomed */}
        <div className="relative aspect-square w-24 shrink-0 self-start overflow-hidden rounded-xl bg-brand-soft md:aspect-square md:w-full md:self-auto md:rounded-none">
          {teamMember.photo_url ? (
            <Image
              src={teamMember.photo_url}
              alt={`${teamMember.name} — team member of ${teamMember.position}`}
              fill
              sizes="(max-width: 640px) 25vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-4xl font-bold text-brand/30 md:text-6xl">
                {teamMember.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Watermark badge — desktop only (too cramped on the small mobile photo) */}
          <span className="pointer-events-none absolute bottom-3 right-3 hidden rounded border border-white/40 bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm md:block">
            RCS
          </span>
        </div>

        {/* ID body */}
        <div className="flex min-w-0 flex-1 flex-col md:p-3.5">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground md:line-clamp-1 md:text-base">
            {teamMember.name}
          </h3>
          {teamMember.member_id && (
            <p className="mt-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {teamMember.member_id}
            </p>
          )}
          <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-crescent md:mt-1">
            {teamMember.position}
          </p>

          {/* Red accent strip — desktop only */}
          <div className="mt-2 hidden h-1 w-10 rounded-full bg-crescent md:mt-2.5 md:block" aria-hidden />

          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] md:mt-2.5">
            <span className="truncate font-medium text-foreground/80">
              {[teamMember.department, teamMember.semester].filter(Boolean).join(" · ") || "Member"}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 font-bold text-brand-dark">
              <Award className="h-3.5 w-3.5 text-poly" aria-hidden />
              {teamMember.points} pts
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            {teamMember.area ? (
              <>
                <MapPin className="h-3 w-3 shrink-0 text-poly" aria-hidden />
                <span className="truncate">{teamMember.area}</span>
              </>
            ) : (
              <span className="text-muted-foreground/70">Society Team Member</span>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}
