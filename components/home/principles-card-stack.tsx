"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PRINCIPLES_CONFIG } from "./principles-config";

interface PrinciplesCardStackProps {
  principles: string[][] | [string, string][];
}

export function PrinciplesCardStack({ principles }: PrinciplesCardStackProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Passive scroll listener to update active dot index
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!el) return;
          const cardWidth = el.scrollWidth / principles.length;
          const idx = Math.round(el.scrollLeft / cardWidth);
          setActiveIndex(Math.max(0, Math.min(principles.length - 1, idx)));
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [principles.length]);

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
    scrollToIndex(Math.min(principles.length - 1, activeIndex + 1));
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
        {principles.map((item, idx) => {
          const cfg = PRINCIPLES_CONFIG[idx % PRINCIPLES_CONFIG.length];
          const Icon = cfg.icon;
          const VectorIllustration = cfg.vector;
          const title = item[0];
          const description = item[1];

          return (
            <div
              key={idx}
              className="w-[82vw] max-w-[320px] shrink-0 snap-center flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-sm transition-all min-h-[225px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl shadow-xs ring-1 ring-white",
                    cfg.iconBg
                  )}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase",
                    cfg.badge
                  )}
                >
                  #{cfg.num}
                </span>
              </div>

              {/* Body Content */}
              <div className="my-3 flex items-start justify-between gap-2.5 flex-1">
                <div className="flex-1">
                  <p className="font-jakarta text-sm font-bold text-foreground">
                    {title}
                  </p>
                  <p className="font-inter mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
                <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-b from-white to-mist/40 p-1 border border-line/60 shadow-2xs self-start mt-0.5">
                  <VectorIllustration />
                </div>
              </div>

              {/* Footer line */}
              <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-2.5">
                <div className={cn("h-1 w-10 rounded-full bg-gradient-to-r", cfg.accent)} />
                <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase">
                  Fundamental Principle
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination & Arrow Controls */}
      <div className="mt-3 flex items-center justify-between px-5">
        <div className="flex items-center gap-1">
          {principles.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to principle ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-5 bg-brand" : "w-1.5 bg-line hover:bg-muted-foreground/40"
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
            aria-label="Previous principle"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-line hover:bg-mist"
            onClick={handleNext}
            disabled={activeIndex === principles.length - 1}
            aria-label="Next principle"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
