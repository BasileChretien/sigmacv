import { localeLanguageCode } from "@/lib/i18n";
import { glossaryNavLabel } from "@/lib/i18n/guidesNav";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { serializeJsonLd } from "@/lib/jsonLd";
import { localeGlossaryIndexPath, localeGlossaryTermPath } from "@/lib/seo";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";
import type { GlossaryTerm } from "./glossary";

/**
 * Structured-data builders for the glossary. Each term is a schema.org
 * `DefinedTerm` belonging to one `DefinedTermSet` (the glossary), which is the
 * markup search engines and LLMs use for "what is X" entity coverage. Localized
 * (I1): `inLanguage`, URLs, the set name and breadcrumb labels follow the locale.
 */
const setId = (locale: string) => `${absoluteUrl(localeGlossaryIndexPath(locale))}#termset`;

/** Localized name of the term set (reuses the glossary index title). */
function setName(locale: string): string {
  return guidesChrome(locale).glossaryIndexTitle;
}

/** DefinedTerm for a single glossary entry. */
export function definedTermJsonLd(term: GlossaryTerm, locale: string = "en-US"): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.short,
    inLanguage: localeLanguageCode(locale),
    url: absoluteUrl(localeGlossaryTermPath(term.slug, locale)),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": setId(locale),
      name: setName(locale),
      url: absoluteUrl(localeGlossaryIndexPath(locale)),
    },
  });
}

/** BreadcrumbList for a single term: SigmaCV → Glossary → this term. */
export function glossaryTermBreadcrumbJsonLd(term: GlossaryTerm, locale: string = "en-US"): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: glossaryNavLabel(locale),
        item: absoluteUrl(localeGlossaryIndexPath(locale)),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: term.term,
        item: absoluteUrl(localeGlossaryTermPath(term.slug, locale)),
      },
    ],
  });
}

/** BreadcrumbList for the glossary index: SigmaCV → Glossary. */
export function glossaryIndexBreadcrumbJsonLd(locale: string = "en-US"): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: glossaryNavLabel(locale),
        item: absoluteUrl(localeGlossaryIndexPath(locale)),
      },
    ],
  });
}

/** The whole glossary as a DefinedTermSet listing every term (index page). */
export function definedTermSetJsonLd(terms: GlossaryTerm[], locale: string = "en-US"): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": setId(locale),
    name: setName(locale),
    description: guidesChrome(locale).glossaryIndexDescription,
    url: absoluteUrl(localeGlossaryIndexPath(locale)),
    inLanguage: localeLanguageCode(locale),
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      url: absoluteUrl(localeGlossaryTermPath(t.slug, locale)),
    })),
  });
}
