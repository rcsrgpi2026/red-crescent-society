import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Award, Droplet, GraduationCap, Users, Sparkles, ArrowLeft, BadgeCheck } from "lucide-react";
import { getPublicVolunteer, getVolunteerAchievements } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { StatusBadge } from "@/components/shared/status-badge";
import { SiteLogo } from "@/components/layout/site-logo";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [t, volunteer] = await Promise.all([getServerMessages(), getPublicVolunteer(id)]);
  if (!volunteer) return { title: t.common.notFound };
  return {
    title: `${volunteer.name} — ${t.meta.volunteers.title}`,
    description: `Public volunteer profile of ${volunteer.name}, ${volunteer.position} at the Rajshahi Polytechnic Institute Red Crescent Society.`,
    openGraph: {
      title: `${volunteer.name} — Red Crescent Volunteer`,
      description: `${volunteer.position} · ${volunteer.department ?? t.common.member} · ${volunteer.points} points`,
      images: volunteer.photo_url ? [{ url: volunteer.photo_url }] : undefined,
    },
  };
}

export default async function VolunteerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, locale, volunteer] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicVolunteer(id),
  ]);
  if (!volunteer) notFound();

  const achievements = await getVolunteerAchievements(id);
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/volunteers/${volunteer.id}`;

  return (
    <>
      <section className="border-b border-line bg-mist/60">
        <div className="container-site py-10 lg:py-14">
          <Link
            href="/volunteers"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.nav.volunteers}
          </Link>
          <div className="mt-6 grid gap-8 lg:grid-cols-[auto_1fr_auto] lg:items-start">
            {/* Photo */}
            <div className="relative h-40 w-40 overflow-hidden rounded-3xl border border-line bg-brand-soft shadow-sm sm:h-48 sm:w-48">
              {volunteer.photo_url ? (
                <Image src={volunteer.photo_url} alt={volunteer.name} fill sizes="192px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-7xl font-bold text-brand/30">
                  {volunteer.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {volunteer.member_id && (
                  <StatusBadge label={`${t.volunteers.memberIdLabel}${volunteer.member_id}`} tone="brand" />
                )}
                <StatusBadge label={volunteer.position} tone="poly" />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {volunteer.name}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {[volunteer.department, volunteer.semester].filter(Boolean).join(" · ") || t.volunteers.memberOfSociety}
              </p>
              <div className="mt-5 flex flex-wrap gap-6 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Droplet className="h-4 w-4 text-crescent" aria-hidden />
                  {t.volunteers.bloodGroupLabel}<span className="font-semibold text-foreground">{volunteer.blood_group ?? "—"}</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4 text-poly" aria-hidden />
                  {t.volunteers.joined}<span className="font-semibold text-foreground">{formatDate(volunteer.joined_at, locale === "bn" ? "bn-BD" : "en-GB")}</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
                  {t.volunteers.volunteerPoints}<span className="font-semibold text-foreground">{volunteer.points}</span>
                </span>
              </div>
            </div>

            {/* QR */}              <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <div className="flex items-center gap-2">
                <SiteLogo variant="society" className="w-7" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-dark">
                  {t.volunteers.memberIdCard}
                </p>
              </div>
              <QRCodeSVG value={profileUrl} size={120} level="M" marginSize={1} />
              <p className="max-w-[10rem] text-center text-[10px] leading-snug text-muted-foreground">
                {t.volunteers.scanToOpen}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-site grid gap-10 py-12 lg:grid-cols-[1.3fr_1fr] lg:py-16">
          <div className="space-y-8">
            {achievements.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Award className="h-5 w-5 text-amber-500" aria-hidden />
                  {t.volunteers.achievements}
                </h2>
                <div className="mt-4 space-y-3">
                  {achievements.map((a) => (
                    <div key={a.id} className="rounded-xl border border-line bg-mist/40 p-4">
                      <p className="font-semibold text-foreground">{a.title}</p>
                      {a.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                      )}
                      {a.date && (
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(a.date)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {volunteer.area && (
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Users className="h-5 w-5 text-poly" aria-hidden />
                  {t.volunteers.community}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {format(t.volunteers.basedIn, { area: volunteer.area })}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-brand/25 bg-brand-soft/50 p-6">
              <p className="flex items-center gap-2 font-bold text-brand-dark">
                <BadgeCheck className="h-5 w-5" aria-hidden />
                {t.volunteers.verifiedVolunteer}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-brand-ink/80">
                {t.volunteers.verifiedText}
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-mist/50 p-6 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{t.volunteers.privacyNote}</p>
              <p className="mt-2 leading-relaxed">{t.volunteers.privacyText}</p>
            </div>
            <Link
              href="/volunteer/login"
              className="flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              {t.volunteers.becomeVolunteerToo}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
