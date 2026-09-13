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
  Target,
  Eye,
  HeartPulse,
  History,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n";
import {
  VectorMission,
  VectorVision,
  VectorActions,
  VectorHeritage,
} from "./principle-vectors";

interface AboutCardItem {
  id: string;
  num: string;
  tag: string;
  title: string;
  body?: string;
  bullets?: string[];
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  vector: React.ComponentType<{ className?: string }>;
  iconBg: string;
  badge: string;
  glow: string;
  orb: string;
  accent: string;
  shadow: string;
}

export function AboutCardsStack({ t }: { t: Messages }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const cards: AboutCardItem[] = [
    {
      id: "mission",
      num: "01",
      tag: "Purpose",
      title: t.about.missionTitle,
      body: t.about.missionText,
      icon: Target,
      vector: VectorMission,
      iconBg: "bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-red-500/30",
      badge: "bg-red-50 text-red-700 border-red-200/80 ring-red-500/20",
      glow: "from-red-500/18 via-rose-500/8 to-transparent",
      orb: "bg-red-500/20",
      accent: "from-red-600 via-rose-600 to-red-400",
      shadow: "shadow-red-500/15",
    },
    {
      id: "vision",
      num: "02",
      tag: "Outlook",
      title: t.about.visionTitle,
      body: t.about.visionText,
      icon: Eye,
      vector: VectorVision,
      iconBg: "bg-gradient-to-br from-poly to-blue-700 text-white shadow-blue-500/30",
      badge: "bg-poly-soft text-poly border-poly/30 ring-poly/20",
      glow: "from-poly/18 via-blue-500/8 to-transparent",
      orb: "bg-poly/20",
      accent: "from-poly via-blue-600 to-cyan-400",
      shadow: "shadow-poly/15",
    },
    {
      id: "volunteers",
      num: "03",
      tag: "Actions",
      title: t.about.whatVolunteersDoTitle,
      bullets: t.about.whatVolunteersDo,
      icon: HeartPulse,
      vector: VectorActions,
      iconBg: "bg-gradient-to-br from-crescent to-teal-700 text-white shadow-teal-500/30",
      badge: "bg-crescent-soft text-crescent border-crescent/30 ring-crescent/20",
      glow: "from-crescent/18 via-teal-500/8 to-transparent",
      orb: "bg-crescent/20",
      accent: "from-crescent via-teal-600 to-emerald-400",
      shadow: "shadow-crescent/15",
    },
    {
      id: "history",
      num: "04",
      tag: "Heritage",
      title: t.about.historyTitle,
      body: t.about.historyText,
      icon: History,
      vector: VectorHeritage,
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/30",
      badge: "bg-amber-50 text-amber-800 border-amber-200/80 ring-amber-500/20",
      glow: "from-amber-500/18 via-orange-500/8 to-transparent",
      orb: "bg-amber-500/20",
      accent: "from-amber-500 via-orange-500 to-yellow-400",
      shadow: "shadow-amber-500/15",
    },
  ];

  const total = cards.length;

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

  const currentCard = cards[currentIndex];
  const nextCard = cards[(currentIndex + 1) % total];
  const nextNextCard = cards[(currentIndex + 2) % total];

  return (
    <div className="relative w-full select-none py-2">
      {/* Ambient Spotlight */}
      <div
        className={cn(
          "pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 h-64 w-80 rounded-full blur-3xl opacity-60 transition-colors duration-500",
          currentCard.orb
        )}
      />

      {/* Larger Swipe Deck Container */}
      <div className="relative mx-auto h-[445px] w-full max-w-[365px] px-2 py-4">
        {/* Background Card 2 (Bottom-most in stack) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-6 top-6 flex h-[385px] flex-col justify-between rounded-2xl border border-emerald-500/20 bg-white/75 backdrop-blur-md p-6 shadow-xs transition-all duration-300 pointer-events-none"
          style={{
            transform: "translateY(18px) scale(0.90)",
            zIndex: 1,
            opacity: 0.45,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-mist text-muted-foreground/40">
              <nextNextCard.icon className="h-5 w-5" />
            </span>
            <span className="font-mono text-xs font-bold text-muted-foreground/40">
              {nextNextCard.num}
            </span>
          </div>
          <div className="space-y-2 opacity-30">
            <div className="h-5 w-32 rounded-full bg-foreground/30" />
            <div className="h-3.5 w-full rounded-full bg-foreground/20" />
            <div className="h-3.5 w-4/5 rounded-full bg-foreground/20" />
          </div>
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Background Card 1 (Middle in stack) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-4 top-6 flex h-[385px] flex-col justify-between rounded-2xl border border-emerald-500/30 bg-white/90 backdrop-blur-md p-6 shadow-md transition-all duration-300 pointer-events-none"
          style={{
            transform: "translateY(9px) scale(0.95)",
            zIndex: 2,
            opacity: 0.85,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs",
                nextCard.iconBg
              )}
            >
              <nextCard.icon className="h-5 w-5" />
            </span>
            <span className="font-mono text-xs font-bold text-muted-foreground/70">
              {nextCard.tag} · {nextCard.num} / 04
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-foreground/80">{nextCard.title}</p>
            <p className="line-clamp-4 text-xs text-muted-foreground/70 leading-relaxed">
              {nextCard.body ?? nextCard.bullets?.slice(0, 4).join(", ")}
            </p>
          </div>
          <div className={cn("h-1.5 w-14 rounded-full bg-gradient-to-r", nextCard.accent)} />
        </div>

        {/* Interactive Top Card (Swipeable with Embedded Controls & Vector Graphic) */}
        <AnimatePresence mode="popLayout" custom={direction}>
          <SwipeableAboutCard
            key={currentCard.id}
            card={currentCard}
            index={currentIndex}
            total={total}
            cards={cards}
            direction={direction}
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

interface SwipeableAboutCardProps {
  card: AboutCardItem;
  index: number;
  total: number;
  cards: AboutCardItem[];
  direction: 1 | -1;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDotClick: (idx: number) => void;
}

function SwipeableAboutCard({
  card,
  index,
  total,
  cards,
  direction,
  onSwipeLeft,
  onSwipeRight,
  onPrev,
  onNext,
  onDotClick,
}: SwipeableAboutCardProps) {
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

  const Icon = card.icon;
  const VectorIllustration = card.vector;

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
        x: direction * 320,
        opacity: 0,
        rotate: direction * 16,
        transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
      }}
      whileTap={{ cursor: "grabbing", scale: 0.99 }}
      className={cn(
        "absolute inset-x-2 top-6 flex h-[385px] cursor-grab flex-col justify-between overflow-hidden rounded-2xl border border-emerald-500/35 ring-1 ring-emerald-500/15 bg-white/95 backdrop-blur-xl p-6 shadow-xl transition-shadow active:shadow-2xl",
        card.shadow
      )}
    >
      {/* Top Glass Sheen Line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />

      {/* Themed Ambient Glow in Corner */}
      <div
        className={cn(
          "pointer-events-none absolute -top-14 -right-14 h-48 w-48 rounded-full bg-gradient-to-br blur-2xl",
          card.glow
        )}
      />

      {/* Atmospheric Watermark Vector in Background */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-44 w-44 select-none opacity-[0.06]">
        <VectorIllustration />
      </div>

      {/* Dragging Action Visual Pills */}
      <motion.div
        style={{ opacity: nextBadgeOpacity }}
        className="pointer-events-none absolute top-5 right-5 z-20 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider backdrop-blur-xs shadow-xs"
      >
        Next →
      </motion.div>
      <motion.div
        style={{ opacity: prevBadgeOpacity }}
        className="pointer-events-none absolute top-5 left-5 z-20 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider backdrop-blur-xs shadow-xs"
      >
        ← Next
      </motion.div>

      {/* Header with Icon, Tag & Counter */}
      <div className="relative z-10 flex items-center justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ring-2 ring-white",
            card.iconBg
          )}
        >
          <Icon className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <span
          className={cn(
            "font-jakarta inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold tracking-wider uppercase shadow-2xs",
            card.badge
          )}
        >
          {card.tag} · {card.num}
        </span>
      </div>

      {/* Content Area with Vector Illustration for Clarity */}
      <div className="relative z-10 grid grid-cols-[1fr_84px] items-center gap-3 my-auto overflow-hidden">
        <div className="space-y-1.5">
          <h3 className="font-jakarta text-xl font-bold tracking-tight text-foreground">
            {card.title}
          </h3>
          {card.bullets ? (
            <ul className="font-inter space-y-1 text-xs leading-relaxed text-muted-foreground pt-0.5">
              {card.bullets.slice(0, 4).map((bullet) => (
                <li key={bullet} className="flex items-start gap-1.5">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-crescent" />
                  <span className="line-clamp-1">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-inter text-xs leading-relaxed text-muted-foreground line-clamp-4">
              {card.body}
            </p>
          )}
        </div>

        {/* Conceptual Vector Graphic Illustration Container */}
        <div className="flex h-21 w-21 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-gradient-to-b from-white/90 to-mist/40 p-2 shadow-sm backdrop-blur-xs ring-1 ring-black/5">
          <VectorIllustration />
        </div>
      </div>

      {/* Bottom Bar: Embedded Navigation Controls Inside the Card */}
      <div className="relative z-20 flex items-center justify-between border-t border-line/60 pt-3">
        {/* Previous Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous card"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line/80 bg-white/95 text-foreground shadow-xs hover:border-brand/50 hover:bg-brand-soft hover:text-brand transition-all active:scale-90"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Center Indicator: Tag, Number & Dots */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-[11px] font-bold text-muted-foreground/80">
            {card.tag} · {card.num} <span className="text-muted-foreground/40">/</span> 04
          </span>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="About pagination">
            {cards.map((c, idx) => {
              const isActive = idx === index;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Card ${idx + 1}: ${c.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDotClick(idx);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isActive
                      ? "w-5 bg-brand shadow-xs shadow-brand/30"
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
          aria-label="Next card"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line/80 bg-white/95 text-foreground shadow-xs hover:border-brand/50 hover:bg-brand-soft hover:text-brand transition-all active:scale-90"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
