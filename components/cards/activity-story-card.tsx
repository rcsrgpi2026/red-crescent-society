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
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-red-500/30 ring-1 ring-red-500/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-red-600/70 hover:shadow-xl hover:shadow-red-500/10"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-mist">
        {cover ? (
          <Image
            src={cover}
            alt={activity.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 450px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-crescent-soft">
            <Users className="h-12 w-12 text-brand/40" aria-hidden />
          </div>
        )}
        {activity.date && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-brand-dark/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur shadow-xs">
            {formatDate(activity.date)}
          </span>
        )}
        <span className="absolute right-3.5 top-3.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-dark backdrop-blur shadow-xs">
          {activity.category ?? "Report"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-jakarta line-clamp-2 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-brand-dark">
          {activity.title}
        </h3>
        {activity.description && (
          <p className="font-inter mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {activity.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-line/60">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {activity.participants > 0 && (
              <span className="flex items-center gap-1 font-medium">
                <Users className="h-3.5 w-3.5 text-poly" aria-hidden />
                {activity.participants}
              </span>
            )}
            {activity.impact && (
              <span className="flex items-center gap-1 font-medium">
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
