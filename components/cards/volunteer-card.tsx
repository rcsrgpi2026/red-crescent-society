import Link from "next/link";
import Image from "next/image";
import { Droplet, Award } from "lucide-react";
import type { PublicVolunteer } from "@/types/database";

export function VolunteerCard({ volunteer }: { volunteer: PublicVolunteer }) {
  return (
    <Link
      href={`/volunteers/${volunteer.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist">
        {volunteer.photo_url ? (
          <Image
            src={volunteer.photo_url}
            alt={`${volunteer.name} — volunteer of ${volunteer.position}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-soft">
            <span className="text-5xl font-bold text-brand/40">
              {volunteer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {volunteer.member_id && (
          <span className="absolute left-3 top-3 rounded-full bg-brand/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {volunteer.member_id}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-foreground transition-colors group-hover:text-brand-dark">
          {volunteer.name}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-brand">{volunteer.position}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[volunteer.department, volunteer.semester].filter(Boolean).join(" · ") || "Member"}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Droplet className="h-3.5 w-3.5 text-crescent" aria-hidden />
            {volunteer.blood_group ?? "—"}
          </span>
          <span className="flex items-center gap-1 font-semibold text-brand-dark">
            <Award className="h-3.5 w-3.5 text-poly" aria-hidden />
            {volunteer.points} pts
          </span>
        </div>
      </div>
    </Link>
  );
}
