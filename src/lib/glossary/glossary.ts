import type { GuideBlock } from "@/lib/guides/guides";
import type { LandingPageId } from "@/lib/i18n/landingPages";

/**
 * The `/glossary` surface: short, indexable "what is X" concept pages for the
 * entities that matter to an academic CV (ORCID, OpenAlex, FWCI, the h-index,
 * CSL, the NIH biosketch). They win "what is …" queries and are exactly the kind
 * of clear, sourced definition LLMs cite. English-first (like guides); each term
 * is emitted as schema.org `DefinedTerm` within a `DefinedTermSet`.
 *
 * Content reuses the safe, typed `GuideBlock` model (no markdown/MDX, no raw
 * HTML) and the shared `renderContentBlock` renderer.
 */
export interface GlossaryTerm {
  /** URL slug: /glossary/{slug}. */
  slug: string;
  /** The term itself (DefinedTerm.name), e.g. "ORCID". */
  term: string;
  /** One-sentence definition — the DefinedTerm.description + the visible lede. */
  short: string;
  /** Page <title> + H1, e.g. "What is ORCID?". */
  title: string;
  /** Meta description. */
  description: string;
  /** Body, rendered in order. */
  blocks: GuideBlock[];
  faq?: { q: string; a: string }[];
  /** Cross-links (other glossary slugs / landing ids / guide slugs). */
  relatedTerms?: string[];
  relatedPages?: LandingPageId[];
  relatedGuides?: string[];
}

