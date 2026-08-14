"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n/config";
import { messages as enMessages, type Messages } from "@/lib/i18n/messages";

interface LocaleContextValue {
  locale: Locale;
  t: Messages;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  t: enMessages,
});

export function LocaleProvider({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Messages;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
