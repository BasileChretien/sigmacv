import type { LandingPageId } from "@/lib/i18n/landingPages";

/**
 * The `/guides` surface: long-form, indexable, LLM-citable cornerstone content
 * about academic CVs. English-first by design — these are authority articles and
 * the target head terms are English; per-locale translation is a later phase (I1
 * in the discoverability roadmap), so guides are NOT part of the forced 10-locale
 * i18n system.
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

export interface Guide {
  /** URL slug: /guides/{slug}. */
  slug: string;
  /** H1 + <title> (the layout appends " — SigmaCV"). */
  title: string;
  /** Meta description + the visible lede. */
  description: string;
  /** ISO date (YYYY-MM-DD). */
  datePublished: string;
  /** ISO date (YYYY-MM-DD); ≥ datePublished. */
  dateModified: string;
  /** The body, rendered in order. */
  blocks: GuideBlock[];
  /** Optional FAQ → rendered visibly + as FAQPage JSON-LD. */
  faq?: GuideFaqItem[];
  /** Cross-links to SEO landing pages (hub-and-spoke). */
  relatedPages?: LandingPageId[];
  /** Cross-links to other guides (by slug). */
  relatedGuides?: string[];
}

/** Author of the guides — surfaced in the byline + Article JSON-LD (E-E-A-T). */
export const GUIDE_AUTHOR = {
  name: "Basile Chrétien",
  credentials: "PharmD, MSc, MPH",
  orcid: "https://orcid.org/0000-0002-7483-2489",
} as const;

