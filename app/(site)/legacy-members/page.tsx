import type { Metadata } from "next";
import Link from "next/link";
import { Award, GraduationCap, HeartHandshake, Search, Users, Landmark } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { LegacyMemberCard } from "@/components/cards/legacy-member-card";
import { ActiveCommitteeCard } from "@/components/cards/active-committee-card";
import { FounderMemberCard } from "@/components/cards/founder-member-card";
import { LegacyFilters } from "@/components/legacy/legacy-filters";
import { CommitteeTabs, type CommitteeTab } from "@/components/legacy/committee-tabs";
import {
  getLegacyMembers,
  getLegacySessions,
  getPublicActiveTeamMembers,
  getFounders,
} from "@/lib/queries";
import { DEPARTMENTS } from "@/lib/constants";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { format } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: `${t.meta.legacyMembers.title} | Committee Archives`,
    description: t.meta.legacyMembers.description,
  };
}

export default async function LegacyMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    department?: string;
    session?: string;
    tab?: string;
  }>;
}) {
  const [t, locale, params] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    searchParams,
  ]);

  const activeTab: CommitteeTab =
    params.tab === "active" ? "active" : params.tab === "founders" ? "founders" : "legacy";

  const [legacyMembers, activeMembers, founders, dynamicSessions] = await Promise.all([
    getLegacyMembers({
      search: params.search,
      department: params.department,
      session: params.session,
    }),
    getPublicActiveTeamMembers({
      search: params.search,
      department: params.department,
    }),
    getFounders(),
    getLegacySessions(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={t.legacyMembers.heroEyebrow}
        title="কার্যনির্বাহী পরিষদ ও লিগ্যাসি আর্কাইভ"
        description="রাজশাহী পলিটেকনিক ইনস্টিটিউট রেড ক্রিসেন্ট যুব ইউনিটের বর্তমান কার্যনির্বাহী পরিষদ, ৭ম সেমিস্টার সম্পন্নকারী সম্মানিত সাবেক নেতৃবৃন্দ এবং প্রতিষ্ঠাতা ও উপদেষ্টামণ্ডলী।"
      >
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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

      <section className="bg-white">
        <div className="container-site py-10 lg:py-16">
          {/* Main 3-way Committee Tabs */}
          <div className="mb-8">
            <CommitteeTabs
              activeTab={activeTab}
              counts={{
                legacy: legacyMembers.length,
                active: activeMembers.length,
                founders: founders.length,
              }}
            />
          </div>

          {/* TAB 1: LEGACY COMMITTEE ARCHIVES (DEFAULT) */}
          {activeTab === "legacy" && (
            <div>
              <LegacyFilters
                departments={DEPARTMENTS}
                sessions={dynamicSessions}
                current={{
                  search: params.search,
                  department: params.department,
                  session: params.session,
                }}
              />

              {legacyMembers.length > 0 ? (
                <>
                  <div className="mt-8 flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      {params.session ? (
                        <span className="font-semibold text-amber-900">
                          সেশন {params.session}-এর সাবেক নেতৃবৃন্দ:{" "}
                        </span>
                      ) : null}
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
          )}

          {/* TAB 2: ACTIVE EXECUTIVE COMMITTEE */}
          {activeTab === "active" && (
            <div>
              <div className="mb-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="mt-2 text-lg font-bold text-foreground">
                  বর্তমান কার্যনির্বাহী পরিষদ (Active Committee)
                </h2>
                <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">
                  বর্তমানে রাজশাহী পলিটেকনিক ইনস্টিটিউটে রেড ক্রিসেন্ট যুব ইউনিটের নিয়মিত মানবিক কার্যক্রম, রক্তদান ও টিম পরিচালনায় নিয়োজিত দায়িত্বপ্রাপ্ত সদস্যবৃন্দ।
                </p>
              </div>

              {activeMembers.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      মোট সক্রিয় সদস্য: {activeMembers.length.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} জন
                    </p>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {activeMembers.map((member) => (
                      <ActiveCommitteeCard key={member.id} member={member} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-12">
                  <EmptyState
                    icon={Users}
                    title="কোনো সক্রিয় সদস্য পাওয়া যায়নি"
                    description="বর্তমানে কোনো সক্রিয় কমিটির তথ্য সংরক্ষিত নেই।"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FOUNDERS & ADVISORY COUNCIL */}
          {activeTab === "founders" && (
            <div>
              <div className="mb-6 rounded-2xl border border-poly/20 bg-poly-soft/40 p-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-poly/10 text-poly">
                  <Landmark className="h-5 w-5" />
                </div>
                <h2 className="mt-2 text-lg font-bold text-foreground">
                  প্রতিষ্ঠাতা ও উপদেষ্টামণ্ডলী (Founders & Advisory Council)
                </h2>
                <p className="mx-auto mt-1 max-w-xl text-xs text-muted-foreground">
                  যাঁদের ঐকান্তিক প্রচেষ্টা ও নির্দেশনায় রাজশাহী পলিটেকনিক ইনস্টিটিউট রেড ক্রিসেন্ট যুব ইউনিটের ভিত্তি রচিত হয়েছিল।
                </p>
              </div>

              {founders.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {founders.map((founder) => (
                    <FounderMemberCard key={founder.id} founder={founder} />
                  ))}
                </div>
              ) : (
                <div className="mt-12">
                  <EmptyState
                    icon={Landmark}
                    title="প্রতিষ্ঠাতাদের তথ্য শীঘ্রই আপডেট করা হবে"
                    description="প্রতিষ্ঠাতা ও উপদেষ্টামণ্ডলীর তালিকা খুব শীঘ্রই যুক্ত করা হবে।"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
