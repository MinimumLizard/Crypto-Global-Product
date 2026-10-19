// Language. Launch is English only. Another language is added by translating messages/en.json into
// messages/<locale>.json and listing it in LOCALES: no code changes. Dates are UTC days throughout (lib/time.ts).
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["en"] as const;
export const DEFAULT_LOCALE = "en";

export default getRequestConfig(async () => {
  const locale = DEFAULT_LOCALE;
  return { locale, timeZone: "UTC", messages: (await import(`../messages/${locale}.json`)).default };
});
