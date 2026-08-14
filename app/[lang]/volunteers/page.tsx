import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { VolunteerCard } from "@/components/cards/volunteer-card";
import { VolunteerFilters } from "@/components/volunteers/volunteer-filters";
import { getPublicVolunteers } from "@/lib/queries";
import { DEPARTMENTS, SEMESTERS } from "@/lib/constants";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.volunteers.title,
    description: t.meta.volunteers.description,
  };
}

export default async function VolunteersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; department?: string; semester?: string }>;
}) {
  const [t, locale, params] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    searchParams,
  ]);
  const volunteers = await getPublicVolunteers({
    search: params.search,
    department: params.department,
    semester: params.semester,
  });

  return (
    <>
      <PageHero
        eyebrow={t.volunteers.heroEyebrow}
        title={t.volunteers.heroTitle}
        description={t.volunteers.heroDescription}
      >
        <Link
          href="/volunteer/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <Users className="h-4 w-4" aria-hidden />
          {t.volunteers.becomeVolunteer}
        </Link>
      </PageHero>
      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          <VolunteerFilters
            departments={DEPARTMENTS}
            semesters={SEMESTERS}
            current={{ ...params }}
          />
          {volunteers.length > 0 ? (
            <>
              <p className="mt-8 text-sm text-muted-foreground">
                {format(t.volunteers.showing, {
                  n: volunteers.length.toLocaleString(locale === "bn" ? "bn-BD" : "en-US"),
                  s: volunteers.length === 1 ? "" : "s",
                })}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {volunteers.map((volunteer) => (
                  <VolunteerCard key={volunteer.id} volunteer={volunteer} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-10">
              <EmptyState
                icon={Search}
                title={t.volunteers.emptyTitle}
                description={t.volunteers.emptyText}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
