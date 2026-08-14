import type { Metadata } from "next";
import { HandHeart } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityCard } from "@/components/cards/activity-card";
import { getPublicActivities } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.activities.title,
    description: t.meta.activities.description,
  };
}

export default async function ActivitiesPage() {
  const [t, activities] = await Promise.all([getServerMessages(), getPublicActivities()]);

  return (
    <>
      <PageHero
        eyebrow={t.activities.heroEyebrow}
        title={t.activities.heroTitle}
        description={t.activities.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          {activities.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={HandHeart}
              title={t.activities.emptyTitle}
              description={t.activities.emptyText}
            />
          )}
        </div>
      </section>
    </>
  );
}
