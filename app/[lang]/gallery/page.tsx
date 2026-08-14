import type { Metadata } from "next";
import { Images } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { AlbumCard } from "@/components/cards/album-card";
import { getAllAlbums } from "@/lib/queries";
import { getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerMessages();
  return {
    title: t.meta.gallery.title,
    description: t.meta.gallery.description,
  };
}

export default async function GalleryPage() {
  const [t, albums] = await Promise.all([getServerMessages(), getAllAlbums()]);

  return (
    <>
      <PageHero
        eyebrow={t.gallery.heroEyebrow}
        title={t.gallery.heroTitle}
        description={t.gallery.heroDescription}
      />
      <section className="bg-white">
        <div className="container-site py-12 lg:py-16">
          {albums.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Images}
              title={t.gallery.emptyTitle}
              description={t.gallery.emptyText}
            />
          )}
        </div>
      </section>
    </>
  );
}
