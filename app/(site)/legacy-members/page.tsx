import type { Metadata } from "next";
import Link from "next/link";
import { Award, GraduationCap, HeartHandshake, Search } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { LegacyMemberCard } from "@/components/cards/legacy-member-card";
import { LegacyFilters } from "@/components/legacy/legacy-filters";
import { getLegacyMembers } from "@/lib/queries";
import { DEPARTMENTS, SESSIONS } from "@/lib/constants";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.legacyMembers.title,
    description: t.meta.legacyMembers.description,
  };
}

export default async function LegacyMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; department?: string; session?: string }>;
}) {
  const [t, locale, params] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    searchParams,
  ]);

  const legacyMembers = await getLegacyMembers({
    search: params.search,
    department: params.department,
    session: params.session,
  });

  return (
    <>
      <PageHero
        eyebrow={t.legacyMembers.heroEyebrow}
        title={t.legacyMembers.heroTitle}
        description={t.legacyMembers.heroDescription}
      >
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/90 px-4 py-2 text-xs font-bold text-amber-950 shadow-xs">
            <Award className="h-4 w-4 text-amber-700" />
            <span>Honoring 7th Semester & Outgoing Leaders</span>
          </div>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark"
          >
            <HeartHandshake className="h-4 w-4 text-white" />
            <span>Carry Forward the Mission</span>
          </Link>
        </div>
      </PageHero>

      <section className="bg-gradient-to-b from-amber-50/20 via-white to-white">
        <div className="container-site py-12 lg:py-16">
          <LegacyFilters
            departments={DEPARTMENTS}
            sessions={SESSIONS}
            current={{ ...params }}
          />

          {legacyMembers.length > 0 ? (
            <>
              <div className="mt-8 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {format(t.legacyMembers.showing, {
                    n: legacyMembers.length.toLocaleString(locale === "bn" ? "bn-BD" : "en-US"),
                    s: legacyMembers.length === 1 ? "" : "s",
                  })}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {legacyMembers.map((member) => (
                  <LegacyMemberCard key={member.id} member={member} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-12">
              <EmptyState
                icon={GraduationCap}
                title={t.legacyMembers.emptyTitle}
                description={t.legacyMembers.emptyText}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}
