import { asLocale, type Locale } from "@/lib/i18n";
import type { LandingPageId } from "@/lib/i18n/landingPages";
import { GUIDE_CONTENT } from "./content";

/**
 * The `/guides` surface: long-form, indexable, LLM-citable cornerstone content
 * about academic CVs.
 *
 * Localized for all ten supported locales (I1 in the discoverability roadmap).
 * Structure is single-sourced and locale-invariant: slugs, dates, block types,
 * heading anchors, CTA hrefs and cross-links live once in `GUIDE_META`. Only the
 * prose is translated — `GUIDE_CONTENT` (in `content.ts`) is a forced-ten-locale
 * map keyed by slug, so a missing locale/slug is a compile error and an anchor or
 * href can never drift between languages.
 *
 * Content is structured + typed (no markdown/MDX dependency, no raw HTML), the
 * same safe pattern the rest of the site uses (landingPages, principles, …). A
 * `GuidePage` component renders the blocks; pure helpers here build reading time
 * and feed the Article / BreadcrumbList / FAQPage JSON-LD.
 */

/** A single rendered content block within a guide body. */
export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "cta"; label: string; href: string };

export interface GuideFaqItem {
  q: string;
  a: string;
}

/** The localized, renderable part of a guide (one entry per locale). */
export interface GuideContent {
  /** H1 + <title> (the layout appends " — SigmaCV"). */
  title: string;
  /** Meta description + the visible lede. */
  description: string;
  /** The body, rendered in order. */
  blocks: GuideBlock[];
  /** Optional FAQ → rendered visibly + as FAQPage JSON-LD. */
  faq?: GuideFaqItem[];
}

/** Locale-invariant structure for a guide (URL, dates, cross-links). */
export interface GuideMeta {
  /** URL slug: /guides/{slug}. */
  slug: GuideSlug;
  /** ISO date (YYYY-MM-DD). */
  datePublished: string;
  /** ISO date (YYYY-MM-DD); ≥ datePublished. */
  dateModified: string;
  /** Cross-links to SEO landing pages (hub-and-spoke). */
  relatedPages?: LandingPageId[];
  /** Cross-links to other guides (by slug). */
  relatedGuides?: GuideSlug[];
}

/** A fully composed guide for one locale: structure + localized content. */
export type Guide = GuideMeta & GuideContent;

/** Author of the guides — surfaced in the byline + Article JSON-LD (E-E-A-T). */
export const GUIDE_AUTHOR = {
  name: "Basile Chrétien",
  credentials: "PharmD, MSc, MPH",
  orcid: "https://orcid.org/0000-0002-7483-2489",
} as const;

/**
 * All guide slugs, in publication order. A `const` tuple so `GuideSlug` is a
 * literal union — `GUIDE_CONTENT` must then cover every slug in every locale.
 */
export const GUIDE_SLUGS = [
  "how-to-write-an-academic-cv",
  "academic-cv-vs-resume",
  "how-to-list-publications-on-a-cv",
  "how-long-should-an-academic-cv-be",
  "academic-cv-for-grad-school",
  "responsible-metrics-on-an-academic-cv",
  "academic-cv-format-by-country",
] as const;
export type GuideSlug = (typeof GUIDE_SLUGS)[number];

const GUIDE_META: Record<GuideSlug, GuideMeta> = {
  "how-to-write-an-academic-cv": {
    slug: "how-to-write-an-academic-cv",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    relatedPages: ["academic-cv-template", "orcid-to-cv", "publication-list"],
    relatedGuides: [
      "academic-cv-vs-resume",
      "how-to-list-publications-on-a-cv",
      "how-long-should-an-academic-cv-be",
    ],
  },
  "academic-cv-vs-resume": {
    slug: "academic-cv-vs-resume",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    relatedPages: ["academic-cv-template", "orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  "how-to-list-publications-on-a-cv": {
    slug: "how-to-list-publications-on-a-cv",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    relatedPages: ["publication-list", "orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  "how-long-should-an-academic-cv-be": {
    slug: "how-long-should-an-academic-cv-be",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    relatedPages: ["funder-cv-templates", "academic-cv-template"],
    relatedGuides: ["how-to-write-an-academic-cv", "academic-cv-for-grad-school"],
  },
  "academic-cv-for-grad-school": {
    slug: "academic-cv-for-grad-school",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    relatedPages: ["academic-cv-template", "orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv", "how-long-should-an-academic-cv-be"],
  },
  "responsible-metrics-on-an-academic-cv": {
    slug: "responsible-metrics-on-an-academic-cv",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    relatedPages: ["openalex-cv", "academic-cv-template"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  "academic-cv-format-by-country": {
    slug: "academic-cv-format-by-country",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    relatedPages: ["academic-cv-template", "funder-cv-templates"],
    relatedGuides: ["how-to-write-an-academic-cv", "academic-cv-vs-resume"],
  },
};

/** Compose a guide's structure with its localized content for `locale`. */
function compose(slug: GuideSlug, locale: Locale): Guide {
  return { ...GUIDE_META[slug], ...GUIDE_CONTENT[locale][slug] };
}

/** Guides, newest first (for the index page), in `locale`. */
export function listGuides(locale: string = "en-US"): Guide[] {
  const loc = asLocale(locale);
  return [...GUIDE_SLUGS]
    .map((slug) => compose(slug, loc))
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

/** One guide by slug in `locale`, or undefined if the slug is unknown. */
export function getGuide(slug: string, locale: string = "en-US"): Guide | undefined {
  if (!(GUIDE_SLUGS as readonly string[]).includes(slug)) return undefined;
  return compose(slug as GuideSlug, asLocale(locale));
}

/** Word count of a guide's prose (blocks + FAQ) — drives reading time. */
export function guideWordCount(guide: Guide): number {
  // CJK scripts have no word spaces, so split-on-whitespace under-counts badly.
  // Count CJK codepoints individually (~2 chars ≈ one "word" at ~200 wpm) and
  // whitespace-split the rest, so reading time is reasonable in every locale.
  const CJK = /[぀-ヿ㐀-鿿가-힯]/g;
  const countWords = (s: string): number => {
    const trimmed = s.trim();
    if (!trimmed) return 0;
    const cjk = trimmed.match(CJK)?.length ?? 0;
    const latin = trimmed.replace(CJK, " ").split(/\s+/).filter(Boolean).length;
    return latin + Math.ceil(cjk / 2);
  };
  let words = countWords(guide.title) + countWords(guide.description);
  for (const block of guide.blocks) {
    if (block.type === "p" || block.type === "h2" || block.type === "h3") {
      words += countWords(block.text);
    } else if (block.type === "ul" || block.type === "ol") {
      for (const item of block.items) words += countWords(item);
    } else if (block.type === "cta") {
      words += countWords(block.label);
    }
  }
  for (const item of guide.faq ?? []) words += countWords(item.q) + countWords(item.a);
  return words;
}

/** Estimated reading time in minutes (≥ 1), at ~200 words/minute. */
export function guideReadingMinutes(guide: Guide): number {
  return Math.max(1, Math.round(guideWordCount(guide) / 200));
}
