import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import type { Event } from "@/types/database";
import { EVENT_STATUS_LABELS, formatDate } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-mist">
        {event.cover_image ? (
          <Image
            src={event.cover_image}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-poly-soft">
            <CalendarDays className="h-10 w-10 text-brand/50" aria-hidden />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge label={EVENT_STATUS_LABELS[event.status] ?? event.status} tone={statusTone(event.status)} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5 text-brand" aria-hidden />
            {formatDate(event.date)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3.5 w-3.5 text-poly" aria-hidden />
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </div>
        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-brand-dark">
          {event.title}
        </h3>
        {event.category && (
          <p className="mt-1 text-xs font-medium text-brand">{event.category}</p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="text-xs font-semibold text-brand-dark">
            {event.registration_enabled ? "Registration open" : "Details"}
          </span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
        </div>
      </div>
    </Link>
  );
}
