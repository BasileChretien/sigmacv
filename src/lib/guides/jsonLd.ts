import { serializeJsonLd } from "@/lib/jsonLd";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";
import { GUIDE_AUTHOR, type Guide } from "./guides";

/**
 * Structured-data builders for the /guides surface. Each returns a serialized
 * JSON-LD string (the caller wraps it in a <script type="application/ld+json">),
 * matching the pattern used elsewhere (LandingPage's breadcrumb/HowTo). Guides
 * are English-only for now, so `inLanguage` is "en".
 */

const GUIDE_LANG = "en";

/** Article JSON-LD for a single guide (E-E-A-T: named author + ORCID, dates). */
export function guideArticleJsonLd(guide: Guide): string {
  const url = absoluteUrl(`guides/${guide.slug}`);
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url,
    inLanguage: GUIDE_LANG,
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
export function guideBreadcrumbJsonLd(guide: Guide): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("guides") },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: absoluteUrl(`guides/${guide.slug}`),
      },
    ],
  });
}

/** BreadcrumbList for the guides index: SigmaCV → Guides. */
export function guidesIndexBreadcrumbJsonLd(): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: absoluteUrl("guides") },
    ],
  });
}

/** ItemList of the guides on the index page (ordered discovery signal). */
export function guidesItemListJsonLd(guides: Guide[]): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`guides/${g.slug}`),
      name: g.title,
    })),
  });
}
