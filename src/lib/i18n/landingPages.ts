import { asLocale, type Locale } from "./index";

/**
 * High-intent SEO landing-page copy, localized for all 10 supported languages.
 * Typed as Record<Locale, Record<LandingPageId, LandingPageStrings>> so a
 * missing translation is a compile error. Each page funnels to the homepage
 * sign-in card. Used by the bare routes (`/orcid-to-cv`, `/nih-biosketch`) and
 * their localized `/[locale]/…` variants, plus the FAQPage JSON-LD builder.
 *
 * Every locale has the SAME page ids, the SAME 3 benefit bullets and the SAME
 * 2 FAQ items in the SAME order. Proper nouns (SigmaCV, OpenAlex, ORCID, NIH)
 * are kept untranslated.
 *
 * NOTE: the non-English copy below is machine-drafted and should get a
 * native-speaker review pass before launch.
 */

/** Stable ids for the SEO landing pages (used as the URL path segment). */
export const LANDING_PAGE_IDS = [
  "orcid-to-cv",
  "nih-biosketch",
  "academic-cv-template",
  "openalex-cv",
  "publication-list",
  "latex-cv",
  "funder-cv-templates",
] as const;
export type LandingPageId = (typeof LANDING_PAGE_IDS)[number];

export interface LandingPageStrings {
  /** <title> for this page (SEO) — the root layout appends " — SigmaCV". */
  metaTitle: string;
  /** <meta name="description"> — carries the target keyword. */
  metaDescription: string;
  /** Short footer/nav label. */
  navLabel: string;
  /** H1 — contains the target phrase. */
  heading: string;
  /** One-sentence subhead. */
  subhead: string;
  /** Exactly 3 short benefit bullets. */
  bullets: [string, string, string];
  /** Primary call-to-action label (links to the sign-in homepage). */
  cta: string;
  /** Exactly 2 short FAQ question/answer pairs. */
  faq: [{ q: string; a: string }, { q: string; a: string }];
  /** "← Back to SigmaCV" link label. */
  backLink: string;
}

