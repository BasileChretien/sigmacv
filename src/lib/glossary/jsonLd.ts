import { serializeJsonLd } from "@/lib/jsonLd";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";
import type { GlossaryTerm } from "./glossary";

/**
 * Structured-data builders for the glossary. Each term is a schema.org
 * `DefinedTerm` belonging to one `DefinedTermSet` (the glossary), which is the
 * markup search engines and LLMs use for "what is X" entity coverage. Each
 * returns a serialized JSON-LD string (the caller wraps it in a <script>).
 */
const SET_ID = `${SITE_URL}/glossary#termset`;
const SET_NAME = "SigmaCV academic-CV glossary";

/** DefinedTerm for a single glossary entry. */
export function definedTermJsonLd(term: GlossaryTerm): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: term.term,
    description: term.short,
    inLanguage: "en",
    url: absoluteUrl(`glossary/${term.slug}`),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": SET_ID,
      name: SET_NAME,
      url: absoluteUrl("glossary"),
    },
  });
}

/** BreadcrumbList for a single term: SigmaCV → Glossary → this term. */
export function glossaryTermBreadcrumbJsonLd(term: GlossaryTerm): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Glossary", item: absoluteUrl("glossary") },
      {
        "@type": "ListItem",
        position: 3,
        name: term.term,
        item: absoluteUrl(`glossary/${term.slug}`),
      },
    ],
  });
}

/** BreadcrumbList for the glossary index: SigmaCV → Glossary. */
export function glossaryIndexBreadcrumbJsonLd(): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "SigmaCV", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Glossary", item: absoluteUrl("glossary") },
    ],
  });
}

/** The whole glossary as a DefinedTermSet listing every term (index page). */
export function definedTermSetJsonLd(terms: GlossaryTerm[]): string {
  return serializeJsonLd({
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": SET_ID,
    name: SET_NAME,
    description:
      "Plain-language definitions of the key terms behind an academic CV — ORCID, OpenAlex, citation metrics, the Citation Style Language, the NIH biosketch and more.",
    url: absoluteUrl("glossary"),
    inLanguage: "en",
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      url: absoluteUrl(`glossary/${t.slug}`),
    })),
  });
}
