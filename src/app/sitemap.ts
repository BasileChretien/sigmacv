import type { MetadataRoute } from "next";
import { listIndexablePublicSlugs } from "@/lib/cv/sync";
import { listExamples } from "@/lib/examples/examples";
import { listGuides } from "@/lib/guides/guides";
import { listTerms } from "@/lib/glossary/glossary";
import { DEFAULT_UI_LOCALE, LOCALE_SLUGS, SUPPORTED_LOCALES } from "@/lib/i18n";
import { HEAD_TERM_META, HEAD_TERM_PAGE_IDS } from "@/lib/i18n/headTermPages";
import { ALL_LANDING_PAGE_IDS } from "@/lib/i18n/landingAll";
import {
  localeGlossaryIndexPath,
  localeGlossaryTermPath,
  localeGuidePath,
  localeGuidesIndexPath,
  localeLandingPagePath,
} from "@/lib/seo";
import { absoluteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

/**
 * Public sitemap. Lists only crawlable, indexable URLs: the homepage, /about,
 * /privacy, /faq, /accessibility, /principles, /fair, /transparency AND the SEO
 * landing pages (/orcid-to-cv, /nih-biosketch) in every language (each with
 * per-entry hreflang `alternates`).
 * Public CVs (/p/*) are included ONLY when their owner opted into indexing
 * (publicIndexable) — the privacy-preserving growth loop. Excludes the
 * auth-gated editor (/cv) and all /api + Next internals.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slug = (loc: string) => LOCALE_SLUGS[loc as keyof typeof LOCALE_SLUGS];
  const homePath = (loc: string) => (loc === DEFAULT_UI_LOCALE ? "/" : slug(loc));
  const aboutPath = (loc: string) => (loc === DEFAULT_UI_LOCALE ? "about" : `${slug(loc)}/about`);
  const privacyPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "privacy" : `${slug(loc)}/privacy`;
  const contactPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "contact" : `${slug(loc)}/contact`;
  const faqPath = (loc: string) => (loc === DEFAULT_UI_LOCALE ? "faq" : `${slug(loc)}/faq`);
  const accessibilityPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "accessibility" : `${slug(loc)}/accessibility`;
  const principlesPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "principles" : `${slug(loc)}/principles`;
  const fairPath = (loc: string) => (loc === DEFAULT_UI_LOCALE ? "fair" : `${slug(loc)}/fair`);
  const transparencyPath = (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? "transparency" : `${slug(loc)}/transparency`;
  // SEO landing pages share the same path shape: bare segment for the default
  // locale, `${slug}/segment` otherwise.
  const landingPath = (segment: string) => (loc: string) =>
    loc === DEFAULT_UI_LOCALE ? segment : `${slug(loc)}/${segment}`;

  // Absolute hreflang maps (reciprocal + self) shared across each page's entries.
  const homeLanguages: Record<string, string> = {};
  const aboutLanguages: Record<string, string> = {};
  const privacyLanguages: Record<string, string> = {};
  const contactLanguages: Record<string, string> = {};
  const faqLanguages: Record<string, string> = {};
  const accessibilityLanguages: Record<string, string> = {};
  const principlesLanguages: Record<string, string> = {};
  const fairLanguages: Record<string, string> = {};
  const transparencyLanguages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    homeLanguages[loc] = absoluteUrl(homePath(loc));
    aboutLanguages[loc] = absoluteUrl(aboutPath(loc));
    privacyLanguages[loc] = absoluteUrl(privacyPath(loc));
    contactLanguages[loc] = absoluteUrl(contactPath(loc));
    faqLanguages[loc] = absoluteUrl(faqPath(loc));
    accessibilityLanguages[loc] = absoluteUrl(accessibilityPath(loc));
    principlesLanguages[loc] = absoluteUrl(principlesPath(loc));
    fairLanguages[loc] = absoluteUrl(fairPath(loc));
    transparencyLanguages[loc] = absoluteUrl(transparencyPath(loc));
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

  const contactEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(contactPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.4 : 0.3,
    alternates: { languages: contactLanguages },
  }));

  const faqEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(faqPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.5 : 0.4,
    alternates: { languages: faqLanguages },
  }));

  const accessibilityEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(accessibilityPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.4 : 0.3,
    alternates: { languages: accessibilityLanguages },
  }));

  const principlesEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(principlesPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.5 : 0.4,
    alternates: { languages: principlesLanguages },
  }));

  const fairEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(fairPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.5 : 0.4,
    alternates: { languages: fairLanguages },
  }));

  const transparencyEntries: MetadataRoute.Sitemap = SUPPORTED_LOCALES.map((loc) => ({
    url: absoluteUrl(transparencyPath(loc)),
    changeFrequency: "yearly",
    priority: loc === DEFAULT_UI_LOCALE ? 0.5 : 0.4,
    alternates: { languages: transparencyLanguages },
  }));

  // High-intent SEO landing pages — primary acquisition surfaces, so a higher
  // priority than the legal/info pages and a monthly change cadence. Iterates
  // ALL_LANDING_PAGE_IDS (SEO + persona pages) so every landing page is here too.
  const landingEntries: MetadataRoute.Sitemap = ALL_LANDING_PAGE_IDS.flatMap((segment) => {
    const path = landingPath(segment);
    const languages: Record<string, string> = {};
    for (const loc of SUPPORTED_LOCALES) {
      languages[loc] = absoluteUrl(path(loc));
    }
    return SUPPORTED_LOCALES.map((loc) => ({
      url: absoluteUrl(path(loc)),
      changeFrequency: "monthly" as const,
      priority: loc === DEFAULT_UI_LOCALE ? 0.7 : 0.6,
      alternates: { languages },
    }));
  });

  // Guides (localized authority content): the index + each cornerstone guide,
  // one crawlable URL per language with reciprocal hreflang `alternates`.
  const guidesIndexLanguages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    guidesIndexLanguages[loc] = absoluteUrl(localeGuidesIndexPath(loc));
  }
  const guidesEntries: MetadataRoute.Sitemap = [
    ...SUPPORTED_LOCALES.map((loc) => ({
      url: absoluteUrl(localeGuidesIndexPath(loc)),
      changeFrequency: "weekly" as const,
      priority: loc === DEFAULT_UI_LOCALE ? 0.7 : 0.6,
      alternates: { languages: guidesIndexLanguages },
    })),
    ...listGuides().flatMap((g) => {
      const languages: Record<string, string> = {};
      for (const loc of SUPPORTED_LOCALES)
        languages[loc] = absoluteUrl(localeGuidePath(g.slug, loc));
      return SUPPORTED_LOCALES.map((loc) => ({
        url: absoluteUrl(localeGuidePath(g.slug, loc)),
        lastModified: g.dateModified,
        changeFrequency: "monthly" as const,
        priority: loc === DEFAULT_UI_LOCALE ? 0.7 : 0.6,
        alternates: { languages },
      }));
    }),
  ];

  // Glossary (localized concept pages): the index + each term, per language.
  const glossaryIndexLanguages: Record<string, string> = {};
  for (const loc of SUPPORTED_LOCALES) {
    glossaryIndexLanguages[loc] = absoluteUrl(localeGlossaryIndexPath(loc));
  }
  const glossaryEntries: MetadataRoute.Sitemap = [
    ...SUPPORTED_LOCALES.map((loc) => ({
      url: absoluteUrl(localeGlossaryIndexPath(loc)),
      changeFrequency: "monthly" as const,
      priority: loc === DEFAULT_UI_LOCALE ? 0.6 : 0.5,
      alternates: { languages: glossaryIndexLanguages },
    })),
    ...listTerms().flatMap((t) => {
      const languages: Record<string, string> = {};
      for (const loc of SUPPORTED_LOCALES) {
        languages[loc] = absoluteUrl(localeGlossaryTermPath(t.slug, loc));
      }
      return SUPPORTED_LOCALES.map((loc) => ({
        url: absoluteUrl(localeGlossaryTermPath(t.slug, loc)),
        changeFrequency: "yearly" as const,
        priority: loc === DEFAULT_UI_LOCALE ? 0.6 : 0.5,
        alternates: { languages },
      }));
    }),
  ];

  // Native head-term landing pages (I1) — single-locale, each at its own native
  // URL (/fr/cv-academique, …), so one entry per page (no ×10, no hreflang cluster).
  const headTermEntries: MetadataRoute.Sitemap = HEAD_TERM_PAGE_IDS.map((slug) => {
    const meta = HEAD_TERM_META[slug];
    return {
      url: absoluteUrl(localeLandingPagePath(slug, meta.locale)),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    };
  });

  // Examples gallery (C5): illustrative academic-CV examples (English-only) — the
  // index + each example, high-intent + linkable "academic CV example" pages.
  const examplesEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("examples"), changeFrequency: "monthly", priority: 0.7 },
    ...listExamples().map((e) => ({
      url: absoluteUrl(`examples/${e.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

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
    ...contactEntries,
    ...faqEntries,
    ...accessibilityEntries,
    ...principlesEntries,
    ...fairEntries,
    ...transparencyEntries,
    ...landingEntries,
    ...guidesEntries,
    ...glossaryEntries,
    ...headTermEntries,
    ...examplesEntries,
    ...cvEntries,
  ];
}
