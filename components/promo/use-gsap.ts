"use client";

import { useEffect } from "react";
import gsap from "gsap";

/**
 * Minimal useGSAP replacement (avoids adding @gsap/react).
 * Runs the callback in a gsap.context scoped to `options.scope`,
 * reverts on unmount / StrictMode re-invoke.
 */
export function useGSAP(
  callback: () => void | (() => void),
  options?: { scope?: React.RefObject<HTMLElement | null> }
) {
  const scope = options?.scope;
  useEffect(() => {
    const ctx = gsap.context(callback, scope?.current ?? undefined);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
