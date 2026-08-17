"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Profile photo with a graceful fallback. Renders the image when `src` is set
 * and loads; otherwise (no photo, or a dead/broken URL — e.g. the object was
 * removed from storage) renders `fallback` instead of a broken image icon.
 * The parent must provide a sized, `position: relative` container since the
 * image uses `fill`.
 */
export function ProfilePhoto({
  src,
  alt,
  sizes,
  fallback,
  imageClassName,
}: {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  fallback: React.ReactNode;
  imageClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <>{fallback}</>;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      onError={() => setFailed(true)}
      className={imageClassName}
    />
  );
}