const GLOSSARY: GlossaryTerm[] = [
  {
    slug: "orcid",
    term: "ORCID",
    title: "What is ORCID?",
    short:
      "ORCID is a free, unique, persistent digital identifier that distinguishes you from every other researcher and links you to your work.",
    description:
      "ORCID (Open Researcher and Contributor ID) is a free, persistent identifier that distinguishes researchers and links them to their publications. Here's what it is and why it matters for your academic CV.",
    blocks: [
      {
        type: "p",
        text: "ORCID — short for Open Researcher and Contributor ID — is a free, unique, persistent digital identifier for researchers, provided by the non-profit ORCID organisation at orcid.org. Your ORCID iD is a 16-digit number (for example, 0000-0002-1825-0097) that stays with you for your whole career.",
      },
      {
        type: "p",
        text: "Its purpose is disambiguation: it reliably distinguishes you from other researchers with the same or similar names, and it follows you across job moves, name changes and different publishers. Journals, funders and institutions increasingly use ORCID to connect you to your contributions automatically.",
      },
      {
        type: "h2",
        id: "why-it-matters",
        text: "Why ORCID matters for your CV",
      },
      {
        type: "p",
        text: "ORCID is the reliable anchor for an academic CV. Because it is an identifier rather than a name, tools can pull your verified publications and link your work without the false matches that plague name-based searches — which matters most for common names and names in non-Latin scripts.",
      },
      {
        type: "h2",
        id: "sigmacv",
        text: "How SigmaCV uses ORCID",
      },
      {
        type: "p",
        text: "You sign in to SigmaCV with your ORCID iD. It reads your public ORCID record, resolves your OpenAlex author profile, and assembles your CV — matching your work by identifier, never by name. It only reads public metadata and never writes anything back to ORCID.",
      },
      {
        type: "cta",
        label: "Build your CV from ORCID",
        href: "/orcid-to-cv",
      },
    ],
    faq: [
      {
        q: "Is ORCID free?",
        a: "Yes — registering an ORCID iD at orcid.org is free and takes about a minute.",
      },
    ],
    relatedTerms: ["openalex"],
    relatedPages: ["orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  {
    slug: "openalex",
    term: "OpenAlex",
    title: "What is OpenAlex?",
    short:
      "OpenAlex is a free, open catalogue of the world's scholarly works, authors, institutions and venues, run by the non-profit OurResearch.",
    description:
      "OpenAlex is a free, fully open index of scholarly works, authors and institutions. Here's what it is, how it compares to proprietary databases, and how it powers your CV.",
    blocks: [
      {
        type: "p",
        text: "OpenAlex is a free and fully open catalogue of the global research literature — works, authors, institutions, venues and concepts — built and maintained by the non-profit OurResearch. It indexes hundreds of millions of works and offers an open API and open data, as a successor to the discontinued Microsoft Academic Graph.",
      },
      {
        type: "p",
        text: "It matters because it is an open alternative to proprietary databases like Scopus and Web of Science: anyone can use it, and it underpins discovery and citation analysis without a paywall or licence restriction.",
      },
      {
        type: "h2",
        id: "your-cv",
        text: "OpenAlex and your CV",
      },
      {
        type: "p",
        text: "For an academic CV, OpenAlex is a broad, open source of your publications and their citation data, linked to you by your OpenAlex author identifier.",
      },
      {
        type: "h2",
        id: "sigmacv",
        text: "How SigmaCV uses OpenAlex",
      },
      {
        type: "p",
        text: "SigmaCV resolves your OpenAlex author ID from your ORCID iD, imports your works, and — only if you opt in — derives field-normalized metrics from OpenAlex data, default off and DORA-aligned.",
      },
      {
        type: "cta",
        label: "Build your CV from OpenAlex",
        href: "/openalex-cv",
      },
    ],
    faq: [
      {
        q: "Is OpenAlex free?",
        a: "Yes — OpenAlex is fully open, with a free API and an open data licence.",
      },
    ],
    relatedTerms: ["orcid", "fwci"],
    relatedPages: ["openalex-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  {
    slug: "fwci",
    term: "FWCI",
    title: "What is the Field-Weighted Citation Impact (FWCI)?",
    short:
      "The Field-Weighted Citation Impact (FWCI) compares a work's citations to the world average for works of the same field, type and year — so 1.0 means exactly average.",
    description:
      "The Field-Weighted Citation Impact (FWCI) is a field-normalized citation metric where 1.0 is the world average. Here's what it means and how to use it responsibly on a CV.",
    blocks: [
      {
        type: "p",
        text: "The Field-Weighted Citation Impact (FWCI) is a citation metric that compares the citations a work has received to the average for works of the same field, type and publication year. A value of 1.0 means a work was cited exactly as often as expected; 2.0 means twice as often.",
      },
      {
        type: "p",
        text: "Field-normalization matters because citation rates differ enormously between fields — a highly cited mathematics paper and a highly cited biomedical paper have very different raw counts. FWCI puts them on a comparable scale.",
      },
      {
        type: "h2",
        id: "vs-h-index",
        text: "FWCI vs the h-index and raw counts",
      },
      {
        type: "p",
        text: "Unlike the h-index or raw citation counts, FWCI is comparable across disciplines and career stages, which makes it a more defensible indicator. It is still imperfect and should be read with context, not as a single verdict on quality.",
      },
      {
        type: "h2",
        id: "on-your-cv",
        text: "Using FWCI on your CV (responsibly)",
      },
      {
        type: "p",
        text: "If you include metrics on a CV, a field-normalized indicator like FWCI is more responsible than a journal Impact Factor or a bare h-index — but DORA and the Leiden Manifesto are clear that metrics should support, not replace, expert judgement. SigmaCV keeps metrics off by default, opt-in, and field-normalized.",
      },
      {
        type: "cta",
        label: "Read: using metrics responsibly",
        href: "/guides/responsible-metrics-on-an-academic-cv",
      },
    ],
    faq: [
      {
        q: "What does an FWCI of 1.0 mean?",
        a: "Exactly the world average: the work has been cited as often as similar works (same field, type and year). Above 1.0 is above average.",
      },
    ],
    relatedTerms: ["h-index", "openalex"],
    relatedPages: ["openalex-cv"],
    relatedGuides: ["responsible-metrics-on-an-academic-cv"],
  },
  {
    slug: "h-index",
    term: "h-index",
    title: "What is the h-index?",
    short:
      "The h-index is the largest number h such that you have h publications each cited at least h times.",
    description:
      "The h-index is a researcher-level metric combining output and citations — but it has real limits. Here's what it measures and how to treat it on a CV.",
    blocks: [
      {
        type: "p",
        text: "The h-index is a single number that tries to capture both how much you publish and how often you are cited: it is the largest number h for which you have h publications that have each been cited at least h times. An h-index of 10 means you have 10 papers with at least 10 citations each.",
      },
      {
        type: "h2",
        id: "limits",
        text: "The limits of the h-index",
      },
      {
        type: "p",
        text: "The h-index depends heavily on field and career length: it grows over time and is far higher in fast-citing fields, so it is not comparable across disciplines or between researchers at different stages. It also undervalues early-career work and can be inflated.",
      },
      {
        type: "h2",
        id: "on-your-cv",
        text: "Should you put your h-index on a CV?",
      },
      {
        type: "p",
        text: "It is optional and field-dependent. If you include it, give context and pair it with field-normalized indicators rather than presenting it alone — and remember that DORA and the Leiden Manifesto discourage over-reliance on any single number. SigmaCV's metrics are opt-in and prefer field-normalized indicators.",
      },
      {
        type: "cta",
        label: "Read: using metrics responsibly",
        href: "/guides/responsible-metrics-on-an-academic-cv",
      },
    ],
    faq: [
      {
        q: "Is the h-index a good measure of research quality?",
        a: "It is a rough proxy at best: it depends heavily on field and career length and is not comparable across disciplines. Field-normalized indicators are more defensible, and metrics should support, not replace, expert judgement.",
      },
    ],
    relatedTerms: ["fwci"],
    relatedGuides: ["responsible-metrics-on-an-academic-cv"],
  },
  {
    slug: "csl",
    term: "CSL",
    title: "What is the Citation Style Language (CSL)?",
    short:
      "The Citation Style Language (CSL) is an open standard for describing citation and bibliography formats, used by Zotero, Mendeley and many other tools.",
    description:
      "The Citation Style Language (CSL) is the open standard behind consistent citations in tools like Zotero. Here's what it is and why it keeps your CV's references identical everywhere.",
    blocks: [
      {
        type: "p",
        text: "The Citation Style Language (CSL) is an open, XML-based standard that describes how citations and bibliographies should be formatted. Thousands of styles — APA, Vancouver, Chicago, IEEE and many journal-specific formats — are defined in the open CSL styles repository, and tools such as Zotero and Mendeley use them.",
      },
      {
        type: "p",
        text: "Its value is consistency: one machine-readable definition of a style means every reference is formatted the same way, and you can switch styles instantly without reformatting anything by hand.",
      },
      {
        type: "h2",
        id: "your-cv",
        text: "CSL and your CV",
      },
      {
        type: "p",
        text: "Formatting every reference on your CV through a single CSL style is what keeps your Word, PDF and LaTeX versions identical — the most common formatting failure on academic CVs is mixing styles or hand-formatting references inconsistently.",
      },
      {
        type: "h2",
        id: "sigmacv",
        text: "How SigmaCV uses CSL",
      },
      {
        type: "p",
        text: "SigmaCV formats every citation through CSL (via citeproc-js), so you can pick any supported style and your publication list reads identically across every export format.",
      },
      {
        type: "cta",
        label: "Generate a formatted publication list",
        href: "/publication-list",
      },
    ],
    faq: [
      {
        q: "Can I change citation styles easily with CSL?",
        a: "Yes — that's the point. Choose any CSL style and every reference reformats consistently across all your CV's output formats.",
      },
    ],
    relatedTerms: ["orcid"],
    relatedPages: ["publication-list", "latex-cv"],
    relatedGuides: ["how-to-list-publications-on-a-cv"],
  },
  {
    slug: "nih-biosketch",
    term: "NIH biosketch",
    title: "What is an NIH biosketch?",
    short:
      "An NIH biosketch is a short, structured CV the US National Institutes of Health requires in grant applications, highlighting your contributions to science and selected publications.",
    description:
      "An NIH biosketch is a short, structured CV required in NIH grant applications. Here's what it includes, how it differs from a full academic CV, and how to draft one.",
    blocks: [
      {
        type: "p",
        text: 'An NIH biosketch is a short, structured CV that the US National Institutes of Health requires in grant applications. It is typically limited to five pages and has set sections: education and training, positions and honours, an optional personal statement, and a "contributions to science" section that highlights a handful of contributions, each with up to four supporting publications.',
      },
      {
        type: "p",
        text: "Its structure is deliberate: rather than an exhaustive list, it asks you to tell the story of your most important contributions and their impact.",
      },
      {
        type: "h2",
        id: "vs-cv",
        text: "Biosketch vs a full academic CV",
      },
      {
        type: "p",
        text: "A biosketch is much shorter and more narrative than a full academic CV, and it follows NIH's specific format. The practical approach is to keep a complete CV and derive the biosketch from it for each application.",
      },
      {
        type: "h2",
        id: "sigmacv",
        text: "How SigmaCV helps",
      },
      {
        type: "p",
        text: "SigmaCV drafts an NIH-style biosketch from your ORCID and OpenAlex record: your publications are pulled in automatically, and you curate the contributions and selected publications before exporting.",
      },
      {
        type: "cta",
        label: "Generate an NIH biosketch",
        href: "/nih-biosketch",
      },
    ],
    faq: [
      {
        q: "How long is an NIH biosketch?",
        a: "Typically up to five pages. Always follow the current NIH instructions and forms for your specific funding opportunity.",
      },
    ],
    relatedTerms: [],
    relatedPages: ["nih-biosketch", "funder-cv-templates"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
];

/** All glossary slugs (for static params + validation). */
export const GLOSSARY_SLUGS: string[] = GLOSSARY.map((t) => t.slug);

/** Terms, alphabetical by display name (for the index). */
export function listTerms(): GlossaryTerm[] {
  return [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
}

/** One term by slug, or undefined if unknown. */
export function getTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}
