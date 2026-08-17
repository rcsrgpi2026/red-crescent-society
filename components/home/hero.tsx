"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Droplets, ArrowRight, PhoneCall, HeartPulse, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

interface HeroProps {
  heroTitle: string;
  heroSubtitle: string;
  /** Real photos from activities/albums, crossfaded as the hero backdrop. */
  backgroundImages?: string[];
  /** Latest urgent/emergency blood request, shown as a live need strip. */
  liveRequest?: {
    id: string;
    blood_group: string;
    hospital: string | null;
    location: string | null;
  } | null;
  bloodHelpline?: string | null;
  /** College / institute name from Admin → Settings (hero badge). */
  collegeName?: string;
}

const SLIDE_INTERVAL_MS = 6500;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.21, 0.47, 0.32, 0.98] as const },
  }),
};

export function Hero({
  heroTitle,
  heroSubtitle,
  backgroundImages,
  liveRequest,
  bloodHelpline,
  collegeName,
}: HeroProps) {
  const reduced = useReducedMotion();
  const anim = reduced ? {} : { initial: "hidden", animate: "show" } as const;
  const { t } = useLocale();

  const images = (backgroundImages ?? []).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [hasTransitioned, setHasTransitioned] = useState(false);
  const activeIndex = images.length > 0 ? index % images.length : 0;

  // Crossfade through the photos. Paused for prefers-reduced-motion.
  useEffect(() => {
    if (reduced || images.length < 2) return;
    const id = setInterval(() => {
      setHasTransitioned(true);
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduced, images.length]);

  const needLabel = liveRequest
    ? liveRequest.hospital
      ? t.home.bloodNeededAt.replace("{group}", liveRequest.blood_group).replace("{hospital}", liveRequest.hospital)
      : t.home.bloodNeeded.replace("{group}", liveRequest.blood_group)
    : null;

  return (
    <section className="relative overflow-hidden border-b border-line bg-brand-dark">
      {/* Rotating background photos */}
      {images.length > 0 && (
        <div className="absolute inset-0" aria-hidden={images.length > 1}>
          {images.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt={images.length > 1 ? t.home.heroPhotoAltN.replace("{n}", String(i + 1)) : t.home.heroPhotoAlt}
              fill
              // Only the first backdrop is LCP-critical — fetching all hero
              // photos at high priority on first paint wastes mobile bandwidth.
              priority={i === 0}
              quality={75}
              sizes="100vw"
              className={cn(
                "object-cover",
                hasTransitioned && "transition-opacity duration-1000 ease-in-out",
                i === activeIndex ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            />
          ))}
          <div
            className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/85 to-brand-dark/40"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-brand-dark/60"
            aria-hidden
          />

          {/* Slide indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => {
                    setHasTransitioned(true);
                    setIndex(i);
                  }}
                  aria-label={t.home.heroSlideIndicator
                    .replace("{n}", String(i + 1))
                    .replace("{total}", String(images.length))}
                  aria-current={i === activeIndex ? "true" : undefined}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === activeIndex
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="container-site relative grid items-end gap-10 py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
        {/* Copy */}
        <div>
          <motion.div {...anim} custom={0} variants={fadeUp} className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              {collegeName ?? t.home.heroBadgeInstitute}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              <HeartPulse className="h-3.5 w-3.5 text-crescent" aria-hidden />
              {t.home.heroBadgeUnit}
            </span>
          </motion.div>

          <motion.h1
            {...anim}
            custom={1}
            variants={fadeUp}
            className="mt-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {heroTitle.split(".").map((part, i, arr) => (
              <span key={i} className="block">
                <span className={i === 1 ? "text-crescent" : ""}>{part}</span>
                {i < arr.length - 1 && <span className="text-white/70">.</span>}
              </span>
            ))}
          </motion.h1>

          <motion.p
            {...anim}
            custom={2}
            variants={fadeUp}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg"
          >
            {heroSubtitle}
          </motion.p>

          <motion.div {...anim} custom={3} variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-crescent hover:bg-crescent-dark">
              <Link href="/blood-support/request">
                <Droplets className="mr-1.5 h-4 w-4" aria-hidden />
                {t.home.requestBlood}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/blood-support#donor-registration">
                {t.home.becomeDonor}
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </motion.div>

          <motion.div {...anim} custom={4} variants={fadeUp} className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { icon: Droplets, label: t.home.heroFeatureBlood, sub: t.home.heroFeatureBloodSub },
              { icon: HeartPulse, label: t.home.heroFeatureFirstAid, sub: t.home.heroFeatureFirstAidSub },
              { icon: GraduationCap, label: t.home.heroFeatureDisaster, sub: t.home.heroFeatureDisasterSub },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <item.icon className="h-4.5 w-4.5 text-white" aria-hidden />
                </span>
                <span className="text-sm leading-tight text-white/90">
                  <span className="block font-semibold">{item.label}</span>
                  <span className="block text-xs text-white/60">{item.sub}</span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Live need + helpline */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="space-y-4"
        >
          {liveRequest && (
            <Link
              href={`/blood-support/request/${liveRequest.id}`}
              className="group block overflow-hidden rounded-2xl border border-crescent/50 bg-crescent shadow-2xl shadow-crescent/30 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crescent"
            >
              <div className="flex items-center justify-between gap-2 bg-crescent-dark/80 px-4 py-2">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  {t.home.liveNeed}
                </p>
                <HeartPulse className="h-3.5 w-3.5 text-white/80" aria-hidden />
              </div>
              <div className="bg-white px-4 py-3.5">
                <p className="text-lg font-bold text-foreground">{needLabel}</p>
                {liveRequest.location && (
                  <p className="text-xs text-muted-foreground">{liveRequest.location}</p>
                )}
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-crescent">
                  {t.home.liveNeedCta}
                  <ArrowRight
                    className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </p>
              </div>
            </Link>
          )}

          {bloodHelpline && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <PhoneCall className="h-5 w-5 text-white" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/60">
                  {t.emergency.bloodHelpline}
                </p>
                <a href={`tel:${bloodHelpline}`} className="block truncate text-xl font-bold text-white">
                  {bloodHelpline}
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
