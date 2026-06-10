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

/** /contact path for a locale: "/contact" for the default, "/{slug}/contact" otherwise. */
export function localeContactPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/contact" : `/${LOCALE_SLUGS[loc]}/contact`;
}

/** hreflang → path map for the /contact page (relative; resolved against metadataBase). */
export function contactLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeContactPath(loc);
  languages["x-default"] = "/contact";
  return languages;
}

/** /faq path for a locale: "/faq" for the default, "/{slug}/faq" otherwise. */
export function localeFaqPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/faq" : `/${LOCALE_SLUGS[loc]}/faq`;
}

/** hreflang → path map for the /faq page (relative; resolved against metadataBase). */
export function faqLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeFaqPath(loc);
  languages["x-default"] = "/faq";
  return languages;
}

/** /accessibility path for a locale: "/accessibility" for the default, "/{slug}/accessibility" otherwise. */
export function localeAccessibilityPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/accessibility" : `/${LOCALE_SLUGS[loc]}/accessibility`;
}

/** hreflang → path map for the /accessibility page (relative; resolved against metadataBase). */
export function accessibilityLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeAccessibilityPath(loc);
  languages["x-default"] = "/accessibility";
  return languages;
}

/** /principles path for a locale: "/principles" for the default, "/{slug}/principles" otherwise. */
export function localePrinciplesPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/principles" : `/${LOCALE_SLUGS[loc]}/principles`;
}

/** hreflang → path map for the /principles page (relative; resolved against metadataBase). */
export function principlesLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localePrinciplesPath(loc);
  languages["x-default"] = "/principles";
  return languages;
}

/** /fair path for a locale: "/fair" for the default, "/{slug}/fair" otherwise. */
export function localeFairPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/fair" : `/${LOCALE_SLUGS[loc]}/fair`;
}

/** hreflang → path map for the /fair page (relative; resolved against metadataBase). */
export function fairLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeFairPath(loc);
  languages["x-default"] = "/fair";
  return languages;
}

/** /transparency path for a locale: "/transparency" for the default, "/{slug}/transparency" otherwise. */
export function localeTransparencyPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/transparency" : `/${LOCALE_SLUGS[loc]}/transparency`;
}

/** hreflang → path map for the /transparency page (relative; resolved against metadataBase). */
export function transparencyLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeTransparencyPath(loc);
  languages["x-default"] = "/transparency";
  return languages;
}

/**
 * Path for an SEO landing page in a given locale: "/{segment}" for the default
 * locale, "/{slug}/{segment}" otherwise. `segment` is the bare path id, e.g.
 * "orcid-to-cv" or "nih-biosketch".
 */
export function localeLandingPagePath(segment: string, locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? `/${segment}` : `/${LOCALE_SLUGS[loc]}/${segment}`;
}

/** hreflang → path map for an SEO landing page (relative; resolved against metadataBase). */
export function landingPageLanguageAlternates(segment: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeLandingPagePath(segment, loc);
  languages["x-default"] = `/${segment}`;
  return languages;
}

// ─── Guides + glossary (localized authority content, I1) ─────────────────────

/** /guides index path for a locale: "/guides" for the default, "/{slug}/guides" otherwise. */
export function localeGuidesIndexPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/guides" : `/${LOCALE_SLUGS[loc]}/guides`;
}

/** hreflang → path map for the /guides index. */
export function guidesIndexLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeGuidesIndexPath(loc);
  languages["x-default"] = "/guides";
  return languages;
}

/** A guide path for a locale: "/guides/{slug}" for the default, "/{loc}/guides/{slug}" otherwise. */
export function localeGuidePath(slug: string, locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? `/guides/${slug}` : `/${LOCALE_SLUGS[loc]}/guides/${slug}`;
}

/** hreflang → path map for a single guide. */
export function guideLanguageAlternates(slug: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeGuidePath(slug, loc);
  languages["x-default"] = `/guides/${slug}`;
  return languages;
}

/** /glossary index path for a locale: "/glossary" for the default, "/{slug}/glossary" otherwise. */
export function localeGlossaryIndexPath(locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? "/glossary" : `/${LOCALE_SLUGS[loc]}/glossary`;
}

/** hreflang → path map for the /glossary index. */
export function glossaryIndexLanguageAlternates(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeGlossaryIndexPath(loc);
  languages["x-default"] = "/glossary";
  return languages;
}

/** A term path for a locale: "/glossary/{slug}" for the default, "/{loc}/glossary/{slug}" otherwise. */
export function localeGlossaryTermPath(slug: string, locale: string): string {
  const loc = asLocale(locale);
  return loc === DEFAULT_UI_LOCALE ? `/glossary/${slug}` : `/${LOCALE_SLUGS[loc]}/glossary/${slug}`;
}

/** hreflang → path map for a single glossary term. */
export function glossaryTermLanguageAlternates(slug: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) languages[loc] = localeGlossaryTermPath(slug, loc);
  languages["x-default"] = `/glossary/${slug}`;
  return languages;
}

/**
 * Rewrite an internal content href (CTA links inside guides/glossary) to its
 * localized equivalent for `locale`. The homepage, landing-page segments, guide
 * and glossary links all gain the locale prefix; external/anchor/mail links are
 * left untouched. For the default locale every result is the original path, so
 * the bare routes are unaffected.
 */
export function localizeContentHref(href: string, locale: string): string {
  if (!href.startsWith("/")) return href; // external, anchor, mailto, …
  if (href === "/") return localeHomePath(locale);
  if (href.startsWith("/guides/")) return localeGuidePath(href.slice("/guides/".length), locale);
  if (href.startsWith("/glossary/")) {
    return localeGlossaryTermPath(href.slice("/glossary/".length), locale);
  }
  // A bare single segment (e.g. "/orcid-to-cv") is an SEO landing page.
  return localeLandingPagePath(href.slice(1), locale);
}

/** Open Graph locale tag (underscored): "fr-FR" → "fr_FR". */
export function ogLocale(locale: string): string {
  return asLocale(locale).replace("-", "_");
}

/** OG `alternateLocale` list — every supported locale except `current`. */
export function ogAlternateLocales(current: Locale = DEFAULT_UI_LOCALE): string[] {
  return SUPPORTED_LOCALES.filter((l) => l !== current).map((l) => l.replace("-", "_"));
}
