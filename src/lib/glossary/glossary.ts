import type { GuideBlock, GuideSlug } from "@/lib/guides/guides";
import { asLocale, type Locale } from "@/lib/i18n";
import type { LandingPageId } from "@/lib/i18n/landingPages";
import { GLOSSARY_CONTENT } from "./content";

/**
 * The `/glossary` surface: short, indexable "what is X" concept pages for the
 * entities that matter to an academic CV (ORCID, OpenAlex, FWCI, the h-index,
 * CSL, the NIH biosketch …). They win "what is …" queries and are exactly the
 * kind of clear, sourced definition LLMs cite. Each term is emitted as schema.org
 * `DefinedTerm` within a `DefinedTermSet`.
 *
 * Localized for all ten locales (I1). Like guides, structure is single-sourced
 * and locale-invariant (`GLOSSARY_META`: slug + cross-links); only the prose is
 * translated (`GLOSSARY_CONTENT`, a forced-ten-locale map). Content reuses the
 * safe, typed `GuideBlock` model (no markdown/MDX, no raw HTML) and the shared
 * `renderContentBlock` renderer.
 */

/** The localized, renderable part of a term (one entry per locale). */
export interface GlossaryContent {
  /** The term itself (DefinedTerm.name), e.g. "ORCID". */
  term: string;
  /** Page <title> + H1, e.g. "What is ORCID?". */
  title: string;
  /** One-sentence definition — the DefinedTerm.description + the visible lede. */
  short: string;
  /** Meta description. */
  description: string;
  /** Body, rendered in order. */
  blocks: GuideBlock[];
  faq?: { q: string; a: string }[];
}

/** Locale-invariant structure for a term (URL + cross-links). */
export interface GlossaryMeta {
  /** URL slug: /glossary/{slug}. */
  slug: GlossarySlug;
  /** Cross-links (other glossary slugs / landing ids / guide slugs). */
  relatedTerms?: GlossarySlug[];
  relatedPages?: LandingPageId[];
  relatedGuides?: GuideSlug[];
}

/** A fully composed glossary term for one locale: structure + localized content. */
export type GlossaryTerm = GlossaryMeta & GlossaryContent;

/** All term slugs. A `const` tuple so `GlossarySlug` is a literal union. */
export const GLOSSARY_SLUGS = [
  "orcid",
  "openalex",
  "fwci",
  "h-index",
  "csl",
  "nih-biosketch",
  "preprint",
  "dora",
  "leiden-manifesto",
] as const;
export type GlossarySlug = (typeof GLOSSARY_SLUGS)[number];

const GLOSSARY_META: Record<GlossarySlug, GlossaryMeta> = {
  orcid: {
    slug: "orcid",
    relatedTerms: ["openalex"],
    relatedPages: ["orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  openalex: {
    slug: "openalex",
    relatedTerms: ["orcid", "fwci"],
    relatedPages: ["openalex-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  fwci: {
    slug: "fwci",
    relatedTerms: ["h-index", "openalex"],
    relatedPages: ["openalex-cv"],
    relatedGuides: ["responsible-metrics-on-an-academic-cv"],
  },
  "h-index": {
    slug: "h-index",
    relatedTerms: ["fwci"],
    relatedGuides: ["responsible-metrics-on-an-academic-cv"],
  },
  csl: {
    slug: "csl",
    relatedTerms: ["orcid"],
    relatedPages: ["publication-list", "latex-cv"],
    relatedGuides: ["how-to-list-publications-on-a-cv"],
  },
  "nih-biosketch": {
    slug: "nih-biosketch",
    relatedTerms: [],
    relatedPages: ["nih-biosketch", "funder-cv-templates"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  preprint: {
    slug: "preprint",
    relatedTerms: ["orcid"],
    relatedPages: ["publication-list"],
    relatedGuides: ["how-to-list-publications-on-a-cv"],
  },
  dora: {
    slug: "dora",
    relatedTerms: ["fwci", "h-index"],
    relatedGuides: ["responsible-metrics-on-an-academic-cv"],
  },
  "leiden-manifesto": {
    slug: "leiden-manifesto",
    relatedTerms: ["dora", "fwci", "h-index"],
    relatedGuides: ["responsible-metrics-on-an-academic-cv"],
  },
};

/** Compose a term's structure with its localized content for `locale`. */
function compose(slug: GlossarySlug, locale: Locale): GlossaryTerm {
  return { ...GLOSSARY_META[slug], ...GLOSSARY_CONTENT[locale][slug] };
}

/** Terms, alphabetical by display name (for the index), in `locale`. */
export function listTerms(locale: string = "en-US"): GlossaryTerm[] {
  const loc = asLocale(locale);
  return [...GLOSSARY_SLUGS]
    .map((slug) => compose(slug, loc))
    .sort((a, b) => a.term.localeCompare(b.term, loc));
}

/** One term by slug in `locale`, or undefined if the slug is unknown. */
export function getTerm(slug: string, locale: string = "en-US"): GlossaryTerm | undefined {
  if (!(GLOSSARY_SLUGS as readonly string[]).includes(slug)) return undefined;
  return compose(slug as GlossarySlug, asLocale(locale));
}
