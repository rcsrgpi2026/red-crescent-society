"use client";

import { useEffect, useRef, useState } from "react";
import type { CardConfig, CardSide } from "@/types/id-card";
import { IDCardView } from "@/components/id-card/id-card-view";

interface ScaledCardProps {
  config: CardConfig;
  side?: CardSide;
  id?: string;
  className?: string;
}

/**
 * Responsive preview wrapper for the CR80 card.
 *
 * The wrapper fills its container (`width: 100%`, capped at the card's natural
 * width) and keeps the card's exact aspect ratio. The fixed 1012×638 card is
 * scaled uniformly to fit that wrapper (transform-origin top-left), so the
 * whole card is always visible — never clipped, never distorted.
 *
 * The element captured for PNG/PDF/print is the inner card root at its natural
 * size, so exports are unaffected by the on-screen scale.
 */
export function ScaledCard({
  config,
  side = "front",
  id = "printable-card",
  className,
}: ScaledCardProps) {
  const cardWidth = config.design.width;
  const cardHeight = config.design.height;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      setScale(Math.min(w / cardWidth, 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [cardWidth]);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: "100%",
        maxWidth: cardWidth,
        aspectRatio: `${cardWidth} / ${cardHeight}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: cardWidth,
          height: cardHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <IDCardView config={config} side={side} id={id} />
      </div>
    </div>
  );
}
