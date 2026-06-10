import { asLocale, type Locale } from "./index";
import type { LandingPageId } from "./landingPages";

/**
 * Deep, localized content for the high-intent SEO landing pages (the C1 content
 * depth pass). This sits ALONGSIDE the thin copy in `landingPages.ts` (meta,
 * heading, subhead, bullets, base FAQ, CTA): `LandingPage.tsx` renders these
 * richer sections — an opening "intro", a step-by-step "how it works" (also
 * emitted as HowTo JSON-LD), a "why" section, extra FAQ entries (merged into the
 * visible FAQ and the FAQPage JSON-LD), and related-page internal links.
 *
 * Typed as Record<Locale, Record<LandingPageId, LandingPageContent>> so a missing
 * locale/page/field is a compile error.
 *
 * NOTE: the non-English copy was machine-drafted from the English source and is
 * flagged for a per-locale native-speaker review pass (same convention as
 * `landingPages.ts`). Proper nouns (SigmaCV, OpenAlex, ORCID, NIH, LaTeX, …) are
 * kept untranslated.
 */

export interface LandingStep {
  title: string;
  body: string;
}

export interface LandingFaqItem {
  q: string;
  a: string;
}

export interface LandingPageContent {
  /** Two opening paragraphs (the keyword-rich "what & why"). */
  intro: [string, string];
  /** Heading for the step-by-step "how it works" section. */
  stepsHeading: string;
  /** Four ordered steps; also emitted as HowTo JSON-LD. */
  steps: LandingStep[];
  /** Heading for the differentiators / "why" section. */
  whyHeading: string;
  /** Two "why SigmaCV" paragraphs. */
  why: [string, string];
  /** Three extra FAQ entries, merged with the base FAQ from landingPages.ts. */
  faqExtra: LandingFaqItem[];
  /** Heading for the related-pages internal-link block. */
  relatedHeading: string;
}

/**
 * Hub-and-spoke internal-linking map (page ids only — not localized). The visible
 * link label reuses each target page's already-localized `navLabel`.
 */
export const LANDING_RELATED: Record<LandingPageId, LandingPageId[]> = {
  "orcid-to-cv": ["openalex-cv", "publication-list", "academic-cv-template"],
  "nih-biosketch": ["funder-cv-templates", "orcid-to-cv", "publication-list"],
  "academic-cv-template": ["orcid-to-cv", "funder-cv-templates", "latex-cv"],
  "openalex-cv": ["orcid-to-cv", "publication-list", "academic-cv-template"],
  "publication-list": ["orcid-to-cv", "latex-cv", "openalex-cv"],
  "latex-cv": ["academic-cv-template", "publication-list", "funder-cv-templates"],
  "funder-cv-templates": ["nih-biosketch", "academic-cv-template", "latex-cv"],
};

