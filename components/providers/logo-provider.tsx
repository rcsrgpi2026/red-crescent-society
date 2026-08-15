"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface LogoUrls {
  rpi: string | null;
  rcs: string | null;
}

const LogoContext = createContext<LogoUrls>({ rpi: null, rcs: null });

const NO_LOGOS: LogoUrls = { rpi: null, rcs: null };

/**
 * Provides the custom RPI / Red Crescent Society logos (from
 * `website_settings.logos`) to <SiteLogo /> everywhere, falling back to the
 * static /logos/*.svg placeholders when none are set.
 *
 * When `initialLogos` is passed (from a server component reading `getSettings`),
 * the custom logos are already in the very first server render — the client
 * never shows the placeholder first, so there is no logo "flash" on load.
 * The client-side fetch is only used as a fallback (e.g. the admin panel).
 */
export function LogoProvider({
  children,
  initialLogos,
}: {
  children: React.ReactNode;
  initialLogos?: LogoUrls | null;
}) {
  const [logos, setLogos] = useState<LogoUrls>(initialLogos ?? NO_LOGOS);

  useEffect(() => {
    // The server already rendered the real logos — nothing to fetch.
    if (initialLogos) return;
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("website_settings")
          .select("value")
          .eq("key", "logos")
          .maybeSingle();
        if (!cancelled && data?.value && typeof data.value === "object") {
          const value = data.value as Record<string, unknown>;
          setLogos({
            rpi: typeof value.rpi === "string" && value.rpi ? value.rpi : null,
            rcs: typeof value.rcs === "string" && value.rcs ? value.rcs : null,
          });
        }
      } catch {
        // Non-fatal: keep the placeholder logos.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialLogos]);

  return <LogoContext.Provider value={logos}>{children}</LogoContext.Provider>;
}

export function useLogos(): LogoUrls {
  return useContext(LogoContext);
}
