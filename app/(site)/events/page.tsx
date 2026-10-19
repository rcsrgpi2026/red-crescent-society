import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { EventCard } from "@/components/cards/event-card";
import { getPublicEvents } from "@/lib/queries";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.events.title,
    description: t.meta.events.description,
  };
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  const [t, { category, status }] = await Promise.all([getServerMessages(), searchParams]);
  const events = await getPublicEvents({
    category: category || undefined,
    status: status || undefined,
  });

  return (
    <>
      <PageHero
        eyebrow={t.events.heroEyebrow}
        title={t.events.heroTitle}
        description={t.events.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          {/* Status & Category Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={category ? `/events?category=${encodeURIComponent(category)}` : "/events"}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all",
                  !status
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-mist/70 text-muted-foreground hover:bg-mist hover:text-foreground"
                )}
              >
                All Events
              </Link>
              <Link
                href={
                  category
                    ? `/events?status=UPCOMING&category=${encodeURIComponent(category)}`
                    : "/events?status=UPCOMING"
                }
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all",
                  status === "UPCOMING"
                    ? "bg-brand text-white shadow-xs"
                    : "bg-mist/70 text-muted-foreground hover:bg-mist hover:text-foreground"
                )}
              >
                Upcoming
              </Link>
              <Link
                href={
                  category
                    ? `/events?status=COMPLETED&category=${encodeURIComponent(category)}`
                    : "/events?status=COMPLETED"
                }
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all",
                  status === "COMPLETED"
                    ? "bg-poly text-white shadow-xs"
                    : "bg-mist/70 text-muted-foreground hover:bg-mist hover:text-foreground"
                )}
              >
                Past Events
              </Link>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={status ? `/events?status=${status}` : "/events"}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  !category
                    ? "border-brand bg-brand/10 text-brand font-semibold"
                    : "border-line bg-white text-muted-foreground hover:border-brand/40"
                )}
              >
                {t.common.all}
              </Link>
              {EVENT_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={
                    status
                      ? `/events?status=${status}&category=${encodeURIComponent(c)}`
                      : `/events?category=${encodeURIComponent(c)}`
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    category === c
                      ? "border-brand bg-brand/10 text-brand font-semibold"
                      : "border-line bg-white text-muted-foreground hover:border-brand/40"
                  )}
                >
                  {c}
                </Link>
              ))}
            </div>
          </div>
          {events.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                icon={CalendarDays}
                title={t.events.emptyTitle}
                description={t.events.emptyText}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
