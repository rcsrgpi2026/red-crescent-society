import Link from "next/link";
import Image from "next/image";
import { Images, CalendarDays } from "lucide-react";
import type { Activity } from "@/types/database";
import { formatDate } from "@/lib/constants";

/**
 * Gallery-style card for a field activity: shows its cover photo like an album
 * cover, with the title, date and photo count overlaid. Used on the Gallery of
 * Activities page — clicking through opens the full activity report with the
 * lightbox photo gallery.
 */
export function ActivityGalleryCard({ activity }: { activity: Activity }) {
  const cover = activity.images?.[0];
  const photoCount = activity.images?.length ?? 0;

  return (
    <Link
      href={`/activities/${activity.slug}`}
      className="group relative flex aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-mist transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
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
          <Images className="h-10 w-10 text-brand/50" aria-hidden />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-2 font-semibold drop-shadow">{activity.title}</h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/85">
          {activity.date && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {formatDate(activity.date)}
            </span>
          )}
          {photoCount > 0 && (
            <span className="flex items-center gap-1">
              <Images className="h-3.5 w-3.5" aria-hidden />
              {photoCount} photo{photoCount === 1 ? "" : "s"}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
