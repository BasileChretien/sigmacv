import type { Locale } from "@/lib/i18n";
import type { AnyLandingPageId } from "@/lib/i18n/landingAll";
import { EXAMPLE_CONTENT } from "./examplesContent";

/**
 * The `/examples` gallery (C5): illustrative academic-CV examples by field and
 * career stage — high-intent, linkable pages ("academic CV example", "PhD CV
 * example", "[field] CV") that double as a live look at what SigmaCV produces.
 *
 * Each example is an ILLUSTRATIVE, FICTIONAL CV: a made-up researcher with
 * fabricated publications (never a real person/paper/DOI), shown with a visible
 * disclaimer. English-first (a CV's structure is largely language-agnostic); an
 * example written in another language sets `locale` on its meta and the page
 * chrome follows it (`src/lib/i18n/examplesChrome.ts`). Structure (slug, field,
 * stage, cross-links) lives here in `EXAMPLE_META`; the prose lives in
 * `examplesContent.ts` (one module per non-English example, e.g. `examplesContentFrq.ts`).
 */

export const EXAMPLE_SLUGS = [
  "grad-school-cv-biology",
  "phd-cv-computer-science",
  "phd-cv-psychology",
  "postdoc-cv-economics",
  "postdoc-cv-chemistry",
  "faculty-cv-physics",
  "faculty-cv-history",
  "research-cv-public-health",
  "cv-frq-pharmacologie",
] as const;
export type ExampleSlug = (typeof EXAMPLE_SLUGS)[number];

/** One CV section as shown in the example (title + pre-formatted lines). */
export interface ExampleSection {
  title: string;
  items: string[];
}

/** The fictional researcher's header block. */
export interface ExamplePerson {
  name: string;
  credentials: string;
  headline: string;
  affiliation: string;
  location: string;
}

/** The localized (English) prose of an example — generated into examplesContent.ts. */
export interface ExampleContent {
  metaTitle: string;
  metaDescription: string;
  navLabel: string;
  heading: string;
  intro: string[];
  person: ExamplePerson;
  citationStyle: string;
  templateLabel: string;
  /** Replaces the generated "field · stage · citations · template" byline when
   *  the example's language needs its own wording (the meta labels are English). */
  byline?: string;
  /** Official documents the example follows (funder instructions, template), shown under the
   *  intro. An internal href is written unprefixed ("/guides/x") and localized to the example's
   *  language at render, like every other internal link. */
  sources?: readonly { label: string; href: string }[];
  sections: ExampleSection[];
}

/** Locale-invariant structure for an example. */
export interface ExampleMeta {
  slug: ExampleSlug;
  /** Field label for the index card / grouping, e.g. "Computer Science". */
  field: string;
  /** Career-stage label, e.g. "PhD candidate". */
  stage: string;
  /** Hub-and-spoke cross-links to the relevant persona / landing pages. */
  related: readonly AnyLandingPageId[];
  /** Language of the CV content and of the page chrome (default en-US). */
  locale?: Locale;
}

export const EXAMPLE_META: Record<ExampleSlug, ExampleMeta> = {
  "grad-school-cv-biology": {
    slug: "grad-school-cv-biology",
    field: "Biology",
    stage: "Master's / PhD applicant",
    related: ["grad-school-cv", "academic-cv-template", "orcid-to-cv"],
  },
  "phd-cv-computer-science": {
    slug: "phd-cv-computer-science",
    field: "Computer Science",
    stage: "PhD candidate",
    related: ["phd-cv", "academic-cv-template", "publication-list"],
  },
  "phd-cv-psychology": {
    slug: "phd-cv-psychology",
    field: "Psychology",
    stage: "PhD candidate",
    related: ["phd-cv", "academic-cv-template", "orcid-to-cv"],
  },
  "postdoc-cv-economics": {
    slug: "postdoc-cv-economics",
    field: "Economics",
    stage: "Postdoctoral researcher",
    related: ["postdoc-cv", "publication-list", "funder-cv-templates"],
  },
  "postdoc-cv-chemistry": {
    slug: "postdoc-cv-chemistry",
    field: "Chemistry",
    stage: "Postdoctoral researcher",
    related: ["postdoc-cv", "openalex-cv", "publication-list"],
  },
  "faculty-cv-physics": {
    slug: "faculty-cv-physics",
    field: "Physics",
    stage: "Faculty (Associate Professor)",
    related: ["faculty-cv", "funder-cv-templates", "publication-list"],
  },
  "faculty-cv-history": {
    slug: "faculty-cv-history",
    field: "History",
    stage: "Faculty (Professor)",
    related: ["faculty-cv", "academic-cv-template", "publication-list"],
  },
  "research-cv-public-health": {
    slug: "research-cv-public-health",
    field: "Public Health",
    stage: "Research scientist",
    related: ["research-cv", "nih-biosketch", "publication-list"],
  },
  "cv-frq-pharmacologie": {
    slug: "cv-frq-pharmacologie",
    field: "Clinical pharmacology",
    stage: "Early-career faculty (Assistant Professor)",
    related: ["funder-cv-templates", "research-cv", "publication-list"],
    locale: "fr-FR",
  },
};

/** A fully composed example: structure + prose. */
export type CvExample = ExampleMeta & ExampleContent;

function compose(slug: ExampleSlug): CvExample {
  return { ...EXAMPLE_META[slug], ...EXAMPLE_CONTENT[slug] };
}

/** All examples, in gallery order. */
export function listExamples(): CvExample[] {
  return EXAMPLE_SLUGS.map(compose);
}

/** One example by slug, or undefined if unknown. */
export function getExample(slug: string): CvExample | undefined {
  if (!(EXAMPLE_SLUGS as readonly string[]).includes(slug)) return undefined;
  return compose(slug as ExampleSlug);
}
