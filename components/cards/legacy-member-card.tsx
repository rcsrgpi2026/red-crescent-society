import { Award, Calendar, GraduationCap, Quote, Sparkles } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import { ProfilePhoto } from "@/components/shared/profile-photo";
import { resolvePhotoUrl } from "@/lib/photo-url";
import type { PublicLegacyMember } from "@/types/database";

export function LegacyMemberCard({ member }: { member: PublicLegacyMember }) {
  const displayTitle =
    member.legacy_designation?.trim() ||
    (member.position ? `Former ${member.position}` : "Former Member");

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-amber-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md">
      {/* Top Banner — Gold/Bronze Heritage Stripe */}
      <div className="relative bg-gradient-to-r from-amber-900 via-amber-800 to-brand-dark px-4 py-3.5 text-center text-white">
        <div className="flex items-center justify-center gap-2">
          <SiteLogo variant="institute" className="w-8 shrink-0 brightness-110" />
          <div className="text-left leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              Red Crescent Youth
            </p>
            <p className="text-[9px] font-medium uppercase tracking-widest text-amber-200/80">
              Rajshahi Govt. Polytechnic
            </p>
          </div>
        </div>

        {/* Floating Honor Badge */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs">
          <span className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            Served with Honor
          </span>
        </div>
      </div>

      {/* Profile Photo */}
      <div className="relative mx-auto mt-6 aspect-square w-32 overflow-hidden rounded-full border-2 border-amber-300/70 bg-amber-50/50 p-1 shadow-inner sm:w-36">
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <ProfilePhoto
            src={resolvePhotoUrl(member.photo_url)}
            alt={`${member.name} — ${displayTitle}`}
            sizes="144px"
            imageClassName="object-cover"
            fallback={
              <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-amber-700/40">
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

        {/* Legacy / Former Designation */}
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 border border-amber-200/80">
            <GraduationCap className="h-3 w-3 text-amber-700" />
            {displayTitle}
          </span>
        </div>

        {/* Details Grid */}
        <div className="mt-4 space-y-1.5 border-t border-dashed border-amber-100 pt-3 text-left text-xs">
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
              <span className="font-semibold text-foreground">
                {member.session}
              </span>
            </div>
          )}

          {member.legacy_tenure && (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Tenure
              </span>
              <span className="font-semibold text-amber-900">
                {member.legacy_tenure}
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

        {/* Farewell Quote / Legacy Note */}
        {member.legacy_note && member.legacy_note.trim() && (
          <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/40 p-3 text-left">
            <div className="flex items-start gap-1.5">
              <Quote className="h-3.5 w-3.5 shrink-0 text-amber-600/70" />
              <p className="text-[11px] italic leading-relaxed text-foreground/80">
                &ldquo;{member.legacy_note.trim()}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
