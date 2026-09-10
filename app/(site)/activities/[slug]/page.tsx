import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Users, TrendingUp } from "lucide-react";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { getPublicActivities, getParticipationCounts } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [t, activities] = await Promise.all([getServerMessages(), getPublicActivities()]);
  const activity = activities.find((a) => a.slug === slug);
  if (!activity) return { title: t.common.activityNotFound };
  return {
    title: activity.title,
    description: activity.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title: activity.title,
      description: activity.description?.slice(0, 200) ?? undefined,
      images: activity.images?.[0] ? [{ url: activity.images[0] }] : undefined,
    },
  };
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [t, locale, activities, counts] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicActivities(),
    getParticipationCounts(),
  ]);
  const activity = activities.find((a) => a.slug === slug);
  if (!activity) notFound();
  const approvedCount = counts.activities[activity.id] ?? 0;

  const cover = activity.images?.[0];
  const gallery = activity.images?.slice(1) ?? [];

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-site py-10 lg:py-14">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.nav.activitiesGallery}
          </Link>
          <div className="mt-6 max-w-3xl">
            {activity.category && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                {activity.category}
              </p>
            )}
            <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {activity.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-brand" aria-hidden />
                {formatDate(activity.date, locale === "bn" ? "bn-BD" : "en-GB")}
              </span>
              {activity.participants > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-poly" aria-hidden />
                  {activity.participants} {t.common.participants}
                </span>
              )}
              {approvedCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-brand" aria-hidden />
                  {approvedCount} {t.activities.volunteersParticipating}
                </span>
              )}
            </div>
          </div>

          {cover && (
            <div className="relative mt-8 aspect-[16/7] w-full overflow-hidden rounded-3xl border border-line bg-mist">
              <Image
                src={cover}
                alt={activity.title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t.activities.aboutThisActivity}</h2>
              <div className="mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground">
                {activity.description}
              </div>
            </div>
            <div className="space-y-4">
              {activity.impact && (
                <div className="rounded-2xl border border-brand/25 bg-brand-soft/60 p-6">
                  <p className="flex items-center gap-2 font-bold text-brand-dark">
                    <TrendingUp className="h-5 w-5" aria-hidden />
                    {t.activities.impact}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-ink/90">{activity.impact}</p>
                </div>
              )}
              <div className="rounded-2xl border border-line bg-mist/50 p-6 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">{t.activities.wantToJoin}</p>
                <p className="mt-1.5 leading-relaxed">{t.activities.wantToJoinText}</p>
                <Link href="/volunteer/login" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                  {t.activities.becomeVolunteer}
                </Link>
              </div>
            </div>
          </div>

          {gallery.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-bold text-foreground">{t.activities.morePhotos}</h2>
              <div className="mt-4">
                <GalleryGrid
                  images={gallery.map((url, i) => ({
                    id: `${activity.id}-${i}`,
                    album_id: activity.id,
                    url,
                    caption: null,
                    sort: i,
                    created_at: activity.created_at,
                  }))}
                  albumTitle={activity.title}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
