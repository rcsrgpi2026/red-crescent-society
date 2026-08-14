import Link from "next/link";
import Image from "next/image";
import { Images } from "lucide-react";
import type { GalleryAlbum } from "@/types/database";
import { formatDate } from "@/lib/constants";

export function AlbumCard({
  album,
  imageCount,
}: {
  album: GalleryAlbum;
  imageCount?: number;
}) {
  return (
    <Link
      href={`/gallery/${album.slug}`}
      className="group relative flex aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-mist transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {album.cover_image ? (
        <Image
          src={album.cover_image}
          alt={album.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-poly-soft to-brand-soft">
          <Images className="h-10 w-10 text-brand/50" aria-hidden />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="font-semibold drop-shadow">{album.title}</h3>
        <p className="mt-0.5 flex items-center gap-3 text-xs text-white/85">
          {album.date && <span>{formatDate(album.date)}</span>}
          {typeof imageCount === "number" && (
            <span className="flex items-center gap-1">
              <Images className="h-3.5 w-3.5" aria-hidden />
              {imageCount} photo{imageCount === 1 ? "" : "s"}
            </span>
          )}
        </p>
      </div>
    </Link>
  );
}
