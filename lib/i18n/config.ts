export const locales = ["en", "bn"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
};

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  bn: "বাং",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

/** Returns true when the path already starts with a supported locale prefix. */
export function hasLocalePrefix(path: string): boolean {
  return locales.some(
    (l) => path === `/${l}` || path.startsWith(`/${l}/`)
  );
}
