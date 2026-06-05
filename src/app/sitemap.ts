import type { MetadataRoute } from "next";
import { listIndexablePublicSlugs } from "@/lib/cv/sync";
import {
  DEFAULT_UI_LOCALE,
  LOCALE_SLUGS,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";
import { absoluteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

/**
 * Public sitemap. Lists only crawlable, indexable URLs: the homepage, /about,
 * /privacy, /faq, /accessibility AND the SEO landing pages (/orcid-to-cv,
 * /nih-biosketch) in every language (each with per-entry hreflang `alternates`).
 * Public CVs (/p/*) are included ONLY when their owner opted into indexing
 * (publicIndexable) — the privacy-preserving growth loop. Excludes the
 * auth-gated editor (/cv) and all /api + Next internals.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slug = (loc: string) => LOCALE_SLUGS[loc as keyof typeof LOCALE_SLUGS];
  const homePath = (loc: string) => (loc === DEFAULT_UI_LOCALE ? "/" : slug(loc));
  const aboutPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "about" : `${slug(loc)}/about`;
  const privacyPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "privacy" : `${slug(loc)}/privacy`;
  const faqPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "faq" : `${slug(loc)}/faq`;
  const accessibilityPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "accessibility" : `${slug(loc)}/accessibility`;
  // SEO landing pages share the same path shape: bare segment for the default
  // locale, `${slug}/segment` otherwise.
  const landingPath = (segment: string) => (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? segment : `${slug(loc)}/${segment}`;
  const orcidToCvPath = landingPath("orcid-to-cv");
  const nihBiosketchPath = landingPath("nih-biosketch");

  // Absolute hreflang maps (reciprocal + self) shared across each page's entries.
  const homeLanguages: Record<string, string> = {};
  const aboutLanguages: Record<string, string> = {};
  const privacyLanguages: Record<string, string> = {};
  const faqLanguages: Record<string, string> = {};
  const accessibilityLanguages: Record<string, string> = {};
  const orcidToCvLanguages: Record<string, string> = {};
  const nihBiosketchLanguages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    homeLanguages[loc] = absoluteUrl(homePath(loc));
    aboutLanguages[loc] = absoluteUrl(aboutPath(loc));
    privacyLanguages[loc] = absoluteUrl(privacyPath(loc));
    faqLanguages[loc] = absoluteUrl(faqPath(loc));
    accessibilityLanguages[loc] = absoluteUrl(accessibilityPath(loc));
    orcidToCvLanguages[loc] = absoluteUrl(orcidToCvPath(loc));
    nihBiosketchLanguages[loc] = absoluteUrl(nihBiosketchPath(loc));
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

  const faqEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(faqPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.5 : 0.4,
    alternates: { languages: faqLanguages },
  }));

  const accessibilityEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map(
    (loc) => ({
      url: absoluteUrl(accessibilityPath(loc)),
      changeFrequency: "yearly",
      priority: loc === DEFAULT_UI_LOCALE ? 0.4 : 0.3,
      alternates: { languages: accessibilityLanguages },
    }),
  );

  // High-intent SEO landing pages — primary acquisition surfaces, so a higher
  // priority than the legal/info pages and a monthly change cadence.
  const orcidToCvEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map(
    (loc) => ({
      url: absoluteUrl(orcidToCvPath(loc)),
      changeFrequency: "monthly",
      priority: loc === DEFAULT_UI_LOCALE ? 0.7 : 0.6,
      alternates: { languages: orcidToCvLanguages },
    }),
  );

  const nihBiosketchEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map(
    (loc) => ({
      url: absoluteUrl(nihBiosketchPath(loc)),
      changeFrequency: "monthly",
      priority: loc === DEFAULT_UI_LOCALE ? 0.7 : 0.6,
      alternates: { languages: nihBiosketchLanguages },
    }),
  );

  // Opt-in indexable public CVs — the privacy-preserving organic-growth loop.
  // Best-effort: a DB hiccup must not break the (static-content) sitemap.
  let cvEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await listIndexablePublicSlugs();
    cvEntries = slugs.map((slug) => ({
      url: absoluteUrl(`p/${slug}`),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    cvEntries = [];
  }

  return [
    ...homeEntries,
    ...aboutEntries,
    ...privacyEntries,
    ...faqEntries,
    ...accessibilityEntries,
    ...orcidToCvEntries,
    ...nihBiosketchEntries,
    ...cvEntries,
  ];
}
