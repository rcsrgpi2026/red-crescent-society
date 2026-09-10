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
  searchParams: Promise<{ category?: string }>;
}) {
  const [t, { category }] = await Promise.all([getServerMessages(), searchParams]);
  const events = await getPublicEvents({ category: category || undefined });

  return (
    <>
      <PageHero
        eyebrow={t.events.heroEyebrow}
        title={t.events.heroTitle}
        description={t.events.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/events"
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                !category
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-muted-foreground hover:border-brand/40"
              )}
            >
              {t.common.all}
            </Link>
            {EVENT_CATEGORIES.map((c) => (
              <Link
                key={c}
                href={category === c ? "/events" : `/events?category=${encodeURIComponent(c)}`}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  category === c
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-white text-muted-foreground hover:border-brand/40"
                )}
              >
                {c}
              </Link>
            ))}
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
