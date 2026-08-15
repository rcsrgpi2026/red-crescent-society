import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, CalendarDays, MapPin, UserRound, Award } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, statusTone } from "@/components/shared/status-badge";
import { getPublicTrainings } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.training.title,
    description: t.meta.training.description,
  };
}

export default async function TrainingPage() {
  const [t, locale, trainings] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicTrainings(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={t.training.heroEyebrow}
        title={t.training.heroTitle}
        description={t.training.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          {trainings.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trainings.map((training) => (
                <div
                  key={training.id}
                  className="flex flex-col rounded-2xl border border-line bg-white p-6 transition-all hover:border-brand/40 hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-poly-soft text-poly">
                      <GraduationCap className="h-5.5 w-5.5" aria-hidden />
                    </span>
                    <StatusBadge label={t.status.training[training.status] ?? training.status} tone={statusTone(training.status)} />
                  </div>
                  <h2 className="mt-4 font-semibold text-foreground">{training.title}</h2>
                  {training.category && (
                    <p className="mt-1 text-xs font-medium text-brand">{training.category}</p>
                  )}
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {training.date && (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-poly" aria-hidden />
                        {formatDate(training.date, locale === "bn" ? "bn-BD" : "en-GB")}
                      </p>
                    )}
                    {training.trainer && (
                      <p className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-poly" aria-hidden />
                        {training.trainer}
                      </p>
                    )}
                    {training.location && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-poly" aria-hidden />
                        {training.location}
                      </p>
                    )}
                  </div>
                  {training.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {training.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={GraduationCap}
              title={t.training.emptyTitle}
              description={t.training.emptyText}
            />
          )}
          <div className="mt-10 flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-soft/60 p-5 text-sm text-brand-ink">
            <Award className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p>
              <span className="font-semibold">{t.training.certificatesLabel}</span> {t.training.certificatesNote}
            </p>
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/volunteer/login"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
              {t.training.joinToAccess}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
