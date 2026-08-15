import type { Metadata } from "next";
import Link from "next/link";
import { HandHeart, CalendarDays, GraduationCap, Sparkles, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityCard } from "@/components/cards/activity-card";
import { EventCard } from "@/components/cards/event-card";
import { getPublicActivities, getPublicEvents, getPublicTrainings } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.activities.title,
    description: t.meta.activities.description,
  };
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [t, locale, params, activities, events, trainings] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    searchParams,
    getPublicActivities(),
    getPublicEvents(),
    getPublicTrainings(),
  ]);

  const currentTab = params.tab || "all";
  const upcomingEvents = events.filter((e) => ["UPCOMING", "ONGOING"].includes(e.status));
  const completedEvents = events.filter((e) => e.status === "COMPLETED");

  const tabs = [
    { id: "all", label: "All Activities", count: activities.length + events.length + trainings.length },
    { id: "completed", label: "Field Activities & Stories", count: activities.length },
    { id: "upcoming", label: "Upcoming Events", count: upcomingEvents.length },
    { id: "training", label: "Trainings & Workshops", count: trainings.length },
  ];

  return (
    <>
      <PageHero
        eyebrow={t.activities.heroEyebrow}
        title={t.activities.heroTitle}
        description="Comprehensive archive of our humanitarian responses, community drives, scheduled events, and certified training sessions."
      />

      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-line pb-4">
            {tabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.id === "all" ? "/activities" : `/activities?tab=${tab.id}`}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                    active
                      ? "bg-brand text-white shadow-sm"
                      : "bg-mist/70 text-muted-foreground hover:bg-mist hover:text-foreground"
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      active ? "bg-white/20 text-white" : "bg-white text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {/* 1. All Tab */}
            {currentTab === "all" && (
              <div className="space-y-14">
                {/* Upcoming section */}
                {upcomingEvents.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                          <CalendarDays className="h-5 w-5 text-poly" />
                          Upcoming Events
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Scheduled activities open for volunteer participation.
                        </p>
                      </div>
                      <Link href="/events" className="text-xs font-semibold text-brand hover:underline">
                        View all events
                      </Link>
                    </div>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {upcomingEvents.slice(0, 3).map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Field Activities */}
                {activities.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                          <HandHeart className="h-5 w-5 text-brand" />
                          Field Activities & Community Reports
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Completed humanitarian operations and youth initiatives on the ground.
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Trainings */}
                {trainings.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                          <GraduationCap className="h-5 w-5 text-poly" />
                          Trainings & Workshops
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Capacity building, first aid certification, and disaster preparedness courses.
                        </p>
                      </div>
                      <Link href="/training" className="text-xs font-semibold text-poly hover:underline">
                        View all trainings
                      </Link>
                    </div>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {trainings.slice(0, 3).map((tItem) => (
                        <div
                          key={tItem.id}
                          className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:border-brand/40"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-poly-soft text-poly">
                                <GraduationCap className="h-5 w-5" />
                              </span>
                              <StatusBadge
                                label={t.status.training[tItem.status] ?? tItem.status}
                                tone={statusTone(tItem.status)}
                              />
                            </div>
                            <h3 className="mt-4 font-bold text-foreground">{tItem.title}</h3>
                            {tItem.category && (
                              <p className="mt-0.5 text-xs font-semibold text-brand">
                                {tItem.category}
                              </p>
                            )}
                            {tItem.description && (
                              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                                {tItem.description}
                              </p>
                            )}
                          </div>
                          {tItem.date && (
                            <p className="mt-4 border-t border-line pt-3 text-xs text-muted-foreground">
                              Date: {formatDate(tItem.date, locale === "bn" ? "bn-BD" : "en-GB")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Completed Field Activities */}
            {currentTab === "completed" && (
              <div>
                {activities.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={HandHeart}
                    title="No completed field activities yet"
                    description="Field activity reports and photos will appear here as they are conducted."
                  />
                )}
              </div>
            )}

            {/* 3. Upcoming Events */}
            {currentTab === "upcoming" && (
              <div>
                {upcomingEvents.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={CalendarDays}
                    title="No upcoming events scheduled"
                    description="Check back soon for announcements on future events and volunteer drives."
                  />
                )}
              </div>
            )}

            {/* 4. Trainings */}
            {currentTab === "training" && (
              <div>
                {trainings.length > 0 ? (
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {trainings.map((tItem) => (
                      <div
                        key={tItem.id}
                        className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-sm transition-all hover:border-brand/40"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-poly-soft text-poly">
                              <GraduationCap className="h-5 w-5" />
                            </span>
                            <StatusBadge
                              label={t.status.training[tItem.status] ?? tItem.status}
                              tone={statusTone(tItem.status)}
                            />
                          </div>
                          <h3 className="mt-4 font-bold text-foreground">{tItem.title}</h3>
                          {tItem.category && (
                            <p className="mt-0.5 text-xs font-semibold text-brand">
                              {tItem.category}
                            </p>
                          )}
                          {tItem.description && (
                            <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                              {tItem.description}
                            </p>
                          )}
                        </div>
                        {tItem.date && (
                          <p className="mt-4 border-t border-line pt-3 text-xs text-muted-foreground">
                            Date: {formatDate(tItem.date, locale === "bn" ? "bn-BD" : "en-GB")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={GraduationCap}
                    title="No training sessions listed"
                    description="Upcoming training modules and first aid classes will be posted here."
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
