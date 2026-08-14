import { messages, type Messages } from "./messages";
import { bn } from "./bn";
import {
  defaultLocale,
  isLocale,
  locales,
  type Locale,
} from "./config";

export type { Messages } from "./messages";
export type { Locale } from "./config";
export { isLocale, defaultLocale, locales } from "./config";

const dictionaries: Record<Locale, Messages> = {
  en: messages,
  bn,
};

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function getMessagesSafe(locale: string | undefined | null): Messages {
  return isLocale(locale) ? dictionaries[locale] : dictionaries[defaultLocale];
}

/**
 * Interpolates `{placeholder}` tokens in a translated string with values.
 * All dictionary values are plain strings so the whole Messages object stays
 * serializable (it is passed into the client LocaleProvider).
 */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match
  );
}

/** Strips a leading locale prefix (e.g. /bn/about -> /about). */
export function stripLocalePrefix(path: string): string {
  for (const l of locales) {
    if (path === `/${l}`) return "/";
    if (path.startsWith(`/${l}/`)) return path.slice(l.length + 1);
  }
  return path;
}

/** Prefixes an internal path with the given locale. */
export function localizedPath(path: string, locale: Locale): string {
  if (!path.startsWith("/")) return path;
  const stripped = stripLocalePrefix(path);
  if (locale === defaultLocale) return stripped === "/" ? "/" : stripped;
  return `/${locale}${stripped === "/" ? "" : stripped}`;
}
