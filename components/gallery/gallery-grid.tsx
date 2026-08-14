"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import type { GalleryImage } from "@/types/database";
import { cn } from "@/lib/utils";

export function GalleryGrid({ images, albumTitle }: { images: GalleryImage[]; albumTitle: string }) {
  const [active, setActive] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-mist/50 px-6 py-16 text-center">
        <Images className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="mt-3 text-sm font-medium text-foreground">No photos in this album yet</p>
      </div>
    );
  }

  const close = () => setActive(null);
  const prev = () => setActive((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  const next = () => setActive((i) => (i === null ? null : (i + 1) % images.length));

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image, i) => (
          <button
            key={image.id}
            onClick={() => setActive(i)}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-2xl border border-line bg-mist transition-all hover:border-brand/50",
              i === 0 && "col-span-2 row-span-2 aspect-square sm:aspect-[4/3]"
            )}
            aria-label={`Open photo ${i + 1}: ${image.caption ?? `Photo from ${albumTitle}`}`}
          >
            <Image
              src={image.url}
              alt={image.caption ?? `Photo from ${albumTitle}`}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={close}
        >
          <div className="flex items-center justify-between p-4 text-white">
            <p className="text-sm font-medium">
              {active + 1} / {images.length}
              {images[active].caption && (
                <span className="ml-3 text-white/60">{images[active].caption}</span>
              )}
            </p>
            <button onClick={close} className="rounded-full p-2 hover:bg-white/10" aria-label="Close viewer">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={prev}
              className="absolute left-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </button>
            <div className="relative h-full max-h-full w-full max-w-5xl">
              <Image
                src={images[active].url}
                alt={images[active].caption ?? `Photo from ${albumTitle}`}
                fill
                sizes="(max-width: 1024px) 100vw, 80vw"
                className="object-contain"
              />
            </div>
            <button
              onClick={next}
              className="absolute right-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