const GUIDES: Guide[] = [
  {
    slug: "how-to-write-an-academic-cv",
    title: "How to write an academic CV",
    description:
      "A practical guide to writing an academic CV: what to include, how to order and format each section, how long it should be, how to list publications, and how conventions differ by career stage and country.",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    blocks: [
      {
        type: "p",
        text: "An academic CV (curriculum vitae) is the standard document for applying to research and teaching posts, graduate programmes, fellowships, and grants. Unlike a one- or two-page résumé, it is a complete, evolving record of your scholarly life — your education, publications, funding, teaching, and service — and it keeps growing throughout your career.",
      },
      {
        type: "p",
        text: "This guide covers what to include, how to order and format each section, how long an academic CV should be, how to list publications, and how the conventions differ by career stage and country. If you would rather not assemble it by hand, you can build one automatically from your ORCID record — see the last section.",
      },
      {
        type: "h2",
        id: "what-is-an-academic-cv",
        text: "What is an academic CV?",
      },
      {
        type: "p",
        text: "A CV is a comprehensive academic biography. Its job is to document the full breadth of your scholarly contributions so that a hiring committee, funder, or admissions panel can assess your record. Where a résumé is tailored and trimmed to a single role, an academic CV is exhaustive and cumulative: you add to it over time and rarely remove anything.",
      },
      {
        type: "p",
        text: "Because it is read by specialists, an academic CV favours completeness and accuracy over brevity. Clear structure, consistent formatting, and correctly formatted citations matter more than visual flourish.",
      },
      {
        type: "h2",
        id: "core-sections",
        text: "What to include: the core sections",
      },
      {
        type: "p",
        text: "Most academic CVs are built from the same building blocks. Include the sections relevant to your field and career stage, and omit those you have nothing to put in yet:",
      },
      {
        type: "ul",
        items: [
          "Header — name, current position, and professional contact details (and your ORCID iD).",
          "Research interests / summary — a few lines framing your work (optional, more common earlier in a career).",
          "Education — degrees in reverse-chronological order, with institution, dates, and thesis title.",
          "Appointments / positions — academic and relevant professional roles.",
          "Publications — the centrepiece for most research roles (see below).",
          "Grants & funding — awarded funding, with funder, title, amount, and dates.",
          "Awards & honours — fellowships, prizes, and distinctions.",
          "Teaching — courses taught, guest lectures, and teaching roles.",
          "Supervision & mentoring — students and trainees supervised.",
          "Presentations — invited talks, conference papers, and posters.",
          "Service — peer review, editorial roles, committees, and outreach.",
          "Professional memberships, skills, and references — as relevant to your field.",
        ],
      },
      {
        type: "h3",
        text: "Ordering the sections",
      },
      {
        type: "p",
        text: "After the header, education, and positions, lead with whatever is strongest for the role you are applying to. For research-intensive posts and grants, put publications and funding high; for teaching-focused roles, bring teaching and supervision up. Tailor the order to the reader without inventing or padding content.",
      },
      {
        type: "h2",
        id: "list-publications",
        text: "How to list publications",
      },
      {
        type: "p",
        text: "The publication list is where most committees spend their time, so make it easy to scan and impossible to misread:",
      },
      {
        type: "ul",
        items: [
          "List works in reverse-chronological order, optionally grouped by type (journal articles, preprints, book chapters, conference papers, datasets, software).",
          "Use one consistent citation style throughout, and keep it identical across every version of your CV.",
          "Highlight your own name in each author list so your contribution is visible at a glance.",
          "Include DOIs (and links) so readers can find the work.",
          "Mark works that are under review, in press, or preprints clearly and honestly.",
          "Do not pad the list — quality and relevance read better than volume.",
        ],
      },
      {
        type: "p",
        text: "Consistency is the most common failure point. Formatting every reference through a single citation style — the Citation Style Language (CSL) is the standard behind tools like Zotero — guarantees your Word, PDF, and LaTeX CVs all read identically.",
      },
      {
        type: "h2",
        id: "how-long",
        text: "How long should an academic CV be?",
      },
      {
        type: "p",
        text: "There is no fixed page limit — an academic CV is as long as your record justifies, and it grows over time. As a rough guide: a master's or PhD applicant might have 2–4 pages, a postdoc 3–6, and a senior professor well beyond ten. The exception is funder and job \"short CVs\", which often cap length (e.g. two pages) or use a narrative format such as the NIH biosketch, UKRI's Résumé for Research and Innovation (R4RI), or an ERC CV. When a call specifies a format or page limit, follow it exactly.",
      },
      {
        type: "h2",
        id: "by-career-stage",
        text: "Tailoring by career stage",
      },
      {
        type: "ul",
        items: [
          "Students & grad-school applicants — emphasise education, your thesis or research project, any publications or presentations, relevant skills, and references; it is fine to be short.",
          "PhD students & postdocs — lead with publications, conference activity, funding/fellowships, and teaching; keep it current for rolling job and grant deadlines.",
          "Faculty & principal investigators — foreground grants, publications, supervision, and service/leadership; expect a long, sectioned document and a separate short CV for funders.",
        ],
      },
      {
        type: "h2",
        id: "country-differences",
        text: "Formatting and country differences",
      },
      {
        type: "p",
        text: 'Conventions vary. In the US and Canada an academic "CV" is the long scholarly document (a "résumé" is the short industry version), while in much of Europe "CV" can mean either. Some countries expect a photo, date of birth, or nationality; many others — and most US/UK academic contexts — deliberately omit personal details to reduce bias. European applicants sometimes use the Europass format, and major funders increasingly require their own narrative CVs. When in doubt, match the norms of the country and institution you are applying to.',
      },
      {
        type: "h2",
        id: "common-mistakes",
        text: "Common mistakes to avoid",
      },
      {
        type: "ul",
        items: [
          "Inconsistent formatting or mixing several citation styles in one document.",
          "Padding the publication list or burying your most important work.",
          "Letting the CV go stale between applications.",
          "Ignoring a call's required format or page limit.",
          "Relying on a name match for your publications — common and non-Latin-script names are easily confused with someone else's work.",
          "Typos and broken links — proofread, and check every DOI resolves.",
        ],
      },
      {
        type: "h2",
        id: "build-automatically",
        text: "Build your academic CV automatically",
      },
      {
        type: "p",
        text: "Keeping an academic CV current is repetitive, manual work. SigmaCV (free and open source) builds it for you from your ORCID and OpenAlex record — matching your work by identifier, never by name — formats every citation consistently, and exports to PDF, Word, LaTeX, Markdown or BibTeX, or a living public page that re-syncs. Metrics are off by default and field-normalized, in line with DORA, and your data stays yours (per-field consent, export, deletion).",
      },
      {
        type: "cta",
        label: "Build your academic CV free",
        href: "/",
      },
    ],
    faq: [
      {
        q: "How long should an academic CV be?",
        a: 'There is no fixed limit; it grows with your record. A PhD applicant is often 2–4 pages, a postdoc 3–6, and a senior academic much longer. Funder/job "short CVs" may cap length or require a narrative format (e.g. NIH biosketch, UKRI R4RI, ERC) — always follow the call\'s rules.',
      },
      {
        q: "What is the difference between an academic CV and a résumé?",
        a: "An academic CV is a complete, cumulative record of your scholarly life (education, publications, funding, teaching, service) and can run many pages; a résumé is a short, tailored, one- to two-page document for non-academic roles.",
      },
      {
        q: "How should I list publications on an academic CV?",
        a: "List them in reverse-chronological order, optionally grouped by type, in one consistent citation style, with your own name highlighted and DOIs included. Mark preprints and under-review work clearly, and don't pad the list.",
      },
      {
        q: "Can I generate an academic CV automatically?",
        a: "Yes. SigmaCV builds an academic CV from your ORCID and OpenAlex record (matched by identifier, not name), formats the citations, and exports to PDF, DOCX, LaTeX, Markdown or BibTeX — free and open source.",
      },
    ],
    relatedPages: ["academic-cv-template", "orcid-to-cv", "publication-list"],
    relatedGuides: ["academic-cv-vs-resume"],
  },
  {
    slug: "academic-cv-vs-resume",
    title: "Academic CV vs résumé: what's the difference?",
    description:
      "Academic CV vs résumé — how they differ in length, scope, and purpose, and which one to use for academic jobs, grad-school applications, grants, and industry roles.",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    blocks: [
      {
        type: "p",
        text: '"CV" and "résumé" are often used interchangeably, but in academia they are different documents with different jobs. Choosing the right one — and formatting it correctly — matters for academic job, fellowship, and grant applications.',
      },
      {
        type: "p",
        text: "An academic CV (curriculum vitae) is a complete, cumulative record of your scholarly life: education, publications, funding, teaching, presentations, and service. A résumé is a short, highly tailored summary — usually one or two pages — aimed at a specific non-academic role.",
      },
      {
        type: "h2",
        id: "key-differences",
        text: "The key differences",
      },
      {
        type: "ul",
        items: [
          "Length — a CV grows without a fixed limit (often several pages); a résumé is trimmed to one or two.",
          "Scope — a CV documents everything relevant to your scholarship; a résumé includes only what's relevant to the target job.",
          "Audience — a CV is read by academic peers and committees; a résumé by recruiters and hiring managers.",
          "Stability — you add to a CV over time and rarely cut; you rewrite a résumé for each application.",
          "Publications & funding — central to a CV; usually condensed or omitted on a résumé.",
        ],
      },
      {
        type: "h2",
        id: "which-to-use",
        text: "Which one should you use?",
      },
      {
        type: "ul",
        items: [
          "Academic jobs, postdocs, PhD/grad-school applications, fellowships, and grants → an academic CV.",
          "Industry and most non-academic roles → a résumé, tailored to the posting.",
          '"Alt-ac" and research-adjacent industry roles → often a hybrid: a résumé-length document that still highlights relevant research output.',
        ],
      },
      {
        type: "h2",
        id: "converting",
        text: "Converting a CV into a résumé",
      },
      {
        type: "p",
        text: "To turn an academic CV into a résumé, lead with a short summary, keep only the most relevant experience and a handful of representative outputs, translate academic achievements into impact and transferable skills, and cut to one or two pages. Keep the full CV as your master record and derive shorter documents from it.",
      },
      {
        type: "h2",
        id: "build-either",
        text: "Build either from your research record",
      },
      {
        type: "p",
        text: "SigmaCV builds an academic CV from your ORCID and OpenAlex record and exports it in a range of formats and one-click layouts — so you can keep one canonical record and produce the version each application needs. It's free, open source, and privacy-first.",
      },
      {
        type: "cta",
        label: "Build your academic CV free",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Is a CV the same as a résumé?",
        a: "Not in academia. An academic CV is a long, complete record of your scholarship; a résumé is a short, tailored one- to two-page document for non-academic roles. Outside academia, and in some countries, the two terms are used more loosely.",
      },
      {
        q: "Do I need a photo on an academic CV?",
        a: "It depends on the country. Some countries expect a photo and personal details; many academic contexts (especially the US and UK) deliberately omit them to reduce bias. Match the norms of where you're applying.",
      },
    ],
    relatedPages: ["academic-cv-template", "orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
];

/** All guide slugs (for static params + validation). */
export const GUIDE_SLUGS: string[] = GUIDES.map((g) => g.slug);

/** Guides, newest first (for the index page). */
export function listGuides(): Guide[] {
  return [...GUIDES].sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

/** One guide by slug, or undefined if unknown. */
export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** Word count of a guide's prose (blocks + FAQ) — drives reading time. */
export function guideWordCount(guide: Guide): number {
  const countWords = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;
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
