"use client";

import { useRef, useState, useEffect } from "react";
import {
  Target,
  Eye,
  HeartPulse,
  History,
  ChevronLeft,
  ChevronRight,
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
  accent: string;
}

export function AboutCardsStack({ t }: { t: Messages }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cards: AboutCardItem[] = [
    {
      id: "mission",
      num: "01",
      tag: "Purpose",
      title: t.about.missionTitle,
      body: t.about.missionText,
      icon: Target,
      vector: VectorMission,
      iconBg: "bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xs",
      badge: "bg-red-50 text-red-700 border-red-200/80",
      accent: "from-red-600 via-rose-600 to-red-400",
    },
    {
      id: "vision",
      num: "02",
      tag: "Outlook",
      title: t.about.visionTitle,
      body: t.about.visionText,
      icon: Eye,
      vector: VectorVision,
      iconBg: "bg-gradient-to-br from-poly to-blue-700 text-white shadow-xs",
      badge: "bg-poly-soft text-poly border-poly/30",
      accent: "from-poly via-blue-600 to-cyan-400",
    },
    {
      id: "volunteers",
      num: "03",
      tag: "Actions",
      title: t.about.whatVolunteersDoTitle,
      bullets: t.about.whatVolunteersDo,
      icon: HeartPulse,
      vector: VectorActions,
      iconBg: "bg-gradient-to-br from-crescent to-teal-700 text-white shadow-xs",
      badge: "bg-crescent-soft text-crescent border-crescent/30",
      accent: "from-crescent via-teal-600 to-emerald-400",
    },
    {
      id: "history",
      num: "04",
      tag: "Heritage",
      title: t.about.historyTitle,
      body: t.about.historyText,
      icon: History,
      vector: VectorHeritage,
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs",
      badge: "bg-amber-50 text-amber-800 border-amber-200/80",
      accent: "from-amber-500 via-orange-500 to-yellow-400",
    },
  ];

  // Passive scroll listener to update active index
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!el) return;
          const cardWidth = el.scrollWidth / cards.length;
          const idx = Math.round(el.scrollLeft / cardWidth);
          setActiveIndex(Math.max(0, Math.min(cards.length - 1, idx)));
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [cards.length]);

  function scrollToIndex(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    const children = el.children;
    if (children[idx]) {
      (children[idx] as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      setActiveIndex(idx);
    }
  }

  function handlePrev() {
    scrollToIndex(Math.max(0, activeIndex - 1));
  }

  function handleNext() {
    scrollToIndex(Math.min(cards.length - 1, activeIndex + 1));
  }

  return (
    <div className="relative w-full py-2">
      {/* Horizontal Hardware-Accelerated Snap Slider */}
      <div
        ref={scrollRef}
        className="flex w-full gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth px-4 py-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorX: "contain",
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          const VectorIllustration = card.vector;

          return (
            <div
              key={card.id}
              className="w-[86vw] max-w-[340px] shrink-0 snap-center flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs",
                    card.iconBg
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <span
                  className={cn(
                    "font-jakarta inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                    card.badge
                  )}
                >
                  {card.tag} · {card.num}
                </span>
              </div>

              {/* Body Content */}
              <div className="my-3.5 grid grid-cols-[1fr_75px] items-center gap-3">
                <div className="space-y-1.5">
                  <h3 className="font-jakarta text-base font-bold tracking-tight text-foreground">
                    {card.title}
                  </h3>
                  {card.bullets ? (
                    <ul className="font-inter space-y-1 text-xs leading-relaxed text-muted-foreground">
                      {card.bullets.slice(0, 3).map((bullet) => (
                        <li key={bullet} className="flex items-start gap-1.5">
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-crescent" />
                          <span className="line-clamp-1">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-inter text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {card.body}
                    </p>
                  )}
                </div>
                <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl border border-line/60 bg-mist/60 p-1.5">
                  <VectorIllustration />
                </div>
              </div>

              {/* Footer line */}
              <div className="flex items-center justify-between border-t border-line/60 pt-3">
                <div className={cn("h-1.5 w-12 rounded-full bg-gradient-to-r", card.accent)} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  RGPI Unit
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination & Arrow Controls */}
      <div className="mt-3 flex items-center justify-between px-5">
        <div className="flex items-center gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-6 bg-brand" : "w-1.5 bg-line hover:bg-muted-foreground/40"
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-line hover:bg-mist"
            onClick={handlePrev}
            disabled={activeIndex === 0}
            aria-label="Previous card"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-line hover:bg-mist"
            onClick={handleNext}
            disabled={activeIndex === cards.length - 1}
            aria-label="Next card"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
