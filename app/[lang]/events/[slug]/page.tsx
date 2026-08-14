import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Clock, Users, ArrowLeft, ClipboardList } from "lucide-react";
import { getPublicEventBySlug } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { EventRegistrationForm } from "@/components/forms/event-registration-form";
import { SiteLogo } from "@/components/layout/site-logo";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

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
  const [t, locale, event] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicEventBySlug(slug),
  ]);
  if (!event || event.status === "DRAFT") notFound();

  const canRegister = event.registration_enabled && ["UPCOMING", "ONGOING"].includes(event.status);

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
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-soft to-poly-soft">
                    <SiteLogo variant="society" className="w-20" />
                    <CalendarDays className="h-8 w-8 text-brand/50" aria-hidden />
                  </div>
                )}
                <div className="absolute left-4 top-4">
                  <StatusBadge label={t.status.event[event.status] ?? event.status} tone={statusTone(event.status)} />
                </div>
              </div>
              <div className="mt-6">
                <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {event.title}
                </h1>
                {event.category && (
                  <p className="mt-2 text-sm font-semibold text-brand">{event.category}</p>
                )}
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
                        <dd className="font-semibold text-foreground">{formatDate(event.date, locale === "bn" ? "bn-BD" : "en-GB")}</dd>
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
                  <div className="mt-5">
                    <EventRegistrationForm eventId={event.id} />
                  </div>
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
