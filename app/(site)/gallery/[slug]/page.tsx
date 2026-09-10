import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAlbumBySlug, getAlbumImages } from "@/lib/queries";
import { formatDate } from "@/lib/constants";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { getServerLocale, getServerMessages } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [t, album] = await Promise.all([getServerMessages(), getAlbumBySlug(slug)]);
  if (!album) return { title: t.common.albumNotFound };
  return {
    title: album.title,
    description: album.description ?? `Photo album — ${album.title}`,
  };
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [t, locale, album] = await Promise.all([
    getServerMessages(),
    getServerLocale(),
    getAlbumBySlug(slug),
  ]);
  if (!album) notFound();

  const images = await getAlbumImages(album.id);

  return (
    <section className="border-b border-line bg-white">
      <div className="container-site py-10 lg:py-14">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.gallery.allAlbums}
        </Link>
        <div className="mt-6 max-w-2xl">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {album.title}
          </h1>
          {album.date && <p className="mt-2 text-sm text-muted-foreground">{formatDate(album.date, locale === "bn" ? "bn-BD" : "en-GB")}</p>}
          {album.description && (
            <p className="mt-3 leading-relaxed text-muted-foreground">{album.description}</p>
          )}
        </div>
        <div className="mt-8">
          <GalleryGrid images={images} albumTitle={album.title} />
        </div>
      </div>
    </section>
  );
}
