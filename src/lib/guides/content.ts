// Localized content for the /guides surface (one entry per locale × slug).
// Structure (block types, heading ids, CTA hrefs) is single-sourced from the
// `GUIDE_META` definition in `guides.ts`; only the prose lives here, so an anchor
// or href can never drift between languages (the parity test in tests/guides.test.ts
// enforces this). Non-English copy was machine-drafted and is flagged for a
// per-locale native-speaker review pass (same convention as `landingContent.ts`).
import type { Locale } from "@/lib/i18n";
import type { GuideContent, GuideSlug } from "./guides";

export const GUIDE_CONTENT: Record<Locale, Record<GuideSlug, GuideContent>> = {
  "en-US": {
    "how-to-write-an-academic-cv": {
      title: "How to write an academic CV",
      description:
        "A practical guide to writing an academic CV: what to include, how to order and format each section, how long it should be, how to list publications, and how conventions differ by career stage and country.",
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
    },
    "academic-cv-vs-resume": {
      title: "Academic CV vs résumé: what's the difference?",
      description:
        "Academic CV vs résumé — how they differ in length, scope, and purpose, and which one to use for academic jobs, grad-school applications, grants, and industry roles.",
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
    },
    "how-to-list-publications-on-a-cv": {
      title: "How to list publications on an academic CV",
      description:
        "How to format and order the publications section of an academic CV: citation style, grouping by type, author order, highlighting your own name, preprints and under-review work, and what to avoid.",
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
    },
    "how-long-should-an-academic-cv-be": {
      title: "How long should an academic CV be?",
      description:
        "How long an academic CV should be by career stage, when length is capped (funder and job short CVs), and why longer isn't better — plus how to keep one master CV and export shorter versions.",
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
    },
    "academic-cv-for-grad-school": {
      title: "Academic CV for grad-school applications",
      description:
        "What to put on an academic CV for master's, PhD, or grad-school applications when you don't have many publications yet — and how to make a strong impression on an admissions committee.",
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
    },
    "responsible-metrics-on-an-academic-cv": {
      title: "Using metrics responsibly on an academic CV (DORA & the Leiden Manifesto)",
      description:
        "How to present research metrics on a CV responsibly: why the Journal Impact Factor and h-index mislead, what field-normalized indicators add, and what DORA and the Leiden Manifesto recommend.",
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
    },
    "academic-cv-format-by-country": {
      title: "Academic CV format by country",
      description:
        "How academic CV conventions differ by country — the CV/résumé distinction, photos and personal details, length, Europass, and funder narrative formats — and how to adapt yours.",
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
    },
  },
  "zh-CN": {
    "how-to-write-an-academic-cv": {
      title: "如何撰写学术简历",
      description:
        "撰写学术简历的实用指南：应包含哪些内容、各部分的排序与格式、篇幅应多长、如何列出发表成果，以及不同职业阶段与国家的惯例差异。",
      blocks: [
        {
          type: "p",
          text: "学术简历（curriculum vitae）是申请研究与教学岗位、研究生项目、奖学金及科研经费的标准文件。与仅有一两页的求职简历不同，学术简历是对您学术生涯的完整、持续的记录——涵盖教育背景、发表成果、科研经费、教学经历与学术服务——并随职业发展不断丰富。",
        },
        {
          type: "p",
          text: "本指南涵盖应包含的内容、各部分的排序与格式、学术简历的适宜篇幅、如何列出发表成果，以及不同职业阶段和国家的惯例差异。如果您不希望手动整理，可以通过您的 ORCID 记录自动生成——详见最后一节。",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "什么是学术简历？",
        },
        {
          type: "p",
          text: "学术简历是一份全面的学术履历。其目的是记录您学术贡献的完整范围，以便招聘委员会、资助机构或录取委员会评估您的成果。与针对特定岗位精简裁剪的求职简历不同，学术简历详尽而累积：随时间推移不断添加内容，极少删除。",
        },
        {
          type: "p",
          text: "由于读者为专业人士，学术简历注重完整性与准确性而非简洁性。清晰的结构、一致的格式和规范的参考文献格式，比视觉效果更为重要。",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "应包含的内容：核心部分",
        },
        {
          type: "p",
          text: "大多数学术简历由相同的基本模块构成。请根据您所在领域和职业阶段纳入相关部分，暂无内容的部分可略去：",
        },
        {
          type: "ul",
          items: [
            "页眉——姓名、当前职位及职业联系方式（以及您的 ORCID iD）。",
            "研究方向/简介——简要描述您的研究（可选，职业早期较为常见）。",
            "教育背景——按时间倒序列出学历，包含机构、时间及论文题目。",
            "学术职务/任职经历——学术及相关专业职务。",
            "发表成果——大多数研究岗位的核心部分（见下文）。",
            "科研经费与资助——已获资助，包含资助机构、项目名称、金额及时间。",
            "奖励与荣誉——奖学金、奖项及荣誉称号。",
            "教学经历——所授课程、特邀讲座及教学职务。",
            "指导与辅导——所指导的学生及受训人员。",
            "学术报告——受邀讲座、会议论文及海报展示。",
            "学术服务——同行评审、编辑职务、委员会工作及学术推广。",
            "专业会员资格、技能及推荐人——视您所在领域的相关性而定。",
          ],
        },
        {
          type: "h3",
          text: "各部分的排序",
        },
        {
          type: "p",
          text: "在页眉、教育背景和职务之后，将最能体现申请优势的内容置于前列。对于以研究为主的岗位和科研经费申请，将发表成果和资助经历置于前面；对于以教学为主的岗位，则将教学和指导经历前置。应根据读者需求调整排序，切勿虚构或填充内容。",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "如何列出发表成果",
        },
        {
          type: "p",
          text: "发表成果列表是大多数委员会重点关注之处，因此应使其易于浏览且不易误读：",
        },
        {
          type: "ul",
          items: [
            "按时间倒序列出成果，可按类型分组（期刊论文、预印本、书章、会议论文、数据集、软件）。",
            "全文使用统一的引用格式，并在简历的各个版本中保持一致。",
            "在每条作者列表中突出显示您的姓名，使贡献一目了然。",
            "附上 DOI（及链接），以便读者查阅原文。",
            "清晰、如实地标注处于审稿中、即将发表或预印本状态的成果。",
            "不要填充列表——质量与相关性比数量更有说服力。",
          ],
        },
        {
          type: "p",
          text: "格式不一致是最常见的失误。使用同一种引用格式来格式化所有参考文献——引文格式语言（CSL）是 Zotero 等工具背后的标准——可确保您的 Word、PDF 和 LaTeX 简历格式完全一致。",
        },
        {
          type: "h2",
          id: "how-long",
          text: "学术简历应有多长？",
        },
        {
          type: "p",
          text: '没有固定的页数限制——学术简历应与您的成果记录相称，并随时间增长。大致而言：硕士或博士申请者约 2–4 页，博士后约 3–6 页，资深教授则可能远超十页。例外情况是资助机构和职位的"简短简历"，通常有页数上限（如两页），或采用叙述格式，如 NIH 个人简介、UKRI 的研究与创新简历（R4RI）或 ERC 简历。当申请通知规定了格式或页数限制时，请严格遵守。',
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "按职业阶段调整",
        },
        {
          type: "ul",
          items: [
            "学生及研究生申请者——重点突出教育背景、论文或研究项目、任何发表成果或报告、相关技能及推荐人；篇幅简短完全可以接受。",
            "博士生及博士后——以发表成果、会议活动、资助/奖学金及教学经历为重点；随时更新以应对持续的求职和科研经费申请截止日期。",
            "教职人员及主要研究者——突出科研经费、发表成果、指导工作及学术服务/领导力；通常需要一份篇幅较长、分节清晰的文件，以及一份单独提交给资助机构的简短简历。",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "格式与国家差异",
        },
        {
          type: "p",
          text: '惯例因地而异。在美国和加拿大，学术"简历（CV）"是指完整的学术文件（"résumé"是简短的行业版本），而在欧洲大部分地区，"CV"两者皆可指代。部分国家要求附上照片、出生日期或国籍；而许多其他国家——以及大多数美国/英国学术场合——则刻意省略个人信息以减少偏见。欧洲申请者有时使用 Europass 格式，主要资助机构也越来越多地要求提交其专属的叙述性简历。如有疑问，请遵循您所申请国家和机构的惯例。',
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "常见错误",
        },
        {
          type: "ul",
          items: [
            "格式不一致或在同一文件中混用多种引用格式。",
            "用次要成果填充发表列表，或将最重要的成果埋没其中。",
            "在申请间隔期间未能及时更新简历。",
            "忽视申请通知规定的格式或页数限制。",
            "依赖姓名匹配来标注您的发表成果——常见姓名及非拉丁文字姓名容易与他人成果混淆。",
            "错别字和失效链接——请仔细校对，并检查每个 DOI 是否有效。",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "自动生成学术简历",
        },
        {
          type: "p",
          text: "持续更新学术简历是繁琐的手动工作。SigmaCV（免费且开源）可从您的 ORCID 和 OpenAlex 记录中自动为您生成简历——通过标识符而非姓名匹配您的成果——统一格式化所有引用，并可导出为 PDF、Word、LaTeX、Markdown 或 BibTeX，或一个可自动同步的在线公开页面。指标默认关闭并采用领域归一化处理，符合 DORA 原则，您的数据始终归您所有（按字段设置发布授权、数据导出及账号删除）。",
        },
        {
          type: "cta",
          label: "免费生成学术简历",
          href: "/",
        },
      ],
      faq: [
        {
          q: "学术简历应有多长？",
          a: '没有固定限制；它随您的成果记录不断增长。博士申请者通常为 2–4 页，博士后为 3–6 页，资深学者则更长。资助机构/职位的"简短简历"可能有页数上限或要求特定叙述格式（如 NIH 个人简介、UKRI R4RI、ERC）——请务必遵循申请通知的规定。',
        },
        {
          q: "学术简历与求职简历有何区别？",
          a: "学术简历是对您学术生涯（教育背景、发表成果、科研经费、教学经历、学术服务）的完整、累积性记录，可能长达数页；求职简历则是针对非学术岗位量身定制的简短文件，通常为一至两页。",
        },
        {
          q: "学术简历中应如何列出发表成果？",
          a: "按时间倒序列出，可按类型分组，使用统一的引用格式，突出显示您的姓名并附上 DOI。清晰标注预印本和审稿中的成果，不要填充列表。",
        },
        {
          q: "我能自动生成学术简历吗？",
          a: "可以。SigmaCV 从您的 ORCID 和 OpenAlex 记录（通过标识符而非姓名匹配）中生成学术简历，格式化引用，并可导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX——免费且开源。",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "学术简历与求职简历：有何区别？",
      description:
        "学术简历与求职简历——两者在篇幅、范围和用途上的区别，以及学术求职、研究生申请、科研经费申请和行业岗位各应使用哪一种。",
      blocks: [
        {
          type: "p",
          text: '"简历（CV）"与"求职简历（résumé）"常被混用，但在学术界两者是用途各异的不同文件。选择正确的类型——并以正确的格式呈现——对于学术求职、奖学金及科研经费申请至关重要。',
        },
        {
          type: "p",
          text: "学术简历（curriculum vitae）是对您学术生涯的完整、累积性记录：教育背景、发表成果、科研经费、教学经历、学术报告及学术服务。求职简历则是简短的、高度针对性的摘要——通常为一两页——面向特定的非学术岗位。",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "主要区别",
        },
        {
          type: "ul",
          items: [
            "篇幅——学术简历无固定上限（通常达数页）；求职简历精简为一两页。",
            "范围——学术简历记录与您学术研究相关的一切；求职简历仅包含与目标职位相关的内容。",
            "读者——学术简历面向学术同行和评审委员会；求职简历面向招聘人员和用人单位。",
            "稳定性——学术简历随时间积累、极少删减；求职简历针对每次申请重新撰写。",
            "发表成果与科研经费——在学术简历中居于核心地位；在求职简历中通常精简或略去。",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "应选用哪一种？",
        },
        {
          type: "ul",
          items: [
            "学术求职、博士后、博士/研究生申请、奖学金及科研经费 → 使用学术简历。",
            "行业及大多数非学术岗位 → 使用针对岗位定制的求职简历。",
            '"学术外"及与研究相关的行业岗位 → 通常需要混合版本：篇幅类似求职简历，但仍突出相关研究成果。',
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "将学术简历转换为求职简历",
        },
        {
          type: "p",
          text: "要将学术简历转换为求职简历，请以简短摘要开头，仅保留最相关的经历和少量代表性成果，将学术成就转化为实际影响和可迁移技能，并压缩至一两页。将完整学术简历作为主文件，从中衍生出较短的版本。",
        },
        {
          type: "h2",
          id: "build-either",
          text: "从研究记录中生成任意版本",
        },
        {
          type: "p",
          text: "SigmaCV 从您的 ORCID 和 OpenAlex 记录中生成学术简历，并以多种格式和一键式布局导出——您可以保留一份规范记录，按需生成各申请所需的版本。完全免费、开源，且以隐私保护为首要原则。",
        },
        {
          type: "cta",
          label: "免费生成学术简历",
          href: "/",
        },
      ],
      faq: [
        {
          q: "简历（CV）与求职简历（résumé）相同吗？",
          a: "在学术界并不相同。学术简历是对您学术成果的完整、详尽的记录；求职简历是针对非学术岗位量身定制的一两页简短文件。在学术界之外，以及在某些国家，这两个术语使用较为宽泛。",
        },
        {
          q: "学术简历需要附照片吗？",
          a: "这取决于国家惯例。部分国家要求附照片及个人信息；许多学术场合（尤其是美国和英国）刻意省略这些信息以减少偏见。请遵循您所申请地区的惯例。",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "如何在学术简历中列出发表成果",
      description:
        "如何格式化和排序学术简历中的发表成果部分：引用格式、按类型分组、作者顺序、突出显示您的姓名、预印本和审稿中成果的处理，以及应避免的错误。",
      blocks: [
        {
          type: "p",
          text: "对于大多数学术岗位，发表成果部分是评审委员会最仔细阅读的内容，因此呈现方式几乎与内容本身同等重要。本指南涵盖引用格式、排序与分组、如何清晰体现个人贡献、如何处理预印本和审稿中成果，以及可能削弱一份本可出色的列表的常见错误。",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "选择并坚持使用同一种引用格式",
        },
        {
          type: "p",
          text: "选择适合您所在领域的引用格式（例如 APA、Vancouver、Chicago 或 IEEE），并将其应用于每一条目。最常见的失误是混用格式，或手动格式化参考文献导致各条目外观不一。通过统一的引擎格式化整个列表——引文格式语言（CSL）是 Zotero 等文献管理工具背后的标准——可确保您的 PDF、Word 和 LaTeX 简历格式一致。",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "发表成果的排序与分组",
        },
        {
          type: "ul",
          items: [
            "按时间倒序列出成果（最新在前）。",
            "列表较长时按类型分组：同行评审期刊论文、预印本、书章、会议论文、数据集与软件。",
            "各分组标注清晰、分隔明显，使读者能够快速定位同行评审成果。",
            "编号方式保持一致——要么全部编号，要么全部不编号。",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "清晰体现个人贡献",
        },
        {
          type: "ul",
          items: [
            "在每条作者列表中突出显示您的姓名（如加粗）。",
            "用清晰且附有说明的标注符号标识第一作者、通讯作者及同等贡献角色。",
            "请注意作者顺序惯例因领域而异——若您所在领域的惯例不甚明显，可添加一行简短说明。",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "预印本、审稿中及即将发表",
        },
        {
          type: "p",
          text: '如实标注成果状态。预印本（preprint，即公开发布但尚未经过同行评审的论文稿件）在简历中日益被接受，但应标注为预印本；"审稿中"或"即将发表"的条目也应注明。切勿将未经同行评审的成果呈现为已发表论文，也不要在未说明关联关系的情况下将同一论文列出两次（如同时列为预印本和正式发表版本）。',
        },
        {
          type: "h2",
          id: "identifiers",
          text: "附上标识符和链接",
        },
        {
          type: "p",
          text: "为每项成果附上 DOI（及链接），并在页眉处注明您的 ORCID iD。标识符还可使工具通过标识符而非姓名可靠地验证您的作者身份——这对于常见姓名及非拉丁文字姓名尤为重要。",
        },
        {
          type: "h2",
          id: "avoid",
          text: "应避免的情况",
        },
        {
          type: "ul",
          items: [
            "在同一文件中混用引用格式。",
            "用次要或不相关的条目填充列表。",
            "在各条目中您姓名的书写形式不一致。",
            "DOI 失效或缺失——请检查每个链接是否有效。",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "自动生成格式化的发表成果列表",
        },
        {
          type: "p",
          text: "SigmaCV 从 ORCID 和 OpenAlex（通过标识符而非姓名匹配）中提取您的发表成果，以任意 CSL 格式并突出显示您的姓名进行格式化，并可将列表导出为 PDF、Word、LaTeX、Markdown 或 BibTeX——使您简历的每个版本均保持一致且准确。",
        },
        {
          type: "cta",
          label: "免费生成发表成果列表",
          href: "/",
        },
      ],
      faq: [
        {
          q: "简历中的发表成果应使用哪种引用格式？",
          a: "请使用您所在领域通行的格式（如 APA、Vancouver、Chicago、IEEE）。最重要的是在整个列表及简历的所有格式版本中统一使用同一种格式。",
        },
        {
          q: "简历中应包含预印本吗？",
          a: "应该——预印本日益获得认可——但需清晰标注为预印本，并与同行评审论文分开列出。",
        },
        {
          q: "如何标注共同第一作者或同等贡献？",
          a: '用符号标注相关作者，并在简短说明中解释（如"* 同等贡献"）。请在整个列表中保持一致。',
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "学术简历应有多长？",
      description:
        "不同职业阶段学术简历的适宜篇幅、何时有页数限制（资助机构和职位的简短简历），以及为何篇幅长不等于质量好——以及如何维护一份主简历并导出较短的版本。",
      blocks: [
        {
          type: "p",
          text: "简而言之：学术简历的篇幅应与您的成果记录相称，并随职业发展不断增长。与求职简历不同，学术简历并不要求控制在一两页以内。但篇幅取决于职业阶段和具体情境，且存在重要例外情况。",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "按职业阶段的参考标准",
        },
        {
          type: "ul",
          items: [
            "硕士/博士申请者——大约 2–4 页。",
            "博士生/博士后——大约 3–6 页。",
            "中级职业阶段——通常 6–10 页以上。",
            "资深教职人员——远超十页；发表成果和科研经费记录决定了篇幅。",
          ],
        },
        {
          type: "p",
          text: "这些仅为参考，并非硬性规定。一份出色、组织良好的四页简历胜过一份填充了内容的八页简历。",
        },
        {
          type: "h2",
          id: "capped",
          text: "有页数限制的情况",
        },
        {
          type: "p",
          text: '许多资助机构和用人单位要求提交有严格页数限制（通常为两页）的"简短简历"，或采用特定的叙述格式，如 NIH 个人简介、UKRI 的研究与创新简历（R4RI）、ERC 简历或瑞士 SNSF 格式。当申请通知规定了篇幅或格式时，请严格遵守——超出限制可能导致申请未经审阅即被拒绝。',
        },
        {
          type: "h2",
          id: "quality",
          text: "篇幅长并不等于质量好",
        },
        {
          type: "p",
          text: "完整性是应有之义，但填充内容则不可取。纳入相关内容，合理排序以使最出色的成果易于查阅，删去冗余。评审者看重的是清晰度和相关性，而非页数。",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "维护主简历，按需导出较短版本",
        },
        {
          type: "p",
          text: '实际可行的做法是维护一份完整的"主"简历，并从中衍生出较短的或针对特定资助机构的版本。SigmaCV 基于单一规范记录实现这一功能：将所有内容集中存放，再一键应用布局（NIH、NSF、ERC、UKRI R4RI 等），或针对特定申请可逆地精简各节内容，然后导出。',
        },
        {
          type: "cta",
          label: "免费生成学术简历",
          href: "/",
        },
      ],
      faq: [
        {
          q: "学术简历有页数限制吗？",
          a: '通常没有——完整的学术简历篇幅应与您的成果记录相称。例外情况是资助机构/职位的"简短简历"，通常有页数上限或要求特定叙述格式；请务必遵循申请通知的要求。',
        },
        {
          q: "博士申请简历应有多长？",
          a: "通常约为 2–4 页。在这一阶段，清晰的研究经历和少量代表性成果比篇幅长度更为重要。",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "研究生申请用学术简历",
      description:
        "当您尚无大量发表成果时，如何为硕士、博士或研究生项目申请准备学术简历——以及如何给录取委员会留下深刻印象。",
      blocks: [
        {
          type: "p",
          text: "如果您正在申请硕士或博士项目，担心简历内容单薄，这完全正常——录取委员会在这一阶段并不期望您有大量发表成果。他们关注的是潜力的体现：研究经历、相关技能和清晰的发展轨迹。以下是应包含的内容及呈现方式。",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "应包含的内容",
        },
        {
          type: "ul",
          items: [
            "教育背景——学历、院校、时间，以及如有优势则附上 GPA 或成绩；包含论文或毕业设计题目。",
            "研究经历——实验室、项目及论文，注明您的角色、方法和成果。",
            "发表成果与学术报告——任何论文、预印本、海报或会议报告，无论处于何种早期阶段。",
            "技能——与研究领域相关的实验室技能、技术技能、统计技能、编程技能及语言能力。",
            "奖励与奖学金——学术荣誉及资助。",
            "相关经历——教学、辅导、相关工作或志愿者活动。",
            "推荐人——或注明可按要求提供。",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "以研究经历为重点",
        },
        {
          type: "p",
          text: "即使没有发表成果，研究经历也是您最有力的材料。对于每个项目，请说明研究问题是什么、您的具体工作（技术方法、分析手段及您的具体角色），以及最终成果。具体的贡献远比课程名称列表更有说服力。",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "篇幅与格式",
        },
        {
          type: "p",
          text: "研究生申请简历通常为 2–4 页。保持格式整洁一致，使用清晰的章节标题，并针对所申请的项目调整侧重点。篇幅简短完全可以接受——切勿填充内容。",
        },
        {
          type: "h2",
          id: "build",
          text: "从您的记录中生成简历",
        },
        {
          type: "p",
          text: "SigmaCV 从您的 ORCID 和公开数据中整合成整洁的学术简历，即使是您的首批发表成果、预印本和海报展示，也能得到正确、一致的格式呈现——您还可以通过 DOI 添加任何成果。完全免费且开源。",
        },
        {
          type: "cta",
          label: "免费生成研究生申请简历",
          href: "/",
        },
      ],
      faq: [
        {
          q: "研究生申请简历需要有发表成果吗？",
          a: "不需要。在申请阶段，研究经历、相关技能和清晰的发展轨迹比发表成果列表更为重要。如您已有预印本或海报展示，请一并列出，但其缺失是正常的。",
        },
        {
          q: "研究生申请简历应有多长？",
          a: "通常为 2–4 页。保持重点突出：清晰的研究经历和少量代表性成果优于填充内容。",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title: "在学术简历中负责任地使用指标（DORA 与 Leiden Manifesto）",
      description:
        "如何在简历中负责任地呈现科研指标：为何期刊影响因子和 h-index 具有误导性，领域归一化指标能提供什么价值，以及 DORA 和 Leiden Manifesto 的建议。",
      blocks: [
        {
          type: "p",
          text: "指标在简历中是一种颇具吸引力的简写方式，但很容易被滥用——评审委员会日益期望研究者能够负责任地使用这些指标。本指南解释哪些指标具有误导性、哪些更具可辩护性，以及主要的负责任评估框架的建议。",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "为何期刊影响因子是错误的评估工具",
        },
        {
          type: "p",
          text: "期刊影响因子（JIF）衡量的是期刊的平均引用次数，而非您个人文章的质量或影响力。引用次数的分布高度偏斜，因此一篇发表在高影响因子期刊的论文，几乎无法向读者说明该论文本身的价值。DORA——《旧金山科研评估宣言》——明确建议不要将 JIF 用于评估个人研究成果或研究者。",
        },
        {
          type: "h2",
          id: "h-index",
          text: "h-index 与原始计数的局限性",
        },
        {
          type: "p",
          text: "h-index 和原始引用次数在很大程度上取决于研究领域和职业年限，因此不具有跨学科可比性，且不利于职业早期的研究者。这些指标还可能被人为抬高。如您确实要列出这些指标，请提供背景信息；切勿将其作为独立的价值衡量标准。",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "优先使用领域归一化指标",
        },
        {
          type: "p",
          text: "领域归一化指标——如领域加权引用影响力（FWCI）或 NIH iCite 相对引用率（RCR）——考虑了不同领域和不同时期引用率的差异，因此比原始计数具有更强的可比性。这些指标仍不完善，应结合背景信息加以解读，而非作为唯一信号。",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "DORA 与 Leiden Manifesto 的建议",
        },
        {
          type: "ul",
          items: [
            "DORA——不应使用期刊级别的指标（如 JIF）来评估个人贡献；应根据研究成果本身进行评估。",
            "Leiden Manifesto——使用定量指标辅助而非替代专家判断；考虑领域差异；保持数据和方法的透明度；避免对指标过度解读。",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "简历的实用建议",
        },
        {
          type: "ul",
          items: [
            "以研究工作本身为重点——您做了什么及其意义——而非数字。",
            "如需列出指标，优先选择领域归一化指标，并提供背景信息（领域、时间窗口、百分位数）。",
            "考虑用简短的叙述性说明替代或补充数字，描述您的核心贡献。",
            "切勿列出您论文所发表期刊的影响因子。",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "负责任的指标，默认设置",
        },
        {
          type: "p",
          text: "SigmaCV 的设计理念与此保持一致：指标默认关闭且需主动开启，优先选用领域归一化指标而非原始计数，且从不显示期刊影响因子——与 DORA 原则一致。您完全掌控是否在简历中呈现任何指标。",
        },
        {
          type: "cta",
          label: "免费生成符合 DORA 原则的简历",
          href: "/",
        },
      ],
      faq: [
        {
          q: "简历中应列出 h-index 吗？",
          a: "这是可选的，且取决于所在领域。如您确实要列出，请提供背景信息并搭配领域归一化指标，而非单独呈现；许多评审委员会不鼓励过度依赖这一指标。",
        },
        {
          q: "在简历中列出期刊影响因子是否合适？",
          a: "不建议这样做。DORA 明确建议不要使用期刊影响因子来评估个人研究，因为它衡量的是期刊，而非您的论文。",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "各国学术简历格式差异",
      description:
        "各国学术简历惯例的差异——简历/求职简历的区分、照片与个人信息、篇幅、Europass 及资助机构叙述格式——以及如何调整您的简历。",
      blocks: [
        {
          type: "p",
          text: "学术简历没有统一的全球标准。不同国家和机构的惯例各异——文件的名称、是否需要附照片、篇幅要求，以及资助机构所期望的特定格式，均有所不同。本指南涵盖主要差异，以及如何根据申请目标国调整您的简历。",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "简历与求职简历的区分因地而异",
        },
        {
          type: "p",
          text: '在美国和加拿大，学术"简历（CV）"是指完整、详尽的学术文件，而"求职简历（résumé）"是适用于行业岗位的简短版本（一两页）。在英国和欧洲大部分地区，"CV"两者皆可指代，学术版本从语境中即可理解。请根据您所申请的国家和岗位，选用符合预期的术语和篇幅。',
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "照片与个人信息",
        },
        {
          type: "p",
          text: "这是国际间差异最大的方面。在欧洲大陆部分地区、亚洲和拉丁美洲，简历可能须附照片、出生日期或国籍。在美国和英国，这些信息刻意被省略以减少偏见，附上反而可能适得其反。如有疑问，请遵循目标国的惯例——切勿纳入用人单位明确要求省略的个人信息。",
        },
        {
          type: "h2",
          id: "length",
          text: "篇幅预期",
        },
        {
          type: "p",
          text: "完整的学术简历没有固定的页数限制，并随成果记录增长，但各地预期有所不同：部分欧洲申请更倾向于较为简洁的简历，而美国的学术简历通常较为详尽。当申请通知或用人单位明确规定页数限制时，请务必遵守。",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass 与结构化格式",
        },
        {
          type: "p",
          text: "在欧盟，Europass 是一种常用的标准化简历模板，部分机构会要求使用。不同国家和体系有其各自的预期格式。若要求使用特定结构化格式，请严格按其填写，而非提交自由格式的简历。",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "各地区资助机构叙述性简历",
        },
        {
          type: "p",
          text: "主要资助机构越来越多地要求提交专属格式：英国的 UKRI 研究与创新简历（R4RI）、欧盟的 ERC 简历、瑞士的 SNSF 格式，以及美国的 NIH 个人简介或 NSF 格式。这些格式叙述性强或结构严格，与标准简历有所不同——请针对每次申请从完整简历中专门准备。",
        },
        {
          type: "h2",
          id: "adapt",
          text: "如何调整您的简历",
        },
        {
          type: "p",
          text: "维护一份完整的规范简历，并从中衍生出针对特定国家或资助机构的版本，而非从头维护多份简历。SigmaCV 从您的公开研究记录生成这份规范简历，并可一键应用资助机构布局（UKRI R4RI、ERC、SNSF、NIH、NSF 等），且操作可逆——因此针对某个国家的要求进行调整只需快速修改，而非重新撰写。",
        },
        {
          type: "cta",
          label: "免费生成学术简历",
          href: "/",
        },
      ],
      faq: [
        {
          q: "学术简历需要附照片吗？",
          a: "这取决于国家惯例。部分国家要求附照片和个人信息；美国和英国的学术惯例是省略这些内容以减少偏见。请遵循您所申请地区的惯例。",
        },
        {
          q: "学术简历在各国都一样吗？",
          a: "不相同。术语、预期篇幅、个人信息的纳入与否，以及资助机构要求的格式，在各国之间均有所不同。请根据目标国和机构调整您的简历。",
        },
      ],
    },
  },
  "es-ES": {
    "how-to-write-an-academic-cv": {
      title: "Cómo redactar un currículum vítae académico",
      description:
        "Guía práctica para redactar un currículum vítae académico: qué incluir, cómo ordenar y formatear cada sección, qué extensión debe tener, cómo listar las publicaciones y cómo varían las convenciones según la etapa profesional y el país.",
      blocks: [
        {
          type: "p",
          text: "El currículum vítae académico es el documento estándar para solicitar puestos de investigación y docencia, programas de posgrado, becas y financiación. A diferencia de un résumé de una o dos páginas, es un registro completo y en constante actualización de su trayectoria académica —su formación, publicaciones, financiación obtenida, docencia y servicios prestados— y sigue creciendo a lo largo de toda su carrera.",
        },
        {
          type: "p",
          text: "Esta guía trata qué incluir, cómo ordenar y formatear cada sección, qué extensión debe tener un currículum académico, cómo listar las publicaciones y cómo varían las convenciones según la etapa profesional y el país. Si prefiere no construirlo a mano, puede generarlo automáticamente a partir de su registro ORCID; véase el último apartado.",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "¿Qué es un currículum vítae académico?",
        },
        {
          type: "p",
          text: "El currículum vítae es una biografía académica exhaustiva. Su función es documentar toda la amplitud de sus contribuciones académicas para que un comité de selección, un organismo financiador o un panel de admisiones pueda evaluar su historial. Mientras que un résumé se adapta y recorta para un puesto concreto, el currículum académico es exhaustivo y acumulativo: se va ampliando con el tiempo y rara vez se elimina nada.",
        },
        {
          type: "p",
          text: "Dado que lo leen especialistas, el currículum académico prima la exhaustividad y la exactitud sobre la brevedad. Una estructura clara, un formato coherente y citas bibliográficas correctamente formateadas importan más que el atractivo visual.",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "Qué incluir: las secciones fundamentales",
        },
        {
          type: "p",
          text: "La mayoría de los currículos académicos se construyen a partir de los mismos elementos. Incluya las secciones pertinentes para su campo y etapa profesional y omita aquellas en las que aún no tenga nada que añadir:",
        },
        {
          type: "ul",
          items: [
            "Encabezado: nombre, puesto actual y datos de contacto profesional (y su ORCID iD).",
            "Intereses/resumen de investigación: unas pocas líneas que enmarquen su trabajo (opcional; más habitual al inicio de la carrera).",
            "Formación académica: títulos en orden cronológico inverso, con institución, fechas y título de la tesis.",
            "Nombramientos/puestos: cargos académicos y los profesionales más relevantes.",
            "Publicaciones: el elemento central para la mayoría de los puestos de investigación (véase más adelante).",
            "Becas y financiación: ayudas concedidas, con entidad financiadora, título, importe y fechas.",
            "Premios y distinciones: becas, galardones y reconocimientos.",
            "Docencia: asignaturas impartidas, conferencias invitadas y cargos docentes.",
            "Supervisión y mentoría: estudiantes y personas en formación supervisadas.",
            "Comunicaciones: ponencias invitadas, comunicaciones en congresos y pósters.",
            "Servicios: revisión por pares, roles editoriales, comités y divulgación.",
            "Membresías profesionales, habilidades y referencias: según la relevancia para su campo.",
          ],
        },
        {
          type: "h3",
          text: "Ordenar las secciones",
        },
        {
          type: "p",
          text: "Tras el encabezado, la formación y los puestos, sitúe en primer lugar lo que sea más relevante para el cargo al que aspira. En puestos de investigación intensa y solicitudes de financiación, coloque pronto las publicaciones y la financiación; en puestos centrados en la docencia, adelante la enseñanza y la supervisión. Adapte el orden al lector sin inventar ni rellenar contenido.",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "Cómo listar las publicaciones",
        },
        {
          type: "p",
          text: "La lista de publicaciones es donde la mayoría de los comités pasan más tiempo, así que facilite su lectura y haga que sea imposible malinterpretarla:",
        },
        {
          type: "ul",
          items: [
            "Liste los trabajos en orden cronológico inverso, opcionalmente agrupados por tipo (artículos en revistas, preprints, capítulos de libros, comunicaciones en congresos, conjuntos de datos, software).",
            "Use un único estilo de cita coherente en todo el documento y manténgalo idéntico en todas las versiones de su currículum.",
            "Resalte su propio nombre en cada lista de autores para que su contribución sea visible de un vistazo.",
            "Incluya DOIs (y enlaces) para que los lectores puedan encontrar el trabajo.",
            "Identifique con claridad y honestidad los trabajos que están en revisión, en prensa o son preprints.",
            "No rellene la lista: la calidad y la relevancia producen mejor impresión que el volumen.",
          ],
        },
        {
          type: "p",
          text: "La coherencia es el punto de fallo más frecuente. Formatear todas las referencias a través de un único estilo de cita —el Citation Style Language (CSL) es el estándar que subyace a herramientas como Zotero— garantiza que sus currículos en Word, PDF y LaTeX sean idénticos.",
        },
        {
          type: "h2",
          id: "how-long",
          text: "¿Cuánto debe tener un currículum académico?",
        },
        {
          type: "p",
          text: "No existe un límite de páginas fijo: un currículum académico es tan extenso como lo justifique su historial, y crece con el tiempo. Como orientación aproximada: un candidato a máster o doctorado puede tener 2–4 páginas; un posdoctorado, 3–6; y un profesor titular con experiencia, bastante más de diez. La excepción son los «currículos breves» para convocatorias de financiación o empleo, que suelen limitar la extensión (p. ej., dos páginas) o emplean un formato narrativo como el biosketch del NIH, el Résumé for Research and Innovation (R4RI) de UKRI o el currículum del ERC. Cuando una convocatoria especifique un formato o límite de páginas, sígalo exactamente.",
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "Adaptación según la etapa profesional",
        },
        {
          type: "ul",
          items: [
            "Estudiantes y candidatos a posgrado: destaque la formación, su tesis o proyecto de investigación, cualquier publicación o comunicación, habilidades relevantes y referencias; es perfectamente válido que sea breve.",
            "Doctorandos y posdoctorados: lidere con publicaciones, actividad en congresos, financiación/becas y docencia; manténgalo actualizado para plazos continuos de empleo y financiación.",
            "Profesores titulares e investigadores principales: dé protagonismo a becas, publicaciones, supervisión y servicios/liderazgo; espere un documento largo y dividido en secciones, además de un currículum breve aparte para los organismos financiadores.",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "Formato y diferencias por países",
        },
        {
          type: "p",
          text: "Las convenciones varían. En EE. UU. y Canadá, el «CV» académico es el documento académico extenso (el «résumé» es la versión corta para la industria), mientras que en gran parte de Europa «CV» puede referirse a cualquiera de los dos. Algunos países esperan una fotografía, fecha de nacimiento o nacionalidad; muchos otros —y la mayoría de los contextos académicos anglosajones— omiten deliberadamente los datos personales para reducir sesgos. Los candidatos europeos a veces utilizan el formato Europass, y los principales organismos financiadores exigen cada vez más sus propios currículos narrativos. En caso de duda, adáptese a las normas del país e institución a los que solicita.",
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "Errores comunes que debe evitar",
        },
        {
          type: "ul",
          items: [
            "Formato inconsistente o mezcla de varios estilos de cita en un mismo documento.",
            "Rellenar la lista de publicaciones u ocultar los trabajos más importantes.",
            "Dejar que el currículum quede desactualizado entre solicitudes.",
            "Ignorar el formato requerido o el límite de páginas de una convocatoria.",
            "Confiar en la coincidencia de nombre para sus publicaciones: los nombres comunes y los escritos en alfabetos no latinos se confunden fácilmente con el trabajo de otra persona.",
            "Erratas y enlaces rotos: revise el texto y compruebe que cada DOI se resuelve correctamente.",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "Genere su currículum académico automáticamente",
        },
        {
          type: "p",
          text: "Mantener actualizado un currículum académico es un trabajo repetitivo y manual. SigmaCV (gratuito y de código abierto) lo construye por usted a partir de sus registros en ORCID y OpenAlex —identificando su trabajo por identificador, nunca por nombre—, formatea todas las citas de manera coherente y exporta a PDF, Word, LaTeX, Markdown o BibTeX, o bien a una página pública activa que se resincroniza automáticamente. Las métricas están desactivadas por defecto y están normalizadas por campo, en línea con DORA, y sus datos le pertenecen (consentimiento por campo, exportación, eliminación).",
        },
        {
          type: "cta",
          label: "Genere su currículum académico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "¿Cuánto debe tener un currículum académico?",
          a: "No existe un límite fijo; crece con su historial. Un candidato a doctorado suele tener 2–4 páginas; un posdoctorado, 3–6; y un académico de mayor trayectoria, bastante más. Los «currículos breves» para financiación o empleo pueden limitar la extensión o requerir un formato narrativo (p. ej., biosketch del NIH, R4RI de UKRI, ERC); siga siempre las instrucciones de la convocatoria.",
        },
        {
          q: "¿Cuál es la diferencia entre un currículum académico y un résumé?",
          a: "Un currículum académico es un registro completo y acumulativo de su trayectoria académica (formación, publicaciones, financiación, docencia, servicios) y puede extenderse muchas páginas; un résumé es un documento breve y adaptado, de una o dos páginas, para puestos no académicos.",
        },
        {
          q: "¿Cómo debo listar las publicaciones en un currículum académico?",
          a: "Listelas en orden cronológico inverso, opcionalmente agrupadas por tipo, con un único estilo de cita coherente, con su nombre resaltado e incluyendo los DOIs. Identifique claramente los preprints y los trabajos en revisión, y no rellene la lista.",
        },
        {
          q: "¿Puedo generar un currículum académico automáticamente?",
          a: "Sí. SigmaCV construye un currículum académico a partir de sus registros en ORCID y OpenAlex (identificado por identificador, no por nombre), formatea las citas y exporta a PDF, DOCX, LaTeX, Markdown o BibTeX: gratuito y de código abierto.",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "Currículum académico frente a résumé: ¿cuál es la diferencia?",
      description:
        "Currículum académico frente a résumé: en qué se diferencian en extensión, alcance y propósito, y cuál usar para solicitudes de empleo académico, admisiones a posgrado, becas y puestos en la industria.",
      blocks: [
        {
          type: "p",
          text: "«CV» y «résumé» se usan a menudo indistintamente, pero en el ámbito académico son documentos distintos con funciones diferentes. Elegir el correcto —y formatearlo adecuadamente— es importante para las solicitudes de empleo académico, becas y ayudas.",
        },
        {
          type: "p",
          text: "Un currículum vítae académico es un registro completo y acumulativo de su trayectoria académica: formación, publicaciones, financiación, docencia, comunicaciones y servicios. Un résumé es un resumen breve y muy adaptado —normalmente de una o dos páginas— orientado a un puesto no académico concreto.",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "Las diferencias clave",
        },
        {
          type: "ul",
          items: [
            "Extensión: un CV crece sin límite fijo (a menudo varias páginas); un résumé se reduce a una o dos.",
            "Alcance: un CV documenta todo lo relevante para su actividad académica; un résumé incluye solo lo pertinente para el puesto al que se aspira.",
            "Audiencia: un CV lo leen pares académicos y comités; un résumé, reclutadores y responsables de contratación.",
            "Estabilidad: al CV se le añade contenido con el tiempo y rara vez se elimina; el résumé se reescribe para cada solicitud.",
            "Publicaciones y financiación: son centrales en un CV; en un résumé suelen condensarse u omitirse.",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "¿Cuál debe usar?",
        },
        {
          type: "ul",
          items: [
            "Empleos académicos, posdoctorados, solicitudes de doctorado/posgrado, becas y ayudas → un currículum académico.",
            "Puestos en la industria y la mayoría de los roles no académicos → un résumé adaptado a la oferta.",
            "Roles «alt-ac» e industria próxima a la investigación → a menudo un híbrido: un documento de extensión de résumé que aún destaca las producciones científicas más relevantes.",
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "Convertir un CV en un résumé",
        },
        {
          type: "p",
          text: "Para transformar un currículum académico en un résumé, comience con un resumen breve, conserve solo la experiencia más relevante y un puñado de producciones representativas, traduzca los logros académicos en impacto y competencias transferibles, y redúzcalo a una o dos páginas. Mantenga el CV completo como registro maestro y derive de él los documentos más breves.",
        },
        {
          type: "h2",
          id: "build-either",
          text: "Construya cualquiera de los dos a partir de su historial investigador",
        },
        {
          type: "p",
          text: "SigmaCV construye un currículum académico a partir de sus registros en ORCID y OpenAlex y lo exporta en una variedad de formatos y diseños con un clic, de modo que puede mantener un registro canónico único y producir la versión que cada solicitud necesita. Es gratuito, de código abierto y orientado a la privacidad.",
        },
        {
          type: "cta",
          label: "Genere su currículum académico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "¿Es un CV lo mismo que un résumé?",
          a: "No en el ámbito académico. Un currículum académico es un registro largo y completo de su actividad investigadora; un résumé es un documento breve y adaptado de una o dos páginas para puestos no académicos. Fuera del ámbito académico y en algunos países, ambos términos se usan de forma más laxa.",
        },
        {
          q: "¿Debo incluir una fotografía en un currículum académico?",
          a: "Depende del país. Algunos países esperan una fotografía y datos personales; muchos contextos académicos (especialmente en EE. UU. y el Reino Unido) los omiten deliberadamente para reducir sesgos. Adáptese a las normas del lugar al que solicita.",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "Cómo listar las publicaciones en un currículum académico",
      description:
        "Cómo formatear y ordenar la sección de publicaciones de un currículum académico: estilo de cita, agrupación por tipo, orden de autoría, resaltar su propio nombre, preprints y trabajos en revisión, y qué evitar.",
      blocks: [
        {
          type: "p",
          text: "Para la mayoría de los puestos académicos, la sección de publicaciones es la parte del currículum que los comités leen con mayor detenimiento, por lo que la manera en que la presenta importa casi tanto como su contenido. Esta guía trata el estilo de cita, el orden y la agrupación, cómo hacer visible su propia contribución, cómo gestionar los preprints y los trabajos en revisión, y los errores que perjudican una lista que de otro modo sería sólida.",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "Elija un único estilo de cita y manténgalo",
        },
        {
          type: "p",
          text: "Elija un estilo de cita apropiado para su campo (por ejemplo, APA, Vancouver, Chicago o IEEE) y aplíquelo a cada entrada. El fallo más frecuente es mezclar estilos o formatear las referencias a mano, de modo que no hay dos que tengan el mismo aspecto. Formatear toda la lista a través de un único motor —el Citation Style Language (CSL), el estándar que subyace a gestores de referencias como Zotero— garantiza la coherencia en sus CVs en PDF, Word y LaTeX.",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "Ordene y agrupe sus publicaciones",
        },
        {
          type: "ul",
          items: [
            "Liste los trabajos en orden cronológico inverso (los más recientes primero).",
            "Agrupe por tipo cuando la lista sea larga: artículos en revistas revisados por pares, preprints, capítulos de libros, comunicaciones en congresos, conjuntos de datos y software.",
            "Etiquete y separe claramente los grupos para que un lector pueda localizar de inmediato los trabajos revisados por pares.",
            "Sea coherente con la numeración: numere todas las entradas o ninguna.",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "Haga visible su propia contribución",
        },
        {
          type: "ul",
          items: [
            "Resalte su propio nombre (p. ej., en negrita) en cada lista de autores.",
            "Identifique los roles de primer autor, autor de correspondencia y contribución equitativa con una notación clara y explicada.",
            "Recuerde que las convenciones sobre el orden de autoría varían según el campo: añada una nota breve si la convención de su disciplina no es obvia.",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "Preprints, trabajos en revisión y en prensa",
        },
        {
          type: "p",
          text: "Liste los trabajos honestamente indicando su estado. Los preprints son cada vez más aceptados en los CVs, pero deben etiquetarse como tales, y los trabajos «en revisión» o «en prensa» deben indicarlo. Nunca presente como revisado por pares un trabajo que no lo sea, y no liste el mismo artículo dos veces (p. ej., como preprint y como versión publicada) sin aclarar la relación entre ambos.",
        },
        {
          type: "h2",
          id: "identifiers",
          text: "Incluya identificadores y enlaces",
        },
        {
          type: "p",
          text: "Añada un DOI (y un enlace) a cada trabajo para que los lectores puedan encontrarlo, y coloque su ORCID iD en el encabezado. Los identificadores también permiten que las herramientas verifiquen su autoría de forma fiable —por identificador en lugar de por nombre—, lo que resulta especialmente importante para los nombres comunes y los escritos en alfabetos no latinos.",
        },
        {
          type: "h2",
          id: "avoid",
          text: "Qué evitar",
        },
        {
          type: "ul",
          items: [
            "Mezclar estilos de cita dentro de un mismo documento.",
            "Rellenar la lista con elementos menores o sin relación.",
            "Formas inconsistentes de su propio nombre entre las entradas.",
            "DOIs rotos o ausentes: compruebe que cada enlace se resuelve correctamente.",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "Genere automáticamente una lista de publicaciones formateada",
        },
        {
          type: "p",
          text: "SigmaCV extrae sus publicaciones de ORCID y OpenAlex (identificadas por identificador, no por nombre), las formatea con cualquier estilo CSL con su propio nombre resaltado y exporta la lista a PDF, Word, LaTeX, Markdown o BibTeX, de modo que todas las versiones de su currículum sean coherentes y correctas.",
        },
        {
          type: "cta",
          label: "Genere su lista de publicaciones gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "¿Qué estilo de cita debo usar para las publicaciones de mi CV?",
          a: "Use el estilo habitual en su campo (p. ej., APA, Vancouver, Chicago, IEEE). Lo más importante es aplicar un único estilo de forma coherente en toda la lista y en todos los formatos de su CV.",
        },
        {
          q: "¿Debo incluir preprints en mi CV?",
          a: "Sí —los preprints son cada vez más aceptados—, pero etiquételos claramente como preprints y manténgalos separados de los artículos revisados por pares.",
        },
        {
          q: "¿Cómo indico la co-primera autoría o la contribución equitativa?",
          a: "Marque a los autores relevantes con un símbolo y explíquelo en una leyenda breve (p. ej., «* contribución equitativa»). Sea coherente a lo largo de toda la lista.",
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "¿Cuánto debe tener un currículum académico?",
      description:
        "Qué extensión debe tener un currículum académico según la etapa profesional, cuándo se limita la extensión (currículos breves para financiación y empleo) y por qué más páginas no es mejor, además de cómo mantener un CV maestro y exportar versiones más cortas.",
      blocks: [
        {
          type: "p",
          text: "La respuesta breve: un currículum académico es tan extenso como lo justifique su historial, y crece a lo largo de su carrera. A diferencia de un résumé, no se espera que quepa en una o dos páginas. Pero la extensión depende de la etapa profesional y el contexto, y existen excepciones importantes.",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "Orientaciones por etapa profesional",
        },
        {
          type: "ul",
          items: [
            "Candidato a máster o doctorado: aproximadamente 2–4 páginas.",
            "Doctorando o posdoctorado: aproximadamente 3–6 páginas.",
            "Etapa media de carrera: a menudo 6–10 o más páginas.",
            "Profesor titular con amplia trayectoria: bastante más de diez páginas; la extensión la determina el historial de publicaciones y financiación.",
          ],
        },
        {
          type: "p",
          text: "Estas son orientaciones, no reglas. Un CV de cuatro páginas bien organizado y sólido supera a uno de ocho páginas con relleno.",
        },
        {
          type: "h2",
          id: "capped",
          text: "Cuando la extensión está limitada",
        },
        {
          type: "p",
          text: "Muchos organismos financiadores y empleadores solicitan un «CV breve» con un límite estricto de páginas (a menudo dos), o un formato narrativo estructurado como el biosketch del NIH, el Résumé for Research and Innovation (R4RI) de UKRI, un CV del ERC o el formato del SNSF suizo. Cuando una convocatoria especifique una extensión o formato, sígalo exactamente: superar el límite puede provocar que la solicitud sea rechazada sin leer.",
        },
        {
          type: "h2",
          id: "quality",
          text: "Más páginas no es mejor",
        },
        {
          type: "p",
          text: "Se espera exhaustividad, pero no relleno. Incluya lo que sea relevante, ordénelo de modo que el material más sólido sea fácil de encontrar y elimine el contenido de relleno. Los evaluadores valoran la claridad y la relevancia, no el número de páginas.",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "Mantenga un CV maestro y exporte versiones más cortas",
        },
        {
          type: "p",
          text: "El enfoque práctico consiste en mantener un CV «maestro» completo y derivar de él versiones más breves o específicas para cada convocatoria. SigmaCV hace esto a partir de un único registro canónico: mantenga todo en un solo lugar y aplique un diseño con un clic (NIH, NSF, ERC, UKRI R4RI y otros) o recorte secciones para una convocatoria concreta, de forma reversible, y exporte.",
        },
        {
          type: "cta",
          label: "Genere su currículum académico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "¿Existe un límite de páginas para un currículum académico?",
          a: "En general, no: un currículum académico completo es tan extenso como lo justifique su historial. La excepción son los «currículos breves» para financiación o empleo, que a menudo limitan la extensión o requieren un formato narrativo; siga siempre las instrucciones de la convocatoria.",
        },
        {
          q: "¿Qué extensión debe tener el CV para una solicitud de doctorado?",
          a: "Habitualmente unas 2–4 páginas. En esa etapa, una experiencia investigadora clara y unos pocos resultados representativos importan más que la extensión.",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "Currículum académico para solicitudes de posgrado",
      description:
        "Qué incluir en un currículum académico para solicitudes de máster, doctorado o posgrado cuando aún no tiene muchas publicaciones, y cómo causar una buena impresión en el comité de admisiones.",
      blocks: [
        {
          type: "p",
          text: "Si está solicitando plaza en un programa de máster o doctorado y le preocupa que su CV parezca escaso, es completamente normal: los comités de admisiones no esperan una larga lista de publicaciones en esta etapa. Buscan evidencias de potencial: experiencia investigadora, habilidades relevantes y una trayectoria clara. A continuación se explica qué incluir y cómo presentarlo.",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "Qué incluir",
        },
        {
          type: "ul",
          items: [
            "Formación académica: títulos, instituciones, fechas y su nota media o calificación si es buena; incluya el título de su TFG, TFM o tesis.",
            "Experiencia investigadora: laboratorios, proyectos y tesis, con su función, métodos y resultados.",
            "Publicaciones y comunicaciones: cualquier artículo, preprint, póster o comunicación en congreso, por incipiente que sea.",
            "Habilidades: de laboratorio, técnicas, estadísticas, de programación e idiomas relevantes para el campo.",
            "Premios y becas: distinciones académicas y ayudas.",
            "Experiencia relevante: docencia, tutorías, trabajo o voluntariado pertinente.",
            "Referencias: o una indicación de que están disponibles a petición.",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "Dé protagonismo a la experiencia investigadora",
        },
        {
          type: "p",
          text: "Incluso sin publicaciones, la experiencia investigadora es su baza más fuerte. Para cada proyecto, indique cuál era la pregunta de investigación, qué hizo usted (técnicas, análisis, su función concreta) y qué resultados se obtuvieron. Las contribuciones concretas producen mucho mejor impresión que una lista de nombres de asignaturas.",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "Extensión y formato",
        },
        {
          type: "p",
          text: "Un CV para solicitud de posgrado suele tener 2–4 páginas. Mantenga un formato limpio y coherente, use títulos de sección claros y adapte el énfasis al programa al que solicita. Es perfectamente válido que sea breve: no rellene.",
        },
        {
          type: "h2",
          id: "build",
          text: "Constrúyalo a partir de su historial",
        },
        {
          type: "p",
          text: "SigmaCV elabora un currículum académico limpio a partir de su ORCID y de datos abiertos, de modo que incluso sus primeras publicaciones, preprints y pósters queden formateados de forma correcta y coherente; además, puede añadir cualquier trabajo mediante su DOI. Es gratuito y de código abierto.",
        },
        {
          type: "cta",
          label: "Genere su CV de posgrado gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "¿Necesito publicaciones para un CV de solicitud de posgrado?",
          a: "No. En la etapa de solicitud, la experiencia investigadora, las habilidades relevantes y una trayectoria clara importan más que una lista de publicaciones. Incluya cualquier preprint o póster que tenga, pero su ausencia es algo esperado.",
        },
        {
          q: "¿Qué extensión debe tener el CV para una solicitud de posgrado?",
          a: "Típicamente 2–4 páginas. Manténgalo enfocado: una experiencia investigadora clara y unos pocos elementos representativos superan al relleno.",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title:
        "Uso responsable de las métricas en un currículum académico (DORA y el Leiden Manifesto)",
      description:
        "Cómo presentar métricas de investigación en un CV de forma responsable: por qué el factor de impacto de revista y el h-index inducen a error, qué aportan los indicadores normalizados por campo, y qué recomiendan DORA y el Leiden Manifesto.",
      blocks: [
        {
          type: "p",
          text: "Las métricas son una abreviatura tentadora en un CV, pero se malinterpretan con facilidad —y los comités esperan cada vez más que los investigadores las usen de forma responsable. Esta guía explica qué métricas inducen a error, cuáles son más defendibles y qué recomiendan los principales marcos de evaluación responsable.",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "Por qué el factor de impacto de revista es la herramienta equivocada",
        },
        {
          type: "p",
          text: "El factor de impacto de revista (Journal Impact Factor, JIF) mide las citas promedio de una revista, no la calidad o el impacto de su artículo individual. Las distribuciones de citas están muy sesgadas, por lo que un único artículo en una revista con JIF elevado no dice casi nada al lector sobre ese artículo concreto. DORA —la Declaración de San Francisco sobre Evaluación de la Investigación— aconseja explícitamente no utilizar el JIF para evaluar investigaciones o investigadores individuales.",
        },
        {
          type: "h2",
          id: "h-index",
          text: "El h-index y los recuentos brutos tienen limitaciones",
        },
        {
          type: "p",
          text: "El h-index y los recuentos brutos de citas dependen en gran medida del campo y de la duración de la carrera, por lo que no son comparables entre disciplinas y penalizan a los investigadores en etapas iniciales. Además, pueden inflarse. Si los incluye, aporte contexto; nunca los presente como medida autónoma de valía.",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "Prefiera los indicadores normalizados por campo",
        },
        {
          type: "p",
          text: "Los indicadores normalizados por campo —como el Field-Weighted Citation Impact (FWCI) o el Relative Citation Ratio (RCR) de iCite del NIH— tienen en cuenta las diferencias en las tasas de citas entre campos y a lo largo del tiempo, por lo que son más comparables que los recuentos brutos. Aun así son imperfectos y deben leerse con contexto, nunca como señal única de calidad.",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "Qué recomiendan DORA y el Leiden Manifesto",
        },
        {
          type: "ul",
          items: [
            "DORA: no utilice métricas basadas en revistas (como el JIF) para evaluar contribuciones individuales; evalúe la investigación por sus propios méritos.",
            "El Leiden Manifesto: use indicadores cuantitativos para apoyar, no para sustituir, el juicio de los expertos; tenga en cuenta las diferencias entre campos; mantenga los datos y los métodos transparentes; y evite la concreción fuera de lugar.",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "Consejos prácticos para su CV",
        },
        {
          type: "ul",
          items: [
            "Dé protagonismo al trabajo en sí mismo —qué hizo y por qué importa— antes que a los números.",
            "Si incluye métricas, prefiera los indicadores normalizados por campo y aporte contexto (campo, ventana temporal, percentil).",
            "Considere una breve descripción narrativa de sus contribuciones principales, en lugar de los números o junto a ellos.",
            "No cite nunca el factor de impacto de las revistas en las que han aparecido sus artículos.",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Métricas responsables, por defecto",
        },
        {
          type: "p",
          text: "SigmaCV está construido en torno a esta postura: las métricas están desactivadas por defecto y son optativas; prefiere los indicadores normalizados por campo frente a los recuentos brutos, y nunca muestra el factor de impacto de revista, en línea con DORA. Usted conserva el control total sobre si aparece alguna métrica en su CV.",
        },
        {
          type: "cta",
          label: "Genere un CV alineado con DORA gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "¿Debo incluir mi h-index en el CV?",
          a: "Es opcional y depende del campo. Si lo incluye, aporte contexto y combínelo con indicadores normalizados por campo en lugar de presentarlo de forma aislada; muchos comités desaconsejan la dependencia excesiva de este indicador.",
        },
        {
          q: "¿Es correcto listar los factores de impacto de las revistas en un CV?",
          a: "No se recomienda. DORA aconseja específicamente no utilizar el factor de impacto de revista para evaluar investigaciones individuales, ya que mide la revista, no su artículo.",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "Formato del currículum académico según el país",
      description:
        "Cómo varían las convenciones del currículum académico según el país: la distinción CV/résumé, fotografías y datos personales, extensión, Europass y formatos narrativos para organismos financiadores, y cómo adaptar el suyo.",
      blocks: [
        {
          type: "p",
          text: "No existe un único estándar global para el currículum académico. Las convenciones varían según el país y la institución: cómo se denomina el documento, si incluye fotografía, qué extensión tiene y qué formato estructurado exige un organismo financiador. Esta guía repasa las principales diferencias y cómo adaptar su CV al lugar al que solicita.",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "La distinción CV/résumé varía",
        },
        {
          type: "p",
          text: "En EE. UU. y Canadá, el «CV» académico es el documento académico largo y completo, mientras que el «résumé» es la versión corta de una o dos páginas para la industria. En el Reino Unido y gran parte de Europa, «CV» puede referirse a cualquiera de los dos, y la versión académica se sobreentiende por el contexto. Adáptese al término y la extensión que se esperan en el país y el puesto al que solicita.",
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "Fotografías y datos personales",
        },
        {
          type: "p",
          text: "Esta es la mayor diferencia entre países. En partes de la Europa continental, Asia y América Latina, puede esperarse que el CV incluya una fotografía, fecha de nacimiento o nacionalidad. En EE. UU. y el Reino Unido, estos datos se omiten deliberadamente para reducir sesgos, e incluirlos puede perjudicarle. En caso de duda, siga la norma del país de destino y nunca incluya datos personales que un empleador específico le haya pedido que omita.",
        },
        {
          type: "h2",
          id: "length",
          text: "Expectativas de extensión",
        },
        {
          type: "p",
          text: "Un currículum académico completo no tiene un límite fijo de páginas y crece con su historial, pero las expectativas difieren: algunas solicitudes europeas prefieren un CV más conciso, mientras que los CVs académicos estadounidenses suelen ser exhaustivos. Siga siempre un límite de páginas explícito cuando una convocatoria o un empleador lo especifiquen.",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass y formatos estructurados",
        },
        {
          type: "p",
          text: "En la Unión Europea, el CV Europass es una plantilla estructurada habitual, y algunas instituciones lo solicitan. Varios países y sistemas tienen sus propios formatos esperados. Cuando se requiera un formato estructurado, sígalo exactamente en lugar de presentar un CV de formato libre.",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "CV narrativos por región para organismos financiadores",
        },
        {
          type: "p",
          text: "Los principales organismos financiadores exigen cada vez más sus propios formatos: el Résumé for Research and Innovation (R4RI) de UKRI en el Reino Unido, el CV del ERC en la UE, el formato del SNSF en Suiza, y el biosketch del NIH o el formato del NSF en EE. UU. Estos son narrativos o muy estructurados y difieren de un CV estándar: prepárelos a partir de su historial completo para cada solicitud.",
        },
        {
          type: "h2",
          id: "adapt",
          text: "Cómo adaptar su CV",
        },
        {
          type: "p",
          text: "Mantenga un CV canónico completo y derive de él las versiones específicas para cada país u organismo financiador, en lugar de mantener varios desde cero. SigmaCV construye ese CV canónico a partir de su historial investigador abierto y aplica de forma reversible diseños específicos para cada organismo financiador (UKRI R4RI, ERC, SNSF, NIH, NSF y otros), de modo que adaptar su CV a las expectativas de un país es un cambio rápido, no una reescritura.",
        },
        {
          type: "cta",
          label: "Genere su currículum académico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "¿Debo incluir una fotografía en mi currículum académico?",
          a: "Depende del país. Algunos países esperan una fotografía y datos personales; la norma académica en EE. UU. y el Reino Unido es omitirlos para reducir sesgos. Siga la convención del lugar al que solicita.",
        },
        {
          q: "¿Es igual el currículum académico en todos los países?",
          a: "No. El término, la extensión esperada, la inclusión de datos personales y los formatos exigidos por los organismos financiadores varían según el país. Adapte su CV al país e institución de destino.",
        },
      ],
    },
  },
  "fr-FR": {
    "how-to-write-an-academic-cv": {
      title: "Comment rédiger un CV académique",
      description:
        "Un guide pratique pour rédiger un CV académique : ce qu'il faut inclure, comment ordonner et mettre en forme chaque section, quelle longueur viser, comment lister ses publications, et en quoi les conventions varient selon le stade de carrière et le pays.",
      blocks: [
        {
          type: "p",
          text: "Un CV académique (curriculum vitae) est le document de référence pour candidater à des postes de recherche et d'enseignement, à des programmes de doctorat, à des bourses et à des financements. Contrairement à un résumé d'une ou deux pages, il constitue un dossier complet et évolutif de votre vie scientifique — formation, publications, financements, enseignement et activités de service — et il s'enrichit tout au long de votre carrière.",
        },
        {
          type: "p",
          text: "Ce guide couvre ce qu'il faut inclure, comment ordonner et mettre en forme chaque section, quelle longueur doit avoir un CV académique, comment lister ses publications, et en quoi les conventions diffèrent selon le stade de carrière et le pays. Si vous préférez ne pas l'assembler à la main, vous pouvez en générer un automatiquement à partir de votre profil ORCID — voir la dernière section.",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "Qu'est-ce qu'un CV académique ?",
        },
        {
          type: "p",
          text: "Un CV est une biographie académique exhaustive. Il a pour mission de documenter l'ensemble de vos contributions scientifiques afin qu'un comité de recrutement, un financeur ou une commission d'admission puisse évaluer votre parcours. Là où un résumé est adapté et réduit à un poste précis, un CV académique est exhaustif et cumulatif : on y ajoute des éléments au fil du temps et on en retire rarement quelque chose.",
        },
        {
          type: "p",
          text: "Comme il est lu par des spécialistes, un CV académique privilégie l'exhaustivité et la précision à la concision. Une structure claire, une mise en forme cohérente et des citations correctement formatées comptent davantage que le soin visuel.",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "Ce qu'il faut inclure : les sections essentielles",
        },
        {
          type: "p",
          text: "La plupart des CVs académiques sont construits à partir des mêmes éléments de base. Incluez les sections pertinentes pour votre domaine et votre stade de carrière, et omettez celles que vous n'avez pas encore de contenu à remplir :",
        },
        {
          type: "ul",
          items: [
            "En-tête — nom, poste actuel et coordonnées professionnelles (ainsi que votre ORCID iD).",
            "Intérêts de recherche / résumé — quelques lignes cadrant vos travaux (optionnel, plus courant en début de carrière).",
            "Formation — diplômes en ordre chronologique inverse, avec établissement, dates et titre de thèse.",
            "Postes / fonctions — postes académiques et expériences professionnelles pertinentes.",
            "Publications — la pièce maîtresse pour la plupart des postes de recherche (voir ci-dessous).",
            "Financements & bourses — financements obtenus, avec organisme, intitulé, montant et dates.",
            "Prix & distinctions — bourses, récompenses et distinctions.",
            "Enseignement — cours dispensés, interventions ponctuelles et responsabilités pédagogiques.",
            "Encadrement & mentorat — étudiants et stagiaires encadrés.",
            "Communications — conférences invitées, communications orales et posters.",
            "Activités de service — expertise pour des revues, rôles éditoriaux, comités et actions de diffusion.",
            "Adhésions professionnelles, compétences et références — selon la pertinence pour votre domaine.",
          ],
        },
        {
          type: "h3",
          text: "Ordonner les sections",
        },
        {
          type: "p",
          text: "Après l'en-tête, la formation et les postes, mettez en avant ce qui est le plus fort pour le poste visé. Pour les postes à forte composante recherche et les financements, placez les publications et les financements en haut ; pour les postes à dominante enseignement, faites remonter l'enseignement et l'encadrement. Adaptez l'ordre au lecteur sans inventer ni gonfler le contenu.",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "Comment lister ses publications",
        },
        {
          type: "p",
          text: "La liste de publications est celle sur laquelle la plupart des comités passent le plus de temps, alors rendez-la facile à parcourir et impossible à mal interpréter :",
        },
        {
          type: "ul",
          items: [
            "Listez les travaux en ordre chronologique inverse, éventuellement regroupés par type (articles de revues, préprints, chapitres d'ouvrages, communications de conférences, jeux de données, logiciels).",
            "Utilisez un style de citation unique et cohérent, et maintenez-le identique dans chaque version de votre CV.",
            "Mettez votre propre nom en évidence dans chaque liste d'auteurs afin que votre contribution soit visible d'un coup d'œil.",
            "Incluez les DOIs (et les liens) afin que les lecteurs puissent retrouver le travail.",
            "Indiquez clairement et honnêtement les travaux soumis à des revues, sous presse ou en préprint.",
            "Ne gonflez pas la liste — la qualité et la pertinence priment sur le volume.",
          ],
        },
        {
          type: "p",
          text: "La cohérence est le point de défaillance le plus fréquent. Mettre en forme toutes les références via un style de citation unique — le Citation Style Language (CSL) est le standard qui sous-tend des outils comme Zotero — garantit que vos CVs Word, PDF et LaTeX se lisent de façon identique.",
        },
        {
          type: "h2",
          id: "how-long",
          text: "Quelle longueur doit avoir un CV académique ?",
        },
        {
          type: "p",
          text: "Il n'y a pas de limite de pages fixe — un CV académique est aussi long que votre parcours le justifie, et il s'allonge avec le temps. À titre indicatif : un candidat en master ou en doctorat peut avoir 2–4 pages, un post-doctorant 3–6, et un professeur expérimenté bien au-delà de dix. Font exception les « CV courts » exigés par des financeurs ou des employeurs, qui limitent souvent la longueur (par exemple à deux pages) ou imposent un format narratif tel que le NIH biosketch, le Résumé pour la recherche et l'innovation (R4RI) de l'UKRI ou un CV ERC. Lorsqu'un appel précise un format ou une limite de pages, respectez-les scrupuleusement.",
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "Adaptation selon le stade de carrière",
        },
        {
          type: "ul",
          items: [
            "Étudiants & candidats à l'école doctorale — mettez en valeur la formation, votre thèse ou projet de recherche, les publications ou communications éventuelles, les compétences pertinentes et les références ; il est tout à fait normal que le CV soit court.",
            "Doctorants & post-doctorants — commencez par les publications, l'activité en conférences, les financements/bourses et l'enseignement ; tenez le CV à jour pour les candidatures en continu aux postes et aux bourses.",
            "Enseignants-chercheurs & directeurs de recherche — mettez en avant les financements, les publications, l'encadrement et les activités de service/direction ; prévoyez un document long et sectionné ainsi qu'un CV court séparé pour les financeurs.",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "Mise en forme et différences selon les pays",
        },
        {
          type: "p",
          text: "Les conventions varient. Aux États-Unis et au Canada, un « CV » académique désigne le long document scientifique (un « résumé » en est la version courte pour l'industrie), tandis qu'en grande partie de l'Europe le terme « CV » peut désigner l'un ou l'autre. Certains pays attendent une photo, une date de naissance ou une nationalité ; beaucoup d'autres — et la plupart des contextes académiques américains et britanniques — omettent délibérément les données personnelles pour réduire les biais. Les candidats européens utilisent parfois le format Europass, et les grands financeurs exigent de plus en plus leurs propres CVs narratifs. En cas de doute, conformez-vous aux normes du pays et de l'institution visés.",
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "Erreurs fréquentes à éviter",
        },
        {
          type: "ul",
          items: [
            "Mise en forme incohérente ou mélange de plusieurs styles de citation dans un même document.",
            "Gonfler la liste de publications ou noyer vos travaux les plus importants.",
            "Laisser le CV se périmer entre deux candidatures.",
            "Ignorer le format ou la limite de pages imposés par un appel.",
            "Se fier à une correspondance par nom pour ses publications — les noms courants et les noms en graphies non latines se confondent facilement avec ceux d'autres chercheurs.",
            "Fautes de frappe et liens brisés — relisez et vérifiez que chaque DOI se résout correctement.",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "Générer automatiquement votre CV académique",
        },
        {
          type: "p",
          text: "Tenir un CV académique à jour est un travail répétitif et manuel. SigmaCV (gratuit et open source) le génère pour vous à partir de votre profil ORCID et OpenAlex — en associant vos travaux par identifiant, jamais par nom — formate chaque citation de façon cohérente et exporte vers PDF, Word, LaTeX, Markdown ou BibTeX, ou vers une page publique vivante qui se resynchronise. Les indicateurs sont désactivés par défaut et normalisés par le champ, en accord avec DORA, et vos données vous appartiennent (consentement par type de donnée, export, suppression).",
        },
        {
          type: "cta",
          label: "Générer votre CV académique gratuitement",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Quelle longueur doit avoir un CV académique ?",
          a: "Il n'y a pas de limite fixe ; il s'allonge avec votre parcours. Un candidat au doctorat a souvent 2–4 pages, un post-doctorant 3–6, et un académique expérimenté bien davantage. Les « CV courts » exigés par des financeurs ou des employeurs peuvent limiter la longueur ou imposer un format narratif (par exemple NIH biosketch, UKRI R4RI, ERC) — respectez toujours les consignes de l'appel.",
        },
        {
          q: "Quelle est la différence entre un CV académique et un résumé ?",
          a: "Un CV académique est un dossier complet et cumulatif de votre vie scientifique (formation, publications, financements, enseignement, service) et peut s'étendre sur de nombreuses pages ; un résumé est un document court, adapté et d'une à deux pages pour les postes hors académie.",
        },
        {
          q: "Comment lister mes publications sur un CV académique ?",
          a: "Listez-les en ordre chronologique inverse, éventuellement regroupées par type, dans un style de citation unique et cohérent, avec votre propre nom mis en évidence et les DOIs inclus. Indiquez clairement les préprints et les travaux soumis, et ne gonflez pas la liste.",
        },
        {
          q: "Puis-je générer automatiquement un CV académique ?",
          a: "Oui. SigmaCV génère un CV académique à partir de vos profils ORCID et OpenAlex (associés par identifiant, non par nom), formate les citations et exporte vers PDF, DOCX, LaTeX, Markdown ou BibTeX — gratuit et open source.",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "CV académique vs résumé : quelle différence ?",
      description:
        "CV académique vs résumé — en quoi ils diffèrent par la longueur, la portée et l'objectif, et lequel utiliser pour des postes académiques, des candidatures en école doctorale, des bourses et des postes en industrie.",
      blocks: [
        {
          type: "p",
          text: "« CV » et « résumé » sont souvent utilisés de façon interchangeable, mais dans le monde académique ce sont deux documents distincts avec des objectifs différents. Choisir le bon — et le mettre en forme correctement — est déterminant pour les candidatures à des postes académiques, des bourses et des financements.",
        },
        {
          type: "p",
          text: "Un CV académique (curriculum vitae) est un dossier complet et cumulatif de votre vie scientifique : formation, publications, financements, enseignement, communications et activités de service. Un résumé est un bref résumé très ciblé — généralement d'une ou deux pages — destiné à un poste non académique spécifique.",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "Les différences essentielles",
        },
        {
          type: "ul",
          items: [
            "Longueur — un CV s'allonge sans limite fixe (souvent plusieurs pages) ; un résumé est réduit à une ou deux pages.",
            "Portée — un CV documente tout ce qui est pertinent pour votre recherche ; un résumé n'inclut que ce qui est pertinent pour le poste visé.",
            "Lectorat — un CV est lu par des pairs et des comités académiques ; un résumé par des recruteurs et des responsables de recrutement.",
            "Stabilité — on enrichit un CV dans le temps et on en retire rarement quelque chose ; on réécrit un résumé pour chaque candidature.",
            "Publications & financements — essentiels dans un CV ; souvent condensés ou omis dans un résumé.",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "Lequel utiliser ?",
        },
        {
          type: "ul",
          items: [
            "Postes académiques, post-doctorats, candidatures en master/doctorat, bourses et financements → un CV académique.",
            "Postes en industrie et la plupart des emplois hors académie → un résumé, adapté à l'offre.",
            "Postes « alt-ac » et emplois en recherche dans le secteur privé → souvent un hybride : un document de la longueur d'un résumé qui met tout de même en valeur les productions de recherche pertinentes.",
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "Transformer un CV en résumé",
        },
        {
          type: "p",
          text: "Pour transformer un CV académique en résumé, commencez par un court résumé de profil, ne conservez que les expériences les plus pertinentes et quelques productions représentatives, traduisez les réalisations académiques en impacts et en compétences transférables, et réduisez le tout à une ou deux pages. Conservez le CV complet comme document de référence et dérivez-en les documents plus courts.",
        },
        {
          type: "h2",
          id: "build-either",
          text: "Générer l'un ou l'autre à partir de votre dossier de recherche",
        },
        {
          type: "p",
          text: "SigmaCV génère un CV académique à partir de vos profils ORCID et OpenAlex et l'exporte dans une gamme de formats et de mises en page en un clic — vous pouvez ainsi conserver un seul dossier canonique et produire la version adaptée à chaque candidature. Gratuit, open source et respectueux de la vie privée.",
        },
        {
          type: "cta",
          label: "Générer votre CV académique gratuitement",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Un CV est-il la même chose qu'un résumé ?",
          a: "Pas dans le monde académique. Un CV académique est un dossier long et complet de votre parcours scientifique ; un résumé est un document court et ciblé d'une à deux pages pour des postes hors académie. En dehors du milieu académique, et dans certains pays, les deux termes sont utilisés de façon plus interchangeable.",
        },
        {
          q: "Faut-il mettre une photo sur un CV académique ?",
          a: "Cela dépend du pays. Certains pays attendent une photo et des données personnelles ; de nombreux contextes académiques (notamment aux États-Unis et au Royaume-Uni) les omettent délibérément pour réduire les biais. Conformez-vous aux normes du pays où vous postulez.",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "Comment lister ses publications sur un CV académique",
      description:
        "Comment mettre en forme et ordonner la section publications d'un CV académique : style de citation, regroupement par type, ordre des auteurs, mise en évidence de son propre nom, préprints et travaux soumis, et ce qu'il faut éviter.",
      blocks: [
        {
          type: "p",
          text: "Pour la plupart des postes académiques, la section publications est celle de votre CV que les comités lisent le plus attentivement, si bien que la façon dont vous la présentez compte presque autant que ce qu'elle contient. Ce guide traite du style de citation, de l'ordonnancement et du regroupement, de la mise en valeur de votre propre contribution, de la gestion des préprints et des travaux soumis, et des erreurs qui nuisent à une liste par ailleurs solide.",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "Choisir un style de citation — et s'y tenir",
        },
        {
          type: "p",
          text: "Choisissez un style de citation adapté à votre domaine (par exemple APA, Vancouver, Chicago ou IEEE) et appliquez-le à chaque entrée. L'erreur la plus fréquente est de mélanger les styles ou de mettre en forme les références à la main, de sorte que deux d'entre elles ne se ressemblent vraiment. Mettre en forme l'ensemble de la liste via un seul moteur — le Citation Style Language (CSL), le standard qui sous-tend les gestionnaires de références comme Zotero — garantit la cohérence de vos CVs PDF, Word et LaTeX.",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "Ordonner et regrouper ses publications",
        },
        {
          type: "ul",
          items: [
            "Listez les travaux en ordre chronologique inverse (les plus récents en premier).",
            "Regroupez par type lorsque la liste est longue : articles de revues évalués par les pairs, préprints, chapitres d'ouvrages, communications de conférences, jeux de données et logiciels.",
            "Étiquetez et séparez clairement les groupes afin que le lecteur puisse trouver instantanément les articles évalués par les pairs.",
            "Soyez cohérent dans la numérotation — numérotez toutes les entrées ou aucune.",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "Mettre en valeur votre propre contribution",
        },
        {
          type: "ul",
          items: [
            "Mettez votre propre nom en évidence (par exemple en gras) dans chaque liste d'auteurs.",
            "Indiquez les rôles de premier auteur, auteur correspondant et contribution égale avec une notation claire et expliquée.",
            "Rappelez-vous que les conventions d'ordre des auteurs varient selon les domaines — ajoutez une brève note si la convention de votre domaine n'est pas évidente.",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "Préprints, travaux soumis et sous presse",
        },
        {
          type: "p",
          text: "Listez les travaux honnêtement avec leur statut. Les préprints sont de plus en plus acceptés sur les CVs mais doivent être étiquetés comme tels, et les éléments « soumis » ou « sous presse » doivent le préciser. Ne présentez jamais un travail non évalué par les pairs comme évalué par les pairs, et ne listez pas le même article deux fois (en tant que préprint et en tant que version publiée) sans expliciter la relation entre les deux.",
        },
        {
          type: "h2",
          id: "identifiers",
          text: "Inclure les identifiants et les liens",
        },
        {
          type: "p",
          text: "Ajoutez un DOI (et un lien) à chaque travail afin que les lecteurs puissent le retrouver, et insérez votre ORCID iD dans votre en-tête. Les identifiants permettent également aux outils de vérifier votre paternité de façon fiable — par identifiant plutôt que par nom, ce qui importe pour les noms courants et les noms en graphies non latines.",
        },
        {
          type: "h2",
          id: "avoid",
          text: "Ce qu'il faut éviter",
        },
        {
          type: "ul",
          items: [
            "Mélanger les styles de citation dans un même document.",
            "Gonfler la liste avec des éléments mineurs ou sans rapport.",
            "Des formes incohérentes de votre propre nom d'une entrée à l'autre.",
            "Des DOIs brisés ou manquants — vérifiez que chaque lien se résout correctement.",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "Générer automatiquement une liste de publications mise en forme",
        },
        {
          type: "p",
          text: "SigmaCV récupère vos publications depuis ORCID et OpenAlex (associées par identifiant, non par nom), les met en forme dans n'importe quel style CSL avec votre propre nom mis en évidence, et exporte la liste vers PDF, Word, LaTeX, Markdown ou BibTeX — afin que chaque version de votre CV soit cohérente et correcte.",
        },
        {
          type: "cta",
          label: "Générer votre liste de publications gratuitement",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Quel style de citation utiliser pour les publications de mon CV ?",
          a: "Utilisez le style habituel de votre domaine (par exemple APA, Vancouver, Chicago, IEEE). L'essentiel est d'appliquer un style de façon cohérente dans l'ensemble de la liste et dans chaque format de votre CV.",
        },
        {
          q: "Faut-il inclure les préprints sur son CV ?",
          a: "Oui — les préprints sont de plus en plus acceptés — mais étiquetez-les clairement comme préprints et séparez-les des articles évalués par les pairs.",
        },
        {
          q: "Comment indiquer une co-première authorship ou une contribution égale ?",
          a: "Marquez les auteurs concernés avec un symbole et expliquez-le dans une courte légende (par exemple « * contribution égale »). Soyez cohérent dans l'ensemble de la liste.",
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "Quelle longueur doit avoir un CV académique ?",
      description:
        "La longueur d'un CV académique selon le stade de carrière, les cas où la longueur est plafonnée (CV courts pour financeurs et employeurs), et pourquoi plus long ne signifie pas meilleur — plus comment conserver un CV maître et exporter des versions plus courtes.",
      blocks: [
        {
          type: "p",
          text: "En bref : un CV académique est aussi long que votre parcours le justifie, et il s'allonge tout au long de votre carrière. Contrairement à un résumé, rien n'impose qu'il tienne sur une ou deux pages. Mais la longueur dépend du stade de carrière et du contexte, et il existe des exceptions importantes.",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "Repères selon le stade de carrière",
        },
        {
          type: "ul",
          items: [
            "Candidat en master / doctorat — environ 2–4 pages.",
            "Doctorant / post-doctorant — environ 3–6 pages.",
            "Chercheur en milieu de carrière — souvent 6–10 pages et plus.",
            "Enseignant-chercheur expérimenté — bien au-delà de dix pages ; la liste de publications et le bilan de financement déterminent la longueur.",
          ],
        },
        {
          type: "p",
          text: "Ce sont des repères, pas des règles. Un CV de quatre pages solide et bien structuré vaut mieux qu'un CV de huit pages gonflé.",
        },
        {
          type: "h2",
          id: "capped",
          text: "Quand la longueur est plafonnée",
        },
        {
          type: "p",
          text: "De nombreux financeurs et employeurs demandent un « CV court » avec une limite de pages stricte (souvent deux pages), ou un format narratif structuré tel que le NIH biosketch, le Résumé pour la recherche et l'innovation (R4RI) de l'UKRI, un CV ERC ou le format SNSF suisse. Lorsqu'un appel précise une longueur ou un format, respectez-les scrupuleusement — dépasser la limite peut entraîner le rejet d'une candidature sans examen.",
        },
        {
          type: "h2",
          id: "quality",
          text: "Plus long ne signifie pas meilleur",
        },
        {
          type: "p",
          text: "L'exhaustivité est attendue, mais le remplissage ne l'est pas. Incluez ce qui est pertinent, ordonnez votre contenu de façon à ce que les éléments les plus forts soient faciles à trouver, et supprimez le superflu. Les évaluateurs récompensent la clarté et la pertinence, pas le nombre de pages.",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "Conserver un CV maître, exporter des versions plus courtes",
        },
        {
          type: "p",
          text: "L'approche pratique consiste à maintenir un CV « maître » complet et à en dériver des versions plus courtes ou spécifiques à un financeur. SigmaCV procède ainsi à partir d'un seul dossier canonique : conservez tout au même endroit, puis appliquez une mise en page en un clic (NIH, NSF, ERC, UKRI R4RI, et plus encore) ou réduisez les sections pour un appel spécifique, de façon réversible, et exportez.",
        },
        {
          type: "cta",
          label: "Générer votre CV académique gratuitement",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Y a-t-il une limite de pages pour un CV académique ?",
          a: "En général, non — un CV académique complet est aussi long que votre parcours le justifie. Font exception les « CV courts » exigés par des financeurs ou des employeurs, qui limitent souvent la longueur ou imposent un format narratif ; respectez toujours les consignes de l'appel.",
        },
        {
          q: "Quelle longueur doit avoir un CV pour une candidature en doctorat ?",
          a: "Généralement environ 2–4 pages. À ce stade, une expérience de recherche claire et quelques productions représentatives comptent davantage que la longueur.",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "CV académique pour les candidatures en école doctorale",
      description:
        "Ce qu'il faut mettre dans un CV académique pour des candidatures en master, doctorat ou école doctorale lorsque vous n'avez pas encore beaucoup de publications — et comment faire bonne impression sur un comité d'admission.",
      blocks: [
        {
          type: "p",
          text: "Si vous postulez à un programme de master ou de doctorat et que vous craignez que votre CV paraisse mince, c'est tout à fait normal — les commissions d'admission n'attendent pas une longue liste de publications à ce stade. Elles cherchent des preuves de potentiel : une expérience de recherche, des compétences pertinentes et une trajectoire claire. Voici ce qu'il faut inclure et comment le présenter.",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "Ce qu'il faut inclure",
        },
        {
          type: "ul",
          items: [
            "Formation — diplômes, établissements, dates et votre GPA ou mention s'ils sont solides ; incluez le titre de votre mémoire ou projet de fin d'études.",
            "Expérience de recherche — laboratoires, projets et thèses, avec votre rôle, les méthodes utilisées et les résultats obtenus.",
            "Publications & communications — tout article, préprint, poster ou communication orale en conférence, même à un stade précoce.",
            "Compétences — compétences de laboratoire, techniques, statistiques, de programmation et linguistiques pertinentes pour le domaine.",
            "Prix & bourses — distinctions académiques et financements.",
            "Expériences pertinentes — enseignement, tutorat, emplois ou activités bénévoles en lien avec le domaine.",
            "Références — ou une mention indiquant qu'elles sont disponibles sur demande.",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "Commencer par l'expérience de recherche",
        },
        {
          type: "p",
          text: "Même sans publications, l'expérience de recherche est votre atout le plus fort. Pour chaque projet, précisez quelle était la question de recherche, ce que vous avez fait (techniques, analyses, votre rôle spécifique) et ce qui en est résulté. Des contributions concrètes donnent bien plus d'impact qu'une liste de noms de cours.",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "Longueur et mise en forme",
        },
        {
          type: "p",
          text: "Un CV pour une candidature en école doctorale fait généralement 2–4 pages. Veillez à une mise en forme propre et cohérente, utilisez des titres de sections clairs et adaptez l'accent au programme visé. Un CV concis est une bonne chose — ne pas gonfler.",
        },
        {
          type: "h2",
          id: "build",
          text: "Générer votre CV à partir de votre dossier",
        },
        {
          type: "p",
          text: "SigmaCV assemble un CV académique soigné à partir de votre profil ORCID et de données ouvertes, de sorte que même vos premières publications, préprints et posters sont mis en forme de façon correcte et cohérente — et vous pouvez ajouter tout travail par DOI. Gratuit et open source.",
        },
        {
          type: "cta",
          label: "Générer votre CV pour l'école doctorale gratuitement",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Faut-il avoir des publications pour un CV de candidature en doctorat ?",
          a: "Non. Au stade de la candidature, l'expérience de recherche, les compétences pertinentes et une trajectoire claire comptent davantage qu'une liste de publications. Incluez les préprints ou posters que vous avez, mais leur absence est tout à fait normale.",
        },
        {
          q: "Quelle longueur doit avoir un CV pour une candidature en école doctorale ?",
          a: "En général 2–4 pages. Restez concentré : une expérience de recherche claire et quelques éléments représentatifs valent mieux que le remplissage.",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title:
        "Utiliser les indicateurs de façon responsable sur un CV académique (DORA & le Leiden Manifesto)",
      description:
        "Comment présenter les indicateurs de recherche sur un CV de façon responsable : pourquoi le facteur d'impact des revues et l'indice h induisent en erreur, ce qu'apportent les indicateurs normalisés par le champ, et ce que recommandent DORA et le Leiden Manifesto.",
      blocks: [
        {
          type: "p",
          text: "Les indicateurs sont une formule tentante sur un CV, mais ils sont facilement mal utilisés — et les comités s'attendent de plus en plus à ce que les chercheurs en fassent un usage responsable. Ce guide explique quels indicateurs induisent en erreur, lesquels sont plus défendables, et ce que les principaux cadres d'évaluation responsable recommandent.",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "Pourquoi le facteur d'impact des revues est le mauvais outil",
        },
        {
          type: "p",
          text: "Le facteur d'impact des revues (JIF) mesure les citations moyennes d'une revue, et non la qualité ou l'impact de votre article individuel. Les distributions de citations sont très asymétriques, si bien qu'un seul article publié dans une revue à JIF élevé ne dit presque rien sur cet article en particulier. DORA — la Déclaration de San Francisco sur l'évaluation de la recherche — déconseille explicitement d'utiliser le JIF pour évaluer la recherche individuelle ou les chercheurs.",
        },
        {
          type: "h2",
          id: "h-index",
          text: "L'indice h et les comptes bruts ont leurs limites",
        },
        {
          type: "p",
          text: "L'indice h et les comptes bruts de citations dépendent fortement du domaine et de la durée de carrière, si bien qu'ils ne sont pas comparables entre disciplines et désavantagent les chercheurs en début de carrière. Ils peuvent également être gonflés artificiellement. Si vous les incluez, donnez du contexte ; ne les présentez jamais comme une mesure autonome de la valeur.",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "Privilégier les indicateurs normalisés par le champ",
        },
        {
          type: "p",
          text: "Les indicateurs normalisés par le champ — tels que le FWCI (Field-Weighted Citation Impact) ou le RCR (Relative Citation Ratio) du NIH iCite — tiennent compte des différences de taux de citation entre domaines et dans le temps, et sont donc plus comparables que les comptes bruts. Ils restent imparfaits et doivent être interprétés avec contexte, jamais comme le seul signal.",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "Ce que recommandent DORA et le Leiden Manifesto",
        },
        {
          type: "ul",
          items: [
            "DORA — ne pas utiliser les indicateurs liés aux revues (comme le JIF) pour évaluer les contributions individuelles ; évaluer la recherche sur ses propres mérites.",
            "Le Leiden Manifesto — utiliser les indicateurs quantitatifs pour soutenir, et non remplacer, le jugement d'experts ; tenir compte des différences entre domaines ; maintenir la transparence des données et des méthodes ; et éviter la fausse précision.",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "Conseils pratiques pour votre CV",
        },
        {
          type: "ul",
          items: [
            "Commencez par les travaux eux-mêmes — ce que vous avez fait et pourquoi cela compte — et non par des chiffres.",
            "Si vous incluez des indicateurs, préférez les indicateurs normalisés par le champ et donnez du contexte (domaine, fenêtre temporelle, centile).",
            "Envisagez une courte description narrative de vos contributions clés, à la place ou en complément des chiffres.",
            "Ne citez jamais le facteur d'impact des revues dans lesquelles vos articles ont été publiés.",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Des indicateurs responsables, par défaut",
        },
        {
          type: "p",
          text: "SigmaCV est conçu selon cette philosophie : les indicateurs sont désactivés par défaut et optionnels, il privilégie les indicateurs normalisés par le champ aux comptes bruts, et n'affiche jamais le facteur d'impact d'une revue — en accord avec DORA. Vous gardez le contrôle total sur la présence ou non de tout indicateur dans votre CV.",
        },
        {
          type: "cta",
          label: "Générer un CV aligné sur DORA gratuitement",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Faut-il mettre son indice h sur son CV ?",
          a: "C'est optionnel et dépend du domaine. Si vous l'incluez, donnez du contexte et associez-le à des indicateurs normalisés par le champ plutôt que de le présenter seul ; de nombreux comités déconseillent de s'y fier excessivement.",
        },
        {
          q: "Est-il acceptable de lister les facteurs d'impact des revues sur un CV ?",
          a: "C'est déconseillé. DORA recommande expressément de ne pas utiliser le facteur d'impact des revues pour évaluer la recherche individuelle, car il mesure la revue, et non votre article.",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "Le format du CV académique selon le pays",
      description:
        "En quoi les conventions du CV académique diffèrent selon les pays — la distinction CV/résumé, les photos et données personnelles, la longueur, le format Europass et les formats narratifs des financeurs — et comment adapter le vôtre.",
      blocks: [
        {
          type: "p",
          text: "Il n'existe pas de norme mondiale unique pour un CV académique. Les conventions varient selon les pays et les institutions — le nom même du document, l'inclusion ou non d'une photo, la longueur attendue et le format structuré qu'un financeur peut exiger. Ce guide présente les principales différences et explique comment adapter votre CV au pays où vous postulez.",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "La distinction CV / résumé varie",
        },
        {
          type: "p",
          text: "Aux États-Unis et au Canada, un « CV » académique désigne le long document scientifique complet, tandis qu'un « résumé » est la version courte d'une à deux pages pour l'industrie. Au Royaume-Uni et dans une grande partie de l'Europe, « CV » peut désigner l'un ou l'autre, et la version académique se comprend simplement selon le contexte. Adaptez le terme et la longueur aux attentes du pays et du poste visés.",
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "Photos et données personnelles",
        },
        {
          type: "p",
          text: "C'est la plus grande différence d'un pays à l'autre. Dans certaines parties de l'Europe continentale, de l'Asie et de l'Amérique latine, un CV peut être attendu avec une photo, une date de naissance ou une nationalité. Aux États-Unis et au Royaume-Uni, ces éléments sont délibérément omis pour réduire les biais, et les inclure peut jouer en votre défaveur. En cas de doute, conformez-vous aux normes du pays de destination — et n'incluez jamais de données personnelles qu'un employeur vous a explicitement demandé de ne pas mentionner.",
        },
        {
          type: "h2",
          id: "length",
          text: "Attentes en matière de longueur",
        },
        {
          type: "p",
          text: "Un CV académique complet n'a pas de limite de pages fixe et s'allonge avec votre parcours, mais les attentes diffèrent : certaines candidatures européennes favorisent un CV plus concis, tandis que les CVs académiques américains sont souvent exhaustifs. Déférez toujours à une limite de pages explicite lorsqu'un appel ou un employeur en précise une.",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass et les formats structurés",
        },
        {
          type: "p",
          text: "Dans l'Union européenne, le CV Europass est un modèle structuré courant, et certaines institutions le demandent. Plusieurs pays et systèmes disposent de leurs propres mises en page attendues. Lorsqu'un format structuré est requis, suivez-le scrupuleusement plutôt que de soumettre un CV en forme libre.",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "Les CVs narratifs des financeurs selon les régions",
        },
        {
          type: "p",
          text: "Les grands financeurs exigent de plus en plus leurs propres formats : le Résumé pour la recherche et l'innovation (R4RI) de l'UKRI au Royaume-Uni, le CV ERC dans l'UE, le format SNSF en Suisse, et le NIH biosketch ou le format NSF aux États-Unis. Ces formats sont narratifs ou fortement structurés et diffèrent d'un CV standard — préparez-les à partir de votre dossier complet pour chaque candidature.",
        },
        {
          type: "h2",
          id: "adapt",
          text: "Comment adapter votre CV",
        },
        {
          type: "p",
          text: "Conservez un CV complet et canonique unique et dérivez-en des versions adaptées au pays ou au financeur, plutôt que d'en maintenir plusieurs de zéro. SigmaCV génère ce CV canonique à partir de votre dossier de recherche ouvert et applique des mises en page de financeurs en un clic (UKRI R4RI, ERC, SNSF, NIH, NSF et plus encore) de façon réversible, de sorte que l'adaptation aux attentes d'un pays est une modification rapide, non une réécriture.",
        },
        {
          type: "cta",
          label: "Générer votre CV académique gratuitement",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Faut-il mettre une photo sur son CV académique ?",
          a: "Cela dépend du pays. Certains pays attendent une photo et des données personnelles ; la norme académique aux États-Unis et au Royaume-Uni est de les omettre pour réduire les biais. Suivez les conventions du pays où vous postulez.",
        },
        {
          q: "Un CV académique est-il le même partout ?",
          a: "Non. Le terme utilisé, la longueur attendue, l'inclusion de données personnelles et les formats imposés par les financeurs varient selon les pays. Adaptez votre CV au pays et à l'institution de destination.",
        },
      ],
    },
  },
  "de-DE": {
    "how-to-write-an-academic-cv": {
      title: "Wie man einen akademischen Lebenslauf schreibt",
      description:
        "Ein praktischer Leitfaden zum Verfassen eines akademischen Lebenslaufs: was enthalten sein sollte, wie die einzelnen Abschnitte geordnet und formatiert werden, wie lang er sein sollte, wie Publikationen aufgeführt werden und wie die Konventionen je nach Karrierestufe und Land variieren.",
      blocks: [
        {
          type: "p",
          text: "Ein akademischer Lebenslauf (Curriculum Vitae) ist das Standarddokument für Bewerbungen auf Forschungs- und Lehrpositionen, Graduiertenprogramme, Stipendien und Förderanträge. Anders als einem ein- oder zweiseitigen Résumé ist er eine vollständige, wachsende Aufzeichnung Ihres wissenschaftlichen Lebens – Ausbildung, Publikationen, Fördermittel, Lehrtätigkeit und Gremienarbeit – und er wächst im Laufe Ihrer Karriere stetig an.",
        },
        {
          type: "p",
          text: "Dieser Leitfaden behandelt, was enthalten sein sollte, wie die einzelnen Abschnitte geordnet und formatiert werden, wie lang ein akademischer Lebenslauf sein sollte, wie Publikationen aufgeführt werden und wie die Konventionen je nach Karrierestufe und Land variieren. Wenn Sie ihn lieber nicht von Hand zusammenstellen möchten, können Sie ihn automatisch aus Ihrem ORCID-Profil erstellen lassen – siehe den letzten Abschnitt.",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "Was ist ein akademischer Lebenslauf?",
        },
        {
          type: "p",
          text: "Ein Lebenslauf ist eine umfassende akademische Biografie. Seine Aufgabe besteht darin, die gesamte Breite Ihrer wissenschaftlichen Beiträge zu dokumentieren, damit eine Berufungskommission, ein Fördergeber oder ein Zulassungsausschuss Ihre Leistungen beurteilen kann. Während ein Résumé auf eine einzelne Stelle zugeschnitten und gekürzt ist, ist ein akademischer Lebenslauf erschöpfend und kumulativ: Sie fügen im Laufe der Zeit Inhalte hinzu und entfernen kaum etwas.",
        },
        {
          type: "p",
          text: "Da er von Fachleuten gelesen wird, stellt ein akademischer Lebenslauf Vollständigkeit und Genauigkeit über Kürze. Klare Struktur, einheitliche Formatierung und korrekt formatierte Zitierungen sind wichtiger als visueller Aufwand.",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "Was enthalten sein sollte: die Kernabschnitte",
        },
        {
          type: "p",
          text: "Die meisten akademischen Lebensläufe bauen auf denselben Grundbausteinen auf. Nehmen Sie die für Ihr Fachgebiet und Ihre Karrierestufe relevanten Abschnitte auf und lassen Sie diejenigen weg, für die Sie noch nichts einzutragen haben:",
        },
        {
          type: "ul",
          items: [
            "Kopfzeile – Name, aktuelle Position und berufliche Kontaktdaten (sowie Ihre ORCID iD).",
            "Forschungsinteressen / Zusammenfassung – einige Zeilen, die Ihre Arbeit umreißen (optional, häufiger zu Beginn einer Karriere).",
            "Ausbildung – Abschlüsse in umgekehrt chronologischer Reihenfolge, mit Institution, Daten und Thesistitel.",
            "Stellen / Positionen – akademische und relevante berufliche Tätigkeiten.",
            "Publikationen – das Herzstück für die meisten Forschungspositionen (siehe unten).",
            "Drittmittel & Förderung – eingeworbene Fördermittel mit Fördergeber, Titel, Betrag und Laufzeit.",
            "Auszeichnungen & Ehrungen – Stipendien, Preise und Auszeichnungen.",
            "Lehre – gelehrte Kurse, Gastvorlesungen und Lehraufgaben.",
            "Betreuung & Mentoring – betreute Studierende und Nachwuchswissenschaftler.",
            "Vorträge – eingeladene Vorträge, Konferenzbeiträge und Poster.",
            "Gremienarbeit – Gutachtertätigkeit, Herausgeberrollen, Ausschüsse und Öffentlichkeitsarbeit.",
            "Berufliche Mitgliedschaften, Kompetenzen und Referenzen – je nach Relevanz für Ihr Fachgebiet.",
          ],
        },
        {
          type: "h3",
          text: "Reihenfolge der Abschnitte",
        },
        {
          type: "p",
          text: "Nach der Kopfzeile, Ausbildung und Positionen beginnen Sie mit dem, was für die angestrebte Stelle am stärksten ist. Für forschungsintensive Stellen und Förderanträge stellen Sie Publikationen und Fördermittel voran; für lehrorientierte Positionen rücken Sie Lehre und Betreuung nach vorne. Passen Sie die Reihenfolge an die Leserschaft an, ohne Inhalte zu erfinden oder aufzublähen.",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "Wie Publikationen aufgeführt werden",
        },
        {
          type: "p",
          text: "Die Publikationsliste ist der Teil, dem die meisten Kommissionen die meiste Zeit widmen. Gestalten Sie sie deshalb leicht zu überfliegen und unmissverständlich:",
        },
        {
          type: "ul",
          items: [
            "Führen Sie Werke in umgekehrt chronologischer Reihenfolge auf, optional gruppiert nach Typ (Zeitschriftenartikel, Preprints, Buchkapitel, Konferenzbeiträge, Datensätze, Software).",
            "Verwenden Sie durchgehend einen einheitlichen Zitierstil und halten Sie ihn über alle Versionen Ihres Lebenslaufs identisch.",
            "Heben Sie Ihren eigenen Namen in jeder Autorenliste hervor, damit Ihr Beitrag auf den ersten Blick erkennbar ist.",
            "Fügen Sie DOIs (und Links) bei, damit Leserinnen und Leser die Arbeit finden können.",
            "Kennzeichnen Sie eingereichte, im Druck befindliche oder als Preprint vorliegende Werke klar und ehrlich.",
            "Füllen Sie die Liste nicht auf – Qualität und Relevanz überzeugen mehr als Quantität.",
          ],
        },
        {
          type: "p",
          text: "Einheitlichkeit ist der häufigste Schwachpunkt. Wenn alle Referenzen durch einen einzigen Zitierstil formatiert werden – die Citation Style Language (CSL) ist der Standard hinter Tools wie Zotero – ist gewährleistet, dass Ihr Word-, PDF- und LaTeX-Lebenslauf identisch aussehen.",
        },
        {
          type: "h2",
          id: "how-long",
          text: "Wie lang sollte ein akademischer Lebenslauf sein?",
        },
        {
          type: "p",
          text: "Es gibt keine feste Seitenbegrenzung – ein akademischer Lebenslauf ist so lang, wie es Ihre Leistungen rechtfertigen, und er wächst im Laufe der Zeit. Als grobe Orientierung: Ein Master- oder Doktorand könnte 2–4 Seiten haben, ein Postdoktorand 3–6 und ein erfahrener Professor weit über zehn. Eine Ausnahme bilden „Kurz-Lebensläufe“ für Fördergeber und Stellenausschreibungen, die oft eine Längenbeschränkung (z. B. zwei Seiten) vorgeben oder ein narratives Format wie den NIH Biosketch, das UKRI Résumé for Research and Innovation (R4RI) oder einen ERC-Lebenslauf verwenden. Wenn eine Ausschreibung ein Format oder ein Seitenlimit vorgibt, halten Sie es genau ein.",
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "Anpassung nach Karrierestufe",
        },
        {
          type: "ul",
          items: [
            "Studierende & Bewerberinnen und Bewerber fürs Masterstudium oder die Promotion – betonen Sie Ausbildung, Ihre Abschlussarbeit oder Ihr Forschungsprojekt, etwaige Publikationen oder Vorträge, relevante Kompetenzen und Referenzen; kurz darf er gerne sein.",
            "Promovierende & Postdoktoranden – stellen Sie Publikationen, Konferenzaktivitäten, Stipendien/Fördermittel und Lehrtätigkeit voran; halten Sie ihn aktuell für laufende Stellen- und Förderantragsfristen.",
            "Professorinnen und Professoren & Gruppenleiterinnen und Gruppenleiter – stellen Sie Drittmittel, Publikationen, Betreuung und Gremienarbeit/Führungsaufgaben in den Vordergrund; erwarten Sie ein langes, gegliedertes Dokument und einen separaten Kurz-Lebenslauf für Fördergeber.",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "Formatierung und Länderunterschiede",
        },
        {
          type: "p",
          text: "Die Konventionen variieren. In den USA und Kanada ist ein akademischer „CV“ das lange wissenschaftliche Dokument (ein „Résumé“ ist die kurze Industrieversion), während in weiten Teilen Europas „CV“ beides bedeuten kann. Einige Länder erwarten ein Foto, Geburtsdatum oder Staatsangehörigkeit; viele andere – und die meisten akademischen Kontexte in den USA und im Vereinigten Königreich – lassen persönliche Angaben bewusst weg, um Vorurteile zu reduzieren. Europäische Bewerberinnen und Bewerber verwenden manchmal das Europass-Format, und wichtige Fördergeber verlangen zunehmend ihre eigenen narrativen Lebensläufe. Im Zweifel passen Sie sich den Normen des Landes und der Institution an, bei der Sie sich bewerben.",
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "Häufige Fehler, die vermieden werden sollten",
        },
        {
          type: "ul",
          items: [
            "Uneinheitliche Formatierung oder das Mischen mehrerer Zitierstile in einem Dokument.",
            "Auffüllen der Publikationsliste oder Verbergen der wichtigsten Arbeiten.",
            "Den Lebenslauf zwischen Bewerbungen veralten lassen.",
            "Das geforderte Format oder Seitenlimit einer Ausschreibung ignorieren.",
            "Sich bei Publikationen auf einen Namensabgleich verlassen – häufige Namen und Namen in nicht-lateinischen Schriften werden leicht mit den Werken anderer verwechselt.",
            "Tippfehler und fehlerhafte Links – Korrektur lesen und jeden DOI überprüfen.",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "Ihren akademischen Lebenslauf automatisch erstellen",
        },
        {
          type: "p",
          text: "Einen akademischen Lebenslauf aktuell zu halten ist eine repetitive, manuelle Arbeit. SigmaCV (kostenlos und quelloffen) erstellt ihn für Sie aus Ihrem ORCID- und OpenAlex-Profil – Ihre Werke werden per Identifier abgeglichen, nie per Name – formatiert alle Zitierungen einheitlich und exportiert in PDF, Word, LaTeX, Markdown oder BibTeX oder als lebendige öffentliche Seite, die sich automatisch aktualisiert. Metriken sind standardmäßig deaktiviert und feldnormiert, im Einklang mit DORA, und Ihre Daten gehören Ihnen (feldgenaue Einwilligung, Export, Löschung).",
        },
        {
          type: "cta",
          label: "Akademischen Lebenslauf kostenlos erstellen",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Wie lang sollte ein akademischer Lebenslauf sein?",
          a: "Es gibt keine feste Begrenzung; er wächst mit Ihren Leistungen. Ein Doktorand hat oft 2–4 Seiten, ein Postdoktorand 3–6 und ein erfahrener Wissenschaftler deutlich mehr. „Kurz-Lebensläufe“ für Fördergeber und Stellen können die Länge begrenzen oder ein narratives Format erfordern (z. B. NIH Biosketch, UKRI R4RI, ERC) – befolgen Sie stets die Ausschreibungsregeln.",
        },
        {
          q: "Was ist der Unterschied zwischen einem akademischen Lebenslauf und einem Résumé?",
          a: "Ein akademischer Lebenslauf ist eine vollständige, kumulative Aufzeichnung Ihres wissenschaftlichen Lebens (Ausbildung, Publikationen, Förderung, Lehre, Gremienarbeit) und kann viele Seiten umfassen; ein Résumé ist ein kurzes, auf eine Stelle zugeschnittenes ein- bis zweiseitiges Dokument für nicht-akademische Stellen.",
        },
        {
          q: "Wie sollte ich Publikationen in einem akademischen Lebenslauf aufführen?",
          a: "Führen Sie sie in umgekehrt chronologischer Reihenfolge auf, optional nach Typ gruppiert, in einem einheitlichen Zitierstil, mit hervorgehobenem eigenen Namen und enthaltenen DOIs. Kennzeichnen Sie Preprints und eingereichte Arbeiten klar und füllen Sie die Liste nicht auf.",
        },
        {
          q: "Kann ich einen akademischen Lebenslauf automatisch erstellen?",
          a: "Ja. SigmaCV erstellt einen akademischen Lebenslauf aus Ihrem ORCID- und OpenAlex-Profil (per Identifier abgeglichen, nicht per Name), formatiert die Zitierungen und exportiert in PDF, DOCX, LaTeX, Markdown oder BibTeX – kostenlos und quelloffen.",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "Akademischer Lebenslauf vs. Résumé: Was ist der Unterschied?",
      description:
        "Akademischer Lebenslauf vs. Résumé – wie sie sich in Länge, Umfang und Zweck unterscheiden und welches für akademische Bewerbungen, Zulassungsanträge fürs Graduiertenstudium, Förderanträge und Branchenstellen verwendet werden sollte.",
      blocks: [
        {
          type: "p",
          text: "„CV“ und „Résumé“ werden oft synonym verwendet, aber in der Wissenschaft sind es unterschiedliche Dokumente mit unterschiedlichen Aufgaben. Das richtige Dokument zu wählen – und es korrekt zu formatieren – ist entscheidend für akademische Stellen-, Stipendien- und Förderanträge.",
        },
        {
          type: "p",
          text: "Ein akademischer Lebenslauf (Curriculum Vitae) ist eine vollständige, kumulative Aufzeichnung Ihres wissenschaftlichen Lebens: Ausbildung, Publikationen, Förderung, Lehre, Vorträge und Gremienarbeit. Ein Résumé ist eine kurze, stark zugeschnittene Zusammenfassung – üblicherweise ein oder zwei Seiten – die auf eine bestimmte nicht-akademische Stelle ausgerichtet ist.",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "Die wesentlichen Unterschiede",
        },
        {
          type: "ul",
          items: [
            "Länge – ein Lebenslauf wächst ohne feste Grenze (oft mehrere Seiten); ein Résumé wird auf ein oder zwei Seiten gekürzt.",
            "Umfang – ein Lebenslauf dokumentiert alles, was für Ihre Wissenschaft relevant ist; ein Résumé enthält nur das, was für die angestrebte Stelle relevant ist.",
            "Zielgruppe – ein Lebenslauf wird von akademischen Fachkollegen und Kommissionen gelesen; ein Résumé von Personalverantwortlichen und Einstellungsmanagern.",
            "Stabilität – Sie ergänzen einen Lebenslauf im Laufe der Zeit und kürzen ihn selten; ein Résumé schreiben Sie für jede Bewerbung neu.",
            "Publikationen & Förderung – zentral für einen Lebenslauf; bei einem Résumé in der Regel zusammengefasst oder weggelassen.",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "Welches sollten Sie verwenden?",
        },
        {
          type: "ul",
          items: [
            "Akademische Stellen, Postdoktoratsstellen, PhD-/Graduiertenanträge, Stipendien und Förderanträge → ein akademischer Lebenslauf.",
            "Industriestellen und die meisten nicht-akademischen Rollen → ein Résumé, auf die Stellenausschreibung zugeschnitten.",
            "„Alt-ac“- und forschungsnahe Industrierollen → oft ein Hybrid: ein résumé-langes Dokument, das relevante Forschungsleistungen dennoch hervorhebt.",
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "Einen Lebenslauf in ein Résumé umwandeln",
        },
        {
          type: "p",
          text: "Um einen akademischen Lebenslauf in ein Résumé zu verwandeln, beginnen Sie mit einer kurzen Zusammenfassung, behalten Sie nur die relevantesten Erfahrungen und einige repräsentative Leistungen bei, übersetzen Sie akademische Erfolge in Wirkung und übertragbare Kompetenzen und kürzen Sie auf ein oder zwei Seiten. Bewahren Sie den vollständigen Lebenslauf als Stammdokument und leiten Sie kürzere Dokumente daraus ab.",
        },
        {
          type: "h2",
          id: "build-either",
          text: "Beides aus Ihrem Forschungsprofil erstellen",
        },
        {
          type: "p",
          text: "SigmaCV erstellt einen akademischen Lebenslauf aus Ihrem ORCID- und OpenAlex-Profil und exportiert ihn in verschiedenen Formaten und mit Ein-Klick-Layouts – so können Sie ein einziges kanonisches Profil pflegen und die für jede Bewerbung benötigte Version erzeugen. Es ist kostenlos, quelloffen und datenschutzorientiert.",
        },
        {
          type: "cta",
          label: "Akademischen Lebenslauf kostenlos erstellen",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Ist ein Lebenslauf dasselbe wie ein Résumé?",
          a: "Nicht in der Wissenschaft. Ein akademischer Lebenslauf ist eine lange, vollständige Aufzeichnung Ihrer wissenschaftlichen Tätigkeit; ein Résumé ist ein kurzes, auf eine Stelle zugeschnittenes ein- bis zweiseitiges Dokument für nicht-akademische Rollen. Außerhalb der Wissenschaft und in einigen Ländern werden die beiden Begriffe lockerer verwendet.",
        },
        {
          q: "Brauche ich ein Foto in einem akademischen Lebenslauf?",
          a: "Das hängt vom Land ab. Einige Länder erwarten ein Foto und persönliche Angaben; viele akademische Kontexte (insbesondere in den USA und im Vereinigten Königreich) lassen diese bewusst weg, um Vorurteile zu reduzieren. Passen Sie sich den Normen des Bewerbungslandes an.",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "Wie man Publikationen in einem akademischen Lebenslauf aufführt",
      description:
        "Wie man den Publikationsabschnitt eines akademischen Lebenslaufs formatiert und ordnet: Zitierstil, Gruppierung nach Typ, Autorenreihenfolge, Hervorhebung des eigenen Namens, Preprints und eingereichte Arbeiten sowie was zu vermeiden ist.",
      blocks: [
        {
          type: "p",
          text: "Für die meisten akademischen Positionen ist der Publikationsabschnitt der Teil Ihres Lebenslaufs, den die Kommissionen am genauesten lesen – daher ist die Darstellung fast ebenso wichtig wie der Inhalt. Dieser Leitfaden behandelt Zitierstil, Anordnung und Gruppierung, wie Sie Ihren eigenen Beitrag erkennbar machen, den Umgang mit Preprints und eingereichten Arbeiten sowie die Fehler, die eine ansonsten starke Liste untergraben.",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "Einen Zitierstil wählen – und dabei bleiben",
        },
        {
          type: "p",
          text: "Wählen Sie einen für Ihr Fachgebiet geeigneten Zitierstil (zum Beispiel APA, Vancouver, Chicago oder IEEE) und wenden Sie ihn auf jeden Eintrag an. Der häufigste Fehler ist das Mischen von Stilen oder das manuelle Formatieren von Referenzen, sodass keine zwei gleich aussehen. Wenn die gesamte Liste durch eine einzige Engine formatiert wird – die Citation Style Language (CSL), der Standard hinter Literaturverwaltungsprogrammen wie Zotero – ist die Einheitlichkeit Ihrer PDF-, Word- und LaTeX-Lebensläufe gewährleistet.",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "Publikationen ordnen und gruppieren",
        },
        {
          type: "ul",
          items: [
            "Führen Sie Werke in umgekehrt chronologischer Reihenfolge auf (neueste zuerst).",
            "Gruppieren Sie nach Typ, wenn die Liste lang ist: begutachtete Zeitschriftenartikel, Preprints, Buchkapitel, Konferenzbeiträge, Datensätze und Software.",
            "Halten Sie die Gruppen klar beschriftet und getrennt, sodass begutachtete Arbeiten sofort auffindbar sind.",
            "Gehen Sie bei der Nummerierung einheitlich vor – nummerieren Sie jeden Eintrag oder keinen.",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "Den eigenen Beitrag erkennbar machen",
        },
        {
          type: "ul",
          items: [
            "Heben Sie Ihren eigenen Namen (z. B. fett gedruckt) in jeder Autorenliste hervor.",
            "Kennzeichnen Sie Erst-, Korrespondenz- und gleichwertige Beitragsrollen mit einer klaren, erläuterten Notation.",
            "Bedenken Sie, dass die Konventionen zur Autorenreihenfolge je nach Fachgebiet variieren – fügen Sie eine kurze Anmerkung hinzu, wenn die Konvention Ihres Fachgebiets nicht offensichtlich ist.",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "Preprints, eingereichte und im Druck befindliche Arbeiten",
        },
        {
          type: "p",
          text: "Führen Sie Arbeiten ehrlich mit ihrem Status auf. Preprints werden auf Lebensläufen zunehmend akzeptiert, sollten aber als Preprints gekennzeichnet werden, und „eingereicht“ oder „im Druck“ sollte entsprechend angegeben werden. Stellen Sie nie nicht-begutachtete Arbeiten als begutachtete dar und führen Sie dasselbe Papier nicht zweimal auf (z. B. sowohl als Preprint als auch als veröffentlichte Version), ohne die Beziehung deutlich zu machen.",
        },
        {
          type: "h2",
          id: "identifiers",
          text: "Identifier und Links einfügen",
        },
        {
          type: "p",
          text: "Fügen Sie jedem Werk einen DOI (und einen Link) hinzu, damit Leserinnen und Leser es finden können, und tragen Sie Ihre ORCID iD in die Kopfzeile ein. Identifier ermöglichen es Tools, Ihre Autorenschaft zuverlässig per Identifier zu verifizieren – anstatt per Name, was bei häufigen Namen und Namen in nicht-lateinischen Schriften besonders wichtig ist.",
        },
        {
          type: "h2",
          id: "avoid",
          text: "Was zu vermeiden ist",
        },
        {
          type: "ul",
          items: [
            "Das Mischen von Zitierstilen innerhalb eines Dokuments.",
            "Das Auffüllen der Liste mit geringfügigen oder irrelevanten Einträgen.",
            "Inkonsistente Schreibweisen des eigenen Namens in den Einträgen.",
            "Fehlerhafte oder fehlende DOIs – überprüfen Sie, dass jeder Link funktioniert.",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "Eine formatierte Publikationsliste automatisch erstellen",
        },
        {
          type: "p",
          text: "SigmaCV ruft Ihre Publikationen aus ORCID und OpenAlex ab (per Identifier abgeglichen, nicht per Name), formatiert sie in einem beliebigen CSL-Stil mit hervorgehobenem eigenen Namen und exportiert die Liste in PDF, Word, LaTeX, Markdown oder BibTeX – sodass jede Version Ihres Lebenslaufs einheitlich und korrekt ist.",
        },
        {
          type: "cta",
          label: "Publikationsliste kostenlos erstellen",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Welchen Zitierstil sollte ich für die Publikationen in meinem Lebenslauf verwenden?",
          a: "Verwenden Sie den in Ihrem Fachgebiet üblichen Stil (z. B. APA, Vancouver, Chicago, IEEE). Am wichtigsten ist es, einen Stil einheitlich über die gesamte Liste und alle Formate Ihres Lebenslaufs anzuwenden.",
        },
        {
          q: "Sollte ich Preprints in meinen Lebenslauf aufnehmen?",
          a: "Ja – Preprints werden zunehmend akzeptiert – aber kennzeichnen Sie sie klar als Preprints und halten Sie sie von begutachteten Artikeln getrennt.",
        },
        {
          q: "Wie weise ich auf gleichrangige oder geteilte Erstautorenschaft hin?",
          a: "Markieren Sie die betreffenden Autoren mit einem Symbol und erläutern Sie es in einer kurzen Legende (z. B. „* gleicher Beitrag“). Gehen Sie dabei in der gesamten Liste einheitlich vor.",
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "Wie lang sollte ein akademischer Lebenslauf sein?",
      description:
        "Wie lang ein akademischer Lebenslauf je nach Karrierestufe sein sollte, wann die Länge begrenzt ist (Kurz-Lebensläufe für Fördergeber und Stellen) und warum länger nicht besser ist – sowie wie man einen Stamm-Lebenslauf pflegt und kürzere Versionen davon ableitet.",
      blocks: [
        {
          type: "p",
          text: "Die kurze Antwort: Ein akademischer Lebenslauf ist so lang, wie es Ihre Leistungen rechtfertigen, und er wächst im Laufe Ihrer Karriere. Anders als bei einem Résumé wird nicht erwartet, dass er auf ein oder zwei Seiten passt. Die Länge hängt jedoch von der Karrierestufe und dem Kontext ab, und es gibt wichtige Ausnahmen.",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "Faustregeln nach Karrierestufe",
        },
        {
          type: "ul",
          items: [
            "Master- / Doktorand – etwa 2–4 Seiten.",
            "Promovierender / Postdoktorand – etwa 3–6 Seiten.",
            "Mittlere Karrierestufe – oft 6–10+ Seiten.",
            "Erfahrene Professorinnen und Professoren – weit über zehn Seiten; der Publikations- und Fördermittelverlauf bestimmt die Länge.",
          ],
        },
        {
          type: "p",
          text: "Dies sind Orientierungswerte, keine Regeln. Ein starker, gut gegliederter vierseitiger Lebenslauf übertrifft einen aufgeblähten achtseitigen.",
        },
        {
          type: "h2",
          id: "capped",
          text: "Wenn die Länge begrenzt ist",
        },
        {
          type: "p",
          text: "Viele Fördergeber und Arbeitgeber verlangen einen „Kurz-Lebenslauf“ mit einer strengen Seitenbegrenzung (oft zwei Seiten) oder ein strukturiertes narratives Format wie den NIH Biosketch, das UKRI Résumé for Research and Innovation (R4RI), einen ERC-Lebenslauf oder das Schweizer SNSF-Format. Wenn eine Ausschreibung eine Länge oder ein Format vorschreibt, halten Sie es genau ein – das Überschreiten des Limits kann dazu führen, dass ein Antrag ungelesen abgelehnt wird.",
        },
        {
          type: "h2",
          id: "quality",
          text: "Länger ist nicht besser",
        },
        {
          type: "p",
          text: "Vollständigkeit wird erwartet, Aufblähen jedoch nicht. Nehmen Sie auf, was relevant ist, ordnen Sie es so, dass Ihr stärkstes Material leicht zu finden ist, und streichen Sie Füllmaterial. Gutachterinnen und Gutachter honorieren Klarheit und Relevanz, nicht Seitenanzahl.",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "Einen Stamm-Lebenslauf pflegen, kürzere Versionen ableiten",
        },
        {
          type: "p",
          text: "Der praktische Ansatz besteht darin, einen vollständigen „Stamm-Lebenslauf“ zu pflegen und kürzere oder fördergeber-spezifische Versionen davon abzuleiten. SigmaCV macht dies aus einem einzigen kanonischen Profil heraus: Bewahren Sie alles an einem Ort, wenden Sie dann ein Ein-Klick-Layout an (NIH, NSF, ERC, UKRI R4RI und mehr) oder kürzen Sie Abschnitte für eine bestimmte Ausschreibung – reversibel und mit Exportfunktion.",
        },
        {
          type: "cta",
          label: "Akademischen Lebenslauf kostenlos erstellen",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Gibt es eine Seitenbegrenzung für einen akademischen Lebenslauf?",
          a: "Im Allgemeinen nicht – ein vollständiger akademischer Lebenslauf ist so lang, wie es Ihre Leistungen rechtfertigen. Die Ausnahme sind „Kurz-Lebensläufe“ für Fördergeber und Stellen, die oft eine Längenbegrenzung vorgeben oder ein narratives Format erfordern; befolgen Sie stets die Anweisungen der Ausschreibung.",
        },
        {
          q: "Wie lang sollte ein Lebenslauf für eine Promotionsbewerbung sein?",
          a: "In der Regel etwa 2–4 Seiten. In diesem Stadium sind klare Forschungserfahrung und einige repräsentative Leistungen wichtiger als die Länge.",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "Akademischer Lebenslauf für Bewerbungen ans Graduierteninstitut",
      description:
        "Was in einen akademischen Lebenslauf für Master-, Promotions- oder Graduiertenstudiumsbewerbungen gehört, wenn man noch nicht viele Publikationen hat – und wie man einen Zulassungsausschuss überzeugend beeindruckt.",
      blocks: [
        {
          type: "p",
          text: "Wenn Sie sich für ein Master- oder Promotionsprogramm bewerben und Sorgen haben, dass Ihr Lebenslauf dünn wirkt, ist das völlig normal – Zulassungsausschüsse erwarten in diesem Stadium keine lange Publikationsliste. Sie suchen nach Belegen für Potenzial: Forschungserfahrung, relevante Kompetenzen und eine klare Entwicklungsperspektive. Hier erfahren Sie, was Sie aufnehmen und wie Sie es präsentieren sollten.",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "Was aufgenommen werden sollte",
        },
        {
          type: "ul",
          items: [
            "Ausbildung – Abschlüsse, Institutionen, Daten und Ihre Note, wenn sie gut ist; fügen Sie Ihren Abschlussarbeits- oder Abschlussprojekttitel hinzu.",
            "Forschungserfahrung – Labors, Projekte und Abschlussarbeiten mit Ihrer Rolle, Methoden und Ergebnissen.",
            "Publikationen & Vorträge – etwaige Artikel, Preprints, Poster oder Konferenzvorträge, auch in frühem Stadium.",
            "Kompetenzen – Labor-, technische, statistische, Programmier- und Sprachkompetenzen, die für das Fachgebiet relevant sind.",
            "Auszeichnungen & Stipendien – akademische Auszeichnungen und Fördermittel.",
            "Relevante Erfahrungen – Lehrtätigkeit, Nachhilfe, relevante Berufserfahrung oder ehrenamtliche Tätigkeit.",
            "Referenzen – oder ein Hinweis, dass sie auf Anfrage erhältlich sind.",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "Mit Forschungserfahrung beginnen",
        },
        {
          type: "p",
          text: "Auch ohne Publikationen ist Forschungserfahrung Ihre stärkste Karte. Beschreiben Sie für jedes Projekt die Fragestellung, was Sie getan haben (Methoden, Analysen, Ihre konkrete Rolle) und was daraus wurde. Konkrete Beiträge lesen sich weit überzeugender als eine Liste von Kursbezeichnungen.",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "Länge und Format",
        },
        {
          type: "p",
          text: "Ein Lebenslauf für eine Graduiertenstudiumsbewerbung hat in der Regel 2–4 Seiten. Achten Sie auf ein sauberes und einheitliches Format, verwenden Sie klare Abschnittsüberschriften und passen Sie die Schwerpunkte an das Programm an, für das Sie sich bewerben. Kurz darf er gerne sein – füllen Sie nicht auf.",
        },
        {
          type: "h2",
          id: "build",
          text: "Aus Ihrem Profil erstellen",
        },
        {
          type: "p",
          text: "SigmaCV stellt aus Ihrem ORCID-Profil und offenen Daten einen sauberen akademischen Lebenslauf zusammen – so werden selbst Ihre ersten Publikationen, Preprints und Poster korrekt und einheitlich formatiert, und Sie können alles per DOI ergänzen. Es ist kostenlos und quelloffen.",
        },
        {
          type: "cta",
          label: "Graduiertenstudium-Lebenslauf kostenlos erstellen",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Brauche ich Publikationen für einen Lebenslauf für ein Graduiertenstudium?",
          a: "Nein. Im Bewerbungsstadium sind Forschungserfahrung, relevante Kompetenzen und eine klare Entwicklungsperspektive wichtiger als eine Publikationsliste. Nehmen Sie vorhandene Preprints oder Poster auf, ihr Fehlen ist jedoch zu erwarten.",
        },
        {
          q: "Wie lang sollte ein Lebenslauf für eine Graduiertenstudiumsbewerbung sein?",
          a: "In der Regel 2–4 Seiten. Halten Sie ihn fokussiert: klare Forschungserfahrung und einige repräsentative Leistungen überzeugen mehr als Aufblähen.",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title:
        "Metriken verantwortungsvoll im akademischen Lebenslauf einsetzen (DORA & Leiden Manifesto)",
      description:
        "Wie man Forschungsmetriken im Lebenslauf verantwortungsvoll darstellt: warum der Journal Impact Factor und der h-Index irreführen, was feldnormierte Indikatoren hinzufügen und was DORA und das Leiden Manifesto empfehlen.",
      blocks: [
        {
          type: "p",
          text: "Metriken sind im Lebenslauf eine verlockende Abkürzung, können aber leicht missbraucht werden – und Kommissionen erwarten zunehmend, dass Forschende sie verantwortungsvoll einsetzen. Dieser Leitfaden erklärt, welche Metriken irreführen, welche vertretbarer sind und was die wichtigsten Rahmenwerke für verantwortungsvolle Forschungsbewertung empfehlen.",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "Warum der Journal Impact Factor das falsche Instrument ist",
        },
        {
          type: "p",
          text: "Der Journal Impact Factor (JIF) misst die durchschnittlichen Zitierungen einer Zeitschrift, nicht die Qualität oder Wirkung Ihres einzelnen Artikels. Zitierungsverteilungen sind stark linksschieft, sodass ein einzelnes Papier in einer Zeitschrift mit hohem JIF einem Leser kaum etwas über diesen Artikel aussagt. DORA – die San Francisco Declaration on Research Assessment – rät ausdrücklich davon ab, den JIF zur Bewertung einzelner Forschungsleistungen oder Forschender zu verwenden.",
        },
        {
          type: "h2",
          id: "h-index",
          text: "Der h-Index und reine Zählwerte haben Grenzen",
        },
        {
          type: "p",
          text: "Der h-Index und rohe Zitierungszahlen hängen stark vom Fachgebiet und der Karrieredauer ab, sodass sie über Disziplinen hinweg nicht vergleichbar sind und frühe Karrierestufen benachteiligen. Sie können auch aufgebläht sein. Wenn Sie sie angeben, geben Sie Kontext; stellen Sie sie nie als alleiniges Maß für Forschungsqualität dar.",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "Feldnormierte Indikatoren bevorzugen",
        },
        {
          type: "p",
          text: "Feldnormierte Indikatoren – wie der Field-Weighted Citation Impact (FWCI) oder der NIH iCite Relative Citation Ratio (RCR) – berücksichtigen Unterschiede in den Zitierungsraten zwischen Fachgebieten und im Zeitverlauf und sind daher vergleichbarer als rohe Zählwerte. Sie sind immer noch unvollkommen und sollten im Kontext gelesen werden, nie als einziges Signal.",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "Was DORA und das Leiden Manifesto empfehlen",
        },
        {
          type: "ul",
          items: [
            "DORA – verwenden Sie keine zeitschriftenbasierten Metriken (wie den JIF) zur Bewertung einzelner Beiträge; beurteilen Sie Forschung nach ihren eigenen Verdiensten.",
            "Das Leiden Manifesto – verwenden Sie quantitative Indikatoren zur Unterstützung, nicht als Ersatz für das Urteil von Fachleuten; berücksichtigen Sie Fachgebietsunterschiede; halten Sie Daten und Methoden transparent; und vermeiden Sie falsch verstandene Präzision.",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "Praktische Hinweise für Ihren Lebenslauf",
        },
        {
          type: "ul",
          items: [
            "Stellen Sie die Arbeit selbst in den Vordergrund – was Sie getan haben und warum es wichtig ist – nicht Zahlen.",
            "Wenn Sie Metriken angeben, bevorzugen Sie feldnormierte Indikatoren und geben Sie Kontext (Fachgebiet, Zeitfenster, Perzentile).",
            "Erwägen Sie eine kurze narrative Beschreibung Ihrer wichtigsten Beiträge anstelle von oder ergänzend zu Zahlen.",
            "Zitieren Sie niemals den Journal Impact Factor der Zeitschriften, in denen Ihre Artikel erschienen sind.",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Verantwortungsvolle Metriken als Standard",
        },
        {
          type: "p",
          text: "SigmaCV wurde auf dieser Grundlage entwickelt: Metriken sind standardmäßig deaktiviert und opt-in, bevorzugt werden feldnormierte Indikatoren gegenüber rohen Zählwerten, und ein Journal Impact Factor wird nie angezeigt – im Einklang mit DORA. Sie behalten die volle Kontrolle darüber, ob überhaupt eine Metrik in Ihrem Lebenslauf erscheint.",
        },
        {
          type: "cta",
          label: "DORA-konformen Lebenslauf kostenlos erstellen",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Sollte ich meinen h-Index in meinen Lebenslauf aufnehmen?",
          a: "Das ist optional und fachgebietsabhängig. Wenn Sie ihn angeben, geben Sie Kontext und ergänzen Sie ihn durch feldnormierte Indikatoren, anstatt ihn allein darzustellen; viele Kommissionen raten von einer übermäßigen Abhängigkeit davon ab.",
        },
        {
          q: "Ist es in Ordnung, Journal Impact Factors in einem Lebenslauf aufzulisten?",
          a: "Das ist nicht empfehlenswert. DORA rät ausdrücklich davon ab, den Journal Impact Factor zur Bewertung einzelner Forschungsleistungen zu verwenden, weil er die Zeitschrift misst, nicht Ihren Artikel.",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "Akademischer Lebenslauf: Formate nach Land",
      description:
        "Wie akademische Lebenslauf-Konventionen je nach Land variieren – die Unterscheidung CV/Résumé, Fotos und persönliche Angaben, Länge, Europass und narrative Förderformate – und wie Sie Ihren Lebenslauf anpassen.",
      blocks: [
        {
          type: "p",
          text: "Es gibt keinen einzigen globalen Standard für einen akademischen Lebenslauf. Die Konventionen unterscheiden sich je nach Land und Institution – wie das Dokument überhaupt heißt, ob es ein Foto enthält, wie lang es ist und welches strukturierte Format ein Fördergeber erwartet. Dieser Leitfaden behandelt die wichtigsten Unterschiede und wie Sie Ihren Lebenslauf an das Bewerbungsland anpassen.",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "Die Unterscheidung CV / Résumé variiert",
        },
        {
          type: "p",
          text: "In den USA und Kanada ist ein akademischer „CV“ das lange, vollständige wissenschaftliche Dokument, während ein „Résumé“ die kurze, ein- bis zweiseitige Version für die Industrie ist. Im Vereinigten Königreich und in weiten Teilen Europas kann „CV“ beides bedeuten, und die akademische Version wird einfach aus dem Kontext erschlossen. Passen Sie den Begriff und die Länge an das vom Land und der Stelle erwartete Maß an.",
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "Fotos und persönliche Angaben",
        },
        {
          type: "p",
          text: "Dies ist der größte länderübergreifende Unterschied. In Teilen Kontinentaleuropas, Asiens und Lateinamerikas kann von einem Lebenslauf erwartet werden, dass er ein Foto, Geburtsdatum oder Staatsangehörigkeit enthält. In den USA und im Vereinigten Königreich werden diese bewusst weggelassen, um Vorurteile zu reduzieren, und ihre Aufnahme kann sich nachteilig auswirken. Im Zweifel folgen Sie den Normen des Ziellandes – und fügen Sie niemals persönliche Angaben ein, die ein bestimmter Arbeitgeber ausdrücklich ausgeschlossen hat.",
        },
        {
          type: "h2",
          id: "length",
          text: "Längenerwartungen",
        },
        {
          type: "p",
          text: "Ein vollständiger akademischer Lebenslauf hat keine feste Seitenbegrenzung und wächst mit Ihrem Profil, aber die Erwartungen variieren: Einige europäische Bewerbungen bevorzugen einen knapperen Lebenslauf, während US-amerikanische akademische Lebensläufe oft erschöpfend sind. Halten Sie stets eine ausdrückliche Seitenbegrenzung ein, wenn eine Ausschreibung oder ein Arbeitgeber eine vorgibt.",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass und strukturierte Formate",
        },
        {
          type: "p",
          text: "In der Europäischen Union ist das Europass-Lebenslaufformat eine verbreitete strukturierte Vorlage, und einige Institutionen verlangen es. Mehrere Länder und Systeme haben ihre eigenen erwarteten Layouts. Wo ein strukturiertes Format erforderlich ist, folgen Sie ihm genau, anstatt einen unstrukturierten Lebenslauf einzureichen.",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "Narrative Lebensläufe für Fördergeber nach Region",
        },
        {
          type: "p",
          text: "Große Fördergeber verlangen zunehmend ihre eigenen Formate: das UKRI Résumé for Research and Innovation (R4RI) im Vereinigten Königreich, den ERC-Lebenslauf in der EU, das SNSF-Format in der Schweiz sowie den NIH Biosketch oder das NSF-Format in den USA. Diese sind narrativ oder eng strukturiert und unterscheiden sich von einem Standard-Lebenslauf – bereiten Sie sie für jede Bewerbung aus Ihrem vollständigen Profil vor.",
        },
        {
          type: "h2",
          id: "adapt",
          text: "Wie Sie Ihren Lebenslauf anpassen",
        },
        {
          type: "p",
          text: "Pflegen Sie einen vollständigen, kanonischen Lebenslauf und leiten Sie länder- oder fördergeber-spezifische Versionen davon ab, anstatt mehrere von Grund auf zu pflegen. SigmaCV erstellt diesen kanonischen Lebenslauf aus Ihrem offenen Forschungsprofil und wendet Ein-Klick-Fördergeberlayouts (UKRI R4RI, ERC, SNSF, NIH, NSF und mehr) reversibel an – die Anpassung an die Erwartungen eines Landes ist eine schnelle Änderung, kein Neuschreiben.",
        },
        {
          type: "cta",
          label: "Akademischen Lebenslauf kostenlos erstellen",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Sollte ich ein Foto in meinen akademischen Lebenslauf einfügen?",
          a: "Das hängt vom Land ab. Einige Länder erwarten ein Foto und persönliche Angaben; der akademische Standard in den USA und im Vereinigten Königreich ist, diese wegzulassen, um Vorurteile zu reduzieren. Folgen Sie der Konvention des Bewerbungslandes.",
        },
        {
          q: "Ist ein akademischer Lebenslauf überall gleich?",
          a: "Nein. Begriff, erwartete Länge, Einbeziehung persönlicher Angaben und erforderliche Fördergeberformate variieren je nach Land. Passen Sie Ihren Lebenslauf an das Zielland und die Zielinstitution an.",
        },
      ],
    },
  },
  "ja-JP": {
    "how-to-write-an-academic-cv": {
      title: "アカデミックCVの書き方",
      description:
        "アカデミックCVの実践的なガイド：記載すべき内容、各セクションの順序とフォーマット、適切な長さ、文献リストの書き方、キャリア段階や国による慣行の違いについて解説します。",
      blocks: [
        {
          type: "p",
          text: "アカデミックCV（curriculum vitae）は、研究・教育職、大学院プログラム、フェローシップ、グラントへの応募に使用する標準的な書類です。1〜2ページのレジュメとは異なり、学術的な経歴の完全で更新し続ける記録——学歴、業績、資金獲得、教育活動、社会貢献——であり、キャリアを通じて拡充されていきます。",
        },
        {
          type: "p",
          text: "このガイドでは、記載すべき内容、各セクションの順序とフォーマット、アカデミックCVの適切な長さ、文献リストの書き方、キャリア段階や国による慣行の違いを説明します。手作業での作成を避けたい場合は、ORCID記録から自動生成することもできます——最後のセクションをご参照ください。",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "アカデミックCVとは何か",
        },
        {
          type: "p",
          text: "CVは包括的な学術的経歴書です。採用委員会、資金提供機関、入学審査委員会があなたの実績を評価できるよう、学術的貢献の全体像を文書化する役割を担います。レジュメが特定のポストに向けて取捨選択されるのに対し、アカデミックCVは網羅的かつ累積的なものです。時間とともに追記し、削除することはほとんどありません。",
        },
        {
          type: "p",
          text: "専門家に読まれるものであるため、アカデミックCVは簡潔さより完全性と正確性を重視します。視覚的な装飾よりも、明確な構成、一貫したフォーマット、正確に記述された引用が重要です。",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "記載すべき内容：主要セクション",
        },
        {
          type: "p",
          text: "ほとんどのアカデミックCVは共通の構成要素から成り立っています。自分の分野やキャリア段階に関係するセクションを含め、まだ記載内容がないセクションは省略してください。",
        },
        {
          type: "ul",
          items: [
            "ヘッダー——氏名、現在の職位、業務用連絡先（およびORCID iD）。",
            "研究関心・概要——自分の研究を説明する数行（任意、キャリア初期に多く使われる）。",
            "学歴——逆時系列順の学位（機関名、在籍期間、論文タイトルを含む）。",
            "職歴・役職——学術職および関連する専門職。",
            "業績リスト——ほとんどの研究職において中心的なセクション（後述）。",
            "グラント・資金調達——採択された資金（資金提供機関、課題名、金額、期間を含む）。",
            "受賞・栄誉——フェローシップ、賞、顕彰。",
            "教育活動——担当科目、招待講義、教育関連の役割。",
            "指導・メンタリング——指導した学生・研修生。",
            "発表——招待講演、学会発表、ポスター発表。",
            "社会貢献——査読、編集委員、各種委員会、アウトリーチ活動。",
            "所属学会、スキル、参照人——分野に応じて適宜記載。",
          ],
        },
        {
          type: "h3",
          text: "セクションの順序",
        },
        {
          type: "p",
          text: "ヘッダー、学歴、職歴の後は、応募するポストに対して最も強みとなる内容を前に置いてください。研究重視のポストやグラントには業績リストと資金獲得を上位に、教育重視のポストには教育活動と指導を上位に配置します。内容を作り上げたり水増ししたりせず、読み手に合わせて順序を調整してください。",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "文献リストの書き方",
        },
        {
          type: "p",
          text: "業績リストは委員会が最も時間をかけて読む部分です。一覧しやすく、誤読の余地のない形式にしてください。",
        },
        {
          type: "ul",
          items: [
            "逆時系列順に記載し、必要に応じて種類別（学術論文、プレプリント、書籍章、学会論文、データセット、ソフトウェア）にグループ化する。",
            "一貫した引用スタイルを全体に使用し、CVのあらゆるバージョンで同一に保つ。",
            "各著者リストで自分の名前を強調表示し、貢献が一目で分かるようにする。",
            "DOI（およびリンク）を記載し、読者が文献を見つけられるようにする。",
            "審査中、印刷中、またはプレプリントの文献は明確かつ正直に明示する。",
            "リストを水増ししない——質と関連性は量より重要。",
          ],
        },
        {
          type: "p",
          text: "一貫性の欠如は最も多く見られる失敗です。Citation Style Language（CSL）——Zoteroなどのツールのベースとなっているオープンスタンダード——を通じてすべての参考文献をフォーマットすることで、Word、PDF、LaTeX版のCVが同一の見た目になります。",
        },
        {
          type: "h2",
          id: "how-long",
          text: "アカデミックCVはどのくらいの長さが適切か",
        },
        {
          type: "p",
          text: "固定されたページ制限はありません——アカデミックCVは実績に見合う長さであり、時間とともに増えていきます。目安として、修士・博士課程の申請者は2〜4ページ、ポスドクは3〜6ページ、シニアプロフェッサーはそれを大幅に超えることもあります。例外は、資金提供機関や求人の「ショートCV」で、多くは長さが制限されています（例：2ページ）。あるいはNIH biosketch、UKRI R4RI（Résumé for Research and Innovation）、ERC CVのようなナラティブ形式を使用します。公募が形式やページ数を指定している場合は、それに厳密に従ってください。",
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "キャリア段階別の調整",
        },
        {
          type: "ul",
          items: [
            "学生・大学院申請者——学歴、論文や研究プロジェクト、発表・業績（あれば）、関連スキル、参照人を強調する。短くても問題ありません。",
            "博士課程学生・ポスドク——業績リスト、学会活動、資金獲得・フェローシップ、教育活動を前に出す。求人やグラントの締め切りに備えて常に最新の状態に保つ。",
            "教員・研究室主宰者（PI）——グラント、業績、指導実績、社会貢献・リーダーシップを前面に出す。長い区分されたCVと、資金提供機関向けの別途ショートCVを用意する。",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "フォーマットと国による違い",
        },
        {
          type: "p",
          text: "慣行は国によって異なります。米国とカナダでは、アカデミックの「CV」は長い学術的文書を指し（「レジュメ」は短い業界向け版）、ヨーロッパの多くの国では「CV」はいずれをも指すことがあります。写真、生年月日、国籍を求める国もありますが、多くの国——特に米国・英国の学術的な文脈——では、バイアスを減らすために個人情報を意図的に省略します。欧州の応募者はEuropass形式を使うことがあり、主要な資金提供機関はそれぞれ独自のナラティブCVを求めることが増えています。迷った場合は、応募先の国・機関の慣行に合わせてください。",
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "よくある失敗",
        },
        {
          type: "ul",
          items: [
            "フォーマットの一貫性がない、または複数の引用スタイルが混在している。",
            "業績リストを水増しする、または最も重要な仕事を埋もれさせる。",
            "応募の間にCVを更新しないでいる。",
            "公募で指定された形式やページ制限を無視する。",
            "名前一致に頼って文献を確認する——よくある名前やラテン文字以外の名前は他者の業績と混同されやすい。",
            "誤字脱字やリンク切れ——校正し、全DOIが解決することを確認する。",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "アカデミックCVを自動生成する",
        },
        {
          type: "p",
          text: "アカデミックCVを最新の状態に保つことは反復的で手間のかかる作業です。SigmaCV（無料・オープンソース）は、ORCIDとOpenAlexの記録から——名前でなく識別子でマッチングしながら——CVを自動生成し、すべての引用を一貫してフォーマットし、PDF、Word、LaTeX、Markdown、BibTeX、または自動再同期する公開ページにエクスポートします。指標はデフォルトでオフかつ分野規準化されており、DORAに準拠し、データはあなた自身のものです（フィールドごとの同意、エクスポート、削除）。",
        },
        {
          type: "cta",
          label: "アカデミックCVを無料で作成",
          href: "/",
        },
      ],
      faq: [
        {
          q: "アカデミックCVはどのくらいの長さが適切ですか？",
          a: "固定された制限はありません。実績とともに長くなっていきます。博士課程申請者であれば通常2〜4ページ、ポスドクは3〜6ページ、シニア研究者はさらに長くなります。資金提供機関・求人の「ショートCV」は長さが制限されているか、ナラティブ形式（NIH biosketch、UKRI R4RI、ERCなど）が求められる場合があります。公募の規則に必ず従ってください。",
        },
        {
          q: "アカデミックCVとレジュメの違いは何ですか？",
          a: "アカデミックCVは学術的な経歴の完全で累積的な記録（学歴、業績、資金獲得、教育活動、社会貢献）であり、多ページに及ぶこともあります。レジュメは非学術的な職に向けた、短く対象を絞った1〜2ページの文書です。",
        },
        {
          q: "アカデミックCVの業績リストはどのように書くべきですか？",
          a: "逆時系列順に記載し、必要に応じて種類別にグループ化し、一貫した引用スタイルを使用し、自分の名前を強調してDOIを記載してください。プレプリントや審査中の文献は明確に明示し、リストを水増ししないでください。",
        },
        {
          q: "アカデミックCVを自動生成できますか？",
          a: "はい。SigmaCV はORCIDとOpenAlexの記録（名前でなく識別子でマッチング）からアカデミックCVを作成し、引用をフォーマットし、PDF、DOCX、LaTeX、Markdown、BibTeXにエクスポートします——無料・オープンソースです。",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "アカデミックCVとレジュメの違い",
      description:
        "アカデミックCVとレジュメの長さ、範囲、目的の違い、そして学術職の応募、大学院出願、グラント申請、業界職のいずれにどちらを使うべきかを解説します。",
      blocks: [
        {
          type: "p",
          text: "「CV」と「レジュメ」は互換可能な言葉として使われることがありますが、学術の世界では異なる役割を持つ別々の文書です。どちらを選び、どのようにフォーマットするかは、学術職・フェローシップ・グラントの応募において重要です。",
        },
        {
          type: "p",
          text: "アカデミックCV（curriculum vitae）は、学術的な経歴の完全で累積的な記録です——学歴、業績、資金獲得、教育活動、学会発表、社会貢献が含まれます。レジュメは短く、高度に絞り込まれたまとめであり——通常1〜2ページ——特定の非学術的なポストを対象としています。",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "主な違い",
        },
        {
          type: "ul",
          items: [
            "長さ——CVは固定の制限なく長くなる（多くの場合数ページ）。レジュメは1〜2ページに収める。",
            "範囲——CVは学術的な活動のすべてを文書化する。レジュメは対象のポストに関連するものだけを含む。",
            "読み手——CVは学術的な同僚や委員会に読まれる。レジュメはリクルーターや採用担当者に読まれる。",
            "安定性——CVには時間とともに追記し、削除することはほとんどない。レジュメは各応募ごとに書き直す。",
            "業績・資金——CVの中心的な内容。レジュメでは省略されるか、簡略化されることが多い。",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "どちらを使うべきか",
        },
        {
          type: "ul",
          items: [
            "学術職、ポスドク、博士・大学院課程の出願、フェローシップ、グラント→アカデミックCV。",
            "業界職および大半の非学術的なポスト→対象の求人に合わせたレジュメ。",
            "「オルタナティブ・アカデミック（alt-ac）」および研究に隣接した業界職→レジュメ程度の長さながら、関連する研究成果を前面に出したハイブリッド形式が多い。",
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "CVをレジュメに変換する",
        },
        {
          type: "p",
          text: "アカデミックCVをレジュメに変換するには、短いサマリーを冒頭に置き、最も関連性の高い経験と代表的な成果物に絞り、学術的な成果をインパクトと汎用スキルに翻訳し、1〜2ページに収めます。完全なCVをマスター記録として保持し、そこから短いバージョンを派生させてください。",
        },
        {
          type: "h2",
          id: "build-either",
          text: "研究記録からどちらも作成する",
        },
        {
          type: "p",
          text: "SigmaCV は、ORCIDとOpenAlexの記録からアカデミックCVを作成し、さまざまな形式とワンクリックのレイアウトでエクスポートします——一つの統一された記録を維持しながら、各応募に必要なバージョンを用意できます。無料・オープンソース・プライバシー優先です。",
        },
        {
          type: "cta",
          label: "アカデミックCVを無料で作成",
          href: "/",
        },
      ],
      faq: [
        {
          q: "CVとレジュメは同じものですか？",
          a: "学術の世界では異なります。アカデミックCVは学術的な経歴の長く完全な記録であり、レジュメは非学術的な職向けの短く絞り込まれた1〜2ページの文書です。学術の外では、また国によっては、この2つの言葉がより曖昧に使われることがあります。",
        },
        {
          q: "アカデミックCVに写真は必要ですか？",
          a: "国によって異なります。写真や個人情報が期待される国もあれば、多くの学術的な文脈（特に米国・英国）ではバイアスを減らすために意図的に省略します。応募先の慣行に合わせてください。",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "アカデミックCVでの文献リストの書き方",
      description:
        "アカデミックCVの業績セクションのフォーマットと順序：引用スタイル、種類別のグループ化、著者順序、自分の名前の強調、プレプリントと審査中の文献の扱い、そして避けるべきことについて解説します。",
      blocks: [
        {
          type: "p",
          text: "ほとんどの学術職において、業績セクションは委員会が最も注意深く読む部分です。そのため、その見せ方は内容そのものとほぼ同じくらい重要です。このガイドでは、引用スタイル、順序とグループ化、自分の貢献を明確にする方法、プレプリントや審査中の文献の扱い、そして優れたリストを損なう失敗について解説します。",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "一つの引用スタイルを選び、それを守る",
        },
        {
          type: "p",
          text: "自分の分野に適した引用スタイル（例：APA、Vancouver、Chicago、IEEE）を選び、すべてのエントリに適用してください。最もよく見られる失敗は、スタイルを混在させるか、参考文献を手作業でフォーマットすることで、どの二つも同じ見た目にならないことです。Citation Style Language（CSL）——Zoteroなどのリファレンスマネージャーのベースとなっている標準——でリスト全体をフォーマットすることで、PDF、Word、LaTeX版のCV全体で一貫性が保たれます。",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "文献の順序とグループ化",
        },
        {
          type: "ul",
          items: [
            "逆時系列順（新しいものから）に記載する。",
            "リストが長い場合は種類別にグループ化する：査読付き学術論文、プレプリント、書籍章、学会論文、データセット・ソフトウェア。",
            "グループには明確なラベルと区切りを付け、読者が査読済み論文を即座に見つけられるようにする。",
            "番号付けは一貫して——すべてのエントリに番号を付けるか、まったく付けないかのどちらかにする。",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "自分の貢献を明確にする",
        },
        {
          type: "ul",
          items: [
            "すべての著者リストで自分の名前を（例：太字で）強調する。",
            "第一著者、責任著者、同等貢献の役割を明確で説明付きの表記で示す。",
            "著者順の慣行は分野によって異なることを念頭に置き、自分の分野の慣行が自明でない場合は一行の注釈を加える。",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "プレプリント、審査中、印刷中の文献",
        },
        {
          type: "p",
          text: "文献はそのステータスを正直に記載してください。プレプリントはCVでの掲載が増えていますが、プレプリントとして明記し、「審査中」または「印刷中」の文献にはその旨を記載してください。査読未済の文献を査読済みとして提示しないでください。また、関係性を明確にせずに同じ論文を重複して掲載しないでください（例：プレプリントと出版版の両方を載せる場合）。",
        },
        {
          type: "h2",
          id: "identifiers",
          text: "識別子とリンクを含める",
        },
        {
          type: "p",
          text: "読者が文献を見つけられるよう、各文献にDOI（およびリンク）を追加し、ヘッダーにORCID iDを記載してください。識別子は、ツールが著者性を名前ではなく識別子によって確実に確認できるようにもします——これはよくある名前やラテン文字以外の名前を持つ研究者にとって特に重要です。",
        },
        {
          type: "h2",
          id: "avoid",
          text: "避けるべきこと",
        },
        {
          type: "ul",
          items: [
            "一つの文書内で引用スタイルを混在させる。",
            "重要度の低いまたは関連性のない項目でリストを水増しする。",
            "エントリ全体で自分の名前の表記が一致しない。",
            "DOIが壊れているまたは欠如している——すべてのリンクが機能することを確認する。",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "フォーマット済み業績リストを自動生成する",
        },
        {
          type: "p",
          text: "SigmaCV は、ORCIDとOpenAlexから（名前でなく識別子でマッチングして）文献を取得し、自分の名前を強調した任意のCSLスタイルでフォーマットし、PDF、Word、LaTeX、Markdown、BibTeXにリストをエクスポートします——CVのあらゆるバージョンが一貫して正確に保たれます。",
        },
        {
          type: "cta",
          label: "業績リストを無料で生成",
          href: "/",
        },
      ],
      faq: [
        {
          q: "CVの業績リストにはどの引用スタイルを使うべきですか？",
          a: "自分の分野で標準的なスタイル（例：APA、Vancouver、Chicago、IEEE）を使用してください。最も重要なことは、リスト全体とCVのあらゆる形式に一貫して一つのスタイルを適用することです。",
        },
        {
          q: "CVにプレプリントを含めるべきですか？",
          a: "はい——プレプリントは成果として広く認められるようになっています——ただし、プレプリントとして明確にラベルを付け、査読済み論文とは別に記載してください。",
        },
        {
          q: "共同第一著者または同等貢献はどのように示しますか？",
          a: "該当する著者に記号を付け、短い凡例で説明してください（例：「＊同等貢献」）。リスト全体で一貫して適用してください。",
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "アカデミックCVはどのくらいの長さが適切か",
      description:
        "キャリア段階別のアカデミックCVの適切な長さ、長さが制限される場合（資金提供機関・求人のショートCV）、長ければよいわけではない理由——さらに一つのマスターCVを維持しながら短いバージョンをエクスポートする方法について解説します。",
      blocks: [
        {
          type: "p",
          text: "端的に言えば、アカデミックCVは実績に見合う長さであり、キャリアを通じて長くなっていきます。レジュメとは異なり、1〜2ページに収める必要はありません。ただし、長さはキャリア段階や状況によって異なり、重要な例外もあります。",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "キャリア段階別の目安",
        },
        {
          type: "ul",
          items: [
            "修士・博士課程申請者——おおよそ2〜4ページ。",
            "博士課程学生・ポスドク——おおよそ3〜6ページ。",
            "中堅研究者——多くの場合6〜10ページ以上。",
            "シニア教員——10ページを大幅に超えることも。業績・資金獲得記録が長さを左右する。",
          ],
        },
        {
          type: "p",
          text: "これらはガイドラインであり、ルールではありません。構成のしっかりした4ページのCVは、水増しされた8ページのCVより優れています。",
        },
        {
          type: "h2",
          id: "capped",
          text: "長さが制限される場合",
        },
        {
          type: "p",
          text: "多くの資金提供機関や雇用主は、厳格なページ制限（多くの場合2ページ）の「ショートCV」、またはNIH biosketch、UKRI R4RI（Résumé for Research and Innovation）、ERC CV、スイスSNSF形式のような構造化されたナラティブ形式を求めます。公募が長さや形式を指定している場合は厳密に従ってください——制限を超えると申請書が未読で却下されることもあります。",
        },
        {
          type: "h2",
          id: "quality",
          text: "長ければよいわけではない",
        },
        {
          type: "p",
          text: "完全性は期待されますが、水増しは求められません。関連する内容を含め、最も強いものが見つけやすい順序にし、不要な内容を削除してください。審査員が評価するのはページ数ではなく、明確さと関連性です。",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "マスターCVを維持し、短いバージョンをエクスポートする",
        },
        {
          type: "p",
          text: "実践的なアプローチは、一つの完全な「マスター」CVを維持し、そこから短いバージョンや資金提供機関向けのバージョンを派生させることです。SigmaCV は一つの統一された記録からこれを行います——すべてを一か所に保存し、ワンクリックのレイアウト（NIH、NSF、ERC、UKRI R4RI等）を適用するか、特定の公募向けにセクションをリバーシブルにトリミングしてエクスポートします。",
        },
        {
          type: "cta",
          label: "アカデミックCVを無料で作成",
          href: "/",
        },
      ],
      faq: [
        {
          q: "アカデミックCVにページ制限はありますか？",
          a: "一般的にはありません——完全なアカデミックCVは実績に見合う長さです。例外は、資金提供機関・求人の「ショートCV」で、長さが制限されるかナラティブ形式が求められる場合があります。公募の指示には必ず従ってください。",
        },
        {
          q: "博士課程出願用CVはどのくらいの長さが適切ですか？",
          a: "通常は2〜4ページ程度です。その段階では、明確な研究経験といくつかの代表的な成果が長さより重要です。",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "大学院出願用のアカデミックCV",
      description:
        "業績がまだ少ない修士・博士・大学院課程の出願時にアカデミックCVに何を記載するか——入学審査委員会に強い印象を与えるためのポイントを解説します。",
      blocks: [
        {
          type: "p",
          text: "修士・博士課程への出願を準備していてCVが薄く感じても、それはまったく普通のことです——入学審査委員会はこの段階で長い業績リストを期待していません。彼らが求めるのは可能性の証拠：研究経験、関連スキル、明確な方向性です。何を記載し、どのように提示するかを解説します。",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "記載すべき内容",
        },
        {
          type: "ul",
          items: [
            "学歴——学位、機関名、在籍期間、および成績が優秀であればGPAや成績。論文や卒業論文のタイトルを含める。",
            "研究経験——研究室、プロジェクト、論文。担当した役割、手法、成果を記載する。",
            "業績・発表——論文、プレプリント、ポスター、学会発表。どれほど初期段階でも含める。",
            "スキル——実験室、技術、統計、プログラミング、分野に関連する語学力。",
            "受賞・奨学金——学術的な顕彰と資金援助。",
            "関連経験——教育補助、チュータリング、関連する就労経験やボランティア活動。",
            "参照人——または要求があれば提供可能である旨を記載。",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "研究経験を前面に出す",
        },
        {
          type: "p",
          text: "業績がなくても、研究経験はあなたの最大の強みです。各プロジェクトについて、課題が何であったか、何をしたか（手法、分析、あなた固有の役割）、その成果を記載してください。具体的な貢献は、授業名の羅列よりはるかに説得力があります。",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "長さとフォーマット",
        },
        {
          type: "p",
          text: "大学院出願用CVは通常2〜4ページです。フォーマットを整然と一貫させ、明確なセクション見出しを使用し、応募するプログラムに合わせて強調点を調整してください。短くても問題ありません——水増ししないでください。",
        },
        {
          type: "h2",
          id: "build",
          text: "記録から作成する",
        },
        {
          type: "p",
          text: "SigmaCV は、ORCIDとオープンデータから整ったアカデミックCVをまとめます。最初の業績、プレプリント、ポスターでも正確かつ一貫してフォーマットされ、DOIで追加することもできます。無料・オープンソースです。",
        },
        {
          type: "cta",
          label: "大学院出願用CVを無料で作成",
          href: "/",
        },
      ],
      faq: [
        {
          q: "大学院出願のCVに業績は必要ですか？",
          a: "いいえ。出願段階では、研究経験、関連スキル、明確な方向性が業績リストより重要です。プレプリントやポスターがあれば記載してください。ない場合も想定範囲内です。",
        },
        {
          q: "大学院出願用CVはどのくらいの長さが適切ですか？",
          a: "通常2〜4ページです。焦点を絞ってください——明確な研究経験といくつかの代表的な項目が水増しより有効です。",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title: "アカデミックCVにおける指標の責任ある活用（DORAとLeiden Manifesto）",
      description:
        "CVで研究指標を責任を持って提示する方法：ジャーナル・インパクトファクターとh-indexが誤解を招く理由、分野規準化指標が加える意義、そしてDORAとLeiden Manifestoが推奨することについて解説します。",
      blocks: [
        {
          type: "p",
          text: "指標はCVにおける短縮表示として魅力的ですが、容易に誤用されます——そして委員会は研究者が指標を責任を持って活用することをますます期待しています。このガイドでは、どの指標が誤解を招くか、どれがより正当性があるか、主要な責任ある評価フレームワークが何を推奨しているかを説明します。",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "ジャーナル・インパクトファクターが誤ったツールである理由",
        },
        {
          type: "p",
          text: "ジャーナル・インパクトファクター（JIF）はジャーナルの平均被引用数を測定するものであり、個々の論文の質やインパクトを測るものではありません。引用の分布は大きく偏っているため、高JIFのジャーナルの一論文がその論文について何かを伝えることはほとんどありません。DORA——サンフランシスコ研究評価宣言——は、個々の研究や研究者の評価にJIFを使用しないよう明示的に勧告しています。",
        },
        {
          type: "h2",
          id: "h-index",
          text: "h-indexと単純計数の限界",
        },
        {
          type: "p",
          text: "h-indexと単純な被引用数は、分野とキャリアの長さに大きく依存するため、分野横断での比較が難しく、初期キャリア研究者に不利です。また、水増しされることもあります。記載する場合は文脈を与えてください。単独の価値の指標として提示しないでください。",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "分野規準化指標を優先する",
        },
        {
          type: "p",
          text: "分野規準化指標——Field-Weighted Citation Impact（FWCI）やNIH iCite Relative Citation Ratio（RCR）など——は、分野間・時期間の被引用率の違いを考慮するため、単純計数より比較可能性が高いです。それでも不完全であり、文脈とともに読む必要があります。単一のシグナルとして扱わないでください。",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "DORAとLeiden Manifestoが推奨すること",
        },
        {
          type: "ul",
          items: [
            "DORA——個々の貢献の評価にジャーナル基準の指標（JIFなど）を使用しないこと。研究はそれ自体の価値で評価すること。",
            "Leiden Manifesto——量的指標は専門的な判断を補完するものであり、代替するものではない。分野の違いを考慮すること。データと手法を透明に保つこと。また、数値の過信を避けること。",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "CVのための実践的なアドバイス",
        },
        {
          type: "ul",
          items: [
            "数値ではなく、何をしてなぜ重要かという研究そのものを前に出す。",
            "指標を記載する場合は、分野規準化指標を優先し、文脈（分野、時間帯、パーセンタイル）を与える。",
            "数値の代わりに、あるいは数値と並行して、主要な貢献の短いナラティブ説明を検討する。",
            "論文が掲載されたジャーナルのジャーナル・インパクトファクターを引用しないこと。",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "デフォルトでの責任ある指標",
        },
        {
          type: "p",
          text: "SigmaCV はこのスタンスを基に構築されています。指標はデフォルトでオフかつオプトイン、単純計数より分野規準化指標を優先し、ジャーナルのインパクトファクターは一切表示しません——DORAに準拠しています。CVに指標を表示するかどうかはあなた自身がコントロールします。",
        },
        {
          type: "cta",
          label: "DORAに準拠したCVを無料で作成",
          href: "/",
        },
      ],
      faq: [
        {
          q: "CVにh-indexを記載すべきですか？",
          a: "任意であり、分野によって異なります。記載する場合は文脈を与え、単独で提示せず分野規準化指標と組み合わせてください。多くの委員会は単一の数値への過度の依存を勧めていません。",
        },
        {
          q: "CVにジャーナルのインパクトファクターを記載してもよいですか？",
          a: "推奨されません。DORAは、ジャーナル・インパクトファクターを個々の研究の評価に使用しないよう明示的に勧告しています。JIFは論文ではなくジャーナルを測定するものだからです。",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "国別アカデミックCVのフォーマット",
      description:
        "CV／レジュメの区別、写真や個人情報、長さ、Europass、資金提供機関のナラティブ形式など、国によるアカデミックCVの慣行の違いと、応募先に合わせた調整方法を解説します。",
      blocks: [
        {
          type: "p",
          text: "アカデミックCVに世界共通の標準はありません。慣行は国や機関によって異なります——文書が何と呼ばれるか、写真を含めるか、どのくらいの長さか、資金提供機関が求める構造化フォーマットは何かなど。このガイドでは主な違いと、応募先に合わせてCVを調整する方法を説明します。",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "CV／レジュメの区別は国により異なる",
        },
        {
          type: "p",
          text: "米国・カナダでは、学術的な「CV」は長く完全な学術的文書を指し、「レジュメ」は業界向けの短い1〜2ページ版です。英国および欧州の多くの国では「CV」はいずれをも意味することがあり、学術版は文脈から理解されます。応募する国とポストに期待される用語と長さに合わせてください。",
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "写真と個人情報",
        },
        {
          type: "p",
          text: "これは国際間で最も大きな違いです。欧州大陸の一部、アジア、ラテンアメリカでは、CVに写真、生年月日、国籍が含まれることが期待される場合があります。米国・英国ではバイアスを減らすためにこれらを意図的に省略します。含めるとかえって不利になることもあります。迷った場合は、応募先の国の慣行に従ってください——そして特定の雇用主が省略するよう求めた個人情報は絶対に含めないでください。",
        },
        {
          type: "h2",
          id: "length",
          text: "長さに関する期待",
        },
        {
          type: "p",
          text: "完全なアカデミックCVには固定のページ制限はなく、実績とともに長くなりますが、期待値は異なります。欧州の応募ではより簡潔なCVが好まれる場合があり、米国のアカデミックCVは網羅的であることが多いです。公募や雇用主が明示的にページ制限を設けている場合は常に従ってください。",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europassと構造化フォーマット",
        },
        {
          type: "p",
          text: "欧州連合（EU）では、EuropassのCVが広く使われる構造化テンプレートであり、一部の機関はこれを求めます。いくつかの国やシステムには独自のレイアウトが期待されています。構造化フォーマットが求められる場合は、自由形式のCVを提出せず、それに厳密に従ってください。",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "地域別の資金提供機関ナラティブCV",
        },
        {
          type: "p",
          text: "主要な資金提供機関はそれぞれ独自の形式を求めることが増えています。英国のUKRI R4RI（Résumé for Research and Innovation）、EUのERC CV、スイスのSNSF形式、米国のNIH biosketchやNSF形式などです。これらはナラティブまたは厳格に構造化されており、標準CVとは異なります——各応募のために完全な記録から準備してください。",
        },
        {
          type: "h2",
          id: "adapt",
          text: "CVを調整する方法",
        },
        {
          type: "p",
          text: "複数のバージョンをゼロから維持するのではなく、一つの完全な統一CVを保持し、そこから国・資金提供機関固有のバージョンを派生させてください。SigmaCV は、オープンな研究記録からその統一CVを作成し、ワンクリックで資金提供機関のレイアウト（UKRI R4RI、ERC、SNSF、NIH、NSF等）をリバーシブルに適用します。国の期待に合わせた調整は全面的な書き直しではなく、素早い変更で済みます。",
        },
        {
          type: "cta",
          label: "アカデミックCVを無料で作成",
          href: "/",
        },
      ],
      faq: [
        {
          q: "アカデミックCVに写真を載せるべきですか？",
          a: "国によって異なります。写真や個人情報が期待される国もあれば、米国・英国の学術的な慣行ではバイアスを減らすために省略します。応募先の慣行に従ってください。",
        },
        {
          q: "アカデミックCVはどこでも同じですか？",
          a: "いいえ。用語、期待される長さ、個人情報の記載、必要な資金提供機関フォーマットはすべて国によって異なります。応募先の国と機関に合わせてCVを調整してください。",
        },
      ],
    },
  },
  "pt-BR": {
    "how-to-write-an-academic-cv": {
      title: "Como elaborar um currículo acadêmico",
      description:
        "Um guia prático para elaborar um currículo acadêmico: o que incluir, como ordenar e formatar cada seção, qual deve ser a extensão, como listar publicações e como as convenções variam conforme a etapa da carreira e o país.",
      blocks: [
        {
          type: "p",
          text: "O currículo acadêmico (curriculum vitae) é o documento padrão para candidaturas a cargos de pesquisa e docência, programas de pós-graduação, bolsas e financiamentos. Ao contrário de um résumé de uma ou duas páginas, trata-se de um registro completo e em constante evolução da sua trajetória acadêmica — educação, publicações, financiamentos, docência e serviço — que cresce ao longo de toda a carreira.",
        },
        {
          type: "p",
          text: "Este guia aborda o que incluir, como ordenar e formatar cada seção, qual deve ser a extensão do currículo acadêmico, como listar publicações e como as convenções diferem conforme a etapa da carreira e o país. Se preferir não montá-lo manualmente, é possível gerá-lo automaticamente a partir do seu registro no ORCID — veja a última seção.",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "O que é um currículo acadêmico?",
        },
        {
          type: "p",
          text: "O currículo é uma biografia acadêmica abrangente. Seu objetivo é documentar toda a extensão das suas contribuições acadêmicas para que uma comissão de seleção, um financiador ou uma banca de admissão possa avaliar seu histórico. Enquanto um résumé é adaptado e resumido para uma única vaga, o currículo acadêmico é exaustivo e cumulativo: você o amplia ao longo do tempo e raramente remove conteúdo.",
        },
        {
          type: "p",
          text: "Por ser lido por especialistas, o currículo acadêmico privilegia a completude e a precisão em detrimento da brevidade. Estrutura clara, formatação consistente e citações corretamente formatadas importam mais do que apelos visuais.",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "O que incluir: as seções principais",
        },
        {
          type: "p",
          text: "A maioria dos currículos acadêmicos é construída a partir dos mesmos blocos. Inclua as seções relevantes para sua área e etapa de carreira, e omita aquelas que ainda não têm conteúdo:",
        },
        {
          type: "ul",
          items: [
            "Cabeçalho — nome, cargo atual e dados de contato profissional (incluindo seu ORCID iD).",
            "Interesses de pesquisa / resumo — algumas linhas contextualizando seu trabalho (opcional, mais comum no início da carreira).",
            "Formação acadêmica — diplomas em ordem cronológica inversa, com instituição, datas e título da dissertação ou tese.",
            "Cargos / posições — funções acadêmicas e profissionais relevantes.",
            "Publicações — o elemento central para a maioria das funções de pesquisa (veja abaixo).",
            "Financiamentos e bolsas — recursos obtidos, com financiador, título, valor e datas.",
            "Prêmios e distinções — bolsas de excelência, prêmios e honrarias.",
            "Docência — disciplinas ministradas, aulas como convidado e funções de ensino.",
            "Orientação e mentoria — alunos e estagiários supervisionados.",
            "Apresentações — palestras a convite, comunicações em congressos e pôsteres.",
            "Serviço — revisão por pares, funções editoriais, comissões e divulgação científica.",
            "Associações profissionais, competências e referências — conforme relevante para sua área.",
          ],
        },
        {
          type: "h3",
          text: "Ordenação das seções",
        },
        {
          type: "p",
          text: "Após o cabeçalho, a formação e os cargos, destaque o que for mais forte para a vaga ou financiamento a que está se candidatando. Para cargos de pesquisa intensiva e financiamentos, coloque publicações e financiamentos no início; para funções voltadas ao ensino, eleve docência e orientação. Adapte a ordem para o leitor sem inventar ou inflar conteúdo.",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "Como listar publicações",
        },
        {
          type: "p",
          text: "A lista de publicações é onde a maioria das comissões passa mais tempo, por isso facilite a leitura rápida e evite qualquer ambiguidade:",
        },
        {
          type: "ul",
          items: [
            "Liste os trabalhos em ordem cronológica inversa, opcionalmente agrupados por tipo (artigos em periódicos, preprints, capítulos de livros, artigos em anais de congressos, conjuntos de dados, software).",
            "Use um único estilo de citação ao longo de todo o documento e mantenha-o idêntico em todas as versões do currículo.",
            "Destaque seu próprio nome em cada lista de autores para que sua contribuição seja visível à primeira vista.",
            "Inclua DOIs (e links) para que os leitores possam encontrar o trabalho.",
            "Indique claramente e com honestidade os trabalhos em avaliação, no prelo ou preprints.",
            "Não infle a lista — qualidade e relevância causam melhor impressão do que volume.",
          ],
        },
        {
          type: "p",
          text: "A consistência é o ponto de falha mais comum. Formatar todas as referências por meio de um único estilo de citação — a Citation Style Language (CSL) é o padrão por trás de ferramentas como o Zotero — garante que seu currículo em Word, PDF e LaTeX seja lido de forma idêntica.",
        },
        {
          type: "h2",
          id: "how-long",
          text: "Qual deve ser a extensão do currículo acadêmico?",
        },
        {
          type: "p",
          text: 'Não há limite fixo de páginas — um currículo acadêmico é tão longo quanto seu histórico justifica e cresce ao longo do tempo. Como referência geral: um candidato ao mestrado ou doutorado pode ter 2–4 páginas, um pós-doutorando de 3–6, e um professor sênior bem além de dez. A exceção são os "currículos curtos" de financiadores e editais de emprego, que frequentemente limitam a extensão (por exemplo, duas páginas) ou utilizam um formato narrativo como o NIH biosketch, o Résumé for Research and Innovation (R4RI) do UKRI ou um CV do ERC. Quando um edital especifica um formato ou limite de páginas, siga-o rigorosamente.',
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "Adaptação por etapa de carreira",
        },
        {
          type: "ul",
          items: [
            "Estudantes e candidatos à pós-graduação — enfatize a formação, a dissertação ou projeto de pesquisa, publicações ou apresentações existentes, competências relevantes e referências; é perfeitamente aceitável ser breve.",
            "Doutorandos e pós-doutorandos — destaque publicações, participação em congressos, financiamentos/bolsas e docência; mantenha-o atualizado para candidaturas contínuas a empregos e financiamentos.",
            "Docentes e pesquisadores sênior — ressalte financiamentos, publicações, orientação e serviço/liderança; espere um documento longo e estruturado por seções, além de um currículo curto separado para financiadores.",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "Formatação e diferenças por país",
        },
        {
          type: "p",
          text: 'As convenções variam. Nos EUA e no Canadá, o "CV" acadêmico é o documento acadêmico longo (o "résumé" é a versão curta para o setor privado), ao passo que em grande parte da Europa "CV" pode significar qualquer um dos dois. Alguns países esperam foto, data de nascimento ou nacionalidade; muitos outros — e a maioria dos contextos acadêmicos dos EUA/Reino Unido — omitem deliberadamente dados pessoais para reduzir viés. Candidatos europeus às vezes utilizam o formato Europass, e os grandes financiadores exigem cada vez mais seus próprios CVs narrativos. Em caso de dúvida, siga as normas do país e da instituição para os quais está se candidatando.',
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "Erros comuns a evitar",
        },
        {
          type: "ul",
          items: [
            "Formatação inconsistente ou mistura de vários estilos de citação em um mesmo documento.",
            "Inflar a lista de publicações ou enterrar seus trabalhos mais importantes.",
            "Deixar o currículo desatualizado entre candidaturas.",
            "Ignorar o formato ou o limite de páginas exigidos por um edital.",
            "Confiar em correspondência por nome para suas publicações — nomes comuns e em alfabetos não latinos são facilmente confundidos com os trabalhos de outra pessoa.",
            "Erros de digitação e links quebrados — revise o texto e verifique se cada DOI é resolvido corretamente.",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "Gere seu currículo acadêmico automaticamente",
        },
        {
          type: "p",
          text: "Manter um currículo acadêmico atualizado é um trabalho repetitivo e manual. O SigmaCV (gratuito e de código aberto) o gera automaticamente a partir do seu registro no ORCID e no OpenAlex — identificando seus trabalhos por identificador, nunca por nome — formata todas as citações de forma consistente e exporta para PDF, Word, LaTeX, Markdown ou BibTeX, ou uma página pública dinâmica que se ressincroniza. As métricas estão desativadas por padrão e são normalizadas por área, em consonância com DORA, e seus dados permanecem seus (consentimento por campo, exportação, exclusão).",
        },
        {
          type: "cta",
          label: "Gere seu currículo acadêmico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Qual deve ser a extensão do currículo acadêmico?",
          a: 'Não há limite fixo; ele cresce com seu histórico. Um candidato ao doutorado geralmente tem 2–4 páginas, um pós-doutorando de 3–6 e um acadêmico sênior muito mais. Os "currículos curtos" de financiadores/editais podem limitar a extensão ou exigir um formato narrativo (por exemplo, NIH biosketch, UKRI R4RI, ERC) — siga sempre as regras do edital.',
        },
        {
          q: "Qual é a diferença entre um currículo acadêmico e um résumé?",
          a: "Um currículo acadêmico é um registro completo e cumulativo da sua trajetória acadêmica (formação, publicações, financiamentos, docência, serviço) e pode ter muitas páginas; um résumé é um documento curto, adaptado, de uma a duas páginas, destinado a cargos fora da academia.",
        },
        {
          q: "Como devo listar publicações em um currículo acadêmico?",
          a: "Liste-as em ordem cronológica inversa, opcionalmente agrupadas por tipo, em um único estilo de citação consistente, com seu próprio nome destacado e DOIs incluídos. Identifique claramente preprints e trabalhos em avaliação, e não infle a lista.",
        },
        {
          q: "Posso gerar um currículo acadêmico automaticamente?",
          a: "Sim. O SigmaCV gera um currículo acadêmico a partir do seu registro no ORCID e no OpenAlex (identificado por identificador, não por nome), formata as citações e exporta para PDF, DOCX, LaTeX, Markdown ou BibTeX — gratuito e de código aberto.",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "Currículo acadêmico vs résumé: qual é a diferença?",
      description:
        "Currículo acadêmico vs résumé — como diferem em extensão, escopo e propósito, e qual usar para empregos acadêmicos, candidaturas à pós-graduação, financiamentos e cargos no setor privado.",
      blocks: [
        {
          type: "p",
          text: '"CV" e "résumé" são frequentemente usados como sinônimos, mas na academia são documentos diferentes com finalidades diferentes. Escolher o correto — e formatá-lo adequadamente — é importante para candidaturas a empregos acadêmicos, bolsas e financiamentos.',
        },
        {
          type: "p",
          text: "Um currículo acadêmico (curriculum vitae) é um registro completo e cumulativo da sua trajetória acadêmica: formação, publicações, financiamentos, docência, apresentações e serviço. Um résumé é um resumo curto e altamente adaptado — normalmente de uma ou duas páginas — voltado para uma função específica fora da academia.",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "As principais diferenças",
        },
        {
          type: "ul",
          items: [
            "Extensão — o currículo cresce sem limite fixo (frequentemente várias páginas); o résumé é reduzido a uma ou duas.",
            "Escopo — o currículo documenta tudo que é relevante para sua trajetória acadêmica; o résumé inclui apenas o que é relevante para a vaga em questão.",
            "Público — o currículo é lido por pares acadêmicos e comissões; o résumé por recrutadores e gestores de contratação.",
            "Estabilidade — o currículo é ampliado ao longo do tempo e raramente sofre cortes; o résumé é reescrito para cada candidatura.",
            "Publicações e financiamentos — centrais no currículo; geralmente condensados ou omitidos no résumé.",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "Qual usar?",
        },
        {
          type: "ul",
          items: [
            "Empregos acadêmicos, pós-doutorado, candidaturas ao mestrado/doutorado, bolsas e financiamentos → currículo acadêmico.",
            "Setor privado e a maioria das funções fora da academia → résumé adaptado ao anúncio.",
            'Funções "alt-ac" e do setor privado adjacentes à pesquisa → frequentemente um híbrido: documento com extensão de résumé que ainda destaca produções de pesquisa relevantes.',
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "Converter um currículo em résumé",
        },
        {
          type: "p",
          text: "Para transformar um currículo acadêmico em résumé, comece com um resumo breve, mantenha apenas a experiência mais relevante e um punhado de produções representativas, traduza conquistas acadêmicas em impacto e competências transferíveis e reduza para uma ou duas páginas. Mantenha o currículo completo como registro mestre e derive documentos mais curtos a partir dele.",
        },
        {
          type: "h2",
          id: "build-either",
          text: "Gere qualquer um a partir do seu registro de pesquisa",
        },
        {
          type: "p",
          text: "O SigmaCV gera um currículo acadêmico a partir do seu registro no ORCID e no OpenAlex e o exporta em diversos formatos e layouts com um clique — para que você mantenha um único registro canônico e produza a versão que cada candidatura exige. É gratuito, de código aberto e com privacidade como prioridade.",
        },
        {
          type: "cta",
          label: "Gere seu currículo acadêmico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "CV e résumé são a mesma coisa?",
          a: "Não na academia. Um currículo acadêmico é um registro longo e completo da sua trajetória acadêmica; um résumé é um documento curto e adaptado de uma a duas páginas para funções fora da academia. Fora da academia e em alguns países, os dois termos são usados de forma mais informal.",
        },
        {
          q: "Preciso de foto no currículo acadêmico?",
          a: "Depende do país. Alguns países esperam foto e dados pessoais; muitos contextos acadêmicos (especialmente nos EUA e no Reino Unido) os omitem deliberadamente para reduzir viés. Siga as normas do país ao qual está se candidatando.",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "Como listar publicações em um currículo acadêmico",
      description:
        "Como formatar e ordenar a seção de publicações de um currículo acadêmico: estilo de citação, agrupamento por tipo, ordem dos autores, destaque do próprio nome, preprints e trabalhos em avaliação, e o que evitar.",
      blocks: [
        {
          type: "p",
          text: "Para a maioria das funções acadêmicas, a seção de publicações é a parte do currículo que as comissões leem com mais atenção — portanto, a forma como você a apresenta importa quase tanto quanto o conteúdo. Este guia aborda estilo de citação, ordenação e agrupamento, como deixar clara sua própria contribuição, como tratar preprints e trabalhos em avaliação, e os erros que comprometem uma lista de outra forma sólida.",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "Escolha um único estilo de citação — e mantenha-o",
        },
        {
          type: "p",
          text: "Escolha um estilo de citação adequado à sua área (por exemplo, APA, Vancouver, Chicago ou IEEE) e aplique-o a todas as entradas. O erro mais comum é misturar estilos ou formatar referências manualmente, de modo que nenhuma delas se pareça com outra. Formatar toda a lista por meio de um único mecanismo — a Citation Style Language (CSL), o padrão por trás de gerenciadores de referências como o Zotero — garante consistência entre seus currículos em PDF, Word e LaTeX.",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "Ordene e agrupe suas publicações",
        },
        {
          type: "ul",
          items: [
            "Liste os trabalhos em ordem cronológica inversa (mais recentes primeiro).",
            "Agrupe por tipo quando a lista for longa: artigos revisados por pares, preprints, capítulos de livros, artigos em anais de congressos, conjuntos de dados e software.",
            "Mantenha os grupos claramente rotulados e separados para que um leitor encontre trabalhos revisados por pares imediatamente.",
            "Seja consistente quanto à numeração — numere todas as entradas ou nenhuma.",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "Deixe clara sua própria contribuição",
        },
        {
          type: "ul",
          items: [
            "Destaque seu próprio nome (por exemplo, em negrito) em cada lista de autores.",
            "Indique as funções de primeiro autor, autor correspondente e contribuição igualitária com uma notação clara e explicada.",
            "Lembre-se de que as convenções de ordem dos autores variam por área — acrescente uma observação de uma linha se a convenção da sua área não for óbvia.",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "Preprints, em avaliação e no prelo",
        },
        {
          type: "p",
          text: 'Liste os trabalhos com honestidade quanto ao seu status. Preprints são cada vez mais aceitos em currículos, mas devem ser identificados como tal, e itens "em avaliação" ou "no prelo" devem ser indicados dessa forma. Nunca apresente trabalhos não revisados por pares como revisados por pares, e não liste o mesmo artigo duas vezes (por exemplo, como preprint e como versão publicada) sem deixar clara a relação entre eles.',
        },
        {
          type: "h2",
          id: "identifiers",
          text: "Inclua identificadores e links",
        },
        {
          type: "p",
          text: "Adicione um DOI (e um link) a cada trabalho para que os leitores possam encontrá-lo, e coloque seu ORCID iD no cabeçalho. Os identificadores também permitem que ferramentas verifiquem sua autoria de forma confiável — por identificador e não por nome, o que é especialmente importante para nomes comuns e em alfabetos não latinos.",
        },
        {
          type: "h2",
          id: "avoid",
          text: "O que evitar",
        },
        {
          type: "ul",
          items: [
            "Misturar estilos de citação em um mesmo documento.",
            "Inflar a lista com itens secundários ou sem relação.",
            "Formas inconsistentes do próprio nome entre as entradas.",
            "DOIs quebrados ou ausentes — verifique se cada link é resolvido corretamente.",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "Gere uma lista de publicações formatada automaticamente",
        },
        {
          type: "p",
          text: "O SigmaCV importa suas publicações do ORCID e do OpenAlex (identificadas por identificador, não por nome), formata-as em qualquer estilo CSL com seu próprio nome destacado e exporta a lista para PDF, Word, LaTeX, Markdown ou BibTeX — para que todas as versões do seu currículo sejam consistentes e corretas.",
        },
        {
          type: "cta",
          label: "Gere sua lista de publicações gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Qual estilo de citação devo usar para as publicações do currículo?",
          a: "Use o estilo habitual na sua área (por exemplo, APA, Vancouver, Chicago, IEEE). O mais importante é aplicar um único estilo de forma consistente em toda a lista e em todos os formatos do currículo.",
        },
        {
          q: "Devo incluir preprints no currículo?",
          a: "Sim — preprints são cada vez mais aceitos — mas identifique-os claramente como preprints e mantenha-os separados dos artigos revisados por pares.",
        },
        {
          q: "Como indicar coautoria principal ou contribuição igualitária?",
          a: 'Marque os autores relevantes com um símbolo e explique-o em uma legenda curta (por exemplo, "* contribuição igualitária"). Mantenha a consistência em toda a lista.',
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "Qual deve ser a extensão do currículo acadêmico?",
      description:
        "Qual deve ser a extensão do currículo acadêmico por etapa da carreira, quando a extensão é limitada (currículos curtos para financiadores e empregadores) e por que mais longo não é melhor — além de como manter um currículo mestre e exportar versões mais curtas.",
      blocks: [
        {
          type: "p",
          text: "A resposta breve: um currículo acadêmico é tão longo quanto seu histórico justifica e cresce ao longo da carreira. Ao contrário de um résumé, não há expectativa de que caiba em uma ou duas páginas. Mas a extensão depende da etapa da carreira e do contexto, e há exceções importantes.",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "Referências por etapa da carreira",
        },
        {
          type: "ul",
          items: [
            "Candidato ao mestrado / doutorado — aproximadamente 2–4 páginas.",
            "Doutorando / pós-doutorando — aproximadamente 3–6 páginas.",
            "Carreira intermediária — frequentemente 6–10+ páginas.",
            "Docente sênior — bem além de dez páginas; o registro de publicações e financiamentos determina a extensão.",
          ],
        },
        {
          type: "p",
          text: "Estas são referências, não regras. Um currículo de quatro páginas bem organizado e sólido supera um de oito páginas inflado.",
        },
        {
          type: "h2",
          id: "capped",
          text: "Quando a extensão é limitada",
        },
        {
          type: "p",
          text: 'Muitos financiadores e empregadores solicitam um "currículo curto" com limite estrito de páginas (frequentemente duas), ou um formato narrativo estruturado como o NIH biosketch, o Résumé for Research and Innovation (R4RI) do UKRI, um CV do ERC ou o formato do SNSF suíço. Quando um edital especifica extensão ou formato, siga-o rigorosamente — ultrapassar o limite pode resultar em uma candidatura rejeitada sem avaliação.',
        },
        {
          type: "h2",
          id: "quality",
          text: "Mais longo não é melhor",
        },
        {
          type: "p",
          text: "Completude é esperada, mas conteúdo inflado não é. Inclua o que é relevante, ordene para que seu material mais forte seja fácil de encontrar e elimine o que não acrescenta. Os avaliadores valorizam clareza e relevância, não número de páginas.",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "Mantenha um currículo mestre, exporte versões mais curtas",
        },
        {
          type: "p",
          text: "A abordagem prática é manter um currículo mestre completo e derivar dele versões mais curtas ou específicas para financiadores. O SigmaCV faz isso a partir de um único registro canônico: mantenha tudo em um só lugar, depois aplique um layout com um clique (NIH, NSF, ERC, UKRI R4RI e outros) ou restrinja seções para um edital específico, de forma reversível, e exporte.",
        },
        {
          type: "cta",
          label: "Gere seu currículo acadêmico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Existe limite de páginas para um currículo acadêmico?",
          a: 'Em geral, não — um currículo acadêmico completo é tão longo quanto seu histórico justifica. A exceção são os "currículos curtos" de financiadores/editais, que frequentemente limitam a extensão ou exigem um formato narrativo; siga sempre as instruções do edital.',
        },
        {
          q: "Qual deve ser a extensão do currículo para candidatura ao doutorado?",
          a: "Normalmente cerca de 2–4 páginas. Nessa etapa, experiência de pesquisa clara e algumas produções representativas importam mais do que a extensão.",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "Currículo acadêmico para candidaturas à pós-graduação",
      description:
        "O que incluir em um currículo acadêmico para candidaturas ao mestrado, doutorado ou pós-graduação quando você ainda não tem muitas publicações — e como causar boa impressão em uma comissão de admissão.",
      blocks: [
        {
          type: "p",
          text: "Se você está se candidatando a um programa de mestrado ou doutorado e teme que seu currículo pareça escasso, isso é completamente normal — as comissões de admissão não esperam uma longa lista de publicações nessa etapa. Elas buscam evidências de potencial: experiência de pesquisa, competências relevantes e uma trajetória clara. Veja o que incluir e como apresentar.",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "O que incluir",
        },
        {
          type: "ul",
          items: [
            "Formação acadêmica — diplomas, instituições, datas e seu GPA ou nota, se for forte; inclua o título da dissertação ou trabalho de conclusão.",
            "Experiência em pesquisa — laboratórios, projetos e dissertações, com sua função, métodos e resultados.",
            "Publicações e apresentações — artigos, preprints, pôsteres ou comunicações em congressos, mesmo que em estágio inicial.",
            "Competências — laboratoriais, técnicas, estatísticas, de programação e idiomas relevantes para a área.",
            "Prêmios e bolsas — distinções acadêmicas e financiamentos.",
            "Experiência relevante — docência, tutoria, trabalho relevante ou voluntariado.",
            "Referências — ou uma nota indicando que estão disponíveis mediante solicitação.",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "Destaque a experiência em pesquisa",
        },
        {
          type: "p",
          text: "Mesmo sem publicações, a experiência em pesquisa é seu principal trunfo. Para cada projeto, explique qual era a questão investigada, o que você fez (técnicas, análises, seu papel específico) e quais foram os resultados. Contribuições concretas causam muito melhor impressão do que uma lista de nomes de disciplinas.",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "Extensão e formatação",
        },
        {
          type: "p",
          text: "O currículo para candidatura à pós-graduação geralmente tem 2–4 páginas. Mantenha a formatação limpa e consistente, use títulos de seção claros e adapte o destaque ao programa para o qual está se candidatando. Ser breve não é problema — não infle o conteúdo.",
        },
        {
          type: "h2",
          id: "build",
          text: "Gere a partir do seu registro",
        },
        {
          type: "p",
          text: "O SigmaCV monta um currículo acadêmico limpo a partir do seu ORCID e de dados abertos, para que até suas primeiras publicações, preprints e pôsteres sejam formatados correta e consistentemente — e você pode adicionar qualquer trabalho pelo DOI. É gratuito e de código aberto.",
        },
        {
          type: "cta",
          label: "Gere seu currículo para pós-graduação gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Preciso ter publicações para um currículo de candidatura à pós-graduação?",
          a: "Não. Na etapa de candidatura, experiência em pesquisa, competências relevantes e uma trajetória clara importam mais do que uma lista de publicações. Inclua preprints ou pôsteres que você já tiver, mas a ausência deles é esperada.",
        },
        {
          q: "Qual deve ser a extensão do currículo para candidatura à pós-graduação?",
          a: "Normalmente 2–4 páginas. Mantenha o foco: experiência de pesquisa clara e alguns itens representativos superam o conteúdo inflado.",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title: "Uso responsável de métricas em um currículo acadêmico (DORA e o Leiden Manifesto)",
      description:
        "Como apresentar métricas de pesquisa em um currículo de forma responsável: por que o Journal Impact Factor e o h-index induzem ao erro, o que os indicadores normalizados por área acrescentam, e o que DORA e o Leiden Manifesto recomendam.",
      blocks: [
        {
          type: "p",
          text: "As métricas são uma atalho tentador em um currículo, mas são facilmente mal utilizadas — e as comissões esperam cada vez mais que os pesquisadores as usem de forma responsável. Este guia explica quais métricas induzem ao erro, quais são mais defensáveis, e o que os principais marcos de avaliação responsável recomendam.",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "Por que o Journal Impact Factor é a ferramenta errada",
        },
        {
          type: "p",
          text: "O Journal Impact Factor (JIF) mede a média de citações de um periódico, não a qualidade ou o impacto do seu artigo individual. As distribuições de citações são altamente assimétricas, de modo que um único artigo em um periódico com JIF elevado diz quase nada sobre aquele artigo em particular. DORA — a San Francisco Declaration on Research Assessment — aconselha explicitamente contra o uso do JIF para avaliar pesquisas ou pesquisadores individualmente.",
        },
        {
          type: "h2",
          id: "h-index",
          text: "O h-index e contagens brutas têm limitações",
        },
        {
          type: "p",
          text: "O h-index e as contagens brutas de citações dependem muito da área e da duração da carreira, portanto não são comparáveis entre disciplinas e desfavorecem pesquisadores em início de carreira. Também podem ser inflados. Se você os incluir, forneça contexto; nunca os apresente como medida isolada de mérito.",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "Prefira indicadores normalizados por área",
        },
        {
          type: "p",
          text: "Indicadores normalizados por área — como o Field-Weighted Citation Impact (FWCI) ou o NIH iCite Relative Citation Ratio (RCR) — levam em conta as diferenças nas taxas de citação entre áreas e ao longo do tempo, tornando-se mais comparáveis do que contagens brutas. Ainda são imperfeitos e devem ser interpretados com contexto, nunca como o único sinal.",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "O que DORA e o Leiden Manifesto recomendam",
        },
        {
          type: "ul",
          items: [
            "DORA — não use métricas baseadas em periódicos (como o JIF) para avaliar contribuições individuais; avalie a pesquisa pelos seus próprios méritos.",
            "O Leiden Manifesto — use indicadores quantitativos para apoiar, e não substituir, o julgamento especializado; leve em conta as diferenças entre áreas; mantenha os dados e métodos transparentes; e evite a falsa concretude.",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "Orientações práticas para o currículo",
        },
        {
          type: "ul",
          items: [
            "Destaque o próprio trabalho — o que você fez e por que isso importa — e não os números.",
            "Se incluir métricas, prefira indicadores normalizados por área e forneça contexto (área, janela temporal, percentil).",
            "Considere uma descrição narrativa breve das suas principais contribuições, em vez de — ou junto com — números.",
            "Nunca cite o Journal Impact Factor dos periódicos em que seus artigos foram publicados.",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Métricas responsáveis, por padrão",
        },
        {
          type: "p",
          text: "O SigmaCV foi construído em torno dessa postura: as métricas estão desativadas por padrão e são opcionais, prefere indicadores normalizados por área em detrimento de contagens brutas e nunca exibe o Journal Impact Factor — em consonância com DORA. Você controla se qualquer métrica aparece ou não no seu currículo.",
        },
        {
          type: "cta",
          label: "Gere um currículo alinhado ao DORA gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Devo colocar meu h-index no currículo?",
          a: "É opcional e depende da área. Se o incluir, forneça contexto e combine-o com indicadores normalizados por área em vez de apresentá-lo isoladamente; muitas comissões desaconselham a dependência excessiva dele.",
        },
        {
          q: "É adequado listar os Journal Impact Factors no currículo?",
          a: "Não é recomendado. DORA aconselha especificamente contra o uso do Journal Impact Factor para avaliar pesquisas individuais, pois ele mede o periódico, não o artigo.",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "Formato do currículo acadêmico por país",
      description:
        "Como as convenções de currículo acadêmico diferem por país — a distinção CV/résumé, fotos e dados pessoais, extensão, Europass e formatos narrativos de financiadores — e como adaptar o seu.",
      blocks: [
        {
          type: "p",
          text: "Não existe um padrão global único para um currículo acadêmico. As convenções variam por país e instituição — como o documento é chamado, se inclui foto, qual é sua extensão e qual formato estruturado um financiador espera. Este guia aborda as principais diferenças e como adaptar seu currículo ao país para o qual está se candidatando.",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "A distinção CV / résumé varia",
        },
        {
          type: "p",
          text: 'Nos EUA e no Canadá, o "CV" acadêmico é o documento acadêmico longo e completo, enquanto o "résumé" é a versão curta de uma a duas páginas para o setor privado. No Reino Unido e em grande parte da Europa, "CV" pode significar qualquer um dos dois, e a versão acadêmica é simplesmente compreendida pelo contexto. Use o termo e a extensão esperados pelo país e pela função para os quais está se candidatando.',
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "Fotos e dados pessoais",
        },
        {
          type: "p",
          text: "Esta é a maior diferença entre países. Em partes da Europa continental, da Ásia e da América Latina, pode-se esperar que o currículo inclua foto, data de nascimento ou nacionalidade. Nos EUA e no Reino Unido, esses dados são deliberadamente omitidos para reduzir viés, e incluí-los pode prejudicar a candidatura. Em caso de dúvida, siga a norma do país de destino — e nunca inclua dados pessoais que um empregador específico tenha pedido que você omita.",
        },
        {
          type: "h2",
          id: "length",
          text: "Expectativas de extensão",
        },
        {
          type: "p",
          text: "Um currículo acadêmico completo não tem limite fixo de páginas e cresce com seu histórico, mas as expectativas diferem: algumas candidaturas europeias favorecem um currículo mais conciso, enquanto os currículos acadêmicos dos EUA frequentemente são exaustivos. Sempre siga um limite de páginas explícito quando um edital ou empregador o especificar.",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass e formatos estruturados",
        },
        {
          type: "p",
          text: "Na União Europeia, o CV Europass é um modelo estruturado comum, e algumas instituições o solicitam. Vários países e sistemas têm seus próprios layouts esperados. Quando um formato estruturado for exigido, siga-o rigorosamente em vez de enviar um currículo de formato livre.",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "CVs narrativos de financiadores por região",
        },
        {
          type: "p",
          text: "Os principais financiadores exigem cada vez mais seus próprios formatos: o UKRI Résumé for Research and Innovation (R4RI) no Reino Unido, o CV do ERC na UE, o formato do SNSF na Suíça e o NIH biosketch ou o formato do NSF nos EUA. Esses documentos são narrativos ou fortemente estruturados e diferem de um currículo padrão — prepare-os a partir do seu registro completo para cada candidatura.",
        },
        {
          type: "h2",
          id: "adapt",
          text: "Como adaptar seu currículo",
        },
        {
          type: "p",
          text: "Mantenha um currículo completo e canônico e derive dele versões específicas por país ou financiador, em vez de manter vários currículos separados desde o início. O SigmaCV constrói esse currículo canônico a partir do seu registro de pesquisa aberta e aplica layouts de financiadores com um clique (UKRI R4RI, ERC, SNSF, NIH, NSF e outros) de forma reversível, de modo que adaptar-se às expectativas de um país seja uma alteração rápida, não uma reescrita.",
        },
        {
          type: "cta",
          label: "Gere seu currículo acadêmico gratuitamente",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Devo colocar foto no currículo acadêmico?",
          a: "Depende do país. Alguns países esperam foto e dados pessoais; a norma acadêmica dos EUA e do Reino Unido é omiti-los para reduzir viés. Siga a convenção do país para o qual está se candidatando.",
        },
        {
          q: "Um currículo acadêmico é o mesmo em todo o mundo?",
          a: "Não. O termo, a extensão esperada, a inclusão de dados pessoais e os formatos exigidos pelos financiadores variam por país. Adapte seu currículo ao país e à instituição de destino.",
        },
      ],
    },
  },
  "it-IT": {
    "how-to-write-an-academic-cv": {
      title: "Come redigere un curriculum vitae accademico",
      description:
        "Una guida pratica alla stesura del curriculum vitae accademico: cosa includere, come ordinare e formattare ogni sezione, la lunghezza ideale, come elencare le pubblicazioni e le differenze di convenzione per stadio di carriera e paese.",
      blocks: [
        {
          type: "p",
          text: "Il curriculum vitae accademico (curriculum vitae) è il documento standard per le candidature a posizioni di ricerca e insegnamento, programmi di dottorato, fellowship e finanziamenti. A differenza di un résumé di una o due pagine, è un registro completo e in continua evoluzione della propria vita scientifica — formazione, pubblicazioni, finanziamenti, attività didattica e servizio — e cresce nel corso dell'intera carriera.",
        },
        {
          type: "p",
          text: "Questa guida illustra cosa includere, come ordinare e formattare ogni sezione, la lunghezza adeguata, come elencare le pubblicazioni e le differenze di convenzione a seconda dello stadio di carriera e del paese. Se si preferisce non assemblarlo manualmente, è possibile generarlo automaticamente dal proprio profilo ORCID — si veda l'ultima sezione.",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "Che cos'è un curriculum vitae accademico?",
        },
        {
          type: "p",
          text: "Il CV è una biografia accademica completa. Il suo scopo è documentare l'intera portata dei propri contributi scientifici affinché una commissione di selezione, un ente finanziatore o una commissione di ammissione possa valutare il percorso del candidato. Mentre un résumé è personalizzato e ridotto per un singolo ruolo, un curriculum vitae accademico è esaustivo e cumulativo: vi si aggiunge nel tempo e raramente si elimina qualcosa.",
        },
        {
          type: "p",
          text: "Essendo destinato a lettori specializzati, il CV accademico privilegia la completezza e l'accuratezza rispetto alla brevità. Una struttura chiara, una formattazione coerente e citazioni correttamente formattate contano più dell'eleganza visiva.",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "Cosa includere: le sezioni fondamentali",
        },
        {
          type: "p",
          text: "La maggior parte dei curriculum vitae accademici è costruita dagli stessi elementi fondamentali. Includere le sezioni pertinenti al proprio campo e stadio di carriera, omettendo quelle per cui non si ha ancora nulla da inserire:",
        },
        {
          type: "ul",
          items: [
            "Intestazione — nome, posizione attuale e recapiti professionali (compreso il proprio ORCID iD).",
            "Interessi di ricerca / sintesi — alcune righe che inquadrano la propria attività (facoltativo, più comune nelle fasi iniziali della carriera).",
            "Formazione — titoli di studio in ordine cronologico inverso, con istituzione, date e titolo della tesi.",
            "Incarichi / posizioni — ruoli accademici e professionali rilevanti.",
            "Pubblicazioni — l'elemento centrale per la maggior parte delle posizioni di ricerca (si veda di seguito).",
            "Finanziamenti e sovvenzioni — fondi ottenuti, con ente finanziatore, titolo, importo e date.",
            "Premi e riconoscimenti — fellowship, premi e distinzioni.",
            "Didattica — corsi tenuti, lezioni su invito e ruoli didattici.",
            "Supervisione e tutoraggio — studenti e tirocinanti seguiti.",
            "Presentazioni — conferenze su invito, comunicazioni a congressi e poster.",
            "Servizio — revisione tra pari, ruoli editoriali, commissioni e attività di divulgazione.",
            "Appartenenze professionali, competenze e referenze — secondo la rilevanza nel proprio campo.",
          ],
        },
        {
          type: "h3",
          text: "Ordinare le sezioni",
        },
        {
          type: "p",
          text: "Dopo l'intestazione, la formazione e le posizioni, dare risalto a ciò che è più rilevante per il ruolo a cui si concorre. Per posizioni di ricerca intensiva e finanziamenti, mettere in evidenza le pubblicazioni e i fondi; per ruoli a prevalenza didattica, anticipare la didattica e la supervisione. Personalizzare l'ordine in funzione del lettore senza inventare o gonfiare i contenuti.",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "Come elencare le pubblicazioni",
        },
        {
          type: "p",
          text: "La lista delle pubblicazioni è la sezione su cui la maggior parte delle commissioni si sofferma di più, quindi è importante renderla scorrevole nella lettura e inequivocabile:",
        },
        {
          type: "ul",
          items: [
            "Elencare le opere in ordine cronologico inverso, opzionalmente raggruppate per tipo (articoli su rivista, preprint, capitoli di libro, comunicazioni a congresso, dataset, software).",
            "Utilizzare uno stile citazionale coerente per tutta la lista e mantenerlo identico in ogni versione del CV.",
            "Mettere in evidenza il proprio nome in ogni lista di autori affinché il contributo sia immediatamente visibile.",
            "Includere i DOI (e i link) per consentire ai lettori di trovare l'opera.",
            "Indicare chiaramente e onestamente le opere in revisione, in press o i preprint.",
            "Non gonfiare la lista — la qualità e la pertinenza comunicano meglio del volume.",
          ],
        },
        {
          type: "p",
          text: "La coerenza è il difetto più comune. Formattare tutti i riferimenti attraverso un unico stile citazionale — il Citation Style Language (CSL) è lo standard alla base di strumenti come Zotero — garantisce che le versioni Word, PDF e LaTeX del CV siano identiche.",
        },
        {
          type: "h2",
          id: "how-long",
          text: "Quanto deve essere lungo un curriculum vitae accademico?",
        },
        {
          type: "p",
          text: "Non esiste un limite fisso di pagine — un CV accademico è lungo quanto lo giustifica il proprio percorso, e cresce nel tempo. Come riferimento orientativo: un candidato con laurea magistrale o dottorato potrebbe avere 2–4 pagine, un postdoc 3–6, e un professore senior ben oltre le dieci. L'eccezione sono i «CV brevi» richiesti da enti finanziatori o per candidature, che spesso fissano un limite di lunghezza (ad esempio due pagine) o richiedono un formato narrativo come il NIH biosketch, il Résumé for Research and Innovation (R4RI) di UKRI o il CV ERC. Quando un bando specifica un formato o un limite di pagine, seguirlo scrupolosamente.",
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "Adattare il CV allo stadio di carriera",
        },
        {
          type: "ul",
          items: [
            "Studenti e candidati alla scuola di dottorato — mettere in evidenza la formazione, la tesi o il progetto di ricerca, eventuali pubblicazioni o presentazioni, le competenze rilevanti e le referenze; è accettabile essere brevi.",
            "Dottorandi e postdoc — dare risalto alle pubblicazioni, all'attività congressuale, ai finanziamenti/fellowship e alla didattica; tenerlo aggiornato per le scadenze continue di candidature e di finanziamenti.",
            "Docenti e principal investigator — mettere in primo piano finanziamenti, pubblicazioni, supervisione e servizio/leadership; è atteso un documento lungo e articolato in sezioni, accompagnato da un CV breve separato per gli enti finanziatori.",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "Formattazione e differenze tra paesi",
        },
        {
          type: "p",
          text: "Le convenzioni variano. Negli Stati Uniti e in Canada il «CV» accademico è il documento scientifico lungo (il «résumé» è la versione breve per l'industria), mentre in gran parte d'Europa il termine «CV» può indicare entrambi. Alcuni paesi richiedono una foto, la data di nascita o la nazionalità; molti altri — e la maggior parte dei contesti accademici statunitensi e britannici — omettono deliberatamente i dati personali per ridurre i pregiudizi. I candidati europei utilizzano talvolta il formato Europass, e i principali enti finanziatori richiedono sempre più spesso CV narrativi personalizzati. In caso di dubbio, adeguarsi alle norme del paese e dell'istituzione a cui si fa domanda.",
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "Errori comuni da evitare",
        },
        {
          type: "ul",
          items: [
            "Formattazione incoerente o mescolanza di più stili citazionali in un unico documento.",
            "Gonfiare la lista delle pubblicazioni o oscurare le opere più importanti.",
            "Lasciare il CV obsoleto tra una candidatura e l'altra.",
            "Ignorare il formato richiesto o il limite di pagine di un bando.",
            "Affidarsi alla corrispondenza per nome per le proprie pubblicazioni — i nomi comuni e quelli in alfabeti non latini si confondono facilmente con il lavoro di altri.",
            "Errori tipografici e link non funzionanti — rileggere con attenzione e verificare che ogni DOI si risolva correttamente.",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "Genera automaticamente il tuo curriculum vitae accademico",
        },
        {
          type: "p",
          text: "Mantenere aggiornato un CV accademico è un lavoro ripetitivo e manuale. SigmaCV (gratuito e open source) lo genera per te a partire dal tuo profilo ORCID e OpenAlex — abbinando le tue opere per identificatore, mai per nome — formatta ogni citazione in modo coerente ed esporta in PDF, Word, LaTeX, Markdown o BibTeX, oppure come pagina pubblica sempre aggiornata. Le metriche sono disattivate per impostazione predefinita e field-normalized, in linea con DORA, e i tuoi dati rimangono tuoi (consenso per campo, esportazione, cancellazione).",
        },
        {
          type: "cta",
          label: "Genera gratuitamente il tuo CV accademico",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Quanto deve essere lungo un curriculum vitae accademico?",
          a: "Non esiste un limite fisso; cresce con il proprio percorso. Un candidato al dottorato ha spesso 2–4 pagine, un postdoc 3–6, e un accademico senior molto di più. I «CV brevi» per enti finanziatori o candidature possono fissare un limite di lunghezza o richiedere un formato narrativo (ad esempio NIH biosketch, UKRI R4RI, ERC) — seguire sempre le istruzioni del bando.",
        },
        {
          q: "Qual è la differenza tra un CV accademico e un résumé?",
          a: "Un CV accademico è un registro completo e cumulativo della propria vita scientifica (formazione, pubblicazioni, finanziamenti, didattica, servizio) e può essere molto lungo; un résumé è un documento breve, personalizzato, di una o due pagine, destinato a ruoli non accademici.",
        },
        {
          q: "Come si elencano le pubblicazioni in un CV accademico?",
          a: "In ordine cronologico inverso, opzionalmente raggruppate per tipo, con uno stile citazionale coerente, il proprio nome in evidenza e i DOI inclusi. Indicare chiaramente i preprint e le opere in revisione, senza gonfiare la lista.",
        },
        {
          q: "Si può generare automaticamente un curriculum vitae accademico?",
          a: "Sì. SigmaCV costruisce un CV accademico a partire dal tuo profilo ORCID e OpenAlex (abbinato per identificatore, non per nome), formatta le citazioni ed esporta in PDF, DOCX, LaTeX, Markdown o BibTeX — gratuitamente e open source.",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "CV accademico e résumé: quali sono le differenze?",
      description:
        "CV accademico e résumé a confronto — differenze di lunghezza, portata e scopo, e quale utilizzare per candidature accademiche, dottorati, finanziamenti e ruoli nel settore privato.",
      blocks: [
        {
          type: "p",
          text: "«CV» e «résumé» sono spesso usati in modo intercambiabile, ma in ambito accademico sono documenti diversi con finalità diverse. Scegliere quello giusto — e formattarlo correttamente — è importante per le candidature a posizioni accademiche, fellowship e finanziamenti.",
        },
        {
          type: "p",
          text: "Un curriculum vitae accademico (curriculum vitae) è un registro completo e cumulativo della propria vita scientifica: formazione, pubblicazioni, finanziamenti, didattica, presentazioni e servizio. Un résumé è una sintesi breve e fortemente personalizzata — di solito una o due pagine — orientata a uno specifico ruolo non accademico.",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "Le differenze principali",
        },
        {
          type: "ul",
          items: [
            "Lunghezza — il CV cresce senza un limite fisso (spesso molte pagine); il résumé è ridotto a una o due.",
            "Portata — il CV documenta tutto ciò che è rilevante per la propria carriera scientifica; il résumé include solo ciò che è pertinente al ruolo specifico.",
            "Destinatari — il CV è letto da colleghi accademici e commissioni; il résumé da recruiter e responsabili delle assunzioni.",
            "Stabilità — al CV si aggiunge nel tempo e raramente si taglia; il résumé viene riscritto per ogni candidatura.",
            "Pubblicazioni e finanziamenti — centrali nel CV; di solito condensati o omessi nel résumé.",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "Quale documento utilizzare?",
        },
        {
          type: "ul",
          items: [
            "Posizioni accademiche, postdoc, candidature a dottorati/scuole di specializzazione, fellowship e finanziamenti → un CV accademico.",
            "Ruoli nel settore privato e nella maggior parte dei contesti non accademici → un résumé, personalizzato per l'annuncio.",
            "Ruoli «alt-ac» e industria adiacente alla ricerca → spesso un ibrido: un documento della lunghezza di un résumé che mette comunque in evidenza i risultati di ricerca rilevanti.",
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "Convertire un CV in un résumé",
        },
        {
          type: "p",
          text: "Per trasformare un CV accademico in un résumé, iniziare con una breve sintesi, conservare solo le esperienze più pertinenti e un numero limitato di output rappresentativi, tradurre i risultati accademici in termini di impatto e competenze trasversali, e ridurre il documento a una o due pagine. Mantenere il CV completo come documento di riferimento e derivare da esso le versioni più brevi.",
        },
        {
          type: "h2",
          id: "build-either",
          text: "Genera entrambi a partire dal tuo percorso di ricerca",
        },
        {
          type: "p",
          text: "SigmaCV costruisce un CV accademico a partire dal tuo profilo ORCID e OpenAlex e lo esporta in una varietà di formati e layout a un clic — così puoi mantenere un unico registro canonico e produrre la versione adatta a ogni candidatura. È gratuito, open source e rispettoso della privacy.",
        },
        {
          type: "cta",
          label: "Genera gratuitamente il tuo CV accademico",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Un CV equivale a un résumé?",
          a: "Non in ambito accademico. Un CV accademico è un registro lungo e completo della propria attività scientifica; un résumé è un documento breve, personalizzato, di una o due pagine, destinato a ruoli non accademici. Al di fuori dell'accademia, e in alcuni paesi, i due termini sono usati in modo più generico.",
        },
        {
          q: "Devo inserire una foto nel CV accademico?",
          a: "Dipende dal paese. In alcuni paesi si prevede una foto e dati personali; in molti contesti accademici (in particolare negli USA e nel Regno Unito) vengono deliberatamente omessi per ridurre i pregiudizi. Adeguarsi alle norme del paese a cui si fa domanda.",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "Come elencare le pubblicazioni in un curriculum vitae accademico",
      description:
        "Come formattare e ordinare la sezione delle pubblicazioni in un CV accademico: stile citazionale, raggruppamento per tipo, ordine degli autori, evidenziazione del proprio nome, preprint e opere in revisione, e cosa evitare.",
      blocks: [
        {
          type: "p",
          text: "Per la maggior parte dei ruoli accademici, la sezione delle pubblicazioni è la parte del CV che le commissioni esaminano con maggiore attenzione, quindi il modo in cui la si presenta conta quasi quanto il contenuto. Questa guida illustra lo stile citazionale, l'ordinamento e il raggruppamento, come rendere evidente il proprio contributo, come gestire i preprint e le opere in revisione, e gli errori che compromettono una lista altrimenti solida.",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "Scegliere uno stile citazionale — e mantenerlo",
        },
        {
          type: "p",
          text: "Scegliere uno stile citazionale appropriato al proprio campo (ad esempio APA, Vancouver, Chicago o IEEE) e applicarlo a ogni voce. Il difetto più comune è mescolare stili o formattare i riferimenti manualmente, così che nessuno abbia lo stesso aspetto. Formattare l'intera lista attraverso un unico motore — il Citation Style Language (CSL), lo standard alla base di gestori bibliografici come Zotero — garantisce la coerenza tra le versioni PDF, Word e LaTeX del CV.",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "Ordinare e raggruppare le pubblicazioni",
        },
        {
          type: "ul",
          items: [
            "Elencare le opere in ordine cronologico inverso (dalla più recente).",
            "Raggruppare per tipo quando la lista è lunga: articoli su riviste sottoposti a revisione paritaria, preprint, capitoli di libro, comunicazioni a congresso, dataset e software.",
            "Etichettare e separare chiaramente i gruppi affinché il lettore possa trovare immediatamente le opere sottoposte a revisione paritaria.",
            "Essere coerenti nella numerazione — numerare tutte le voci o nessuna.",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "Rendere evidente il proprio contributo",
        },
        {
          type: "ul",
          items: [
            "Evidenziare il proprio nome (ad esempio in grassetto) in ogni lista di autori.",
            "Indicare i ruoli di primo autore, autore corrispondente e contributo equivalente con una notazione chiara e spiegata.",
            "Ricordare che le convenzioni sull'ordine degli autori variano a seconda del campo — aggiungere una breve nota se la convenzione del proprio settore non è immediatamente ovvia.",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "Preprint, opere in revisione e in press",
        },
        {
          type: "p",
          text: "Elencare le opere onestamente con il relativo stato. I preprint sono sempre più accettati nei CV ma devono essere etichettati come tali, e le voci «in revisione» o «in press» devono indicarlo esplicitamente. Non presentare mai un'opera non sottoposta a revisione paritaria come se lo fosse, e non elencare la stessa opera due volte (ad esempio come preprint e come versione pubblicata) senza chiarire la relazione.",
        },
        {
          type: "h2",
          id: "identifiers",
          text: "Includere identificatori e link",
        },
        {
          type: "p",
          text: "Aggiungere un DOI (e un link) a ogni opera affinché i lettori possano trovarla, e inserire il proprio ORCID iD nell'intestazione. Gli identificatori consentono inoltre agli strumenti di verificare la paternità in modo affidabile — tramite identificatore anziché per nome, il che è particolarmente importante per i nomi comuni e quelli in alfabeti non latini.",
        },
        {
          type: "h2",
          id: "avoid",
          text: "Cosa evitare",
        },
        {
          type: "ul",
          items: [
            "Mescolare stili citazionali all'interno di un unico documento.",
            "Gonfiare la lista con voci minori o non pertinenti.",
            "Forme incoerenti del proprio nome nelle varie voci.",
            "DOI mancanti o non funzionanti — verificare che ogni link si risolva correttamente.",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "Genera automaticamente una lista di pubblicazioni formattata",
        },
        {
          type: "p",
          text: "SigmaCV recupera le tue pubblicazioni da ORCID e OpenAlex (abbinate per identificatore, non per nome), le formatta in qualsiasi stile CSL con il tuo nome in evidenza ed esporta la lista in PDF, Word, LaTeX, Markdown o BibTeX — così ogni versione del tuo CV è coerente e corretta.",
        },
        {
          type: "cta",
          label: "Genera gratuitamente la tua lista di pubblicazioni",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Quale stile citazionale usare per le pubblicazioni nel CV?",
          a: "Utilizzare lo stile standard nel proprio campo (ad esempio APA, Vancouver, Chicago, IEEE). Ciò che conta di più è applicare un unico stile in modo coerente in tutta la lista e in ogni formato del CV.",
        },
        {
          q: "Devo includere i preprint nel CV?",
          a: "Sì — i preprint sono sempre più accettati — ma etichettarli chiaramente come tali e tenerli separati dagli articoli sottoposti a revisione paritaria.",
        },
        {
          q: "Come si indica la co-primo-autorialità o il contributo equivalente?",
          a: "Contrassegnare gli autori rilevanti con un simbolo e spiegarlo in una breve legenda (ad esempio «* contributo equivalente»). Essere coerenti in tutta la lista.",
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "Quanto deve essere lungo un curriculum vitae accademico?",
      description:
        "La lunghezza adeguata di un CV accademico in base allo stadio di carriera, quando la lunghezza è limitata (CV brevi per enti finanziatori e candidature), e perché più pagine non significa migliore qualità — oltre a come mantenere un CV principale ed esportare versioni più brevi.",
      blocks: [
        {
          type: "p",
          text: "La risposta breve: un CV accademico è lungo quanto lo giustifica il proprio percorso, e cresce nel corso della carriera. A differenza di un résumé, non è previsto che si adatti a una o due pagine. La lunghezza dipende però dallo stadio di carriera e dal contesto, e esistono eccezioni importanti.",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "Riferimenti orientativi per stadio di carriera",
        },
        {
          type: "ul",
          items: [
            "Candidati alla laurea magistrale / dottorato — circa 2–4 pagine.",
            "Dottorandi / postdoc — circa 3–6 pagine.",
            "Metà carriera — spesso 6–10+ pagine.",
            "Docenti senior — ben oltre le dieci pagine; la lunghezza è determinata dal curriculum di pubblicazioni e finanziamenti.",
          ],
        },
        {
          type: "p",
          text: "Questi sono orientamenti, non regole. Un CV di quattro pagine ben strutturato vale più di uno gonfiato di otto.",
        },
        {
          type: "h2",
          id: "capped",
          text: "Quando la lunghezza è limitata",
        },
        {
          type: "p",
          text: "Molti enti finanziatori e datori di lavoro richiedono un «CV breve» con un limite di pagine preciso (spesso due pagine), oppure un formato narrativo strutturato come il NIH biosketch, il Résumé for Research and Innovation (R4RI) di UKRI, un CV ERC o il formato SNSF svizzero. Quando un bando specifica una lunghezza o un formato, seguirlo scrupolosamente — superare il limite può comportare il rigetto della domanda senza esame.",
        },
        {
          type: "h2",
          id: "quality",
          text: "Più lungo non significa migliore",
        },
        {
          type: "p",
          text: "La completezza è attesa, ma il gonfiaggio non lo è. Includere ciò che è rilevante, ordinarlo in modo che il materiale più forte sia facile da trovare e tagliare il superfluo. I revisori premiano la chiarezza e la pertinenza, non il numero di pagine.",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "Mantenere un CV principale, esportare versioni più brevi",
        },
        {
          type: "p",
          text: "L'approccio pratico consiste nel mantenere un unico CV completo «principale» e ricavarne versioni più brevi o specifiche per enti finanziatori. SigmaCV lo fa a partire da un unico registro canonico: tenere tutto in un unico luogo, quindi applicare un layout a un clic (NIH, NSF, ERC, UKRI R4RI e altri) o ridurre le sezioni per un bando specifico, in modo reversibile, ed esportare.",
        },
        {
          type: "cta",
          label: "Genera gratuitamente il tuo CV accademico",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Esiste un limite di pagine per un curriculum vitae accademico?",
          a: "In genere no — un CV accademico completo è lungo quanto lo giustifica il proprio percorso. L'eccezione sono i «CV brevi» per enti finanziatori o candidature, che spesso fissano un limite di lunghezza o richiedono un formato narrativo; seguire sempre le istruzioni del bando.",
        },
        {
          q: "Quanto deve essere lungo il CV per una candidatura al dottorato?",
          a: "Di solito circa 2–4 pagine. In questa fase, un'esperienza di ricerca chiara e alcuni output rappresentativi contano più della lunghezza.",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "Curriculum vitae accademico per le candidature alla scuola di dottorato",
      description:
        "Cosa inserire in un curriculum vitae accademico per candidature a lauree magistrali, dottorati o scuole di specializzazione quando non si hanno ancora molte pubblicazioni — e come fare una buona impressione su una commissione di ammissione.",
      blocks: [
        {
          type: "p",
          text: "Se si sta facendo domanda per un programma di laurea magistrale o dottorato e si teme che il proprio CV sembri scarno, è del tutto normale — le commissioni di ammissione non si aspettano una lunga lista di pubblicazioni in questa fase. Cercano evidenze di potenziale: esperienza di ricerca, competenze pertinenti e una traiettoria chiara. Ecco cosa includere e come presentarlo.",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "Cosa includere",
        },
        {
          type: "ul",
          items: [
            "Formazione — titoli di studio, istituzioni, date e GPA o voto finale se è elevato; includere il titolo della tesi o del progetto finale.",
            "Esperienza di ricerca — laboratori, progetti e tesi, con il proprio ruolo, i metodi utilizzati e i risultati ottenuti.",
            "Pubblicazioni e presentazioni — eventuali articoli, preprint, poster o comunicazioni a congressi, anche nelle fasi più iniziali.",
            "Competenze — laboratoriali, tecniche, statistiche, informatiche e linguistiche rilevanti per il campo.",
            "Premi e borse di studio — distinzioni accademiche e finanziamenti.",
            "Esperienze rilevanti — didattica, tutoraggio, esperienze lavorative rilevanti o volontariato.",
            "Referenze — oppure una nota che indica che sono disponibili su richiesta.",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "Dare risalto all'esperienza di ricerca",
        },
        {
          type: "p",
          text: "Anche in assenza di pubblicazioni, l'esperienza di ricerca è il punto di forza principale. Per ogni progetto, descrivere la domanda di ricerca, cosa si è fatto (tecniche, analisi, ruolo specifico) e i risultati ottenuti. I contributi concreti trasmettono molto più di un elenco di nomi di corsi.",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "Lunghezza e formato",
        },
        {
          type: "p",
          text: "Un CV per una candidatura universitaria ha solitamente 2–4 pagine. Mantenere la formattazione pulita e coerente, utilizzare intestazioni di sezione chiare e adattare l'enfasi al programma a cui si fa domanda. È accettabile essere brevi — non gonfiare il documento.",
        },
        {
          type: "h2",
          id: "build",
          text: "Costruirlo a partire dal proprio percorso",
        },
        {
          type: "p",
          text: "SigmaCV assembla un CV accademico curato a partire dal tuo profilo ORCID e dai dati aperti, in modo che anche le prime pubblicazioni, i preprint e i poster siano formattati in modo corretto e coerente — ed è possibile aggiungere qualsiasi opera tramite DOI. È gratuito e open source.",
        },
        {
          type: "cta",
          label: "Genera gratuitamente il tuo CV per la scuola di dottorato",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Servono pubblicazioni per un CV di candidatura al dottorato?",
          a: "No. In questa fase, l'esperienza di ricerca, le competenze pertinenti e una traiettoria chiara contano più di una lista di pubblicazioni. Includere eventuali preprint o poster, ma la loro assenza è del tutto normale.",
        },
        {
          q: "Quanto deve essere lungo il CV per una candidatura universitaria?",
          a: "Tipicamente 2–4 pagine. Mantenerlo focalizzato: un'esperienza di ricerca chiara e alcuni elementi rappresentativi valgono più del gonfiaggio.",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title:
        "Usare le metriche in modo responsabile nel CV accademico (DORA e il Leiden Manifesto)",
      description:
        "Come presentare le metriche di ricerca in un CV in modo responsabile: perché il Journal Impact Factor e l'h-index possono trarre in inganno, cosa aggiungono gli indicatori field-normalized, e cosa raccomandano DORA e il Leiden Manifesto.",
      blocks: [
        {
          type: "p",
          text: "Le metriche sono una scorciatoia allettante nel CV, ma si prestano facilmente a un uso improprio — e le commissioni si aspettano sempre più che i ricercatori le utilizzino in modo responsabile. Questa guida spiega quali metriche possono trarre in inganno, quali sono più difendibili e cosa raccomandano i principali framework per la valutazione responsabile della ricerca.",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "Perché il Journal Impact Factor è lo strumento sbagliato",
        },
        {
          type: "p",
          text: "Il Journal Impact Factor (JIF) misura le citazioni medie di una rivista, non la qualità o l'impatto del singolo articolo. Le distribuzioni delle citazioni sono fortemente asimmetriche, quindi la presenza di un singolo articolo in una rivista ad alto JIF dice quasi nulla su quell'articolo. DORA — la San Francisco Declaration on Research Assessment — sconsiglia esplicitamente l'utilizzo del JIF per valutare la ricerca individuale o i singoli ricercatori.",
        },
        {
          type: "h2",
          id: "h-index",
          text: "L'h-index e i conteggi assoluti hanno limiti",
        },
        {
          type: "p",
          text: "L'h-index e i conteggi assoluti di citazioni dipendono fortemente dal campo disciplinare e dalla durata della carriera, quindi non sono confrontabili tra discipline e penalizzano i ricercatori nelle prime fasi della carriera. Possono inoltre essere gonfiati artificialmente. Se si decide di includerli, fornire il contesto; non presentarli mai come misura autonoma del valore.",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "Privilegiare gli indicatori field-normalized",
        },
        {
          type: "p",
          text: "Gli indicatori field-normalized — come il Field-Weighted Citation Impact (FWCI) o il NIH iCite Relative Citation Ratio (RCR) — tengono conto delle differenze nei tassi di citazione tra campi disciplinari e nel tempo, risultando più confrontabili dei conteggi assoluti. Rimangono comunque imperfetti e vanno letti nel contesto, mai come unico segnale.",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "Cosa raccomandano DORA e il Leiden Manifesto",
        },
        {
          type: "ul",
          items: [
            "DORA — non utilizzare metriche basate sulle riviste (come il JIF) per valutare i contributi individuali; valutare la ricerca per i suoi meriti intrinseci.",
            "Il Leiden Manifesto — utilizzare gli indicatori quantitativi a supporto, e non in sostituzione, del giudizio esperto; tenere conto delle differenze tra campi; mantenere la trasparenza su dati e metodi; evitare la concretezza fuori luogo.",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "Consigli pratici per il CV",
        },
        {
          type: "ul",
          items: [
            "Dare risalto all'opera in sé — cosa si è fatto e perché è importante — non ai numeri.",
            "Se si includono metriche, privilegiare gli indicatori field-normalized e fornire il contesto (campo, finestra temporale, percentile).",
            "Considerare una breve descrizione narrativa dei propri contributi principali, in alternativa ai numeri o in loro accompagnamento.",
            "Non citare mai il Journal Impact Factor delle riviste in cui sono apparsi i propri articoli.",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Metriche responsabili, per impostazione predefinita",
        },
        {
          type: "p",
          text: "SigmaCV è costruito intorno a questa posizione: le metriche sono disattivate per impostazione predefinita e attivabili su scelta dell'utente, privilegia gli indicatori field-normalized rispetto ai conteggi assoluti e non mostra mai un Journal Impact Factor — in linea con DORA. L'utente mantiene il pieno controllo su quali metriche, se presenti, compaiono nel proprio CV.",
        },
        {
          type: "cta",
          label: "Genera gratuitamente un CV allineato a DORA",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Devo inserire il mio h-index nel CV?",
          a: "È facoltativo e dipende dalla disciplina. Se lo si include, fornire il contesto e affiancarlo a indicatori field-normalized anziché presentarlo da solo; molte commissioni scoraggiano la dipendenza eccessiva da esso.",
        },
        {
          q: "È appropriato elencare i Journal Impact Factor nel CV?",
          a: "È sconsigliato. DORA raccomanda specificamente di non utilizzare il Journal Impact Factor per valutare la ricerca individuale, perché misura la rivista, non l'articolo.",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "Il formato del curriculum vitae accademico per paese",
      description:
        "Come variano le convenzioni del CV accademico da paese a paese — la distinzione CV/résumé, foto e dati personali, lunghezza, Europass e formati narrativi degli enti finanziatori — e come adattare il proprio.",
      blocks: [
        {
          type: "p",
          text: "Non esiste uno standard globale unico per il curriculum vitae accademico. Le convenzioni variano a seconda del paese e dell'istituzione — come viene denominato il documento, se include una foto, la lunghezza attesa e quale formato strutturato richiede un ente finanziatore. Questa guida illustra le principali differenze e come adattare il proprio CV al contesto di candidatura.",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "La distinzione CV / résumé varia",
        },
        {
          type: "p",
          text: "Negli Stati Uniti e in Canada, il «CV» accademico è il documento scientifico lungo e completo, mentre il «résumé» è la versione breve di una o due pagine per l'industria. Nel Regno Unito e in gran parte d'Europa, il termine «CV» può indicare entrambi, e la versione accademica è semplicemente intesa dal contesto. Adeguarsi al termine e alla lunghezza attesi dal paese e dal ruolo a cui si fa domanda.",
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "Foto e dati personali",
        },
        {
          type: "p",
          text: "Questa è la differenza più marcata tra paesi. In alcune parti dell'Europa continentale, dell'Asia e dell'America Latina, può essere previsto che il CV includa una foto, la data di nascita o la nazionalità. Negli USA e nel Regno Unito questi elementi vengono deliberatamente omessi per ridurre i pregiudizi, e la loro inclusione può ritorcersi contro il candidato. In caso di dubbio, seguire la norma del paese di destinazione — e non includere mai dati personali che un determinato datore di lavoro abbia espressamente richiesto di omettere.",
        },
        {
          type: "h2",
          id: "length",
          text: "Aspettative sulla lunghezza",
        },
        {
          type: "p",
          text: "Un CV accademico completo non ha un limite fisso di pagine e cresce con il proprio percorso, ma le aspettative variano: alcune candidature europee prediligono un CV più conciso, mentre i CV accademici statunitensi sono spesso esaustivi. Attenersi sempre a un limite di pagine esplicito quando un bando o un datore di lavoro lo specifica.",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass e formati strutturati",
        },
        {
          type: "p",
          text: "Nell'Unione Europea, il CV Europass è un modello strutturato diffuso, e alcune istituzioni lo richiedono. Diversi paesi e sistemi hanno i propri layout attesi. Quando è richiesto un formato strutturato, seguirlo scrupolosamente anziché presentare un CV in formato libero.",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "CV narrativi degli enti finanziatori per area geografica",
        },
        {
          type: "p",
          text: "I principali enti finanziatori richiedono sempre più spesso formati propri: il Résumé for Research and Innovation (R4RI) di UKRI nel Regno Unito, il CV ERC nell'UE, il formato SNSF in Svizzera e il NIH biosketch o il formato NSF negli USA. Questi sono narrativi o fortemente strutturati e differiscono da un CV standard — prepararli a partire dal proprio record completo per ogni candidatura.",
        },
        {
          type: "h2",
          id: "adapt",
          text: "Come adattare il proprio CV",
        },
        {
          type: "p",
          text: "Mantenere un CV completo e canonico e ricavarne versioni specifiche per paese o ente finanziatore, anziché gestire diversi documenti separati. SigmaCV costruisce quel CV canonico a partire dal proprio record di ricerca aperto e applica layout per enti finanziatori a un clic (UKRI R4RI, ERC, SNSF, NIH, NSF e altri) in modo reversibile, così adattarsi alle aspettative di un paese è una modifica rapida, non una riscrittura.",
        },
        {
          type: "cta",
          label: "Genera gratuitamente il tuo CV accademico",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Devo inserire una foto nel mio CV accademico?",
          a: "Dipende dal paese. In alcuni paesi si prevede una foto e dati personali; la norma accademica negli USA e nel Regno Unito è di ometterli per ridurre i pregiudizi. Seguire la convenzione del paese a cui si fa domanda.",
        },
        {
          q: "Un CV accademico è uguale ovunque?",
          a: "No. Il termine, la lunghezza attesa, l'inclusione di dati personali e i formati richiesti dagli enti finanziatori variano a seconda del paese. Adattare il CV al paese e all'istituzione di destinazione.",
        },
      ],
    },
  },
  "ko-KR": {
    "how-to-write-an-academic-cv": {
      title: "학술 CV 작성 방법",
      description:
        "학술 CV 작성을 위한 실용 가이드: 포함할 내용, 각 섹션의 순서와 형식, 적정 분량, 논문 목록 작성 방법, 그리고 경력 단계 및 국가에 따른 관례 차이.",
      blocks: [
        {
          type: "p",
          text: "학술 CV(curriculum vitae)는 연구직·교수직 지원, 대학원 프로그램, 펠로십, 연구비 신청의 표준 서류입니다. 1~2페이지 분량의 이력서와 달리, 학술 CV는 교육, 논문, 연구비, 강의, 봉사 활동 등 학술적 삶의 완전하고 발전하는 기록이며, 경력 내내 계속 확장됩니다.",
        },
        {
          type: "p",
          text: "이 가이드는 포함할 내용, 각 섹션의 순서와 형식, 학술 CV의 적정 분량, 논문 목록 작성 방법, 그리고 경력 단계 및 국가에 따른 관례 차이를 다룹니다. 직접 작성하기를 원하지 않는다면 ORCID 기록에서 자동으로 생성할 수도 있습니다 — 마지막 섹션을 참조하십시오.",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "학술 CV란 무엇입니까?",
        },
        {
          type: "p",
          text: "CV는 포괄적인 학술 전기입니다. 고용위원회, 연구비 지원 기관, 입학사정위원회가 귀하의 이력을 평가할 수 있도록 학술적 기여의 전체 범위를 문서화하는 것이 CV의 역할입니다. 이력서가 특정 직무에 맞춰 간추려지는 것과 달리, 학술 CV는 철저하고 누적적입니다. 시간이 지남에 따라 내용을 추가하되 거의 삭제하지 않습니다.",
        },
        {
          type: "p",
          text: "전문가들이 읽는 문서이므로, 학술 CV는 간결함보다 완전성과 정확성을 중시합니다. 명확한 구조, 일관된 형식, 올바르게 형식화된 인용이 시각적 화려함보다 중요합니다.",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "포함할 내용: 핵심 섹션",
        },
        {
          type: "p",
          text: "대부분의 학술 CV는 동일한 구성 요소로 이루어집니다. 귀하의 분야와 경력 단계에 맞는 섹션을 포함하고, 아직 채울 내용이 없는 섹션은 생략하십시오:",
        },
        {
          type: "ul",
          items: [
            "헤더 — 이름, 현재 직위, 전문적 연락처(ORCID iD 포함).",
            "연구 관심사 / 요약 — 연구를 소개하는 몇 줄(선택 사항으로, 경력 초기에 더 일반적).",
            "학력 — 역연대순으로 정렬된 학위, 기관, 기간, 논문 제목 포함.",
            "직위 / 경력 — 학술 및 관련 전문 직위.",
            "논문 — 대부분의 연구직에서 핵심 항목(아래 참조).",
            "연구비 및 지원 — 지원 기관, 제목, 금액, 기간이 포함된 수주 연구비.",
            "수상 및 영예 — 펠로십, 상, 표창.",
            "강의 — 담당 과목, 특강, 강의 역할.",
            "지도 및 멘토링 — 지도한 학생 및 연구생.",
            "발표 — 초청 강연, 학술대회 논문, 포스터.",
            "봉사 — 동료 심사, 편집 역할, 위원회, 사회 기여.",
            "전문 단체 회원, 역량, 참고인 — 분야에 따라 관련성 있는 항목.",
          ],
        },
        {
          type: "h3",
          text: "섹션 순서 정하기",
        },
        {
          type: "p",
          text: "헤더, 학력, 직위 다음에는 지원하는 직무에서 가장 강점이 되는 항목을 앞에 배치하십시오. 연구 중심의 직위와 연구비의 경우 논문과 연구비를 상위에, 강의 중심의 역할에는 강의와 지도를 앞에 놓으십시오. 내용을 만들어내거나 부풀리지 않고 독자를 고려하여 순서를 조정하십시오.",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "논문 목록 작성 방법",
        },
        {
          type: "p",
          text: "논문 목록은 대부분의 위원회가 가장 많은 시간을 할애하는 부분이므로, 쉽게 훑어볼 수 있고 오독이 불가능하도록 작성하십시오:",
        },
        {
          type: "ul",
          items: [
            "역연대순으로 저작물을 나열하고, 필요에 따라 유형별(학술지 논문, 프리프린트, 단행본 챕터, 학술대회 논문, 데이터셋, 소프트웨어)로 그룹화합니다.",
            "전체에 걸쳐 하나의 일관된 인용 스타일을 사용하고, CV의 모든 버전에서 동일하게 유지합니다.",
            "각 저자 목록에서 귀하의 이름을 강조 표시하여 기여도를 한눈에 파악할 수 있게 합니다.",
            "독자가 저작물을 찾을 수 있도록 DOI(및 링크)를 포함합니다.",
            "심사 중, 인쇄 중, 또는 프리프린트인 저작물을 명확하고 솔직하게 표시합니다.",
            "목록을 부풀리지 마십시오 — 질과 관련성이 양보다 더 좋은 인상을 줍니다.",
          ],
        },
        {
          type: "p",
          text: "일관성은 가장 흔한 실패 지점입니다. 단일 인용 스타일로 — Citation Style Language(CSL)는 Zotero 같은 도구 이면의 표준입니다 — 모든 참고문헌을 형식화하면 Word, PDF, LaTeX CV가 모두 동일하게 표시됩니다.",
        },
        {
          type: "h2",
          id: "how-long",
          text: "학술 CV의 적정 분량은?",
        },
        {
          type: "p",
          text: "정해진 페이지 제한은 없습니다. 학술 CV는 귀하의 이력이 정당화하는 만큼 길며, 시간이 지남에 따라 증가합니다. 대략적인 기준으로: 석사 또는 박사 지원자는 2~4페이지, 박사후 연구원은 3~6페이지, 시니어 교수는 10페이지를 훨씬 넘기도 합니다. 예외는 연구비 기관과 채용의 '단축 CV'로, 흔히 분량을 제한(예: 2페이지)하거나 NIH biosketch, UKRI의 연구·혁신을 위한 이력서(R4RI), ERC CV 같은 서술형 형식을 사용합니다. 공모 요강에 형식이나 페이지 제한이 명시된 경우 정확히 따르십시오.",
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "경력 단계별 맞춤 작성",
        },
        {
          type: "ul",
          items: [
            "학부생 및 대학원 지원자 — 학력, 논문 또는 연구 프로젝트, 논문 발표 또는 학술 발표 이력, 관련 역량, 참고인을 강조합니다. 짧아도 괜찮습니다.",
            "박사과정생 및 박사후 연구원 — 논문, 학술대회 활동, 연구비·펠로십, 강의를 앞세웁니다. 지속적인 채용 및 연구비 마감에 대비해 최신 상태를 유지하십시오.",
            "교수 및 주임 연구자 — 연구비, 논문, 지도, 봉사·리더십을 전면에 배치합니다. 긴 섹션별 문서와 연구비 기관을 위한 별도 단축 CV를 준비하십시오.",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "형식 및 국가별 차이",
        },
        {
          type: "p",
          text: "관례는 다양합니다. 미국과 캐나다에서 학술 'CV'는 긴 학술 문서를 의미하며('이력서'가 짧은 산업체용 버전), 유럽 대부분에서는 'CV'가 두 가지 모두를 의미할 수 있습니다. 일부 국가에서는 사진, 생년월일, 또는 국적을 요구하지만, 많은 국가 — 특히 미국·영국의 학술 환경 — 에서는 편견을 줄이기 위해 개인 정보를 의도적으로 생략합니다. 유럽 지원자들은 때때로 Europass 형식을 사용하며, 주요 연구비 기관들은 점점 더 고유한 서술형 CV를 요구합니다. 확신이 없을 때는 지원하는 국가와 기관의 관례를 따르십시오.",
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "피해야 할 일반적인 실수",
        },
        {
          type: "ul",
          items: [
            "하나의 문서에서 일관성 없는 형식 사용 또는 여러 인용 스타일 혼용.",
            "논문 목록 부풀리기 또는 가장 중요한 저작물 묻기.",
            "지원 사이에 CV를 최신화하지 않기.",
            "공모 요강의 필수 형식이나 페이지 제한 무시.",
            "논문 귀속에 이름 매칭 의존 — 흔한 이름과 비라틴 문자 이름은 타인의 저작물과 혼동되기 쉽습니다.",
            "오탈자 및 깨진 링크 — 교정하고 모든 DOI가 작동하는지 확인하십시오.",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "학술 CV 자동 생성하기",
        },
        {
          type: "p",
          text: "학술 CV를 최신 상태로 유지하는 것은 반복적이고 수동적인 작업입니다. SigmaCV(무료 오픈소스)는 귀하의 ORCID 및 OpenAlex 기록에서 — 이름이 아닌 식별자로 저작물을 매칭하여 — 자동으로 CV를 생성하고, 모든 인용을 일관되게 형식화하며, PDF, Word, LaTeX, Markdown, BibTeX 또는 자동으로 재동기화되는 공개 페이지로 내보냅니다. 지표는 기본적으로 비활성화되어 있고 DORA에 부합하는 분야 정규화 방식을 채택하며, 귀하의 데이터는 귀하의 것으로 유지됩니다(필드별 동의, 내보내기, 삭제).",
        },
        {
          type: "cta",
          label: "학술 CV 무료로 만들기",
          href: "/",
        },
      ],
      faq: [
        {
          q: "학술 CV의 적정 분량은 얼마입니까?",
          a: "정해진 제한은 없으며, 귀하의 이력과 함께 증가합니다. 박사 지원자는 대개 2~4페이지, 박사후 연구원은 3~6페이지, 시니어 학자는 더 길어집니다. 연구비·채용 '단축 CV'는 분량을 제한하거나 서술형 형식을 요구할 수 있습니다(예: NIH biosketch, UKRI R4RI, ERC). 항상 공모 요강의 규정을 따르십시오.",
        },
        {
          q: "학술 CV와 이력서의 차이는 무엇입니까?",
          a: "학술 CV는 학술적 삶(학력, 논문, 연구비, 강의, 봉사)의 완전하고 누적적인 기록이며 여러 페이지에 달할 수 있습니다. 이력서는 비학술직을 위한 간략하고 맞춤화된 1~2페이지 문서입니다.",
        },
        {
          q: "학술 CV에 논문을 어떻게 기재해야 합니까?",
          a: "역연대순으로, 필요에 따라 유형별로 그룹화하여, 하나의 일관된 인용 스타일로, 귀하의 이름을 강조 표시하고 DOI를 포함하여 나열하십시오. 프리프린트와 심사 중인 저작물을 명확히 표시하고 목록을 부풀리지 마십시오.",
        },
        {
          q: "학술 CV를 자동으로 생성할 수 있습니까?",
          a: "예. SigmaCV는 귀하의 ORCID 및 OpenAlex 기록에서(이름이 아닌 식별자로 매칭) 학술 CV를 생성하고, 인용을 형식화하며, PDF, DOCX, LaTeX, Markdown 또는 BibTeX로 내보냅니다 — 무료 오픈소스입니다.",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "학술 CV 대 이력서: 차이는 무엇입니까?",
      description:
        "학술 CV와 이력서 — 분량, 범위, 목적의 차이, 그리고 학술직 지원, 대학원 지원, 연구비 신청, 산업체 역할에서 어느 것을 사용해야 하는지.",
      blocks: [
        {
          type: "p",
          text: "'CV'와 '이력서'는 흔히 같은 의미로 사용되지만, 학계에서는 서로 다른 용도를 가진 별개의 문서입니다. 올바른 서류를 선택하고 적절히 형식화하는 것은 학술직, 펠로십, 연구비 신청에서 중요합니다.",
        },
        {
          type: "p",
          text: "학술 CV(curriculum vitae)는 학술적 삶의 완전하고 누적적인 기록입니다: 학력, 논문, 연구비, 강의, 발표, 봉사. 이력서는 특정 비학술 직무를 겨냥한 짧고 고도로 맞춤화된 요약 — 보통 1~2페이지 — 입니다.",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "핵심 차이점",
        },
        {
          type: "ul",
          items: [
            "분량 — CV는 정해진 제한 없이 증가합니다(흔히 여러 페이지). 이력서는 1~2페이지로 압축됩니다.",
            "범위 — CV는 귀하의 학술 활동에 관련된 모든 것을 문서화합니다. 이력서는 목표 직무에 관련된 내용만 포함합니다.",
            "독자 — CV는 학술 동료와 위원회가 읽습니다. 이력서는 채용 담당자와 인사 관리자가 읽습니다.",
            "안정성 — CV는 시간이 지남에 따라 내용을 추가하되 거의 삭제하지 않습니다. 이력서는 각 지원마다 다시 작성합니다.",
            "논문 및 연구비 — CV의 핵심 항목. 이력서에서는 보통 요약되거나 생략됩니다.",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "어느 것을 사용해야 합니까?",
        },
        {
          type: "ul",
          items: [
            "학술직, 박사후 연구원직, 박사·대학원 지원, 펠로십, 연구비 → 학술 CV.",
            "산업체 및 대부분의 비학술 역할 → 공고에 맞춤화된 이력서.",
            "'대안적 학술(alt-ac)' 및 연구 인접 산업 역할 → 흔히 하이브리드: 관련 연구 성과물을 여전히 강조하는 이력서 분량의 문서.",
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "CV를 이력서로 전환하기",
        },
        {
          type: "p",
          text: "학술 CV를 이력서로 바꾸려면, 짧은 요약으로 시작하고, 가장 관련성 높은 경험과 몇 가지 대표적인 성과물만 유지하며, 학술적 성취를 영향력과 이전 가능한 역량으로 표현하고, 1~2페이지로 압축하십시오. 완전한 CV를 마스터 기록으로 유지하고 그로부터 더 짧은 문서를 도출하십시오.",
        },
        {
          type: "h2",
          id: "build-either",
          text: "연구 기록에서 두 가지 모두 만들기",
        },
        {
          type: "p",
          text: "SigmaCV는 귀하의 ORCID 및 OpenAlex 기록에서 학술 CV를 생성하고 다양한 형식과 원클릭 레이아웃으로 내보냅니다 — 하나의 표준 기록을 유지하면서 각 지원에 필요한 버전을 만들 수 있습니다. 무료, 오픈소스, 개인정보 우선입니다.",
        },
        {
          type: "cta",
          label: "학술 CV 무료로 만들기",
          href: "/",
        },
      ],
      faq: [
        {
          q: "CV와 이력서는 같습니까?",
          a: "학계에서는 다릅니다. 학술 CV는 학술 활동의 길고 완전한 기록이며, 이력서는 비학술 역할을 위한 짧고 맞춤화된 1~2페이지 문서입니다. 학계 밖에서, 그리고 일부 국가에서는 두 용어가 더 느슨하게 사용됩니다.",
        },
        {
          q: "학술 CV에 사진이 필요합니까?",
          a: "국가에 따라 다릅니다. 일부 국가에서는 사진과 개인 정보를 요구하지만, 많은 학술 환경(특히 미국과 영국)에서는 편견을 줄이기 위해 의도적으로 생략합니다. 지원하는 곳의 관례를 따르십시오.",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "학술 CV에 논문 목록 작성 방법",
      description:
        "학술 CV의 논문 섹션 형식화 및 순서 정하기: 인용 스타일, 유형별 그룹화, 저자 순서, 자신의 이름 강조, 프리프린트 및 심사 중인 저작물 처리, 그리고 피해야 할 사항.",
      blocks: [
        {
          type: "p",
          text: "대부분의 학술직에서 논문 섹션은 위원회가 가장 면밀히 읽는 CV 부분이므로, 제시 방식이 내용만큼이나 중요합니다. 이 가이드는 인용 스타일, 순서 및 그룹화, 자신의 기여를 명확히 하는 방법, 프리프린트 및 심사 중인 저작물 처리, 그리고 탄탄한 목록을 약화시키는 실수를 다룹니다.",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "하나의 인용 스타일 선택 — 그리고 유지하기",
        },
        {
          type: "p",
          text: "귀하의 분야에 적합한 인용 스타일(예: APA, Vancouver, Chicago, IEEE)을 선택하고 모든 항목에 적용하십시오. 가장 흔한 실수는 스타일을 혼용하거나 참고문헌을 수동으로 형식화하여 모든 항목이 조금씩 다르게 보이는 것입니다. 하나의 엔진 — Citation Style Language(CSL), Zotero 같은 참고문헌 관리 도구 이면의 표준 — 으로 전체 목록을 형식화하면 PDF, Word, LaTeX CV 전반의 일관성이 보장됩니다.",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "논문 순서 및 그룹화",
        },
        {
          type: "ul",
          items: [
            "역연대순(최신순)으로 저작물을 나열합니다.",
            "목록이 길 경우 유형별로 그룹화합니다: 동료 심사 학술지 논문, 프리프린트, 단행본 챕터, 학술대회 논문, 데이터셋 및 소프트웨어.",
            "독자가 동료 심사 저작물을 즉시 찾을 수 있도록 그룹을 명확히 레이블링하고 구분합니다.",
            "번호 매기기에 일관성을 유지합니다 — 모든 항목에 번호를 매기거나 전혀 매기지 않습니다.",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "자신의 기여를 명확히 하기",
        },
        {
          type: "ul",
          items: [
            "모든 저자 목록에서 귀하의 이름을 강조 표시합니다(예: 굵게).",
            "제1저자, 교신저자, 동등 기여 역할을 명확하고 설명이 포함된 표기로 나타냅니다.",
            "저자 순서 관례가 분야마다 다르다는 점을 기억하십시오 — 귀하 분야의 관례가 명확하지 않다면 한 줄의 주석을 추가하십시오.",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "프리프린트, 심사 중, 인쇄 중인 저작물",
        },
        {
          type: "p",
          text: "저작물의 상태를 솔직하게 기재하십시오. 프리프린트는 CV에서 점점 더 인정받고 있지만 프리프린트임을 표시해야 하며, '심사 중' 또는 '인쇄 중'인 항목도 명시해야 합니다. 동료 심사를 받지 않은 저작물을 동료 심사된 것처럼 제시해서는 안 되며, 동일한 논문을 프리프린트와 게재 버전으로 두 번 기재할 경우 두 항목의 관계를 명확히 해야 합니다.",
        },
        {
          type: "h2",
          id: "identifiers",
          text: "식별자 및 링크 포함하기",
        },
        {
          type: "p",
          text: "독자가 저작물을 찾을 수 있도록 각 저작물에 DOI(및 링크)를 추가하고, 헤더에 ORCID iD를 넣으십시오. 식별자를 사용하면 도구가 귀하의 저자 권한을 이름이 아닌 식별자로 신뢰성 있게 확인할 수 있습니다. 이는 흔한 이름이나 비라틴 문자 이름을 가진 연구자에게 특히 중요합니다.",
        },
        {
          type: "h2",
          id: "avoid",
          text: "피해야 할 사항",
        },
        {
          type: "ul",
          items: [
            "하나의 문서에서 인용 스타일 혼용.",
            "사소하거나 관련 없는 항목으로 목록 부풀리기.",
            "항목 간에 귀하 자신의 이름을 일관되지 않게 표기.",
            "깨진 또는 누락된 DOI — 모든 링크가 작동하는지 확인하십시오.",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "형식화된 논문 목록 자동 생성하기",
        },
        {
          type: "p",
          text: "SigmaCV는 ORCID 및 OpenAlex에서 귀하의 논문을 가져와(이름이 아닌 식별자로 매칭), 귀하의 이름을 강조 표시하여 어떤 CSL 스타일로든 형식화하고, 목록을 PDF, Word, LaTeX, Markdown 또는 BibTeX로 내보냅니다 — CV의 모든 버전이 일관되고 정확하게 유지됩니다.",
        },
        {
          type: "cta",
          label: "논문 목록 무료로 생성하기",
          href: "/",
        },
      ],
      faq: [
        {
          q: "CV의 논문에 어떤 인용 스타일을 사용해야 합니까?",
          a: "귀하의 분야에서 표준적인 스타일을 사용하십시오(예: APA, Vancouver, Chicago, IEEE). 가장 중요한 것은 전체 목록 및 CV의 모든 형식에 걸쳐 하나의 스타일을 일관되게 적용하는 것입니다.",
        },
        {
          q: "프리프린트를 CV에 포함해야 합니까?",
          a: "예 — 프리프린트는 점점 더 인정받고 있습니다 — 다만 프리프린트임을 명확히 표시하고 동료 심사 논문과 구분하여 기재하십시오.",
        },
        {
          q: "공동 제1저자 또는 동등 기여를 어떻게 표시합니까?",
          a: "관련 저자에게 기호를 표시하고 짧은 범례로 설명하십시오(예: '* 동등 기여'). 목록 전체에 걸쳐 일관성을 유지하십시오.",
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "학술 CV의 적정 분량은?",
      description:
        "경력 단계별 학술 CV의 적정 분량, 분량이 제한되는 경우(연구비 기관 및 채용 단축 CV), 긴 것이 반드시 좋지 않은 이유 — 그리고 하나의 마스터 CV를 유지하면서 더 짧은 버전을 내보내는 방법.",
      blocks: [
        {
          type: "p",
          text: "간단한 답변: 학술 CV는 귀하의 이력이 정당화하는 만큼 길며, 경력에 따라 증가합니다. 이력서와 달리 1~2페이지에 맞춰야 한다는 기대는 없습니다. 단, 분량은 경력 단계와 맥락에 따라 다르며, 중요한 예외가 있습니다.",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "경력 단계별 대략적 기준",
        },
        {
          type: "ul",
          items: [
            "석사 / 박사 지원자 — 대략 2~4페이지.",
            "박사과정생 / 박사후 연구원 — 대략 3~6페이지.",
            "중견 경력자 — 흔히 6~10페이지 이상.",
            "시니어 교수 — 10페이지를 훨씬 초과. 논문 및 연구비 이력이 분량을 결정합니다.",
          ],
        },
        {
          type: "p",
          text: "이것은 규칙이 아닌 지침입니다. 탄탄하고 잘 정리된 4페이지 CV가 내용을 부풀린 8페이지 CV보다 낫습니다.",
        },
        {
          type: "h2",
          id: "capped",
          text: "분량이 제한되는 경우",
        },
        {
          type: "p",
          text: "많은 연구비 기관과 고용주는 엄격한 페이지 제한(흔히 2페이지)이 있는 '단축 CV', 또는 NIH biosketch, UKRI의 연구·혁신을 위한 이력서(R4RI), ERC CV, 스위스 SNSF 형식과 같은 구조화된 서술형 형식을 요구합니다. 공모 요강에 분량이나 형식이 명시된 경우 정확히 따르십시오 — 제한을 초과하면 신청서가 검토 없이 반려될 수 있습니다.",
        },
        {
          type: "h2",
          id: "quality",
          text: "긴 것이 반드시 좋지는 않습니다",
        },
        {
          type: "p",
          text: "완전성은 기대되지만 내용 부풀리기는 그렇지 않습니다. 관련 내용을 포함하고, 강점이 잘 드러나도록 순서를 정하며, 불필요한 내용을 삭제하십시오. 심사위원들은 페이지 수가 아닌 명료성과 관련성을 높이 평가합니다.",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "마스터 CV 유지 및 더 짧은 버전 내보내기",
        },
        {
          type: "p",
          text: "실용적인 접근은 하나의 완전한 '마스터' CV를 유지하고 그로부터 더 짧거나 기관별 버전을 도출하는 것입니다. SigmaCV는 단일 표준 기록에서 이를 가능하게 합니다: 모든 내용을 한 곳에 유지하면서 원클릭 레이아웃(NIH, NSF, ERC, UKRI R4RI 등)을 적용하거나 특정 공모를 위해 섹션을 가역적으로 조정하고 내보낼 수 있습니다.",
        },
        {
          type: "cta",
          label: "학술 CV 무료로 만들기",
          href: "/",
        },
      ],
      faq: [
        {
          q: "학술 CV에 페이지 제한이 있습니까?",
          a: "일반적으로 없습니다 — 완전한 학술 CV는 귀하의 이력이 정당화하는 만큼 길어질 수 있습니다. 예외는 연구비·채용 '단축 CV'로, 흔히 분량을 제한하거나 서술형 형식을 요구합니다. 항상 공모 요강의 지침을 따르십시오.",
        },
        {
          q: "박사 지원 CV의 분량은 얼마가 적당합니까?",
          a: "보통 2~4페이지 정도입니다. 그 단계에서는 명확한 연구 경험과 몇 가지 대표적인 성과물이 분량보다 중요합니다.",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "대학원 지원을 위한 학술 CV",
      description:
        "아직 논문이 많지 않을 때 석사, 박사, 대학원 지원에서 학술 CV에 무엇을 기재할지 — 그리고 입학사정위원회에 강한 인상을 주는 방법.",
      blocks: [
        {
          type: "p",
          text: "석사 또는 박사 프로그램에 지원하면서 CV가 빈약하게 보인다고 걱정된다면, 그것은 완전히 정상입니다 — 입학사정위원회는 이 단계에서 긴 논문 목록을 기대하지 않습니다. 그들이 원하는 것은 잠재력의 증거: 연구 경험, 관련 역량, 명확한 방향성입니다. 포함할 내용과 제시 방법을 안내합니다.",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "포함할 내용",
        },
        {
          type: "ul",
          items: [
            "학력 — 학위, 기관, 기간, 우수한 경우 GPA 또는 성적. 논문 또는 졸업 프로젝트 제목 포함.",
            "연구 경험 — 연구실, 프로젝트, 논문, 역할·방법·성과 포함.",
            "논문 및 발표 — 초기 단계라도 논문, 프리프린트, 포스터, 학술대회 발표.",
            "역량 — 분야에 관련된 실험실, 기술, 통계, 프로그래밍, 언어 역량.",
            "수상 및 장학금 — 학술적 표창 및 지원.",
            "관련 경험 — 강의, 튜터링, 관련 업무 또는 자원봉사.",
            "참고인 — 또는 요청 시 제공 가능하다는 안내.",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "연구 경험 앞세우기",
        },
        {
          type: "p",
          text: "논문이 없더라도 연구 경험이 귀하의 가장 강력한 카드입니다. 각 프로젝트에서 연구 질문이 무엇이었는지, 귀하가 무엇을 했는지(기법, 분석, 귀하의 구체적 역할), 그리고 어떤 결과가 나왔는지를 기술하십시오. 구체적인 기여가 과목명 목록보다 훨씬 인상적입니다.",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "분량 및 형식",
        },
        {
          type: "p",
          text: "대학원 지원 CV는 보통 2~4페이지입니다. 형식을 깔끔하고 일관되게 유지하고, 명확한 섹션 제목을 사용하며, 지원하는 프로그램에 맞게 강조점을 조정하십시오. 짧아도 괜찮습니다 — 내용을 부풀리지 마십시오.",
        },
        {
          type: "h2",
          id: "build",
          text: "기록에서 만들기",
        },
        {
          type: "p",
          text: "SigmaCV는 귀하의 ORCID 및 공개 데이터에서 깔끔한 학술 CV를 구성하므로, 첫 논문, 프리프린트, 포스터도 올바르고 일관되게 형식화됩니다 — DOI로 직접 항목을 추가할 수도 있습니다. 무료 오픈소스입니다.",
        },
        {
          type: "cta",
          label: "대학원 지원 CV 무료로 만들기",
          href: "/",
        },
      ],
      faq: [
        {
          q: "대학원 지원 CV에 논문이 필요합니까?",
          a: "아닙니다. 지원 단계에서는 연구 경험, 관련 역량, 명확한 방향성이 논문 목록보다 중요합니다. 갖고 있는 프리프린트나 포스터가 있다면 포함하되, 없어도 당연한 것으로 이해됩니다.",
        },
        {
          q: "대학원 지원 CV의 분량은 얼마가 적당합니까?",
          a: "보통 2~4페이지입니다. 집중도를 유지하십시오: 명확한 연구 경험과 몇 가지 대표적인 항목이 내용 부풀리기보다 낫습니다.",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title: "학술 CV에서 지표의 책임감 있는 활용(DORA 및 Leiden Manifesto)",
      description:
        "CV에서 연구 지표를 책임감 있게 제시하는 방법: 저널 영향력 지수와 h-index가 왜 오해를 유발하는지, 분야 정규화 지표가 어떤 가치를 더하는지, 그리고 DORA와 Leiden Manifesto가 권고하는 것.",
      blocks: [
        {
          type: "p",
          text: "지표는 CV에서 매력적인 간편한 척도처럼 보이지만 쉽게 남용될 수 있으며, 위원회는 점점 더 연구자가 책임감 있게 사용하기를 기대합니다. 이 가이드는 어떤 지표가 오해를 유발하고, 어떤 지표가 더 신뢰할 수 있으며, 주요 책임 평가 프레임워크가 권고하는 내용을 설명합니다.",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "저널 영향력 지수가 잘못된 도구인 이유",
        },
        {
          type: "p",
          text: "저널 영향력 지수(JIF)는 저널의 평균 인용 수를 측정하는 것이지, 귀하의 개별 논문의 질이나 영향력을 측정하는 것이 아닙니다. 인용 분포는 크게 치우쳐 있으므로, 높은 JIF 저널의 논문 한 편이 독자에게 그 논문에 대해 거의 아무것도 말해주지 않습니다. DORA — 연구 평가에 관한 샌프란시스코 선언 — 는 개별 연구나 연구자를 평가하는 데 JIF를 사용하지 말 것을 명확히 권고합니다.",
        },
        {
          type: "h2",
          id: "h-index",
          text: "h-index와 단순 인용 수의 한계",
        },
        {
          type: "p",
          text: "h-index와 단순 인용 수는 분야와 경력 기간에 크게 의존하므로 학문 분야 간, 경력 단계 간 비교가 불가능하며 초기 경력 연구자에게 불이익을 줍니다. 또한 부풀려질 수 있습니다. 포함할 경우 맥락을 제공하되, 단독으로 가치를 평가하는 척도로 제시해서는 안 됩니다.",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "분야 정규화 지표 우선하기",
        },
        {
          type: "p",
          text: "분야 가중 인용 영향력(FWCI)이나 NIH iCite 상대적 인용 비율(RCR)과 같은 분야 정규화 지표는 분야 간, 시간에 따른 인용 빈도 차이를 고려하므로 단순 인용 수보다 비교 가능합니다. 그러나 이것도 불완전하며 단독 신호가 아닌 맥락과 함께 해석되어야 합니다.",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "DORA와 Leiden Manifesto가 권고하는 것",
        },
        {
          type: "ul",
          items: [
            "DORA — 개별 기여도를 평가하는 데 저널 기반 지표(JIF 등)를 사용하지 말 것. 연구 자체의 장점으로 평가하십시오.",
            "Leiden Manifesto — 정량적 지표를 전문가 판단을 지원하는 데 사용하되 대체하지 말 것. 분야 차이를 고려하고, 데이터와 방법을 투명하게 유지하며, 잘못된 구체성을 피할 것.",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "CV를 위한 실용적 조언",
        },
        {
          type: "ul",
          items: [
            "숫자가 아닌 연구 자체 — 무엇을 했고 왜 중요한지 — 를 앞세우십시오.",
            "지표를 포함할 경우 분야 정규화 지표를 선택하고 맥락(분야, 시간 범위, 백분위수)을 제공하십시오.",
            "숫자 대신, 또는 숫자와 함께 주요 기여에 대한 짧은 서술적 설명을 고려하십시오.",
            "귀하의 논문이 게재된 저널의 영향력 지수를 인용하지 마십시오.",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "기본적으로 책임감 있는 지표",
        },
        {
          type: "p",
          text: "SigmaCV는 이 입장을 중심으로 구축되었습니다: 지표는 기본적으로 비활성화되어 선택 제공 방식이며, 단순 인용 수보다 분야 정규화 지표를 우선하고, 저널 영향력 지수는 절대 표시하지 않습니다 — DORA에 부합합니다. 어떤 지표도 CV에 표시할지 여부는 전적으로 귀하가 결정합니다.",
        },
        {
          type: "cta",
          label: "DORA에 부합하는 CV 무료로 만들기",
          href: "/",
        },
      ],
      faq: [
        {
          q: "h-index를 CV에 기재해야 합니까?",
          a: "선택 사항이며 분야에 따라 다릅니다. 포함할 경우 맥락을 제공하고 단독이 아닌 분야 정규화 지표와 함께 제시하십시오. 많은 위원회가 h-index에 과도하게 의존하는 것을 권장하지 않습니다.",
        },
        {
          q: "CV에 저널 영향력 지수를 기재해도 됩니까?",
          a: "권장되지 않습니다. DORA는 영향력 지수가 저널을 측정하는 것이지 귀하의 논문을 측정하는 것이 아니기 때문에, 개별 연구를 평가하는 데 저널 영향력 지수를 사용하지 말 것을 명확히 권고합니다.",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "국가별 학술 CV 형식",
      description:
        "국가별 학술 CV 관례 차이 — CV/이력서 구분, 사진과 개인 정보, 분량, Europass, 연구비 기관 서술형 형식 — 그리고 귀하의 CV를 어떻게 적응시킬지.",
      blocks: [
        {
          type: "p",
          text: "학술 CV에 대한 단일한 전 세계 표준은 없습니다. 문서의 명칭, 사진 포함 여부, 분량, 연구비 기관이 요구하는 구조화된 형식 등 관례가 국가와 기관마다 다릅니다. 이 가이드는 주요 차이점과 지원처에 맞게 CV를 조정하는 방법을 다룹니다.",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "CV / 이력서 구분의 차이",
        },
        {
          type: "p",
          text: "미국과 캐나다에서 학술 'CV'는 길고 완전한 학술 문서를 의미하며, '이력서'는 산업체용 짧은 1~2페이지 버전입니다. 영국과 유럽 대부분에서는 'CV'가 두 가지를 모두 의미할 수 있으며, 학술용은 맥락에서 이해됩니다. 지원하는 국가와 직위가 기대하는 용어와 분량을 따르십시오.",
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "사진 및 개인 정보",
        },
        {
          type: "p",
          text: "이것이 국가 간 가장 큰 차이점입니다. 대륙 유럽, 아시아, 라틴아메리카의 일부 국가에서는 CV에 사진, 생년월일, 국적을 포함하는 것이 기대될 수 있습니다. 미국과 영국에서는 편견을 줄이기 위해 의도적으로 생략하며, 포함하면 오히려 불이익을 줄 수 있습니다. 확신이 없을 때는 목적지 국가의 관례를 따르십시오 — 그리고 특정 고용주가 제외할 것을 요청한 개인 정보는 절대 포함하지 마십시오.",
        },
        {
          type: "h2",
          id: "length",
          text: "분량 기대치",
        },
        {
          type: "p",
          text: "완전한 학술 CV에는 정해진 페이지 제한이 없으며 이력과 함께 증가하지만, 기대치는 다릅니다. 일부 유럽 지원에서는 더 간결한 CV를 선호하는 반면, 미국 학술 CV는 흔히 망라적입니다. 공모 요강이나 고용주가 명시적인 페이지 제한을 정할 경우 항상 따르십시오.",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass 및 구조화된 형식",
        },
        {
          type: "p",
          text: "유럽연합에서는 Europass CV가 일반적인 구조화 템플릿이며, 일부 기관은 이를 요청합니다. 여러 국가와 시스템에는 고유한 예상 레이아웃이 있습니다. 구조화된 형식이 요구되면, 자유 형식 CV를 제출하지 않고 정확히 따르십시오.",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "지역별 연구비 기관 서술형 CV",
        },
        {
          type: "p",
          text: "주요 연구비 기관은 고유한 형식을 점점 더 요구합니다: 영국의 UKRI 연구·혁신을 위한 이력서(R4RI), EU의 ERC CV, 스위스의 SNSF 형식, 미국의 NIH biosketch 또는 NSF 형식. 이것들은 서술형이거나 엄격하게 구조화되어 있으며 표준 CV와 다릅니다 — 각 신청을 위해 완전한 기록에서 별도로 준비하십시오.",
        },
        {
          type: "h2",
          id: "adapt",
          text: "CV 조정 방법",
        },
        {
          type: "p",
          text: "여러 버전을 처음부터 유지하는 대신, 하나의 완전한 표준 CV를 유지하고 그로부터 국가별 또는 기관별 버전을 도출하십시오. SigmaCV는 귀하의 공개 연구 기록에서 그 표준 CV를 구축하고, 원클릭 연구비 레이아웃(UKRI R4RI, ERC, SNSF, NIH, NSF 등)을 가역적으로 적용하므로 국가별 기대에 맞추는 것이 전면 재작성이 아닌 간단한 조정으로 가능합니다.",
        },
        {
          type: "cta",
          label: "학술 CV 무료로 만들기",
          href: "/",
        },
      ],
      faq: [
        {
          q: "학술 CV에 사진을 포함해야 합니까?",
          a: "국가에 따라 다릅니다. 일부 국가에서는 사진과 개인 정보를 기대하지만, 미국과 영국의 학술 관례는 편견을 줄이기 위해 생략합니다. 지원하는 곳의 관례를 따르십시오.",
        },
        {
          q: "학술 CV는 어디서나 동일합니까?",
          a: "아닙니다. 용어, 기대 분량, 개인 정보 포함 여부, 필수 연구비 기관 형식은 국가에 따라 다릅니다. 목적지 국가와 기관에 맞게 CV를 조정하십시오.",
        },
      ],
    },
  },
  "ru-RU": {
    "how-to-write-an-academic-cv": {
      title: "Как написать академическое резюме",
      description:
        "Практическое руководство по составлению академического резюме: что включать, как упорядочивать и оформлять каждый раздел, какова должна быть длина, как оформлять список публикаций и как требования различаются в зависимости от этапа карьеры и страны.",
      blocks: [
        {
          type: "p",
          text: "Академическое резюме (curriculum vitae) — стандартный документ для подачи заявлений на исследовательские и преподавательские должности, аспирантские программы, стипендии и гранты. В отличие от одно- или двухстраничного résumé, оно представляет собой полную, постоянно обновляемую запись о вашей научной жизни — образовании, публикациях, финансировании, преподавательской и служебной деятельности — и пополняется на протяжении всей карьеры.",
        },
        {
          type: "p",
          text: "В этом руководстве рассматривается, что включать в резюме, как упорядочивать и оформлять каждый раздел, какова должна быть длина академического резюме, как оформлять список публикаций и чем различаются требования в зависимости от этапа карьеры и страны. Если вы предпочитаете не составлять резюме вручную, его можно сформировать автоматически на основе вашей записи ORCID — см. последний раздел.",
        },
        {
          type: "h2",
          id: "what-is-an-academic-cv",
          text: "Что такое академическое резюме?",
        },
        {
          type: "p",
          text: "Резюме — это полная академическая биография. Его задача — задокументировать весь спектр ваших научных достижений, чтобы конкурсная комиссия, финансирующая организация или приёмный комитет могли оценить ваш послужной список. Если résumé подбирается и сокращается под конкретную вакансию, то академическое резюме исчерпывающее и накопительное: вы добавляете в него сведения со временем и крайне редко что-либо удаляете.",
        },
        {
          type: "p",
          text: "Поскольку его читают специалисты, академическое резюме отдаёт предпочтение полноте и точности, а не краткости. Чёткая структура, единообразное форматирование и правильно оформленные цитаты важнее визуальных украшений.",
        },
        {
          type: "h2",
          id: "core-sections",
          text: "Что включать: основные разделы",
        },
        {
          type: "p",
          text: "Большинство академических резюме строится из одних и тех же блоков. Включайте разделы, актуальные для вашей области и этапа карьеры, и опускайте те, которые вам пока нечем заполнить:",
        },
        {
          type: "ul",
          items: [
            "Шапка — имя, текущая должность и профессиональные контактные данные (а также ваш ORCID iD).",
            "Научные интересы / аннотация — несколько строк, обрисовывающих вашу деятельность (необязательно, чаще встречается на начальных этапах карьеры).",
            "Образование — учёные степени в обратном хронологическом порядке с указанием учреждения, дат и названия диссертации.",
            "Должности / позиции — академические и соответствующие профессиональные роли.",
            "Публикации — центральный раздел для большинства исследовательских должностей (см. ниже).",
            "Гранты и финансирование — полученные гранты с указанием финансирующей организации, названия, суммы и дат.",
            "Награды и отличия — стипендии, премии и признания.",
            "Преподавание — прочитанные курсы, приглашённые лекции и преподавательские роли.",
            "Научное руководство и наставничество — студенты и стажёры под вашим руководством.",
            "Доклады — приглашённые выступления, конференционные доклады и постеры.",
            "Служебная деятельность — рецензирование, редакционные роли, работа в комиссиях и просветительская деятельность.",
            "Членство в профессиональных организациях, навыки и рекомендации — в зависимости от области.",
          ],
        },
        {
          type: "h3",
          text: "Упорядочение разделов",
        },
        {
          type: "p",
          text: "После шапки, раздела об образовании и должностях выдвигайте на первый план то, что наиболее весомо для вакансии, на которую вы претендуете. Для научно-исследовательских должностей и грантов поставьте публикации и финансирование высоко; для должностей с акцентом на преподавании — вынесите вперёд преподавание и научное руководство. Адаптируйте порядок под читателя, не придумывая и не раздувая содержание.",
        },
        {
          type: "h2",
          id: "list-publications",
          text: "Как оформлять список публикаций",
        },
        {
          type: "p",
          text: "Список публикаций — это раздел, которому большинство комиссий уделяет больше всего времени, поэтому сделайте его удобным для просмотра и однозначным для восприятия:",
        },
        {
          type: "ul",
          items: [
            "Перечисляйте работы в обратном хронологическом порядке, при необходимости группируя по типу (журнальные статьи, препринты, главы книг, конференционные статьи, наборы данных, программное обеспечение).",
            "На протяжении всего резюме используйте один согласованный стиль цитирования, одинаковый во всех его вариантах.",
            "Выделяйте своё имя в каждом списке авторов, чтобы ваш вклад был заметен с первого взгляда.",
            "Включайте DOI (и ссылки), чтобы читатели могли найти работу.",
            "Чётко и честно помечайте работы, находящиеся на рецензировании, принятые в печать или являющиеся препринтами.",
            "Не раздувайте список — качество и значимость производят лучшее впечатление, чем объём.",
          ],
        },
        {
          type: "p",
          text: "Единообразие — наиболее частая точка сбоя. Оформление всех ссылок через единый стиль цитирования — Citation Style Language (CSL) является стандартом, лежащим в основе таких инструментов, как Zotero, — гарантирует, что ваши Word-, PDF- и LaTeX-резюме будут выглядеть идентично.",
        },
        {
          type: "h2",
          id: "how-long",
          text: "Какова должна быть длина академического резюме?",
        },
        {
          type: "p",
          text: "Фиксированного лимита страниц не существует — академическое резюме настолько длинное, насколько этого требует ваш послужной список, и со временем оно растёт. Для ориентира: резюме соискателя магистратуры или аспирантуры обычно занимает 2–4 страницы, постдока — 3–6, а у старшего профессора — значительно больше десяти. Исключение составляют «краткие резюме» для финансирующих организаций и работодателей, которые нередко ограничены по объёму (например, двумя страницами) или предполагают нарративный формат — например, NIH biosketch, UKRI Résumé for Research and Innovation (R4RI) или ERC CV. Если конкурс предписывает определённый формат или ограничение по страницам, следуйте ему строго.",
        },
        {
          type: "h2",
          id: "by-career-stage",
          text: "Адаптация в зависимости от этапа карьеры",
        },
        {
          type: "ul",
          items: [
            "Студенты и абитуриенты аспирантуры — делайте акцент на образовании, диссертации или исследовательском проекте, любых публикациях или докладах, актуальных навыках и рекомендациях; краткость допустима.",
            "Аспиранты и постдоки — выдвигайте на первый план публикации, конференционную активность, гранты/стипендии и преподавание; поддерживайте резюме актуальным с учётом непрерывных сроков подачи заявлений.",
            "Преподаватели и руководители исследований — акцентируйте гранты, публикации, научное руководство и служебную/административную деятельность; ожидается объёмный структурированный документ и отдельное краткое резюме для финансирующих организаций.",
          ],
        },
        {
          type: "h2",
          id: "country-differences",
          text: "Форматирование и национальные различия",
        },
        {
          type: "p",
          text: "Требования различаются. В США и Канаде академическое «CV» — это полный научный документ («résumé» — его краткая версия для промышленности), тогда как во многих европейских странах понятие «CV» может означать и то, и другое. В одних странах принято включать фотографию, дату рождения или гражданство; во многих других — а также в большинстве академических контекстов США и Великобритании — личные данные намеренно опускаются во избежание предвзятости. Европейские соискатели иногда используют формат Europass, а крупные финансирующие организации всё чаще требуют собственных нарративных форматов резюме. В случае сомнений ориентируйтесь на нормы страны и учреждения, в которое вы подаёте заявку.",
        },
        {
          type: "h2",
          id: "common-mistakes",
          text: "Типичные ошибки, которых следует избегать",
        },
        {
          type: "ul",
          items: [
            "Непоследовательное форматирование или смешение нескольких стилей цитирования в одном документе.",
            "Раздувание списка публикаций или погребение наиболее важных работ.",
            "Устаревание резюме между подачами заявлений.",
            "Игнорирование требуемого формата или лимита страниц, предписанных конкурсом.",
            "Опора на совпадение имени для идентификации публикаций — распространённые и нелатинские имена легко спутать с работами другого автора.",
            "Опечатки и нерабочие ссылки — вычитывайте текст и проверяйте, что каждый DOI разрешается корректно.",
          ],
        },
        {
          type: "h2",
          id: "build-automatically",
          text: "Автоматически сформировать академическое резюме",
        },
        {
          type: "p",
          text: "Поддержание академического резюме в актуальном состоянии — это повторяющаяся ручная работа. SigmaCV (бесплатный и с открытым исходным кодом) формирует его за вас на основе ваших записей в ORCID и OpenAlex — сопоставляя ваши работы по идентификатору, а не по имени, — единообразно оформляет все цитаты и экспортирует результат в PDF, Word, LaTeX, Markdown или BibTeX, либо в виде живой публичной страницы с автоматической синхронизацией. Метрики по умолчанию отключены и нормализованы по области в соответствии с DORA, а ваши данные принадлежат вам (индивидуальное согласие по полям, экспорт, удаление).",
        },
        {
          type: "cta",
          label: "Создать академическое резюме бесплатно",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Какова должна быть длина академического резюме?",
          a: "Фиксированного лимита не существует — оно растёт вместе с вашим послужным списком. Для соискателя аспирантуры — обычно 2–4 страницы, для постдока — 3–6, для старшего учёного — значительно больше. «Краткие резюме» для финансирующих организаций и работодателей могут быть ограничены по объёму или требовать нарративного формата (например, NIH biosketch, UKRI R4RI, ERC) — всегда следуйте инструкциям конкурса.",
        },
        {
          q: "В чём разница между академическим резюме и résumé?",
          a: "Академическое резюме — полная накопительная запись о вашей научной жизни (образование, публикации, финансирование, преподавание, служебная деятельность), которая может занимать много страниц; résumé — краткий целевой документ объёмом одна-две страницы для неакадемических вакансий.",
        },
        {
          q: "Как следует оформлять список публикаций в академическом резюме?",
          a: "Перечисляйте работы в обратном хронологическом порядке, при необходимости группируя по типу, с использованием единого стиля цитирования, с выделенным вашим именем и указанием DOI. Чётко помечайте препринты и работы на рецензировании; не раздувайте список.",
        },
        {
          q: "Можно ли автоматически сформировать академическое резюме?",
          a: "Да. SigmaCV создаёт академическое резюме на основе ваших записей в ORCID и OpenAlex (сопоставление по идентификатору, а не по имени), форматирует цитаты и экспортирует в PDF, DOCX, LaTeX, Markdown или BibTeX — бесплатно и с открытым исходным кодом.",
        },
      ],
    },
    "academic-cv-vs-resume": {
      title: "Академическое резюме и résumé: в чём разница?",
      description:
        "Академическое резюме и résumé — различия в длине, охвате и назначении; когда использовать каждый из документов для академических должностей, поступления в аспирантуру, получения грантов и работы в промышленности.",
      blocks: [
        {
          type: "p",
          text: "«CV» и «résumé» нередко используются как взаимозаменяемые понятия, однако в академической среде это разные документы с разными функциями. Выбор правильного варианта — и его надлежащее оформление — существенен для академических заявлений о приёме на работу, стипендиях и грантах.",
        },
        {
          type: "p",
          text: "Академическое резюме (curriculum vitae) — полная накопительная запись о вашей научной жизни: образование, публикации, финансирование, преподавание, доклады и служебная деятельность. Résumé — краткое, максимально целевое резюме объёмом обычно одна-две страницы, ориентированное на конкретную неакадемическую вакансию.",
        },
        {
          type: "h2",
          id: "key-differences",
          text: "Ключевые различия",
        },
        {
          type: "ul",
          items: [
            "Длина — CV растёт без фиксированного предела (нередко несколько страниц); résumé сжимается до одной-двух.",
            "Охват — CV документирует всё, что имеет отношение к вашей научной деятельности; résumé включает только то, что значимо для целевой вакансии.",
            "Аудитория — CV читают академические коллеги и комиссии; résumé — рекрутеры и менеджеры по найму.",
            "Устойчивость — CV пополняется со временем и редко сокращается; résumé переписывается под каждую заявку.",
            "Публикации и финансирование — центральные элементы CV; в résumé они обычно сжимаются или опускаются.",
          ],
        },
        {
          type: "h2",
          id: "which-to-use",
          text: "Какой из них использовать?",
        },
        {
          type: "ul",
          items: [
            "Академические должности, постдоки, заявки в аспирантуру/магистратуру, стипендии и гранты → академическое резюме.",
            "Промышленность и большинство неакадемических вакансий → résumé, адаптированное под объявление о вакансии.",
            "«Alt-ac» и смежные с исследованиями промышленные позиции → нередко гибридный вариант: документ объёмом с résumé, который тем не менее подчёркивает значимые научные результаты.",
          ],
        },
        {
          type: "h2",
          id: "converting",
          text: "Преобразование CV в résumé",
        },
        {
          type: "p",
          text: "Чтобы превратить академическое резюме в résumé, начните с краткого резюмирующего раздела, оставьте только наиболее актуальный опыт и несколько репрезентативных результатов, переведите академические достижения в формат воздействия и передаваемых навыков и сократите документ до одной-двух страниц. Сохраняйте полное резюме как основной документ и создавайте на его основе более краткие версии.",
        },
        {
          type: "h2",
          id: "build-either",
          text: "Создать любой из документов на основе вашего исследовательского портфолио",
        },
        {
          type: "p",
          text: "SigmaCV формирует академическое резюме на основе ваших записей в ORCID и OpenAlex и экспортирует его в различных форматах и с одним нажатием применяет различные макеты — так вы можете вести одну каноническую запись и получать нужную версию для каждой заявки. Это бесплатно, с открытым исходным кодом и с приоритетом конфиденциальности.",
        },
        {
          type: "cta",
          label: "Создать академическое резюме бесплатно",
          href: "/",
        },
      ],
      faq: [
        {
          q: "CV и résumé — это одно и то же?",
          a: "Не в академической среде. Академическое резюме — длинная полная запись о вашей научной деятельности; résumé — краткий целевой документ объёмом одна-две страницы для неакадемических вакансий. За пределами академической среды и в ряде стран эти понятия используются более свободно.",
        },
        {
          q: "Нужна ли фотография в академическом резюме?",
          a: "Зависит от страны. В одних странах фотография и личные данные обязательны; во многих академических контекстах (особенно в США и Великобритании) они намеренно опускаются во избежание предвзятости. Ориентируйтесь на нормы страны, в которую подаёте заявку.",
        },
      ],
    },
    "how-to-list-publications-on-a-cv": {
      title: "Как оформить список публикаций в академическом резюме",
      description:
        "Как форматировать и упорядочивать раздел публикаций в академическом резюме: стиль цитирования, группировка по типу, порядок авторов, выделение своего имени, препринты и работы на рецензировании, а также чего следует избегать.",
      blocks: [
        {
          type: "p",
          text: "Для большинства академических должностей раздел публикаций — та часть резюме, которую комиссии изучают наиболее тщательно, поэтому то, как вы его представляете, почти так же важно, как его содержимое. В этом руководстве рассматриваются стиль цитирования, порядок и группировка, чёткая демонстрация собственного вклада, обращение с препринтами и работами на рецензировании, а также ошибки, которые подрывают репутацию даже сильного списка.",
        },
        {
          type: "h2",
          id: "citation-style",
          text: "Выберите один стиль цитирования — и придерживайтесь его",
        },
        {
          type: "p",
          text: "Выберите стиль цитирования, принятый в вашей области (например APA, Vancouver, Chicago или IEEE), и применяйте его к каждой записи. Наиболее распространённая ошибка — смешение стилей или ручное оформление ссылок, при котором ни одна из них не выглядит так же, как другие. Оформление всего списка через единый механизм — Citation Style Language (CSL), являющийся стандартом для менеджеров библиографий, таких как Zotero, — гарантирует единообразие в ваших PDF-, Word- и LaTeX-резюме.",
        },
        {
          type: "h2",
          id: "order-and-grouping",
          text: "Упорядочение и группировка публикаций",
        },
        {
          type: "ul",
          items: [
            "Перечисляйте работы в обратном хронологическом порядке (сначала самые новые).",
            "При большом списке группируйте по типу: рецензированные журнальные статьи, препринты, главы книг, конференционные статьи, наборы данных и программное обеспечение.",
            "Чётко обозначайте и разделяйте группы, чтобы читатель мог мгновенно найти рецензированные работы.",
            "Соблюдайте единообразие в нумерации — либо нумеруйте все записи, либо не нумеруйте ни одну.",
          ],
        },
        {
          type: "h2",
          id: "your-contribution",
          text: "Сделайте свой вклад очевидным",
        },
        {
          type: "ul",
          items: [
            "Выделяйте своё имя (например полужирным шрифтом) в каждом списке авторов.",
            "Отмечайте роли первого автора, автора-корреспондента и равного вклада чётким, поясняемым обозначением.",
            "Помните, что конвенции порядка авторов различаются по областям — добавьте однострочную сноску, если конвенция вашей области неочевидна.",
          ],
        },
        {
          type: "h2",
          id: "status",
          text: "Препринты, работы на рецензировании и принятые в печать",
        },
        {
          type: "p",
          text: "Указывайте работы честно, с их фактическим статусом. Препринты всё шире принимаются в резюме, но должны помечаться как препринты, а работы «на рецензировании» или «принятые в печать» — обозначаться соответственно. Никогда не представляйте нерецензированную работу как рецензированную и не вносите одну и ту же статью дважды (например, как препринт и как опубликованную версию), не пояснив явно связь между ними.",
        },
        {
          type: "h2",
          id: "identifiers",
          text: "Включайте идентификаторы и ссылки",
        },
        {
          type: "p",
          text: "Добавляйте DOI (и ссылку) к каждой работе, чтобы читатели могли её найти, и размещайте свой ORCID iD в шапке резюме. Идентификаторы также позволяют инструментам надёжно верифицировать авторство — по идентификатору, а не по имени, что особенно важно для распространённых имён и имён на нелатинских алфавитах.",
        },
        {
          type: "h2",
          id: "avoid",
          text: "Чего следует избегать",
        },
        {
          type: "ul",
          items: [
            "Смешения стилей цитирования в рамках одного документа.",
            "Раздувания списка незначительными или не относящимися к делу записями.",
            "Непоследовательного написания собственного имени в разных записях.",
            "Нерабочих или отсутствующих DOI — проверяйте, что каждая ссылка разрешается корректно.",
          ],
        },
        {
          type: "h2",
          id: "automate",
          text: "Автоматически сформировать отформатированный список публикаций",
        },
        {
          type: "p",
          text: "SigmaCV загружает ваши публикации из ORCID и OpenAlex (сопоставление по идентификатору, а не по имени), форматирует их в любом стиле CSL с выделением вашего имени и экспортирует список в PDF, Word, LaTeX, Markdown или BibTeX — обеспечивая единообразие и точность во всех вариантах вашего резюме.",
        },
        {
          type: "cta",
          label: "Создать список публикаций бесплатно",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Какой стиль цитирования использовать для публикаций в резюме?",
          a: "Используйте стиль, принятый в вашей области (например APA, Vancouver, Chicago, IEEE). Главное — единообразно применять один стиль ко всему списку и во всех форматах вашего резюме.",
        },
        {
          q: "Следует ли включать препринты в резюме?",
          a: "Да — препринты всё шире принимаются, — но чётко помечайте их как препринты и отделяйте от рецензированных статей.",
        },
        {
          q: "Как обозначить совместное первое авторство или равный вклад?",
          a: "Отметьте соответствующих авторов символом и поясните его в краткой легенде (например, «* равный вклад»). Соблюдайте единообразие на протяжении всего списка.",
        },
      ],
    },
    "how-long-should-an-academic-cv-be": {
      title: "Какова должна быть длина академического резюме?",
      description:
        "Длина академического резюме в зависимости от этапа карьеры, случаи ограничения объёма (краткие резюме для финансирующих организаций и работодателей), а также почему «длиннее» не значит «лучше» — и как вести одно главное резюме, получая из него более короткие версии.",
      blocks: [
        {
          type: "p",
          text: "Кратко: академическое резюме ровно настолько длинное, насколько это оправдывает ваш послужной список, и оно растёт на протяжении карьеры. В отличие от résumé, никто не ожидает, что оно уместится на одной или двух страницах. Однако длина зависит от этапа карьеры и контекста, и существуют важные исключения.",
        },
        {
          type: "h2",
          id: "by-stage",
          text: "Ориентиры по этапам карьеры",
        },
        {
          type: "ul",
          items: [
            "Соискатель магистратуры / аспирантуры — около 2–4 страниц.",
            "Аспирант / постдок — около 3–6 страниц.",
            "Середина карьеры — нередко 6–10+ страниц.",
            "Старший преподаватель — значительно больше десяти страниц; длину определяет список публикаций и объём финансирования.",
          ],
        },
        {
          type: "p",
          text: "Это ориентиры, а не правила. Сильное, хорошо структурированное четырёхстраничное резюме превосходит раздутое восьмистраничное.",
        },
        {
          type: "h2",
          id: "capped",
          text: "Когда объём ограничен",
        },
        {
          type: "p",
          text: "Многие финансирующие организации и работодатели запрашивают «краткое резюме» со строгим лимитом страниц (нередко две страницы) или структурированный нарративный формат — например NIH biosketch, UKRI Résumé for Research and Innovation (R4RI), ERC CV или формат швейцарского SNSF. Если конкурс предписывает определённый объём или формат, следуйте ему строго: превышение лимита может привести к отклонению заявки без рассмотрения.",
        },
        {
          type: "h2",
          id: "quality",
          text: "Длиннее не значит лучше",
        },
        {
          type: "p",
          text: "Полнота обязательна, но «раздутость» — нет. Включайте то, что актуально, располагайте материал так, чтобы самое сильное было легко найти, и устраняйте наполнитель. Рецензенты ценят ясность и значимость, а не количество страниц.",
        },
        {
          type: "h2",
          id: "master-cv",
          text: "Ведите главное резюме, экспортируйте более короткие версии",
        },
        {
          type: "p",
          text: "Практический подход — вести одно полное «главное» резюме и получать из него более короткие или адаптированные для конкретных финансирующих организаций версии. SigmaCV делает это на основе единой канонической записи: храните всё в одном месте, затем применяйте одним нажатием нужный макет (NIH, NSF, ERC, UKRI R4RI и другие) или обратимо убирайте разделы для конкретного конкурса и экспортируйте результат.",
        },
        {
          type: "cta",
          label: "Создать академическое резюме бесплатно",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Существует ли лимит страниц для академического резюме?",
          a: "Как правило, нет — полное академическое резюме настолько длинное, насколько это оправдывает послужной список. Исключение — «краткие резюме» для финансирующих организаций и работодателей, которые нередко ограничивают объём или требуют нарративного формата; всегда следуйте инструкциям конкурса.",
        },
        {
          q: "Каким должно быть резюме при поступлении в аспирантуру?",
          a: "Обычно около 2–4 страниц. На этом этапе чётко представленный исследовательский опыт и несколько репрезентативных результатов важнее объёма.",
        },
      ],
    },
    "academic-cv-for-grad-school": {
      title: "Академическое резюме для поступления в аспирантуру",
      description:
        "Что включать в академическое резюме при поступлении в магистратуру, аспирантуру или на другие программы постдипломного образования, если публикаций пока немного, — и как произвести сильное впечатление на приёмную комиссию.",
      blocks: [
        {
          type: "p",
          text: "Если вы подаёте документы в магистратуру или аспирантуру и беспокоитесь, что ваше резюме выглядит скудно, это совершенно нормально — приёмные комиссии не ожидают длинного списка публикаций на этом этапе. Их интересуют свидетельства потенциала: исследовательский опыт, актуальные навыки и чёткая траектория развития. Вот что включать и как это представить.",
        },
        {
          type: "h2",
          id: "what-to-include",
          text: "Что включать",
        },
        {
          type: "ul",
          items: [
            "Образование — учёные степени, учреждения, даты и средний балл, если он высокий; укажите название дипломной или курсовой работы.",
            "Исследовательский опыт — лаборатории, проекты и диссертации с указанием вашей роли, методов и результатов.",
            "Публикации и доклады — любые статьи, препринты, постеры или конференционные выступления, сколь бы ранними они ни были.",
            "Навыки — лабораторные, технические, статистические, программные и языковые, актуальные для данной области.",
            "Награды и стипендии — академические отличия и финансовая поддержка.",
            "Соответствующий опыт — преподавание, репетиторство, значимая трудовая деятельность или волонтёрство.",
            "Рекомендации — или указание, что они предоставляются по запросу.",
          ],
        },
        {
          type: "h2",
          id: "lead-with-research",
          text: "Начните с исследовательского опыта",
        },
        {
          type: "p",
          text: "Даже без публикаций исследовательский опыт — ваш главный козырь. Для каждого проекта укажите, каков был исследовательский вопрос, что вы делали (методы, анализ, ваша конкретная роль) и к чему это привело. Конкретные вклады производят значительно лучшее впечатление, чем перечень пройденных курсов.",
        },
        {
          type: "h2",
          id: "length-and-format",
          text: "Длина и формат",
        },
        {
          type: "p",
          text: "Резюме для поступления в аспирантуру обычно занимает 2–4 страницы. Сохраняйте чистое и последовательное форматирование, используйте чёткие заголовки разделов и адаптируйте акценты к конкретной программе, на которую вы претендуете. Краткость допустима — не раздувайте содержание.",
        },
        {
          type: "h2",
          id: "build",
          text: "Сформировать на основе ваших данных",
        },
        {
          type: "p",
          text: "SigmaCV собирает аккуратное академическое резюме на основе вашего ORCID и открытых данных, поэтому даже ваши первые публикации, препринты и постеры оформляются правильно и единообразно — а любую работу можно добавить по DOI. Это бесплатно и с открытым исходным кодом.",
        },
        {
          type: "cta",
          label: "Создать резюме для аспирантуры бесплатно",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Нужны ли публикации для резюме при поступлении в аспирантуру?",
          a: "Нет. На этапе подачи документов исследовательский опыт, актуальные навыки и чёткая траектория важнее списка публикаций. Включайте имеющиеся препринты или постеры, однако их отсутствие ожидаемо.",
        },
        {
          q: "Каким должно быть резюме для поступления в аспирантуру?",
          a: "Обычно 2–4 страницы. Сосредоточьтесь на главном: чётко представленный исследовательский опыт и несколько репрезентативных материалов лучше наполнителя.",
        },
      ],
    },
    "responsible-metrics-on-an-academic-cv": {
      title:
        "Ответственное использование метрик в академическом резюме (DORA и Лейденский манифест)",
      description:
        "Как ответственно представлять исследовательские метрики в резюме: почему импакт-фактор журнала и индекс Хирша вводят в заблуждение, что добавляют нормализованные по области показатели и что рекомендуют DORA и Лейденский манифест.",
      blocks: [
        {
          type: "p",
          text: "Метрики кажутся соблазнительным сокращением в резюме, однако их легко использовать некорректно — и комиссии всё настойчивее ожидают от исследователей ответственного обращения с ними. В этом руководстве объясняется, какие метрики вводят в заблуждение, какие более обоснованны и что рекомендуют основные концепции ответственной оценки.",
        },
        {
          type: "h2",
          id: "journal-impact-factor",
          text: "Почему импакт-фактор журнала — неподходящий инструмент",
        },
        {
          type: "p",
          text: "Импакт-фактор журнала (JIF) измеряет среднее число цитирований журнала, а не качество или воздействие вашей конкретной статьи. Распределения цитирований существенно скошены, поэтому одна статья в журнале с высоким JIF практически ничего не говорит читателю об этой статье. DORA — Сан-Францисская декларация об оценке исследований — прямо не рекомендует использовать JIF для оценки отдельных исследований или исследователей.",
        },
        {
          type: "h2",
          id: "h-index",
          text: "Ограничения индекса Хирша и абсолютных показателей",
        },
        {
          type: "p",
          text: "Индекс Хирша и абсолютное число цитирований в значительной мере зависят от области и длины карьеры, поэтому они несопоставимы между дисциплинами и ставят в невыгодное положение исследователей на начальных этапах карьеры. Они также поддаются завышению. Если вы их приводите, давайте контекст; никогда не представляйте их как самостоятельный показатель ценности.",
        },
        {
          type: "h2",
          id: "field-normalized",
          text: "Отдавайте предпочтение нормализованным по области показателям",
        },
        {
          type: "p",
          text: "Нормализованные по области показатели — такие как FWCI (Field-Weighted Citation Impact) или NIH iCite Relative Citation Ratio (RCR) — учитывают различия в интенсивности цитирования между областями и в динамике времени, поэтому они более сопоставимы, чем абсолютные значения. Они также несовершенны и должны восприниматься в контексте, а не как единственный сигнал.",
        },
        {
          type: "h2",
          id: "frameworks",
          text: "Что рекомендуют DORA и Лейденский манифест",
        },
        {
          type: "ul",
          items: [
            "DORA — не использовать журнальные метрики (такие как JIF) для оценки индивидуального вклада; оценивать исследования по их собственным достоинствам.",
            "Лейденский манифест — использовать количественные показатели для поддержки экспертного суждения, а не его замены; учитывать различия между областями; обеспечивать прозрачность данных и методов; избегать ложной конкретности.",
          ],
        },
        {
          type: "h2",
          id: "practical-advice",
          text: "Практические рекомендации для вашего резюме",
        },
        {
          type: "ul",
          items: [
            "Делайте акцент на самих работах — что вы сделали и почему это важно, — а не на цифрах.",
            "Если вы включаете метрики, отдавайте предпочтение нормализованным по области показателям и давайте контекст (область, временной интервал, перцентиль).",
            "Рассмотрите краткое нарративное описание ваших ключевых вкладов вместо цифр или в дополнение к ним.",
            "Никогда не указывайте импакт-фактор журналов, в которых опубликованы ваши статьи.",
          ],
        },
        {
          type: "h2",
          id: "sigmacv",
          text: "Ответственные метрики по умолчанию",
        },
        {
          type: "p",
          text: "SigmaCV создан с учётом этой позиции: метрики по умолчанию отключены и включаются добровольно, предпочтительны нормализованные по области показатели вместо абсолютных значений, а импакт-фактор журналов не отображается никогда — в соответствии с DORA. Вы полностью контролируете, будет ли вообще отображаться какая-либо метрика в вашем резюме.",
        },
        {
          type: "cta",
          label: "Создать резюме, соответствующее DORA, бесплатно",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Стоит ли указывать индекс Хирша в резюме?",
          a: "Необязательно и зависит от области. Если вы его включаете, давайте контекст и дополняйте нормализованными по области показателями, а не представляйте его в одиночестве; многие комиссии не рекомендуют чрезмерно на него опираться.",
        },
        {
          q: "Допустимо ли указывать импакт-факторы журналов в резюме?",
          a: "Не рекомендуется. DORA прямо не советует использовать импакт-фактор журнала для оценки отдельных исследований, поскольку он измеряет журнал, а не вашу статью.",
        },
      ],
    },
    "academic-cv-format-by-country": {
      title: "Форматы академического резюме по странам",
      description:
        "Как различаются национальные требования к академическому резюме — различие между CV и résumé, фотографии и личные данные, длина, Europass и нарративные форматы финансирующих организаций — и как адаптировать ваш документ.",
      blocks: [
        {
          type: "p",
          text: "Единого мирового стандарта академического резюме не существует. Требования различаются в зависимости от страны и учреждения — как называется сам документ, включается ли фотография, какова его длина и какой структурированный формат предписывает финансирующая организация. В этом руководстве рассматриваются основные различия и способы адаптации резюме к месту подачи заявки.",
        },
        {
          type: "h2",
          id: "cv-vs-resume",
          text: "Различие между CV и résumé варьируется",
        },
        {
          type: "p",
          text: "В США и Канаде академическое «CV» — полный научный документ, тогда как «résumé» — его краткая версия для промышленности объёмом одна-две страницы. В Великобритании и большей части Европы понятие «CV» может обозначать как тот, так и другой документ, а академический вариант определяется из контекста. Ориентируйтесь на термин и объём, ожидаемые в стране и на конкретной должности, на которую вы претендуете.",
        },
        {
          type: "h2",
          id: "photos-personal-details",
          text: "Фотографии и личные данные",
        },
        {
          type: "p",
          text: "Это наибольшее межстрановое различие. В части континентальной Европы, Азии и Латинской Америки может ожидаться наличие в резюме фотографии, даты рождения или гражданства. В США и Великобритании они намеренно опускаются во избежание предвзятости, а их включение может обернуться против вас. В случае сомнений следуйте норме страны назначения — и никогда не включайте личные данные, от которых конкретный работодатель прямо попросил воздержаться.",
        },
        {
          type: "h2",
          id: "length",
          text: "Ожидания относительно длины",
        },
        {
          type: "p",
          text: "У полного академического резюме нет фиксированного лимита страниц, и оно растёт вместе с послужным списком, однако ожидания различаются: часть европейских работодателей предпочитает более краткое резюме, тогда как американские академические резюме нередко исчерпывающие. Всегда соблюдайте явно указанный лимит страниц, если таковой предписан конкурсом или работодателем.",
        },
        {
          type: "h2",
          id: "europass",
          text: "Europass и структурированные форматы",
        },
        {
          type: "p",
          text: "В Европейском союзе Europass CV является распространённым структурированным шаблоном, и часть учреждений его запрашивает. В ряде стран и систем существуют собственные ожидаемые макеты. Если требуется структурированный формат, следуйте ему строго, а не представляйте произвольно оформленное резюме.",
        },
        {
          type: "h2",
          id: "funder-formats",
          text: "Нарративные форматы резюме финансирующих организаций по регионам",
        },
        {
          type: "p",
          text: "Крупные финансирующие организации всё чаще требуют собственных форматов: UKRI Résumé for Research and Innovation (R4RI) в Великобритании, ERC CV в ЕС, формат SNSF в Швейцарии, NIH biosketch или формат NSF в США. Они нарративны или жёстко структурированы и отличаются от стандартного резюме — готовьте их на основе вашего полного резюме для каждой заявки.",
        },
        {
          type: "h2",
          id: "adapt",
          text: "Как адаптировать ваше резюме",
        },
        {
          type: "p",
          text: "Ведите одно полное каноническое резюме и получайте из него версии для конкретных стран или финансирующих организаций, а не поддерживайте несколько документов с нуля. SigmaCV формирует это каноническое резюме на основе ваших открытых исследовательских данных и обратимо применяет одним нажатием нужный макет финансирующей организации (UKRI R4RI, ERC, SNSF, NIH, NSF и другие) — так что адаптация к требованиям конкретной страны занимает минуты, а не часы.",
        },
        {
          type: "cta",
          label: "Создать академическое резюме бесплатно",
          href: "/",
        },
      ],
      faq: [
        {
          q: "Следует ли размещать фотографию в академическом резюме?",
          a: "Зависит от страны. В одних странах фотография и личные данные ожидаемы; академическая норма в США и Великобритании — опускать их во избежание предвзятости. Следуйте требованиям страны, в которую подаёте заявку.",
        },
        {
          q: "Является ли академическое резюме одинаковым во всех странах?",
          a: "Нет. Термин, ожидаемый объём, включение личных данных и обязательные форматы финансирующих организаций различаются в зависимости от страны. Адаптируйте резюме к требованиям страны и учреждения назначения.",
        },
      ],
    },
  },
};
