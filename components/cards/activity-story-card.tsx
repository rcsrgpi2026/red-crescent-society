import Link from "next/link";
import Image from "next/image";
import { Users, ArrowUpRight, Target } from "lucide-react";
import type { Activity } from "@/types/database";
import { formatDate } from "@/lib/constants";

export function ActivityStoryCard({ activity }: { activity: Activity }) {
  const cover = activity.images?.[0];
  return (
    <Link
      href={`/activities/${activity.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-mist">
        {cover ? (
          <Image
            src={cover}
            alt={activity.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-crescent-soft">
            <Users className="h-12 w-12 text-brand/40" aria-hidden />
          </div>
        )}
        {activity.date && (
          <span className="absolute left-4 top-4 rounded-full bg-brand-dark/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {formatDate(activity.date)}
          </span>
        )}
        <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-dark backdrop-blur">
          {activity.category ?? "Report"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-lg font-bold text-foreground transition-colors group-hover:text-brand-dark">
          {activity.title}
        </h3>
        {activity.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {activity.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {activity.participants > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-poly" aria-hidden />
                {activity.participants}
              </span>
            )}
            {activity.impact && (
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-brand" aria-hidden />
                <span className="line-clamp-1 max-w-[8rem]">{activity.impact}</span>
              </span>
            )}
          </div>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-brand-dark transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
