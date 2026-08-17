"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLogos } from "@/components/providers/logo-provider";

interface SiteLogoProps {
  variant?: "society" | "institute";
  className?: string;
  priority?: boolean;
}

/**
 * Renders one of the two official logos. Uses the logo uploaded from the
 * admin (Settings → Logos) when available, otherwise the placeholder files
 * in /public/logos. Logos are never resized beyond their natural
 * proportions (aspect ratio is preserved via width/height + h-auto).
 */
export function SiteLogo({ variant = "society", className, priority }: SiteLogoProps) {
  const logos = useLogos();
  const isSociety = variant === "society";
  const custom = isSociety ? logos.rcs : logos.rpi;
  const src = custom ?? (isSociety ? "/logos/rcr-logo.svg" : "/logos/rpi-logo.svg");

  return (
    <Image
      src={src}
      alt={isSociety ? "Red Crescent Youth — Rajshahi Govt. Polytechnic Institute logo" : "Rajshahi Govt. Polytechnic Institute logo"}
      width={64}
      height={64}
      priority={priority}
      className={cn("h-auto w-12 shrink-0", className)}
    />
  );
}
