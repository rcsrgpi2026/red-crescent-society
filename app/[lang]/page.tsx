import Link from "next/link";
import {
  Droplets,
  Users,
  ArrowRight,
  Megaphone,
  Siren,
  Award,
  PhoneCall,
  HeartPulse,
} from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { AboutSection } from "@/components/home/about-section";
import { CommunitySection } from "@/components/home/community-section";
import { SectionHeader } from "@/components/shared/section-header";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/cards/event-card";
import { ActivityStoryCard } from "@/components/cards/activity-story-card";
import { NoticeCard } from "@/components/cards/notice-card";
import { VolunteerCard } from "@/components/cards/volunteer-card";
import { AlbumCard } from "@/components/cards/album-card";
import {
  getSettings,
  getHomeStats,
  getUpcomingEvents,
  getPublishedNotices,
  getRecentActivities,
  getTopVolunteers,
  getAlbums,
  getPublicBloodRequests,
  getTeamMembers,
  getFounders,
  getCommunityMembers,
} from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

/** Real photos from activities and albums, deduplicated, newest first. */
function heroPhotos(images: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const img of images) {
    if (typeof img === "string" && img.trim() && !seen.has(img)) {
      seen.add(img);
      out.push(img);
    }
  }
  return out;
}

export default async function HomePage() {
  const [t, settings, stats, events, notices, activities, volunteers, albums, requests, team, founders, members] =
    await Promise.all([
      getServerMessages(),
      getSettings(),
      getHomeStats(),
      getUpcomingEvents(3),
      getPublishedNotices(4),
      getRecentActivities(6),
      getTopVolunteers(6),
      getAlbums(6),
      getPublicBloodRequests(),
      getTeamMembers(),
      getFounders(),
      getCommunityMembers(),
    ]);

  const homepage = settings.homepage ?? {};
  const contact = settings.contact ?? {};
  const emergency = settings.emergency ?? {};
  const society = settings.society ?? {};
  const collegeName =
    typeof society.collegeName === "string" && society.collegeName.trim()
      ? society.collegeName.trim()
      : undefined;

  // On-the-ground visuals: admin-chosen hero photos first, then fill the
  // remaining slots with the newest activity/album photos automatically.
  const configuredHero = heroPhotos(String(homepage.heroImages ?? "").split(/\r?\n/));
  const autoHero = heroPhotos([
    ...activities.map((a) => a.images?.[0]),
    ...albums.map((a) => a.cover_image),
  ]);
  const heroPhoto = [...configuredHero, ...autoHero]
    .filter((url, i, arr) => arr.indexOf(url) === i)
    .slice(0, 6);
  const liveRequest =
    requests.find((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED") ?? null;
  const bloodHelpline =
    typeof emergency.bloodHelpline === "string" && emergency.bloodHelpline
      ? emergency.bloodHelpline
      : null;
  const societyPhone =
    typeof contact.phone === "string" && contact.phone ? contact.phone : null;

  return (
    <>
      {/* Serve. Respond. Make a Difference. */}
      <Hero
        heroTitle={
          (typeof homepage.heroTitle === "string" && homepage.heroTitle) ||
          t.home.heroDefaultTitle
        }
        heroSubtitle={
          (typeof homepage.heroSubtitle === "string" && homepage.heroSubtitle) ||
          t.home.heroDefaultSubtitle
        }
        backgroundImages={heroPhoto}
        liveRequest={liveRequest}
        bloodHelpline={bloodHelpline}
        collegeName={collegeName}
      />

      {/* Respond — emergency strip */}
      <section className="border-b border-line bg-crescent">
        <div className="container-site flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
              <Siren className="h-5.5 w-5.5 text-white" aria-hidden />
            </span>
            <div>
              <p className="font-bold text-white">{t.home.bloodEmergency}</p>
              <p className="text-sm text-white/80">{t.home.bloodEmergencySub}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              className="bg-white text-crescent hover:bg-white/90"
            >
              <Link href="/blood-support/request">
                <Droplets className="mr-1 h-4 w-4" aria-hidden />
                {t.footer.requestBlood}
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/blood-support">{t.footer.findDonor}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Serve — impact in numbers */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.home.impactEyebrow}
              title={t.home.impactTitle}
              description={t.home.impactDescription}
            />
          </Reveal>
        </div>
      </section>
      <Stats stats={stats} />

      {/* Who we are — mission, history, team */}
      <AboutSection t={t} team={team} founders={founders} />

      {/* Serve — stories from the field */}
      <section className="border-b border-line bg-mist/50">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.home.activitiesEyebrow}
              title={t.home.activitiesTitle}
              description={t.home.activitiesDescription}
            />
          </Reveal>
          {activities.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activities.slice(0, 6).map((activity, i) => (
                <Reveal key={activity.id} delay={(i % 3) * 0.06}>
                  <ActivityStoryCard activity={activity} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                title={t.home.activitiesEmptyTitle}
                description={t.home.activitiesEmptyText}
              />
            </div>
          )}
          <Reveal className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/activities">
                {t.home.viewAllActivities}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Make a Difference — upcoming events */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.home.eventsEyebrow}
              title={t.home.eventsTitle}
              description={t.home.eventsDescription}
            />
          </Reveal>
          {events.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 0.06}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                title={t.home.eventsEmptyTitle}
                description={t.home.eventsEmptyText}
              />
            </div>
          )}
          <Reveal className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/events">
                {t.home.browseAllEvents}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* The people behind it — recognition */}
      <section className="border-b border-line bg-mist/50">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.home.recognitionEyebrow}
              title={t.home.recognitionTitle}
              description={t.home.recognitionDescription}
            />
          </Reveal>
          {volunteers.length > 0 ? (
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {volunteers.map((volunteer, i) => (
                <Reveal key={volunteer.id} delay={(i % 6) * 0.05}>
                  <VolunteerCard volunteer={volunteer} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                icon={Award}
                title={t.home.recognitionEmptyTitle}
                description={t.home.recognitionEmptyText}
              />
            </div>
          )}
        </div>
      </section>

      {/* Community — leadership tree */}
      <CommunitySection t={t} members={members} />

      {/* Gallery */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-16 lg:py-24">
          <Reveal>
            <SectionHeader
              eyebrow={t.home.galleryEyebrow}
              title={t.home.galleryTitle}
              description={t.home.galleryDescription}
            />
          </Reveal>
          {albums.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {albums.slice(0, 6).map((album, i) => (
                <Reveal key={album.id} delay={(i % 3) * 0.06}>
                  <AlbumCard album={album} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-10">
              <EmptyState
                title={t.home.galleryEmptyTitle}
                description={t.home.galleryEmptyText}
              />
            </div>
          )}
          <Reveal className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/gallery">
                {t.home.openGallery}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Notices + Join CTA */}
      <section className="border-b border-line bg-mist/50">
        <div className="container-site py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <Reveal>
              <div className="flex h-full flex-col">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                  {t.home.noticesEyebrow}
                </p>
                <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {t.home.noticesTitle}
                </h2>
                <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                  {t.home.noticesText}
                </p>
                <Button asChild variant="outline" className="mt-6 self-start">
                  <Link href="/notices">
                    {t.home.viewAllNotices}
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </Reveal>
            <div className="space-y-3">
              {notices.length > 0 ? (
                notices.map((notice, i) => (
                  <Reveal key={notice.id} delay={i * 0.05}>
                    <NoticeCard notice={notice} />
                  </Reveal>
                ))
              ) : (
                <EmptyState
                  icon={Megaphone}
                  title={t.home.noticesEmptyTitle}
                  description={t.home.noticesEmptyText}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Closing call — join the movement */}
      <section className="relative overflow-hidden bg-brand-dark">
        <div
          className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand/40 blur-3xl"
          aria-hidden
        />
        <div className="container-site relative py-16 lg:py-20">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                {t.home.joinEyebrow}
              </p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t.home.joinTitle}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-white/75">
                {t.home.joinText}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-crescent hover:bg-crescent-dark">
                  <Link href="/volunteer/login">
                    {t.home.applyToJoin}
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" className="bg-crescent hover:bg-crescent-dark">
                  <Link href="/volunteers">{t.home.meetOurVolunteers}</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/70">
                {societyPhone && (
                  <span className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-white/50" aria-hidden />
                    <a href={`tel:${societyPhone}`} className="hover:text-white">
                      {societyPhone}
                    </a>
                  </span>
                )}
                {bloodHelpline && (
                  <span className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-crescent" aria-hidden />
                    <a href={`tel:${bloodHelpline}`} className="font-semibold hover:text-white">
                      {format(t.home.bloodHelplineLabel, { n: bloodHelpline })}
                    </a>
                  </span>
                )}
                {typeof contact.email === "string" && contact.email && (
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-white/50" aria-hidden />
                    <a href={`mailto:${contact.email}`} className="hover:text-white">
                      {contact.email}
                    </a>
                  </span>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
