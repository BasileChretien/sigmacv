import {
  DEFAULT_UI_LOCALE,
  LOCALE_SLUGS,
  SUPPORTED_LOCALES,
  asLocale,
  type Locale,
} from "@/lib/i18n";

/**
 * SEO helpers for the multilingual homepage: hreflang alternates, OG locale
 * tags, and the path each locale's landing lives at. Pure + dependency-free.
 */

/** Homepage path for a locale: "/" for the default, "/{slug}" otherwise. */
export function localeHomePath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/" : `/${LOCALE_SLUGS[loc]}`;
}

/**
 * hreflang → path map for every supported locale plus `x-default`. Paths are
 * relative; Next resolves them against `metadataBase` for `alternates.languages`.
 */
export function homeLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeHomePath(loc);
  languages["x-default"] = "/";
  return languages;
}

/** /about path for a locale: "/about" for the default, "/{slug}/about" otherwise. */
export function localeAboutPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/about" : `/${LOCALE_SLUGS[loc]}/about`;
}

/** hreflang → path map for the /about page (relative; resolved against metadataBase). */
export function aboutLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeAboutPath(loc);
  languages["x-default"] = "/about";
  return languages;
}

/** /privacy path for a locale: "/privacy" for the default, "/{slug}/privacy" otherwise. */
export function localePrivacyPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/privacy" : `/${LOCALE_SLUGS[loc]}/privacy`;
}

/** hreflang → path map for the /privacy page (relative; resolved against metadataBase). */
export function privacyLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localePrivacyPath(loc);
  languages["x-default"] = "/privacy";
  return languages;
}

/** Open Graph locale tag (underscored): "fr-FR" → "fr_FR". */
export function ogLocale(locale: string): string {
  return asLocale(locale).replace("-", "_");
}

/** OG `alternateLocale` list — every supported locale except `current`. */
export function ogAlternateLocales(
  current: Locale = DEFAULT_UI_LOCALE,
): string[] {
  return SUPPORTED_LOCALES.filter((l) => l !== current).map((l) =>
    l.replace("-", "_"),
  );
}
