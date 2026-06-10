import { localeLanguageCode } from "@/lib/i18n";
import { guidesNavLabel } from "@/lib/i18n/guidesNav";
import { serializeJsonLd } from "@/lib/jsonLd";
import { localeGuidePath, localeGuidesIndexPath } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";
import { GUIDE_AUTHOR, type Guide } from "./guides";

/**
 * Structured-data builders for the /guides surface. Each returns a serialized
 * JSON-LD string (the caller wraps it in a <script type="application/ld+json">),
 * matching the pattern used elsewhere (LandingPage's breadcrumb/HowTo). Localized
 * (I1): `inLanguage`, URLs and breadcrumb labels all follow the requested locale.
 */

/** Article JSON-LD for a single guide (E-E-A-T: named author + ORCID, dates). */
export function guideArticleJsonLd(guide: Guide, locale: string = "en-US"): string {
  const url = absoluteUrl(localeGuidePath(guide.slug, locale));
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url,
    inLanguage: localeLanguageCode(locale),
    datePublished: guide.datePublished,
    dateModified: guide.dateModified,
    author: {
      "@type": "Person",
      name: GUIDE_AUTHOR.name,
      url: GUIDE_AUTHOR.orcid,
      sameAs: [GUIDE_AUTHOR.orcid],
    },
    publisher: { "@type": "Organization", "@id": `${SITE_URL}/#org`, name: "SigmaCV" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
  });
}

/** BreadcrumbList for a single guide: SigmaCV → Guides → this guide. */
export function guideBreadcrumbJsonLd(guide: Guide, locale: string = "en-US"): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: guidesNavLabel(locale),
        item: absoluteUrl(localeGuidesIndexPath(locale)),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: absoluteUrl(localeGuidePath(guide.slug, locale)),
      },
    ],
  });
}

/** BreadcrumbList for the guides index: SigmaCV → Guides. */
export function guidesIndexBreadcrumbJsonLd(locale: string = "en-US"): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: guidesNavLabel(locale),
        item: absoluteUrl(localeGuidesIndexPath(locale)),
      },
    ],
  });
}

/** ItemList of the guides on the index page (ordered discovery signal). */
export function guidesItemListJsonLd(guides: Guide[], locale: string = "en-US"): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(localeGuidePath(g.slug, locale)),
      name: g.title,
    })),
  });
}
