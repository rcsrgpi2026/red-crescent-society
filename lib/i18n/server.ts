import "server-only";

import { defaultLocale, type Locale } from "./config";
import { getMessages, type Messages } from "./index";

/** Current locale for the site (English). */
export async function getServerLocale(): Promise<Locale> {
  return defaultLocale;
}

/** Messages for the site. */
export async function getServerMessages(): Promise<Messages> {
  return getMessages(defaultLocale);
}
