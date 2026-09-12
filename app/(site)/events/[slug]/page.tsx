import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  ClipboardList,
  Megaphone,
  ArrowRight,
  ExternalLink,
  Info,
} from "lucide-react";
import { getPublicEventBySlug, getParticipationCounts, getPublicNoticesByEventId, getFormConfigs } from "@/lib/queries";
import { formatDate, formatEventDateRange } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EventRegistrationForm } from "@/components/forms/event-registration-form";
import { SiteLogo } from "@/components/layout/site-logo";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [t, event] = await Promise.all([getServerMessages(), getPublicEventBySlug(slug)]);
  if (!event) return { title: t.common.eventNotFound };
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? format(t.events.descriptionFallback, { title: event.title }),
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 200) ?? undefined,
      images: event.cover_image ? [{ url: event.cover_image }] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [t, locale, event, counts, formConfigs] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicEventBySlug(slug),
    getParticipationCounts(),
    getFormConfigs(),
  ]);
  if (!event || event.status === "DRAFT") notFound();

  const [linkedNotices] = await Promise.all([
    getPublicNoticesByEventId(event.id),
  ]);

  const canRegister = event.registration_enabled && ["UPCOMING", "ONGOING"].includes(event.status);
  const approvedCount = counts.events[event.id] ?? 0;

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-site py-10 lg:py-14">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.events.allEvents}
          </Link>
          <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-line bg-mist">
                {event.cover_image ? (
                  <Image
                    src={event.cover_image}
                    alt={event.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-poly-soft">
                    <CalendarDays className="h-16 w-16 text-brand/40" aria-hidden />
                  </div>
                )}
              </div>

              <div className="mt-8">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={t.status.event[event.status] ?? event.status} tone={statusTone(event.status)} />
                  {event.category && (
                    <span className="rounded-full bg-poly-soft px-3 py-1 text-xs font-semibold text-poly">
                      {event.category}
                    </span>
                  )}
                </div>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  {event.title}
                </h1>
                {event.description && (
                  <div className="mt-5 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {event.description}
                  </div>
                )}
                {event.report && (
                  <div className="mt-8">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                      <ClipboardList className="h-5 w-5 text-brand" aria-hidden />
                      {t.events.eventReport}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap rounded-2xl border border-line bg-mist/50 p-5 text-sm leading-relaxed text-muted-foreground">
                      {event.report}
                    </p>
                  </div>
                )}

                {linkedNotices.length > 0 && (
                  <div className="mt-8 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft/40 via-white to-white p-6 shadow-xs">
                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                      <Megaphone className="h-4 w-4 text-brand" />
                      {locale === "bn" ? "অফিসিয়াল সার্কুলার ও নোটিশ" : "Official Circulars & Notices"}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {locale === "bn"
                        ? "এই ইভেন্ট সংক্রান্ত অফিসিয়াল বিজ্ঞপ্তি ও সার্কুলারপত্র।"
                        : "Official circulars and announcements published for this event."}
                    </p>
                    <div className="mt-4 space-y-2.5">
                      {linkedNotices.map((n) => (
                        <Link
                          key={n.id}
                          href={`/notices/${n.slug}`}
                          className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-white p-3.5 transition-all hover:border-brand/50 hover:shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground transition-colors group-hover:text-brand truncate text-sm">
                              {n.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDate(n.created_at, locale === "bn" ? "bn-BD" : "en-GB")}
                              {n.category ? ` · ${n.category}` : ""}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand transition-transform group-hover:translate-x-1 shrink-0">
                            {locale === "bn" ? "বিজ্ঞপ্তি দেখুন" : "View Circular"}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-line bg-mist/50 p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">{t.events.details}</h2>
                <dl className="mt-4 space-y-4 text-sm">
                  {event.date && (
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <dt className="text-xs text-muted-foreground">{t.events.date}</dt>
                        <dd className="font-semibold text-foreground">{formatEventDateRange(event.date, event.end_date, locale === "bn" ? "bn-BD" : "en-GB")}</dd>
                      </div>
                    </div>
                  )}
                  {event.time && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <dt className="text-xs text-muted-foreground">{t.events.time}</dt>
                        <dd className="font-semibold text-foreground">{event.time}</dd>
                      </div>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <dt className="text-xs text-muted-foreground">{t.events.location}</dt>
                        <dd className="font-semibold text-foreground">{event.location}</dd>
                      </div>
                    </div>
                  )}
                  {event.organizer && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <div>
                        <dt className="text-xs text-muted-foreground">{t.events.organizer}</dt>
                        <dd className="font-semibold text-foreground">{event.organizer}</dd>
                      </div>
                    </div>
                  )}
                  {approvedCount > 0 && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 shrink-0 text-poly" aria-hidden />
                      <div>
                        <dt className="text-xs text-muted-foreground">{t.events.volunteersParticipating}</dt>
                        <dd className="font-semibold text-foreground">{approvedCount}</dd>
                      </div>
                    </div>
                  )}
                </dl>
              </div>

              {canRegister ? (
                <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground">{t.events.registerForEvent}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {event.max_participants
                      ? format(t.events.limitedSeats, { n: event.max_participants })
                      : t.events.openToAll}
                  </p>

                  {/* Custom instructions / details if provided */}
                  {event.registration_instructions && (
                    <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft/40 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                      <p className="font-semibold text-brand mb-1 flex items-center gap-1.5">
                        <Info className="h-3.5 w-3.5" />
                        {locale === "bn" ? "রেজিস্ট্রেশন সংক্রান্ত নির্দেশনা ও বিবরণ:" : "Registration Details & Instructions:"}
                      </p>
                      {event.registration_instructions}
                    </div>
                  )}

                  {/* If external link only */}
                  {event.registration_type === "EXTERNAL" ? (
                    <div className="mt-5 space-y-3 text-center">
                      {event.registration_link ? (
                        <>
                          <a
                            href={event.registration_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-brand to-brand-dark px-5 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {locale === "bn" ? "রেজিস্ট্রেশন করতে এখানে ক্লিক করুন" : "Click here to register"}
                          </a>
                          <p className="text-[11px] text-muted-foreground">
                            {locale === "bn"
                              ? "অফিসিয়াল রেজিস্ট্রেশন ফর্মটি নতুন উইন্ডোতে ওপেন হবে।"
                              : "The official registration form opens in a new tab."}
                          </p>
                        </>
                      ) : (
                        <div className="rounded-xl border border-dashed border-line bg-mist/40 p-4 text-xs text-muted-foreground">
                          {locale === "bn"
                            ? "বাহ্যিক রেজিস্ট্রেশন লিংকটি শীঘ্রই যুক্ত করা হবে।"
                            : "External registration link will be available soon."}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      {event.registration_link && (
                        <div>
                          <a
                            href={event.registration_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full rounded-xl border-2 border-brand/30 bg-brand-soft/30 px-4 py-2.5 text-xs font-semibold text-brand-dark hover:bg-brand-soft/70 transition-all"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {locale === "bn" ? "বিকল্প: রেজিস্ট্রেশন করতে এখানে ক্লিক করুন" : "Alternative: Click here to register"}
                          </a>
                        </div>
                      )}
                      <EventRegistrationForm
                        eventId={event.id}
                        fields={formConfigs.event_registration.fields}
                      />
                    </div>
                  )}
                </div>
              ) : event.status === "COMPLETED" ? (
                <div className="rounded-2xl border border-line bg-mist/50 p-6 text-center">
                  <p className="font-semibold text-foreground">{t.events.eventCompleted}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.events.eventCompletedText}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-line bg-mist/50 p-6 text-center">
                  <p className="font-semibold text-foreground">{t.events.registrationClosed}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.events.registrationClosedText}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
