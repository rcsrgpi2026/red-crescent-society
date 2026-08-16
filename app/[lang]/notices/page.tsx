import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { NoticeFeatureCard } from "@/components/cards/notice-feature-card";
import { NoticeListRow } from "@/components/cards/notice-list-row";
import { getPublicNotices } from "@/lib/queries";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.notices.title,
    description: t.meta.notices.description,
  };
}

export default async function NoticesPage() {
  const [t, locale, notices] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getPublicNotices(),
  ]);

  // Bulletin board: pinned notices become large feature cards on top, the
  // rest run as a clean list below.
  const pinned = notices.filter((notice) => notice.pinned);
  const regular = notices.filter((notice) => !notice.pinned);

  return (
    <>
      <PageHero
        eyebrow={t.notices.heroEyebrow}
        title={t.notices.heroTitle}
        description={t.notices.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          {notices.length > 0 ? (
            <>
              {pinned.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {pinned.map((notice) => (
                    <NoticeFeatureCard
                      key={notice.id}
                      notice={notice}
                      locale={locale}
                      pinnedLabel={t.notices.pinnedNotice}
                      readLabel={t.notices.readNotice}
                    />
                  ))}
                </div>
              )}
              {regular.length > 0 && (
                <div className={cn("space-y-3", pinned.length > 0 && "mt-6")}>
                  {regular.map((notice) => (
                    <NoticeListRow key={notice.id} notice={notice} locale={locale} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={Megaphone}
              title={t.notices.emptyTitle}
              description={t.notices.emptyText}
            />
          )}
        </div>
      </section>
    </>
  );
}
