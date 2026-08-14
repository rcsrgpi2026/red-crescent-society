"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface LogoUrls {
  rpi: string | null;
  rcs: string | null;
}

const LogoContext = createContext<LogoUrls>({ rpi: null, rcs: null });

/**
 * Loads the custom RPI / Red Crescent Society logos stored in
 * `website_settings.logos` and provides them to <SiteLogo /> everywhere.
 * Falls back to the static /logos/*.svg placeholders when not set.
 */
export function LogoProvider({ children }: { children: React.ReactNode }) {
  const [logos, setLogos] = useState<LogoUrls>({ rpi: null, rcs: null });

  useEffect(() => {
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
  }, []);

  return <LogoContext.Provider value={logos}>{children}</LogoContext.Provider>;
}

export function useLogos(): LogoUrls {
  return useContext(LogoContext);
}
