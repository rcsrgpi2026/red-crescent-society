import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { SiteLogo } from "@/components/layout/site-logo";
import type { TeamMember } from "@/types/database";

const ID_ROWS: { label: string; getValue: (m: TeamMember) => string | null | undefined }[] = [
  { label: "Roll", getValue: (m) => m.roll },
  { label: "Registration No.", getValue: (m) => m.registration_no },
  { label: "Session", getValue: (m) => m.session },
  { label: "Semester", getValue: (m) => m.semester },
  { label: "Department", getValue: (m) => m.department },
  { label: "RCY Dept.", getValue: (m) => m.rcy_department },
];

/** College ID-card style membership card — admin-only directory. */
export function TeamMemberCard({ teamMember }: { teamMember: TeamMember }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      {/* ID header — institute identity */}
      <div className="bg-brand-dark px-4 py-3.5 text-center">
        <SiteLogo variant="institute" className="mx-auto w-10" />
        <p className="mt-1.5 text-[11px] font-bold uppercase leading-snug tracking-wide text-white">
          Rajshahi Govt Polytechnic Institute
        </p>
        <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.28em] text-crescent">
          Red Crescent Youth
        </p>
      </div>

      {/* Photo — square ID box */}
      <div className="relative mx-auto mt-5 aspect-square w-32 overflow-hidden rounded-lg border border-line bg-brand-soft shadow-inner sm:w-36">
        {teamMember.photo_url ? (
          <Image
            src={teamMember.photo_url}
            alt={`${teamMember.name} — ${teamMember.position}`}
            fill
            sizes="144px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-5xl font-bold text-brand/30">
            {teamMember.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Identity + record */}
      <div className="px-4 pb-4 pt-4 text-center">
        <h3 className="text-base font-bold leading-snug text-foreground">{teamMember.name}</h3>
        <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
          <BadgeCheck className="h-3 w-3" aria-hidden />
          {teamMember.position || "Team Member"}
        </p>
        {teamMember.member_id && (
          <p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            ID: {teamMember.member_id}
          </p>
        )}

        {/* Data block */}
        <div className="mt-3 border-t border-dashed border-line pt-1 text-left">
          {ID_ROWS.map((row) => {
            const value = row.getValue(teamMember);
            return (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 border-b border-dashed border-line py-1.5 text-[11px]"
              >
                <span className="shrink-0 font-medium uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </span>
                <span className="min-w-0 flex-1 text-right font-semibold text-foreground">
                  {value || "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom band */}
      <div className="mt-auto h-1.5 bg-crescent" aria-hidden />
    </article>
  );
}
