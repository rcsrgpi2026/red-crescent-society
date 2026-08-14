import "server-only";

import { lang } from "next/root-params";
import { defaultLocale, isLocale, type Locale } from "./config";
import { getMessages, type Messages } from "./index";

/** Current locale for the route (falls back to the default). */
export async function getServerLocale(): Promise<Locale> {
  try {
    const l = await lang();
    return isLocale(l) ? l : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

/** Messages for the current route locale. */
export async function getServerMessages(): Promise<Messages> {
  return getMessages(await getServerLocale());
}
