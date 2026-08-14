import type { Metadata } from "next";
import Image from "next/image";
import { Users, UserRound } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { FitText } from "@/components/shared/fit-text";
import { getCommunityMembers } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import type { CommunityMember } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.community.title,
    description: t.meta.community.description,
  };
}

export default async function CommunityPage() {
  const [t, members] = await Promise.all([
    getServerMessages(),
    getCommunityMembers(),
  ]);

  // Group into the five rows of the tree (levels 1-5), preserving display order.
  const levels: CommunityMember[][] = [];
  for (let level = 1; level <= 5; level++) {
    levels.push(members.filter((m) => m.level === level));
  }

  return (
    <>
      <PageHero
        eyebrow={t.community.heroEyebrow}
        title={t.community.heroTitle}
        description={t.community.heroDescription}
      />

      {/* Leadership tree */}
      <section className="border-b border-line bg-white">
        <div className="container-site py-16 lg:py-24">
          {members.length > 0 ? (
            <div className="flex flex-col items-center">
              {levels.map((row, i) => {
                if (row.length === 0) return null;
                const levelNumber = i + 1;
                const label =
                  t.community.levelLabels[levelNumber as keyof typeof t.community.levelLabels];
                return (
                  <Reveal key={levelNumber} className="w-full">
                    <div className="flex flex-col items-center">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                        {label}
                      </p>
                      <div
                        className={cn(
                          "flex flex-wrap items-start justify-center gap-4 sm:gap-6",
                          row.length === 1 && "mx-auto max-w-sm"
                        )}
                      >
                        {row.map((member) => (
                          <MemberCard key={member.id} member={member} />
                        ))}
                      </div>
                      {/* Connector to the next row */}
                      {levels.slice(levelNumber).some((r) => r.length > 0) && (
                        <div className="my-6 h-10 w-px bg-line" aria-hidden />
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title={t.community.emptyTitle}
              description={t.community.emptyText}
            />
          )}
        </div>
      </section>
    </>
  );
}

function MemberCard({ member }: { member: CommunityMember }) {
  return (
    /*
     * All cards share the exact same width & height — long text shrinks to fit.
     * Sizes scale up per breakpoint while keeping the row structure intact:
     * 2 cards per row on phones, 6 per row on desktop.
     */
    <div className="flex h-[14rem] w-38 flex-col items-center rounded-2xl border border-line bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-md sm:h-[15rem] sm:w-44 xl:h-[16rem]">
      <div className="relative h-22 w-22 shrink-0 overflow-hidden rounded-full bg-mist ring-2 ring-brand/40 sm:h-24 sm:w-24 xl:h-28 xl:w-28">
        {member.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.name}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          /* Facebook-style default head for members without a photo */
          <span className="flex h-full w-full items-center justify-center text-muted-foreground/60">
            <UserRound className="h-12 w-12" strokeWidth={1.5} aria-hidden />
          </span>
        )}
      </div>
      {/* No name line when the member has no name yet */}
      {member.name && (
        <FitText
          text={member.name}
          maxLines={2}
          className="mt-3 w-full text-sm font-bold text-foreground xl:text-[15px]"
        />
      )}
      {member.position && (
        <FitText
          text={member.position}
          maxLines={1}
          minSize={8}
          className="mt-1 w-full text-[11px] font-semibold uppercase tracking-wide text-brand xl:text-xs"
        />
      )}
      {member.sub_role && (
        <FitText
          text={member.sub_role}
          maxLines={2}
          minSize={8}
          className="mt-1 w-full text-[10px] text-muted-foreground xl:text-[11px]"
        />
      )}
    </div>
  );
}
