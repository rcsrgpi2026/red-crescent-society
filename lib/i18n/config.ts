export const locales = ["en"] as const;

export type Locale = "en" | "bn";

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  bn: "English",
};

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  bn: "EN",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "bn";
}

/** Returns true when the path already starts with a supported locale prefix. */
export function hasLocalePrefix(path: string): boolean {
  return locales.some(
    (l) => path === `/${l}` || path.startsWith(`/${l}/`)
  );
}
