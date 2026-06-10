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
    relatedGuides: [
      "academic-cv-vs-resume",
      "how-to-list-publications-on-a-cv",
      "how-long-should-an-academic-cv-be",
    ],
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
  {
    slug: "how-to-list-publications-on-a-cv",
    title: "How to list publications on an academic CV",
    description:
      "How to format and order the publications section of an academic CV: citation style, grouping by type, author order, highlighting your own name, preprints and under-review work, and what to avoid.",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    blocks: [
      {
        type: "p",
        text: "For most academic roles the publications section is the part of your CV that committees read most closely, so how you present it matters almost as much as what's in it. This guide covers citation style, ordering and grouping, making your own contribution clear, how to handle preprints and under-review work, and the mistakes that undermine an otherwise strong list.",
      },
      {
        type: "h2",
        id: "citation-style",
        text: "Choose one citation style — and keep it",
      },
      {
        type: "p",
        text: "Pick a citation style appropriate to your field (for example APA, Vancouver, Chicago, or IEEE) and apply it to every entry. The single most common failure is mixing styles or formatting references by hand so that no two look quite alike. Formatting the whole list through one engine — the Citation Style Language (CSL), the standard behind reference managers like Zotero — guarantees consistency across your PDF, Word, and LaTeX CVs.",
      },
      {
        type: "h2",
        id: "order-and-grouping",
        text: "Order and group your publications",
      },
      {
        type: "ul",
        items: [
          "List works in reverse-chronological order (newest first).",
          "Group by type when the list is long: peer-reviewed journal articles, preprints, book chapters, conference papers, datasets and software.",
          "Keep the groups clearly labelled and separated so a reader can find peer-reviewed work instantly.",
          "Be consistent about numbering — number every entry or none.",
        ],
      },
      {
        type: "h2",
        id: "your-contribution",
        text: "Make your own contribution clear",
      },
      {
        type: "ul",
        items: [
          "Highlight your own name (e.g. in bold) in every author list.",
          "Mark first-author, corresponding-author, and equal-contribution roles with a clear, explained notation.",
          "Remember that author-order conventions differ by field — add a one-line note if your field's convention isn't obvious.",
        ],
      },
      {
        type: "h2",
        id: "status",
        text: "Preprints, under review, and in press",
      },
      {
        type: "p",
        text: 'List work honestly with its status. Preprints are increasingly accepted on CVs but should be labelled as preprints, and "under review" or "in press" items should say so. Never present non-peer-reviewed work as peer-reviewed, and don\'t list the same paper twice (e.g. as both a preprint and the published version) without making the relationship clear.',
      },
      {
        type: "h2",
        id: "identifiers",
        text: "Include identifiers and links",
      },
      {
        type: "p",
        text: "Add a DOI (and a link) to each work so readers can find it, and put your ORCID iD in your header. Identifiers also let tools verify your authorship reliably — by identifier rather than by name, which matters for common and non-Latin-script names.",
      },
      {
        type: "h2",
        id: "avoid",
        text: "What to avoid",
      },
      {
        type: "ul",
        items: [
          "Mixing citation styles within one document.",
          "Padding the list with minor or unrelated items.",
          "Inconsistent forms of your own name across entries.",
          "Broken or missing DOIs — check that every link resolves.",
        ],
      },
      {
        type: "h2",
        id: "automate",
        text: "Generate a formatted publication list automatically",
      },
      {
        type: "p",
        text: "SigmaCV pulls your publications from ORCID and OpenAlex (matched by identifier, not name), formats them in any CSL style with your own name highlighted, and exports the list to PDF, Word, LaTeX, Markdown or BibTeX — so every version of your CV is consistent and correct.",
      },
      {
        type: "cta",
        label: "Generate your publication list free",
        href: "/",
      },
    ],
    faq: [
      {
        q: "What citation style should I use for my CV's publications?",
        a: "Use the style normal for your field (e.g. APA, Vancouver, Chicago, IEEE). What matters most is applying one style consistently across the whole list and every format of your CV.",
      },
      {
        q: "Should I include preprints on my CV?",
        a: "Yes — preprints are increasingly accepted — but label them clearly as preprints and keep them separate from peer-reviewed articles.",
      },
      {
        q: "How do I show co-first or equal authorship?",
        a: 'Mark the relevant authors with a symbol and explain it in a short legend (e.g. "* equal contribution"). Be consistent throughout the list.',
      },
    ],
    relatedPages: ["publication-list", "orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  {
    slug: "how-long-should-an-academic-cv-be",
    title: "How long should an academic CV be?",
    description:
      "How long an academic CV should be by career stage, when length is capped (funder and job short CVs), and why longer isn't better — plus how to keep one master CV and export shorter versions.",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    blocks: [
      {
        type: "p",
        text: "The short answer: an academic CV is as long as your record justifies, and it grows over your career. Unlike a résumé, there is no expectation that it fits on one or two pages. But length depends on career stage and context, and there are important exceptions.",
      },
      {
        type: "h2",
        id: "by-stage",
        text: "Rules of thumb by career stage",
      },
      {
        type: "ul",
        items: [
          "Master's / PhD applicant — roughly 2–4 pages.",
          "PhD student / postdoc — roughly 3–6 pages.",
          "Mid-career — often 6–10+ pages.",
          "Senior faculty — well beyond ten pages; the publication and funding record drives the length.",
        ],
      },
      {
        type: "p",
        text: "These are guidelines, not rules. A strong, well-organised four-page CV beats a padded eight-page one.",
      },
      {
        type: "h2",
        id: "capped",
        text: "When length is capped",
      },
      {
        type: "p",
        text: 'Many funders and employers ask for a "short CV" with a strict page limit (often two pages), or a structured narrative format such as the NIH biosketch, UKRI\'s Résumé for Research and Innovation (R4RI), an ERC CV, or the Swiss SNSF format. When a call specifies a length or format, follow it exactly — exceeding the limit can get an application rejected unread.',
      },
      {
        type: "h2",
        id: "quality",
        text: "Longer isn't better",
      },
      {
        type: "p",
        text: "Completeness is expected, but padding is not. Include what is relevant, order it so your strongest material is easy to find, and cut filler. Reviewers reward clarity and relevance, not page count.",
      },
      {
        type: "h2",
        id: "master-cv",
        text: "Keep a master CV, export shorter versions",
      },
      {
        type: "p",
        text: 'The practical approach is to maintain one complete "master" CV and derive shorter or funder-specific versions from it. SigmaCV does this from a single canonical record: keep everything in one place, then apply a one-click layout (NIH, NSF, ERC, UKRI R4RI, and more) or trim sections for a specific call, reversibly, and export.',
      },
      {
        type: "cta",
        label: "Build your academic CV free",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Is there a page limit for an academic CV?",
        a: 'Generally no — a full academic CV is as long as your record justifies. The exception is funder/job "short CVs", which often cap length or require a narrative format; always follow the call\'s instructions.',
      },
      {
        q: "How long should a PhD-application CV be?",
        a: "Usually about 2–4 pages. At that stage, clear research experience and a few representative outputs matter more than length.",
      },
    ],
    relatedPages: ["funder-cv-templates", "academic-cv-template"],
    relatedGuides: ["how-to-write-an-academic-cv", "academic-cv-for-grad-school"],
  },
  {
    slug: "academic-cv-for-grad-school",
    title: "Academic CV for grad-school applications",
    description:
      "What to put on an academic CV for master's, PhD, or grad-school applications when you don't have many publications yet — and how to make a strong impression on an admissions committee.",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    blocks: [
      {
        type: "p",
        text: "If you're applying to a master's or PhD programme and worried your CV looks thin, that's completely normal — admissions committees don't expect a long publication list at this stage. They want evidence of potential: research experience, relevant skills, and a clear trajectory. Here's what to include and how to present it.",
      },
      {
        type: "h2",
        id: "what-to-include",
        text: "What to include",
      },
      {
        type: "ul",
        items: [
          "Education — degrees, institutions, dates, and your GPA or grade if it's strong; include your thesis or capstone title.",
          "Research experience — labs, projects, and theses, with your role, methods, and outcomes.",
          "Publications & presentations — any articles, preprints, posters, or conference talks, however early-stage.",
          "Skills — laboratory, technical, statistical, programming, and languages relevant to the field.",
          "Awards & scholarships — academic distinctions and funding.",
          "Relevant experience — teaching, tutoring, relevant work, or volunteering.",
          "References — or a note that they are available on request.",
        ],
      },
      {
        type: "h2",
        id: "lead-with-research",
        text: "Lead with research experience",
      },
      {
        type: "p",
        text: "Even without publications, research experience is your strongest card. For each project, say what the question was, what you did (techniques, analysis, your specific role), and what came of it. Concrete contributions read far better than a list of course names.",
      },
      {
        type: "h2",
        id: "length-and-format",
        text: "Length and format",
      },
      {
        type: "p",
        text: "A grad-school application CV is usually 2–4 pages. Keep the formatting clean and consistent, use clear section headings, and tailor the emphasis to the programme you're applying to. It's fine to be short — don't pad.",
      },
      {
        type: "h2",
        id: "build",
        text: "Build it from your record",
      },
      {
        type: "p",
        text: "SigmaCV assembles a clean academic CV from your ORCID and open data, so even your first publications, preprints, and posters are formatted correctly and consistently — and you can add anything by DOI. It's free and open source.",
      },
      {
        type: "cta",
        label: "Build your grad-school CV free",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Do I need publications for a grad-school CV?",
        a: "No. At the application stage, research experience, relevant skills, and a clear trajectory matter more than a publication list. Include any preprints or posters you do have, but their absence is expected.",
      },
      {
        q: "How long should a grad-school application CV be?",
        a: "Typically 2–4 pages. Keep it focused: clear research experience and a few representative items beat padding.",
      },
    ],
    relatedPages: ["academic-cv-template", "orcid-to-cv"],
    relatedGuides: ["how-to-write-an-academic-cv", "how-long-should-an-academic-cv-be"],
  },
  {
    slug: "responsible-metrics-on-an-academic-cv",
    title: "Using metrics responsibly on an academic CV (DORA & the Leiden Manifesto)",
    description:
      "How to present research metrics on a CV responsibly: why the Journal Impact Factor and h-index mislead, what field-normalized indicators add, and what DORA and the Leiden Manifesto recommend.",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    blocks: [
      {
        type: "p",
        text: "Metrics are a tempting shorthand on a CV, but they are easily misused — and committees increasingly expect researchers to use them responsibly. This guide explains which metrics mislead, which are more defensible, and what the main responsible-assessment frameworks recommend.",
      },
      {
        type: "h2",
        id: "journal-impact-factor",
        text: "Why the Journal Impact Factor is the wrong tool",
      },
      {
        type: "p",
        text: "The Journal Impact Factor (JIF) measures a journal's average citations, not the quality or impact of your individual article. Citation distributions are highly skewed, so a single paper in a high-JIF journal tells a reader almost nothing about that paper. DORA — the San Francisco Declaration on Research Assessment — explicitly advises against using the JIF to assess individual research or researchers.",
      },
      {
        type: "h2",
        id: "h-index",
        text: "The h-index and raw counts have limits",
      },
      {
        type: "p",
        text: "The h-index and raw citation counts depend heavily on field and career length, so they are not comparable across disciplines and disadvantage early-career researchers. They can also be inflated. If you include them, give context; never present them as a stand-alone measure of worth.",
      },
      {
        type: "h2",
        id: "field-normalized",
        text: "Prefer field-normalized indicators",
      },
      {
        type: "p",
        text: "Field-normalized indicators — such as the Field-Weighted Citation Impact (FWCI) or the NIH iCite Relative Citation Ratio (RCR) — account for differences in citation rates between fields and over time, so they are more comparable than raw counts. They are still imperfect and should be read with context, never as the only signal.",
      },
      {
        type: "h2",
        id: "frameworks",
        text: "What DORA and the Leiden Manifesto recommend",
      },
      {
        type: "ul",
        items: [
          "DORA — do not use journal-based metrics (like the JIF) to assess individual contributions; assess research on its own merits.",
          "The Leiden Manifesto — use quantitative indicators to support, not replace, expert judgement; account for field differences; keep data and methods transparent; and avoid misplaced concreteness.",
        ],
      },
      {
        type: "h2",
        id: "practical-advice",
        text: "Practical advice for your CV",
      },
      {
        type: "ul",
        items: [
          "Lead with the work itself — what you did and why it matters — not with numbers.",
          "If you include metrics, prefer field-normalized indicators and give context (field, time window, percentile).",
          "Consider a short narrative description of your key contributions instead of, or alongside, numbers.",
          "Never cite the Journal Impact Factor of the journals your papers appeared in.",
        ],
      },
      {
        type: "h2",
        id: "sigmacv",
        text: "Responsible metrics, by default",
      },
      {
        type: "p",
        text: "SigmaCV is built around this stance: metrics are off by default and opt-in, it prefers field-normalized indicators over raw counts, and it never shows a journal Impact Factor — aligned with DORA. You stay in control of whether any metric appears on your CV at all.",
      },
      {
        type: "cta",
        label: "Build a DORA-aligned CV free",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Should I put my h-index on my CV?",
        a: "It's optional and field-dependent. If you include it, give context and pair it with field-normalized indicators rather than presenting it alone; many committees discourage over-reliance on it.",
      },
      {
        q: "Is it OK to list journal Impact Factors on a CV?",
        a: "It's discouraged. DORA specifically advises against using the Journal Impact Factor to assess individual research, because it measures the journal, not your article.",
      },
    ],
    relatedPages: ["openalex-cv", "academic-cv-template"],
    relatedGuides: ["how-to-write-an-academic-cv"],
  },
  {
    slug: "academic-cv-format-by-country",
    title: "Academic CV format by country",
    description:
      "How academic CV conventions differ by country — the CV/résumé distinction, photos and personal details, length, Europass, and funder narrative formats — and how to adapt yours.",
    datePublished: "2026-06-10",
    dateModified: "2026-06-10",
    blocks: [
      {
        type: "p",
        text: "There is no single global standard for an academic CV. Conventions differ by country and institution — what the document is even called, whether it includes a photo, how long it runs, and which structured format a funder expects. This guide covers the main differences and how to adapt your CV to where you are applying.",
      },
      {
        type: "h2",
        id: "cv-vs-resume",
        text: "The CV / résumé distinction varies",
      },
      {
        type: "p",
        text: 'In the US and Canada, an academic "CV" is the long, complete scholarly document, while a "résumé" is the short one- to two-page version for industry. In the UK and much of Europe, "CV" can mean either, and the academic version is simply understood from context. Match the term and length expected by the country and role you are applying to.',
      },
      {
        type: "h2",
        id: "photos-personal-details",
        text: "Photos and personal details",
      },
      {
        type: "p",
        text: "This is the biggest cross-country difference. In parts of continental Europe, Asia and Latin America, a CV may be expected to include a photo, date of birth, or nationality. In the US and UK, these are deliberately omitted to reduce bias, and including them can work against you. When in doubt, follow the destination country's norm — and never include personal details a specific employer has asked you to leave out.",
      },
      {
        type: "h2",
        id: "length",
        text: "Length expectations",
      },
      {
        type: "p",
        text: "A full academic CV has no fixed page limit and grows with your record, but expectations differ: some European applications favour a more concise CV, while US academic CVs are often exhaustive. Always defer to an explicit page limit when a call or employer specifies one.",
      },
      {
        type: "h2",
        id: "europass",
        text: "Europass and structured formats",
      },
      {
        type: "p",
        text: "In the European Union, the Europass CV is a common structured template, and some institutions request it. Several countries and systems have their own expected layouts. Where a structured format is required, follow it exactly rather than submitting a free-form CV.",
      },
      {
        type: "h2",
        id: "funder-formats",
        text: "Funder narrative CVs by region",
      },
      {
        type: "p",
        text: "Major funders increasingly require their own formats: the UKRI Résumé for Research and Innovation (R4RI) in the UK, the ERC CV in the EU, the SNSF format in Switzerland, and the NIH biosketch or NSF format in the US. These are narrative or tightly structured and differ from a standard CV — prepare them from your full record for each application.",
      },
      {
        type: "h2",
        id: "adapt",
        text: "How to adapt your CV",
      },
      {
        type: "p",
        text: "Keep one complete, canonical CV and derive country- or funder-specific versions from it rather than maintaining several from scratch. SigmaCV builds that canonical CV from your open research record and applies one-click funder layouts (UKRI R4RI, ERC, SNSF, NIH, NSF and more) reversibly, so adapting to a country's expectations is a quick change, not a rewrite.",
      },
      {
        type: "cta",
        label: "Build your academic CV free",
        href: "/",
      },
    ],
    faq: [
      {
        q: "Should I put a photo on my academic CV?",
        a: "It depends on the country. Some countries expect a photo and personal details; the US and UK academic norm is to omit them to reduce bias. Follow the convention of where you're applying.",
      },
      {
        q: "Is an academic CV the same everywhere?",
        a: "No. The term, expected length, inclusion of personal details, and required funder formats all vary by country. Adapt your CV to the destination country and institution.",
      },
    ],
    relatedPages: ["academic-cv-template", "funder-cv-templates"],
    relatedGuides: ["how-to-write-an-academic-cv", "academic-cv-vs-resume"],
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