const LANDING_CONTENT_I18N: Record<Locale, Record<LandingPageId, LandingPageContent>> = {
  "en-US": {
    "orcid-to-cv": {
      intro: [
        "Turning your ORCID iD into an academic CV usually means exporting a list and reformatting it by hand. SigmaCV does it automatically: sign in with ORCID and it reads your public record, pulls your publications from ORCID and OpenAlex, formats every citation consistently, and assembles a clean academic CV you can curate and export in minutes.",
        'Your work is matched to you by your ORCID iD — a stable identifier, not your name as text — so you avoid the "someone else with my name" mix-ups that name-based tools produce, which matter most for common names and names in non-Latin scripts. Nothing is invented, and anything that isn\'t yours is one click away from being hidden.',
      ],
      stepsHeading: "How to turn your ORCID iD into a CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "Use the free ORCID login. SigmaCV reads only your public ORCID record — it never writes anything back to ORCID.",
        },
        {
          title: "Your CV fills itself in",
          body: "SigmaCV resolves your OpenAlex author profile from your ORCID iD and assembles your publications — and, where available, your positions, education and funding — into a draft CV.",
        },
        {
          title: "Curate what's yours",
          body: 'Mark anything that isn\'t you as "not mine" (it is hidden, never deleted), reorder entries, and choose which sections appear.',
        },
        {
          title: "Style and export",
          body: "Pick a citation style and template, optionally highlight your own name in author lists, then export to PDF, DOCX, LaTeX or Markdown — or publish a living page that re-syncs.",
        },
      ],
      whyHeading: "Why build your CV from ORCID with SigmaCV",
      why: [
        "ORCID is the reliable anchor for your scholarly identity, and SigmaCV uses it the way it was meant to be used: as an identifier that resolves to your work, not a name to be guessed at. That is the difference between a CV that is genuinely yours and one you spend an afternoon correcting.",
        "It is free for individuals and open source, reads only public metadata, and keeps you in control of every entry. The same canonical CV exports to every format with identical, correctly formatted citations, so you never reformat a reference by hand again.",
      ],
      faqExtra: [
        {
          q: "Do I need an ORCID account?",
          a: "Yes — a free ORCID iD is all you need to sign in, and it takes about a minute to create at orcid.org. It is also what lets SigmaCV find your work reliably.",
        },
        {
          q: "Does SigmaCV change my ORCID record?",
          a: "No. SigmaCV only reads your public ORCID and OpenAlex data; it never writes, edits, or adds anything to your ORCID record.",
        },
        {
          q: "What if one of my publications is missing?",
          a: "You can add any work by its DOI, and SigmaCV pulls its details from the open record and formats it to match the rest of your CV.",
        },
      ],
      relatedHeading: "Related ways to build your CV",
    },
    "nih-biosketch": {
      intro: [
        "An NIH biosketch asks for your contributions to science and a focused selection of publications, formatted just so. SigmaCV gives you a running start: sign in with ORCID and it drafts an NIH-style biosketch from your open research record, with your publications already pulled in and citations formatted consistently.",
        "You decide which contributions and which publications appear — the biosketch should highlight the work most relevant to a specific application, and SigmaCV makes that selection quick rather than a copy-paste exercise. Because everything derives from one canonical record, you can re-export an updated biosketch the next time you need one.",
      ],
      stepsHeading: "How to generate an NIH biosketch",
      steps: [
        {
          title: "Sign in with ORCID",
          body: "SigmaCV reads your public ORCID and OpenAlex record — no manual entry of your publication list.",
        },
        {
          title: "Pull in your record",
          body: "Your publications and profile are assembled automatically, matched to you by identifier rather than by name.",
        },
        {
          title: "Select your contributions and publications",
          body: "Choose the contributions and the specific publications that matter for this application, and put them in the order you want.",
        },
        {
          title: "Format and export",
          body: "Apply the NIH-style layout, keep citations consistent throughout, and export to PDF, DOCX or LaTeX.",
        },
      ],
      whyHeading: "Why draft your biosketch with SigmaCV",
      why: [
        "The tedious part of a biosketch is assembling and formatting the publication list and keeping it consistent. SigmaCV does that automatically and lets you concentrate on the narrative — your contributions to science — instead of fighting citation formatting.",
        "It is free for individuals and open source, and it never invents anything: every publication comes from the open record, matched to your identifier, and you curate exactly what appears.",
      ],
      faqExtra: [
        {
          q: "Is this an official NIH form?",
          a: "SigmaCV produces an NIH-style biosketch you can adapt to the official template. Always check the current NIH instructions and forms for your specific funding opportunity.",
        },
        {
          q: "Can I reuse my biosketch for different applications?",
          a: "Yes. Because it is built from one canonical CV, you can re-curate which publications and contributions appear and export a tailored version for each application.",
        },
        {
          q: "Which publications are included?",
          a: "Only the ones you choose. SigmaCV proposes your full record matched by identifier, and you select the subset most relevant to the application.",
        },
      ],
      relatedHeading: "Related funder CV tools",
    },
    "academic-cv-template": {
      intro: [
        "A blank academic CV template still leaves you typing every entry. SigmaCV is the opposite: an academic CV that fills itself in. Sign in with ORCID and it builds a clean, citation-formatted CV from your real, public research record, so you start from your actual work instead of an empty page.",
        "You still get full control over the layout and what appears — pick a template, choose a citation style, reorder sections, and hide anything that isn't relevant — but the heavy lifting of gathering and formatting your publications is already done. It is free for individuals and open source.",
      ],
      stepsHeading: "How to use the auto-filled academic CV template",
      steps: [
        {
          title: "Sign in with ORCID",
          body: "No blank form to fill: SigmaCV reads your public record to populate the template for you.",
        },
        {
          title: "Start from your real record",
          body: "Your publications are pulled from ORCID and OpenAlex by identifier, and your profile is filled in automatically.",
        },
        {
          title: "Choose a layout and style",
          body: "Pick a template and a CSL citation style; switch between layouts reversibly without losing your edits.",
        },
        {
          title: "Curate and export",
          body: "Reorder and hide entries, then export the same canonical CV to PDF, DOCX, LaTeX or Markdown.",
        },
      ],
      whyHeading: "Why this beats a blank template",
      why: [
        "Templates solve formatting but not content — you still have to find every paper, type every detail, and format every citation. SigmaCV solves both: it assembles the content from the open record and formats the citations through one citation engine, so they are identical in every export.",
        "And it never traps your data: switch layouts whenever you like, and download your CV in any format. Nothing is locked to a single style or to the hosted instance, which is fully self-hostable.",
      ],
      faqExtra: [
        {
          q: "Can I customize the template?",
          a: "Yes. You choose the template and citation style, reorder and rename sections, and decide what shows — applied reversibly to the same underlying CV.",
        },
        {
          q: "Is the template really free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence, and it reads only public research metadata.",
        },
        {
          q: "Do I have to use the auto-filled content?",
          a: "No. Everything is curatable: keep what's yours, hide the rest, and add anything missing by DOI.",
        },
      ],
      relatedHeading: "Related CV templates and formats",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex is one of the largest open catalogues of scholarly work, and SigmaCV turns your OpenAlex profile into a finished academic CV. Sign in with ORCID, SigmaCV resolves your OpenAlex author identifier, and your works are imported, formatted and ready to curate — no manual list-building.",
        "The matching is by author identifier (your OpenAlex / ORCID ID), never by name string, so your CV reflects your work and not a near-namesake's. Any OpenAlex metrics are strictly opt-in and field-normalized, in line with DORA — off by default, never a journal Impact Factor.",
      ],
      stepsHeading: "How to build a CV from OpenAlex",
      steps: [
        {
          title: "Sign in with ORCID",
          body: "SigmaCV uses your ORCID iD to resolve the correct OpenAlex author profile for you.",
        },
        {
          title: "Import your OpenAlex works",
          body: "Your works are pulled in by identifier and turned into formatted CV entries automatically.",
        },
        {
          title: "Curate and (optionally) add metrics",
          body: "Hide anything that isn't yours, reorder entries, and — only if you want — switch on field-normalized metrics.",
        },
        {
          title: "Export or publish",
          body: "Export to PDF, DOCX, LaTeX or Markdown, or publish a living page that re-syncs from OpenAlex.",
        },
      ],
      whyHeading: "Why use your OpenAlex profile this way",
      why: [
        "OpenAlex gives you broad, open coverage of your publications, but a raw profile is not a CV. SigmaCV formats it into one — consistent citations, a layout of your choice, and your own name highlighted by identifier in author lists.",
        "It is free for individuals and open source, reads only public metadata, and treats metrics responsibly: they stay off unless you opt in, and SigmaCV prefers field-normalized indicators over raw counts.",
      ],
      faqExtra: [
        {
          q: "What if my OpenAlex profile has errors?",
          a: 'You curate everything: mark wrongly attributed works as "not mine" (they are hidden, not deleted) and add missing ones by DOI. Your corrections shape your CV without altering OpenAlex.',
        },
        {
          q: "Are OpenAlex metrics shown by default?",
          a: "No. Metrics are off by default and fully opt-in. When enabled, SigmaCV prefers field-normalized indicators and never shows a journal Impact Factor.",
        },
        {
          q: "Does it match my work by name?",
          a: "No — by author identifier (OpenAlex / ORCID ID), which avoids the false matches common with shared or transliterated names.",
        },
      ],
      relatedHeading: "Related ways to build your CV",
    },
    "publication-list": {
      intro: [
        "A formatted publication list is the core of any academic CV, and the part most tedious to maintain. SigmaCV generates it for you: sign in with ORCID and it builds a consistent, citation-formatted list of your publications from ORCID and OpenAlex, ready to reorder and drop into your CV.",
        "Choose any CSL citation style and the formatting stays identical across every output — PDF, DOCX, LaTeX, Markdown, even BibTeX and CSL-JSON for reuse elsewhere. Your own name is highlighted by identifier, so it stands out correctly even in long, multi-author lists.",
      ],
      stepsHeading: "How to generate a formatted publication list",
      steps: [
        {
          title: "Sign in with ORCID",
          body: "SigmaCV reads your public ORCID and OpenAlex record to gather your publications.",
        },
        {
          title: "Pull and de-duplicate your works",
          body: "Your publications are imported by identifier and assembled into a single, clean list.",
        },
        {
          title: "Pick a citation style",
          body: "Choose any CSL style; the list reformats instantly and stays consistent across formats.",
        },
        {
          title: "Reorder and export",
          body: "Put works in the order you want and export to PDF, DOCX, LaTeX, Markdown or BibTeX.",
        },
      ],
      whyHeading: "Why generate your publication list with SigmaCV",
      why: [
        "One citation engine (the Citation Style Language, the same standard behind Zotero and Mendeley) formats your whole list, so there are no mismatched references between your Word CV and your LaTeX one. Change the style once and every output follows.",
        "It is free for individuals and open source, and it is honest about authorship: works are matched by identifier, your name is highlighted by identifier, and you curate exactly which publications appear.",
      ],
      faqExtra: [
        {
          q: "Can I choose the citation style?",
          a: "Yes. SigmaCV formats your list through CSL, so you can pick any supported style and the formatting stays identical across PDF, DOCX, LaTeX and Markdown.",
        },
        {
          q: "Can I export the list as BibTeX?",
          a: "Yes. Alongside PDF, DOCX, LaTeX and Markdown, SigmaCV can export your curated publications as BibTeX and CSL-JSON for reuse elsewhere.",
        },
        {
          q: "Can I split the list by type, like articles and preprints?",
          a: "Yes. You organize your works into sections and order them as you like; the list is fully curatable before export.",
        },
      ],
      relatedHeading: "Related CV and citation tools",
    },
    "latex-cv": {
      intro: [
        "If you write your CV in LaTeX, SigmaCV saves you the most tedious step: it generates a ready-to-compile LaTeX academic CV from your open research record, complete with a matching .bib bibliography, instead of a blank template you fill in by hand.",
        "Sign in with ORCID, curate your record, and export a .tex CV plus a .bib file you compile in your own setup. Citations are produced through CSL, so your LaTeX CV reads identically to the PDF, DOCX and Markdown versions of the same canonical CV.",
      ],
      stepsHeading: "How to generate a LaTeX academic CV",
      steps: [
        {
          title: "Sign in with ORCID",
          body: "SigmaCV builds your CV from your public ORCID and OpenAlex record — no manual BibTeX wrangling.",
        },
        {
          title: "Curate your CV",
          body: "Choose which publications and sections appear and put them in order, all from one canonical record.",
        },
        {
          title: "Export .tex and .bib",
          body: "Download a LaTeX CV with an accompanying .bib bibliography generated from your curated publications.",
        },
        {
          title: "Compile in your own setup",
          body: "Compile the .tex in Overleaf or your local TeX distribution; tweak the LaTeX freely from there.",
        },
      ],
      whyHeading: "Why generate LaTeX with SigmaCV",
      why: [
        "Hand-maintaining a .bib file and keeping it in sync with your CV is error-prone. SigmaCV assembles both the document and the bibliography from your real record, so entries are complete and citations are consistent from the start.",
        "It is free for individuals and open source, and there is no lock-in: you get plain .tex and .bib files to compile and edit however you like, and the same CV exports to other formats whenever you need them.",
      ],
      faqExtra: [
        {
          q: "What LaTeX files does SigmaCV export?",
          a: "A .tex CV plus a .bib bibliography assembled from your curated publications, so you can compile the document in your own LaTeX setup.",
        },
        {
          q: "Can I use it with Overleaf?",
          a: "Yes. The exported .tex and .bib are standard files you can upload to Overleaf or compile locally with any TeX distribution.",
        },
        {
          q: "Is this a moderncv or Overleaf template replacement?",
          a: "It complements them: rather than typing entries into a blank moderncv-style template, SigmaCV fills the content in from your record and gives you .tex and .bib to take further.",
        },
      ],
      relatedHeading: "Related CV formats",
    },
    "funder-cv-templates": {
      intro: [
        "Every funder wants its own CV format, and rebuilding your CV for each one is a chore. SigmaCV ships 58 one-click layouts for major funders, institutions and industry — including UKRI R4RI, the Royal Society, the Swiss SNSF, the US NIH and NSF, and the European ERC — applied reversibly to your open research record.",
        "Sign in with ORCID, and a single click reshapes your canonical CV into the chosen funder's layout: the right sections, in the right order, with the right titles. Switch between formats freely — applying a layout selects and reorders sections, it never deletes your data.",
      ],
      stepsHeading: "How to use funder CV templates",
      steps: [
        {
          title: "Sign in with ORCID",
          body: "SigmaCV assembles your CV from your public record so every funder layout starts from the same content.",
        },
        {
          title: "Pick a funder layout",
          body: "Choose from 58 one-click layouts — ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society and more.",
        },
        {
          title: "Curate for the application",
          body: "Adjust which publications and sections appear so the CV fits the specific call, all reversibly.",
        },
        {
          title: "Export",
          body: "Export the formatted CV to PDF, DOCX or LaTeX, with consistent citations throughout.",
        },
      ],
      whyHeading: "Why use SigmaCV for funder CVs",
      why: [
        "Funder formats differ in structure, not in your underlying record. SigmaCV separates the two: your data lives in one canonical CV, and layouts are presentation choices applied on top — so switching from an ERC CV to a UKRI R4RI narrative is a click, not a rebuild.",
        "It is free for individuals and open source, and applying a layout is always reversible. Your curation is preserved as you move between funder formats, and citations stay consistent in every one.",
      ],
      faqExtra: [
        {
          q: "Which funder formats are supported?",
          a: "58 one-click layouts spanning funder, institution and industry formats — including UKRI R4RI, the Royal Society, SNSF, NIH, NSF and ERC — each filled from your open research record.",
        },
        {
          q: "Will switching layouts lose my edits?",
          a: "No. Layouts are applied reversibly to the same canonical CV, so you can switch between funder formats and your curation is preserved.",
        },
        {
          q: "Are these the official funder forms?",
          a: "They are SigmaCV layouts modelled on each funder's structure. Always check the funder's current official guidance and templates before you submit.",
        },
      ],
      relatedHeading: "Related funder and template tools",
    },
  },
  "zh-CN": {
    "orcid-to-cv": {
      intro: [
        "把您的 ORCID iD 变成一份学术简历，通常意味着导出一份列表、再手动重新排版。SigmaCV 则自动完成这一切：使用 ORCID 登录后，它会读取您的公开记录，从 ORCID 和 OpenAlex 提取您的论文，统一格式化每一条引用，并在几分钟内组装出一份可整理、可导出的简洁学术简历。",
        "您的成果通过 ORCID iD 与您匹配——这是一个稳定的标识符，而非作为文本的姓名——因此可以避免基于姓名的工具常出现的“与我同名的另一个人”那类张冠李戴，这对常见姓名和非拉丁文字的姓名尤为重要。系统不会凭空编造任何内容，而任何不属于您的条目，只需一键即可隐藏。",
      ],
      stepsHeading: "如何将您的 ORCID iD 转换为简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "使用免费的 ORCID 登录。SigmaCV 仅读取您的公开 ORCID 记录——绝不向 ORCID 写回任何内容。",
        },
        {
          title: "简历自动填充",
          body: "SigmaCV 通过您的 ORCID iD 解析出您的 OpenAlex 作者档案，并将您的论文——以及在可获取时的任职、教育和资助——组装成一份简历草稿。",
        },
        {
          title: "整理属于您的内容",
          body: "将任何不属于您的条目标记为“不是我的”（仅隐藏，绝不删除），重新排序条目，并选择显示哪些章节。",
        },
        {
          title: "设置样式并导出",
          body: "选择一种引用样式和模板，可选地在作者列表中高亮显示您自己的姓名，然后导出为 PDF、DOCX、LaTeX 或 Markdown——或发布一个会自动重新同步的实时页面。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 从 ORCID 生成简历",
      why: [
        "ORCID 是您学术身份的可靠锚点，而 SigmaCV 正是以其本应被使用的方式来使用它：作为一个解析到您成果的标识符，而非一个靠猜测的姓名。这就是一份真正属于您的简历，与一份您要花上一个下午来修正的简历之间的区别。",
        "它对个人免费且开源，仅读取公开元数据，并让您掌控每一条内容。同一份规范简历可导出为任意格式，引用完全一致、格式正确，因此您再也无需手动重新排版任何一条参考文献。",
      ],
      faqExtra: [
        {
          q: "我需要 ORCID 账户吗？",
          a: "需要——一个免费的 ORCID iD 就是登录所需的全部，在 orcid.org 上创建大约只需一分钟。它也是让 SigmaCV 可靠找到您成果的关键。",
        },
        {
          q: "SigmaCV 会更改我的 ORCID 记录吗？",
          a: "不会。SigmaCV 仅读取您的公开 ORCID 和 OpenAlex 数据；它绝不向您的 ORCID 记录写入、编辑或添加任何内容。",
        },
        {
          q: "如果我的某篇论文缺失了怎么办？",
          a: "您可以通过 DOI 添加任何成果，SigmaCV 会从公开记录中提取其详情，并将其格式化为与简历其余部分相匹配。",
        },
      ],
      relatedHeading: "构建简历的相关方式",
    },
    "nih-biosketch": {
      intro: [
        "NIH biosketch 要求您提供对科学的贡献，以及一份经过精心挑选、按特定格式排版的论文清单。SigmaCV 让您赢在起跑线上：使用 ORCID 登录后，它会依据您公开的研究记录起草一份 NIH 风格的 biosketch，您的论文已提取就位，引用也已统一格式化。",
        "由您决定哪些贡献和哪些论文出现——biosketch 应当突出与某项具体申请最相关的成果，而 SigmaCV 让这一筛选变得快捷，而不再是复制粘贴的苦差事。由于所有内容都源自同一份规范记录，下次需要时您即可重新导出一份更新后的 biosketch。",
      ],
      stepsHeading: "如何生成 NIH biosketch",
      steps: [
        {
          title: "使用 ORCID 登录",
          body: "SigmaCV 读取您的公开 ORCID 和 OpenAlex 记录——无需手动录入您的论文清单。",
        },
        {
          title: "提取您的记录",
          body: "您的论文和个人资料会自动汇总，并通过标识符（而非姓名）与您匹配。",
        },
        {
          title: "选择您的贡献和论文",
          body: "挑选对本次申请重要的贡献和具体论文，并按您想要的顺序排列。",
        },
        {
          title: "格式化并导出",
          body: "应用 NIH 风格的版式，在全文保持引用一致，并导出为 PDF、DOCX 或 LaTeX。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 起草 biosketch",
      why: [
        "biosketch 中繁琐的部分在于汇总和格式化论文清单并保持其一致。SigmaCV 自动完成这一切，让您能够专注于叙述——您对科学的贡献——而不必再与引用格式较劲。",
        "它对个人免费且开源，并且绝不凭空编造：每一篇论文都来自公开记录、通过您的标识符匹配，而您可以精确整理显示哪些内容。",
      ],
      faqExtra: [
        {
          q: "这是 NIH 的官方表格吗？",
          a: "SigmaCV 生成的是一份 NIH 风格的 biosketch，您可将其调整套用到官方模板。请始终核对您具体资助机会所对应的最新 NIH 说明和表格。",
        },
        {
          q: "我可以为不同的申请复用我的 biosketch 吗？",
          a: "可以。由于它构建自同一份规范简历，您可重新整理显示哪些论文和贡献，并为每次申请导出一份量身定制的版本。",
        },
        {
          q: "会包含哪些论文？",
          a: "只包含您选择的那些。SigmaCV 会提出您通过标识符匹配的完整记录，由您挑选与申请最相关的子集。",
        },
      ],
      relatedHeading: "相关的资助机构简历工具",
    },
    "academic-cv-template": {
      intro: [
        "一份空白的学术简历模板，仍要您逐条录入每一项内容。SigmaCV 恰恰相反：这是一份会自动填充的学术简历。使用 ORCID 登录后，它会依据您真实的公开研究记录构建一份简洁、已格式化引用的简历，让您从自己的实际成果出发，而不是从一张白纸开始。",
        "您依然对版式和显示内容拥有完全的掌控——选择模板、挑选引用样式、重新排序章节、隐藏任何不相关的内容——但收集和格式化论文这一繁重的工作已经为您完成。它对个人免费且开源。",
      ],
      stepsHeading: "如何使用自动填充的学术简历模板",
      steps: [
        {
          title: "使用 ORCID 登录",
          body: "无需填写空白表单：SigmaCV 会读取您的公开记录，为您填充模板。",
        },
        {
          title: "从您的真实记录出发",
          body: "您的论文通过标识符从 ORCID 和 OpenAlex 提取，您的个人资料也会自动填充。",
        },
        {
          title: "选择版式与样式",
          body: "挑选一种模板和一种 CSL 引用样式；可在不同版式之间可逆切换，而不丢失您的编辑。",
        },
        {
          title: "整理并导出",
          body: "重新排序和隐藏条目，然后将同一份规范简历导出为 PDF、DOCX、LaTeX 或 Markdown。",
        },
      ],
      whyHeading: "为什么这胜过一份空白模板",
      why: [
        "模板解决了排版，却解决不了内容——您仍要找出每一篇论文、录入每一处细节、格式化每一条引用。SigmaCV 两者兼顾：它从公开记录中汇总内容，并通过同一套引用引擎格式化引用，因此每一份导出中的引用都完全一致。",
        "而且它绝不会困住您的数据：随时切换版式，以任意格式下载您的简历。没有任何内容被锁定在单一样式或托管实例上，本应用也完全支持自托管。",
      ],
      faqExtra: [
        {
          q: "我可以自定义模板吗？",
          a: "可以。您可选择模板和引用样式，重新排序和重命名章节，并决定显示哪些内容——这些都以可逆的方式应用于同一份底层简历。",
        },
        {
          q: "这个模板真的免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源，且仅读取公开的研究元数据。",
        },
        {
          q: "我必须使用自动填充的内容吗？",
          a: "不必。一切内容都可整理：保留属于您的，隐藏其余的，并通过 DOI 添加任何缺失的内容。",
        },
      ],
      relatedHeading: "相关的简历模板与格式",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex 是规模最大的开放学术成果目录之一，而 SigmaCV 能将您的 OpenAlex 档案变成一份成型的学术简历。使用 ORCID 登录后，SigmaCV 会解析出您的 OpenAlex 作者标识符，您的成果便会被导入、格式化并准备好供您整理——无需手动构建清单。",
        "匹配通过作者标识符进行（您的 OpenAlex / ORCID ID），绝不通过姓名字符串，因此您的简历反映的是您的成果，而非某位近乎同名者的成果。任何 OpenAlex 指标都严格采用选择启用并经过字段归一化，符合 DORA 原则——默认关闭，绝不使用期刊影响因子。",
      ],
      stepsHeading: "如何从 OpenAlex 构建简历",
      steps: [
        {
          title: "使用 ORCID 登录",
          body: "SigmaCV 通过您的 ORCID iD 为您解析出正确的 OpenAlex 作者档案。",
        },
        {
          title: "导入您的 OpenAlex 成果",
          body: "您的成果通过标识符提取，并自动转化为已格式化的简历条目。",
        },
        {
          title: "整理并（可选）添加指标",
          body: "隐藏任何不属于您的内容，重新排序条目，并——仅在您愿意时——开启经过字段归一化的指标。",
        },
        {
          title: "导出或发布",
          body: "导出为 PDF、DOCX、LaTeX 或 Markdown，或发布一个会从 OpenAlex 重新同步的实时页面。",
        },
      ],
      whyHeading: "为什么以这种方式使用您的 OpenAlex 档案",
      why: [
        "OpenAlex 为您的论文提供了广泛、开放的覆盖，但原始档案本身并不是一份简历。SigmaCV 把它格式化成一份简历——引用一致、版式任您选择，并在作者列表中通过标识符高亮显示您自己的姓名。",
        "它对个人免费且开源，仅读取公开元数据，并以负责任的方式对待指标：除非您选择启用，否则它们始终关闭，而且 SigmaCV 更倾向于经过字段归一化的指标，而非原始计数。",
      ],
      faqExtra: [
        {
          q: "如果我的 OpenAlex 档案有错误怎么办？",
          a: "一切由您整理：将被错误归属的成果标记为“不是我的”（仅隐藏，不删除），并通过 DOI 添加缺失的成果。您的更正会塑造您的简历，而不会改动 OpenAlex。",
        },
        {
          q: "OpenAlex 指标默认会显示吗？",
          a: "不会。指标默认关闭，完全由您选择启用。启用时，SigmaCV 更倾向于经过字段归一化的指标，且绝不显示期刊影响因子。",
        },
        {
          q: "它会通过姓名匹配我的成果吗？",
          a: "不会——它通过作者标识符（OpenAlex / ORCID ID）匹配，从而避免了同名或音译姓名常见的错误匹配。",
        },
      ],
      relatedHeading: "构建简历的相关方式",
    },
    "publication-list": {
      intro: [
        "一份已格式化的论文列表是任何学术简历的核心，也是维护起来最繁琐的部分。SigmaCV 为您生成它：使用 ORCID 登录后，它会从 ORCID 和 OpenAlex 构建一份一致、已格式化引用的论文列表，随时可重新排序并放入您的简历。",
        "选择任意 CSL 引用样式，格式在每种输出中都保持一致——PDF、DOCX、LaTeX、Markdown，甚至 BibTeX 和 CSL-JSON，可供在别处复用。您自己的姓名会通过标识符高亮显示，因此即便在冗长的多作者列表中也能正确地脱颖而出。",
      ],
      stepsHeading: "如何生成一份已格式化的论文列表",
      steps: [
        {
          title: "使用 ORCID 登录",
          body: "SigmaCV 读取您的公开 ORCID 和 OpenAlex 记录以收集您的论文。",
        },
        {
          title: "提取并去重您的成果",
          body: "您的论文通过标识符导入，并汇总为一份单一、简洁的列表。",
        },
        {
          title: "挑选引用样式",
          body: "选择任意 CSL 样式；列表会即时重新排版，并在各种格式间保持一致。",
        },
        {
          title: "重新排序并导出",
          body: "将成果按您想要的顺序排列，并导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 生成您的论文列表",
      why: [
        "同一套引用引擎（Citation Style Language，即 Zotero 和 Mendeley 背后所采用的同一标准）格式化您的整个列表，因此您的 Word 简历与 LaTeX 简历之间不会出现互不匹配的参考文献。样式只需更改一次，每种输出都会随之更新。",
        "它对个人免费且开源，并且在作者归属上诚实可靠：成果通过标识符匹配，您的姓名通过标识符高亮，而您可精确整理显示哪些论文。",
      ],
      faqExtra: [
        {
          q: "我可以选择引用样式吗？",
          a: "可以。SigmaCV 通过 CSL 格式化您的列表，因此您可选择任意支持的样式，且 PDF、DOCX、LaTeX 和 Markdown 中的格式完全一致。",
        },
        {
          q: "我可以将列表导出为 BibTeX 吗？",
          a: "可以。除 PDF、DOCX、LaTeX 和 Markdown 外，SigmaCV 还可将您整理后的论文导出为 BibTeX 和 CSL-JSON，供在别处复用。",
        },
        {
          q: "我可以按类型拆分列表吗，比如期刊文章和预印本？",
          a: "可以。您可将成果组织到不同章节并按需排序；列表在导出前完全可整理。",
        },
      ],
      relatedHeading: "相关的简历与引用工具",
    },
    "latex-cv": {
      intro: [
        "如果您用 LaTeX 撰写简历，SigmaCV 会为您省去最繁琐的一步：它会依据您公开的研究记录生成一份可直接编译的 LaTeX 学术简历，并附带一个相匹配的 .bib 参考书目，而不是一份需要您手动填写的空白模板。",
        "使用 ORCID 登录，整理您的记录，然后导出一份 .tex 简历以及一个您可在自己环境中编译的 .bib 文件。引用通过 CSL 生成，因此您的 LaTeX 简历读起来与同一份规范简历的 PDF、DOCX 和 Markdown 版本完全一致。",
      ],
      stepsHeading: "如何生成 LaTeX 学术简历",
      steps: [
        {
          title: "使用 ORCID 登录",
          body: "SigmaCV 依据您的公开 ORCID 和 OpenAlex 记录构建您的简历——无需手动摆弄 BibTeX。",
        },
        {
          title: "整理您的简历",
          body: "选择显示哪些论文和章节并将其排序，全部来自同一份规范记录。",
        },
        {
          title: "导出 .tex 和 .bib",
          body: "下载一份 LaTeX 简历，并附带一个由您整理后的论文生成的 .bib 参考书目。",
        },
        {
          title: "在您自己的环境中编译",
          body: "在 Overleaf 或您本地的 TeX 发行版中编译 .tex 文件；从那里起您可自由调整 LaTeX。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 生成 LaTeX",
      why: [
        "手动维护一个 .bib 文件并使其与简历保持同步极易出错。SigmaCV 从您真实的记录中同时组装文档和参考书目，因此条目从一开始就完整、引用始终一致。",
        "它对个人免费且开源，并且没有锁定：您得到的是纯粹的 .tex 和 .bib 文件，可随意编译和编辑，同一份简历也能在您需要时导出为其他格式。",
      ],
      faqExtra: [
        {
          q: "SigmaCV 会导出哪些 LaTeX 文件？",
          a: "一份 .tex 简历，外加一个由您整理后的论文汇编而成的 .bib 参考书目，因此您可在自己的 LaTeX 环境中编译该文档。",
        },
        {
          q: "我可以配合 Overleaf 使用吗？",
          a: "可以。导出的 .tex 和 .bib 是标准文件，您可上传到 Overleaf，或在任意 TeX 发行版中本地编译。",
        },
        {
          q: "这是要替代 moderncv 或 Overleaf 模板吗？",
          a: "它是对它们的补充：与其在空白的 moderncv 风格模板中逐条录入，不如让 SigmaCV 从您的记录中填充内容，并给您 .tex 和 .bib 以便进一步加工。",
        },
      ],
      relatedHeading: "相关的简历格式",
    },
    "funder-cv-templates": {
      intro: [
        "每家资助机构都想要自己专属的简历格式，而为每一家重新构建简历是件苦差事。SigmaCV 内置 58 种面向主要资助机构、高校和行业的一键式布局——包括 UKRI R4RI、Royal Society、瑞士 SNSF、美国 NIH 和 NSF，以及欧洲 ERC——可逆向应用于您公开的研究记录。",
        "使用 ORCID 登录，只需一键即可将您的规范简历重塑为所选资助机构的布局：正确的章节、正确的顺序、正确的标题。在各种格式之间自由切换——应用某种布局只是选择并重新排序章节，绝不会删除您的数据。",
      ],
      stepsHeading: "如何使用资助机构简历模板",
      steps: [
        {
          title: "使用 ORCID 登录",
          body: "SigmaCV 依据您的公开记录组装简历，因此每种资助机构布局都从同一份内容出发。",
        },
        {
          title: "挑选一种资助机构布局",
          body: "从 58 种一键式布局中选择——ERC、UKRI R4RI、NSF、NIH、SNSF、Royal Society 等等。",
        },
        {
          title: "为申请进行整理",
          body: "调整显示哪些论文和章节，使简历契合具体的征集要求，且一切均可逆。",
        },
        {
          title: "导出",
          body: "将格式化后的简历导出为 PDF、DOCX 或 LaTeX，全文引用保持一致。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 制作资助机构简历",
      why: [
        "资助机构格式的差异在于结构，而非您底层的记录。SigmaCV 将两者分离：您的数据存于一份规范简历中，而布局是叠加于其上的呈现选择——因此从 ERC 简历切换到 UKRI R4RI 叙述型简历只需一键，而非重新构建。",
        "它对个人免费且开源，应用某种布局也始终可逆。在各资助机构格式之间切换时，您的整理会得以保留，每一种格式中的引用也保持一致。",
      ],
      faqExtra: [
        {
          q: "支持哪些资助机构格式？",
          a: "58 种一键式布局，涵盖资助机构、高校和行业格式——包括 UKRI R4RI、Royal Society、SNSF、NIH、NSF 和 ERC——每一种都从您公开的研究记录中填充。",
        },
        {
          q: "切换布局会丢失我的编辑吗？",
          a: "不会。布局以可逆方式应用于同一份规范简历，因此您可在各资助机构格式之间切换，整理内容始终保留。",
        },
        {
          q: "这些是资助机构的官方表格吗？",
          a: "它们是仿照各资助机构结构建模的 SigmaCV 布局。提交前请始终核对该资助机构当前的官方指南和模板。",
        },
      ],
      relatedHeading: "相关的资助机构与模板工具",
    },
  },
  "es-ES": {
    "orcid-to-cv": {
      intro: [
        "Convertir tu iD ORCID en un CV académico suele implicar exportar una lista y volver a darle formato a mano. SigmaCV lo hace automáticamente: inicia sesión con ORCID y leerá tu registro público, extraerá tus publicaciones de ORCID y OpenAlex, dará formato coherente a cada cita y reunirá un CV académico limpio que puedes seleccionar y exportar en minutos.",
        "Tu trabajo se identifica mediante tu iD ORCID —un identificador estable, no tu nombre como texto—, de modo que evitas las confusiones del tipo «otra persona con mi nombre» que producen las herramientas basadas en el nombre, algo especialmente relevante para nombres comunes y nombres en alfabetos no latinos. No se inventa nada, y todo lo que no es tuyo está a un clic de quedar oculto.",
      ],
      stepsHeading: "Cómo convertir tu iD ORCID en un CV",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "Usa el inicio de sesión gratuito de ORCID. SigmaCV solo lee tu registro público de ORCID; nunca escribe nada de vuelta en ORCID.",
        },
        {
          title: "Tu CV se rellena solo",
          body: "SigmaCV resuelve tu perfil de autor de OpenAlex a partir de tu iD ORCID y reúne tus publicaciones —y, cuando están disponibles, tus puestos, tu formación y tu financiación— en un borrador de CV.",
        },
        {
          title: "Selecciona lo que es tuyo",
          body: "Marca como «no es mío» todo lo que no seas tú (queda oculto, nunca se elimina), reordena las entradas y elige qué secciones aparecen.",
        },
        {
          title: "Da estilo y exporta",
          body: "Elige un estilo de citas y una plantilla, resalta opcionalmente tu propio nombre en las listas de autores y exporta a PDF, DOCX, LaTeX o Markdown, o publica una página viva que se resincroniza.",
        },
      ],
      whyHeading: "Por qué crear tu CV desde ORCID con SigmaCV",
      why: [
        "ORCID es el ancla fiable de tu identidad científica, y SigmaCV lo usa como estaba pensado: como un identificador que resuelve a tu trabajo, no como un nombre que hay que adivinar. Esa es la diferencia entre un CV que es realmente tuyo y uno que te pasas una tarde corrigiendo.",
        "Es gratis para particulares y de código abierto, solo lee metadatos públicos y te mantiene al control de cada entrada. El mismo CV canónico se exporta a todos los formatos con citas idénticas y correctamente formateadas, así que nunca vuelves a dar formato a una referencia a mano.",
      ],
      faqExtra: [
        {
          q: "¿Necesito una cuenta de ORCID?",
          a: "Sí: un iD ORCID gratuito es todo lo que necesitas para iniciar sesión, y crearlo lleva alrededor de un minuto en orcid.org. Además, es lo que permite a SigmaCV encontrar tu trabajo de forma fiable.",
        },
        {
          q: "¿SigmaCV modifica mi registro de ORCID?",
          a: "No. SigmaCV solo lee tus datos públicos de ORCID y OpenAlex; nunca escribe, edita ni añade nada a tu registro de ORCID.",
        },
        {
          q: "¿Qué pasa si falta alguna de mis publicaciones?",
          a: "Puedes añadir cualquier trabajo por su DOI, y SigmaCV extraerá sus datos del registro abierto y le dará formato para que encaje con el resto de tu CV.",
        },
      ],
      relatedHeading: "Otras formas de crear tu CV",
    },
    "nih-biosketch": {
      intro: [
        "Un biosketch NIH pide tus contribuciones a la ciencia y una selección concreta de publicaciones, con un formato muy específico. SigmaCV te da una ventaja: inicia sesión con ORCID y redactará un biosketch al estilo NIH a partir de tu registro científico abierto, con tus publicaciones ya extraídas y las citas formateadas de forma coherente.",
        "Tú decides qué contribuciones y qué publicaciones aparecen: el biosketch debe destacar el trabajo más relevante para una solicitud concreta, y SigmaCV hace que esa selección sea rápida en lugar de un ejercicio de copiar y pegar. Como todo deriva de un único registro canónico, puedes volver a exportar un biosketch actualizado la próxima vez que lo necesites.",
      ],
      stepsHeading: "Cómo generar un biosketch NIH",
      steps: [
        {
          title: "Inicia sesión con ORCID",
          body: "SigmaCV lee tu registro público de ORCID y OpenAlex: sin introducir manualmente tu lista de publicaciones.",
        },
        {
          title: "Extrae tu registro",
          body: "Tus publicaciones y tu perfil se reúnen automáticamente, identificados por identificador en lugar de por nombre.",
        },
        {
          title: "Selecciona tus contribuciones y publicaciones",
          body: "Elige las contribuciones y las publicaciones concretas que importan para esta solicitud y colócalas en el orden que quieras.",
        },
        {
          title: "Da formato y exporta",
          body: "Aplica el diseño al estilo NIH, mantén las citas coherentes en todo el documento y exporta a PDF, DOCX o LaTeX.",
        },
      ],
      whyHeading: "Por qué redactar tu biosketch con SigmaCV",
      why: [
        "La parte tediosa de un biosketch es reunir y dar formato a la lista de publicaciones y mantenerla coherente. SigmaCV lo hace automáticamente y te deja concentrarte en la narrativa —tus contribuciones a la ciencia— en lugar de pelearte con el formato de las citas.",
        "Es gratis para particulares y de código abierto, y nunca inventa nada: cada publicación procede del registro abierto, identificada por tu identificador, y tú seleccionas exactamente lo que aparece.",
      ],
      faqExtra: [
        {
          q: "¿Es este un formulario oficial del NIH?",
          a: "SigmaCV produce un biosketch al estilo NIH que puedes adaptar a la plantilla oficial. Consulta siempre las instrucciones y los formularios vigentes del NIH para tu convocatoria de financiación concreta.",
        },
        {
          q: "¿Puedo reutilizar mi biosketch para distintas solicitudes?",
          a: "Sí. Como se construye a partir de un único CV canónico, puedes volver a seleccionar qué publicaciones y contribuciones aparecen y exportar una versión adaptada para cada solicitud.",
        },
        {
          q: "¿Qué publicaciones se incluyen?",
          a: "Solo las que elijas. SigmaCV propone tu registro completo identificado por identificador, y tú seleccionas el subconjunto más relevante para la solicitud.",
        },
      ],
      relatedHeading: "Herramientas de CV para financiadores relacionadas",
    },
    "academic-cv-template": {
      intro: [
        "Una plantilla de CV académico en blanco sigue dejándote escribir cada entrada. SigmaCV es lo contrario: un CV académico que se rellena solo. Inicia sesión con ORCID y construirá un CV limpio y con citas formateadas a partir de tu registro científico real y público, de modo que partes de tu trabajo real en lugar de una página vacía.",
        "Aun así, tienes pleno control sobre el diseño y lo que aparece —elige una plantilla, escoge un estilo de citas, reordena secciones y oculta lo que no sea relevante—, pero el trabajo pesado de reunir y dar formato a tus publicaciones ya está hecho. Es gratis para particulares y de código abierto.",
      ],
      stepsHeading: "Cómo usar la plantilla de CV académico que se rellena sola",
      steps: [
        {
          title: "Inicia sesión con ORCID",
          body: "Sin formularios en blanco que rellenar: SigmaCV lee tu registro público para completar la plantilla por ti.",
        },
        {
          title: "Parte de tu registro real",
          body: "Tus publicaciones se extraen de ORCID y OpenAlex por identificador, y tu perfil se rellena automáticamente.",
        },
        {
          title: "Elige un diseño y un estilo",
          body: "Elige una plantilla y un estilo de citas CSL; cambia entre diseños de forma reversible sin perder tus ediciones.",
        },
        {
          title: "Selecciona y exporta",
          body: "Reordena y oculta entradas y exporta el mismo CV canónico a PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Por qué esto supera a una plantilla en blanco",
      why: [
        "Las plantillas resuelven el formato, pero no el contenido: aún tienes que encontrar cada artículo, escribir cada detalle y dar formato a cada cita. SigmaCV resuelve ambas cosas: reúne el contenido del registro abierto y da formato a las citas mediante un único motor de citas, de modo que son idénticas en cada exportación.",
        "Y nunca atrapa tus datos: cambia de diseño cuando quieras y descarga tu CV en cualquier formato. Nada queda bloqueado a un único estilo ni a la instancia alojada, que es totalmente autoalojable.",
      ],
      faqExtra: [
        {
          q: "¿Puedo personalizar la plantilla?",
          a: "Sí. Eliges la plantilla y el estilo de citas, reordenas y renombras secciones, y decides qué se muestra, todo aplicado de forma reversible al mismo CV subyacente.",
        },
        {
          q: "¿La plantilla es realmente gratuita?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0, y solo lee metadatos públicos de investigación.",
        },
        {
          q: "¿Tengo que usar el contenido rellenado automáticamente?",
          a: "No. Todo es seleccionable: conserva lo que es tuyo, oculta el resto y añade lo que falte por DOI.",
        },
      ],
      relatedHeading: "Plantillas y formatos de CV relacionados",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex es uno de los mayores catálogos abiertos de trabajo científico, y SigmaCV convierte tu perfil de OpenAlex en un CV académico terminado. Inicia sesión con ORCID, SigmaCV resuelve tu identificador de autor de OpenAlex y tus trabajos se importan, se formatean y quedan listos para seleccionar, sin construir listas a mano.",
        "La identificación se hace por identificador de autor (tu OpenAlex ID / ORCID), nunca por cadena de nombre, de modo que tu CV refleja tu trabajo y no el de un casi homónimo. Cualquier métrica de OpenAlex es estrictamente opcional y normalizada por campo, en línea con DORA: desactivada por defecto, nunca el factor de impacto de una revista.",
      ],
      stepsHeading: "Cómo crear un CV a partir de OpenAlex",
      steps: [
        {
          title: "Inicia sesión con ORCID",
          body: "SigmaCV usa tu iD ORCID para resolver el perfil de autor de OpenAlex correcto para ti.",
        },
        {
          title: "Importa tus trabajos de OpenAlex",
          body: "Tus trabajos se extraen por identificador y se convierten automáticamente en entradas de CV formateadas.",
        },
        {
          title: "Selecciona y (opcionalmente) añade métricas",
          body: "Oculta todo lo que no sea tuyo, reordena las entradas y —solo si quieres— activa las métricas normalizadas por campo.",
        },
        {
          title: "Exporta o publica",
          body: "Exporta a PDF, DOCX, LaTeX o Markdown, o publica una página viva que se resincroniza desde OpenAlex.",
        },
      ],
      whyHeading: "Por qué usar tu perfil de OpenAlex de esta forma",
      why: [
        "OpenAlex te ofrece una cobertura amplia y abierta de tus publicaciones, pero un perfil en bruto no es un CV. SigmaCV lo convierte en uno: citas coherentes, un diseño a tu elección y tu propio nombre resaltado por identificador en las listas de autores.",
        "Es gratis para particulares y de código abierto, solo lee metadatos públicos y trata las métricas de forma responsable: permanecen desactivadas a menos que las actives, y SigmaCV prefiere los indicadores normalizados por campo frente a los recuentos en bruto.",
      ],
      faqExtra: [
        {
          q: "¿Qué pasa si mi perfil de OpenAlex tiene errores?",
          a: "Tú lo seleccionas todo: marca como «no es mío» los trabajos atribuidos por error (quedan ocultos, no eliminados) y añade los que falten por DOI. Tus correcciones dan forma a tu CV sin alterar OpenAlex.",
        },
        {
          q: "¿Se muestran las métricas de OpenAlex por defecto?",
          a: "No. Las métricas están desactivadas por defecto y son totalmente opcionales. Cuando se activan, SigmaCV prefiere los indicadores normalizados por campo y nunca muestra el factor de impacto de una revista.",
        },
        {
          q: "¿Identifica mi trabajo por nombre?",
          a: "No: por identificador de autor (OpenAlex ID / ORCID), lo que evita las coincidencias falsas habituales con nombres compartidos o transliterados.",
        },
      ],
      relatedHeading: "Otras formas de crear tu CV",
    },
    "publication-list": {
      intro: [
        "Una lista de publicaciones con formato es el núcleo de cualquier CV académico, y la parte más tediosa de mantener. SigmaCV la genera por ti: inicia sesión con ORCID y construirá una lista coherente y con citas formateadas de tus publicaciones a partir de ORCID y OpenAlex, lista para reordenar e incorporar a tu CV.",
        "Elige cualquier estilo de citas CSL y el formato se mantiene idéntico en cada salida: PDF, DOCX, LaTeX, Markdown e incluso BibTeX y CSL-JSON para reutilizarlos en otros lugares. Tu propio nombre se resalta por identificador, de modo que destaca correctamente incluso en listas largas con muchos autores.",
      ],
      stepsHeading: "Cómo generar una lista de publicaciones con formato",
      steps: [
        {
          title: "Inicia sesión con ORCID",
          body: "SigmaCV lee tu registro público de ORCID y OpenAlex para reunir tus publicaciones.",
        },
        {
          title: "Extrae y deduplica tus trabajos",
          body: "Tus publicaciones se importan por identificador y se reúnen en una única lista limpia.",
        },
        {
          title: "Elige un estilo de citas",
          body: "Elige cualquier estilo CSL; la lista se reformatea al instante y se mantiene coherente entre formatos.",
        },
        {
          title: "Reordena y exporta",
          body: "Coloca los trabajos en el orden que quieras y exporta a PDF, DOCX, LaTeX, Markdown o BibTeX.",
        },
      ],
      whyHeading: "Por qué generar tu lista de publicaciones con SigmaCV",
      why: [
        "Un único motor de citas (el Citation Style Language, el mismo estándar que está detrás de Zotero y Mendeley) da formato a toda tu lista, así que no hay referencias dispares entre tu CV de Word y el de LaTeX. Cambia el estilo una vez y cada salida lo sigue.",
        "Es gratis para particulares y de código abierto, y es honesto con la autoría: los trabajos se identifican por identificador, tu nombre se resalta por identificador y tú seleccionas exactamente qué publicaciones aparecen.",
      ],
      faqExtra: [
        {
          q: "¿Puedo elegir el estilo de citas?",
          a: "Sí. SigmaCV da formato a tu lista mediante CSL, por lo que puedes elegir cualquier estilo compatible y el formato se mantiene idéntico en PDF, DOCX, LaTeX y Markdown.",
        },
        {
          q: "¿Puedo exportar la lista como BibTeX?",
          a: "Sí. Además de PDF, DOCX, LaTeX y Markdown, SigmaCV puede exportar tus publicaciones seleccionadas como BibTeX y CSL-JSON para reutilizarlas en otros lugares.",
        },
        {
          q: "¿Puedo dividir la lista por tipo, como artículos y preprints?",
          a: "Sí. Organizas tus trabajos en secciones y los ordenas a tu gusto; la lista es totalmente seleccionable antes de exportar.",
        },
      ],
      relatedHeading: "Herramientas de CV y citas relacionadas",
    },
    "latex-cv": {
      intro: [
        "Si escribes tu CV en LaTeX, SigmaCV te ahorra el paso más tedioso: genera un CV académico en LaTeX listo para compilar a partir de tu registro científico abierto, con una bibliografía .bib a juego, en lugar de una plantilla en blanco que rellenas a mano.",
        "Inicia sesión con ORCID, selecciona tu registro y exporta un CV .tex más un archivo .bib que compilas en tu propio entorno. Las citas se producen mediante CSL, de modo que tu CV en LaTeX se lee igual que las versiones en PDF, DOCX y Markdown del mismo CV canónico.",
      ],
      stepsHeading: "Cómo generar un CV académico en LaTeX",
      steps: [
        {
          title: "Inicia sesión con ORCID",
          body: "SigmaCV construye tu CV a partir de tu registro público de ORCID y OpenAlex, sin tener que pelearte con BibTeX a mano.",
        },
        {
          title: "Selecciona tu CV",
          body: "Elige qué publicaciones y secciones aparecen y colócalas en orden, todo a partir de un único registro canónico.",
        },
        {
          title: "Exporta .tex y .bib",
          body: "Descarga un CV en LaTeX con una bibliografía .bib adjunta, generada a partir de tus publicaciones seleccionadas.",
        },
        {
          title: "Compila en tu propio entorno",
          body: "Compila el .tex en Overleaf o en tu distribución de TeX local; a partir de ahí, retoca el LaTeX libremente.",
        },
      ],
      whyHeading: "Por qué generar LaTeX con SigmaCV",
      why: [
        "Mantener un archivo .bib a mano y tenerlo sincronizado con tu CV es propenso a errores. SigmaCV reúne tanto el documento como la bibliografía a partir de tu registro real, de modo que las entradas están completas y las citas son coherentes desde el principio.",
        "Es gratis para particulares y de código abierto, y no hay bloqueo: obtienes archivos .tex y .bib en texto plano para compilar y editar como quieras, y el mismo CV se exporta a otros formatos siempre que los necesites.",
      ],
      faqExtra: [
        {
          q: "¿Qué archivos LaTeX exporta SigmaCV?",
          a: "Un CV .tex más una bibliografía .bib ensamblada a partir de tus publicaciones seleccionadas, para que puedas compilar el documento en tu propio entorno LaTeX.",
        },
        {
          q: "¿Puedo usarlo con Overleaf?",
          a: "Sí. Los archivos .tex y .bib exportados son archivos estándar que puedes subir a Overleaf o compilar localmente con cualquier distribución de TeX.",
        },
        {
          q: "¿Es esto un sustituto de una plantilla de moderncv o de Overleaf?",
          a: "Las complementa: en lugar de escribir entradas en una plantilla en blanco al estilo moderncv, SigmaCV rellena el contenido a partir de tu registro y te entrega .tex y .bib para seguir trabajando.",
        },
      ],
      relatedHeading: "Formatos de CV relacionados",
    },
    "funder-cv-templates": {
      intro: [
        "Cada financiador quiere su propio formato de CV, y rehacer tu CV para cada uno es un fastidio. SigmaCV incluye 58 diseños de un clic para los principales financiadores, instituciones e industria —incluidos UKRI R4RI, la Royal Society, la suiza SNSF, el estadounidense NIH y la NSF, y la europea ERC—, aplicados de forma reversible a tu registro científico abierto.",
        "Inicia sesión con ORCID y, con un solo clic, tu CV canónico se reorganiza según el diseño del financiador elegido: las secciones adecuadas, en el orden adecuado, con los títulos adecuados. Cambia entre formatos libremente: aplicar un diseño selecciona y reordena secciones, nunca elimina tus datos.",
      ],
      stepsHeading: "Cómo usar las plantillas de CV para financiadores",
      steps: [
        {
          title: "Inicia sesión con ORCID",
          body: "SigmaCV reúne tu CV a partir de tu registro público, de modo que cada diseño de financiador parte del mismo contenido.",
        },
        {
          title: "Elige un diseño de financiador",
          body: "Elige entre 58 diseños de un clic: ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society y más.",
        },
        {
          title: "Selecciona para la solicitud",
          body: "Ajusta qué publicaciones y secciones aparecen para que el CV encaje con la convocatoria concreta, todo de forma reversible.",
        },
        {
          title: "Exporta",
          body: "Exporta el CV con formato a PDF, DOCX o LaTeX, con citas coherentes en todo el documento.",
        },
      ],
      whyHeading: "Por qué usar SigmaCV para CV de financiadores",
      why: [
        "Los formatos de los financiadores difieren en la estructura, no en tu registro subyacente. SigmaCV separa ambas cosas: tus datos viven en un único CV canónico, y los diseños son opciones de presentación aplicadas por encima, de modo que pasar de un CV ERC a una narrativa UKRI R4RI es un clic, no una reconstrucción.",
        "Es gratis para particulares y de código abierto, y aplicar un diseño siempre es reversible. Tu selección se conserva al moverte entre formatos de financiadores, y las citas se mantienen coherentes en todos ellos.",
      ],
      faqExtra: [
        {
          q: "¿Qué formatos de financiadores admite?",
          a: "58 diseños de un clic que abarcan formatos de financiadores, instituciones e industria —incluidos UKRI R4RI, la Royal Society, SNSF, NIH, NSF y ERC—, cada uno rellenado a partir de tu registro científico abierto.",
        },
        {
          q: "¿Cambiar de diseño hará que pierda mis ediciones?",
          a: "No. Los diseños se aplican de forma reversible al mismo CV canónico, así que puedes cambiar entre formatos de financiadores y tu selección se conserva.",
        },
        {
          q: "¿Son estos los formularios oficiales de los financiadores?",
          a: "Son diseños de SigmaCV modelados según la estructura de cada financiador. Consulta siempre las directrices y plantillas oficiales vigentes del financiador antes de enviar tu solicitud.",
        },
      ],
      relatedHeading: "Herramientas de financiadores y plantillas relacionadas",
    },
  },
  "fr-FR": {
    "orcid-to-cv": {
      intro: [
        "Transformer votre iD ORCID en CV académique passe d'ordinaire par l'export d'une liste que l'on remet en forme à la main. SigmaCV le fait automatiquement : connectez-vous avec ORCID et il lit votre dossier public, récupère vos publications depuis ORCID et OpenAlex, met en forme chaque citation de façon cohérente et assemble un CV académique soigné, prêt à sélectionner et à exporter en quelques minutes.",
        "Vos travaux vous sont appariés par votre iD ORCID — un identifiant stable, et non votre nom sous forme de texte — ce qui vous évite les confusions « quelqu'un d'autre porte mon nom » que produisent les outils fondés sur le nom, un écueil qui pèse surtout pour les noms courants et les noms en écriture non latine. Rien n'est inventé, et tout ce qui n'est pas de vous se masque en un clic.",
      ],
      stepsHeading: "Comment transformer votre iD ORCID en CV",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "Utilisez la connexion ORCID gratuite. SigmaCV ne lit que votre dossier ORCID public — il n'écrit jamais rien dans ORCID.",
        },
        {
          title: "Votre CV se remplit tout seul",
          body: "SigmaCV résout votre profil d'auteur OpenAlex à partir de votre iD ORCID et assemble vos publications — et, le cas échéant, vos postes, votre formation et vos financements — en un CV provisoire.",
        },
        {
          title: "Sélectionnez ce qui est de vous",
          body: "Marquez « pas à moi » tout ce qui n'est pas de vous (c'est masqué, jamais supprimé), réordonnez les entrées et choisissez les sections affichées.",
        },
        {
          title: "Mettez en forme et exportez",
          body: "Choisissez un style de citations et un modèle, mettez éventuellement votre propre nom en valeur dans les listes d'auteurs, puis exportez en PDF, DOCX, LaTeX ou Markdown — ou publiez une page vivante qui se resynchronise.",
        },
      ],
      whyHeading: "Pourquoi construire votre CV depuis ORCID avec SigmaCV",
      why: [
        "ORCID est l'ancrage fiable de votre identité scientifique, et SigmaCV l'utilise tel qu'il a été conçu : comme un identifiant qui renvoie à vos travaux, et non un nom qu'il faudrait deviner. C'est toute la différence entre un CV vraiment vôtre et un CV que vous passez un après-midi à corriger.",
        "Il est gratuit pour les particuliers et open source, ne lit que les métadonnées publiques et vous laisse le contrôle de chaque entrée. Le même CV canonique s'exporte dans tous les formats avec des citations identiques et correctement mises en forme, si bien que vous ne reformatez plus jamais une référence à la main.",
      ],
      faqExtra: [
        {
          q: "Ai-je besoin d'un compte ORCID ?",
          a: "Oui — un iD ORCID gratuit suffit pour vous connecter, et sa création prend environ une minute sur orcid.org. C'est aussi ce qui permet à SigmaCV de retrouver vos travaux de façon fiable.",
        },
        {
          q: "SigmaCV modifie-t-il mon dossier ORCID ?",
          a: "Non. SigmaCV ne lit que vos données publiques ORCID et OpenAlex ; il n'écrit, ne modifie et n'ajoute jamais rien à votre dossier ORCID.",
        },
        {
          q: "Et s'il manque une de mes publications ?",
          a: "Vous pouvez ajouter n'importe quel travail par son DOI, et SigmaCV en récupère les détails depuis le dossier ouvert et le met en forme pour qu'il s'accorde au reste de votre CV.",
        },
      ],
      relatedHeading: "Autres façons de construire votre CV",
    },
    "nih-biosketch": {
      intro: [
        "Un biosketch NIH demande vos contributions à la science et une sélection ciblée de publications, mises en forme avec précision. SigmaCV vous donne une longueur d'avance : connectez-vous avec ORCID et il rédige un biosketch de style NIH à partir de votre dossier scientifique ouvert, vos publications déjà récupérées et les citations mises en forme de façon cohérente.",
        "C'est vous qui décidez des contributions et des publications affichées — le biosketch doit mettre en avant les travaux les plus pertinents pour une candidature donnée, et SigmaCV rend cette sélection rapide plutôt qu'un travail de copier-coller. Comme tout dérive d'un seul dossier canonique, vous pourrez réexporter un biosketch à jour la prochaine fois que vous en aurez besoin.",
      ],
      stepsHeading: "Comment générer un biosketch NIH",
      steps: [
        {
          title: "Connectez-vous avec ORCID",
          body: "SigmaCV lit votre dossier ORCID et OpenAlex public — aucune saisie manuelle de votre liste de publications.",
        },
        {
          title: "Récupérez votre dossier",
          body: "Vos publications et votre profil sont assemblés automatiquement, appariés par identifiant plutôt que par nom.",
        },
        {
          title: "Sélectionnez vos contributions et publications",
          body: "Choisissez les contributions et les publications précises qui comptent pour cette candidature, et mettez-les dans l'ordre voulu.",
        },
        {
          title: "Mettez en forme et exportez",
          body: "Appliquez la mise en page de style NIH, gardez des citations cohérentes d'un bout à l'autre, et exportez en PDF, DOCX ou LaTeX.",
        },
      ],
      whyHeading: "Pourquoi rédiger votre biosketch avec SigmaCV",
      why: [
        "La partie fastidieuse d'un biosketch, c'est de rassembler et mettre en forme la liste de publications tout en la gardant cohérente. SigmaCV le fait automatiquement et vous laisse vous concentrer sur le récit — vos contributions à la science — au lieu de vous battre avec la mise en forme des citations.",
        "Il est gratuit pour les particuliers et open source, et il n'invente jamais rien : chaque publication provient du dossier ouvert, appariée à votre identifiant, et vous sélectionnez exactement ce qui apparaît.",
      ],
      faqExtra: [
        {
          q: "Est-ce un formulaire NIH officiel ?",
          a: "SigmaCV produit un biosketch de style NIH que vous pouvez adapter au modèle officiel. Vérifiez toujours les instructions et formulaires NIH en vigueur pour votre appel à financement précis.",
        },
        {
          q: "Puis-je réutiliser mon biosketch pour différentes candidatures ?",
          a: "Oui. Comme il est construit à partir d'un seul CV canonique, vous pouvez resélectionner les publications et contributions affichées et exporter une version sur mesure pour chaque candidature.",
        },
        {
          q: "Quelles publications sont incluses ?",
          a: "Seulement celles que vous choisissez. SigmaCV propose l'ensemble de votre dossier apparié par identifiant, et vous sélectionnez le sous-ensemble le plus pertinent pour la candidature.",
        },
      ],
      relatedHeading: "Outils de CV pour financeurs apparentés",
    },
    "academic-cv-template": {
      intro: [
        "Un modèle de CV académique vierge vous laisse quand même saisir chaque entrée. SigmaCV, c'est l'inverse : un CV académique qui se remplit tout seul. Connectez-vous avec ORCID et il construit un CV soigné, aux citations mises en forme, à partir de votre dossier de recherche réel et public, pour que vous partiez de vos vrais travaux plutôt que d'une page blanche.",
        "Vous gardez le contrôle total de la mise en page et de ce qui apparaît — choisissez un modèle, un style de citations, réordonnez les sections et masquez tout ce qui n'est pas pertinent — mais le gros du travail, rassembler et mettre en forme vos publications, est déjà fait. C'est gratuit pour les particuliers et open source.",
      ],
      stepsHeading: "Comment utiliser le modèle de CV académique prérempli",
      steps: [
        {
          title: "Connectez-vous avec ORCID",
          body: "Aucun formulaire vierge à remplir : SigmaCV lit votre dossier public pour remplir le modèle à votre place.",
        },
        {
          title: "Partez de votre vrai dossier",
          body: "Vos publications sont récupérées depuis ORCID et OpenAlex par identifiant, et votre profil est rempli automatiquement.",
        },
        {
          title: "Choisissez une mise en page et un style",
          body: "Choisissez un modèle et un style de citations CSL ; passez d'une mise en page à l'autre de manière réversible, sans perdre vos modifications.",
        },
        {
          title: "Sélectionnez et exportez",
          body: "Réordonnez et masquez des entrées, puis exportez le même CV canonique en PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Pourquoi cela surpasse un modèle vierge",
      why: [
        "Les modèles règlent la mise en forme, mais pas le contenu — vous devez encore retrouver chaque article, saisir chaque détail et mettre en forme chaque citation. SigmaCV règle les deux : il assemble le contenu depuis le dossier ouvert et met en forme les citations via un seul moteur de citations, de sorte qu'elles sont identiques dans chaque export.",
        "Et il ne retient jamais vos données en otage : changez de mise en page quand vous le souhaitez, et téléchargez votre CV dans n'importe quel format. Rien n'est verrouillé à un style unique ni à l'instance hébergée, qui est entièrement auto-hébergeable.",
      ],
      faqExtra: [
        {
          q: "Puis-je personnaliser le modèle ?",
          a: "Oui. Vous choisissez le modèle et le style de citations, réordonnez et renommez les sections, et décidez de ce qui s'affiche — le tout appliqué de manière réversible au même CV sous-jacent.",
        },
        {
          q: "Le modèle est-il vraiment gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0, et il ne lit que les métadonnées publiques de recherche.",
        },
        {
          q: "Suis-je obligé d'utiliser le contenu prérempli ?",
          a: "Non. Tout est sélectionnable : gardez ce qui est de vous, masquez le reste, et ajoutez par DOI ce qui manque.",
        },
      ],
      relatedHeading: "Modèles et formats de CV apparentés",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex est l'un des plus grands catalogues ouverts de travaux scientifiques, et SigmaCV transforme votre profil OpenAlex en un CV académique fini. Connectez-vous avec ORCID, SigmaCV résout votre identifiant d'auteur OpenAlex, et vos travaux sont importés, mis en forme et prêts à sélectionner — sans construire de liste à la main.",
        "L'appariement se fait par identifiant d'auteur (votre ID OpenAlex / ORCID), jamais par chaîne de nom, de sorte que votre CV reflète vos travaux et non ceux d'un quasi-homonyme. Les éventuelles métriques OpenAlex sont strictement optionnelles et normalisées par domaine, conformément à DORA — désactivées par défaut, jamais un facteur d'impact de revue.",
      ],
      stepsHeading: "Comment construire un CV depuis OpenAlex",
      steps: [
        {
          title: "Connectez-vous avec ORCID",
          body: "SigmaCV utilise votre iD ORCID pour résoudre le bon profil d'auteur OpenAlex pour vous.",
        },
        {
          title: "Importez vos travaux OpenAlex",
          body: "Vos travaux sont récupérés par identifiant et transformés automatiquement en entrées de CV mises en forme.",
        },
        {
          title: "Sélectionnez et (en option) ajoutez des métriques",
          body: "Masquez tout ce qui n'est pas de vous, réordonnez les entrées et — uniquement si vous le souhaitez — activez les métriques normalisées par domaine.",
        },
        {
          title: "Exportez ou publiez",
          body: "Exportez en PDF, DOCX, LaTeX ou Markdown, ou publiez une page vivante qui se resynchronise depuis OpenAlex.",
        },
      ],
      whyHeading: "Pourquoi utiliser votre profil OpenAlex de cette façon",
      why: [
        "OpenAlex vous offre une couverture large et ouverte de vos publications, mais un profil brut n'est pas un CV. SigmaCV le met en forme pour en faire un — citations cohérentes, mise en page de votre choix, et votre propre nom mis en valeur par identifiant dans les listes d'auteurs.",
        "Il est gratuit pour les particuliers et open source, ne lit que les métadonnées publiques et traite les métriques de manière responsable : elles restent désactivées tant que vous ne les activez pas, et SigmaCV privilégie les indicateurs normalisés par domaine plutôt que les décomptes bruts.",
      ],
      faqExtra: [
        {
          q: "Et si mon profil OpenAlex comporte des erreurs ?",
          a: "Vous sélectionnez tout : marquez « pas à moi » les travaux attribués à tort (ils sont masqués, non supprimés) et ajoutez ceux qui manquent par DOI. Vos corrections façonnent votre CV sans altérer OpenAlex.",
        },
        {
          q: "Les métriques OpenAlex sont-elles affichées par défaut ?",
          a: "Non. Les métriques sont désactivées par défaut et entièrement optionnelles. Une fois activées, SigmaCV privilégie les indicateurs normalisés par domaine et n'affiche jamais un facteur d'impact de revue.",
        },
        {
          q: "Apparie-t-il mes travaux par nom ?",
          a: "Non — par identifiant d'auteur (ID OpenAlex / ORCID), ce qui évite les faux appariements fréquents avec les noms partagés ou translittérés.",
        },
      ],
      relatedHeading: "Autres façons de construire votre CV",
    },
    "publication-list": {
      intro: [
        "Une liste de publications mise en forme est le cœur de tout CV académique, et la partie la plus fastidieuse à entretenir. SigmaCV la génère pour vous : connectez-vous avec ORCID et il construit une liste cohérente, aux citations mises en forme, de vos publications depuis ORCID et OpenAlex, prête à réordonner et à insérer dans votre CV.",
        "Choisissez n'importe quel style de citations CSL et la mise en forme reste identique dans chaque sortie — PDF, DOCX, LaTeX, Markdown, et même BibTeX et CSL-JSON pour les réutiliser ailleurs. Votre propre nom est mis en valeur par identifiant, de sorte qu'il ressort correctement même dans de longues listes à auteurs multiples.",
      ],
      stepsHeading: "Comment générer une liste de publications mise en forme",
      steps: [
        {
          title: "Connectez-vous avec ORCID",
          body: "SigmaCV lit votre dossier ORCID et OpenAlex public pour rassembler vos publications.",
        },
        {
          title: "Récupérez et dédoublonnez vos travaux",
          body: "Vos publications sont importées par identifiant et assemblées en une seule liste propre.",
        },
        {
          title: "Choisissez un style de citations",
          body: "Choisissez n'importe quel style CSL ; la liste se reformate instantanément et reste cohérente d'un format à l'autre.",
        },
        {
          title: "Réordonnez et exportez",
          body: "Mettez les travaux dans l'ordre voulu et exportez en PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        },
      ],
      whyHeading: "Pourquoi générer votre liste de publications avec SigmaCV",
      why: [
        "Un seul moteur de citations (le Citation Style Language, la norme même qui sous-tend Zotero et Mendeley) met en forme toute votre liste, si bien qu'il n'y a pas de références dépareillées entre votre CV Word et votre CV LaTeX. Changez le style une fois et chaque sortie suit.",
        "Il est gratuit pour les particuliers et open source, et il est honnête sur la paternité : les travaux sont appariés par identifiant, votre nom est mis en valeur par identifiant, et vous sélectionnez exactement quelles publications apparaissent.",
      ],
      faqExtra: [
        {
          q: "Puis-je choisir le style de citations ?",
          a: "Oui. SigmaCV met en forme votre liste via CSL, vous pouvez donc choisir n'importe quel style pris en charge et la mise en forme reste identique en PDF, DOCX, LaTeX et Markdown.",
        },
        {
          q: "Puis-je exporter la liste en BibTeX ?",
          a: "Oui. En plus de PDF, DOCX, LaTeX et Markdown, SigmaCV peut exporter vos publications sélectionnées en BibTeX et CSL-JSON pour les réutiliser ailleurs.",
        },
        {
          q: "Puis-je scinder la liste par type, comme les articles et les préprints ?",
          a: "Oui. Vous organisez vos travaux en sections et les ordonnez comme vous le souhaitez ; la liste est entièrement sélectionnable avant l'export.",
        },
      ],
      relatedHeading: "Outils de CV et de citations apparentés",
    },
    "latex-cv": {
      intro: [
        "Si vous rédigez votre CV en LaTeX, SigmaCV vous épargne l'étape la plus fastidieuse : il génère un CV académique LaTeX prêt à compiler à partir de votre dossier de recherche ouvert, accompagné d'une bibliographie .bib assortie, au lieu d'un modèle vierge à remplir à la main.",
        "Connectez-vous avec ORCID, sélectionnez votre dossier, et exportez un CV .tex ainsi qu'un fichier .bib à compiler dans votre propre environnement. Les citations sont produites via CSL, de sorte que votre CV LaTeX se lit à l'identique des versions PDF, DOCX et Markdown du même CV canonique.",
      ],
      stepsHeading: "Comment générer un CV académique LaTeX",
      steps: [
        {
          title: "Connectez-vous avec ORCID",
          body: "SigmaCV construit votre CV depuis votre dossier ORCID et OpenAlex public — sans aucun bricolage manuel de BibTeX.",
        },
        {
          title: "Sélectionnez votre CV",
          body: "Choisissez quelles publications et sections apparaissent et mettez-les dans l'ordre, le tout à partir d'un seul dossier canonique.",
        },
        {
          title: "Exportez le .tex et le .bib",
          body: "Téléchargez un CV LaTeX avec une bibliographie .bib associée, générée à partir de vos publications sélectionnées.",
        },
        {
          title: "Compilez dans votre propre environnement",
          body: "Compilez le .tex dans Overleaf ou votre distribution TeX locale ; modifiez ensuite le LaTeX librement à partir de là.",
        },
      ],
      whyHeading: "Pourquoi générer du LaTeX avec SigmaCV",
      why: [
        "Entretenir un fichier .bib à la main et le garder synchronisé avec votre CV est source d'erreurs. SigmaCV assemble à la fois le document et la bibliographie depuis votre dossier réel, de sorte que les entrées sont complètes et les citations cohérentes dès le départ.",
        "Il est gratuit pour les particuliers et open source, et il n'y a aucun verrouillage : vous obtenez des fichiers .tex et .bib bruts à compiler et à modifier comme bon vous semble, et le même CV s'exporte vers d'autres formats dès que vous en avez besoin.",
      ],
      faqExtra: [
        {
          q: "Quels fichiers LaTeX SigmaCV exporte-t-il ?",
          a: "Un CV .tex et une bibliographie .bib assemblée depuis vos publications sélectionnées, pour que vous puissiez compiler le document dans votre propre environnement LaTeX.",
        },
        {
          q: "Puis-je l'utiliser avec Overleaf ?",
          a: "Oui. Les fichiers .tex et .bib exportés sont des fichiers standard que vous pouvez téléverser dans Overleaf ou compiler localement avec n'importe quelle distribution TeX.",
        },
        {
          q: "Est-ce un remplacement de moderncv ou d'un modèle Overleaf ?",
          a: "Cela les complète : plutôt que de saisir des entrées dans un modèle vierge de style moderncv, SigmaCV remplit le contenu depuis votre dossier et vous fournit le .tex et le .bib pour aller plus loin.",
        },
      ],
      relatedHeading: "Formats de CV apparentés",
    },
    "funder-cv-templates": {
      intro: [
        "Chaque financeur veut son propre format de CV, et reconstruire votre CV pour chacun est une corvée. SigmaCV propose 58 mises en page en un clic pour les grands financeurs, institutions et l'industrie — dont UKRI R4RI, la Royal Society, le SNSF suisse, les NIH et NSF américains et l'ERC européen — appliquées de manière réversible à votre dossier de recherche ouvert.",
        "Connectez-vous avec ORCID, et un seul clic remodèle votre CV canonique selon la mise en page du financeur choisi : les bonnes sections, dans le bon ordre, avec les bons intitulés. Passez librement d'un format à l'autre — appliquer une mise en page sélectionne et réordonne les sections, elle ne supprime jamais vos données.",
      ],
      stepsHeading: "Comment utiliser les modèles de CV pour financeurs",
      steps: [
        {
          title: "Connectez-vous avec ORCID",
          body: "SigmaCV assemble votre CV depuis votre dossier public pour que chaque mise en page de financeur parte du même contenu.",
        },
        {
          title: "Choisissez une mise en page de financeur",
          body: "Choisissez parmi 58 mises en page en un clic — ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society et plus encore.",
        },
        {
          title: "Sélectionnez pour la candidature",
          body: "Ajustez quelles publications et sections apparaissent pour que le CV colle à l'appel précis, le tout de manière réversible.",
        },
        {
          title: "Exportez",
          body: "Exportez le CV mis en forme en PDF, DOCX ou LaTeX, avec des citations cohérentes d'un bout à l'autre.",
        },
      ],
      whyHeading: "Pourquoi utiliser SigmaCV pour les CV de financeurs",
      why: [
        "Les formats de financeurs diffèrent par leur structure, non par votre dossier sous-jacent. SigmaCV sépare les deux : vos données vivent dans un seul CV canonique, et les mises en page sont des choix de présentation appliqués par-dessus — passer ainsi d'un CV ERC à un récit UKRI R4RI se fait en un clic, et non par une reconstruction.",
        "Il est gratuit pour les particuliers et open source, et appliquer une mise en page est toujours réversible. Votre sélection est préservée lorsque vous passez d'un format de financeur à l'autre, et les citations restent cohérentes dans chacun.",
      ],
      faqExtra: [
        {
          q: "Quels formats de financeurs sont pris en charge ?",
          a: "58 mises en page en un clic couvrant les formats de financeurs, d'institutions et d'industrie — dont UKRI R4RI, la Royal Society, SNSF, NIH, NSF et ERC — chacune remplie depuis votre dossier de recherche ouvert.",
        },
        {
          q: "Changer de mise en page va-t-il perdre mes modifications ?",
          a: "Non. Les mises en page sont appliquées de manière réversible au même CV canonique, vous pouvez donc passer d'un format de financeur à l'autre et votre sélection est préservée.",
        },
        {
          q: "Sont-ce les formulaires officiels des financeurs ?",
          a: "Ce sont des mises en page SigmaCV modelées sur la structure de chaque financeur. Vérifiez toujours les consignes et modèles officiels en vigueur du financeur avant de soumettre.",
        },
      ],
      relatedHeading: "Outils pour financeurs et modèles apparentés",
    },
  },
  "de-DE": {
    "orcid-to-cv": {
      intro: [
        "Aus Ihrer ORCID iD einen akademischen Lebenslauf zu machen, bedeutet üblicherweise, eine Liste zu exportieren und sie von Hand neu zu formatieren. SigmaCV erledigt das automatisch: Melden Sie sich mit ORCID an, und es liest Ihr öffentliches Verzeichnis, holt Ihre Publikationen aus ORCID und OpenAlex, formatiert jedes Zitat einheitlich und stellt in wenigen Minuten einen übersichtlichen akademischen Lebenslauf zusammen, den Sie auswählen und exportieren können.",
        "Ihre Arbeiten werden Ihnen über Ihre ORCID iD zugeordnet — eine stabile Kennung, nicht Ihr Name als Text — sodass Sie die „jemand mit gleichem Namen“-Verwechslungen vermeiden, die namensbasierte Werkzeuge erzeugen. Diese fallen vor allem bei häufigen Namen und bei Namen in nicht-lateinischen Schriften ins Gewicht. Nichts wird erfunden, und was nicht von Ihnen stammt, ist mit einem Klick ausgeblendet.",
      ],
      stepsHeading: "So machen Sie aus Ihrer ORCID iD einen Lebenslauf",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "Nutzen Sie die kostenlose ORCID-Anmeldung. SigmaCV liest ausschließlich Ihr öffentliches ORCID-Verzeichnis — es schreibt niemals etwas an ORCID zurück.",
        },
        {
          title: "Ihr Lebenslauf füllt sich von selbst",
          body: "SigmaCV ermittelt aus Ihrer ORCID iD Ihr OpenAlex-Autorenprofil und fügt Ihre Publikationen — und, sofern verfügbar, Ihre Positionen, Ausbildung und Förderungen — zu einem Lebenslaufentwurf zusammen.",
        },
        {
          title: "Auswählen, was Ihnen gehört",
          body: "Markieren Sie alles, was nicht von Ihnen stammt, als „Nicht von mir“ (es wird ausgeblendet, niemals gelöscht), ordnen Sie Einträge neu an und wählen Sie, welche Abschnitte erscheinen.",
        },
        {
          title: "Gestalten und exportieren",
          body: "Wählen Sie einen Zitierstil und eine Vorlage, heben Sie auf Wunsch Ihren eigenen Namen in Autorenlisten hervor und exportieren Sie dann als PDF, DOCX, LaTeX oder Markdown — oder veröffentlichen Sie eine lebende Seite, die sich neu synchronisiert.",
        },
      ],
      whyHeading: "Warum Sie Ihren Lebenslauf mit SigmaCV aus ORCID erstellen sollten",
      why: [
        "ORCID ist der verlässliche Anker für Ihre wissenschaftliche Identität, und SigmaCV nutzt es so, wie es gedacht ist: als Kennung, die zu Ihren Arbeiten führt, und nicht als Name, den man erraten muss. Das ist der Unterschied zwischen einem Lebenslauf, der wirklich Ihrer ist, und einem, den Sie einen Nachmittag lang korrigieren.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, liest ausschließlich öffentliche Metadaten und lässt Sie jeden Eintrag selbst bestimmen. Derselbe kanonische Lebenslauf wird in jedes Format mit identischen, korrekt formatierten Zitaten exportiert, sodass Sie nie wieder eine Literaturangabe von Hand neu formatieren.",
      ],
      faqExtra: [
        {
          q: "Brauche ich ein ORCID-Konto?",
          a: "Ja — eine kostenlose ORCID iD ist alles, was Sie zur Anmeldung benötigen, und ihre Erstellung dauert auf orcid.org etwa eine Minute. Sie ist außerdem das, was SigmaCV ermöglicht, Ihre Arbeiten zuverlässig zu finden.",
        },
        {
          q: "Verändert SigmaCV mein ORCID-Verzeichnis?",
          a: "Nein. SigmaCV liest ausschließlich Ihre öffentlichen ORCID- und OpenAlex-Daten; es schreibt, bearbeitet oder ergänzt niemals etwas in Ihrem ORCID-Verzeichnis.",
        },
        {
          q: "Was, wenn eine meiner Publikationen fehlt?",
          a: "Sie können jede Arbeit über ihren DOI hinzufügen, und SigmaCV holt ihre Angaben aus dem offenen Verzeichnis und formatiert sie passend zum Rest Ihres Lebenslaufs.",
        },
      ],
      relatedHeading: "Weitere Wege, Ihren Lebenslauf zu erstellen",
    },
    "nih-biosketch": {
      intro: [
        "Ein NIH-Biosketch verlangt Ihre Beiträge zur Wissenschaft und eine gezielte Auswahl von Publikationen, präzise formatiert. SigmaCV verschafft Ihnen einen Vorsprung: Melden Sie sich mit ORCID an, und es entwirft aus Ihrem offenen Forschungsverzeichnis einen Biosketch im NIH-Stil, mit bereits eingelesenen Publikationen und einheitlich formatierten Zitaten.",
        "Sie entscheiden, welche Beiträge und welche Publikationen erscheinen — der Biosketch sollte die für einen bestimmten Antrag relevantesten Arbeiten hervorheben, und SigmaCV macht diese Auswahl schnell, statt zur Copy-Paste-Übung. Da alles aus einem einzigen kanonischen Verzeichnis abgeleitet wird, können Sie beim nächsten Bedarf einen aktualisierten Biosketch erneut exportieren.",
      ],
      stepsHeading: "So erstellen Sie einen NIH-Biosketch",
      steps: [
        {
          title: "Mit ORCID anmelden",
          body: "SigmaCV liest Ihr öffentliches ORCID- und OpenAlex-Verzeichnis — keine manuelle Eingabe Ihrer Publikationsliste.",
        },
        {
          title: "Ihr Verzeichnis einlesen",
          body: "Ihre Publikationen und Ihr Profil werden automatisch zusammengefügt — über Kennungen zugeordnet, nicht über den Namen.",
        },
        {
          title: "Beiträge und Publikationen auswählen",
          body: "Wählen Sie die Beiträge und die konkreten Publikationen, die für diesen Antrag wichtig sind, und bringen Sie sie in die gewünschte Reihenfolge.",
        },
        {
          title: "Formatieren und exportieren",
          body: "Wenden Sie das Layout im NIH-Stil an, halten Sie die Zitate durchgehend einheitlich und exportieren Sie als PDF, DOCX oder LaTeX.",
        },
      ],
      whyHeading: "Warum Sie Ihren Biosketch mit SigmaCV entwerfen sollten",
      why: [
        "Der mühsame Teil eines Biosketch ist das Zusammenstellen und Formatieren der Publikationsliste und das Einheitlichhalten. SigmaCV erledigt das automatisch und lässt Sie sich auf die Erzählung konzentrieren — Ihre Beiträge zur Wissenschaft — statt mit der Zitatformatierung zu ringen.",
        "Es ist kostenlos für Einzelpersonen und quelloffen und erfindet niemals etwas: Jede Publikation stammt aus dem offenen Verzeichnis, über Ihre Kennung zugeordnet, und Sie wählen genau aus, was erscheint.",
      ],
      faqExtra: [
        {
          q: "Ist das ein offizielles NIH-Formular?",
          a: "SigmaCV erzeugt einen Biosketch im NIH-Stil, den Sie an die offizielle Vorlage anpassen können. Prüfen Sie für Ihre konkrete Förderausschreibung stets die aktuellen NIH-Anweisungen und -Formulare.",
        },
        {
          q: "Kann ich meinen Biosketch für verschiedene Anträge wiederverwenden?",
          a: "Ja. Da er aus einem einzigen kanonischen Lebenslauf erstellt wird, können Sie neu auswählen, welche Publikationen und Beiträge erscheinen, und für jeden Antrag eine zugeschnittene Fassung exportieren.",
        },
        {
          q: "Welche Publikationen sind enthalten?",
          a: "Nur die, die Sie wählen. SigmaCV schlägt Ihr vollständiges, über Kennungen zugeordnetes Verzeichnis vor, und Sie wählen die für den Antrag relevanteste Teilmenge aus.",
        },
      ],
      relatedHeading: "Weitere Förder-Lebenslaufwerkzeuge",
    },
    "academic-cv-template": {
      intro: [
        "Eine leere akademische Lebenslaufvorlage zwingt Sie weiterhin dazu, jeden Eintrag einzutippen. SigmaCV ist das Gegenteil: ein akademischer Lebenslauf, der sich selbst ausfüllt. Melden Sie sich mit ORCID an, und es erstellt aus Ihrem echten, öffentlichen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen Lebenslauf, sodass Sie von Ihren tatsächlichen Arbeiten ausgehen statt von einer leeren Seite.",
        "Sie behalten die volle Kontrolle über das Layout und das, was erscheint — wählen Sie eine Vorlage, einen Zitierstil, ordnen Sie Abschnitte neu an und blenden Sie aus, was nicht relevant ist — aber die mühsame Arbeit, Ihre Publikationen zu sammeln und zu formatieren, ist bereits erledigt. Es ist kostenlos für Einzelpersonen und quelloffen.",
      ],
      stepsHeading: "So nutzen Sie die automatisch ausgefüllte akademische Lebenslaufvorlage",
      steps: [
        {
          title: "Mit ORCID anmelden",
          body: "Kein leeres Formular zum Ausfüllen: SigmaCV liest Ihr öffentliches Verzeichnis und befüllt die Vorlage für Sie.",
        },
        {
          title: "Mit Ihrem echten Verzeichnis beginnen",
          body: "Ihre Publikationen werden über Kennungen aus ORCID und OpenAlex geholt, und Ihr Profil wird automatisch ausgefüllt.",
        },
        {
          title: "Layout und Stil wählen",
          body: "Wählen Sie eine Vorlage und einen CSL-Zitierstil; wechseln Sie reversibel zwischen Layouts, ohne Ihre Bearbeitungen zu verlieren.",
        },
        {
          title: "Auswählen und exportieren",
          body: "Ordnen Sie Einträge neu an und blenden Sie sie aus, und exportieren Sie denselben kanonischen Lebenslauf als PDF, DOCX, LaTeX oder Markdown.",
        },
      ],
      whyHeading: "Warum das eine leere Vorlage schlägt",
      why: [
        "Vorlagen lösen die Formatierung, aber nicht den Inhalt — Sie müssen weiterhin jede Arbeit finden, jedes Detail eintippen und jedes Zitat formatieren. SigmaCV löst beides: Es stellt den Inhalt aus dem offenen Verzeichnis zusammen und formatiert die Zitate über eine einzige Zitat-Engine, sodass sie in jedem Export identisch sind.",
        "Und es sperrt Ihre Daten niemals ein: Wechseln Sie das Layout, wann immer Sie möchten, und laden Sie Ihren Lebenslauf in jedem Format herunter. Nichts ist an einen einzigen Stil oder an die gehostete Instanz gebunden, die vollständig selbst hostbar ist.",
      ],
      faqExtra: [
        {
          q: "Kann ich die Vorlage anpassen?",
          a: "Ja. Sie wählen die Vorlage und den Zitierstil, ordnen Abschnitte neu an und benennen sie um und bestimmen, was angezeigt wird — reversibel auf denselben zugrunde liegenden Lebenslauf angewendet.",
        },
        {
          q: "Ist die Vorlage wirklich kostenlos?",
          a: "Ja. SigmaCV ist kostenlos für Einzelpersonen und quelloffen unter der Apache-2.0-Lizenz, und es liest ausschließlich öffentliche Forschungsmetadaten.",
        },
        {
          q: "Muss ich den automatisch ausgefüllten Inhalt verwenden?",
          a: "Nein. Alles ist auswählbar: Behalten Sie, was Ihnen gehört, blenden Sie den Rest aus und fügen Sie Fehlendes per DOI hinzu.",
        },
      ],
      relatedHeading: "Weitere Lebenslaufvorlagen und -formate",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex ist einer der größten offenen Kataloge wissenschaftlicher Arbeiten, und SigmaCV verwandelt Ihr OpenAlex-Profil in einen fertigen akademischen Lebenslauf. Melden Sie sich mit ORCID an, SigmaCV ermittelt Ihre OpenAlex-Autorenkennung, und Ihre Werke werden importiert, formatiert und sind bereit zum Auswählen — kein manuelles Listenerstellen.",
        "Die Zuordnung erfolgt über die Autorenkennung (Ihre OpenAlex- / ORCID-ID), niemals über die Namenszeichenfolge, sodass Ihr Lebenslauf Ihre Arbeiten widerspiegelt und nicht die eines Beinahe-Namensvetters. Etwaige OpenAlex-Metriken sind strikt optional und feldnormiert, im Einklang mit DORA — standardmäßig deaktiviert, niemals ein Journal-Impact-Faktor.",
      ],
      stepsHeading: "So erstellen Sie einen Lebenslauf aus OpenAlex",
      steps: [
        {
          title: "Mit ORCID anmelden",
          body: "SigmaCV nutzt Ihre ORCID iD, um das richtige OpenAlex-Autorenprofil für Sie zu ermitteln.",
        },
        {
          title: "Ihre OpenAlex-Werke importieren",
          body: "Ihre Werke werden über Kennungen geholt und automatisch in formatierte Lebenslaufeinträge umgewandelt.",
        },
        {
          title: "Auswählen und (optional) Metriken hinzufügen",
          body: "Blenden Sie aus, was nicht von Ihnen stammt, ordnen Sie Einträge neu an und schalten Sie — nur wenn Sie möchten — feldnormierte Metriken ein.",
        },
        {
          title: "Exportieren oder veröffentlichen",
          body: "Exportieren Sie als PDF, DOCX, LaTeX oder Markdown oder veröffentlichen Sie eine lebende Seite, die sich aus OpenAlex neu synchronisiert.",
        },
      ],
      whyHeading: "Warum Sie Ihr OpenAlex-Profil auf diese Weise nutzen sollten",
      why: [
        "OpenAlex bietet Ihnen eine breite, offene Abdeckung Ihrer Publikationen, aber ein rohes Profil ist kein Lebenslauf. SigmaCV formt daraus einen — einheitliche Zitate, ein Layout Ihrer Wahl und Ihr eigener Name, in Autorenlisten über die Kennung hervorgehoben.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, liest ausschließlich öffentliche Metadaten und geht verantwortungsvoll mit Metriken um: Sie bleiben deaktiviert, sofern Sie sie nicht aktivieren, und SigmaCV bevorzugt feldnormierte Indikatoren gegenüber reinen Zählungen.",
      ],
      faqExtra: [
        {
          q: "Was, wenn mein OpenAlex-Profil Fehler enthält?",
          a: "Sie wählen alles selbst aus: Markieren Sie falsch zugeordnete Werke als „Nicht von mir“ (sie werden ausgeblendet, nicht gelöscht) und fügen Sie fehlende per DOI hinzu. Ihre Korrekturen prägen Ihren Lebenslauf, ohne OpenAlex zu verändern.",
        },
        {
          q: "Werden OpenAlex-Metriken standardmäßig angezeigt?",
          a: "Nein. Metriken sind standardmäßig deaktiviert und vollständig optional. Wenn sie aktiviert sind, bevorzugt SigmaCV feldnormierte Indikatoren und zeigt niemals einen Journal-Impact-Faktor.",
        },
        {
          q: "Ordnet es meine Arbeiten über den Namen zu?",
          a: "Nein — über die Autorenkennung (OpenAlex- / ORCID-ID), was die Falschzuordnungen vermeidet, die bei geteilten oder transliterierten Namen häufig sind.",
        },
      ],
      relatedHeading: "Weitere Wege, Ihren Lebenslauf zu erstellen",
    },
    "publication-list": {
      intro: [
        "Eine formatierte Publikationsliste ist der Kern jedes akademischen Lebenslaufs — und der Teil, der am mühsamsten zu pflegen ist. SigmaCV erstellt sie für Sie: Melden Sie sich mit ORCID an, und es erstellt aus ORCID und OpenAlex eine einheitliche, mit formatierten Zitaten versehene Liste Ihrer Publikationen, bereit zum Neuanordnen und Einfügen in Ihren Lebenslauf.",
        "Wählen Sie einen beliebigen CSL-Zitierstil, und die Formatierung bleibt über jede Ausgabe hinweg identisch — PDF, DOCX, LaTeX, Markdown, sogar BibTeX und CSL-JSON zur Weiterverwendung anderswo. Ihr eigener Name wird über die Kennung hervorgehoben, sodass er auch in langen Autorenlisten mit vielen Beteiligten korrekt heraussticht.",
      ],
      stepsHeading: "So erstellen Sie eine formatierte Publikationsliste",
      steps: [
        {
          title: "Mit ORCID anmelden",
          body: "SigmaCV liest Ihr öffentliches ORCID- und OpenAlex-Verzeichnis, um Ihre Publikationen zusammenzutragen.",
        },
        {
          title: "Werke holen und entduplizieren",
          body: "Ihre Publikationen werden über Kennungen importiert und zu einer einzigen, übersichtlichen Liste zusammengefügt.",
        },
        {
          title: "Einen Zitierstil wählen",
          body: "Wählen Sie einen beliebigen CSL-Stil; die Liste wird sofort neu formatiert und bleibt über alle Formate hinweg einheitlich.",
        },
        {
          title: "Neu anordnen und exportieren",
          body: "Bringen Sie die Werke in die gewünschte Reihenfolge und exportieren Sie als PDF, DOCX, LaTeX, Markdown oder BibTeX.",
        },
      ],
      whyHeading: "Warum Sie Ihre Publikationsliste mit SigmaCV erstellen sollten",
      why: [
        "Eine einzige Zitat-Engine (die Citation Style Language, derselbe Standard, der hinter Zotero und Mendeley steht) formatiert Ihre gesamte Liste, sodass es keine voneinander abweichenden Literaturangaben zwischen Ihrem Word-Lebenslauf und Ihrem LaTeX-Lebenslauf gibt. Ändern Sie den Stil einmal, und jede Ausgabe folgt.",
        "Es ist kostenlos für Einzelpersonen und quelloffen und es ist ehrlich in Bezug auf die Autorenschaft: Werke werden über Kennungen zugeordnet, Ihr Name wird über die Kennung hervorgehoben, und Sie wählen genau aus, welche Publikationen erscheinen.",
      ],
      faqExtra: [
        {
          q: "Kann ich den Zitierstil wählen?",
          a: "Ja. SigmaCV formatiert Ihre Liste über CSL, sodass Sie jeden unterstützten Stil wählen können und die Formatierung in PDF, DOCX, LaTeX und Markdown identisch bleibt.",
        },
        {
          q: "Kann ich die Liste als BibTeX exportieren?",
          a: "Ja. Neben PDF, DOCX, LaTeX und Markdown kann SigmaCV Ihre ausgewählten Publikationen als BibTeX und CSL-JSON zur Weiterverwendung anderswo exportieren.",
        },
        {
          q: "Kann ich die Liste nach Typ aufteilen, etwa Artikel und Preprints?",
          a: "Ja. Sie ordnen Ihre Werke in Abschnitte und sortieren sie nach Belieben; die Liste ist vor dem Export vollständig auswählbar.",
        },
      ],
      relatedHeading: "Weitere Lebenslauf- und Zitatwerkzeuge",
    },
    "latex-cv": {
      intro: [
        "Wenn Sie Ihren Lebenslauf in LaTeX schreiben, erspart Ihnen SigmaCV den mühsamsten Schritt: Es erzeugt aus Ihrem offenen Forschungsverzeichnis einen kompilierbereiten akademischen LaTeX-Lebenslauf, samt passender .bib-Bibliografie, statt einer leeren Vorlage, die Sie von Hand ausfüllen.",
        "Melden Sie sich mit ORCID an, wählen Sie Ihr Verzeichnis aus und exportieren Sie einen .tex-Lebenslauf samt einer .bib-Datei, die Sie in Ihrer eigenen Umgebung kompilieren. Zitate werden über CSL erzeugt, sodass Ihr LaTeX-Lebenslauf identisch zu den PDF-, DOCX- und Markdown-Fassungen desselben kanonischen Lebenslaufs liest.",
      ],
      stepsHeading: "So erstellen Sie einen akademischen LaTeX-Lebenslauf",
      steps: [
        {
          title: "Mit ORCID anmelden",
          body: "SigmaCV erstellt Ihren Lebenslauf aus Ihrem öffentlichen ORCID- und OpenAlex-Verzeichnis — kein manuelles Hantieren mit BibTeX.",
        },
        {
          title: "Ihren Lebenslauf auswählen",
          body: "Wählen Sie, welche Publikationen und Abschnitte erscheinen, und bringen Sie sie in Reihenfolge — alles aus einem einzigen kanonischen Verzeichnis.",
        },
        {
          title: ".tex und .bib exportieren",
          body: "Laden Sie einen LaTeX-Lebenslauf samt einer begleitenden .bib-Bibliografie herunter, die aus Ihren ausgewählten Publikationen erzeugt wird.",
        },
        {
          title: "In Ihrer eigenen Umgebung kompilieren",
          body: "Kompilieren Sie die .tex-Datei in Overleaf oder Ihrer lokalen TeX-Distribution; passen Sie das LaTeX von dort aus frei an.",
        },
      ],
      whyHeading: "Warum Sie LaTeX mit SigmaCV erstellen sollten",
      why: [
        "Eine .bib-Datei von Hand zu pflegen und sie mit Ihrem Lebenslauf synchron zu halten, ist fehleranfällig. SigmaCV stellt sowohl das Dokument als auch die Bibliografie aus Ihrem echten Verzeichnis zusammen, sodass Einträge vollständig und Zitate von Anfang an einheitlich sind.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, und es gibt keine Bindung: Sie erhalten einfache .tex- und .bib-Dateien zum Kompilieren und Bearbeiten ganz nach Belieben, und derselbe Lebenslauf wird in andere Formate exportiert, wann immer Sie sie brauchen.",
      ],
      faqExtra: [
        {
          q: "Welche LaTeX-Dateien exportiert SigmaCV?",
          a: "Einen .tex-Lebenslauf samt einer .bib-Bibliografie, die aus Ihren ausgewählten Publikationen zusammengestellt wird, sodass Sie das Dokument in Ihrer eigenen LaTeX-Umgebung kompilieren können.",
        },
        {
          q: "Kann ich es mit Overleaf verwenden?",
          a: "Ja. Die exportierten .tex- und .bib-Dateien sind Standarddateien, die Sie zu Overleaf hochladen oder lokal mit jeder TeX-Distribution kompilieren können.",
        },
        {
          q: "Ist das ein Ersatz für eine moderncv- oder Overleaf-Vorlage?",
          a: "Es ergänzt sie: Statt Einträge in eine leere Vorlage im moderncv-Stil zu tippen, füllt SigmaCV den Inhalt aus Ihrem Verzeichnis aus und gibt Ihnen .tex- und .bib-Dateien zur weiteren Bearbeitung.",
        },
      ],
      relatedHeading: "Weitere Lebenslaufformate",
    },
    "funder-cv-templates": {
      intro: [
        "Jeder Förderer möchte sein eigenes Lebenslaufformat, und den Lebenslauf für jeden einzelnen neu aufzubauen, ist eine Plackerei. SigmaCV bringt 58 Ein-Klick-Layouts für große Förderer, Institutionen und die Industrie mit — darunter UKRI R4RI, die Royal Society, die Schweizer SNSF, die US-amerikanischen NIH und NSF sowie die europäische ERC — reversibel auf Ihr offenes Forschungsverzeichnis angewendet.",
        "Melden Sie sich mit ORCID an, und ein einziger Klick formt Ihren kanonischen Lebenslauf in das Layout des gewählten Förderers um: die richtigen Abschnitte, in der richtigen Reihenfolge, mit den richtigen Titeln. Wechseln Sie frei zwischen den Formaten — das Anwenden eines Layouts wählt Abschnitte aus und ordnet sie neu an, es löscht niemals Ihre Daten.",
      ],
      stepsHeading: "So nutzen Sie Förder-Lebenslaufvorlagen",
      steps: [
        {
          title: "Mit ORCID anmelden",
          body: "SigmaCV stellt Ihren Lebenslauf aus Ihrem öffentlichen Verzeichnis zusammen, sodass jedes Förderlayout vom selben Inhalt ausgeht.",
        },
        {
          title: "Ein Förderlayout wählen",
          body: "Wählen Sie aus 58 Ein-Klick-Layouts — ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society und mehr.",
        },
        {
          title: "Für den Antrag auswählen",
          body: "Passen Sie an, welche Publikationen und Abschnitte erscheinen, damit der Lebenslauf zur jeweiligen Ausschreibung passt — alles reversibel.",
        },
        {
          title: "Exportieren",
          body: "Exportieren Sie den formatierten Lebenslauf als PDF, DOCX oder LaTeX, durchgehend mit einheitlichen Zitaten.",
        },
      ],
      whyHeading: "Warum Sie SigmaCV für Förder-Lebensläufe nutzen sollten",
      why: [
        "Fördererformate unterscheiden sich in der Struktur, nicht in Ihrem zugrunde liegenden Verzeichnis. SigmaCV trennt beides: Ihre Daten liegen in einem einzigen kanonischen Lebenslauf, und Layouts sind Darstellungsentscheidungen, die darüber angewendet werden — sodass der Wechsel von einem ERC-Lebenslauf zu einer UKRI-R4RI-Erzählung ein Klick ist und kein Neuaufbau.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, und das Anwenden eines Layouts ist stets reversibel. Ihre Auswahl bleibt erhalten, während Sie zwischen Fördererformaten wechseln, und die Zitate bleiben in jedem davon einheitlich.",
      ],
      faqExtra: [
        {
          q: "Welche Fördererformate werden unterstützt?",
          a: "58 Ein-Klick-Layouts für Förderer-, Institutions- und Industrieformate — darunter UKRI R4RI, die Royal Society, SNSF, NIH, NSF und ERC — jedes aus Ihrem offenen Forschungsverzeichnis befüllt.",
        },
        {
          q: "Gehen beim Wechsel der Layouts meine Bearbeitungen verloren?",
          a: "Nein. Layouts werden reversibel auf denselben kanonischen Lebenslauf angewendet, sodass Sie zwischen Fördererformaten wechseln können und Ihre Auswahl erhalten bleibt.",
        },
        {
          q: "Sind das die offiziellen Förderer-Formulare?",
          a: "Es sind SigmaCV-Layouts, die der Struktur des jeweiligen Förderers nachgebildet sind. Prüfen Sie vor dem Einreichen stets die aktuellen offiziellen Hinweise und Vorlagen des Förderers.",
        },
      ],
      relatedHeading: "Weitere Förder- und Vorlagenwerkzeuge",
    },
  },
  "ja-JP": {
    "orcid-to-cv": {
      intro: [
        "ORCID iD を学術 CV にするには、通常はリストを書き出して手作業で整形し直す必要があります。SigmaCV はそれを自動で行います。ORCID でサインインすると、あなたの公開記録を読み取り、ORCID と OpenAlex から論文を取得し、すべての引用を一貫して整形して、数分で整理・書き出しができる洗練された学術 CV を組み立てます。",
        "あなたの業績は、テキストとしての名前ではなく、安定した識別子である ORCID iD によってあなたに照合されます。そのため、名前ベースのツールで起こる「同じ名前の別人」との取り違えを避けられます——これは、ありふれた名前やラテン文字以外の表記の名前で特に重要です。何かが捏造されることはなく、あなたのものではない項目はワンクリックで非表示にできます。",
      ],
      stepsHeading: "ORCID iD を CV にする方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "無料の ORCID ログインを使います。SigmaCV はあなたの公開 ORCID 記録のみを読み取り、ORCID に何かを書き戻すことは一切ありません。",
        },
        {
          title: "CV が自動で埋まる",
          body: "SigmaCV はあなたの ORCID iD から OpenAlex 著者プロフィールを解決し、論文を——そして利用可能であれば職歴・学歴・助成情報も——CV の下書きにまとめます。",
        },
        {
          title: "自分のものを整理する",
          body: "あなたのものでない項目は「自分のものではない」に設定し（削除はされず非表示になります）、項目を並び替え、表示するセクションを選びます。",
        },
        {
          title: "スタイルを整えて書き出す",
          body: "引用スタイルとテンプレートを選び、必要に応じて著者リスト内のあなた自身の名前をハイライトしてから、PDF・DOCX・LaTeX・Markdown に書き出します——あるいは再同期される公開ページとして公開することもできます。",
        },
      ],
      whyHeading: "SigmaCV で ORCID から CV を作る理由",
      why: [
        "ORCID は学術的アイデンティティの信頼できるアンカーであり、SigmaCV はそれを本来の使われ方どおりに使います——推測される名前としてではなく、あなたの業績に解決される識別子として。それが、本当にあなたのものである CV と、半日かけて修正することになる CV との違いです。",
        "個人には無料でオープンソースであり、読み取るのは公開メタデータのみで、すべての項目をあなたが管理し続けられます。同一の正規 CV は、同一かつ正しく整形された引用ですべての形式に書き出されるため、参考文献を二度と手作業で整形し直す必要はありません。",
      ],
      faqExtra: [
        {
          q: "ORCID アカウントは必要ですか？",
          a: "はい——サインインに必要なのは無料の ORCID iD だけで、orcid.org で約 1 分あれば作成できます。これは SigmaCV があなたの業績を確実に見つけるためにも使われます。",
        },
        {
          q: "SigmaCV は私の ORCID 記録を変更しますか？",
          a: "いいえ。SigmaCV はあなたの公開された ORCID と OpenAlex のデータを読み取るだけで、ORCID 記録に何かを書き込んだり、編集したり、追加したりすることは一切ありません。",
        },
        {
          q: "論文の一つが見つからない場合は？",
          a: "DOI を指定すればどんな業績でも追加でき、SigmaCV が公開記録からその詳細を取得して、CV の他の部分に合わせて整形します。",
        },
      ],
      relatedHeading: "CV を作る関連の方法",
    },
    "nih-biosketch": {
      intro: [
        "NIH biosketch では、科学への貢献と、厳選した論文を所定の形式で求められます。SigmaCV があなたに弾みをつけます。ORCID でサインインすると、あなたの公開された研究記録から NIH 形式の biosketch を下書きし、論文はすでに取り込まれ、引用も一貫して整形された状態になっています。",
        "どの貢献とどの論文を載せるかはあなたが決めます——biosketch は特定の申請に最も関連する業績を強調すべきものであり、SigmaCV はその選択をコピー＆ペースト作業ではなく素早いものにします。すべてが一つの正規記録から導かれるため、次に必要なときには更新した biosketch を再び書き出せます。",
      ],
      stepsHeading: "NIH biosketch を作成する方法",
      steps: [
        {
          title: "ORCID でサインイン",
          body: "SigmaCV はあなたの公開された ORCID と OpenAlex の記録を読み取ります——論文リストを手入力する必要はありません。",
        },
        {
          title: "記録を取り込む",
          body: "あなたの論文とプロフィールは自動でまとめられ、名前ではなく識別子であなたに照合されます。",
        },
        {
          title: "貢献と論文を選ぶ",
          body: "この申請にとって重要な貢献と具体的な論文を選び、希望する順序に並べます。",
        },
        {
          title: "整形して書き出す",
          body: "NIH 形式のレイアウトを適用し、全体を通して引用を一貫させ、PDF・DOCX・LaTeX に書き出します。",
        },
      ],
      whyHeading: "SigmaCV で biosketch を下書きする理由",
      why: [
        "biosketch の面倒な部分は、論文リストを組み立てて整形し、一貫性を保つことです。SigmaCV はそれを自動で行い、引用形式と格闘する代わりに、ナラティブ——あなたの科学への貢献——に集中できるようにします。",
        "個人には無料でオープンソースであり、何かを捏造することは一切ありません。すべての論文は公開記録から得られ、あなたの識別子に照合され、表示する内容はあなたが正確に整理します。",
      ],
      faqExtra: [
        {
          q: "これは公式の NIH 様式ですか？",
          a: "SigmaCV は公式テンプレートに合わせて調整できる NIH 形式の biosketch を作成します。特定の助成機会については、必ず最新の NIH の指示と様式を確認してください。",
        },
        {
          q: "biosketch を異なる申請に再利用できますか？",
          a: "はい。一つの正規 CV から作られるため、表示する論文と貢献を整理し直し、申請ごとに合わせたバージョンを書き出せます。",
        },
        {
          q: "どの論文が含まれますか？",
          a: "あなたが選んだものだけです。SigmaCV は識別子で照合したあなたの全記録を提示し、その中から申請に最も関連する一部をあなたが選びます。",
        },
      ],
      relatedHeading: "関連する助成機関 CV ツール",
    },
    "academic-cv-template": {
      intro: [
        "空白の学術 CV テンプレートでは、結局すべての項目を入力することになります。SigmaCV はその逆です——自動で埋まる学術 CV です。ORCID でサインインすると、実在するあなたの公開された研究記録から、引用が整形された洗練された CV を構築するため、空白のページではなく実際の業績から始められます。",
        "レイアウトと表示内容は引き続き完全に管理できます——テンプレートを選び、引用スタイルを選び、セクションを並び替え、関連しないものを非表示にできます——一方で、論文を集めて整形するという大変な作業はすでに済んでいます。個人には無料でオープンソースです。",
      ],
      stepsHeading: "自動入力される学術 CV テンプレートの使い方",
      steps: [
        {
          title: "ORCID でサインイン",
          body: "空白の様式を埋める必要はありません。SigmaCV があなたの公開記録を読み取り、テンプレートを埋めてくれます。",
        },
        {
          title: "実際の記録から始める",
          body: "あなたの論文は ORCID と OpenAlex から識別子で取得され、プロフィールも自動で埋まります。",
        },
        {
          title: "レイアウトとスタイルを選ぶ",
          body: "テンプレートと CSL 引用スタイルを選びます。レイアウトの切り替えは可逆的で、編集内容を失うことはありません。",
        },
        {
          title: "整理して書き出す",
          body: "項目を並び替えたり非表示にしたりしてから、同一の正規 CV を PDF・DOCX・LaTeX・Markdown に書き出します。",
        },
      ],
      whyHeading: "空白のテンプレートより優れている理由",
      why: [
        "テンプレートは整形は解決しますが、内容は解決しません——結局、すべての論文を探し、すべての詳細を入力し、すべての引用を整形しなければなりません。SigmaCV は両方を解決します。公開記録から内容を組み立て、一つの引用エンジンで引用を整形するため、どの書き出しでも引用は同一になります。",
        "そしてあなたのデータを決して囲い込みません。好きなときにレイアウトを切り替え、どの形式でも CV をダウンロードできます。単一のスタイルにも、完全にセルフホスト可能なホスト版にも縛られることはありません。",
      ],
      faqExtra: [
        {
          q: "テンプレートはカスタマイズできますか？",
          a: "はい。テンプレートと引用スタイルを選び、セクションを並び替えたり名前を変えたりし、表示する内容を決められます——いずれも同じ基盤の CV に可逆的に適用されます。",
        },
        {
          q: "テンプレートは本当に無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
        {
          q: "自動入力された内容を必ず使わなければなりませんか？",
          a: "いいえ。すべて整理可能です——自分のものは残し、それ以外は非表示にし、不足しているものは DOI で追加できます。",
        },
      ],
      relatedHeading: "関連する CV テンプレートと形式",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex は学術業績の最大級のオープンカタログの一つであり、SigmaCV はあなたの OpenAlex プロフィールを完成した学術 CV に変えます。ORCID でサインインすると、SigmaCV があなたの OpenAlex 著者識別子を解決し、あなたの成果がインポート・整形され、整理できる状態になります——手作業でのリスト作成は不要です。",
        "照合は著者識別子（あなたの OpenAlex / ORCID ID）によって行われ、名前文字列では決して行われません。そのため、あなたの CV はよく似た同名者ではなくあなたの業績を反映します。OpenAlex のメトリクスはいずれも完全にオプトインかつフィールド正規化済みで、DORA に準拠しています——デフォルトは非表示で、ジャーナルのインパクトファクターを表示することは決してありません。",
      ],
      stepsHeading: "OpenAlex から CV を作る方法",
      steps: [
        {
          title: "ORCID でサインイン",
          body: "SigmaCV はあなたの ORCID iD を使って、あなたにとって正しい OpenAlex 著者プロフィールを解決します。",
        },
        {
          title: "OpenAlex の成果をインポート",
          body: "あなたの成果は識別子で取得され、自動的に整形された CV の項目になります。",
        },
        {
          title: "整理して（任意で）メトリクスを追加",
          body: "あなたのものでない項目を非表示にし、項目を並び替え、希望する場合にのみフィールド正規化されたメトリクスを有効にできます。",
        },
        {
          title: "書き出すか公開する",
          body: "PDF・DOCX・LaTeX・Markdown に書き出すか、OpenAlex から再同期される公開ページを公開します。",
        },
      ],
      whyHeading: "OpenAlex プロフィールをこのように使う理由",
      why: [
        "OpenAlex はあなたの論文を広くオープンにカバーしますが、生のプロフィールは CV ではありません。SigmaCV はそれを CV に整形します——一貫した引用、選んだレイアウト、そして著者リスト内で識別子によりハイライトされたあなた自身の名前。",
        "個人には無料でオープンソースであり、読み取るのは公開メタデータのみで、メトリクスを責任を持って扱います。オプトインしない限りメトリクスは非表示のままで、SigmaCV は生のカウントよりフィールド正規化された指標を優先します。",
      ],
      faqExtra: [
        {
          q: "OpenAlex プロフィールに誤りがある場合は？",
          a: "すべてあなたが整理します。誤って紐づけられた成果は「自分のものではない」に設定し（削除されず非表示になります）、不足しているものは DOI で追加します。あなたの修正は OpenAlex を変えることなく、あなたの CV を形作ります。",
        },
        {
          q: "OpenAlex のメトリクスはデフォルトで表示されますか？",
          a: "いいえ。メトリクスはデフォルトで非表示で、完全にオプトインです。有効にした場合、SigmaCV はフィールド正規化された指標を優先し、ジャーナルのインパクトファクターを表示することは決してありません。",
        },
        {
          q: "業績は名前で照合されますか？",
          a: "いいえ——著者識別子（OpenAlex / ORCID ID）で照合します。これにより、共有された名前や音訳された名前でよく起こる誤った照合を防ぎます。",
        },
      ],
      relatedHeading: "CV を作る関連の方法",
    },
    "publication-list": {
      intro: [
        "整形された論文リストはあらゆる学術 CV の中核であり、維持するのが最も面倒な部分です。SigmaCV があなたの代わりにそれを生成します。ORCID でサインインすると、ORCID と OpenAlex からあなたの論文を、一貫して引用整形されたリストとして構築し、並び替えて CV に組み込める状態にします。",
        "任意の CSL 引用スタイルを選べば、整形はすべての出力——PDF・DOCX・LaTeX・Markdown、さらには他所で再利用するための BibTeX や CSL-JSON——で同一に保たれます。あなた自身の名前は識別子でハイライトされるため、長い共著者リストの中でも正しく際立ちます。",
      ],
      stepsHeading: "整形された論文リストを生成する方法",
      steps: [
        {
          title: "ORCID でサインイン",
          body: "SigmaCV はあなたの公開された ORCID と OpenAlex の記録を読み取り、論文を集めます。",
        },
        {
          title: "成果を取得して重複を除去",
          body: "あなたの論文は識別子でインポートされ、単一の整ったリストにまとめられます。",
        },
        {
          title: "引用スタイルを選ぶ",
          body: "任意の CSL スタイルを選べば、リストは即座に再整形され、各形式間で一貫性が保たれます。",
        },
        {
          title: "並び替えて書き出す",
          body: "成果を希望する順序に並べ、PDF・DOCX・LaTeX・Markdown・BibTeX に書き出します。",
        },
      ],
      whyHeading: "SigmaCV で論文リストを生成する理由",
      why: [
        "一つの引用エンジン（Citation Style Language——Zotero や Mendeley の背後にあるのと同じ標準）がリスト全体を整形するため、あなたの Word 版 CV と LaTeX 版 CV の間で参考文献が食い違うことはありません。スタイルを一度変えれば、すべての出力がそれに従います。",
        "個人には無料でオープンソースであり、著者帰属について誠実です。成果は識別子で照合され、あなたの名前は識別子でハイライトされ、表示する論文はあなたが正確に整理します。",
      ],
      faqExtra: [
        {
          q: "引用スタイルは選べますか？",
          a: "はい。SigmaCV は CSL でリストを整形するため、サポートされている任意のスタイルを選べます。整形は PDF・DOCX・LaTeX・Markdown で同一に保たれます。",
        },
        {
          q: "リストを BibTeX として書き出せますか？",
          a: "はい。PDF・DOCX・LaTeX・Markdown に加えて、SigmaCV は整理した論文を BibTeX や CSL-JSON として書き出すことができ、他所で再利用できます。",
        },
        {
          q: "論文・プレプリントなど種類別にリストを分けられますか？",
          a: "はい。成果をセクションに整理し、好きな順序に並べられます。リストは書き出し前に完全に整理可能です。",
        },
      ],
      relatedHeading: "関連する CV・引用ツール",
    },
    "latex-cv": {
      intro: [
        "CV を LaTeX で書いているなら、SigmaCV が最も面倒な工程を省きます。手作業で埋める空白のテンプレートではなく、あなたの公開された研究記録から、対応する .bib 参考文献付きのコンパイル可能な LaTeX 学術 CV を生成します。",
        "ORCID でサインインし、記録を整理して、自分の環境でコンパイルできる .tex の CV と .bib ファイルを書き出します。引用は CSL で生成されるため、あなたの LaTeX CV は、同じ正規 CV の PDF・DOCX・Markdown 版と同一の内容になります。",
      ],
      stepsHeading: "LaTeX 学術 CV を生成する方法",
      steps: [
        {
          title: "ORCID でサインイン",
          body: "SigmaCV はあなたの公開された ORCID と OpenAlex の記録から CV を構築します——手作業での BibTeX いじりは不要です。",
        },
        {
          title: "CV を整理する",
          body: "表示する論文とセクションを選んで順序を決めます——すべて一つの正規記録から行えます。",
        },
        {
          title: ".tex と .bib を書き出す",
          body: "整理した論文から生成された .bib 参考文献を伴う LaTeX CV をダウンロードします。",
        },
        {
          title: "自分の環境でコンパイルする",
          body: ".tex を Overleaf やローカルの TeX ディストリビューションでコンパイルし、そこから LaTeX を自由に調整します。",
        },
      ],
      whyHeading: "SigmaCV で LaTeX を生成する理由",
      why: [
        ".bib ファイルを手作業で維持し、CV と同期させ続けるのは間違いが起こりやすい作業です。SigmaCV はあなたの実際の記録からドキュメントと参考文献の両方を組み立てるため、項目は完全で、引用は最初から一貫しています。",
        "個人には無料でオープンソースであり、囲い込みはありません。好きなようにコンパイル・編集できるプレーンな .tex と .bib ファイルが手に入り、必要なときにはいつでも同じ CV を他の形式に書き出せます。",
      ],
      faqExtra: [
        {
          q: "SigmaCV はどの LaTeX ファイルを書き出しますか？",
          a: ".tex の CV と、整理した論文から組み立てた .bib 参考文献です。自分の LaTeX 環境でドキュメントをコンパイルできます。",
        },
        {
          q: "Overleaf で使えますか？",
          a: "はい。書き出される .tex と .bib は標準的なファイルで、Overleaf にアップロードしたり、任意の TeX ディストリビューションでローカルにコンパイルしたりできます。",
        },
        {
          q: "これは moderncv や Overleaf のテンプレートの代わりですか？",
          a: "それらを補完するものです。空白の moderncv 風テンプレートに項目を入力する代わりに、SigmaCV があなたの記録から内容を埋め、さらに手を加えられる .tex と .bib を提供します。",
        },
      ],
      relatedHeading: "関連する CV 形式",
    },
    "funder-cv-templates": {
      intro: [
        "どの助成機関も独自の CV 形式を求めるため、機関ごとに CV を作り直すのは骨の折れる作業です。SigmaCV は主要な助成機関・機関・業界向けの 58 種のワンクリックレイアウト——UKRI R4RI、Royal Society、スイスの SNSF、米国の NIH と NSF、欧州の ERC など——を備え、あなたの公開された研究記録に可逆的に適用します。",
        "ORCID でサインインすると、ワンクリックであなたの正規 CV を選んだ助成機関のレイアウトに作り変えます——適切なセクションを、適切な順序で、適切な見出しで。形式間を自由に切り替えられます——レイアウトの適用はセクションを選んで並び替えるだけで、あなたのデータを削除することは決してありません。",
      ],
      stepsHeading: "助成機関 CV テンプレートの使い方",
      steps: [
        {
          title: "ORCID でサインイン",
          body: "SigmaCV はあなたの公開記録から CV を組み立てるため、どの助成機関レイアウトも同じ内容から始まります。",
        },
        {
          title: "助成機関レイアウトを選ぶ",
          body: "58 種のワンクリックレイアウト——ERC、UKRI R4RI、NSF、NIH、SNSF、Royal Society など——から選びます。",
        },
        {
          title: "申請に合わせて整理する",
          body: "表示する論文とセクションを調整し、CV を特定の公募に合わせます——すべて可逆的に行えます。",
        },
        {
          title: "書き出す",
          body: "整形した CV を PDF・DOCX・LaTeX に書き出します。全体を通して引用は一貫しています。",
        },
      ],
      whyHeading: "助成機関 CV に SigmaCV を使う理由",
      why: [
        "助成機関の形式が異なるのは構造であって、あなたの基盤となる記録ではありません。SigmaCV はこの二つを切り離します。あなたのデータは一つの正規 CV に存在し、レイアウトはその上に適用される表示上の選択です——だから ERC の CV から UKRI R4RI のナラティブへの切り替えは、作り直しではなくワンクリックです。",
        "個人には無料でオープンソースであり、レイアウトの適用は常に可逆的です。助成機関の形式間を移動してもあなたの整理内容は保持され、引用はどの形式でも一貫しています。",
      ],
      faqExtra: [
        {
          q: "どの助成機関フォーマットに対応していますか？",
          a: "助成機関・機関・業界の各フォーマットにわたる 58 種のワンクリックレイアウト——UKRI R4RI、Royal Society、SNSF、NIH、NSF、ERC を含む——で、それぞれあなたの公開された研究記録から入力されます。",
        },
        {
          q: "レイアウトを切り替えると編集内容は失われますか？",
          a: "いいえ。レイアウトは同一の正規 CV に可逆的に適用されるため、助成機関フォーマット間を切り替えても整理内容は保持されます。",
        },
        {
          q: "これらは公式の助成機関様式ですか？",
          a: "これらは各助成機関の構造をモデルにした SigmaCV のレイアウトです。提出前には必ず、その助成機関の最新の公式ガイダンスとテンプレートを確認してください。",
        },
      ],
      relatedHeading: "関連する助成機関・テンプレートツール",
    },
  },
  "pt-BR": {
    "orcid-to-cv": {
      intro: [
        "Transformar seu ORCID iD em um currículo acadêmico geralmente significa exportar uma lista e reformatá-la à mão. O SigmaCV faz isso automaticamente: entre com o ORCID e ele lê o seu registro público, extrai suas publicações do ORCID e do OpenAlex, formata cada citação de maneira consistente e monta um currículo acadêmico limpo que você pode curar e exportar em minutos.",
        'Seu trabalho é correspondido a você pelo seu ORCID iD — um identificador estável, não o seu nome como texto —, de modo que você evita as confusões do tipo "alguém com o mesmo nome que eu" produzidas por ferramentas baseadas em nome, que pesam mais no caso de nomes comuns e de nomes em escritas não latinas. Nada é inventado, e qualquer coisa que não seja sua fica a um clique de ser ocultada.',
      ],
      stepsHeading: "Como transformar seu ORCID iD em um currículo",
      steps: [
        {
          title: "Entre com seu ORCID iD",
          body: "Use o login gratuito do ORCID. O SigmaCV lê apenas o seu registro público do ORCID — ele nunca escreve nada de volta no ORCID.",
        },
        {
          title: "Seu currículo se preenche sozinho",
          body: "O SigmaCV resolve o seu perfil de autor no OpenAlex a partir do seu ORCID iD e reúne suas publicações — e, quando disponíveis, seus cargos, formação e financiamentos — em um rascunho de currículo.",
        },
        {
          title: "Cure o que é seu",
          body: 'Marque como "não é meu" qualquer coisa que não seja você (ela fica oculta, nunca é excluída), reordene as entradas e escolha quais seções aparecem.',
        },
        {
          title: "Estilize e exporte",
          body: "Escolha um estilo de citações e um modelo, opcionalmente destaque seu próprio nome nas listas de autores e, em seguida, exporte para PDF, DOCX, LaTeX ou Markdown — ou publique uma página viva que se ressincroniza.",
        },
      ],
      whyHeading: "Por que montar seu currículo a partir do ORCID com o SigmaCV",
      why: [
        "O ORCID é a âncora confiável da sua identidade acadêmica, e o SigmaCV o usa da forma como ele foi pensado: como um identificador que resolve para o seu trabalho, não como um nome a ser adivinhado. Essa é a diferença entre um currículo que é genuinamente seu e um que você passa uma tarde inteira corrigindo.",
        "Ele é gratuito para indivíduos e de código aberto, lê apenas metadados públicos e mantém você no controle de cada entrada. O mesmo currículo canônico é exportado para todos os formatos com citações idênticas e corretamente formatadas, então você nunca mais reformata uma referência à mão.",
      ],
      faqExtra: [
        {
          q: "Preciso de uma conta ORCID?",
          a: "Sim — um ORCID iD gratuito é tudo o que você precisa para entrar, e leva cerca de um minuto para criar em orcid.org. É também o que permite ao SigmaCV encontrar seu trabalho de forma confiável.",
        },
        {
          q: "O SigmaCV altera o meu registro do ORCID?",
          a: "Não. O SigmaCV apenas lê seus dados públicos do ORCID e do OpenAlex; ele nunca escreve, edita ou adiciona nada ao seu registro do ORCID.",
        },
        {
          q: "E se uma das minhas publicações estiver faltando?",
          a: "Você pode adicionar qualquer trabalho pelo seu DOI, e o SigmaCV extrai os detalhes do registro aberto e os formata para combinar com o restante do seu currículo.",
        },
      ],
      relatedHeading: "Outras formas de montar seu currículo",
    },
    "nih-biosketch": {
      intro: [
        "Um biosketch NIH pede suas contribuições para a ciência e uma seleção focada de publicações, formatadas de um jeito bem específico. O SigmaCV te dá uma vantagem inicial: entre com o ORCID e ele redige um biosketch no estilo NIH a partir do seu registro de pesquisa aberto, com suas publicações já extraídas e as citações formatadas de maneira consistente.",
        "Você decide quais contribuições e quais publicações aparecem — o biosketch deve destacar o trabalho mais relevante para uma candidatura específica, e o SigmaCV torna essa seleção rápida em vez de um exercício de copiar e colar. Como tudo deriva de um único registro canônico, você pode reexportar um biosketch atualizado na próxima vez que precisar.",
      ],
      stepsHeading: "Como gerar um biosketch NIH",
      steps: [
        {
          title: "Entre com o ORCID",
          body: "O SigmaCV lê o seu registro público do ORCID e do OpenAlex — sem digitação manual da sua lista de publicações.",
        },
        {
          title: "Importe o seu registro",
          body: "Suas publicações e seu perfil são reunidos automaticamente, correspondidos a você por identificador em vez de por nome.",
        },
        {
          title: "Selecione suas contribuições e publicações",
          body: "Escolha as contribuições e as publicações específicas que importam para esta candidatura e coloque-as na ordem que quiser.",
        },
        {
          title: "Formate e exporte",
          body: "Aplique o layout no estilo NIH, mantenha as citações consistentes em todo o documento e exporte para PDF, DOCX ou LaTeX.",
        },
      ],
      whyHeading: "Por que redigir seu biosketch com o SigmaCV",
      why: [
        "A parte tediosa de um biosketch é reunir e formatar a lista de publicações e mantê-la consistente. O SigmaCV faz isso automaticamente e deixa você se concentrar na narrativa — suas contribuições para a ciência — em vez de brigar com a formatação das citações.",
        "Ele é gratuito para indivíduos e de código aberto, e nunca inventa nada: cada publicação vem do registro aberto, correspondida ao seu identificador, e você cura exatamente o que aparece.",
      ],
      faqExtra: [
        {
          q: "Este é um formulário oficial do NIH?",
          a: "O SigmaCV produz um biosketch no estilo NIH que você pode adaptar ao modelo oficial. Sempre verifique as instruções e os formulários atuais do NIH para a sua oportunidade de financiamento específica.",
        },
        {
          q: "Posso reutilizar meu biosketch para diferentes candidaturas?",
          a: "Sim. Como ele é construído a partir de um único currículo canônico, você pode recurar quais publicações e contribuições aparecem e exportar uma versão sob medida para cada candidatura.",
        },
        {
          q: "Quais publicações são incluídas?",
          a: "Apenas as que você escolher. O SigmaCV propõe o seu registro completo, correspondido por identificador, e você seleciona o subconjunto mais relevante para a candidatura.",
        },
      ],
      relatedHeading: "Ferramentas de currículo para financiadores relacionadas",
    },
    "academic-cv-template": {
      intro: [
        "Um modelo de currículo acadêmico em branco ainda deixa você digitando cada entrada. O SigmaCV é o oposto: um currículo acadêmico que se preenche sozinho. Entre com o ORCID e ele constrói um currículo limpo, com citações formatadas, a partir do seu registro de pesquisa real e público, de modo que você parte do seu trabalho de fato em vez de uma página vazia.",
        "Você ainda tem controle total sobre o layout e sobre o que aparece — escolha um modelo, um estilo de citações, reordene seções e oculte o que não for relevante —, mas o trabalho pesado de reunir e formatar suas publicações já está feito. Ele é gratuito para indivíduos e de código aberto.",
      ],
      stepsHeading: "Como usar o modelo de currículo acadêmico preenchido automaticamente",
      steps: [
        {
          title: "Entre com o ORCID",
          body: "Nenhum formulário em branco para preencher: o SigmaCV lê o seu registro público para preencher o modelo por você.",
        },
        {
          title: "Comece pelo seu registro real",
          body: "Suas publicações são extraídas do ORCID e do OpenAlex por identificador, e o seu perfil é preenchido automaticamente.",
        },
        {
          title: "Escolha um layout e um estilo",
          body: "Escolha um modelo e um estilo de citações CSL; alterne entre layouts de forma reversível, sem perder suas edições.",
        },
        {
          title: "Cure e exporte",
          body: "Reordene e oculte entradas e, em seguida, exporte o mesmo currículo canônico para PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Por que isso supera um modelo em branco",
      why: [
        "Modelos resolvem a formatação, mas não o conteúdo — você ainda tem que encontrar cada artigo, digitar cada detalhe e formatar cada citação. O SigmaCV resolve os dois: ele reúne o conteúdo a partir do registro aberto e formata as citações por meio de um único mecanismo de citações, de modo que elas ficam idênticas em todas as exportações.",
        "E ele nunca aprisiona seus dados: troque de layout quando quiser e baixe seu currículo em qualquer formato. Nada fica preso a um único estilo nem à instância hospedada, que é totalmente auto-hospedável.",
      ],
      faqExtra: [
        {
          q: "Posso personalizar o modelo?",
          a: "Sim. Você escolhe o modelo e o estilo de citações, reordena e renomeia seções e decide o que aparece — aplicado de forma reversível ao mesmo currículo subjacente.",
        },
        {
          q: "O modelo é realmente gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0, e lê apenas metadados públicos de pesquisa.",
        },
        {
          q: "Sou obrigado a usar o conteúdo preenchido automaticamente?",
          a: "Não. Tudo é curável: mantenha o que é seu, oculte o resto e adicione pelo DOI o que estiver faltando.",
        },
      ],
      relatedHeading: "Modelos e formatos de currículo relacionados",
    },
    "openalex-cv": {
      intro: [
        "O OpenAlex é um dos maiores catálogos abertos de produção acadêmica, e o SigmaCV transforma o seu perfil no OpenAlex em um currículo acadêmico pronto. Entre com o ORCID, o SigmaCV resolve o seu identificador de autor no OpenAlex, e seus trabalhos são importados, formatados e prontos para curar — sem montar listas à mão.",
        "A correspondência é feita por identificador de autor (seu OpenAlex ID / ORCID ID), nunca pela cadeia de nome, então o seu currículo reflete o seu trabalho, e não o de um quase homônimo. Quaisquer métricas do OpenAlex são estritamente opcionais e normalizadas por campo, em linha com o DORA — desativadas por padrão, nunca o Fator de Impacto de uma revista.",
      ],
      stepsHeading: "Como montar um currículo a partir do OpenAlex",
      steps: [
        {
          title: "Entre com o ORCID",
          body: "O SigmaCV usa o seu ORCID iD para resolver o perfil de autor correto no OpenAlex para você.",
        },
        {
          title: "Importe seus trabalhos do OpenAlex",
          body: "Seus trabalhos são extraídos por identificador e transformados automaticamente em entradas de currículo formatadas.",
        },
        {
          title: "Cure e (opcionalmente) adicione métricas",
          body: "Oculte tudo o que não for seu, reordene as entradas e — só se quiser — ative métricas normalizadas por campo.",
        },
        {
          title: "Exporte ou publique",
          body: "Exporte para PDF, DOCX, LaTeX ou Markdown, ou publique uma página viva que se ressincroniza a partir do OpenAlex.",
        },
      ],
      whyHeading: "Por que usar seu perfil no OpenAlex desta forma",
      why: [
        "O OpenAlex oferece uma cobertura ampla e aberta das suas publicações, mas um perfil bruto não é um currículo. O SigmaCV o formata em um — citações consistentes, um layout à sua escolha e o seu próprio nome destacado por identificador nas listas de autores.",
        "Ele é gratuito para indivíduos e de código aberto, lê apenas metadados públicos e trata as métricas de forma responsável: elas permanecem desativadas a menos que você opte por usá-las, e o SigmaCV prefere indicadores normalizados por campo a contagens brutas.",
      ],
      faqExtra: [
        {
          q: "E se o meu perfil no OpenAlex tiver erros?",
          a: 'Você cura tudo: marque como "não é meu" os trabalhos atribuídos por engano (eles ficam ocultos, não excluídos) e adicione os que estiverem faltando pelo DOI. Suas correções moldam o seu currículo sem alterar o OpenAlex.',
        },
        {
          q: "As métricas do OpenAlex são exibidas por padrão?",
          a: "Não. As métricas ficam desativadas por padrão e são totalmente opcionais. Quando ativadas, o SigmaCV prefere indicadores normalizados por campo e nunca mostra o Fator de Impacto de uma revista.",
        },
        {
          q: "Ele corresponde meu trabalho pelo nome?",
          a: "Não — por identificador de autor (OpenAlex ID / ORCID ID), o que evita as correspondências falsas comuns com nomes compartilhados ou transliterados.",
        },
      ],
      relatedHeading: "Outras formas de montar seu currículo",
    },
    "publication-list": {
      intro: [
        "Uma lista de publicações formatada é o núcleo de qualquer currículo acadêmico, e a parte mais tediosa de manter. O SigmaCV a gera por você: entre com o ORCID e ele constrói uma lista consistente, com citações formatadas, das suas publicações a partir do ORCID e do OpenAlex, pronta para reordenar e inserir no seu currículo.",
        "Escolha qualquer estilo de citações CSL e a formatação permanece idêntica em todas as saídas — PDF, DOCX, LaTeX, Markdown e até BibTeX e CSL-JSON para reutilizar em outros lugares. Seu próprio nome é destacado por identificador, então ele se sobressai corretamente mesmo em listas longas com muitos autores.",
      ],
      stepsHeading: "Como gerar uma lista de publicações formatada",
      steps: [
        {
          title: "Entre com o ORCID",
          body: "O SigmaCV lê o seu registro público do ORCID e do OpenAlex para reunir suas publicações.",
        },
        {
          title: "Extraia e desduplique seus trabalhos",
          body: "Suas publicações são importadas por identificador e reunidas em uma única lista limpa.",
        },
        {
          title: "Escolha um estilo de citações",
          body: "Escolha qualquer estilo CSL; a lista é reformatada instantaneamente e permanece consistente entre os formatos.",
        },
        {
          title: "Reordene e exporte",
          body: "Coloque os trabalhos na ordem que quiser e exporte para PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        },
      ],
      whyHeading: "Por que gerar sua lista de publicações com o SigmaCV",
      why: [
        "Um único mecanismo de citações (a Citation Style Language, o mesmo padrão por trás do Zotero e do Mendeley) formata toda a sua lista, então não há referências divergentes entre o seu currículo em Word e o seu currículo em LaTeX. Mude o estilo uma vez e cada saída acompanha.",
        "Ele é gratuito para indivíduos e de código aberto, e é honesto quanto à autoria: os trabalhos são correspondidos por identificador, seu nome é destacado por identificador, e você cura exatamente quais publicações aparecem.",
      ],
      faqExtra: [
        {
          q: "Posso escolher o estilo de citações?",
          a: "Sim. O SigmaCV formata sua lista por meio do CSL, então você pode escolher qualquer estilo compatível e a formatação permanece idêntica em PDF, DOCX, LaTeX e Markdown.",
        },
        {
          q: "Posso exportar a lista como BibTeX?",
          a: "Sim. Além de PDF, DOCX, LaTeX e Markdown, o SigmaCV pode exportar suas publicações curadas como BibTeX e CSL-JSON para reutilização em outros lugares.",
        },
        {
          q: "Posso separar a lista por tipo, como artigos e preprints?",
          a: "Sim. Você organiza seus trabalhos em seções e os ordena como quiser; a lista é totalmente curável antes da exportação.",
        },
      ],
      relatedHeading: "Ferramentas de currículo e citações relacionadas",
    },
    "latex-cv": {
      intro: [
        "Se você escreve seu currículo em LaTeX, o SigmaCV poupa a etapa mais tediosa: ele gera um currículo acadêmico em LaTeX pronto para compilar a partir do seu registro de pesquisa aberto, com uma bibliografia .bib correspondente, em vez de um modelo em branco que você preenche à mão.",
        "Entre com o ORCID, cure o seu registro e exporte um currículo .tex mais um arquivo .bib que você compila no seu próprio ambiente. As citações são produzidas via CSL, então o seu currículo em LaTeX fica idêntico às versões em PDF, DOCX e Markdown do mesmo currículo canônico.",
      ],
      stepsHeading: "Como gerar um currículo acadêmico em LaTeX",
      steps: [
        {
          title: "Entre com o ORCID",
          body: "O SigmaCV constrói o seu currículo a partir do seu registro público do ORCID e do OpenAlex — sem precisar lidar com BibTeX manualmente.",
        },
        {
          title: "Cure o seu currículo",
          body: "Escolha quais publicações e seções aparecem e coloque-as em ordem, tudo a partir de um único registro canônico.",
        },
        {
          title: "Exporte .tex e .bib",
          body: "Baixe um currículo em LaTeX com uma bibliografia .bib anexa, gerada a partir das suas publicações curadas.",
        },
        {
          title: "Compile no seu próprio ambiente",
          body: "Compile o .tex no Overleaf ou na sua distribuição TeX local; ajuste o LaTeX livremente a partir daí.",
        },
      ],
      whyHeading: "Por que gerar LaTeX com o SigmaCV",
      why: [
        "Manter um arquivo .bib à mão e mantê-lo em sincronia com o seu currículo é propenso a erros. O SigmaCV monta tanto o documento quanto a bibliografia a partir do seu registro real, então as entradas ficam completas e as citações ficam consistentes desde o início.",
        "Ele é gratuito para indivíduos e de código aberto, e não há aprisionamento: você recebe arquivos .tex e .bib comuns para compilar e editar como quiser, e o mesmo currículo é exportado para outros formatos sempre que você precisar.",
      ],
      faqExtra: [
        {
          q: "Quais arquivos LaTeX o SigmaCV exporta?",
          a: "Um currículo .tex mais uma bibliografia .bib montada a partir das suas publicações curadas, para que você possa compilar o documento no seu próprio ambiente LaTeX.",
        },
        {
          q: "Posso usá-lo com o Overleaf?",
          a: "Sim. Os arquivos .tex e .bib exportados são arquivos padrão que você pode enviar para o Overleaf ou compilar localmente com qualquer distribuição TeX.",
        },
        {
          q: "Isto é um substituto para o moderncv ou para os modelos do Overleaf?",
          a: "Ele os complementa: em vez de digitar entradas em um modelo em branco no estilo moderncv, o SigmaCV preenche o conteúdo a partir do seu registro e te entrega .tex e .bib para levar adiante.",
        },
      ],
      relatedHeading: "Formatos de currículo relacionados",
    },
    "funder-cv-templates": {
      intro: [
        "Cada financiador quer o seu próprio formato de currículo, e reconstruir o seu currículo para cada um é uma chatice. O SigmaCV vem com 58 layouts em um clique para os principais financiadores, instituições e a indústria — incluindo UKRI R4RI, Royal Society, a suíça SNSF, o NIH e a NSF dos EUA e o ERC europeu —, aplicados de forma reversível ao seu registro de pesquisa aberto.",
        "Entre com o ORCID e, com um único clique, seu currículo canônico se reorganiza no layout do financiador escolhido: as seções certas, na ordem certa, com os títulos certos. Alterne entre formatos livremente — aplicar um layout seleciona e reordena seções, ele nunca exclui seus dados.",
      ],
      stepsHeading: "Como usar os modelos de currículo para financiadores",
      steps: [
        {
          title: "Entre com o ORCID",
          body: "O SigmaCV monta o seu currículo a partir do seu registro público, de modo que todo layout de financiador parte do mesmo conteúdo.",
        },
        {
          title: "Escolha um layout de financiador",
          body: "Escolha entre 58 layouts em um clique — ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society e mais.",
        },
        {
          title: "Cure para a candidatura",
          body: "Ajuste quais publicações e seções aparecem para que o currículo se encaixe na chamada específica, tudo de forma reversível.",
        },
        {
          title: "Exporte",
          body: "Exporte o currículo formatado para PDF, DOCX ou LaTeX, com citações consistentes em todo o documento.",
        },
      ],
      whyHeading: "Por que usar o SigmaCV para currículos de financiadores",
      why: [
        "Os formatos dos financiadores diferem na estrutura, não no seu registro subjacente. O SigmaCV separa as duas coisas: seus dados ficam em um único currículo canônico, e os layouts são escolhas de apresentação aplicadas por cima — então passar de um currículo ERC para uma narrativa UKRI R4RI é um clique, não uma reconstrução.",
        "Ele é gratuito para indivíduos e de código aberto, e aplicar um layout é sempre reversível. Sua curadoria é preservada à medida que você transita entre formatos de financiadores, e as citações permanecem consistentes em todos eles.",
      ],
      faqExtra: [
        {
          q: "Quais formatos de financiadores são suportados?",
          a: "58 layouts em um clique abrangendo formatos de financiadores, instituições e da indústria — incluindo UKRI R4RI, Royal Society, SNSF, NIH, NSF e ERC —, cada um preenchido a partir do seu registro de pesquisa aberto.",
        },
        {
          q: "Trocar de layout vai apagar minhas edições?",
          a: "Não. Os layouts são aplicados de forma reversível ao mesmo currículo canônico, então você pode alternar entre formatos de financiadores e sua curadoria é preservada.",
        },
        {
          q: "Estes são os formulários oficiais dos financiadores?",
          a: "São layouts do SigmaCV modelados na estrutura de cada financiador. Sempre verifique as orientações e os modelos oficiais atuais do financiador antes de enviar.",
        },
      ],
      relatedHeading: "Ferramentas de financiadores e modelos relacionadas",
    },
  },
  "it-IT": {
    "orcid-to-cv": {
      intro: [
        "Trasformare il tuo iD ORCID in un CV accademico di solito significa esportare un elenco e riformattarlo a mano. SigmaCV lo fa automaticamente: accedi con ORCID e legge il tuo registro pubblico, recupera le tue pubblicazioni da ORCID e OpenAlex, formatta ogni citazione in modo coerente e assembla un CV accademico curato che puoi selezionare ed esportare in pochi minuti.",
        "I tuoi lavori vengono abbinati a te tramite il tuo iD ORCID — un identificativo stabile, non il tuo nome come testo — così eviti gli equivoci del tipo «c'è un'altra persona con il mio nome» che gli strumenti basati sul nome producono, un problema che pesa soprattutto per i nomi comuni e per i nomi in alfabeti non latini. Nulla viene inventato e tutto ciò che non è tuo è a un clic dall'essere nascosto.",
      ],
      stepsHeading: "Come trasformare il tuo iD ORCID in un CV",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "Usa l'accesso gratuito con ORCID. SigmaCV legge solo il tuo registro ORCID pubblico — non scrive mai nulla su ORCID.",
        },
        {
          title: "Il tuo CV si compila da solo",
          body: "SigmaCV risolve il tuo profilo d'autore OpenAlex a partire dal tuo iD ORCID e assembla le tue pubblicazioni — e, dove disponibili, le tue posizioni, la tua formazione e i tuoi finanziamenti — in una bozza di CV.",
        },
        {
          title: "Seleziona ciò che è tuo",
          body: "Contrassegna come «non è mio» tutto ciò che non ti riguarda (viene nascosto, mai eliminato), riordina le voci e scegli quali sezioni mostrare.",
        },
        {
          title: "Definisci lo stile ed esporta",
          body: "Scegli uno stile di citazione e un modello, evidenzia se vuoi il tuo nome negli elenchi di autori, poi esporta in PDF, DOCX, LaTeX o Markdown — oppure pubblica una pagina viva che si risincronizza.",
        },
      ],
      whyHeading: "Perché creare il tuo CV da ORCID con SigmaCV",
      why: [
        "ORCID è l'àncora affidabile della tua identità scientifica, e SigmaCV lo usa nel modo per cui è stato concepito: come un identificativo che risolve ai tuoi lavori, non un nome da indovinare. È questa la differenza tra un CV che è davvero tuo e uno che passi un pomeriggio a correggere.",
        "È gratuito per i singoli individui e open source, legge solo i metadati pubblici e ti lascia il controllo su ogni voce. Lo stesso CV canonico viene esportato in tutti i formati con citazioni identiche e formattate correttamente, così non riformatti mai più una referenza a mano.",
      ],
      faqExtra: [
        {
          q: "Mi serve un account ORCID?",
          a: "Sì — un iD ORCID gratuito è tutto ciò che ti serve per accedere, e crearlo su orcid.org richiede circa un minuto. È anche ciò che permette a SigmaCV di trovare i tuoi lavori in modo affidabile.",
        },
        {
          q: "SigmaCV modifica il mio registro ORCID?",
          a: "No. SigmaCV legge solo i tuoi dati pubblici ORCID e OpenAlex; non scrive, modifica né aggiunge mai nulla al tuo registro ORCID.",
        },
        {
          q: "E se una delle mie pubblicazioni manca?",
          a: "Puoi aggiungere qualsiasi lavoro tramite il suo DOI, e SigmaCV ne recupera i dettagli dal registro aperto e li formatta in linea con il resto del tuo CV.",
        },
      ],
      relatedHeading: "Altri modi per creare il tuo CV",
    },
    "nih-biosketch": {
      intro: [
        "Un biosketch NIH richiede i tuoi contributi alla scienza e una selezione mirata di pubblicazioni, formattata in modo preciso. SigmaCV ti dà un vantaggio di partenza: accedi con ORCID e redige una bozza di biosketch in stile NIH a partire dal tuo registro di ricerca aperto, con le tue pubblicazioni già recuperate e le citazioni formattate in modo coerente.",
        "Decidi tu quali contributi e quali pubblicazioni appaiono — il biosketch dovrebbe mettere in evidenza il lavoro più rilevante per una candidatura specifica, e SigmaCV rende questa selezione rapida anziché un esercizio di copia-incolla. Poiché tutto deriva da un unico registro canonico, puoi riesportare un biosketch aggiornato la volta successiva che ne hai bisogno.",
      ],
      stepsHeading: "Come generare un biosketch NIH",
      steps: [
        {
          title: "Accedi con ORCID",
          body: "SigmaCV legge il tuo registro pubblico ORCID e OpenAlex — nessun inserimento manuale del tuo elenco di pubblicazioni.",
        },
        {
          title: "Recupera il tuo registro",
          body: "Le tue pubblicazioni e il tuo profilo vengono assemblati automaticamente, abbinati a te tramite identificativo anziché tramite il nome.",
        },
        {
          title: "Seleziona i tuoi contributi e le tue pubblicazioni",
          body: "Scegli i contributi e le pubblicazioni specifiche che contano per questa candidatura e mettili nell'ordine che preferisci.",
        },
        {
          title: "Formatta ed esporta",
          body: "Applica la struttura in stile NIH, mantieni le citazioni coerenti in tutto il documento ed esporta in PDF, DOCX o LaTeX.",
        },
      ],
      whyHeading: "Perché redigere il tuo biosketch con SigmaCV",
      why: [
        "La parte noiosa di un biosketch è assemblare e formattare l'elenco di pubblicazioni e mantenerlo coerente. SigmaCV lo fa automaticamente e ti permette di concentrarti sulla narrazione — i tuoi contributi alla scienza — invece di lottare con la formattazione delle citazioni.",
        "È gratuito per i singoli individui e open source, e non inventa mai nulla: ogni pubblicazione proviene dal registro aperto, abbinata al tuo identificativo, e sei tu a selezionare esattamente ciò che appare.",
      ],
      faqExtra: [
        {
          q: "È un modulo NIH ufficiale?",
          a: "SigmaCV produce un biosketch in stile NIH che puoi adattare al modello ufficiale. Verifica sempre le istruzioni e i moduli NIH attuali per la tua specifica opportunità di finanziamento.",
        },
        {
          q: "Posso riutilizzare il mio biosketch per candidature diverse?",
          a: "Sì. Poiché è costruito a partire da un unico CV canonico, puoi riselezionare quali pubblicazioni e contributi appaiono ed esportare una versione su misura per ogni candidatura.",
        },
        {
          q: "Quali pubblicazioni vengono incluse?",
          a: "Solo quelle che scegli tu. SigmaCV propone l'intero tuo registro abbinato tramite identificativo, e tu selezioni il sottoinsieme più rilevante per la candidatura.",
        },
      ],
      relatedHeading: "Strumenti correlati per CV di enti finanziatori",
    },
    "academic-cv-template": {
      intro: [
        "Un modello di CV accademico vuoto ti lascia comunque a digitare ogni voce. SigmaCV è l'opposto: un CV accademico che si compila da solo. Accedi con ORCID e costruisce un CV curato, con citazioni formattate, a partire dal tuo registro di ricerca reale e pubblico, così parti dal tuo lavoro effettivo invece che da una pagina vuota.",
        "Mantieni comunque il pieno controllo sulla struttura e su ciò che appare — scegli un modello, scegli uno stile di citazione, riordina le sezioni e nascondi tutto ciò che non è rilevante — ma il lavoro pesante di raccogliere e formattare le tue pubblicazioni è già fatto. È gratuito per i singoli individui e open source.",
      ],
      stepsHeading: "Come usare il modello di CV accademico precompilato",
      steps: [
        {
          title: "Accedi con ORCID",
          body: "Nessun modulo vuoto da riempire: SigmaCV legge il tuo registro pubblico per popolare il modello al posto tuo.",
        },
        {
          title: "Parti dal tuo registro reale",
          body: "Le tue pubblicazioni vengono recuperate da ORCID e OpenAlex tramite identificativo, e il tuo profilo viene compilato automaticamente.",
        },
        {
          title: "Scegli una struttura e uno stile",
          body: "Scegli un modello e uno stile di citazione CSL; passa da una struttura all'altra in modo reversibile senza perdere le tue modifiche.",
        },
        {
          title: "Seleziona ed esporta",
          body: "Riordina e nascondi le voci, poi esporta lo stesso CV canonico in PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Perché è meglio di un modello vuoto",
      why: [
        "I modelli risolvono la formattazione ma non il contenuto — devi comunque trovare ogni articolo, digitare ogni dettaglio e formattare ogni citazione. SigmaCV risolve entrambi: assembla il contenuto dal registro aperto e formatta le citazioni attraverso un unico motore di citazione, così risultano identiche in ogni esportazione.",
        "E non imprigiona mai i tuoi dati: cambia struttura quando vuoi e scarica il tuo CV in qualsiasi formato. Nulla è vincolato a un singolo stile o all'istanza ospitata, che è completamente auto-ospitabile.",
      ],
      faqExtra: [
        {
          q: "Posso personalizzare il modello?",
          a: "Sì. Scegli il modello e lo stile di citazione, riordini e rinomini le sezioni e decidi cosa mostrare — il tutto applicato in modo reversibile allo stesso CV sottostante.",
        },
        {
          q: "Il modello è davvero gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0, e legge solo i metadati pubblici della ricerca.",
        },
        {
          q: "Sono obbligato a usare il contenuto precompilato?",
          a: "No. Tutto è selezionabile: tieni ciò che è tuo, nascondi il resto e aggiungi ciò che manca tramite DOI.",
        },
      ],
      relatedHeading: "Modelli e formati di CV correlati",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex è uno dei più grandi cataloghi aperti di lavori scientifici, e SigmaCV trasforma il tuo profilo OpenAlex in un CV accademico finito. Accedi con ORCID, SigmaCV risolve il tuo identificativo d'autore OpenAlex, e i tuoi lavori vengono importati, formattati e pronti da selezionare — senza costruire elenchi a mano.",
        "L'abbinamento avviene tramite identificativo d'autore (il tuo ID OpenAlex / ORCID), mai tramite stringa del nome, così il tuo CV riflette il tuo lavoro e non quello di un quasi omonimo. Eventuali metriche di OpenAlex sono rigorosamente opzionali e normalizzate per campo, in linea con DORA — disattivate per impostazione predefinita, mai un Impact Factor di rivista.",
      ],
      stepsHeading: "Come costruire un CV da OpenAlex",
      steps: [
        {
          title: "Accedi con ORCID",
          body: "SigmaCV usa il tuo iD ORCID per risolvere il profilo d'autore OpenAlex corretto per te.",
        },
        {
          title: "Importa i tuoi lavori OpenAlex",
          body: "I tuoi lavori vengono recuperati tramite identificativo e trasformati automaticamente in voci di CV formattate.",
        },
        {
          title: "Seleziona e (se vuoi) aggiungi metriche",
          body: "Nascondi tutto ciò che non è tuo, riordina le voci e — solo se lo desideri — attiva le metriche normalizzate per campo.",
        },
        {
          title: "Esporta o pubblica",
          body: "Esporta in PDF, DOCX, LaTeX o Markdown, oppure pubblica una pagina viva che si risincronizza da OpenAlex.",
        },
      ],
      whyHeading: "Perché usare il tuo profilo OpenAlex in questo modo",
      why: [
        "OpenAlex ti offre una copertura ampia e aperta delle tue pubblicazioni, ma un profilo grezzo non è un CV. SigmaCV lo formatta in un CV — citazioni coerenti, una struttura a tua scelta e il tuo nome evidenziato tramite identificativo negli elenchi di autori.",
        "È gratuito per i singoli individui e open source, legge solo i metadati pubblici e tratta le metriche in modo responsabile: restano disattivate finché non le attivi tu, e SigmaCV preferisce gli indicatori normalizzati per campo ai conteggi grezzi.",
      ],
      faqExtra: [
        {
          q: "E se il mio profilo OpenAlex contiene errori?",
          a: "Selezioni tu tutto: contrassegna i lavori attribuiti per errore come «non è mio» (vengono nascosti, non eliminati) e aggiungi quelli mancanti tramite DOI. Le tue correzioni plasmano il tuo CV senza alterare OpenAlex.",
        },
        {
          q: "Le metriche di OpenAlex sono mostrate per impostazione predefinita?",
          a: "No. Le metriche sono disattivate per impostazione predefinita e del tutto opzionali. Quando vengono attivate, SigmaCV preferisce gli indicatori normalizzati per campo e non mostra mai un Impact Factor di rivista.",
        },
        {
          q: "Abbina i miei lavori tramite il nome?",
          a: "No — tramite identificativo d'autore (ID OpenAlex / ORCID), che evita i falsi abbinamenti frequenti con nomi condivisi o traslitterati.",
        },
      ],
      relatedHeading: "Altri modi per creare il tuo CV",
    },
    "publication-list": {
      intro: [
        "Un elenco di pubblicazioni formattato è il cuore di qualsiasi CV accademico, ed è la parte più noiosa da mantenere. SigmaCV lo genera per te: accedi con ORCID e costruisce un elenco coerente, con citazioni formattate, delle tue pubblicazioni da ORCID e OpenAlex, pronto da riordinare e inserire nel tuo CV.",
        "Scegli qualsiasi stile di citazione CSL e la formattazione resta identica in ogni output — PDF, DOCX, LaTeX, Markdown, persino BibTeX e CSL-JSON per riutilizzarli altrove. Il tuo nome è evidenziato tramite identificativo, così risalta correttamente anche negli elenchi lunghi con molti autori.",
      ],
      stepsHeading: "Come generare un elenco di pubblicazioni formattato",
      steps: [
        {
          title: "Accedi con ORCID",
          body: "SigmaCV legge il tuo registro pubblico ORCID e OpenAlex per raccogliere le tue pubblicazioni.",
        },
        {
          title: "Recupera e deduplica i tuoi lavori",
          body: "Le tue pubblicazioni vengono importate tramite identificativo e assemblate in un unico elenco pulito.",
        },
        {
          title: "Scegli uno stile di citazione",
          body: "Scegli qualsiasi stile CSL; l'elenco si riformatta all'istante e resta coerente in tutti i formati.",
        },
        {
          title: "Riordina ed esporta",
          body: "Metti i lavori nell'ordine che preferisci ed esporta in PDF, DOCX, LaTeX, Markdown o BibTeX.",
        },
      ],
      whyHeading: "Perché generare il tuo elenco di pubblicazioni con SigmaCV",
      why: [
        "Un unico motore di citazione (il Citation Style Language, lo stesso standard alla base di Zotero e Mendeley) formatta tutto il tuo elenco, così non ci sono referenze discordanti tra il tuo CV in Word e quello in LaTeX. Cambia lo stile una volta e ogni output si adegua.",
        "È gratuito per i singoli individui e open source, ed è onesto riguardo alla paternità dei lavori: i lavori sono abbinati tramite identificativo, il tuo nome è evidenziato tramite identificativo, e sei tu a selezionare esattamente quali pubblicazioni appaiono.",
      ],
      faqExtra: [
        {
          q: "Posso scegliere lo stile di citazione?",
          a: "Sì. SigmaCV formatta il tuo elenco tramite CSL, quindi puoi scegliere qualsiasi stile supportato e la formattazione resta identica in PDF, DOCX, LaTeX e Markdown.",
        },
        {
          q: "Posso esportare l'elenco come BibTeX?",
          a: "Sì. Oltre a PDF, DOCX, LaTeX e Markdown, SigmaCV può esportare le tue pubblicazioni selezionate come BibTeX e CSL-JSON per riutilizzarle altrove.",
        },
        {
          q: "Posso suddividere l'elenco per tipo, come articoli e preprint?",
          a: "Sì. Organizzi i tuoi lavori in sezioni e li ordini come preferisci; l'elenco è del tutto selezionabile prima dell'esportazione.",
        },
      ],
      relatedHeading: "Strumenti correlati per CV e citazioni",
    },
    "latex-cv": {
      intro: [
        "Se scrivi il tuo CV in LaTeX, SigmaCV ti risparmia il passaggio più noioso: genera un CV accademico LaTeX pronto da compilare a partire dal tuo registro di ricerca aperto, completo di una bibliografia .bib corrispondente, invece di un modello vuoto da riempire a mano.",
        "Accedi con ORCID, seleziona il tuo registro ed esporta un CV .tex più un file .bib da compilare nel tuo ambiente. Le citazioni sono prodotte tramite CSL, così il tuo CV LaTeX risulta identico alle versioni PDF, DOCX e Markdown dello stesso CV canonico.",
      ],
      stepsHeading: "Come generare un CV accademico LaTeX",
      steps: [
        {
          title: "Accedi con ORCID",
          body: "SigmaCV costruisce il tuo CV dal tuo registro pubblico ORCID e OpenAlex — senza armeggiare manualmente con BibTeX.",
        },
        {
          title: "Seleziona il tuo CV",
          body: "Scegli quali pubblicazioni e sezioni appaiono e mettile in ordine, tutto da un unico registro canonico.",
        },
        {
          title: "Esporta .tex e .bib",
          body: "Scarica un CV LaTeX con una bibliografia .bib allegata, generata dalle tue pubblicazioni selezionate.",
        },
        {
          title: "Compila nel tuo ambiente",
          body: "Compila il .tex in Overleaf o nella tua distribuzione TeX locale; da lì modifichi il LaTeX liberamente.",
        },
      ],
      whyHeading: "Perché generare il LaTeX con SigmaCV",
      why: [
        "Mantenere a mano un file .bib e tenerlo sincronizzato con il tuo CV è soggetto a errori. SigmaCV assembla sia il documento sia la bibliografia dal tuo registro reale, così le voci sono complete e le citazioni coerenti fin dall'inizio.",
        "È gratuito per i singoli individui e open source, e non c'è alcun vincolo: ottieni semplici file .tex e .bib da compilare e modificare come preferisci, e lo stesso CV viene esportato in altri formati ogni volta che ti servono.",
      ],
      faqExtra: [
        {
          q: "Quali file LaTeX esporta SigmaCV?",
          a: "Un CV .tex più una bibliografia .bib assemblata dalle tue pubblicazioni selezionate, così puoi compilare il documento nel tuo ambiente LaTeX.",
        },
        {
          q: "Posso usarlo con Overleaf?",
          a: "Sì. I file .tex e .bib esportati sono file standard che puoi caricare su Overleaf o compilare in locale con qualsiasi distribuzione TeX.",
        },
        {
          q: "È un sostituto di un modello moderncv o Overleaf?",
          a: "Li completa: invece di digitare le voci in un modello vuoto in stile moderncv, SigmaCV compila il contenuto dal tuo registro e ti fornisce .tex e .bib su cui proseguire.",
        },
      ],
      relatedHeading: "Formati di CV correlati",
    },
    "funder-cv-templates": {
      intro: [
        "Ogni ente finanziatore vuole il proprio formato di CV, e ricostruire il CV per ciascuno è una scocciatura. SigmaCV include 58 strutture in un clic per i principali enti finanziatori, istituzioni e per l'industria — tra cui UKRI R4RI, la Royal Society, lo svizzero SNSF, gli statunitensi NIH e NSF e l'europeo ERC — applicate in modo reversibile al tuo registro di ricerca aperto.",
        "Accedi con ORCID, e un solo clic rimodella il tuo CV canonico nella struttura dell'ente finanziatore scelto: le sezioni giuste, nell'ordine giusto, con i titoli giusti. Passa da un formato all'altro liberamente — applicare una struttura seleziona e riordina le sezioni, non elimina mai i tuoi dati.",
      ],
      stepsHeading: "Come usare i modelli di CV per enti finanziatori",
      steps: [
        {
          title: "Accedi con ORCID",
          body: "SigmaCV assembla il tuo CV dal tuo registro pubblico, così ogni struttura di ente finanziatore parte dallo stesso contenuto.",
        },
        {
          title: "Scegli una struttura di ente finanziatore",
          body: "Scegli tra 58 strutture in un clic — ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society e altre ancora.",
        },
        {
          title: "Seleziona per la candidatura",
          body: "Regola quali pubblicazioni e sezioni appaiono affinché il CV si adatti al bando specifico, il tutto in modo reversibile.",
        },
        {
          title: "Esporta",
          body: "Esporta il CV formattato in PDF, DOCX o LaTeX, con citazioni coerenti in tutto il documento.",
        },
      ],
      whyHeading: "Perché usare SigmaCV per i CV degli enti finanziatori",
      why: [
        "I formati degli enti finanziatori differiscono nella struttura, non nel tuo registro sottostante. SigmaCV separa i due aspetti: i tuoi dati risiedono in un unico CV canonico, e le strutture sono scelte di presentazione applicate sopra di essi — così passare da un CV ERC a una narrazione UKRI R4RI è un clic, non una ricostruzione.",
        "È gratuito per i singoli individui e open source, e applicare una struttura è sempre reversibile. La tua selezione viene preservata mentre passi da un formato di ente finanziatore all'altro, e le citazioni restano coerenti in ognuno.",
      ],
      faqExtra: [
        {
          q: "Quali formati di enti finanziatori sono supportati?",
          a: "58 strutture in un clic che coprono formati per enti finanziatori, istituzioni e industria — tra cui UKRI R4RI, la Royal Society, SNSF, NIH, NSF e ERC — ognuna compilata dal tuo registro di ricerca aperto.",
        },
        {
          q: "Cambiando struttura perderò le mie modifiche?",
          a: "No. Le strutture vengono applicate in modo reversibile allo stesso CV canonico, così puoi passare da un formato di ente finanziatore all'altro e la tua selezione viene preservata.",
        },
        {
          q: "Sono i moduli ufficiali degli enti finanziatori?",
          a: "Sono strutture di SigmaCV modellate sulla struttura di ciascun ente finanziatore. Verifica sempre le linee guida e i modelli ufficiali attuali dell'ente finanziatore prima di inviare la candidatura.",
        },
      ],
      relatedHeading: "Strumenti correlati per enti finanziatori e modelli",
    },
  },
  "ko-KR": {
    "orcid-to-cv": {
      intro: [
        "ORCID iD를 학술 이력서로 바꾸려면 보통 목록을 내보낸 뒤 일일이 손으로 서식을 다시 맞춰야 합니다. SigmaCV는 이를 자동으로 처리합니다. ORCID로 로그인하면 공개 기록을 읽어 ORCID와 OpenAlex에서 논문을 가져오고, 모든 인용을 일관되게 서식화하여 몇 분 만에 정리하고 내보낼 수 있는 깔끔한 학술 이력서를 구성합니다.",
        '회원님의 업적은 텍스트로서의 이름이 아니라 안정적인 식별자인 ORCID iD로 매칭됩니다. 따라서 이름 기반 도구에서 생기는 "내 이름과 같은 다른 사람"의 혼동을 피할 수 있는데, 이는 흔한 이름이나 비라틴 문자 이름에서 특히 중요합니다. 없는 내용을 지어내지 않으며, 본인의 것이 아닌 항목은 클릭 한 번으로 숨길 수 있습니다.',
      ],
      stepsHeading: "ORCID iD를 이력서로 변환하는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "무료 ORCID 로그인을 사용하세요. SigmaCV는 공개된 ORCID 기록만 읽으며, ORCID에 무언가를 다시 기록하지 않습니다.",
        },
        {
          title: "이력서가 자동으로 채워집니다",
          body: "SigmaCV는 회원님의 ORCID iD로 OpenAlex 저자 프로필을 확인하고, 논문과 더불어 가능한 경우 직위, 학력, 연구비를 모아 이력서 초안을 구성합니다.",
        },
        {
          title: "내 것만 선별하기",
          body: '본인의 것이 아닌 항목은 "내 것이 아님"으로 표시하고(삭제되지 않고 숨겨집니다), 항목 순서를 바꾸며, 어떤 섹션을 표시할지 선택하세요.',
        },
        {
          title: "스타일 지정 및 내보내기",
          body: "인용 스타일과 템플릿을 고르고, 원하면 저자 목록에서 본인의 이름을 강조한 뒤 PDF, DOCX, LaTeX, Markdown으로 내보내거나 다시 동기화되는 살아 있는 페이지로 게시하세요.",
        },
      ],
      whyHeading: "SigmaCV로 ORCID에서 이력서를 만드는 이유",
      why: [
        "ORCID는 학술적 정체성을 위한 신뢰할 수 있는 기준점이며, SigmaCV는 이를 본래 의도된 방식, 즉 추측해야 할 이름이 아니라 업적으로 연결되는 식별자로 사용합니다. 이것이 진정으로 본인의 것인 이력서와 한나절을 들여 바로잡아야 하는 이력서의 차이입니다.",
        "개인에게 무료이며 오픈 소스이고, 공개 메타데이터만 읽으며, 모든 항목을 회원님이 직접 제어합니다. 동일한 정규 이력서가 모든 형식으로 똑같이 올바르게 서식화된 인용과 함께 내보내지므로, 참고문헌을 다시 손으로 서식화할 일이 없습니다.",
      ],
      faqExtra: [
        {
          q: "ORCID 계정이 필요한가요?",
          a: "네. 로그인에는 무료 ORCID iD만 있으면 되며, orcid.org에서 1분 정도면 만들 수 있습니다. 또한 이것이 SigmaCV가 회원님의 업적을 안정적으로 찾을 수 있게 해 줍니다.",
        },
        {
          q: "SigmaCV가 내 ORCID 기록을 변경하나요?",
          a: "아니요. SigmaCV는 공개된 ORCID와 OpenAlex 데이터를 읽기만 하며, ORCID 기록에 무언가를 쓰거나 편집하거나 추가하지 않습니다.",
        },
        {
          q: "내 논문 중 하나가 누락되면 어떻게 하나요?",
          a: "DOI로 어떤 업적이든 추가할 수 있으며, SigmaCV가 공개 기록에서 세부 정보를 가져와 이력서의 나머지와 일치하도록 서식화합니다.",
        },
      ],
      relatedHeading: "이력서를 만드는 다른 방법",
    },
    "nih-biosketch": {
      intro: [
        "NIH biosketch는 과학에 대한 회원님의 기여와 정해진 서식에 맞춰 엄선된 논문 목록을 요구합니다. SigmaCV는 든든한 출발점을 제공합니다. ORCID로 로그인하면 공개된 연구 기록을 바탕으로 NIH 양식의 biosketch 초안을 작성하며, 논문이 이미 모여 있고 인용이 일관되게 서식화되어 있습니다.",
        "어떤 기여와 어떤 논문을 표시할지는 회원님이 정합니다. biosketch는 특정 지원에 가장 관련 있는 업적을 부각해야 하며, SigmaCV는 그 선택을 복사·붙여넣기 작업이 아니라 빠른 과정으로 만들어 줍니다. 모든 것이 하나의 정규 기록에서 비롯되므로, 다음에 필요할 때 갱신된 biosketch를 다시 내보낼 수 있습니다.",
      ],
      stepsHeading: "NIH biosketch를 생성하는 방법",
      steps: [
        {
          title: "ORCID로 로그인",
          body: "SigmaCV가 공개된 ORCID와 OpenAlex 기록을 읽으므로 논문 목록을 수동으로 입력할 필요가 없습니다.",
        },
        {
          title: "기록 가져오기",
          body: "논문과 프로필이 이름이 아니라 식별자로 매칭되어 자동으로 모입니다.",
        },
        {
          title: "기여와 논문 선택",
          body: "이번 지원에 중요한 기여와 특정 논문을 선택하고 원하는 순서로 배열하세요.",
        },
        {
          title: "서식 지정 및 내보내기",
          body: "NIH 양식 레이아웃을 적용하고 문서 전반에 인용을 일관되게 유지한 뒤 PDF, DOCX, LaTeX로 내보내세요.",
        },
      ],
      whyHeading: "SigmaCV로 biosketch 초안을 작성하는 이유",
      why: [
        "biosketch에서 번거로운 부분은 논문 목록을 모으고 서식을 맞추며 일관성을 유지하는 일입니다. SigmaCV는 이를 자동으로 처리해, 인용 서식과 씨름하는 대신 서술 부분, 즉 과학에 대한 회원님의 기여에 집중할 수 있게 합니다.",
        "개인에게 무료이며 오픈 소스이고, 결코 없는 내용을 지어내지 않습니다. 모든 논문은 공개 기록에서 회원님의 식별자로 매칭되어 나오며, 무엇을 표시할지 정확히 회원님이 선별합니다.",
      ],
      faqExtra: [
        {
          q: "이것이 공식 NIH 양식인가요?",
          a: "SigmaCV는 공식 템플릿에 맞춰 다듬을 수 있는 NIH 양식의 biosketch를 만들어 줍니다. 특정 지원 기회에 대해서는 항상 최신 NIH 안내와 양식을 확인하세요.",
        },
        {
          q: "biosketch를 여러 지원에 재사용할 수 있나요?",
          a: "네. 하나의 정규 이력서에서 만들어지므로, 어떤 논문과 기여를 표시할지 다시 선별하여 각 지원에 맞춘 버전을 내보낼 수 있습니다.",
        },
        {
          q: "어떤 논문이 포함되나요?",
          a: "회원님이 선택한 논문만 포함됩니다. SigmaCV는 식별자로 매칭한 전체 기록을 제안하며, 회원님은 지원에 가장 관련 있는 일부를 선택합니다.",
        },
      ],
      relatedHeading: "관련 지원기관 이력서 도구",
    },
    "academic-cv-template": {
      intro: [
        "빈 학술 이력서 템플릿은 결국 모든 항목을 직접 타이핑하게 만듭니다. SigmaCV는 그 반대로, 스스로 채워지는 학술 이력서입니다. ORCID로 로그인하면 실제 공개 연구 기록을 바탕으로 인용이 서식화된 깔끔한 이력서를 구성하므로, 빈 페이지가 아니라 회원님의 실제 업적에서 시작합니다.",
        "그러면서도 레이아웃과 표시 내용을 완전히 제어할 수 있습니다. 템플릿을 고르고, 인용 스타일을 선택하고, 섹션 순서를 바꾸고, 관련 없는 항목을 숨길 수 있습니다. 다만 논문을 모으고 서식을 맞추는 번거로운 작업은 이미 끝나 있습니다. 개인에게 무료이며 오픈 소스입니다.",
      ],
      stepsHeading: "자동 입력 학술 이력서 템플릿 사용법",
      steps: [
        {
          title: "ORCID로 로그인",
          body: "채워야 할 빈 양식은 없습니다. SigmaCV가 공개 기록을 읽어 템플릿을 대신 채워 줍니다.",
        },
        {
          title: "실제 기록에서 시작",
          body: "논문이 식별자를 통해 ORCID와 OpenAlex에서 가져와지고, 프로필이 자동으로 채워집니다.",
        },
        {
          title: "레이아웃과 스타일 선택",
          body: "템플릿과 CSL 인용 스타일을 고르고, 편집 내용을 잃지 않으면서 레이아웃 사이를 가역적으로 전환하세요.",
        },
        {
          title: "선별 및 내보내기",
          body: "항목 순서를 바꾸고 숨긴 뒤, 동일한 정규 이력서를 PDF, DOCX, LaTeX, Markdown으로 내보내세요.",
        },
      ],
      whyHeading: "빈 템플릿보다 나은 이유",
      why: [
        "템플릿은 서식 문제는 해결하지만 내용 문제는 해결하지 못합니다. 여전히 모든 논문을 찾고, 모든 세부 정보를 입력하고, 모든 인용을 서식화해야 합니다. SigmaCV는 두 가지를 모두 해결합니다. 공개 기록에서 내용을 모으고, 하나의 인용 엔진으로 인용을 서식화하므로 모든 내보내기에서 동일합니다.",
        "또한 회원님의 데이터를 가두지 않습니다. 원할 때 레이아웃을 전환하고 어떤 형식으로든 이력서를 내려받을 수 있습니다. 무엇도 단일 스타일이나 호스팅 인스턴스에 묶이지 않으며, 완전히 자체 호스팅할 수 있습니다.",
      ],
      faqExtra: [
        {
          q: "템플릿을 사용자 지정할 수 있나요?",
          a: "네. 템플릿과 인용 스타일을 고르고, 섹션 순서를 바꾸거나 이름을 변경하고, 무엇을 표시할지 정할 수 있습니다. 이 모든 것은 동일한 기반 이력서에 가역적으로 적용됩니다.",
        },
        {
          q: "이 템플릿은 정말 무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스이고, 공개된 연구 메타데이터만 읽습니다.",
        },
        {
          q: "자동으로 채워진 내용을 꼭 사용해야 하나요?",
          a: "아니요. 모든 것이 선별 가능합니다. 본인의 것은 남기고, 나머지는 숨기고, 누락된 항목은 DOI로 추가하세요.",
        },
      ],
      relatedHeading: "관련 이력서 템플릿 및 형식",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex는 학술 업적을 담은 가장 큰 공개 목록 중 하나이며, SigmaCV는 회원님의 OpenAlex 프로필을 완성된 학술 이력서로 바꿔 줍니다. ORCID로 로그인하면 SigmaCV가 OpenAlex 저자 식별자를 확인하고, 회원님의 성과물을 가져와 서식화한 뒤 바로 선별할 수 있도록 준비합니다. 수동으로 목록을 만들 필요가 없습니다.",
        "매칭은 이름 문자열이 아니라 저자 식별자(OpenAlex / ORCID ID)로 이루어지므로, 이력서가 동명이인이 아닌 회원님의 업적을 반영합니다. OpenAlex 지표는 모두 엄격히 옵트인이며 필드 정규화되어 있고 DORA에 부합합니다. 기본값은 미표시이며, 결코 저널 임팩트 팩터가 아닙니다.",
      ],
      stepsHeading: "OpenAlex로 이력서를 만드는 방법",
      steps: [
        {
          title: "ORCID로 로그인",
          body: "SigmaCV는 회원님의 ORCID iD를 사용해 올바른 OpenAlex 저자 프로필을 확인합니다.",
        },
        {
          title: "OpenAlex 성과물 가져오기",
          body: "회원님의 성과물이 식별자로 가져와져 자동으로 서식화된 이력서 항목으로 변환됩니다.",
        },
        {
          title: "선별 및 (선택 사항) 지표 추가",
          body: "본인의 것이 아닌 항목을 숨기고, 항목 순서를 바꾸며, 원하는 경우에만 필드 정규화 지표를 켜세요.",
        },
        {
          title: "내보내기 또는 게시",
          body: "PDF, DOCX, LaTeX, Markdown으로 내보내거나, OpenAlex에서 다시 동기화되는 살아 있는 페이지로 게시하세요.",
        },
      ],
      whyHeading: "OpenAlex 프로필을 이렇게 활용하는 이유",
      why: [
        "OpenAlex는 회원님의 논문을 폭넓고 개방적으로 다루지만, 가공되지 않은 프로필은 이력서가 아닙니다. SigmaCV는 이를 이력서로 서식화합니다. 일관된 인용, 회원님이 선택한 레이아웃, 그리고 저자 목록에서 식별자로 강조된 본인의 이름을 제공합니다.",
        "개인에게 무료이며 오픈 소스이고, 공개 메타데이터만 읽으며, 지표를 책임 있게 다룹니다. 지표는 회원님이 옵트인하지 않는 한 꺼져 있으며, SigmaCV는 단순 횟수보다 필드 정규화 지표를 선호합니다.",
      ],
      faqExtra: [
        {
          q: "내 OpenAlex 프로필에 오류가 있으면 어떻게 하나요?",
          a: '모든 것을 회원님이 선별합니다. 잘못 귀속된 업적을 "내 것이 아님"으로 표시하고(삭제되지 않고 숨겨집니다) 누락된 업적을 DOI로 추가하세요. 회원님의 수정은 OpenAlex를 바꾸지 않으면서 이력서를 형성합니다.',
        },
        {
          q: "OpenAlex 지표가 기본으로 표시되나요?",
          a: "아니요. 지표는 기본적으로 꺼져 있으며 전적으로 옵트인입니다. 켜면 SigmaCV는 필드 정규화 지표를 선호하며, 결코 저널 임팩트 팩터를 표시하지 않습니다.",
        },
        {
          q: "업적을 이름으로 매칭하나요?",
          a: "아니요. 저자 식별자(OpenAlex / ORCID ID)로 매칭합니다. 이를 통해 공유되거나 음역된 이름에서 흔한 오매칭을 방지합니다.",
        },
      ],
      relatedHeading: "이력서를 만드는 다른 방법",
    },
    "publication-list": {
      intro: [
        "서식화된 논문 목록은 모든 학술 이력서의 핵심이자 유지하기 가장 번거로운 부분입니다. SigmaCV가 이를 대신 생성합니다. ORCID로 로그인하면 ORCID와 OpenAlex를 바탕으로 일관되게 인용이 서식화된 논문 목록을 만들어, 순서를 바꿔 이력서에 바로 넣을 수 있도록 준비합니다.",
        "어떤 CSL 인용 스타일을 선택하든 서식은 모든 출력에서 동일하게 유지됩니다. PDF, DOCX, LaTeX, Markdown은 물론, 다른 곳에서 재사용할 수 있는 BibTeX와 CSL-JSON까지 지원합니다. 본인의 이름은 식별자로 강조되므로 길고 다수의 저자가 있는 목록에서도 올바르게 눈에 띕니다.",
      ],
      stepsHeading: "서식화된 논문 목록을 생성하는 방법",
      steps: [
        {
          title: "ORCID로 로그인",
          body: "SigmaCV가 공개된 ORCID와 OpenAlex 기록을 읽어 회원님의 논문을 모읍니다.",
        },
        {
          title: "성과물 가져오기 및 중복 제거",
          body: "회원님의 논문이 식별자로 가져와져 하나의 깔끔한 목록으로 정리됩니다.",
        },
        {
          title: "인용 스타일 선택",
          body: "어떤 CSL 스타일이든 선택하세요. 목록이 즉시 다시 서식화되며 여러 형식에 걸쳐 일관되게 유지됩니다.",
        },
        {
          title: "순서 변경 및 내보내기",
          body: "업적을 원하는 순서로 배열하고 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보내세요.",
        },
      ],
      whyHeading: "SigmaCV로 논문 목록을 생성하는 이유",
      why: [
        "하나의 인용 엔진(Zotero와 Mendeley의 기반이기도 한 표준인 Citation Style Language)이 전체 목록을 서식화하므로, Word 이력서와 LaTeX 이력서 사이에 참고문헌이 어긋나는 일이 없습니다. 스타일을 한 번 바꾸면 모든 출력이 그에 따릅니다.",
        "개인에게 무료이며 오픈 소스이고, 저자 표기에 정직합니다. 업적은 식별자로 매칭되고, 이름은 식별자로 강조되며, 어떤 논문을 표시할지 정확히 회원님이 선별합니다.",
      ],
      faqExtra: [
        {
          q: "인용 스타일을 선택할 수 있나요?",
          a: "네. SigmaCV는 CSL을 통해 목록을 서식화하므로 지원되는 어떤 스타일이든 고를 수 있으며, PDF, DOCX, LaTeX, Markdown 전반에서 서식이 동일하게 유지됩니다.",
        },
        {
          q: "목록을 BibTeX로 내보낼 수 있나요?",
          a: "네. PDF, DOCX, LaTeX, Markdown 외에도 SigmaCV는 선별한 논문을 BibTeX 및 CSL-JSON으로 내보내 다른 곳에서 재사용할 수 있습니다.",
        },
        {
          q: "논문과 프리프린트처럼 유형별로 목록을 나눌 수 있나요?",
          a: "네. 업적을 섹션으로 구성하고 원하는 대로 정렬할 수 있습니다. 목록은 내보내기 전에 완전히 선별 가능합니다.",
        },
      ],
      relatedHeading: "관련 이력서 및 인용 도구",
    },
    "latex-cv": {
      intro: [
        "이력서를 LaTeX로 작성한다면 SigmaCV가 가장 번거로운 단계를 덜어 줍니다. 직접 채워야 하는 빈 템플릿 대신, 공개된 연구 기록을 바탕으로 바로 컴파일할 수 있는 LaTeX 학술 이력서를 일치하는 .bib 참고문헌과 함께 생성합니다.",
        "ORCID로 로그인하고 기록을 선별한 뒤, 본인의 환경에서 컴파일할 수 있는 .tex 이력서와 .bib 파일을 내보내세요. 인용은 CSL을 통해 생성되므로, LaTeX 이력서가 같은 정규 이력서의 PDF, DOCX, Markdown 버전과 동일하게 보입니다.",
      ],
      stepsHeading: "LaTeX 학술 이력서를 생성하는 방법",
      steps: [
        {
          title: "ORCID로 로그인",
          body: "SigmaCV가 공개된 ORCID와 OpenAlex 기록으로 이력서를 구성하므로 BibTeX를 직접 다룰 필요가 없습니다.",
        },
        {
          title: "이력서 선별",
          body: "하나의 정규 기록에서 어떤 논문과 섹션을 표시할지 선택하고 순서를 정하세요.",
        },
        {
          title: ".tex 및 .bib 내보내기",
          body: "선별한 논문에서 생성된 .bib 참고문헌이 함께 들어 있는 LaTeX 이력서를 내려받으세요.",
        },
        {
          title: "본인의 환경에서 컴파일",
          body: "Overleaf나 로컬 TeX 배포판에서 .tex를 컴파일하고, 거기서부터 LaTeX를 자유롭게 수정하세요.",
        },
      ],
      whyHeading: "SigmaCV로 LaTeX를 생성하는 이유",
      why: [
        ".bib 파일을 직접 유지하고 이력서와 동기화하는 일은 오류가 생기기 쉽습니다. SigmaCV는 회원님의 실제 기록에서 문서와 참고문헌을 모두 구성하므로, 항목이 완전하고 인용이 처음부터 일관됩니다.",
        "개인에게 무료이며 오픈 소스이고, 종속이 없습니다. 원하는 대로 컴파일하고 편집할 수 있는 일반 .tex 및 .bib 파일을 받으며, 필요할 때 같은 이력서를 다른 형식으로도 내보낼 수 있습니다.",
      ],
      faqExtra: [
        {
          q: "SigmaCV는 어떤 LaTeX 파일을 내보내나요?",
          a: ".tex 이력서와 선별한 논문에서 구성된 .bib 참고문헌을 내보내므로, 본인의 LaTeX 환경에서 문서를 컴파일할 수 있습니다.",
        },
        {
          q: "Overleaf와 함께 사용할 수 있나요?",
          a: "네. 내보낸 .tex와 .bib는 표준 파일이므로 Overleaf에 업로드하거나 어떤 TeX 배포판으로든 로컬에서 컴파일할 수 있습니다.",
        },
        {
          q: "이것이 moderncv나 Overleaf 템플릿을 대체하나요?",
          a: "대체가 아니라 보완합니다. 빈 moderncv 스타일 템플릿에 항목을 타이핑하는 대신, SigmaCV가 회원님의 기록에서 내용을 채우고 더 발전시킬 수 있는 .tex와 .bib를 제공합니다.",
        },
      ],
      relatedHeading: "관련 이력서 형식",
    },
    "funder-cv-templates": {
      intro: [
        "지원기관마다 고유한 CV 형식을 요구하며, 각 기관에 맞춰 CV를 다시 만드는 일은 번거롭습니다. SigmaCV는 주요 지원기관, 기관, 산업을 위한 58가지 원클릭 레이아웃을 제공합니다. UKRI R4RI, Royal Society, 스위스 SNSF, 미국 NIH와 NSF, 유럽 ERC 등이 포함되며, 공개된 연구 기록에 가역적으로 적용됩니다.",
        "ORCID로 로그인하면 클릭 한 번으로 정규 이력서가 선택한 지원기관의 레이아웃으로 재구성됩니다. 알맞은 섹션이 알맞은 순서로, 알맞은 제목과 함께 배치됩니다. 형식 사이를 자유롭게 전환하세요. 레이아웃 적용은 섹션을 선택하고 재배열할 뿐 회원님의 데이터를 삭제하지 않습니다.",
      ],
      stepsHeading: "지원기관 CV 템플릿 사용법",
      steps: [
        {
          title: "ORCID로 로그인",
          body: "SigmaCV가 공개 기록에서 이력서를 구성하므로 모든 지원기관 레이아웃이 동일한 내용에서 시작합니다.",
        },
        {
          title: "지원기관 레이아웃 선택",
          body: "ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society 등 58가지 원클릭 레이아웃 중에서 고르세요.",
        },
        {
          title: "지원에 맞춰 선별",
          body: "어떤 논문과 섹션을 표시할지 조정해 CV가 특정 공고에 맞도록 하세요. 모두 가역적입니다.",
        },
        {
          title: "내보내기",
          body: "서식화된 CV를 전반에 걸쳐 일관된 인용과 함께 PDF, DOCX, LaTeX로 내보내세요.",
        },
      ],
      whyHeading: "지원기관 CV에 SigmaCV를 사용하는 이유",
      why: [
        "지원기관 형식은 구조가 다를 뿐, 회원님의 기반 기록이 다른 것은 아닙니다. SigmaCV는 둘을 분리합니다. 데이터는 하나의 정규 이력서에 담기고, 레이아웃은 그 위에 적용되는 표현 방식일 뿐입니다. 그래서 ERC CV에서 UKRI R4RI 서술형으로 바꾸는 일은 다시 만드는 것이 아니라 클릭 한 번입니다.",
        "개인에게 무료이며 오픈 소스이고, 레이아웃 적용은 언제나 가역적입니다. 지원기관 형식 사이를 오가도 회원님의 선별 내용이 보존되며, 인용은 모든 형식에서 일관되게 유지됩니다.",
      ],
      faqExtra: [
        {
          q: "어떤 지원기관 형식을 지원하나요?",
          a: "UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC를 포함한 지원기관·기관·산업 형식을 아우르는 58가지 원클릭 레이아웃을 지원하며, 각각 공개된 연구 기록에서 채워집니다.",
        },
        {
          q: "레이아웃을 전환하면 편집 내용이 사라지나요?",
          a: "아니요. 레이아웃은 동일한 정규 이력서에 가역적으로 적용되므로, 지원기관 형식 사이를 전환해도 회원님의 선별 내용이 보존됩니다.",
        },
        {
          q: "이것이 공식 지원기관 양식인가요?",
          a: "각 지원기관의 구조를 본떠 만든 SigmaCV 레이아웃입니다. 제출 전에는 항상 해당 지원기관의 최신 공식 안내와 템플릿을 확인하세요.",
        },
      ],
      relatedHeading: "관련 지원기관 및 템플릿 도구",
    },
  },
  "ru-RU": {
    "orcid-to-cv": {
      intro: [
        "Чтобы превратить ваш ORCID iD в академическое резюме, обычно приходится выгружать список и вручную переформатировать его. SigmaCV делает это автоматически: войдите через ORCID, и сервис считает вашу открытую запись, извлечёт публикации из ORCID и OpenAlex, единообразно отформатирует каждую ссылку и за считаные минуты соберёт аккуратное академическое резюме, которое вы сможете отобрать и экспортировать.",
        "Ваши работы сопоставляются с вами по ORCID iD — устойчивому идентификатору, а не по имени как тексту, — поэтому вы избегаете путаницы «кто-то другой с моим именем», свойственной инструментам, работающим по именам, и особенно заметной для распространённых имён и имён в нелатинской письменности. Ничего не выдумывается, а всё, что не ваше, скрывается одним щелчком.",
      ],
      stepsHeading: "Как превратить ваш ORCID iD в резюме",
      steps: [
        {
          title: "Войдите через ваш ORCID iD",
          body: "Используйте бесплатный вход через ORCID. SigmaCV считывает только вашу открытую запись ORCID — он никогда ничего не записывает обратно в ORCID.",
        },
        {
          title: "Резюме заполняется само",
          body: "SigmaCV определяет ваш профиль автора в OpenAlex по вашему ORCID iD и собирает ваши публикации — а также, где это возможно, ваши должности, образование и финансирование — в черновик резюме.",
        },
        {
          title: "Отберите то, что ваше",
          body: "Отметьте всё, что не относится к вам, как «не моё» (оно скрывается, но никогда не удаляется), измените порядок записей и выберите, какие разделы отображать.",
        },
        {
          title: "Оформите и экспортируйте",
          body: "Выберите стиль цитирования и шаблон, при желании выделите своё имя в списках авторов, затем экспортируйте в PDF, DOCX, LaTeX или Markdown — либо опубликуйте живую страницу, которая повторно синхронизируется.",
        },
      ],
      whyHeading: "Почему стоит строить резюме из ORCID с SigmaCV",
      why: [
        "ORCID — надёжная опора вашей научной идентичности, и SigmaCV использует его так, как и было задумано: как идентификатор, ведущий к вашим работам, а не как имя, которое приходится угадывать. В этом и состоит разница между резюме, которое действительно ваше, и тем, на исправление которого уходит целый вечер.",
        "Сервис бесплатен для частных лиц и имеет открытый исходный код, считывает только публичные метаданные и оставляет за вами контроль над каждой записью. Одно и то же каноническое резюме экспортируется в любой формат с идентичными, корректно отформатированными ссылками, поэтому вам больше никогда не придётся переформатировать ссылку вручную.",
      ],
      faqExtra: [
        {
          q: "Нужен ли мне аккаунт ORCID?",
          a: "Да — для входа достаточно бесплатного ORCID iD, который создаётся примерно за минуту на orcid.org. Именно он позволяет SigmaCV надёжно находить ваши работы.",
        },
        {
          q: "Меняет ли SigmaCV мою запись ORCID?",
          a: "Нет. SigmaCV только считывает ваши открытые данные ORCID и OpenAlex; он никогда не записывает, не редактирует и не добавляет ничего в вашу запись ORCID.",
        },
        {
          q: "Что делать, если одна из моих публикаций отсутствует?",
          a: "Вы можете добавить любую работу по её DOI, и SigmaCV извлечёт её сведения из открытой записи и отформатирует так, чтобы она соответствовала остальной части вашего резюме.",
        },
      ],
      relatedHeading: "Другие способы построить резюме",
    },
    "nih-biosketch": {
      intro: [
        "В NIH biosketch требуются ваши вклады в науку и тщательно отобранный набор публикаций, оформленных строго определённым образом. SigmaCV даёт вам хороший старт: войдите через ORCID, и сервис подготовит черновик biosketch в стиле NIH на основе ваших открытых научных записей — с уже извлечёнными публикациями и единообразно отформатированными ссылками.",
        "Вы сами решаете, какие вклады и какие публикации показать — biosketch должен подчёркивать работы, наиболее значимые для конкретной заявки, и SigmaCV делает этот отбор быстрым, а не превращает его в копирование-вставку. Поскольку всё строится из одной канонической записи, в следующий раз, когда вам понадобится biosketch, вы сможете повторно экспортировать обновлённую версию.",
      ],
      stepsHeading: "Как создать NIH biosketch",
      steps: [
        {
          title: "Войдите через ORCID",
          body: "SigmaCV считывает вашу открытую запись ORCID и OpenAlex — без ручного ввода списка публикаций.",
        },
        {
          title: "Подтяните вашу запись",
          body: "Ваши публикации и профиль собираются автоматически, сопоставляясь с вами по идентификатору, а не по имени.",
        },
        {
          title: "Выберите вклады и публикации",
          body: "Выберите вклады и конкретные публикации, важные для этой заявки, и расположите их в нужном порядке.",
        },
        {
          title: "Оформите и экспортируйте",
          body: "Примените макет в стиле NIH, сохраните единообразие ссылок по всему документу и экспортируйте в PDF, DOCX или LaTeX.",
        },
      ],
      whyHeading: "Почему стоит готовить biosketch с SigmaCV",
      why: [
        "Самая утомительная часть biosketch — это сбор и форматирование списка публикаций и поддержание его единообразия. SigmaCV делает это автоматически и позволяет вам сосредоточиться на повествовании — ваших вкладах в науку, — а не бороться с форматированием ссылок.",
        "Сервис бесплатен для частных лиц и имеет открытый исходный код, и он ничего не выдумывает: каждая публикация берётся из открытой записи, сопоставляется с вашим идентификатором, а вы курируете ровно то, что отображается.",
      ],
      faqExtra: [
        {
          q: "Это официальная форма NIH?",
          a: "SigmaCV формирует biosketch в стиле NIH, который вы можете адаптировать к официальному шаблону. Всегда сверяйтесь с текущими инструкциями и формами NIH для вашей конкретной возможности финансирования.",
        },
        {
          q: "Можно ли использовать мой biosketch повторно для разных заявок?",
          a: "Да. Поскольку он строится из одного канонического резюме, вы можете заново отобрать, какие публикации и вклады отображать, и экспортировать версию, подогнанную под каждую заявку.",
        },
        {
          q: "Какие публикации включаются?",
          a: "Только те, которые вы выберете. SigmaCV предлагает вашу полную запись, сопоставленную по идентификатору, а вы выбираете подмножество, наиболее значимое для заявки.",
        },
      ],
      relatedHeading: "Похожие инструменты резюме для грантодателей",
    },
    "academic-cv-template": {
      intro: [
        "Пустой шаблон академического резюме всё равно вынуждает вас вводить каждую запись вручную. SigmaCV устроен наоборот: это академическое резюме, которое заполняется само. Войдите через ORCID, и сервис построит аккуратное резюме с отформатированными ссылками из ваших реальных, открытых научных записей, так что вы начинаете с настоящих работ, а не с пустой страницы.",
        "При этом вы полностью контролируете макет и то, что отображается, — выберите шаблон, стиль цитирования, измените порядок разделов и скройте всё нерелевантное, — но самую трудоёмкую работу по сбору и форматированию ваших публикаций уже сделали за вас. Сервис бесплатен для частных лиц и имеет открытый исходный код.",
      ],
      stepsHeading: "Как использовать автоматически заполняемый шаблон академического резюме",
      steps: [
        {
          title: "Войдите через ORCID",
          body: "Никакой пустой формы для заполнения: SigmaCV считывает вашу открытую запись, чтобы заполнить шаблон за вас.",
        },
        {
          title: "Начните со своей реальной записи",
          body: "Ваши публикации извлекаются из ORCID и OpenAlex по идентификатору, а ваш профиль заполняется автоматически.",
        },
        {
          title: "Выберите макет и стиль",
          body: "Выберите шаблон и стиль цитирования CSL; переключайтесь между макетами обратимо, не теряя своих правок.",
        },
        {
          title: "Отберите и экспортируйте",
          body: "Измените порядок и скройте записи, затем экспортируйте одно и то же каноническое резюме в PDF, DOCX, LaTeX или Markdown.",
        },
      ],
      whyHeading: "Почему это лучше пустого шаблона",
      why: [
        "Шаблоны решают проблему форматирования, но не содержания — вам всё равно приходится находить каждую статью, вводить каждую деталь и форматировать каждую ссылку. SigmaCV решает обе задачи: он собирает содержание из открытой записи и форматирует ссылки через единый движок цитирования, поэтому они идентичны в каждом экспорте.",
        "И он никогда не запирает ваши данные: переключайте макеты когда угодно и скачивайте резюме в любом формате. Ничто не привязано к единственному стилю или к размещённому экземпляру, который к тому же можно полностью развернуть у себя.",
      ],
      faqExtra: [
        {
          q: "Могу ли я настроить шаблон?",
          a: "Да. Вы выбираете шаблон и стиль цитирования, меняете порядок и переименовываете разделы и решаете, что отображать, — всё применяется обратимо к одному и тому же базовому резюме.",
        },
        {
          q: "Шаблон действительно бесплатный?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код по лицензии Apache-2.0, и он считывает только публичные метаданные исследований.",
        },
        {
          q: "Обязательно ли использовать автоматически заполненное содержание?",
          a: "Нет. Всё поддаётся отбору: оставьте то, что ваше, скройте остальное и добавьте недостающее по DOI.",
        },
      ],
      relatedHeading: "Похожие шаблоны и форматы резюме",
    },
    "openalex-cv": {
      intro: [
        "OpenAlex — один из крупнейших открытых каталогов научных работ, и SigmaCV превращает ваш профиль OpenAlex в готовое академическое резюме. Войдите через ORCID, SigmaCV определит ваш идентификатор автора в OpenAlex, и ваши работы будут импортированы, отформатированы и готовы к отбору — без ручного составления списка.",
        "Сопоставление выполняется по идентификатору автора (вашему OpenAlex / ORCID ID), никогда по строке имени, поэтому ваше резюме отражает именно ваши работы, а не работы почти-однофамильца. Любые метрики OpenAlex строго опциональны и нормированы по области, в соответствии с DORA — по умолчанию отключены, и никогда не показывается импакт-фактор журнала.",
      ],
      stepsHeading: "Как построить резюме из OpenAlex",
      steps: [
        {
          title: "Войдите через ORCID",
          body: "SigmaCV использует ваш ORCID iD, чтобы определить для вас правильный профиль автора в OpenAlex.",
        },
        {
          title: "Импортируйте свои работы из OpenAlex",
          body: "Ваши работы подтягиваются по идентификатору и автоматически превращаются в отформатированные записи резюме.",
        },
        {
          title: "Отберите и (при желании) добавьте метрики",
          body: "Скройте всё, что не ваше, измените порядок записей и — только если захотите — включите нормированные по области метрики.",
        },
        {
          title: "Экспортируйте или опубликуйте",
          body: "Экспортируйте в PDF, DOCX, LaTeX или Markdown либо опубликуйте живую страницу, которая повторно синхронизируется с OpenAlex.",
        },
      ],
      whyHeading: "Почему стоит использовать ваш профиль OpenAlex именно так",
      why: [
        "OpenAlex даёт широкое, открытое покрытие ваших публикаций, но «сырой» профиль — это ещё не резюме. SigmaCV оформляет его в резюме: единообразные ссылки, выбранный вами макет и ваше собственное имя, выделенное по идентификатору в списках авторов.",
        "Сервис бесплатен для частных лиц и имеет открытый исходный код, считывает только публичные метаданные и обращается с метриками ответственно: они остаются отключёнными, пока вы их не включите, а SigmaCV предпочитает нормированные по области показатели «сырым» подсчётам.",
      ],
      faqExtra: [
        {
          q: "Что, если в моём профиле OpenAlex есть ошибки?",
          a: "Вы курируете всё: помечайте ошибочно приписанные работы как «не моё» (они скрываются, а не удаляются) и добавляйте недостающие по DOI. Ваши исправления формируют ваше резюме, не изменяя OpenAlex.",
        },
        {
          q: "Показываются ли метрики OpenAlex по умолчанию?",
          a: "Нет. Метрики по умолчанию отключены и полностью опциональны. При включении SigmaCV предпочитает нормированные по области показатели и никогда не показывает импакт-фактор журнала.",
        },
        {
          q: "Сопоставляет ли он мои работы по имени?",
          a: "Нет — по идентификатору автора (OpenAlex / ORCID ID), что исключает ложные совпадения, характерные для общих или транслитерированных имён.",
        },
      ],
      relatedHeading: "Другие способы построить резюме",
    },
    "publication-list": {
      intro: [
        "Отформатированный список публикаций — основа любого академического резюме и при этом самая утомительная для ведения часть. SigmaCV формирует его за вас: войдите через ORCID, и сервис построит единообразный список ваших публикаций с отформатированными ссылками из ORCID и OpenAlex — готовый к изменению порядка и переносу в ваше резюме.",
        "Выберите любой стиль цитирования CSL, и форматирование останется идентичным во всех формах вывода — PDF, DOCX, LaTeX, Markdown, и даже BibTeX и CSL-JSON для использования в других местах. Ваше собственное имя выделяется по идентификатору, поэтому оно корректно выделяется даже в длинных списках с многими авторами.",
      ],
      stepsHeading: "Как создать отформатированный список публикаций",
      steps: [
        {
          title: "Войдите через ORCID",
          body: "SigmaCV считывает вашу открытую запись ORCID и OpenAlex, чтобы собрать ваши публикации.",
        },
        {
          title: "Подтяните и устраните дубликаты работ",
          body: "Ваши публикации импортируются по идентификатору и собираются в единый, аккуратный список.",
        },
        {
          title: "Выберите стиль цитирования",
          body: "Выберите любой стиль CSL; список мгновенно переформатируется и остаётся единообразным во всех форматах.",
        },
        {
          title: "Измените порядок и экспортируйте",
          body: "Расположите работы в нужном порядке и экспортируйте в PDF, DOCX, LaTeX, Markdown или BibTeX.",
        },
      ],
      whyHeading: "Почему стоит формировать список публикаций с SigmaCV",
      why: [
        "Единый движок цитирования (Citation Style Language, тот же стандарт, что стоит за Zotero и Mendeley) форматирует весь ваш список, поэтому между вашим резюме в Word и в LaTeX не возникает расхождений в ссылках. Измените стиль один раз — и каждая форма вывода последует за ним.",
        "Сервис бесплатен для частных лиц и имеет открытый исходный код, и он честен в отношении авторства: работы сопоставляются по идентификатору, ваше имя выделяется по идентификатору, а вы курируете ровно то, какие публикации отображаются.",
      ],
      faqExtra: [
        {
          q: "Могу ли я выбрать стиль цитирования?",
          a: "Да. SigmaCV форматирует ваш список через CSL, поэтому вы можете выбрать любой поддерживаемый стиль, и форматирование останется идентичным в PDF, DOCX, LaTeX и Markdown.",
        },
        {
          q: "Можно ли экспортировать список как BibTeX?",
          a: "Да. Наряду с PDF, DOCX, LaTeX и Markdown SigmaCV может экспортировать ваши отобранные публикации как BibTeX и CSL-JSON для использования в других местах.",
        },
        {
          q: "Можно ли разделить список по типам, например статьи и препринты?",
          a: "Да. Вы организуете свои работы по разделам и располагаете их как угодно; список полностью поддаётся отбору перед экспортом.",
        },
      ],
      relatedHeading: "Похожие инструменты для резюме и цитирования",
    },
    "latex-cv": {
      intro: [
        "Если вы пишете резюме в LaTeX, SigmaCV избавляет вас от самого утомительного шага: он формирует готовое к компиляции академическое резюме в LaTeX из ваших открытых научных записей вместе с соответствующей библиографией .bib — вместо пустого шаблона, который вы заполняете вручную.",
        "Войдите через ORCID, отберите свою запись и экспортируйте резюме в .tex плюс файл .bib, которые вы компилируете в собственной среде. Ссылки формируются через CSL, поэтому ваше резюме в LaTeX читается идентично версиям того же канонического резюме в PDF, DOCX и Markdown.",
      ],
      stepsHeading: "Как создать академическое резюме в LaTeX",
      steps: [
        {
          title: "Войдите через ORCID",
          body: "SigmaCV строит ваше резюме из вашей открытой записи ORCID и OpenAlex — без ручной возни с BibTeX.",
        },
        {
          title: "Отберите своё резюме",
          body: "Выберите, какие публикации и разделы отображать, и расположите их по порядку — всё из одной канонической записи.",
        },
        {
          title: "Экспортируйте .tex и .bib",
          body: "Скачайте резюме в LaTeX с сопроводительной библиографией .bib, сформированной из ваших отобранных публикаций.",
        },
        {
          title: "Компилируйте в собственной среде",
          body: "Компилируйте .tex в Overleaf или в вашем локальном дистрибутиве TeX; дальше правьте LaTeX как угодно.",
        },
      ],
      whyHeading: "Почему стоит формировать LaTeX с SigmaCV",
      why: [
        "Вести файл .bib вручную и держать его в синхронизации с резюме — занятие, чреватое ошибками. SigmaCV собирает и сам документ, и библиографию из вашей реальной записи, поэтому записи полны, а ссылки единообразны с самого начала.",
        "Сервис бесплатен для частных лиц и имеет открытый исходный код, и здесь нет привязки: вы получаете обычные файлы .tex и .bib, которые компилируете и редактируете как угодно, а то же резюме экспортируется в другие форматы, когда они вам понадобятся.",
      ],
      faqExtra: [
        {
          q: "Какие файлы LaTeX экспортирует SigmaCV?",
          a: "Резюме .tex плюс библиографию .bib, собранную из ваших отобранных публикаций, так что вы можете скомпилировать документ в собственной среде LaTeX.",
        },
        {
          q: "Можно ли использовать это с Overleaf?",
          a: "Да. Экспортируемые .tex и .bib — это стандартные файлы, которые вы можете загрузить в Overleaf или скомпилировать локально любым дистрибутивом TeX.",
        },
        {
          q: "Это замена шаблона moderncv или Overleaf?",
          a: "Это их дополнение: вместо ввода записей в пустой шаблон в стиле moderncv SigmaCV заполняет содержание из вашей записи и даёт вам .tex и .bib, чтобы развивать дальше.",
        },
      ],
      relatedHeading: "Похожие форматы резюме",
    },
    "funder-cv-templates": {
      intro: [
        "Каждый грантодатель хочет собственный формат резюме, и пересобирать резюме под каждый из них — рутина. SigmaCV поставляется с 58 макетами «в один щелчок» для крупных грантодателей, учреждений и индустрии — включая UKRI R4RI, Royal Society, швейцарский SNSF, американские NIH и NSF и европейский ERC — применяемыми обратимо к вашим открытым научным записям.",
        "Войдите через ORCID, и один щелчок перестроит ваше каноническое резюме под выбранный макет грантодателя: нужные разделы, в нужном порядке, с нужными заголовками. Свободно переключайтесь между форматами — применение макета выбирает и переупорядочивает разделы, но никогда не удаляет ваши данные.",
      ],
      stepsHeading: "Как использовать шаблоны резюме для грантодателей",
      steps: [
        {
          title: "Войдите через ORCID",
          body: "SigmaCV собирает ваше резюме из вашей открытой записи, чтобы каждый макет грантодателя начинался с одного и того же содержания.",
        },
        {
          title: "Выберите макет грантодателя",
          body: "Выберите из 58 макетов «в один щелчок» — ERC, UKRI R4RI, NSF, NIH, SNSF, Royal Society и другие.",
        },
        {
          title: "Отберите под заявку",
          body: "Настройте, какие публикации и разделы отображать, чтобы резюме подходило под конкретный конкурс, — всё обратимо.",
        },
        {
          title: "Экспортируйте",
          body: "Экспортируйте отформатированное резюме в PDF, DOCX или LaTeX с единообразными ссылками по всему документу.",
        },
      ],
      whyHeading: "Почему стоит использовать SigmaCV для резюме грантодателей",
      why: [
        "Форматы грантодателей различаются по структуре, а не по вашей базовой записи. SigmaCV разделяет эти две вещи: ваши данные хранятся в одном каноническом резюме, а макеты — это решения о представлении, применяемые поверх, поэтому переход от резюме для ERC к нарративу UKRI R4RI — это щелчок, а не пересборка.",
        "Сервис бесплатен для частных лиц и имеет открытый исходный код, и применение макета всегда обратимо. Ваш отбор сохраняется при переходе между форматами грантодателей, а ссылки остаются единообразными в каждом из них.",
      ],
      faqExtra: [
        {
          q: "Какие форматы грантодателей поддерживаются?",
          a: "58 макетов «в один щелчок», охватывающих форматы грантодателей, учреждений и индустрии — включая UKRI R4RI, Royal Society, SNSF, NIH, NSF и ERC — каждый заполняется из ваших открытых научных записей.",
        },
        {
          q: "Потеряю ли я правки при переключении макетов?",
          a: "Нет. Макеты применяются обратимо к одному и тому же каноническому резюме, поэтому вы можете переключаться между форматами грантодателей, а ваш отбор сохраняется.",
        },
        {
          q: "Это официальные формы грантодателей?",
          a: "Это макеты SigmaCV, смоделированные по структуре каждого грантодателя. Всегда сверяйтесь с актуальными официальными рекомендациями и шаблонами грантодателя перед подачей.",
        },
      ],
      relatedHeading: "Похожие инструменты для грантодателей и шаблонов",
    },
  },
};

/** Deep localized content for a landing page (falls back to English). */
export function landingPageContent(page: LandingPageId, locale: string): LandingPageContent {
  return LANDING_CONTENT_I18N[asLocale(locale)][page];
}
