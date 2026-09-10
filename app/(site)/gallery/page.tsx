import type { Metadata } from "next";
import { HandHeart, Images } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { ActivityGalleryCard } from "@/components/cards/activity-gallery-card";
import { AlbumCard } from "@/components/cards/album-card";
import { getPublicActivities, getAllAlbums } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.gallery.title,
    description: t.meta.gallery.description,
  };
}

export default async function GalleryOfActivitiesPage() {
  const [t, activities, albums] = await Promise.all([
    getServerMessages(),
    getPublicActivities(),
    getAllAlbums(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={t.gallery.heroEyebrow}
        title={t.gallery.heroTitle}
        description={t.gallery.heroDescription}
      />

      <section className="bg-white">
        <div className="container-site space-y-14 py-12 lg:py-16">
          {/* Photo Albums */}
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Images className="h-5 w-5 text-poly" aria-hidden />
              {t.gallery.albumsTitle}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.gallery.albumsText}</p>
            {albums.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={Images}
                  title={t.gallery.albumsEmptyTitle}
                  description={t.gallery.albumsEmptyText}
                />
              </div>
            )}
          </div>

          {/* Field Activities — photo gallery */}
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <HandHeart className="h-5 w-5 text-brand" aria-hidden />
              {t.gallery.fieldActivitiesTitle}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{t.gallery.fieldActivitiesText}</p>
            {activities.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {activities.map((activity) => (
                  <ActivityGalleryCard key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyState
                  icon={HandHeart}
                  title={t.gallery.emptyTitle}
                  description={t.gallery.emptyText}
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
