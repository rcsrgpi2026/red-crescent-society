"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface FitTextProps {
  text: string;
  /** Maximum number of lines the text is allowed to use. */
  maxLines?: number;
  /** Smallest font size (px) the text may shrink to before ellipsizing. */
  minSize?: number;
  className?: string;
}

/**
 * Auto-sizes text so it fits a fixed-width container over up to `maxLines`
 * lines. Short text keeps its natural size; longer text is gently shrunk
 * (proportionally) so it still fits; only at the minimum size does it
 * ellipsize. Used to keep tree cards perfectly uniform.
 */
export function FitText({ text, maxLines = 2, minSize = 8, className }: FitTextProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner || !text) return;

    const fit = () => {
      const width = outer.clientWidth;
      if (!width) return;
      const base = parseFloat(getComputedStyle(outer).fontSize) || 14;

      // Measure the full, unwrapped text width at its natural size.
      const prevDisplay = inner.style.display;
      const prevWhiteSpace = inner.style.whiteSpace;
      inner.style.display = "block";
      inner.style.whiteSpace = "nowrap";
      inner.style.fontSize = `${base}px`;
      const fullWidth = inner.scrollWidth;
      inner.style.display = prevDisplay;
      inner.style.whiteSpace = prevWhiteSpace;

      // Reserve space for the allowed number of lines so all cards match.
      const size =
        fullWidth > width * maxLines
          ? Math.max(minSize, (base * width * maxLines) / fullWidth)
          : base;
      outer.style.minHeight = `${Math.round(size * 1.3 * maxLines)}px`;
      setFontSize(size);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(outer);
    // Re-measure once the webfonts have loaded (metrics change).
    if (document.fonts?.ready) document.fonts.ready.then(fit);
    return () => ro.disconnect();
  }, [text, maxLines, minSize]);

  return (
    <div ref={outerRef} className={className}>
      <span
        ref={innerRef}
        title={text}
        className="block w-full overflow-hidden text-ellipsis"
        style={{
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: maxLines,
          fontSize: fontSize ?? undefined,
          lineHeight: 1.3,
        }}
      >
        {text}
      </span>
    </div>
  );
}
