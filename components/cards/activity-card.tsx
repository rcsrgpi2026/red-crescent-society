import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Users, ArrowUpRight } from "lucide-react";
import type { Activity } from "@/types/database";
import { formatDate } from "@/lib/constants";

export function ActivityCard({ activity }: { activity: Activity }) {
  const cover = activity.images?.[0];
  return (
    <Link
      href={`/activities/${activity.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-mist">
        {cover ? (
          <Image
            src={cover}
            alt={activity.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-crescent-soft">
            <Users className="h-10 w-10 text-brand/50" aria-hidden />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-brand" aria-hidden />
            {formatDate(activity.date)}
          </span>
          {activity.participants > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-poly" aria-hidden />
              {activity.participants} participants
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-brand-dark">
          {activity.title}
        </h3>
        {activity.category && (
          <p className="mt-1 text-xs font-medium text-brand">{activity.category}</p>
        )}
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {activity.description}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-dark">
          Read the report
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
