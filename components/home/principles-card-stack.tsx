"use client";

import { useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  PanInfo,
} from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRINCIPLES_CONFIG } from "./principles-config";

interface PrinciplesCardStackProps {
  principles: string[][] | [string, string][];
}

export function PrinciplesCardStack({ principles }: PrinciplesCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const total = principles.length;

  function handleNext() {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % total);
  }

  function handlePrev() {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }

  function handleDotClick(idx: number) {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  }

  const currentCard = principles[currentIndex];
  const nextCard = principles[(currentIndex + 1) % total];
  const nextNextCard = principles[(currentIndex + 2) % total];

  const currentCfg = PRINCIPLES_CONFIG[currentIndex % PRINCIPLES_CONFIG.length];
  const nextCfg = PRINCIPLES_CONFIG[(currentIndex + 1) % PRINCIPLES_CONFIG.length];
  const nextNextCfg = PRINCIPLES_CONFIG[(currentIndex + 2) % PRINCIPLES_CONFIG.length];

  return (
    <div className="relative w-full select-none py-2">
      {/* Ambient Radial Spotlight */}
      <div
        className={cn(
          "pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-64 w-80 rounded-full blur-3xl opacity-60 transition-colors duration-500",
          currentCfg.orb
        )}
      />

      {/* Swipe Deck Container - Compact for short principle text */}
      <div className="relative mx-auto h-[355px] w-full max-w-[350px] px-2 py-3">
        {/* Background Card 2 (Bottom-most in stack) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-5 top-6 flex h-[295px] flex-col justify-between rounded-2xl border border-emerald-500/20 bg-white/75 backdrop-blur-md p-5 shadow-xs transition-all duration-300 pointer-events-none"
          style={{
            transform: "translateY(14px) scale(0.90)",
            zIndex: 1,
            opacity: 0.45,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-mist text-muted-foreground/40">
              <nextNextCfg.icon className="h-4 w-4" />
            </span>
            <span className="font-mono text-xs font-bold text-muted-foreground/40">
              {nextNextCfg.num}
            </span>
          </div>
          <div className="space-y-1.5 opacity-30">
            <div className="h-4 w-24 rounded-full bg-foreground/30" />
            <div className="h-2.5 w-full rounded-full bg-foreground/20" />
          </div>
          <div className="h-1 w-8 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Background Card 1 (Middle in stack) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-3.5 top-6 flex h-[295px] flex-col justify-between rounded-2xl border border-emerald-500/30 bg-white/90 backdrop-blur-md p-5 shadow-md transition-all duration-300 pointer-events-none"
          style={{
            transform: "translateY(7px) scale(0.95)",
            zIndex: 2,
            opacity: 0.85,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-xl shadow-xs",
                nextCfg.iconBg
              )}
            >
              <nextCfg.icon className="h-4.5 w-4.5" />
            </span>
            <span className="font-mono text-xs font-bold text-muted-foreground/60">
              {nextCfg.num} / 07
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-foreground/80">{nextCard[0]}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground/70 leading-relaxed">
              {nextCard[1]}
            </p>
          </div>
          <div className={cn("h-1 w-10 rounded-full bg-gradient-to-r", nextCfg.accent)} />
        </div>

        {/* Interactive Top Card (Swipeable with Embedded Controls & Vector Graphic) */}
        <AnimatePresence mode="popLayout" custom={direction}>
          <SwipeableCard
            key={currentIndex}
            index={currentIndex}
            total={total}
            title={currentCard[0]}
            description={currentCard[1]}
            cfg={currentCfg}
            direction={direction}
            principles={principles}
            currentIndex={currentIndex}
            onSwipeLeft={handleNext}
            onSwipeRight={handleNext}
            onPrev={handlePrev}
            onNext={handleNext}
            onDotClick={handleDotClick}
          />
        </AnimatePresence>
      </div>
    </div>
  );
}

interface SwipeableCardProps {
  index: number;
  total: number;
  title: string;
  description: string;
  cfg: (typeof PRINCIPLES_CONFIG)[number];
  direction: 1 | -1;
  principles: [string, string][] | string[][];
  currentIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (idx: number) => void;
}

