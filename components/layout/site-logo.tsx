import Image from "next/image";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  variant?: "society" | "institute";
  className?: string;
  priority?: boolean;
}

/**
 * Renders one of the two official logos. Logos are never resized beyond their
 * natural proportions (aspect ratio is preserved via width/height + h-auto).
 * Replace the placeholder files in /public/logos with the official logos.
 */
export function SiteLogo({ variant = "society", className, priority }: SiteLogoProps) {
  const isSociety = variant === "society";
  return (
    <Image
      src={isSociety ? "/logos/rcr-logo.svg" : "/logos/rpi-logo.svg"}
      alt={isSociety ? "Rajshahi Polytechnic Institute Red Crescent Society logo" : "Rajshahi Polytechnic Institute logo"}
      width={64}
      height={64}
      priority={priority}
      className={cn("h-auto w-12 shrink-0", className)}
    />
  );
}
