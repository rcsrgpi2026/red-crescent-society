import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { NoticeCard } from "@/components/cards/notice-card";
import { getPublicNotices } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.notices.title,
    description: t.meta.notices.description,
  };
}

export default async function NoticesPage() {
  const [t, notices] = await Promise.all([getServerMessages(), getPublicNotices()]);

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
            <div className="grid gap-4 lg:grid-cols-2">
              {notices.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
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
