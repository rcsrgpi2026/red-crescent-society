import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamMemberCard } from "@/components/cards/team-member-card";
import { TeamMemberFilters } from "@/components/team/team-filters";
import { adminGetTeamMembers } from "@/lib/queries";
import { DEPARTMENTS, SEMESTERS, TEAM_POSITIONS } from "@/lib/constants";
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
  // Admin-only page (middleware) — use the full member record so the ID-style
  // cards can show roll, registration number, session and department.
  const volunteers = await adminGetTeamMembers({
    status: "APPROVED",
    publicProfile: true,
    search: params.search,
    department: params.department,
    semester: params.semester,
  });

  // Order the ID cards by leadership rank (Team Leader first … General Member),
  // keeping any legacy/unknown positions at the end. Stable sort preserves the
  // created-at order within the same position.
  const positionOrder = new Map<string, number>(TEAM_POSITIONS.map((p, i) => [p, i]));
  volunteers.sort(
    (a, b) =>
      (positionOrder.get(a.position) ?? TEAM_POSITIONS.length) -
      (positionOrder.get(b.position) ?? TEAM_POSITIONS.length)
  );

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
          <TeamMemberFilters
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
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
                {volunteers.map((volunteer) => (
                  <TeamMemberCard key={volunteer.id} teamMember={volunteer} />
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
