import { BadgeCheck, Calendar, GraduationCap, Sparkles } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import { ProfilePhoto } from "@/components/shared/profile-photo";
import { resolvePhotoUrl } from "@/lib/photo-url";
import type { PublicLegacyMember } from "@/types/database";

export function ActiveCommitteeCard({ member }: { member: PublicLegacyMember }) {
  const isTopLeader =
    /leader|chief|head|coordinator/i.test(member.position || "");

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md">
      {/* Top Banner — Active Brand Stripe */}
      <div className="relative bg-gradient-to-r from-brand-dark via-brand to-crescent px-4 py-3 text-center text-white">
        <div className="flex items-center justify-center gap-2">
          <SiteLogo variant="institute" className="w-7 shrink-0 brightness-110" />
          <div className="text-left leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white">
              Red Crescent Youth
            </p>
            <p className="text-[9px] font-medium uppercase tracking-widest text-white/80">
              Rajshahi Govt. Polytechnic
            </p>
          </div>
        </div>

        {/* Floating Active Badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-300 bg-emerald-600 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-3 w-3" />
            {isTopLeader ? "Executive Leadership" : "Active Member"}
          </span>
        </div>
      </div>

      {/* Profile Photo */}
      <div className="relative mx-auto mt-6 aspect-square w-28 overflow-hidden rounded-full border-2 border-brand/30 bg-mist p-1 shadow-inner sm:w-32">
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <ProfilePhoto
            src={resolvePhotoUrl(member.photo_url)}
            alt={`${member.name} — ${member.position}`}
            sizes="128px"
            imageClassName="object-cover"
            fallback={
              <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-brand/30">
                {member.name.charAt(0).toUpperCase()}
              </span>
            }
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col px-5 pb-5 pt-3 text-center">
        <h3 className="text-base font-bold text-foreground sm:text-lg">
          {member.name}
        </h3>

        {/* Position */}
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-0.5 text-xs font-semibold text-brand-dark border border-brand/20">
            <Sparkles className="h-3 w-3 text-brand" />
            {member.position || "Team Member"}
          </span>
        </div>

        {/* Details Grid */}
        <div className="mt-4 space-y-1.5 border-t border-dashed border-line pt-3 text-left text-xs">
          {member.department && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Department
              </span>
              <span className="truncate font-semibold text-foreground">
                {member.department}
              </span>
            </div>
          )}

          {member.session && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Session
              </span>
              <span className="font-semibold text-foreground font-mono">
                {member.session}
              </span>
            </div>
          )}

          {member.member_id && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Member ID
              </span>
              <span className="font-mono text-[11px] font-bold text-muted-foreground">
                {member.member_id}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
