import type { MetadataRoute } from "next";
import {
  DEFAULT_UI_LOCALE,
  LOCALE_SLUGS,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Public sitemap. Lists only crawlable, indexable URLs: the homepage, /about,
 * AND /privacy in every language (each with per-entry hreflang `alternates`).
 * Excludes the auth-gated editor (/cv), published CVs (/p/*, noindex by privacy
 * design), and all /api + Next internals.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const slug = (loc: string) => LOCALE_SLUGS[loc as keyof typeof LOCALE_SLUGS];
  const homePath = (loc: string) => (loc === DEFAULT_UI_LOCALE ? "/" : slug(loc));
  const aboutPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "about" : `${slug(loc)}/about`;
  const privacyPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "privacy" : `${slug(loc)}/privacy`;

  // Absolute hreflang maps (reciprocal + self) shared across each page's entries.
  const homeLanguages: Record<string, string> = {};
  const aboutLanguages: Record<string, string> = {};
  const privacyLanguages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    homeLanguages[loc] = absoluteUrl(homePath(loc));
    aboutLanguages[loc] = absoluteUrl(aboutPath(loc));
    privacyLanguages[loc] = absoluteUrl(privacyPath(loc));
  }

  const homeEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(homePath(loc)),
    changeFrequency: "monthly",
    priority: loc === DEFAULT_UI_LOCALE ? 1 : 0.8,
    alternates: { languages: homeLanguages },
  }));

  const aboutEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(aboutPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.5 : 0.4,
    alternates: { languages: aboutLanguages },
  }));

  const privacyEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(privacyPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.4 : 0.3,
    alternates: { languages: privacyLanguages },
  }));

  return [...homeEntries, ...aboutEntries, ...privacyEntries];
}