const LANDING_PAGES_I18N: Record<Locale, Record<LandingPageId, LandingPageStrings>> = {
  "en-US": {
    "orcid-to-cv": {
      metaTitle: "Turn your ORCID iD into an academic CV",
      metaDescription:
        "Turn your ORCID iD into a clean academic CV in minutes. SigmaCV pulls your publications from ORCID and OpenAlex, formats citations, and exports to PDF, DOCX, LaTeX or Markdown. Free and open source.",
      navLabel: "ORCID to CV",
      heading: "Turn your ORCID iD into an academic CV",
      subhead:
        "Sign in with ORCID and SigmaCV builds a clean, citation-formatted academic CV from your open research record — ready to curate and export.",
      bullets: [
        "Publications pulled automatically from ORCID and OpenAlex — matched by identifier, never by name.",
        "Consistent citations in any CSL style, exported to PDF, DOCX, LaTeX or Markdown.",
        "Free for individuals and open source; you curate exactly what appears.",
      ],
      cta: "Build your CV from ORCID",
      faq: [
        {
          q: "How do I turn my ORCID iD into a CV?",
          a: "Sign in with your ORCID iD. SigmaCV reads your public record and your OpenAlex profile, assembles your publications and profile into a CV, and lets you curate and export it.",
        },
        {
          q: "Is it free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence. It reads only public research metadata.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "Generate an NIH biosketch from ORCID & OpenAlex",
      metaDescription:
        "Generate an NIH biosketch from your ORCID and OpenAlex record. SigmaCV assembles your contributions and publications, formats citations, and exports — free and open source.",
      navLabel: "NIH biosketch",
      heading: "Generate an NIH biosketch from ORCID and OpenAlex",
      subhead:
        "Sign in with ORCID and SigmaCV drafts an NIH-style biosketch from your open research record — your contributions and publications, ready to refine and export.",
      bullets: [
        "Your publications and profile pulled from ORCID and OpenAlex — matched by identifier, never by name.",
        "Pick the publications that matter, with consistent citation formatting throughout.",
        "Export to PDF, DOCX or LaTeX; free for individuals and open source.",
      ],
      cta: "Generate your biosketch",
      faq: [
        {
          q: "How do I generate an NIH biosketch?",
          a: "Sign in with your ORCID iD. SigmaCV pulls your publications and profile from ORCID and OpenAlex, then you curate the contributions and selected publications and export the biosketch.",
        },
        {
          q: "Can I choose which publications appear?",
          a: "Yes. You curate exactly which publications are listed and in what order, so the biosketch reflects the work most relevant to your application.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "academic-cv-template": {
      metaTitle: "Free academic CV template, auto-filled from your record",
      metaDescription:
        "A free academic CV template that fills itself in. SigmaCV builds your CV from ORCID and OpenAlex, formats citations, and exports to PDF, DOCX, LaTeX or Markdown.",
      navLabel: "Academic CV template",
      heading: "A free academic CV template, auto-filled from your research record",
      subhead:
        "Instead of a blank academic CV template, sign in with ORCID and SigmaCV assembles a clean, citation-formatted CV from your open research record — ready to curate and export.",
      bullets: [
        "Start from your real record, not an empty template — publications pulled from ORCID and OpenAlex by identifier, never by name.",
        "Pick a layout and a CSL citation style; the same canonical CV exports to PDF, DOCX, LaTeX or Markdown.",
        "Free for individuals and open source — you curate exactly which sections and publications appear.",
      ],
      cta: "Build your academic CV",
      faq: [
        {
          q: "How is this different from a blank academic CV template?",
          a: "A blank template still needs you to type every entry. SigmaCV reads your ORCID and OpenAlex record, fills the CV in for you, formats the citations consistently, and lets you curate and export it.",
        },
        {
          q: "Is the academic CV template free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence. It reads only public research metadata.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "Build an academic CV from your OpenAlex profile",
      metaDescription:
        "Turn your OpenAlex profile into an academic CV. SigmaCV pulls your publications by identifier, formats citations, and exports to PDF, DOCX, LaTeX or Markdown. Free and open source.",
      navLabel: "OpenAlex CV",
      heading: "Build an academic CV from your OpenAlex profile",
      subhead:
        "Sign in with ORCID and SigmaCV reads your OpenAlex record to assemble a clean, citation-formatted academic CV — matched to you by author identifier, ready to curate and export.",
      bullets: [
        "Your OpenAlex works imported automatically and matched by OpenAlex / ORCID author ID — never by name string.",
        "Metrics and grant fields from OpenAlex are available, opt-in and field-normalized — default none, DORA-aligned.",
        "Consistent CSL citations exported to PDF, DOCX, LaTeX or Markdown; free for individuals and open source.",
      ],
      cta: "Build your CV from OpenAlex",
      faq: [
        {
          q: "How does SigmaCV use my OpenAlex profile?",
          a: "Sign in with your ORCID iD. SigmaCV resolves your OpenAlex author identifier, pulls your works and profile, and assembles them into a CV you can curate and export.",
        },
        {
          q: "Does it match my publications by name?",
          a: "No. SigmaCV matches works by author identifier (OpenAlex / ORCID ID), never by name string, which avoids the false matches common with shared or transliterated names.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "publication-list": {
      metaTitle: "Generate a formatted publication list from ORCID",
      metaDescription:
        "Generate a formatted publication list for your CV from ORCID and OpenAlex. Pick any CSL style; export to PDF, DOCX, LaTeX, Markdown or BibTeX. Free and open source.",
      navLabel: "Publication list",
      heading: "Generate a formatted publication list from your research record",
      subhead:
        "Sign in with ORCID and SigmaCV builds a consistent, citation-formatted list of your publications from ORCID and OpenAlex — ready to curate, reorder and export.",
      bullets: [
        "Publications pulled from ORCID and OpenAlex by identifier, then formatted in any CSL citation style — identical in every output.",
        "Choose which works appear and in what order; your own name is highlighted by ORCID / OpenAlex ID.",
        "Export the list to PDF, DOCX, LaTeX, Markdown or BibTeX; free for individuals and open source.",
      ],
      cta: "Generate your publication list",
      faq: [
        {
          q: "Can I choose the citation style for my publication list?",
          a: "Yes. SigmaCV formats your list through CSL, so you can pick any supported citation style and the formatting stays identical across PDF, DOCX, LaTeX and Markdown.",
        },
        {
          q: "Can I export the list as BibTeX?",
          a: "Yes. Alongside PDF, DOCX, LaTeX and Markdown, SigmaCV can export your curated publications as BibTeX and CSL-JSON for reuse elsewhere.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "latex-cv": {
      metaTitle: "Generate a LaTeX academic CV from ORCID & OpenAlex",
      metaDescription:
        "Generate a LaTeX academic CV from your ORCID and OpenAlex record. SigmaCV produces .tex and .bib you can compile, with consistent CSL citations. Free and open source.",
      navLabel: "LaTeX CV",
      heading: "Generate a LaTeX academic CV from your research record",
      subhead:
        "Sign in with ORCID and SigmaCV builds your CV from the open research record and exports ready-to-compile LaTeX — not a blank template you fill in by hand.",
      bullets: [
        "Export a LaTeX CV with an accompanying .bib bibliography, generated from your ORCID and OpenAlex publications.",
        "Citations are formatted through CSL, so PDF, DOCX, LaTeX and Markdown all read identically.",
        "Free for individuals and open source; you curate the content, then compile the .tex yourself.",
      ],
      cta: "Build your LaTeX CV",
      faq: [
        {
          q: "What LaTeX files does SigmaCV export?",
          a: "SigmaCV exports a .tex CV plus a .bib bibliography assembled from your curated publications, so you can compile the document in your own LaTeX setup.",
        },
        {
          q: "Do I need to format the LaTeX myself?",
          a: "No. SigmaCV fills the LaTeX CV in from your ORCID and OpenAlex record and formats the citations for you — unlike a blank LaTeX template, where you type every entry.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "Funder CV templates: ERC, UKRI, NSF, NIH & SNSF",
      metaDescription:
        "One-click funder CV layouts for ERC, UKRI R4RI, NSF, NIH and SNSF. SigmaCV fills them from your ORCID and OpenAlex record and exports to PDF, DOCX or LaTeX. Free and open source.",
      navLabel: "Funder CV templates",
      heading: "Funder CV templates for ERC, UKRI, NSF, NIH and SNSF",
      subhead:
        "Sign in with ORCID and SigmaCV applies a one-click funder layout to your open research record — ERC, UKRI R4RI, NSF, NIH, SNSF and more — ready to curate and export.",
      bullets: [
        "58 one-click funder, institution and industry layouts, including UKRI R4RI, Royal Society, SNSF, NIH, NSF and ERC — applied reversibly.",
        "Each layout fills from your ORCID and OpenAlex record, with consistent CSL citations throughout.",
        "Export to PDF, DOCX or LaTeX; free for individuals and open source, so you control exactly what appears.",
      ],
      cta: "Choose a funder CV layout",
      faq: [
        {
          q: "Which funder CV formats does SigmaCV support?",
          a: "SigmaCV offers 58 one-click layouts spanning funder, institution and industry formats — including UKRI R4RI, Royal Society, SNSF, NIH, NSF and ERC — each filled from your open research record.",
        },
        {
          q: "Can I switch layouts without losing my edits?",
          a: "Yes. Layouts are applied reversibly to the same canonical CV, so you can switch between funder formats and your curation is preserved.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
  },
  "zh-CN": {
    "orcid-to-cv": {
      metaTitle: "将您的 ORCID iD 转换为学术简历",
      metaDescription:
        "几分钟内将您的 ORCID iD 转换为简洁的学术简历。SigmaCV 从 ORCID 和 OpenAlex 提取您的论文、格式化引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
      navLabel: "ORCID 转简历",
      heading: "将您的 ORCID iD 转换为学术简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可依据您公开的学术记录生成一份简洁、已格式化引用的学术简历——随时可整理和导出。",
      bullets: [
        "论文自动从 ORCID 和 OpenAlex 提取——通过标识符匹配，绝不通过姓名。",
        "以任意 CSL 样式提供一致的引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
        "对个人免费且开源；您可精确决定显示哪些内容。",
      ],
      cta: "从 ORCID 生成简历",
      faq: [
        {
          q: "如何将我的 ORCID iD 转换为简历？",
          a: "使用您的 ORCID iD 登录。SigmaCV 会读取您的公开记录和 OpenAlex 档案，将您的论文与个人资料汇总为一份简历，您可对其进行整理和导出。",
        },
        {
          q: "免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源。它仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "根据 ORCID 和 OpenAlex 生成 NIH biosketch",
      metaDescription:
        "根据您的 ORCID 和 OpenAlex 记录生成 NIH biosketch。SigmaCV 汇总您的贡献和论文、格式化引用并导出——免费且开源。",
      navLabel: "NIH biosketch",
      heading: "根据 ORCID 和 OpenAlex 生成 NIH biosketch",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可依据您公开的学术记录起草一份 NIH 风格的 biosketch——汇总您的贡献与论文，随时可优化和导出。",
      bullets: [
        "您的论文和个人资料从 ORCID 和 OpenAlex 提取——通过标识符匹配，绝不通过姓名。",
        "挑选最重要的论文，并在全文保持一致的引用格式。",
        "导出为 PDF、DOCX 或 LaTeX；对个人免费且开源。",
      ],
      cta: "生成您的 biosketch",
      faq: [
        {
          q: "如何生成 NIH biosketch？",
          a: "使用您的 ORCID iD 登录。SigmaCV 会从 ORCID 和 OpenAlex 提取您的论文和个人资料，随后您可整理贡献和所选论文，并导出 biosketch。",
        },
        {
          q: "我可以选择显示哪些论文吗？",
          a: "可以。您可精确决定列出哪些论文及其顺序，使 biosketch 突出与您申请最相关的成果。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "academic-cv-template": {
      metaTitle: "免费学术简历模板，自动从您的学术记录填充",
      metaDescription:
        "一份可自动填充的免费学术简历模板。SigmaCV 从 ORCID 和 OpenAlex 构建您的简历，格式化引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
      navLabel: "学术简历模板",
      heading: "免费学术简历模板，自动从您的研究记录填充",
      subhead:
        "无需从空白模板开始——使用 ORCID 登录，SigmaCV 即可依据您公开的学术记录生成一份简洁、已格式化引用的学术简历，随时可整理和导出。",
      bullets: [
        "从您的真实记录出发，而非空白模板——论文通过标识符从 ORCID 和 OpenAlex 提取，绝不通过姓名。",
        "选择布局和 CSL 引用样式；同一份规范简历可导出为 PDF、DOCX、LaTeX 或 Markdown。",
        "对个人免费且开源——您可精确决定显示哪些章节和论文。",
      ],
      cta: "生成学术简历",
      faq: [
        {
          q: "这与空白学术简历模板有何不同？",
          a: "空白模板仍需您手动输入每一条记录。SigmaCV 读取您的 ORCID 和 OpenAlex 档案，为您自动填充简历、统一格式化引用，并支持整理和导出。",
        },
        {
          q: "学术简历模板是免费的吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源。它仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "根据您的 OpenAlex 档案生成学术简历",
      metaDescription:
        "将您的 OpenAlex 档案转换为学术简历。SigmaCV 通过标识符提取您的论文、格式化引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
      navLabel: "OpenAlex 简历",
      heading: "根据您的 OpenAlex 档案生成学术简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 读取您的 OpenAlex 记录，生成一份简洁、已格式化引用的学术简历——通过作者标识符精准匹配，随时可整理和导出。",
      bullets: [
        "您的 OpenAlex 成果自动导入，并通过 OpenAlex / ORCID 作者 ID 匹配——绝不通过姓名字符串。",
        "OpenAlex 的指标和资助字段可选启用，并经过字段归一化——默认不显示，符合 DORA 原则。",
        "一致的 CSL 引用，可导出为 PDF、DOCX、LaTeX 或 Markdown；对个人免费且开源。",
      ],
      cta: "从 OpenAlex 生成简历",
      faq: [
        {
          q: "SigmaCV 如何使用我的 OpenAlex 档案？",
          a: "使用您的 ORCID iD 登录。SigmaCV 解析您的 OpenAlex 作者标识符，提取您的成果和档案，并将其汇总为可整理和导出的简历。",
        },
        {
          q: "它是通过姓名匹配我的论文吗？",
          a: "不是。SigmaCV 通过作者标识符（OpenAlex / ORCID ID）匹配成果，绝不通过姓名字符串，从而避免了同名或音译姓名常见的错误匹配。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "publication-list": {
      metaTitle: "从 ORCID 生成格式化的论文列表",
      metaDescription:
        "从 ORCID 和 OpenAlex 为您的简历生成格式化的论文列表。选择任意 CSL 样式；导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。免费且开源。",
      navLabel: "论文列表",
      heading: "从您的学术记录生成格式化的论文列表",
      subhead:
        "使用 ORCID 登录，SigmaCV 从 ORCID 和 OpenAlex 构建一份一致、已格式化引用的论文列表——随时可整理、重排和导出。",
      bullets: [
        "论文通过标识符从 ORCID 和 OpenAlex 提取，并以任意 CSL 引用样式格式化——在每种输出中保持一致。",
        "选择显示哪些成果及其顺序；您的姓名通过 ORCID / OpenAlex ID 高亮显示。",
        "将列表导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX；对个人免费且开源。",
      ],
      cta: "生成论文列表",
      faq: [
        {
          q: "我可以选择论文列表的引用样式吗？",
          a: "可以。SigmaCV 通过 CSL 格式化您的列表，您可选择任意支持的引用样式，且 PDF、DOCX、LaTeX 和 Markdown 中的格式完全一致。",
        },
        {
          q: "我可以将列表导出为 BibTeX 吗？",
          a: "可以。除 PDF、DOCX、LaTeX 和 Markdown 外，SigmaCV 还可将您整理后的论文导出为 BibTeX 和 CSL-JSON，供其他用途复用。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "latex-cv": {
      metaTitle: "从 ORCID 和 OpenAlex 生成 LaTeX 学术简历",
      metaDescription:
        "从您的 ORCID 和 OpenAlex 记录生成 LaTeX 学术简历。SigmaCV 生成可编译的 .tex 和 .bib 文件，并提供一致的 CSL 引用。免费且开源。",
      navLabel: "LaTeX 简历",
      heading: "从您的学术记录生成 LaTeX 学术简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 从公开的学术记录构建您的简历，并导出随时可编译的 LaTeX 文件——而非需要手动填写的空白模板。",
      bullets: [
        "导出带有配套 .bib 参考书目的 LaTeX 简历，由您的 ORCID 和 OpenAlex 论文生成。",
        "引用通过 CSL 格式化，因此 PDF、DOCX、LaTeX 和 Markdown 的内容完全一致。",
        "对个人免费且开源；您整理内容，然后自行编译 .tex 文件。",
      ],
      cta: "生成 LaTeX 简历",
      faq: [
        {
          q: "SigmaCV 导出哪些 LaTeX 文件？",
          a: "SigmaCV 导出一个 .tex 简历文件和一个由您整理后的论文汇编而成的 .bib 参考书目，供您在自己的 LaTeX 环境中编译。",
        },
        {
          q: "我需要自己手动格式化 LaTeX 吗？",
          a: "不需要。SigmaCV 从您的 ORCID 和 OpenAlex 记录自动填充 LaTeX 简历并为您格式化引用——不像空白 LaTeX 模板那样需要手动输入每一条记录。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "资助机构简历模板：ERC、UKRI、NSF、NIH 和 SNSF",
      metaDescription:
        "ERC、UKRI R4RI、NSF、NIH 和 SNSF 的一键式资助机构简历布局。SigmaCV 从您的 ORCID 和 OpenAlex 记录填充，并导出为 PDF、DOCX 或 LaTeX。免费且开源。",
      navLabel: "资助机构简历模板",
      heading: "ERC、UKRI、NSF、NIH 和 SNSF 资助机构简历模板",
      subhead:
        "使用 ORCID 登录，SigmaCV 将一键式资助机构布局应用于您公开的学术记录——ERC、UKRI R4RI、NSF、NIH、SNSF 等，随时可整理和导出。",
      bullets: [
        "58 种一键式资助机构、高校和行业布局，包括 UKRI R4RI、Royal Society、SNSF、NIH、NSF 和 ERC——可可逆应用。",
        "每种布局从您的 ORCID 和 OpenAlex 记录填充，并在全文保持一致的 CSL 引用。",
        "导出为 PDF、DOCX 或 LaTeX；对个人免费且开源，您可完全掌控显示内容。",
      ],
      cta: "选择资助机构简历布局",
      faq: [
        {
          q: "SigmaCV 支持哪些资助机构简历格式？",
          a: "SigmaCV 提供 58 种一键式布局，涵盖资助机构、高校和行业格式——包括 UKRI R4RI、Royal Society、SNSF、NIH、NSF 和 ERC——每种均从您的公开学术记录填充。",
        },
        {
          q: "切换布局会丢失我的编辑内容吗？",
          a: "不会。布局以可逆方式应用于同一份规范简历，因此您可在各资助机构格式之间自由切换，整理内容始终保留。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
  },
  "es-ES": {
    "orcid-to-cv": {
      metaTitle: "Convierte tu iD ORCID en un CV académico",
      metaDescription:
        "Convierte tu iD ORCID en un CV académico limpio en minutos. SigmaCV extrae tus publicaciones de ORCID y OpenAlex, da formato a las citas y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
      navLabel: "ORCID a CV",
      heading: "Convierte tu iD ORCID en un CV académico",
      subhead:
        "Inicia sesión con ORCID y SigmaCV crea un CV académico limpio y con citas formateadas a partir de tu registro científico abierto, listo para seleccionar y exportar.",
      bullets: [
        "Las publicaciones se extraen automáticamente de ORCID y OpenAlex, identificadas por identificador, nunca por nombre.",
        "Citas coherentes en cualquier estilo CSL, exportadas a PDF, DOCX, LaTeX o Markdown.",
        "Gratis para particulares y de código abierto; tú seleccionas exactamente lo que aparece.",
      ],
      cta: "Crea tu CV desde ORCID",
      faq: [
        {
          q: "¿Cómo convierto mi iD ORCID en un CV?",
          a: "Inicia sesión con tu iD ORCID. SigmaCV lee tu registro público y tu perfil de OpenAlex, reúne tus publicaciones y tu perfil en un CV y te permite seleccionarlo y exportarlo.",
        },
        {
          q: "¿Es gratis?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0. Solo lee metadatos públicos de investigación.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "Genera un biosketch NIH desde ORCID y OpenAlex",
      metaDescription:
        "Genera un biosketch NIH a partir de tu registro de ORCID y OpenAlex. SigmaCV reúne tus contribuciones y publicaciones, da formato a las citas y exporta: gratis y de código abierto.",
      navLabel: "Biosketch NIH",
      heading: "Genera un biosketch NIH desde ORCID y OpenAlex",
      subhead:
        "Inicia sesión con ORCID y SigmaCV redacta un biosketch al estilo NIH a partir de tu registro científico abierto: tus contribuciones y publicaciones, listas para refinar y exportar.",
      bullets: [
        "Tus publicaciones y tu perfil se extraen de ORCID y OpenAlex, identificados por identificador, nunca por nombre.",
        "Elige las publicaciones que importan, con un formato de citas coherente en todo el documento.",
        "Exporta a PDF, DOCX o LaTeX; gratis para particulares y de código abierto.",
      ],
      cta: "Genera tu biosketch",
      faq: [
        {
          q: "¿Cómo genero un biosketch NIH?",
          a: "Inicia sesión con tu iD ORCID. SigmaCV extrae tus publicaciones y tu perfil de ORCID y OpenAlex; luego seleccionas las contribuciones y las publicaciones elegidas y exportas el biosketch.",
        },
        {
          q: "¿Puedo elegir qué publicaciones aparecen?",
          a: "Sí. Tú seleccionas exactamente qué publicaciones se enumeran y en qué orden, para que el biosketch refleje el trabajo más relevante para tu solicitud.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "academic-cv-template": {
      metaTitle: "Plantilla de CV académico gratuita, completada automáticamente desde tu registro",
      metaDescription:
        "Una plantilla de CV académico gratuita que se rellena sola. SigmaCV construye tu CV a partir de ORCID y OpenAlex, da formato a las citas y exporta a PDF, DOCX, LaTeX o Markdown.",
      navLabel: "Plantilla de CV académico",
      heading:
        "Una plantilla de CV académico gratuita, completada automáticamente desde tu registro de investigación",
      subhead:
        "En lugar de una plantilla de CV académico en blanco, inicia sesión con ORCID y SigmaCV crea un CV limpio y con citas formateadas a partir de tu registro científico abierto, listo para seleccionar y exportar.",
      bullets: [
        "Parte de tu registro real, no de una plantilla vacía: publicaciones extraídas de ORCID y OpenAlex por identificador, nunca por nombre.",
        "Elige una plantilla y un estilo de citas CSL; el mismo CV canónico se exporta a PDF, DOCX, LaTeX o Markdown.",
        "Gratis para particulares y de código abierto: tú seleccionas exactamente qué secciones y publicaciones aparecen.",
      ],
      cta: "Crea tu CV académico",
      faq: [
        {
          q: "¿En qué se diferencia de una plantilla de CV académico en blanco?",
          a: "Una plantilla en blanco requiere que escribas cada entrada manualmente. SigmaCV lee tu registro de ORCID y OpenAlex, rellena el CV por ti, da formato coherente a las citas y te permite seleccionarlo y exportarlo.",
        },
        {
          q: "¿La plantilla de CV académico es gratuita?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0. Solo lee metadatos públicos de investigación.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "Crea un CV académico a partir de tu perfil de OpenAlex",
      metaDescription:
        "Convierte tu perfil de OpenAlex en un CV académico. SigmaCV extrae tus publicaciones por identificador, da formato a las citas y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
      navLabel: "CV de OpenAlex",
      heading: "Crea un CV académico a partir de tu perfil de OpenAlex",
      subhead:
        "Inicia sesión con ORCID y SigmaCV lee tu registro de OpenAlex para crear un CV académico limpio y con citas formateadas, identificado por identificador de autor, listo para seleccionar y exportar.",
      bullets: [
        "Tus trabajos de OpenAlex importados automáticamente e identificados por identificador de autor de OpenAlex / ORCID, nunca por cadena de nombre.",
        "Las métricas y los campos de financiación de OpenAlex están disponibles de forma opcional y normalizados por campo: ninguna por defecto, alineado con DORA.",
        "Citas CSL coherentes exportadas a PDF, DOCX, LaTeX o Markdown; gratis para particulares y de código abierto.",
      ],
      cta: "Crea tu CV desde OpenAlex",
      faq: [
        {
          q: "¿Cómo usa SigmaCV mi perfil de OpenAlex?",
          a: "Inicia sesión con tu iD ORCID. SigmaCV resuelve tu identificador de autor de OpenAlex, extrae tus trabajos y perfil, y los ensambla en un CV que puedes seleccionar y exportar.",
        },
        {
          q: "¿Identifica mis publicaciones por nombre?",
          a: "No. SigmaCV identifica los trabajos por identificador de autor (ID de OpenAlex / ORCID), nunca por cadena de nombre, lo que evita las coincidencias falsas habituales con nombres compartidos o transliterados.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "publication-list": {
      metaTitle: "Genera una lista de publicaciones formateada desde ORCID",
      metaDescription:
        "Genera una lista de publicaciones formateada para tu CV desde ORCID y OpenAlex. Elige cualquier estilo CSL; exporta a PDF, DOCX, LaTeX, Markdown o BibTeX. Gratis y de código abierto.",
      navLabel: "Lista de publicaciones",
      heading: "Genera una lista de publicaciones formateada desde tu registro de investigación",
      subhead:
        "Inicia sesión con ORCID y SigmaCV crea una lista coherente y con citas formateadas de tus publicaciones desde ORCID y OpenAlex, lista para seleccionar, reordenar y exportar.",
      bullets: [
        "Publicaciones extraídas de ORCID y OpenAlex por identificador y formateadas en cualquier estilo de citas CSL, idénticas en todos los formatos de salida.",
        "Elige qué trabajos aparecen y en qué orden; tu propio nombre se resalta por ID de ORCID / OpenAlex.",
        "Exporta la lista a PDF, DOCX, LaTeX, Markdown o BibTeX; gratis para particulares y de código abierto.",
      ],
      cta: "Genera tu lista de publicaciones",
      faq: [
        {
          q: "¿Puedo elegir el estilo de citas para mi lista de publicaciones?",
          a: "Sí. SigmaCV da formato a tu lista mediante CSL, por lo que puedes elegir cualquier estilo de citas compatible y el formato se mantiene idéntico en PDF, DOCX, LaTeX y Markdown.",
        },
        {
          q: "¿Puedo exportar la lista como BibTeX?",
          a: "Sí. Además de PDF, DOCX, LaTeX y Markdown, SigmaCV puede exportar tus publicaciones seleccionadas como BibTeX y CSL-JSON para reutilizarlas en otros lugares.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "latex-cv": {
      metaTitle: "Genera un CV académico en LaTeX desde ORCID y OpenAlex",
      metaDescription:
        "Genera un CV académico en LaTeX desde tu registro de ORCID y OpenAlex. SigmaCV produce un .tex y un .bib listos para compilar, con citas CSL coherentes. Gratis y de código abierto.",
      navLabel: "CV en LaTeX",
      heading: "Genera un CV académico en LaTeX desde tu registro de investigación",
      subhead:
        "Inicia sesión con ORCID y SigmaCV construye tu CV desde el registro de investigación abierto y exporta LaTeX listo para compilar, no una plantilla en blanco que rellenar a mano.",
      bullets: [
        "Exporta un CV en LaTeX con una bibliografía .bib adjunta, generada desde tus publicaciones de ORCID y OpenAlex.",
        "Las citas se formatean mediante CSL, por lo que PDF, DOCX, LaTeX y Markdown son idénticos.",
        "Gratis para particulares y de código abierto; tú seleccionas el contenido y luego compilas el .tex.",
      ],
      cta: "Crea tu CV en LaTeX",
      faq: [
        {
          q: "¿Qué archivos LaTeX exporta SigmaCV?",
          a: "SigmaCV exporta un CV .tex más una bibliografía .bib ensamblada desde tus publicaciones seleccionadas, para que puedas compilar el documento en tu propio entorno LaTeX.",
        },
        {
          q: "¿Necesito formatear el LaTeX yo mismo?",
          a: "No. SigmaCV rellena el CV en LaTeX desde tu registro de ORCID y OpenAlex y da formato a las citas por ti, a diferencia de una plantilla LaTeX en blanco donde debes escribir cada entrada.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "Plantillas de CV para financiadores: ERC, UKRI, NSF, NIH y SNSF",
      metaDescription:
        "Plantillas de CV para financiadores en un clic: ERC, UKRI R4RI, NSF, NIH y SNSF. SigmaCV las rellena desde tu registro de ORCID y OpenAlex y exporta a PDF, DOCX o LaTeX. Gratis y de código abierto.",
      navLabel: "Plantillas de CV para financiadores",
      heading: "Plantillas de CV para financiadores: ERC, UKRI, NSF, NIH y SNSF",
      subhead:
        "Inicia sesión con ORCID y SigmaCV aplica con un clic una plantilla de financiador a tu registro científico abierto — ERC, UKRI R4RI, NSF, NIH, SNSF y más — lista para seleccionar y exportar.",
      bullets: [
        "58 plantillas en un clic para financiadores, instituciones e industria, incluyendo UKRI R4RI, Royal Society, SNSF, NIH, NSF y ERC, aplicadas de forma reversible.",
        "Cada plantilla se rellena desde tu registro de ORCID y OpenAlex, con citas CSL coherentes a lo largo del documento.",
        "Exporta a PDF, DOCX o LaTeX; gratis para particulares y de código abierto, para que controles exactamente lo que aparece.",
      ],
      cta: "Elige una plantilla de CV para financiadores",
      faq: [
        {
          q: "¿Qué formatos de CV para financiadores admite SigmaCV?",
          a: "SigmaCV ofrece 58 plantillas en un clic que abarcan formatos de financiadores, instituciones e industria, incluidos UKRI R4RI, Royal Society, SNSF, NIH, NSF y ERC, cada una rellena desde tu registro científico abierto.",
        },
        {
          q: "¿Puedo cambiar de plantilla sin perder mis ediciones?",
          a: "Sí. Las plantillas se aplican de forma reversible al mismo CV canónico, por lo que puedes cambiar entre formatos de financiadores y tu selección queda preservada.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
  },
  "fr-FR": {
    "orcid-to-cv": {
      metaTitle: "Transformez votre iD ORCID en CV académique",
      metaDescription:
        "Transformez votre iD ORCID en un CV académique soigné en quelques minutes. SigmaCV récupère vos publications depuis ORCID et OpenAlex, met en forme les citations et exporte en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
      navLabel: "ORCID vers CV",
      heading: "Transformez votre iD ORCID en CV académique",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV génère un CV académique soigné, aux citations mises en forme, à partir de votre dossier scientifique ouvert — prêt à sélectionner et à exporter.",
      bullets: [
        "Publications récupérées automatiquement depuis ORCID et OpenAlex — appariées par identifiant, jamais par nom.",
        "Citations cohérentes dans n'importe quel style CSL, exportées en PDF, DOCX, LaTeX ou Markdown.",
        "Gratuit pour les particuliers et open source ; vous choisissez exactement ce qui apparaît.",
      ],
      cta: "Créez votre CV depuis ORCID",
      faq: [
        {
          q: "Comment transformer mon iD ORCID en CV ?",
          a: "Connectez-vous avec votre iD ORCID. SigmaCV lit votre dossier public et votre profil OpenAlex, rassemble vos publications et votre profil en un CV, puis vous laisse le sélectionner et l'exporter.",
        },
        {
          q: "Est-ce gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0. Il ne lit que les métadonnées publiques de recherche.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "Générez un biosketch NIH depuis ORCID et OpenAlex",
      metaDescription:
        "Générez un biosketch NIH à partir de votre dossier ORCID et OpenAlex. SigmaCV rassemble vos contributions et publications, met en forme les citations et exporte — gratuit et open source.",
      navLabel: "Biosketch NIH",
      heading: "Générez un biosketch NIH depuis ORCID et OpenAlex",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV rédige un biosketch de style NIH à partir de votre dossier scientifique ouvert — vos contributions et publications, prêtes à être affinées et exportées.",
      bullets: [
        "Vos publications et votre profil récupérés depuis ORCID et OpenAlex — appariés par identifiant, jamais par nom.",
        "Choisissez les publications qui comptent, avec une mise en forme des citations cohérente d'un bout à l'autre.",
        "Exportez en PDF, DOCX ou LaTeX ; gratuit pour les particuliers et open source.",
      ],
      cta: "Générez votre biosketch",
      faq: [
        {
          q: "Comment générer un biosketch NIH ?",
          a: "Connectez-vous avec votre iD ORCID. SigmaCV récupère vos publications et votre profil depuis ORCID et OpenAlex, puis vous sélectionnez les contributions et les publications retenues et exportez le biosketch.",
        },
        {
          q: "Puis-je choisir les publications affichées ?",
          a: "Oui. Vous choisissez exactement quelles publications figurent et dans quel ordre, afin que le biosketch reflète les travaux les plus pertinents pour votre candidature.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "academic-cv-template": {
      metaTitle: "Modèle de CV académique gratuit, prérempli depuis votre dossier",
      metaDescription:
        "Un modèle de CV académique gratuit qui se remplit automatiquement. SigmaCV construit votre CV depuis ORCID et OpenAlex, met en forme les citations et exporte en PDF, DOCX, LaTeX ou Markdown.",
      navLabel: "Modèle de CV académique",
      heading: "Un modèle de CV académique gratuit, prérempli depuis votre dossier de recherche",
      subhead:
        "Au lieu d'un modèle de CV académique vierge, connectez-vous avec ORCID et SigmaCV assemble un CV soigné, aux citations mises en forme, à partir de votre dossier scientifique ouvert — prêt à sélectionner et à exporter.",
      bullets: [
        "Partez de votre vrai dossier, pas d'un modèle vide : publications récupérées depuis ORCID et OpenAlex par identifiant, jamais par nom.",
        "Choisissez une mise en page et un style de citations CSL ; le même CV canonique s'exporte en PDF, DOCX, LaTeX ou Markdown.",
        "Gratuit pour les particuliers et open source : vous choisissez exactement quelles sections et publications apparaissent.",
      ],
      cta: "Créez votre CV académique",
      faq: [
        {
          q: "En quoi est-ce différent d'un modèle de CV académique vierge ?",
          a: "Un modèle vierge vous oblige à saisir chaque entrée à la main. SigmaCV lit votre dossier ORCID et OpenAlex, remplit le CV pour vous, formate les citations de manière cohérente et vous laisse le sélectionner et l'exporter.",
        },
        {
          q: "Le modèle de CV académique est-il gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0. Il ne lit que les métadonnées publiques de recherche.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "Créez un CV académique depuis votre profil OpenAlex",
      metaDescription:
        "Transformez votre profil OpenAlex en CV académique. SigmaCV récupère vos publications par identifiant, met en forme les citations et exporte en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
      navLabel: "CV OpenAlex",
      heading: "Créez un CV académique depuis votre profil OpenAlex",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV lit votre dossier OpenAlex pour assembler un CV académique soigné, aux citations mises en forme — apparié par identifiant d'auteur, prêt à sélectionner et à exporter.",
      bullets: [
        "Vos travaux OpenAlex importés automatiquement et appariés par identifiant d'auteur OpenAlex / ORCID — jamais par chaîne de nom.",
        "Les métriques et champs de financement d'OpenAlex sont disponibles, optionnels et normalisés par domaine — aucune par défaut, aligné DORA.",
        "Citations CSL cohérentes exportées en PDF, DOCX, LaTeX ou Markdown ; gratuit pour les particuliers et open source.",
      ],
      cta: "Créez votre CV depuis OpenAlex",
      faq: [
        {
          q: "Comment SigmaCV utilise-t-il mon profil OpenAlex ?",
          a: "Connectez-vous avec votre iD ORCID. SigmaCV résout votre identifiant d'auteur OpenAlex, récupère vos travaux et votre profil, et les assemble en un CV que vous pouvez sélectionner et exporter.",
        },
        {
          q: "Apparie-t-il mes publications par nom ?",
          a: "Non. SigmaCV apparie les travaux par identifiant d'auteur (ID OpenAlex / ORCID), jamais par chaîne de nom, ce qui évite les faux appariements fréquents avec les noms partagés ou translittérés.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "publication-list": {
      metaTitle: "Générez une liste de publications mise en forme depuis ORCID",
      metaDescription:
        "Générez une liste de publications mise en forme pour votre CV depuis ORCID et OpenAlex. Choisissez n'importe quel style CSL ; exportez en PDF, DOCX, LaTeX, Markdown ou BibTeX. Gratuit et open source.",
      navLabel: "Liste de publications",
      heading: "Générez une liste de publications mise en forme depuis votre dossier de recherche",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV construit une liste cohérente, aux citations mises en forme, de vos publications depuis ORCID et OpenAlex — prête à sélectionner, réordonner et exporter.",
      bullets: [
        "Publications récupérées depuis ORCID et OpenAlex par identifiant, puis mises en forme dans n'importe quel style de citations CSL — identiques dans chaque format de sortie.",
        "Choisissez quels travaux apparaissent et dans quel ordre ; votre propre nom est mis en valeur par identifiant ORCID / OpenAlex.",
        "Exportez la liste en PDF, DOCX, LaTeX, Markdown ou BibTeX ; gratuit pour les particuliers et open source.",
      ],
      cta: "Générez votre liste de publications",
      faq: [
        {
          q: "Puis-je choisir le style de citations pour ma liste de publications ?",
          a: "Oui. SigmaCV met en forme votre liste via CSL, vous pouvez donc choisir n'importe quel style de citations pris en charge et la mise en forme reste identique en PDF, DOCX, LaTeX et Markdown.",
        },
        {
          q: "Puis-je exporter la liste en BibTeX ?",
          a: "Oui. En plus de PDF, DOCX, LaTeX et Markdown, SigmaCV peut exporter vos publications sélectionnées en BibTeX et CSL-JSON pour les réutiliser ailleurs.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "latex-cv": {
      metaTitle: "Générez un CV académique LaTeX depuis ORCID et OpenAlex",
      metaDescription:
        "Générez un CV académique LaTeX depuis votre dossier ORCID et OpenAlex. SigmaCV produit un .tex et un .bib prêts à compiler, avec des citations CSL cohérentes. Gratuit et open source.",
      navLabel: "CV LaTeX",
      heading: "Générez un CV académique LaTeX depuis votre dossier de recherche",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV construit votre CV depuis le dossier de recherche ouvert et exporte un LaTeX prêt à compiler — pas un modèle vierge à remplir à la main.",
      bullets: [
        "Exportez un CV LaTeX avec une bibliographie .bib associée, générée depuis vos publications ORCID et OpenAlex.",
        "Les citations sont mises en forme via CSL, de sorte que PDF, DOCX, LaTeX et Markdown sont identiques.",
        "Gratuit pour les particuliers et open source ; vous sélectionnez le contenu, puis compilez le .tex vous-même.",
      ],
      cta: "Créez votre CV LaTeX",
      faq: [
        {
          q: "Quels fichiers LaTeX SigmaCV exporte-t-il ?",
          a: "SigmaCV exporte un CV .tex accompagné d'une bibliographie .bib assemblée depuis vos publications sélectionnées, pour que vous puissiez compiler le document dans votre propre environnement LaTeX.",
        },
        {
          q: "Dois-je mettre en forme le LaTeX moi-même ?",
          a: "Non. SigmaCV remplit le CV LaTeX depuis votre dossier ORCID et OpenAlex et met en forme les citations pour vous — contrairement à un modèle LaTeX vierge où vous devez saisir chaque entrée.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "Modèles de CV pour financeurs : ERC, UKRI, NSF, NIH et SNSF",
      metaDescription:
        "Mises en page de CV pour financeurs en un clic : ERC, UKRI R4RI, NSF, NIH et SNSF. SigmaCV les remplit depuis votre dossier ORCID et OpenAlex et exporte en PDF, DOCX ou LaTeX. Gratuit et open source.",
      navLabel: "Modèles de CV pour financeurs",
      heading: "Modèles de CV pour financeurs : ERC, UKRI, NSF, NIH et SNSF",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV applique en un clic une mise en page de financeur à votre dossier scientifique ouvert — ERC, UKRI R4RI, NSF, NIH, SNSF et plus — prête à sélectionner et à exporter.",
      bullets: [
        "58 mises en page en un clic pour financeurs, institutions et industrie, dont UKRI R4RI, Royal Society, SNSF, NIH, NSF et ERC — appliquées de manière réversible.",
        "Chaque mise en page se remplit depuis votre dossier ORCID et OpenAlex, avec des citations CSL cohérentes tout au long.",
        "Exportez en PDF, DOCX ou LaTeX ; gratuit pour les particuliers et open source, vous contrôlez exactement ce qui apparaît.",
      ],
      cta: "Choisissez une mise en page de CV pour financeurs",
      faq: [
        {
          q: "Quels formats de CV pour financeurs SigmaCV prend-il en charge ?",
          a: "SigmaCV propose 58 mises en page en un clic couvrant les formats de financeurs, d'institutions et d'industrie — dont UKRI R4RI, Royal Society, SNSF, NIH, NSF et ERC — chacune remplie depuis votre dossier scientifique ouvert.",
        },
        {
          q: "Puis-je changer de mise en page sans perdre mes modifications ?",
          a: "Oui. Les mises en page sont appliquées de manière réversible au même CV canonique, vous pouvez donc passer d'un format de financeur à l'autre et votre sélection est préservée.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
  },
  "de-DE": {
    "orcid-to-cv": {
      metaTitle: "Aus Ihrer ORCID iD einen akademischen Lebenslauf erstellen",
      metaDescription:
        "Verwandeln Sie Ihre ORCID iD in wenigen Minuten in einen übersichtlichen akademischen Lebenslauf. SigmaCV holt Ihre Publikationen aus ORCID und OpenAlex, formatiert Zitate und exportiert als PDF, DOCX, LaTeX oder Markdown. Kostenlos und quelloffen.",
      navLabel: "ORCID zu Lebenslauf",
      heading: "Aus Ihrer ORCID iD einen akademischen Lebenslauf erstellen",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV erstellt aus Ihrem offenen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen akademischen Lebenslauf — bereit zum Auswählen und Exportieren.",
      bullets: [
        "Publikationen werden automatisch aus ORCID und OpenAlex geholt — zugeordnet über Kennungen, niemals über den Namen.",
        "Einheitliche Zitate in jedem CSL-Stil, exportiert als PDF, DOCX, LaTeX oder Markdown.",
        "Kostenlos für Einzelpersonen und quelloffen; Sie bestimmen genau, was erscheint.",
      ],
      cta: "Lebenslauf aus ORCID erstellen",
      faq: [
        {
          q: "Wie erstelle ich aus meiner ORCID iD einen Lebenslauf?",
          a: "Melden Sie sich mit Ihrer ORCID iD an. SigmaCV liest Ihr öffentliches Verzeichnis und Ihr OpenAlex-Profil, fügt Ihre Publikationen und Ihr Profil zu einem Lebenslauf zusammen und lässt Sie ihn auswählen und exportieren.",
        },
        {
          q: "Ist es kostenlos?",
          a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz. Es liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "NIH-Biosketch aus ORCID und OpenAlex erstellen",
      metaDescription:
        "Erstellen Sie aus Ihrem ORCID- und OpenAlex-Verzeichnis einen NIH-Biosketch. SigmaCV fügt Ihre Beiträge und Publikationen zusammen, formatiert Zitate und exportiert — kostenlos und quelloffen.",
      navLabel: "NIH-Biosketch",
      heading: "NIH-Biosketch aus ORCID und OpenAlex erstellen",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV entwirft aus Ihrem offenen Forschungsverzeichnis einen Biosketch im NIH-Stil — Ihre Beiträge und Publikationen, bereit zum Verfeinern und Exportieren.",
      bullets: [
        "Ihre Publikationen und Ihr Profil aus ORCID und OpenAlex — zugeordnet über Kennungen, niemals über den Namen.",
        "Wählen Sie die wichtigen Publikationen aus, durchgehend mit einheitlicher Zitatformatierung.",
        "Export als PDF, DOCX oder LaTeX; kostenlos für Einzelpersonen und quelloffen.",
      ],
      cta: "Biosketch erstellen",
      faq: [
        {
          q: "Wie erstelle ich einen NIH-Biosketch?",
          a: "Melden Sie sich mit Ihrer ORCID iD an. SigmaCV holt Ihre Publikationen und Ihr Profil aus ORCID und OpenAlex; anschließend wählen Sie die Beiträge und gewünschten Publikationen aus und exportieren den Biosketch.",
        },
        {
          q: "Kann ich auswählen, welche Publikationen erscheinen?",
          a: "Ja. Sie bestimmen genau, welche Publikationen in welcher Reihenfolge aufgeführt werden, sodass der Biosketch die für Ihren Antrag relevantesten Arbeiten zeigt.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "academic-cv-template": {
      metaTitle:
        "Kostenlose akademische Lebenslaufvorlage, automatisch ausgefüllt aus Ihrem Verzeichnis",
      metaDescription:
        "Eine kostenlose akademische Lebenslaufvorlage, die sich selbst ausfüllt. SigmaCV erstellt Ihren Lebenslauf aus ORCID und OpenAlex, formatiert Zitate und exportiert als PDF, DOCX, LaTeX oder Markdown.",
      navLabel: "Akademische Lebenslaufvorlage",
      heading:
        "Eine kostenlose akademische Lebenslaufvorlage, automatisch aus Ihrem Forschungsverzeichnis ausgefüllt",
      subhead:
        "Statt einer leeren akademischen Lebenslaufvorlage melden Sie sich mit ORCID an, und SigmaCV erstellt aus Ihrem offenen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen Lebenslauf — bereit zum Auswählen und Exportieren.",
      bullets: [
        "Beginnen Sie mit Ihrem echten Verzeichnis, nicht mit einer leeren Vorlage — Publikationen aus ORCID und OpenAlex, zugeordnet über Kennungen, niemals über den Namen.",
        "Wählen Sie ein Layout und einen CSL-Zitierstil; derselbe kanonische Lebenslauf wird als PDF, DOCX, LaTeX oder Markdown exportiert.",
        "Kostenlos für Einzelpersonen und quelloffen — Sie bestimmen genau, welche Abschnitte und Publikationen erscheinen.",
      ],
      cta: "Akademischen Lebenslauf erstellen",
      faq: [
        {
          q: "Worin unterscheidet sich das von einer leeren akademischen Lebenslaufvorlage?",
          a: "Eine leere Vorlage erfordert, dass Sie jeden Eintrag selbst eintippen. SigmaCV liest Ihr ORCID- und OpenAlex-Verzeichnis, füllt den Lebenslauf für Sie aus, formatiert die Zitate einheitlich und lässt Sie ihn auswählen und exportieren.",
        },
        {
          q: "Ist die akademische Lebenslaufvorlage kostenlos?",
          a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz. Es liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "Akademischen Lebenslauf aus Ihrem OpenAlex-Profil erstellen",
      metaDescription:
        "Verwandeln Sie Ihr OpenAlex-Profil in einen akademischen Lebenslauf. SigmaCV holt Ihre Publikationen über Kennungen, formatiert Zitate und exportiert als PDF, DOCX, LaTeX oder Markdown. Kostenlos und quelloffen.",
      navLabel: "OpenAlex-Lebenslauf",
      heading: "Akademischen Lebenslauf aus Ihrem OpenAlex-Profil erstellen",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV liest Ihr OpenAlex-Verzeichnis, um einen übersichtlichen, mit formatierten Zitaten versehenen akademischen Lebenslauf zusammenzustellen — über Autoren-Kennungen zugeordnet, bereit zum Auswählen und Exportieren.",
      bullets: [
        "Ihre OpenAlex-Werke werden automatisch importiert und über OpenAlex- / ORCID-Autoren-ID zugeordnet — niemals über den Namen.",
        "Metriken und Förderinformationen aus OpenAlex sind optional und feldnormiert verfügbar — standardmäßig deaktiviert, DORA-konform.",
        "Einheitliche CSL-Zitate, exportiert als PDF, DOCX, LaTeX oder Markdown; kostenlos für Einzelpersonen und quelloffen.",
      ],
      cta: "Lebenslauf aus OpenAlex erstellen",
      faq: [
        {
          q: "Wie nutzt SigmaCV mein OpenAlex-Profil?",
          a: "Melden Sie sich mit Ihrer ORCID iD an. SigmaCV ermittelt Ihre OpenAlex-Autoren-Kennung, holt Ihre Werke und Ihr Profil und fügt sie zu einem Lebenslauf zusammen, den Sie auswählen und exportieren können.",
        },
        {
          q: "Werden meine Publikationen über den Namen zugeordnet?",
          a: "Nein. SigmaCV ordnet Werke über Autoren-Kennungen (OpenAlex / ORCID-ID) zu, niemals über den Namen — damit werden Falschzuordnungen vermieden, die bei häufigen oder transliterierten Namen auftreten können.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "publication-list": {
      metaTitle: "Formatierte Publikationsliste aus ORCID erstellen",
      metaDescription:
        "Erstellen Sie eine formatierte Publikationsliste für Ihren Lebenslauf aus ORCID und OpenAlex. Wählen Sie einen CSL-Stil; exportieren Sie als PDF, DOCX, LaTeX, Markdown oder BibTeX. Kostenlos und quelloffen.",
      navLabel: "Publikationsliste",
      heading: "Formatierte Publikationsliste aus Ihrem Forschungsverzeichnis erstellen",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV erstellt aus ORCID und OpenAlex eine einheitliche, mit formatierten Zitaten versehene Liste Ihrer Publikationen — bereit zum Auswählen, Neuanordnen und Exportieren.",
      bullets: [
        "Publikationen werden über Kennungen aus ORCID und OpenAlex geholt und in jedem CSL-Zitierstil formatiert — identisch in jeder Ausgabe.",
        "Wählen Sie, welche Werke erscheinen und in welcher Reihenfolge; Ihr eigener Name wird über ORCID / OpenAlex-ID hervorgehoben.",
        "Exportieren Sie die Liste als PDF, DOCX, LaTeX, Markdown oder BibTeX; kostenlos für Einzelpersonen und quelloffen.",
      ],
      cta: "Publikationsliste erstellen",
      faq: [
        {
          q: "Kann ich den Zitierstil für meine Publikationsliste wählen?",
          a: "Ja. SigmaCV formatiert Ihre Liste über CSL, sodass Sie einen beliebigen unterstützten Zitierstil wählen können und die Formatierung in PDF, DOCX, LaTeX und Markdown identisch bleibt.",
        },
        {
          q: "Kann ich die Liste als BibTeX exportieren?",
          a: "Ja. Neben PDF, DOCX, LaTeX und Markdown kann SigmaCV Ihre ausgewählten Publikationen als BibTeX und CSL-JSON für die Weiterverwendung exportieren.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "latex-cv": {
      metaTitle: "LaTeX-Lebenslauf aus ORCID und OpenAlex erstellen",
      metaDescription:
        "Erstellen Sie einen akademischen LaTeX-Lebenslauf aus Ihrem ORCID- und OpenAlex-Verzeichnis. SigmaCV erzeugt eine kompilierbare .tex- und .bib-Datei mit einheitlichen CSL-Zitaten. Kostenlos und quelloffen.",
      navLabel: "LaTeX-Lebenslauf",
      heading: "Akademischen LaTeX-Lebenslauf aus Ihrem Forschungsverzeichnis erstellen",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV erstellt Ihren Lebenslauf aus dem offenen Forschungsverzeichnis und exportiert kompilierbares LaTeX — keine leere Vorlage, die Sie von Hand ausfüllen.",
      bullets: [
        "Exportieren Sie einen LaTeX-Lebenslauf mit einer zugehörigen .bib-Bibliografie, erstellt aus Ihren ORCID- und OpenAlex-Publikationen.",
        "Zitate werden über CSL formatiert, sodass PDF, DOCX, LaTeX und Markdown identisch aussehen.",
        "Kostenlos für Einzelpersonen und quelloffen; Sie kuratieren den Inhalt und kompilieren die .tex-Datei selbst.",
      ],
      cta: "LaTeX-Lebenslauf erstellen",
      faq: [
        {
          q: "Welche LaTeX-Dateien exportiert SigmaCV?",
          a: "SigmaCV exportiert eine .tex-Lebenslaufdatei sowie eine .bib-Bibliografie, die aus Ihren ausgewählten Publikationen zusammengestellt wird, sodass Sie das Dokument in Ihrer eigenen LaTeX-Umgebung kompilieren können.",
        },
        {
          q: "Muss ich das LaTeX selbst formatieren?",
          a: "Nein. SigmaCV füllt den LaTeX-Lebenslauf aus Ihrem ORCID- und OpenAlex-Verzeichnis aus und formatiert die Zitate für Sie — anders als bei einer leeren LaTeX-Vorlage, bei der Sie jeden Eintrag selbst eintippen.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "Förder-Lebenslaufvorlagen: ERC, UKRI, NSF, NIH und SNSF",
      metaDescription:
        "Ein-Klick-Förder-Lebenslauflayouts für ERC, UKRI R4RI, NSF, NIH und SNSF. SigmaCV füllt sie aus Ihrem ORCID- und OpenAlex-Verzeichnis aus und exportiert als PDF, DOCX oder LaTeX. Kostenlos und quelloffen.",
      navLabel: "Förder-Lebenslaufvorlagen",
      heading: "Förder-Lebenslaufvorlagen für ERC, UKRI, NSF, NIH und SNSF",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV wendet ein Ein-Klick-Förderlayout auf Ihr offenes Forschungsverzeichnis an — ERC, UKRI R4RI, NSF, NIH, SNSF und weitere — bereit zum Auswählen und Exportieren.",
      bullets: [
        "58 Ein-Klick-Layouts für Förderer, Institutionen und die Industrie, darunter UKRI R4RI, Royal Society, SNSF, NIH, NSF und ERC — reversibel angewendet.",
        "Jedes Layout wird aus Ihrem ORCID- und OpenAlex-Verzeichnis befüllt, durchgehend mit einheitlichen CSL-Zitaten.",
        "Export als PDF, DOCX oder LaTeX; kostenlos für Einzelpersonen und quelloffen — Sie bestimmen genau, was erscheint.",
      ],
      cta: "Förder-Lebenslauflayout wählen",
      faq: [
        {
          q: "Welche Förder-Lebenslaufformate unterstützt SigmaCV?",
          a: "SigmaCV bietet 58 Ein-Klick-Layouts für Förderer, Institutionen und die Industrie — darunter UKRI R4RI, Royal Society, SNSF, NIH, NSF und ERC — jedes aus Ihrem offenen Forschungsverzeichnis befüllt.",
        },
        {
          q: "Kann ich Layouts wechseln, ohne meine Bearbeitungen zu verlieren?",
          a: "Ja. Layouts werden reversibel auf denselben kanonischen Lebenslauf angewendet, sodass Sie zwischen Fördererformaten wechseln können und Ihre Auswahl erhalten bleibt.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
  },
  "ja-JP": {
    "orcid-to-cv": {
      metaTitle: "ORCID iD から学術 CV を作成",
      metaDescription:
        "ORCID iD から数分で洗練された学術 CV を作成できます。SigmaCV は ORCID と OpenAlex からあなたの論文を取得し、引用を整形して、PDF・DOCX・LaTeX・Markdown に書き出します。無料・オープンソース。",
      navLabel: "ORCID から CV へ",
      heading: "ORCID iD から学術 CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録から、引用が整形された洗練された学術 CV を作成します。整理してそのまま書き出せます。",
      bullets: [
        "論文は ORCID と OpenAlex から自動取得——名前ではなく識別子で照合します。",
        "任意の CSL スタイルで一貫した引用を、PDF・DOCX・LaTeX・Markdown に書き出し。",
        "個人には無料でオープンソース。表示する内容はあなたが正確に選べます。",
      ],
      cta: "ORCID から CV を作成",
      faq: [
        {
          q: "ORCID iD から CV を作るには？",
          a: "ORCID iD でサインインしてください。SigmaCV があなたの公開記録と OpenAlex プロフィールを読み取り、論文とプロフィールを CV にまとめます。あとは整理して書き出すだけです。",
        },
        {
          q: "無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "nih-biosketch": {
      metaTitle: "ORCID と OpenAlex から NIH biosketch を作成",
      metaDescription:
        "あなたの ORCID と OpenAlex の記録から NIH biosketch を作成します。SigmaCV が貢献と論文をまとめ、引用を整形して書き出します——無料・オープンソース。",
      navLabel: "NIH biosketch",
      heading: "ORCID と OpenAlex から NIH biosketch を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録から NIH 形式の biosketch を下書きします。貢献と論文をまとめ、調整してそのまま書き出せます。",
      bullets: [
        "論文とプロフィールを ORCID と OpenAlex から取得——名前ではなく識別子で照合します。",
        "重要な論文を選び、全体を通して一貫した引用形式で。",
        "PDF・DOCX・LaTeX に書き出し。個人には無料でオープンソース。",
      ],
      cta: "biosketch を作成",
      faq: [
        {
          q: "NIH biosketch を作るには？",
          a: "ORCID iD でサインインしてください。SigmaCV が ORCID と OpenAlex から論文とプロフィールを取得します。あとは貢献と選んだ論文を整理し、biosketch を書き出すだけです。",
        },
        {
          q: "表示する論文は選べますか？",
          a: "はい。掲載する論文とその順序を正確に選べるため、biosketch を申請に最も関連する業績で構成できます。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "academic-cv-template": {
      metaTitle: "無料の学術 CV テンプレート、記録から自動入力",
      metaDescription:
        "自動で埋まる無料の学術 CV テンプレートです。SigmaCV は ORCID と OpenAlex から CV を構築し、引用を整形して PDF・DOCX・LaTeX・Markdown に書き出します。",
      navLabel: "学術 CV テンプレート",
      heading: "無料の学術 CV テンプレート、あなたの研究記録から自動入力",
      subhead:
        "空白の学術 CV テンプレートではなく、ORCID でサインインするだけで、SigmaCV が公開された研究記録から引用が整形された洗練された学術 CV を作成します。整理してそのまま書き出せます。",
      bullets: [
        "空のテンプレートではなく実際の記録から開始——論文は ORCID と OpenAlex から識別子で取得し、名前では照合しません。",
        "レイアウトと CSL 引用スタイルを選ぶと、同一の正規 CV が PDF・DOCX・LaTeX・Markdown に書き出されます。",
        "個人には無料でオープンソース——表示するセクションと論文を正確に選べます。",
      ],
      cta: "学術 CV を作成",
      faq: [
        {
          q: "空白の学術 CV テンプレートと何が違いますか？",
          a: "空白のテンプレートはすべての項目を手入力する必要があります。SigmaCV はあなたの ORCID と OpenAlex の記録を読み取り、CV を自動で埋めて引用を一貫して整形し、整理・書き出しができます。",
        },
        {
          q: "学術 CV テンプレートは無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "openalex-cv": {
      metaTitle: "OpenAlex プロフィールから学術 CV を作成",
      metaDescription:
        "OpenAlex プロフィールを学術 CV に変換します。SigmaCV が識別子で論文を取得し、引用を整形して PDF・DOCX・LaTeX・Markdown に書き出します。無料・オープンソース。",
      navLabel: "OpenAlex CV",
      heading: "OpenAlex プロフィールから学術 CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの OpenAlex 記録を読み取り、著者識別子で照合した引用整形済みの学術 CV を作成します。整理してそのまま書き出せます。",
      bullets: [
        "OpenAlex の成果を自動インポートし、OpenAlex / ORCID 著者 ID で照合——名前文字列では照合しません。",
        "OpenAlex のメトリクスと助成フィールドはオプトインで利用可能、フィールド正規化済み——デフォルトは非表示で DORA 準拠。",
        "一貫した CSL 引用を PDF・DOCX・LaTeX・Markdown に書き出し。個人には無料でオープンソース。",
      ],
      cta: "OpenAlex から CV を作成",
      faq: [
        {
          q: "SigmaCV は私の OpenAlex プロフィールをどう使いますか？",
          a: "ORCID iD でサインインしてください。SigmaCV があなたの OpenAlex 著者識別子を解決し、成果とプロフィールを取得して、整理・書き出しができる CV にまとめます。",
        },
        {
          q: "論文は名前で照合されますか？",
          a: "いいえ。SigmaCV は著者識別子（OpenAlex / ORCID ID）で成果を照合し、名前文字列は使いません。これにより、同姓名や音訳名でよく起こる誤った照合を防ぎます。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "publication-list": {
      metaTitle: "ORCID から整形された論文リストを生成",
      metaDescription:
        "ORCID と OpenAlex から CV 用の整形された論文リストを生成します。任意の CSL スタイルを選び、PDF・DOCX・LaTeX・Markdown・BibTeX に書き出せます。無料・オープンソース。",
      navLabel: "論文リスト",
      heading: "研究記録から整形された論文リストを生成",
      subhead:
        "ORCID でサインインすると、SigmaCV が ORCID と OpenAlex から一貫した引用整形済みの論文リストを作成します。整理・並び替えてそのまま書き出せます。",
      bullets: [
        "論文は識別子で ORCID と OpenAlex から取得し、任意の CSL 引用スタイルで整形——すべての出力で同一です。",
        "表示する成果と順序を選択できます。あなた自身の名前は ORCID / OpenAlex ID でハイライトされます。",
        "リストを PDF・DOCX・LaTeX・Markdown・BibTeX に書き出し。個人には無料でオープンソース。",
      ],
      cta: "論文リストを生成",
      faq: [
        {
          q: "論文リストの引用スタイルは選べますか？",
          a: "はい。SigmaCV は CSL でリストを整形するため、サポートされている任意の引用スタイルを選べます。PDF・DOCX・LaTeX・Markdown で整形は完全に一致します。",
        },
        {
          q: "BibTeX で書き出せますか？",
          a: "はい。PDF・DOCX・LaTeX・Markdown に加えて、SigmaCV は整理した論文を BibTeX や CSL-JSON として書き出すことができ、他の用途に再利用できます。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "latex-cv": {
      metaTitle: "ORCID と OpenAlex から LaTeX 学術 CV を生成",
      metaDescription:
        "ORCID と OpenAlex の記録から LaTeX 学術 CV を生成します。SigmaCV は一貫した CSL 引用付きのコンパイル可能な .tex と .bib を生成します。無料・オープンソース。",
      navLabel: "LaTeX CV",
      heading: "研究記録から LaTeX 学術 CV を生成",
      subhead:
        "ORCID でサインインすると、SigmaCV が公開された研究記録から CV を構築し、コンパイル済みの LaTeX を書き出します——手入力が必要な空白テンプレートとは異なります。",
      bullets: [
        "ORCID と OpenAlex の論文から生成した .bib 参考文献付きの LaTeX CV を書き出し。",
        "引用は CSL で整形されるため、PDF・DOCX・LaTeX・Markdown はすべて同一の内容になります。",
        "個人には無料でオープンソース。内容を整理したら .tex を自分でコンパイルできます。",
      ],
      cta: "LaTeX CV を作成",
      faq: [
        {
          q: "SigmaCV はどの LaTeX ファイルを書き出しますか？",
          a: "SigmaCV は .tex の CV ファイルと、整理した論文から組み立てた .bib 参考文献を書き出します。お使いの LaTeX 環境でドキュメントをコンパイルできます。",
        },
        {
          q: "LaTeX を自分で整形する必要がありますか？",
          a: "いいえ。SigmaCV があなたの ORCID と OpenAlex の記録から LaTeX CV を埋めて引用を整形します——すべてを手入力する空白 LaTeX テンプレートとは異なります。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "funder-cv-templates": {
      metaTitle: "助成機関 CV テンプレート：ERC・UKRI・NSF・NIH・SNSF",
      metaDescription:
        "ERC・UKRI R4RI・NSF・NIH・SNSF 向けのワンクリック助成機関 CV レイアウト。SigmaCV が ORCID と OpenAlex の記録から入力し、PDF・DOCX・LaTeX に書き出します。無料・オープンソース。",
      navLabel: "助成機関 CV テンプレート",
      heading: "ERC・UKRI・NSF・NIH・SNSF の助成機関 CV テンプレート",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録にワンクリックで助成機関レイアウトを適用します——ERC・UKRI R4RI・NSF・NIH・SNSF など。整理してそのまま書き出せます。",
      bullets: [
        "UKRI R4RI・Royal Society・SNSF・NIH・NSF・ERC を含む 58 種のワンクリック助成機関・機関・業界レイアウトを可逆的に適用。",
        "各レイアウトは ORCID と OpenAlex の記録から入力し、全体を通して一貫した CSL 引用を提供。",
        "PDF・DOCX・LaTeX に書き出し。個人には無料でオープンソース——表示内容を完全に管理できます。",
      ],
      cta: "助成機関 CV レイアウトを選択",
      faq: [
        {
          q: "SigmaCV はどの助成機関 CV フォーマットに対応していますか？",
          a: "SigmaCV は UKRI R4RI・Royal Society・SNSF・NIH・NSF・ERC を含む、助成機関・機関・業界フォーマットにわたる 58 種のワンクリックレイアウトを提供します。それぞれ公開された研究記録から入力します。",
        },
        {
          q: "レイアウトを切り替えても編集内容は保持されますか？",
          a: "はい。レイアウトは同一の正規 CV に可逆的に適用されるため、助成機関フォーマット間を自由に切り替えても整理内容は保持されます。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
  },
  "pt-BR": {
    "orcid-to-cv": {
      metaTitle: "Transforme seu iD ORCID em um currículo acadêmico",
      metaDescription:
        "Transforme seu iD ORCID em um currículo acadêmico limpo em minutos. O SigmaCV extrai suas publicações do ORCID e do OpenAlex, formata as citações e exporta para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
      navLabel: "ORCID para currículo",
      heading: "Transforme seu iD ORCID em um currículo acadêmico",
      subhead:
        "Entre com o ORCID e o SigmaCV cria um currículo acadêmico limpo, com citações formatadas, a partir do seu registro de pesquisa aberto — pronto para curar e exportar.",
      bullets: [
        "Publicações extraídas automaticamente do ORCID e do OpenAlex — correspondidas por identificador, nunca por nome.",
        "Citações consistentes em qualquer estilo CSL, exportadas para PDF, DOCX, LaTeX ou Markdown.",
        "Gratuito para indivíduos e de código aberto; você decide exatamente o que aparece.",
      ],
      cta: "Crie seu currículo a partir do ORCID",
      faq: [
        {
          q: "Como transformo meu iD ORCID em um currículo?",
          a: "Entre com seu iD ORCID. O SigmaCV lê o seu registro público e o seu perfil do OpenAlex, reúne suas publicações e perfil em um currículo e permite curá-lo e exportá-lo.",
        },
        {
          q: "É gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0. Ele lê apenas metadados públicos de pesquisa.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "Gere um biosketch NIH a partir do ORCID e do OpenAlex",
      metaDescription:
        "Gere um biosketch NIH a partir do seu registro do ORCID e do OpenAlex. O SigmaCV reúne suas contribuições e publicações, formata as citações e exporta — gratuito e de código aberto.",
      navLabel: "Biosketch NIH",
      heading: "Gere um biosketch NIH a partir do ORCID e do OpenAlex",
      subhead:
        "Entre com o ORCID e o SigmaCV redige um biosketch no estilo NIH a partir do seu registro de pesquisa aberto — suas contribuições e publicações, prontas para refinar e exportar.",
      bullets: [
        "Suas publicações e seu perfil extraídos do ORCID e do OpenAlex — correspondidos por identificador, nunca por nome.",
        "Escolha as publicações que importam, com formatação de citações consistente em todo o documento.",
        "Exporte para PDF, DOCX ou LaTeX; gratuito para indivíduos e de código aberto.",
      ],
      cta: "Gere seu biosketch",
      faq: [
        {
          q: "Como gero um biosketch NIH?",
          a: "Entre com seu iD ORCID. O SigmaCV extrai suas publicações e seu perfil do ORCID e do OpenAlex; depois você cura as contribuições e as publicações selecionadas e exporta o biosketch.",
        },
        {
          q: "Posso escolher quais publicações aparecem?",
          a: "Sim. Você decide exatamente quais publicações são listadas e em que ordem, para que o biosketch reflita o trabalho mais relevante para a sua candidatura.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "academic-cv-template": {
      metaTitle:
        "Modelo de currículo acadêmico gratuito, preenchido automaticamente do seu registro",
      metaDescription:
        "Um modelo de currículo acadêmico gratuito que se preenche sozinho. O SigmaCV constrói seu currículo a partir do ORCID e do OpenAlex, formata as citações e exporta para PDF, DOCX, LaTeX ou Markdown.",
      navLabel: "Modelo de currículo acadêmico",
      heading:
        "Um modelo de currículo acadêmico gratuito, preenchido automaticamente do seu registro de pesquisa",
      subhead:
        "Em vez de um modelo de currículo acadêmico em branco, entre com o ORCID e o SigmaCV monta um currículo limpo, com citações formatadas, a partir do seu registro de pesquisa aberto — pronto para curar e exportar.",
      bullets: [
        "Comece pelo seu registro real, não por um modelo vazio: publicações extraídas do ORCID e do OpenAlex por identificador, nunca por nome.",
        "Escolha um layout e um estilo de citações CSL; o mesmo currículo canônico é exportado para PDF, DOCX, LaTeX ou Markdown.",
        "Gratuito para indivíduos e de código aberto: você decide exatamente quais seções e publicações aparecem.",
      ],
      cta: "Crie seu currículo acadêmico",
      faq: [
        {
          q: "Em que isso difere de um modelo de currículo acadêmico em branco?",
          a: "Um modelo em branco ainda exige que você digite cada entrada. O SigmaCV lê o seu registro do ORCID e do OpenAlex, preenche o currículo por você, formata as citações de forma consistente e permite curá-lo e exportá-lo.",
        },
        {
          q: "O modelo de currículo acadêmico é gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0. Ele lê apenas metadados públicos de pesquisa.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "Crie um currículo acadêmico a partir do seu perfil no OpenAlex",
      metaDescription:
        "Transforme seu perfil no OpenAlex em um currículo acadêmico. O SigmaCV extrai suas publicações por identificador, formata as citações e exporta para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
      navLabel: "Currículo OpenAlex",
      heading: "Crie um currículo acadêmico a partir do seu perfil no OpenAlex",
      subhead:
        "Entre com o ORCID e o SigmaCV lê o seu registro do OpenAlex para montar um currículo acadêmico limpo, com citações formatadas — correspondido por identificador de autor, pronto para curar e exportar.",
      bullets: [
        "Seus trabalhos do OpenAlex importados automaticamente e correspondidos pelo identificador de autor do OpenAlex / ORCID — nunca pela cadeia de nome.",
        "Métricas e campos de financiamento do OpenAlex estão disponíveis, opcionais e normalizados por campo — nenhuma por padrão, alinhado ao DORA.",
        "Citações CSL consistentes exportadas para PDF, DOCX, LaTeX ou Markdown; gratuito para indivíduos e de código aberto.",
      ],
      cta: "Crie seu currículo a partir do OpenAlex",
      faq: [
        {
          q: "Como o SigmaCV usa meu perfil no OpenAlex?",
          a: "Entre com seu iD ORCID. O SigmaCV resolve seu identificador de autor no OpenAlex, extrai seus trabalhos e perfil e os monta em um currículo que você pode curar e exportar.",
        },
        {
          q: "Ele corresponde minhas publicações pelo nome?",
          a: "Não. O SigmaCV corresponde os trabalhos pelo identificador de autor (ID do OpenAlex / ORCID), nunca pela cadeia de nome, evitando as correspondências falsas comuns com nomes compartilhados ou transliterados.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "publication-list": {
      metaTitle: "Gere uma lista de publicações formatada a partir do ORCID",
      metaDescription:
        "Gere uma lista de publicações formatada para seu currículo a partir do ORCID e do OpenAlex. Escolha qualquer estilo CSL; exporte para PDF, DOCX, LaTeX, Markdown ou BibTeX. Gratuito e de código aberto.",
      navLabel: "Lista de publicações",
      heading: "Gere uma lista de publicações formatada a partir do seu registro de pesquisa",
      subhead:
        "Entre com o ORCID e o SigmaCV constrói uma lista consistente, com citações formatadas, das suas publicações a partir do ORCID e do OpenAlex — pronta para curar, reordenar e exportar.",
      bullets: [
        "Publicações extraídas do ORCID e do OpenAlex por identificador, depois formatadas em qualquer estilo de citações CSL — idênticas em todos os formatos de saída.",
        "Escolha quais trabalhos aparecem e em que ordem; seu próprio nome é destacado pelo ID do ORCID / OpenAlex.",
        "Exporte a lista para PDF, DOCX, LaTeX, Markdown ou BibTeX; gratuito para indivíduos e de código aberto.",
      ],
      cta: "Gere sua lista de publicações",
      faq: [
        {
          q: "Posso escolher o estilo de citações para minha lista de publicações?",
          a: "Sim. O SigmaCV formata sua lista por meio do CSL, então você pode escolher qualquer estilo de citações compatível e a formatação permanece idêntica em PDF, DOCX, LaTeX e Markdown.",
        },
        {
          q: "Posso exportar a lista como BibTeX?",
          a: "Sim. Além de PDF, DOCX, LaTeX e Markdown, o SigmaCV pode exportar suas publicações curadas como BibTeX e CSL-JSON para reutilização em outros lugares.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "latex-cv": {
      metaTitle: "Gere um currículo acadêmico em LaTeX a partir do ORCID e do OpenAlex",
      metaDescription:
        "Gere um currículo acadêmico em LaTeX a partir do seu registro do ORCID e do OpenAlex. O SigmaCV produz um .tex e um .bib prontos para compilar, com citações CSL consistentes. Gratuito e de código aberto.",
      navLabel: "Currículo LaTeX",
      heading: "Gere um currículo acadêmico em LaTeX a partir do seu registro de pesquisa",
      subhead:
        "Entre com o ORCID e o SigmaCV constrói seu currículo a partir do registro de pesquisa aberto e exporta um LaTeX pronto para compilar — não um modelo em branco para preencher à mão.",
      bullets: [
        "Exporte um currículo LaTeX com uma bibliografia .bib anexa, gerada a partir das suas publicações do ORCID e do OpenAlex.",
        "As citações são formatadas via CSL, de modo que PDF, DOCX, LaTeX e Markdown são idênticos.",
        "Gratuito para indivíduos e de código aberto; você cura o conteúdo e depois compila o .tex você mesmo.",
      ],
      cta: "Crie seu currículo LaTeX",
      faq: [
        {
          q: "Quais arquivos LaTeX o SigmaCV exporta?",
          a: "O SigmaCV exporta um currículo .tex mais uma bibliografia .bib montada a partir das suas publicações curadas, para que você possa compilar o documento no seu próprio ambiente LaTeX.",
        },
        {
          q: "Preciso formatar o LaTeX eu mesmo?",
          a: "Não. O SigmaCV preenche o currículo LaTeX a partir do seu registro do ORCID e do OpenAlex e formata as citações por você — ao contrário de um modelo LaTeX em branco, onde você digita cada entrada.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "Modelos de currículo para financiadores: ERC, UKRI, NSF, NIH e SNSF",
      metaDescription:
        "Layouts de currículo para financiadores em um clique: ERC, UKRI R4RI, NSF, NIH e SNSF. O SigmaCV os preenche a partir do seu registro do ORCID e do OpenAlex e exporta para PDF, DOCX ou LaTeX. Gratuito e de código aberto.",
      navLabel: "Modelos de currículo para financiadores",
      heading: "Modelos de currículo para financiadores: ERC, UKRI, NSF, NIH e SNSF",
      subhead:
        "Entre com o ORCID e o SigmaCV aplica em um clique um layout de financiador ao seu registro científico aberto — ERC, UKRI R4RI, NSF, NIH, SNSF e mais — pronto para curar e exportar.",
      bullets: [
        "58 layouts em um clique para financiadores, instituições e indústria, incluindo UKRI R4RI, Royal Society, SNSF, NIH, NSF e ERC — aplicados de forma reversível.",
        "Cada layout é preenchido a partir do seu registro do ORCID e do OpenAlex, com citações CSL consistentes em todo o documento.",
        "Exporte para PDF, DOCX ou LaTeX; gratuito para indivíduos e de código aberto, para que você controle exatamente o que aparece.",
      ],
      cta: "Escolha um layout de currículo para financiadores",
      faq: [
        {
          q: "Quais formatos de currículo para financiadores o SigmaCV suporta?",
          a: "O SigmaCV oferece 58 layouts em um clique abrangendo formatos de financiadores, instituições e indústria — incluindo UKRI R4RI, Royal Society, SNSF, NIH, NSF e ERC — cada um preenchido a partir do seu registro científico aberto.",
        },
        {
          q: "Posso trocar de layout sem perder minhas edições?",
          a: "Sim. Os layouts são aplicados de forma reversível ao mesmo currículo canônico, então você pode alternar entre formatos de financiadores e sua curação é preservada.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
  },
  "it-IT": {
    "orcid-to-cv": {
      metaTitle: "Trasforma il tuo iD ORCID in un CV accademico",
      metaDescription:
        "Trasforma il tuo iD ORCID in un CV accademico curato in pochi minuti. SigmaCV recupera le tue pubblicazioni da ORCID e OpenAlex, formatta le citazioni ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
      navLabel: "Da ORCID a CV",
      heading: "Trasforma il tuo iD ORCID in un CV accademico",
      subhead:
        "Accedi con ORCID e SigmaCV crea un CV accademico curato, con citazioni formattate, a partire dal tuo registro di ricerca aperto — pronto da selezionare ed esportare.",
      bullets: [
        "Pubblicazioni recuperate automaticamente da ORCID e OpenAlex — abbinate tramite identificativo, mai tramite il nome.",
        "Citazioni coerenti in qualsiasi stile CSL, esportate in PDF, DOCX, LaTeX o Markdown.",
        "Gratuito per i singoli individui e open source; decidi tu esattamente cosa appare.",
      ],
      cta: "Crea il tuo CV da ORCID",
      faq: [
        {
          q: "Come trasformo il mio iD ORCID in un CV?",
          a: "Accedi con il tuo iD ORCID. SigmaCV legge il tuo registro pubblico e il tuo profilo OpenAlex, riunisce le tue pubblicazioni e il tuo profilo in un CV e ti permette di selezionarlo ed esportarlo.",
        },
        {
          q: "È gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "Genera un biosketch NIH da ORCID e OpenAlex",
      metaDescription:
        "Genera un biosketch NIH a partire dal tuo registro ORCID e OpenAlex. SigmaCV riunisce i tuoi contributi e le tue pubblicazioni, formatta le citazioni ed esporta — gratuito e open source.",
      navLabel: "Biosketch NIH",
      heading: "Genera un biosketch NIH da ORCID e OpenAlex",
      subhead:
        "Accedi con ORCID e SigmaCV redige un biosketch in stile NIH a partire dal tuo registro di ricerca aperto — i tuoi contributi e le tue pubblicazioni, pronti da rifinire ed esportare.",
      bullets: [
        "Le tue pubblicazioni e il tuo profilo recuperati da ORCID e OpenAlex — abbinati tramite identificativo, mai tramite il nome.",
        "Scegli le pubblicazioni che contano, con una formattazione delle citazioni coerente in tutto il documento.",
        "Esporta in PDF, DOCX o LaTeX; gratuito per i singoli individui e open source.",
      ],
      cta: "Genera il tuo biosketch",
      faq: [
        {
          q: "Come genero un biosketch NIH?",
          a: "Accedi con il tuo iD ORCID. SigmaCV recupera le tue pubblicazioni e il tuo profilo da ORCID e OpenAlex; poi selezioni i contributi e le pubblicazioni scelte ed esporti il biosketch.",
        },
        {
          q: "Posso scegliere quali pubblicazioni appaiono?",
          a: "Sì. Decidi tu esattamente quali pubblicazioni vengono elencate e in quale ordine, così il biosketch riflette il lavoro più rilevante per la tua candidatura.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "academic-cv-template": {
      metaTitle: "Modello di CV accademico gratuito, precompilato dal tuo registro",
      metaDescription:
        "Un modello di CV accademico gratuito che si compila da solo. SigmaCV costruisce il tuo CV da ORCID e OpenAlex, formatta le citazioni ed esporta in PDF, DOCX, LaTeX o Markdown.",
      navLabel: "Modello di CV accademico",
      heading: "Un modello di CV accademico gratuito, precompilato dal tuo registro di ricerca",
      subhead:
        "Invece di un modello di CV accademico vuoto, accedi con ORCID e SigmaCV assembla un CV curato, con citazioni formattate, a partire dal tuo registro di ricerca aperto — pronto da selezionare ed esportare.",
      bullets: [
        "Parti dal tuo registro reale, non da un modello vuoto: pubblicazioni recuperate da ORCID e OpenAlex tramite identificativo, mai tramite il nome.",
        "Scegli una struttura e uno stile di citazioni CSL; lo stesso CV canonico viene esportato in PDF, DOCX, LaTeX o Markdown.",
        "Gratuito per i singoli individui e open source: decidi tu esattamente quali sezioni e pubblicazioni appaiono.",
      ],
      cta: "Crea il tuo CV accademico",
      faq: [
        {
          q: "In cosa si differenzia da un modello di CV accademico vuoto?",
          a: "Un modello vuoto richiede di inserire manualmente ogni voce. SigmaCV legge il tuo registro ORCID e OpenAlex, compila il CV al posto tuo, formatta le citazioni in modo coerente e ti permette di selezionarlo ed esportarlo.",
        },
        {
          q: "Il modello di CV accademico è gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "Crea un CV accademico dal tuo profilo OpenAlex",
      metaDescription:
        "Trasforma il tuo profilo OpenAlex in un CV accademico. SigmaCV recupera le tue pubblicazioni tramite identificativo, formatta le citazioni ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
      navLabel: "CV OpenAlex",
      heading: "Crea un CV accademico dal tuo profilo OpenAlex",
      subhead:
        "Accedi con ORCID e SigmaCV legge il tuo registro OpenAlex per assemblare un CV accademico curato, con citazioni formattate — abbinato tramite identificativo d'autore, pronto da selezionare ed esportare.",
      bullets: [
        "I tuoi lavori OpenAlex importati automaticamente e abbinati tramite identificativo d'autore OpenAlex / ORCID — mai tramite la stringa del nome.",
        "Le metriche e i campi di finanziamento di OpenAlex sono disponibili, opzionali e normalizzati per campo — nessuna per impostazione predefinita, in linea con DORA.",
        "Citazioni CSL coerenti esportate in PDF, DOCX, LaTeX o Markdown; gratuito per i singoli individui e open source.",
      ],
      cta: "Crea il tuo CV da OpenAlex",
      faq: [
        {
          q: "Come utilizza SigmaCV il mio profilo OpenAlex?",
          a: "Accedi con il tuo iD ORCID. SigmaCV risolve il tuo identificativo d'autore OpenAlex, recupera i tuoi lavori e il tuo profilo e li assembla in un CV che puoi selezionare ed esportare.",
        },
        {
          q: "Le mie pubblicazioni vengono abbinate per nome?",
          a: "No. SigmaCV abbina i lavori tramite identificativo d'autore (ID OpenAlex / ORCID), mai tramite stringa del nome, evitando così i falsi abbinamenti frequenti con nomi condivisi o traslitterati.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "publication-list": {
      metaTitle: "Genera un elenco di pubblicazioni formattato da ORCID",
      metaDescription:
        "Genera un elenco di pubblicazioni formattato per il tuo CV da ORCID e OpenAlex. Scegli qualsiasi stile CSL; esporta in PDF, DOCX, LaTeX, Markdown o BibTeX. Gratuito e open source.",
      navLabel: "Elenco di pubblicazioni",
      heading: "Genera un elenco di pubblicazioni formattato dal tuo registro di ricerca",
      subhead:
        "Accedi con ORCID e SigmaCV costruisce un elenco coerente, con citazioni formattate, delle tue pubblicazioni da ORCID e OpenAlex — pronto da selezionare, riordinare ed esportare.",
      bullets: [
        "Pubblicazioni recuperate da ORCID e OpenAlex tramite identificativo, poi formattate in qualsiasi stile di citazioni CSL — identiche in ogni formato di output.",
        "Scegli quali lavori appaiono e in quale ordine; il tuo nome è evidenziato tramite ID ORCID / OpenAlex.",
        "Esporta l'elenco in PDF, DOCX, LaTeX, Markdown o BibTeX; gratuito per i singoli individui e open source.",
      ],
      cta: "Genera il tuo elenco di pubblicazioni",
      faq: [
        {
          q: "Posso scegliere lo stile di citazioni per il mio elenco di pubblicazioni?",
          a: "Sì. SigmaCV formatta il tuo elenco tramite CSL, quindi puoi scegliere qualsiasi stile di citazioni supportato e la formattazione rimane identica in PDF, DOCX, LaTeX e Markdown.",
        },
        {
          q: "Posso esportare l'elenco come BibTeX?",
          a: "Sì. Oltre a PDF, DOCX, LaTeX e Markdown, SigmaCV può esportare le tue pubblicazioni selezionate come BibTeX e CSL-JSON per riutilizzarle altrove.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "latex-cv": {
      metaTitle: "Genera un CV accademico LaTeX da ORCID e OpenAlex",
      metaDescription:
        "Genera un CV accademico LaTeX dal tuo registro ORCID e OpenAlex. SigmaCV produce un .tex e un .bib pronti da compilare, con citazioni CSL coerenti. Gratuito e open source.",
      navLabel: "CV LaTeX",
      heading: "Genera un CV accademico LaTeX dal tuo registro di ricerca",
      subhead:
        "Accedi con ORCID e SigmaCV costruisce il tuo CV dal registro di ricerca aperto ed esporta un LaTeX pronto da compilare — non un modello vuoto da riempire a mano.",
      bullets: [
        "Esporta un CV LaTeX con una bibliografia .bib allegata, generata dalle tue pubblicazioni ORCID e OpenAlex.",
        "Le citazioni sono formattate tramite CSL, quindi PDF, DOCX, LaTeX e Markdown risultano identici.",
        "Gratuito per i singoli individui e open source; selezioni il contenuto, poi compili il .tex tu stesso.",
      ],
      cta: "Crea il tuo CV LaTeX",
      faq: [
        {
          q: "Quali file LaTeX esporta SigmaCV?",
          a: "SigmaCV esporta un CV .tex più una bibliografia .bib assemblata dalle tue pubblicazioni selezionate, così puoi compilare il documento nel tuo ambiente LaTeX.",
        },
        {
          q: "Devo formattare il LaTeX da solo?",
          a: "No. SigmaCV compila il CV LaTeX dal tuo registro ORCID e OpenAlex e formatta le citazioni per te — a differenza di un modello LaTeX vuoto, dove devi inserire ogni voce manualmente.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "Modelli di CV per enti finanziatori: ERC, UKRI, NSF, NIH e SNSF",
      metaDescription:
        "Strutture di CV per enti finanziatori in un clic: ERC, UKRI R4RI, NSF, NIH e SNSF. SigmaCV le compila dal tuo registro ORCID e OpenAlex ed esporta in PDF, DOCX o LaTeX. Gratuito e open source.",
      navLabel: "Modelli di CV per enti finanziatori",
      heading: "Modelli di CV per enti finanziatori: ERC, UKRI, NSF, NIH e SNSF",
      subhead:
        "Accedi con ORCID e SigmaCV applica in un clic una struttura di ente finanziatore al tuo registro scientifico aperto — ERC, UKRI R4RI, NSF, NIH, SNSF e altri — pronta da selezionare ed esportare.",
      bullets: [
        "58 strutture in un clic per enti finanziatori, istituzioni e industria, tra cui UKRI R4RI, Royal Society, SNSF, NIH, NSF e ERC — applicate in modo reversibile.",
        "Ogni struttura viene compilata dal tuo registro ORCID e OpenAlex, con citazioni CSL coerenti in tutto il documento.",
        "Esporta in PDF, DOCX o LaTeX; gratuito per i singoli individui e open source, così controlli esattamente cosa appare.",
      ],
      cta: "Scegli una struttura di CV per enti finanziatori",
      faq: [
        {
          q: "Quali formati di CV per enti finanziatori supporta SigmaCV?",
          a: "SigmaCV offre 58 strutture in un clic che coprono formati per enti finanziatori, istituzioni e industria — tra cui UKRI R4RI, Royal Society, SNSF, NIH, NSF e ERC — ognuna compilata dal tuo registro scientifico aperto.",
        },
        {
          q: "Posso cambiare struttura senza perdere le mie modifiche?",
          a: "Sì. Le strutture vengono applicate in modo reversibile allo stesso CV canonico, quindi puoi passare da un formato di ente finanziatore all'altro e la tua selezione viene preservata.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
  },
  "ko-KR": {
    "orcid-to-cv": {
      metaTitle: "ORCID iD를 학술 이력서로 변환",
      metaDescription:
        "ORCID iD를 몇 분 만에 깔끔한 학술 이력서로 변환하세요. SigmaCV는 ORCID와 OpenAlex에서 논문을 가져와 인용을 서식화하고 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "ORCID를 이력서로",
      heading: "ORCID iD를 학술 이력서로 변환",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 인용이 서식화된 깔끔한 학술 이력서를 만들어 드립니다. 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "논문은 ORCID와 OpenAlex에서 자동으로 가져옵니다 — 이름이 아니라 식별자로 매칭합니다.",
        "어떤 CSL 스타일로도 일관된 인용을 제공하며 PDF, DOCX, LaTeX, Markdown으로 내보냅니다.",
        "개인에게 무료이며 오픈 소스입니다. 무엇을 표시할지 정확히 선택할 수 있습니다.",
      ],
      cta: "ORCID로 이력서 만들기",
      faq: [
        {
          q: "ORCID iD를 이력서로 어떻게 변환하나요?",
          a: "ORCID iD로 로그인하세요. SigmaCV가 공개 기록과 OpenAlex 프로필을 읽어 논문과 프로필을 이력서로 모아 주며, 정리하고 내보낼 수 있습니다.",
        },
        {
          q: "무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 공개된 연구 메타데이터만 읽습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "nih-biosketch": {
      metaTitle: "ORCID와 OpenAlex로 NIH biosketch 생성",
      metaDescription:
        "ORCID와 OpenAlex 기록으로 NIH biosketch를 생성하세요. SigmaCV가 기여와 논문을 모으고 인용을 서식화하여 내보냅니다 — 무료이며 오픈 소스입니다.",
      navLabel: "NIH biosketch",
      heading: "ORCID와 OpenAlex로 NIH biosketch 생성",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 NIH 양식의 biosketch 초안을 작성합니다. 기여와 논문을 모아 다듬고 내보낼 수 있습니다.",
      bullets: [
        "논문과 프로필을 ORCID와 OpenAlex에서 가져옵니다 — 이름이 아니라 식별자로 매칭합니다.",
        "중요한 논문을 선택하고 문서 전반에 일관된 인용 서식을 적용합니다.",
        "PDF, DOCX, LaTeX로 내보내며, 개인에게 무료이고 오픈 소스입니다.",
      ],
      cta: "biosketch 생성하기",
      faq: [
        {
          q: "NIH biosketch는 어떻게 생성하나요?",
          a: "ORCID iD로 로그인하세요. SigmaCV가 ORCID와 OpenAlex에서 논문과 프로필을 가져오면, 기여와 선택한 논문을 정리하고 biosketch를 내보낼 수 있습니다.",
        },
        {
          q: "표시할 논문을 선택할 수 있나요?",
          a: "네. 어떤 논문을 어떤 순서로 나열할지 정확히 선택할 수 있어, biosketch가 지원에 가장 관련 있는 업적을 반영하도록 할 수 있습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "academic-cv-template": {
      metaTitle: "무료 학술 이력서 템플릿, 기록에서 자동 입력",
      metaDescription:
        "자동으로 채워지는 무료 학술 이력서 템플릿입니다. SigmaCV는 ORCID와 OpenAlex를 바탕으로 이력서를 구성하고, 인용을 서식화하여 PDF, DOCX, LaTeX, Markdown으로 내보냅니다.",
      navLabel: "학술 이력서 템플릿",
      heading: "무료 학술 이력서 템플릿, 연구 기록에서 자동 입력",
      subhead:
        "빈 학술 이력서 템플릿 대신, ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 인용이 서식화된 깔끔한 학술 이력서를 만들어 드립니다. 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "빈 템플릿이 아닌 실제 기록에서 시작합니다 — 논문은 이름이 아닌 식별자로 ORCID와 OpenAlex에서 가져옵니다.",
        "레이아웃과 CSL 인용 스타일을 선택하면 동일한 정규 이력서가 PDF, DOCX, LaTeX, Markdown으로 내보내집니다.",
        "개인에게 무료이며 오픈 소스입니다 — 표시할 섹션과 논문을 정확히 선택할 수 있습니다.",
      ],
      cta: "학술 이력서 만들기",
      faq: [
        {
          q: "빈 학술 이력서 템플릿과 무엇이 다른가요?",
          a: "빈 템플릿은 모든 항목을 직접 입력해야 합니다. SigmaCV는 ORCID와 OpenAlex 기록을 읽어 이력서를 자동으로 채우고, 인용을 일관되게 서식화하며, 정리하고 내보낼 수 있습니다.",
        },
        {
          q: "학술 이력서 템플릿은 무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 공개된 연구 메타데이터만 읽습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "openalex-cv": {
      metaTitle: "OpenAlex 프로필로 학술 이력서 만들기",
      metaDescription:
        "OpenAlex 프로필을 학술 이력서로 변환하세요. SigmaCV가 식별자로 논문을 가져와 인용을 서식화하고 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "OpenAlex 이력서",
      heading: "OpenAlex 프로필로 학술 이력서 만들기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 OpenAlex 기록을 읽어 저자 식별자로 매칭한 인용 서식화된 학술 이력서를 만들어 드립니다. 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "OpenAlex 성과물을 자동으로 가져오고 OpenAlex / ORCID 저자 ID로 매칭합니다 — 이름 문자열로는 매칭하지 않습니다.",
        "OpenAlex의 지표 및 연구비 필드는 옵트인으로 이용 가능하며 필드 정규화되어 있습니다 — 기본값은 미표시이며 DORA 준수입니다.",
        "일관된 CSL 인용을 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 개인에게 무료이며 오픈 소스입니다.",
      ],
      cta: "OpenAlex로 이력서 만들기",
      faq: [
        {
          q: "SigmaCV가 내 OpenAlex 프로필을 어떻게 활용하나요?",
          a: "ORCID iD로 로그인하세요. SigmaCV가 OpenAlex 저자 식별자를 확인하고 성과물과 프로필을 가져와 정리하고 내보낼 수 있는 이력서로 구성합니다.",
        },
        {
          q: "논문을 이름으로 매칭하나요?",
          a: "아니요. SigmaCV는 저자 식별자(OpenAlex / ORCID ID)로 성과물을 매칭하며 이름 문자열은 사용하지 않습니다. 이를 통해 동명이인이나 음역된 이름에서 흔히 발생하는 오매칭을 방지합니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "publication-list": {
      metaTitle: "ORCID에서 서식화된 논문 목록 생성",
      metaDescription:
        "ORCID와 OpenAlex로 이력서용 서식화된 논문 목록을 생성하세요. CSL 스타일을 선택하고 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보낼 수 있습니다. 무료이며 오픈 소스입니다.",
      navLabel: "논문 목록",
      heading: "연구 기록에서 서식화된 논문 목록 생성",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 ORCID와 OpenAlex를 바탕으로 일관된 인용 서식화된 논문 목록을 만들어 드립니다. 바로 정리하고 순서를 바꿔 내보낼 수 있습니다.",
      bullets: [
        "논문은 식별자로 ORCID와 OpenAlex에서 가져와 임의의 CSL 인용 스타일로 서식화됩니다 — 모든 출력에서 동일합니다.",
        "표시할 성과물과 순서를 선택할 수 있으며, 본인의 이름은 ORCID / OpenAlex ID로 강조 표시됩니다.",
        "목록을 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보냅니다. 개인에게 무료이며 오픈 소스입니다.",
      ],
      cta: "논문 목록 생성하기",
      faq: [
        {
          q: "논문 목록의 인용 스타일을 선택할 수 있나요?",
          a: "네. SigmaCV는 CSL을 통해 목록을 서식화하므로 지원되는 인용 스타일을 선택할 수 있으며, PDF, DOCX, LaTeX, Markdown 전반에서 서식이 동일하게 유지됩니다.",
        },
        {
          q: "목록을 BibTeX로 내보낼 수 있나요?",
          a: "네. PDF, DOCX, LaTeX, Markdown 외에도 SigmaCV는 정리한 논문을 BibTeX 및 CSL-JSON으로 내보내 다른 곳에서 재사용할 수 있습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "latex-cv": {
      metaTitle: "ORCID와 OpenAlex로 LaTeX 학술 이력서 생성",
      metaDescription:
        "ORCID와 OpenAlex 기록으로 LaTeX 학술 이력서를 생성하세요. SigmaCV는 일관된 CSL 인용이 포함된 컴파일 가능한 .tex 및 .bib 파일을 생성합니다. 무료이며 오픈 소스입니다.",
      navLabel: "LaTeX 이력서",
      heading: "연구 기록에서 LaTeX 학술 이력서 생성",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 이력서를 구성하고 바로 컴파일할 수 있는 LaTeX 파일을 내보냅니다 — 직접 채워야 하는 빈 템플릿이 아닙니다.",
      bullets: [
        "ORCID와 OpenAlex 논문에서 생성된 .bib 참고문헌이 포함된 LaTeX 이력서를 내보냅니다.",
        "인용은 CSL을 통해 서식화되므로 PDF, DOCX, LaTeX, Markdown의 내용이 동일합니다.",
        "개인에게 무료이며 오픈 소스입니다. 내용을 정리한 후 직접 .tex 파일을 컴파일하면 됩니다.",
      ],
      cta: "LaTeX 이력서 만들기",
      faq: [
        {
          q: "SigmaCV는 어떤 LaTeX 파일을 내보내나요?",
          a: "SigmaCV는 .tex 이력서 파일과 정리한 논문으로 구성된 .bib 참고문헌을 내보냅니다. 이를 통해 본인의 LaTeX 환경에서 문서를 컴파일할 수 있습니다.",
        },
        {
          q: "LaTeX 서식을 직접 지정해야 하나요?",
          a: "아니요. SigmaCV가 ORCID와 OpenAlex 기록을 바탕으로 LaTeX 이력서를 채우고 인용을 서식화합니다 — 모든 항목을 직접 입력해야 하는 빈 LaTeX 템플릿과는 다릅니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "funder-cv-templates": {
      metaTitle: "연구비 지원기관 CV 템플릿: ERC, UKRI, NSF, NIH, SNSF",
      metaDescription:
        "ERC, UKRI R4RI, NSF, NIH, SNSF 원클릭 이력서 레이아웃. SigmaCV가 ORCID와 OpenAlex 기록을 채우고 PDF, DOCX, LaTeX으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "연구비 지원기관 CV 템플릿",
      heading: "ERC, UKRI, NSF, NIH, SNSF 연구비 지원기관 CV 템플릿",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록에 원클릭 지원기관 레이아웃을 적용합니다 — ERC, UKRI R4RI, NSF, NIH, SNSF 등. 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC를 포함한 58가지 원클릭 지원기관·기관·산업 레이아웃을 가역적으로 적용합니다.",
        "각 레이아웃은 ORCID와 OpenAlex 기록을 채우며 전체에 걸쳐 일관된 CSL 인용을 제공합니다.",
        "PDF, DOCX, LaTeX으로 내보냅니다. 개인에게 무료이며 오픈 소스로, 표시 내용을 완전히 제어할 수 있습니다.",
      ],
      cta: "지원기관 CV 레이아웃 선택",
      faq: [
        {
          q: "SigmaCV는 어떤 지원기관 CV 형식을 지원하나요?",
          a: "SigmaCV는 UKRI R4RI, Royal Society, SNSF, NIH, NSF, ERC를 포함한 지원기관·기관·산업 형식의 58가지 원클릭 레이아웃을 제공하며, 각각 공개된 연구 기록에서 채워집니다.",
        },
        {
          q: "레이아웃을 전환해도 편집 내용이 유지되나요?",
          a: "네. 레이아웃은 동일한 정규 이력서에 가역적으로 적용되므로 지원기관 형식 간에 자유롭게 전환해도 정리 내용이 보존됩니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
  },
  "ru-RU": {
    "orcid-to-cv": {
      metaTitle: "Превратите ваш iD ORCID в академическое резюме",
      metaDescription:
        "Превратите ваш iD ORCID в аккуратное академическое резюме за считаные минуты. SigmaCV извлекает ваши публикации из ORCID и OpenAlex, форматирует ссылки и экспортирует в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым исходным кодом.",
      navLabel: "ORCID в резюме",
      heading: "Превратите ваш iD ORCID в академическое резюме",
      subhead:
        "Войдите через ORCID, и SigmaCV создаст аккуратное академическое резюме с отформатированными ссылками на основе ваших открытых научных записей — готовое к отбору и экспорту.",
      bullets: [
        "Публикации извлекаются автоматически из ORCID и OpenAlex — сопоставление по идентификатору, никогда по имени.",
        "Единообразные ссылки в любом стиле CSL, экспорт в PDF, DOCX, LaTeX или Markdown.",
        "Бесплатно для частных лиц и с открытым исходным кодом; вы сами решаете, что отображать.",
      ],
      cta: "Создать резюме из ORCID",
      faq: [
        {
          q: "Как превратить мой iD ORCID в резюме?",
          a: "Войдите с помощью вашего iD ORCID. SigmaCV считывает ваши открытые записи и профиль OpenAlex, собирает ваши публикации и профиль в резюме и позволяет отобрать и экспортировать его.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код по лицензии Apache-2.0. Он считывает только публичные метаданные исследований.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "nih-biosketch": {
      metaTitle: "Создайте NIH biosketch из ORCID и OpenAlex",
      metaDescription:
        "Создайте NIH biosketch на основе ваших записей в ORCID и OpenAlex. SigmaCV собирает ваши вклады и публикации, форматирует ссылки и экспортирует — бесплатно и с открытым исходным кодом.",
      navLabel: "NIH biosketch",
      heading: "Создайте NIH biosketch из ORCID и OpenAlex",
      subhead:
        "Войдите через ORCID, и SigmaCV подготовит черновик biosketch в стиле NIH на основе ваших открытых научных записей — ваши вклады и публикации, готовые к доработке и экспорту.",
      bullets: [
        "Ваши публикации и профиль извлекаются из ORCID и OpenAlex — сопоставление по идентификатору, никогда по имени.",
        "Выберите значимые публикации с единообразным форматированием ссылок по всему документу.",
        "Экспорт в PDF, DOCX или LaTeX; бесплатно для частных лиц и с открытым исходным кодом.",
      ],
      cta: "Создать biosketch",
      faq: [
        {
          q: "Как создать NIH biosketch?",
          a: "Войдите с помощью вашего iD ORCID. SigmaCV извлекает ваши публикации и профиль из ORCID и OpenAlex, после чего вы отбираете вклады и выбранные публикации и экспортируете biosketch.",
        },
        {
          q: "Можно ли выбрать, какие публикации отображаются?",
          a: "Да. Вы сами решаете, какие публикации и в каком порядке перечислять, чтобы biosketch отражал работы, наиболее значимые для вашей заявки.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "academic-cv-template": {
      metaTitle:
        "Бесплатный шаблон академического резюме, автоматически заполненный из вашего профиля",
      metaDescription:
        "Бесплатный шаблон академического резюме, который заполняется сам. SigmaCV формирует ваше резюме из ORCID и OpenAlex, форматирует ссылки и экспортирует в PDF, DOCX, LaTeX или Markdown.",
      navLabel: "Шаблон академического резюме",
      heading:
        "Бесплатный шаблон академического резюме, автоматически заполненный из ваших научных записей",
      subhead:
        "Вместо пустого шаблона академического резюме войдите через ORCID, и SigmaCV соберёт аккуратное резюме с отформатированными ссылками из ваших открытых научных записей — готовое к отбору и экспорту.",
      bullets: [
        "Начните с реального профиля, а не с пустого шаблона — публикации извлекаются из ORCID и OpenAlex по идентификатору, никогда по имени.",
        "Выберите макет и стиль цитирования CSL; одно и то же каноническое резюме экспортируется в PDF, DOCX, LaTeX или Markdown.",
        "Бесплатно для частных лиц и с открытым исходным кодом — вы сами решаете, какие разделы и публикации отображать.",
      ],
      cta: "Создать академическое резюме",
      faq: [
        {
          q: "Чем это отличается от пустого шаблона академического резюме?",
          a: "Пустой шаблон требует вручную вводить каждую запись. SigmaCV считывает ваши записи в ORCID и OpenAlex, заполняет резюме за вас, единообразно форматирует ссылки и позволяет отобрать и экспортировать его.",
        },
        {
          q: "Шаблон академического резюме бесплатный?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код по лицензии Apache-2.0. Он считывает только публичные метаданные исследований.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "openalex-cv": {
      metaTitle: "Создайте академическое резюме на основе вашего профиля OpenAlex",
      metaDescription:
        "Превратите ваш профиль OpenAlex в академическое резюме. SigmaCV извлекает ваши публикации по идентификатору, форматирует ссылки и экспортирует в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым исходным кодом.",
      navLabel: "OpenAlex-резюме",
      heading: "Создайте академическое резюме на основе вашего профиля OpenAlex",
      subhead:
        "Войдите через ORCID, и SigmaCV считает ваши записи в OpenAlex, чтобы собрать аккуратное академическое резюме с отформатированными ссылками — сопоставление по идентификатору автора, готовое к отбору и экспорту.",
      bullets: [
        "Ваши работы из OpenAlex импортируются автоматически и сопоставляются по идентификатору автора OpenAlex / ORCID — никогда по имени.",
        "Метрики и сведения о грантах из OpenAlex доступны опционально и в нормированном по области виде — по умолчанию отключены, в соответствии с DORA.",
        "Единообразные CSL-ссылки, экспортируемые в PDF, DOCX, LaTeX или Markdown; бесплатно для частных лиц и с открытым исходным кодом.",
      ],
      cta: "Создать резюме из OpenAlex",
      faq: [
        {
          q: "Как SigmaCV использует мой профиль OpenAlex?",
          a: "Войдите с помощью вашего iD ORCID. SigmaCV определяет ваш идентификатор автора в OpenAlex, извлекает ваши работы и профиль и собирает их в резюме, которое вы можете отобрать и экспортировать.",
        },
        {
          q: "Сопоставляются ли мои публикации по имени?",
          a: "Нет. SigmaCV сопоставляет работы по идентификатору автора (OpenAlex / ORCID ID), никогда по имени — это исключает ложные совпадения, характерные для распространённых или транслитерированных имён.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "publication-list": {
      metaTitle: "Создайте форматированный список публикаций из ORCID",
      metaDescription:
        "Создайте форматированный список публикаций для резюме из ORCID и OpenAlex. Выберите любой стиль CSL; экспортируйте в PDF, DOCX, LaTeX, Markdown или BibTeX. Бесплатно и с открытым исходным кодом.",
      navLabel: "Список публикаций",
      heading: "Создайте форматированный список публикаций из ваших научных записей",
      subhead:
        "Войдите через ORCID, и SigmaCV сформирует единообразный список ваших публикаций с отформатированными ссылками из ORCID и OpenAlex — готовый к отбору, изменению порядка и экспорту.",
      bullets: [
        "Публикации извлекаются из ORCID и OpenAlex по идентификатору, затем форматируются в любом стиле цитирования CSL — одинаково в каждой форме вывода.",
        "Выберите, какие работы отображать и в каком порядке; ваше собственное имя выделяется по ORCID / OpenAlex ID.",
        "Экспортируйте список в PDF, DOCX, LaTeX, Markdown или BibTeX; бесплатно для частных лиц и с открытым исходным кодом.",
      ],
      cta: "Создать список публикаций",
      faq: [
        {
          q: "Могу ли я выбрать стиль цитирования для списка публикаций?",
          a: "Да. SigmaCV форматирует ваш список через CSL, поэтому вы можете выбрать любой поддерживаемый стиль цитирования, и форматирование останется идентичным в PDF, DOCX, LaTeX и Markdown.",
        },
        {
          q: "Можно ли экспортировать список как BibTeX?",
          a: "Да. Наряду с PDF, DOCX, LaTeX и Markdown SigmaCV может экспортировать ваши отобранные публикации как BibTeX и CSL-JSON для использования в других местах.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "latex-cv": {
      metaTitle: "Создайте академическое резюме в LaTeX из ORCID и OpenAlex",
      metaDescription:
        "Создайте академическое резюме в LaTeX из ваших записей в ORCID и OpenAlex. SigmaCV формирует готовые к компиляции .tex и .bib с единообразными CSL-ссылками. Бесплатно и с открытым исходным кодом.",
      navLabel: "LaTeX-резюме",
      heading: "Создайте академическое резюме в LaTeX из ваших научных записей",
      subhead:
        "Войдите через ORCID, и SigmaCV сформирует ваше резюме на основе открытых научных записей и экспортирует готовый к компиляции LaTeX — а не пустой шаблон, который нужно заполнять вручную.",
      bullets: [
        "Экспортируйте резюме в LaTeX с сопроводительной .bib-библиографией, сформированной из ваших публикаций в ORCID и OpenAlex.",
        "Ссылки форматируются через CSL, поэтому PDF, DOCX, LaTeX и Markdown выглядят одинаково.",
        "Бесплатно для частных лиц и с открытым исходным кодом; вы куратируете содержание, а .tex компилируете самостоятельно.",
      ],
      cta: "Создать LaTeX-резюме",
      faq: [
        {
          q: "Какие LaTeX-файлы экспортирует SigmaCV?",
          a: "SigmaCV экспортирует .tex-файл резюме и .bib-библиографию, собранную из ваших отобранных публикаций, — вы компилируете документ в собственной среде LaTeX.",
        },
        {
          q: "Нужно ли самостоятельно форматировать LaTeX?",
          a: "Нет. SigmaCV заполняет резюме в LaTeX из ваших записей в ORCID и OpenAlex и форматирует ссылки за вас — в отличие от пустого шаблона LaTeX, где каждую запись вводите вы сами.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "funder-cv-templates": {
      metaTitle: "Шаблоны резюме для грантодателей: ERC, UKRI, NSF, NIH и SNSF",
      metaDescription:
        "Одним щелчком применяйте макеты резюме для ERC, UKRI R4RI, NSF, NIH и SNSF. SigmaCV заполняет их из вашего профиля ORCID и OpenAlex и экспортирует в PDF, DOCX или LaTeX. Бесплатно и с открытым исходным кодом.",
      navLabel: "Шаблоны резюме для грантодателей",
      heading: "Шаблоны резюме для грантодателей: ERC, UKRI, NSF, NIH и SNSF",
      subhead:
        "Войдите через ORCID, и SigmaCV применит одним щелчком макет грантодателя к вашим открытым научным записям — ERC, UKRI R4RI, NSF, NIH, SNSF и другие — готово к отбору и экспорту.",
      bullets: [
        "58 макетов одним щелчком для грантодателей, институций и индустрии, включая UKRI R4RI, Royal Society, SNSF, NIH, NSF и ERC — применяются обратимо.",
        "Каждый макет заполняется из ваших записей в ORCID и OpenAlex с единообразными CSL-ссылками по всему документу.",
        "Экспорт в PDF, DOCX или LaTeX; бесплатно для частных лиц и с открытым исходным кодом — вы полностью контролируете содержание.",
      ],
      cta: "Выбрать макет резюме для грантодателя",
      faq: [
        {
          q: "Какие форматы резюме для грантодателей поддерживает SigmaCV?",
          a: "SigmaCV предлагает 58 макетов одним щелчком для грантодателей, институций и индустрии — включая UKRI R4RI, Royal Society, SNSF, NIH, NSF и ERC — каждый заполнен из ваших открытых научных записей.",
        },
        {
          q: "Можно ли переключать макеты, не теряя правки?",
          a: "Да. Макеты применяются обратимо к одному и тому же каноническому резюме, поэтому вы можете переключаться между форматами грантодателей, а ваша куратура сохраняется.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
  },
};

/** Localized copy for a given SEO landing page (falls back to English). */
export function landingPageStrings(page: LandingPageId, locale: string): LandingPageStrings {
  return LANDING_PAGES_I18N[asLocale(locale)][page];
}
