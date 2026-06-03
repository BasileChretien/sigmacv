import type { MetadataRoute } from "next";
import {
  DEFAULT_UI_LOCALE,
  LOCALE_SLUGS,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Public sitemap. Lists only crawlable, indexable URLs: the homepage in every
 * language (with per-entry hreflang `alternates`) plus /about. Excludes the
 * auth-gated editor (/cv), published CVs (/p/*, noindex by privacy design),
 * and all /api + Next internals.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const homePath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE
      ? "/"
      : LOCALE_SLUGS[loc as keyof typeof LOCALE_SLUGS];

  // Absolute hreflang map shared by every homepage entry (reciprocal + self).
  const languages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    languages[loc] = absoluteUrl(homePath(loc));
  }

  const homeEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(homePath(loc)),
    changeFrequency: "monthly",
    priority: loc === DEFAULT_UI_LOCALE ? 1 : 0.8,
    alternates: { languages },
  }));

  return [
    ...homeEntries,
    { url: absoluteUrl("about"), changeFrequency: "yearly", priority: 0.5 },
  ];
}