function SwipeableCard({
  total,
  title,
  description,
  cfg,
  direction,
  principles,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  onPrev,
  onNext,
  onDotClick,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-160, 160], [-14, 14]);
  const opacity = useTransform(x, [-200, -120, 0, 120, 200], [0.1, 1, 1, 1, 0.1]);

  // Dynamic drag badges
  const nextBadgeOpacity = useTransform(x, [18, 60], [0, 1]);
  const prevBadgeOpacity = useTransform(x, [-60, -18], [1, 0]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const swipeThreshold = 45;
    const velocityThreshold = 220;

    if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      onSwipeLeft();
    } else if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      onSwipeRight();
    }
  }

  const Icon = cfg.icon;
  const VectorIllustration = cfg.vector;

  return (
    <motion.div
      drag="x"
      dragDirectionLock
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      dragSnapToOrigin
      onDragEnd={handleDragEnd}
      style={{
        x,
        rotate,
        opacity,
        zIndex: 10,
        touchAction: "pan-y",
        willChange: "transform, opacity",
      }}
      initial={{
        scale: 0.94,
        opacity: 0,
        y: 8,
      }}
      animate={{
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 420, damping: 28, mass: 0.8 },
      }}
      exit={{
        x: direction * 300,
        opacity: 0,
        rotate: direction * 18,
        transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
      }}
      whileTap={{ cursor: "grabbing", scale: 0.99 }}
      className={cn(
        "absolute inset-x-2 top-6 flex h-[295px] cursor-grab flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/35 ring-1 ring-emerald-500/15 bg-white/95 backdrop-blur-xl p-5 shadow-xl transition-shadow active:shadow-2xl",
        cfg.shadow
      )}
    >
      {/* Top Glass Sheen Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Themed Ambient Glow in Corner */}
      <div
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br blur-2xl",
          cfg.glow
        )}
      />

      {/* Large Artistic Watermark Vector in Background */}
      <div className="pointer-events-none absolute -bottom-4 -right-3 h-32 w-32 select-none opacity-[0.07]">
        <VectorIllustration />
      </div>

      {/* Dragging Action Visual Pills */}
      <motion.div
        style={{ opacity: nextBadgeOpacity }}
        className="pointer-events-none absolute top-4 right-4 z-20 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider backdrop-blur-xs shadow-xs"
      >
        Next →
      </motion.div>
      <motion.div
        style={{ opacity: prevBadgeOpacity }}
        className="pointer-events-none absolute top-4 left-4 z-20 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wider backdrop-blur-xs shadow-xs"
      >
        ← Next
      </motion.div>

      {/* Header with Icon, Badge & Number */}
      <div className="relative z-10 flex items-center justify-between">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-2xl shadow-md ring-2 ring-white",
            cfg.iconBg
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <span
          className={cn(
            "font-jakarta inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold tracking-wider uppercase shadow-2xs",
            cfg.badge
          )}
        >
          Principle {cfg.num}
        </span>
      </div>

      {/* Content Area with Vector Illustration Side-by-Side */}
      <div className="relative z-10 grid grid-cols-[1fr_74px] items-center gap-3 my-auto">
        <div className="space-y-1">
          <h3 className="font-jakarta text-[19px] font-bold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="font-inter text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>

        {/* Crisp Conceptual Vector Graphic Illustration Container */}
        <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-b from-white/90 to-mist/40 p-1 shadow-sm backdrop-blur-xs ring-1 ring-black/5">
          <VectorIllustration />
        </div>
      </div>

      {/* Bottom Bar: Embedded Navigation Controls Inside the Card */}
      <div className="relative z-20 flex items-center justify-between border-t border-line/60 pt-2.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous principle"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line/80 bg-white/95 text-foreground shadow-xs hover:border-brand/50 hover:bg-brand-soft hover:text-brand transition-all active:scale-90"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        {/* Center Indicator: Number & Dots */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[10.5px] font-bold text-muted-foreground/80">
            {cfg.num} <span className="text-muted-foreground/40">/</span> 07
          </span>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Principles pagination">
            {principles.map(([pTitle], idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={pTitle}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Principle ${idx + 1}: ${pTitle}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDotClick(idx);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isActive
                      ? "w-4.5 bg-brand shadow-xs shadow-brand/30"
                      : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/45"
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next principle"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line/80 bg-white/95 text-foreground shadow-xs hover:border-brand/50 hover:bg-brand-soft hover:text-brand transition-all active:scale-90"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
