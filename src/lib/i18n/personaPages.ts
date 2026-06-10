import { asLocale, type Locale } from "./index";
import type { LandingPageId, LandingPageStrings } from "./landingPages";
import type { LandingPageContent } from "./landingContent";

/**
 * Persona SEO landing pages (C3) — high-intent pages aimed at a specific searcher
 * (PhD applicant, postdoc, …). They reuse the exact shapes of the regular landing
 * pages (`LandingPageStrings` thin copy + `LandingPageContent` deep copy) and are
 * surfaced through the `landingAll` facade, so the existing 7 pages are untouched.
 *
 * Typed Record<Locale, Record<PersonaPageId, …>> so a missing locale/page/field is
 * a compile error. Non-English copy was machine-drafted and is flagged for native
 * review (same convention as landingPages.ts / landingContent.ts).
 */

export const PERSONA_PAGE_IDS = [
  "phd-cv",
  "postdoc-cv",
  "grad-school-cv",
  "faculty-cv",
  "research-cv",
] as const;
export type PersonaPageId = (typeof PERSONA_PAGE_IDS)[number];

/** Cross-links for each persona page (existing landing ids or other personas). */
export const PERSONA_RELATED: Record<PersonaPageId, readonly (LandingPageId | PersonaPageId)[]> = {
  "phd-cv": ["postdoc-cv", "orcid-to-cv", "academic-cv-template"],
  "postdoc-cv": ["phd-cv", "funder-cv-templates", "publication-list"],
  "grad-school-cv": ["phd-cv", "orcid-to-cv", "academic-cv-template"],
  "faculty-cv": ["research-cv", "funder-cv-templates", "publication-list"],
  "research-cv": ["faculty-cv", "openalex-cv", "publication-list"],
};

const PERSONA_PAGES_I18N: Record<Locale, Record<PersonaPageId, LandingPageStrings>> = {
  "en-US": {
    "grad-school-cv": {
      metaTitle: "Grad-school CV, built from your ORCID record",
      metaDescription:
        "Build an academic CV for grad-school applications. SigmaCV assembles your research experience and any publications from ORCID and OpenAlex, formats citations, and exports to PDF, DOCX, LaTeX or Markdown. Free and open source.",
      navLabel: "Grad-school CV",
      heading: "Build an academic CV for grad school",
      subhead:
        "Sign in with ORCID and SigmaCV assembles a clean, citation-formatted CV from your open research record — for master's, PhD and grad-school applications, ready to curate and export.",
      bullets: [
        "Start from your real record — any publications, preprints and posters pulled from ORCID and OpenAlex by identifier, never by name.",
        "Consistent citations in any CSL style, exported to PDF, DOCX, LaTeX or Markdown.",
        "Free for individuals and open source; you curate exactly what the admissions committee sees.",
      ],
      cta: "Build your grad-school CV",
      faq: [
        {
          q: "What if I don't have publications yet?",
          a: "That is normal at the application stage. SigmaCV includes any preprints or posters you have, and your research experience and skills carry the most weight — you curate what appears and can add work by DOI.",
        },
        {
          q: "Is it free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence, and reads only public research metadata.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "Faculty & tenure CV from ORCID & OpenAlex",
      metaDescription:
        "Build a faculty or tenure CV from your ORCID and OpenAlex record. SigmaCV assembles publications, grants, teaching and service, formats citations, and exports to PDF, DOCX, LaTeX or Markdown. Free and open source.",
      navLabel: "Faculty CV",
      heading: "Build a faculty or tenure CV from your research record",
      subhead:
        "Sign in with ORCID and SigmaCV assembles a comprehensive, citation-formatted CV from your open research record — for faculty job, tenure and promotion files, ready to curate and export.",
      bullets: [
        "Publications, grants, teaching and service pulled from ORCID and OpenAlex — matched by identifier, never by name.",
        "Consistent CSL citations across PDF, DOCX, LaTeX and Markdown; one canonical CV, many funder layouts.",
        "Free for individuals and open source; opt-in, field-normalized metrics (default none, DORA-aligned).",
      ],
      cta: "Build your faculty CV",
      faq: [
        {
          q: "Can it produce funder and tenure CV formats?",
          a: "Yes. SigmaCV has one-click layouts for major funders (NIH, NSF, ERC, UKRI R4RI, SNSF and more), applied reversibly to the same canonical CV, so you can derive a tenure or grant CV without rebuilding it.",
        },
        {
          q: "Is it free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence, and reads only public research metadata.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "research-cv": {
      metaTitle: "Research CV, auto-built from ORCID & OpenAlex",
      metaDescription:
        "Build a research CV (researcher / scientific CV) from your ORCID and OpenAlex record. SigmaCV formats citations and exports to PDF, DOCX, LaTeX, Markdown or BibTeX. Free and open source.",
      navLabel: "Research CV",
      heading: "Build a research CV from the open record",
      subhead:
        "Sign in with ORCID and SigmaCV assembles a clean, citation-formatted research CV from your open research record — matched to you by identifier, ready to curate and export.",
      bullets: [
        "Publications, datasets, software and more pulled from ORCID and OpenAlex — matched by identifier, never by name.",
        "Consistent CSL citations exported to PDF, DOCX, LaTeX, Markdown or BibTeX.",
        "Free for individuals and open source; opt-in, field-normalized metrics (default none, DORA-aligned).",
      ],
      cta: "Build your research CV",
      faq: [
        {
          q: "What's the difference between a research CV and a résumé?",
          a: "A research (academic) CV is a complete record of your scholarly work — publications, funding, teaching, service — and grows over time; a résumé is a short, tailored document for non-academic roles.",
        },
        {
          q: "Is it free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence, and reads only public research metadata.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "phd-cv": {
      metaTitle: "PhD application CV, built from your ORCID record",
      metaDescription:
        "Build a strong PhD-application CV. SigmaCV assembles your research experience and publications from ORCID and OpenAlex, formats citations, and exports to PDF, DOCX, LaTeX or Markdown. Free and open source.",
      navLabel: "PhD application CV",
      heading: "Build a CV for your PhD application",
      subhead:
        "Sign in with ORCID and SigmaCV assembles a clean, citation-formatted CV from your open research record — ideal for PhD and doctoral-programme applications, ready to curate and export.",
      bullets: [
        "Start from your real record — publications, preprints and posters pulled from ORCID and OpenAlex by identifier, never by name.",
        "Consistent citations in any CSL style, exported to PDF, DOCX, LaTeX or Markdown.",
        "Free for individuals and open source; you curate exactly what the committee sees.",
      ],
      cta: "Build your PhD CV",
      faq: [
        {
          q: "Do I need publications for a PhD-application CV?",
          a: "No — research experience, projects and skills matter most at this stage. SigmaCV includes any publications, preprints or posters you do have, formatted consistently, and you can add work by DOI.",
        },
        {
          q: "Is it free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence, and reads only public research metadata.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "Postdoc CV, auto-built from ORCID & OpenAlex",
      metaDescription:
        "Build a postdoc CV from your ORCID and OpenAlex record. SigmaCV assembles your publications, funding and teaching, formats citations, and exports to PDF, DOCX, LaTeX or Markdown. Free and open source.",
      navLabel: "Postdoc CV",
      heading: "Build a postdoc CV from your research record",
      subhead:
        "Sign in with ORCID and SigmaCV assembles a current, citation-formatted CV from your open research record — for postdoc, fellowship and early-career job applications, ready to curate and export.",
      bullets: [
        "Publications, funding and teaching pulled from ORCID and OpenAlex — matched by identifier, never by name.",
        "Consistent CSL citations exported to PDF, DOCX, LaTeX or Markdown — keep one CV current for rolling deadlines.",
        "Free for individuals and open source; opt-in, field-normalized metrics (default none, DORA-aligned).",
      ],
      cta: "Build your postdoc CV",
      faq: [
        {
          q: "Can I keep one CV current for many applications?",
          a: "Yes. SigmaCV builds from one canonical record that re-syncs from the open sources, so you update once and export a tailored version for each postdoc, fellowship or job application.",
        },
        {
          q: "Is it free?",
          a: "Yes. SigmaCV is free for individuals and open source under the Apache-2.0 licence, and reads only public research metadata.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
  },
  "zh-CN": {
    "grad-school-cv": {
      metaTitle: "研究生申请简历，依据您的 ORCID 记录生成",
      metaDescription:
        "为研究生申请打造一份学术简历。SigmaCV 通过标识符从 ORCID 和 OpenAlex 汇总您的研究经历及任何论文、格式化引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
      navLabel: "研究生申请简历",
      heading: "为研究生申请打造一份学术简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可依据您公开的研究记录生成一份简洁、已格式化引用的简历——适用于硕士、博士及研究生申请，随时可整理和导出。",
      bullets: [
        "从您的真实记录出发——任何论文、预印本和海报均通过标识符从 ORCID 和 OpenAlex 提取，绝不通过姓名。",
        "以任意 CSL 样式提供一致的引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
        "对个人免费且开源；您可精确决定招生委员会看到哪些内容。",
      ],
      cta: "生成您的研究生申请简历",
      faq: [
        {
          q: "如果我还没有论文怎么办？",
          a: "在申请阶段这很正常。SigmaCV 会包含您已有的任何预印本或海报，而您的研究经历和技能最具分量——您可决定哪些内容出现，也可以通过 DOI 添加成果。",
        },
        {
          q: "免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源。它仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "教职与终身教职简历，依据 ORCID 与 OpenAlex 生成",
      metaDescription:
        "依据您的 ORCID 和 OpenAlex 记录生成教职或终身教职简历。SigmaCV 汇总论文、资助、教学和服务、格式化引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
      navLabel: "教职简历",
      heading: "依据您的研究记录构建教职或终身教职简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可依据您公开的研究记录生成一份全面、已格式化引用的简历——适用于教职求职、终身教职和晋升材料，随时可整理和导出。",
      bullets: [
        "论文、资助、教学和服务从 ORCID 和 OpenAlex 提取——通过标识符匹配，绝不通过姓名。",
        "在 PDF、DOCX、LaTeX 和 Markdown 中提供一致的 CSL 引用；一份规范简历，多种资助机构布局。",
        "对个人免费且开源；可选启用、经过字段归一化的指标（默认不显示，符合 DORA 原则）。",
      ],
      cta: "生成您的教职简历",
      faq: [
        {
          q: "它能生成资助机构和终身教职的简历格式吗？",
          a: "可以。SigmaCV 为主要资助机构（NIH、NSF、ERC、UKRI R4RI、SNSF 等）提供一键式布局，并以可逆的方式应用于同一份规范简历，因此您无需重新构建即可衍生出终身教职或资助申请简历。",
        },
        {
          q: "免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源。它仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "research-cv": {
      metaTitle: "研究简历，依据 ORCID 与 OpenAlex 自动构建",
      metaDescription:
        "依据您的 ORCID 和 OpenAlex 记录生成研究简历（研究人员/科研简历）。SigmaCV 格式化引用，并导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。免费且开源。",
      navLabel: "研究简历",
      heading: "依据开放记录构建研究简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可依据您公开的研究记录生成一份简洁、已格式化引用的研究简历——通过标识符与您匹配，随时可整理和导出。",
      bullets: [
        "论文、数据集、软件等从 ORCID 和 OpenAlex 提取——通过标识符匹配，绝不通过姓名。",
        "一致的 CSL 引用，可导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。",
        "对个人免费且开源；可选启用、经过字段归一化的指标（默认不显示，符合 DORA 原则）。",
      ],
      cta: "生成您的研究简历",
      faq: [
        {
          q: "研究简历和履历表（résumé）有什么区别？",
          a: "研究（学术）简历是您学术成果的完整记录——论文、资助、教学、服务——并随时间不断增长；而履历表则是面向非学术职位的简短、量身定制的文档。",
        },
        {
          q: "免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源。它仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "phd-cv": {
      metaTitle: "博士申请简历，依据您的 ORCID 记录生成",
      metaDescription:
        "打造一份出色的博士申请简历。SigmaCV 从 ORCID 和 OpenAlex 汇总您的研究经历和论文、格式化引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
      navLabel: "博士申请简历",
      heading: "为您的博士申请打造一份简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可依据您公开的学术记录生成一份简洁、已格式化引用的简历——非常适合博士及博士项目申请，随时可整理和导出。",
      bullets: [
        "从您的真实记录出发——论文、预印本和海报通过标识符从 ORCID 和 OpenAlex 提取，绝不通过姓名。",
        "以任意 CSL 样式提供一致的引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。",
        "对个人免费且开源；您可精确决定评审委员会看到哪些内容。",
      ],
      cta: "生成您的博士简历",
      faq: [
        {
          q: "博士申请简历需要有论文吗？",
          a: "不需要——在这个阶段，研究经历、项目和技能最为重要。SigmaCV 会包含您已有的任何论文、预印本或海报，并统一格式化，您也可以通过 DOI 添加成果。",
        },
        {
          q: "免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源。它仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "博士后简历，自动依据 ORCID 与 OpenAlex 生成",
      metaDescription:
        "依据您的 ORCID 和 OpenAlex 记录生成博士后简历。SigmaCV 汇总您的论文、资助和教学经历、格式化引用，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
      navLabel: "博士后简历",
      heading: "依据您的学术记录构建博士后简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可依据您公开的学术记录生成一份最新、已格式化引用的简历——适用于博士后、研究金和早期职业求职申请，随时可整理和导出。",
      bullets: [
        "论文、资助和教学经历从 ORCID 和 OpenAlex 提取——通过标识符匹配，绝不通过姓名。",
        "一致的 CSL 引用，可导出为 PDF、DOCX、LaTeX 或 Markdown——只需保持一份最新的简历，即可应对滚动截止日期。",
        "对个人免费且开源；可选启用、经过字段归一化的指标（默认不显示，符合 DORA 原则）。",
      ],
      cta: "生成您的博士后简历",
      faq: [
        {
          q: "我可以用一份简历应对多个申请并保持其最新吗？",
          a: "可以。SigmaCV 构建自同一份规范记录，并会从开放数据源重新同步，因此您只需更新一次，即可为每个博士后、研究金或求职申请导出量身定制的版本。",
        },
        {
          q: "免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源。它仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
  },
  "es-ES": {
    "grad-school-cv": {
      metaTitle: "CV para posgrado, generado a partir de tu registro de ORCID",
      metaDescription:
        "Crea un CV académico para solicitudes de posgrado. SigmaCV reúne tu experiencia investigadora y cualquier publicación desde ORCID y OpenAlex, da formato a las citas y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
      navLabel: "CV para posgrado",
      heading: "Crea un CV académico para el posgrado",
      subhead:
        "Inicia sesión con ORCID y SigmaCV reúne un CV limpio y con citas formateadas a partir de tu registro científico abierto, para solicitudes de máster, doctorado y posgrado, listo para seleccionar y exportar.",
      bullets: [
        "Parte de tu registro real: cualquier publicación, preprint y póster extraído de ORCID y OpenAlex por identificador, nunca por nombre.",
        "Citas coherentes en cualquier estilo CSL, exportadas a PDF, DOCX, LaTeX o Markdown.",
        "Gratis para particulares y de código abierto; tú seleccionas exactamente lo que ve el comité de admisiones.",
      ],
      cta: "Crea tu CV para posgrado",
      faq: [
        {
          q: "¿Y si aún no tengo publicaciones?",
          a: "Es normal en la fase de solicitud. SigmaCV incluye cualquier preprint o póster que tengas, y tu experiencia investigadora y tus competencias son lo que más peso tiene: tú seleccionas lo que aparece y puedes añadir trabajos por DOI.",
        },
        {
          q: "¿Es gratis?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0, y solo lee metadatos públicos de investigación.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "CV de profesorado y de plaza permanente desde ORCID y OpenAlex",
      metaDescription:
        "Crea un CV de profesorado o de plaza permanente a partir de tu registro de ORCID y OpenAlex. SigmaCV reúne publicaciones, financiación, docencia y servicio, da formato a las citas y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
      navLabel: "CV de profesorado",
      heading:
        "Crea un CV de profesorado o de plaza permanente a partir de tu registro de investigación",
      subhead:
        "Inicia sesión con ORCID y SigmaCV reúne un CV completo y con citas formateadas a partir de tu registro científico abierto, para procesos de profesorado, plaza permanente y promoción, listo para seleccionar y exportar.",
      bullets: [
        "Publicaciones, financiación, docencia y servicio extraídos de ORCID y OpenAlex, identificados por identificador, nunca por nombre.",
        "Citas CSL coherentes en PDF, DOCX, LaTeX y Markdown; un único CV canónico, muchas plantillas de financiadores.",
        "Gratis para particulares y de código abierto; métricas opcionales y normalizadas por campo (ninguna por defecto, alineado con DORA).",
      ],
      cta: "Crea tu CV de profesorado",
      faq: [
        {
          q: "¿Puede generar formatos de CV para financiadores y para plaza permanente?",
          a: "Sí. SigmaCV tiene plantillas en un clic para los principales financiadores (NIH, NSF, ERC, UKRI R4RI, SNSF y más), aplicadas de forma reversible al mismo CV canónico, de modo que puedes derivar un CV de plaza permanente o de solicitud de ayudas sin reconstruirlo.",
        },
        {
          q: "¿Es gratis?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0, y solo lee metadatos públicos de investigación.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "research-cv": {
      metaTitle: "CV de investigación, generado automáticamente desde ORCID y OpenAlex",
      metaDescription:
        "Crea un CV de investigación (CV de investigador / CV científico) a partir de tu registro de ORCID y OpenAlex. SigmaCV da formato a las citas y exporta a PDF, DOCX, LaTeX, Markdown o BibTeX. Gratis y de código abierto.",
      navLabel: "CV de investigación",
      heading: "Crea un CV de investigación a partir del registro abierto",
      subhead:
        "Inicia sesión con ORCID y SigmaCV reúne un CV de investigación limpio y con citas formateadas a partir de tu registro científico abierto, identificado contigo por identificador, listo para seleccionar y exportar.",
      bullets: [
        "Publicaciones, conjuntos de datos, software y más, extraídos de ORCID y OpenAlex, identificados por identificador, nunca por nombre.",
        "Citas CSL coherentes exportadas a PDF, DOCX, LaTeX, Markdown o BibTeX.",
        "Gratis para particulares y de código abierto; métricas opcionales y normalizadas por campo (ninguna por defecto, alineado con DORA).",
      ],
      cta: "Crea tu CV de investigación",
      faq: [
        {
          q: "¿Cuál es la diferencia entre un CV de investigación y un currículum?",
          a: "Un CV de investigación (académico) es un registro completo de tu trabajo científico —publicaciones, financiación, docencia, servicio— y crece con el tiempo; un currículum es un documento breve y adaptado para puestos no académicos.",
        },
        {
          q: "¿Es gratis?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0, y solo lee metadatos públicos de investigación.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "phd-cv": {
      metaTitle: "CV para solicitud de doctorado, creado desde tu registro de ORCID",
      metaDescription:
        "Crea un CV sólido para tu solicitud de doctorado. SigmaCV reúne tu experiencia investigadora y tus publicaciones desde ORCID y OpenAlex, da formato a las citas y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
      navLabel: "CV para solicitud de doctorado",
      heading: "Crea un CV para tu solicitud de doctorado",
      subhead:
        "Inicia sesión con ORCID y SigmaCV reúne un CV limpio y con citas formateadas a partir de tu registro científico abierto, ideal para solicitudes de doctorado y de programas de doctorado, listo para seleccionar y exportar.",
      bullets: [
        "Parte de tu registro real: publicaciones, preprints y pósteres extraídos de ORCID y OpenAlex por identificador, nunca por nombre.",
        "Citas coherentes en cualquier estilo CSL, exportadas a PDF, DOCX, LaTeX o Markdown.",
        "Gratis para particulares y de código abierto; tú seleccionas exactamente lo que ve el comité.",
      ],
      cta: "Crea tu CV de doctorado",
      faq: [
        {
          q: "¿Necesito publicaciones para un CV de solicitud de doctorado?",
          a: "No: en esta etapa lo que más cuenta es tu experiencia investigadora, tus proyectos y tus competencias. SigmaCV incluye las publicaciones, preprints o pósteres que tengas, con un formato coherente, y puedes añadir trabajos por DOI.",
        },
        {
          q: "¿Es gratis?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0, y solo lee metadatos públicos de investigación.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "CV de posdoctorado, creado automáticamente desde ORCID y OpenAlex",
      metaDescription:
        "Crea un CV de posdoctorado a partir de tu registro de ORCID y OpenAlex. SigmaCV reúne tus publicaciones, tu financiación y tu docencia, da formato a las citas y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
      navLabel: "CV de posdoctorado",
      heading: "Crea un CV de posdoctorado a partir de tu registro de investigación",
      subhead:
        "Inicia sesión con ORCID y SigmaCV reúne un CV actualizado y con citas formateadas a partir de tu registro científico abierto, para solicitudes de posdoctorado, becas y puestos de inicio de carrera, listo para seleccionar y exportar.",
      bullets: [
        "Publicaciones, financiación y docencia extraídas de ORCID y OpenAlex, identificadas por identificador, nunca por nombre.",
        "Citas CSL coherentes exportadas a PDF, DOCX, LaTeX o Markdown; mantén un único CV actualizado para los plazos continuos.",
        "Gratis para particulares y de código abierto; métricas opcionales y normalizadas por campo (ninguna por defecto, alineado con DORA).",
      ],
      cta: "Crea tu CV de posdoctorado",
      faq: [
        {
          q: "¿Puedo mantener un único CV actualizado para muchas solicitudes?",
          a: "Sí. SigmaCV construye a partir de un único registro canónico que se resincroniza desde las fuentes abiertas, así que lo actualizas una vez y exportas una versión adaptada para cada solicitud de posdoctorado, beca o puesto.",
        },
        {
          q: "¿Es gratis?",
          a: "Sí. SigmaCV es gratis para particulares y de código abierto bajo la licencia Apache-2.0, y solo lee metadatos públicos de investigación.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
  },
  "fr-FR": {
    "grad-school-cv": {
      metaTitle: "CV pour master ou doctorat, construit depuis votre dossier ORCID",
      metaDescription:
        "Construisez un CV académique pour vos candidatures en master ou doctorat. SigmaCV rassemble votre expérience de recherche et vos éventuelles publications depuis ORCID et OpenAlex, met en forme les citations et exporte en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
      navLabel: "CV master/doctorat",
      heading: "Construisez un CV académique pour le master ou le doctorat",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV assemble un CV soigné, aux citations mises en forme, à partir de votre dossier scientifique ouvert — pour les candidatures en master, en doctorat et aux programmes doctoraux, prêt à sélectionner et à exporter.",
      bullets: [
        "Partez de votre vrai dossier — publications, preprints et posters récupérés depuis ORCID et OpenAlex par identifiant, jamais par nom.",
        "Citations cohérentes dans n'importe quel style CSL, exportées en PDF, DOCX, LaTeX ou Markdown.",
        "Gratuit pour les particuliers et open source ; vous sélectionnez exactement ce que le comité d'admission voit.",
      ],
      cta: "Construisez votre CV de master/doctorat",
      faq: [
        {
          q: "Et si je n'ai pas encore de publications ?",
          a: "C'est normal au stade de la candidature. SigmaCV inclut les preprints ou posters que vous avez, et ce sont votre expérience de recherche et vos compétences qui comptent le plus — vous sélectionnez ce qui apparaît et pouvez ajouter un travail par son DOI.",
        },
        {
          q: "Est-ce gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0, et ne lit que les métadonnées publiques de recherche.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "CV d'enseignant-chercheur et de titularisation depuis ORCID et OpenAlex",
      metaDescription:
        "Construisez un CV d'enseignant-chercheur ou de titularisation à partir de votre dossier ORCID et OpenAlex. SigmaCV rassemble publications, financements, enseignement et responsabilités collectives, met en forme les citations et exporte en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
      navLabel: "CV d'enseignant-chercheur",
      heading:
        "Construisez un CV d'enseignant-chercheur ou de titularisation à partir de votre dossier de recherche",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV assemble un CV complet, aux citations mises en forme, à partir de votre dossier scientifique ouvert — pour les candidatures à un poste d'enseignant-chercheur, les dossiers de titularisation et de promotion, prêt à sélectionner et à exporter.",
      bullets: [
        "Publications, financements, enseignement et responsabilités collectives récupérés depuis ORCID et OpenAlex — appariés par identifiant, jamais par nom.",
        "Citations CSL cohérentes en PDF, DOCX, LaTeX et Markdown ; un seul CV canonique, de nombreuses mises en page de financeurs.",
        "Gratuit pour les particuliers et open source ; métriques optionnelles, normalisées par domaine (aucune par défaut, aligné DORA).",
      ],
      cta: "Construisez votre CV d'enseignant-chercheur",
      faq: [
        {
          q: "Peut-il produire des formats de CV pour financeurs et pour la titularisation ?",
          a: "Oui. SigmaCV propose des mises en page en un clic pour les grands financeurs (NIH, NSF, ERC, UKRI R4RI, SNSF et plus), appliquées de manière réversible au même CV canonique : vous pouvez ainsi dériver un CV de titularisation ou de financement sans le reconstruire.",
        },
        {
          q: "Est-ce gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0, et ne lit que les métadonnées publiques de recherche.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "research-cv": {
      metaTitle: "CV de recherche, construit automatiquement depuis ORCID et OpenAlex",
      metaDescription:
        "Construisez un CV de recherche (CV de chercheur / CV scientifique) à partir de votre dossier ORCID et OpenAlex. SigmaCV met en forme les citations et exporte en PDF, DOCX, LaTeX, Markdown ou BibTeX. Gratuit et open source.",
      navLabel: "CV de recherche",
      heading: "Construisez un CV de recherche à partir du dossier ouvert",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV assemble un CV de recherche soigné, aux citations mises en forme, à partir de votre dossier scientifique ouvert — apparié par identifiant, prêt à sélectionner et à exporter.",
      bullets: [
        "Publications, jeux de données, logiciels et plus encore récupérés depuis ORCID et OpenAlex — appariés par identifiant, jamais par nom.",
        "Citations CSL cohérentes exportées en PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        "Gratuit pour les particuliers et open source ; métriques optionnelles, normalisées par domaine (aucune par défaut, aligné DORA).",
      ],
      cta: "Construisez votre CV de recherche",
      faq: [
        {
          q: "Quelle est la différence entre un CV de recherche et un CV professionnel ?",
          a: "Un CV de recherche (académique) est un relevé complet de vos travaux scientifiques — publications, financements, enseignement, responsabilités collectives — et s'enrichit au fil du temps ; un CV professionnel est un document court et ciblé, destiné à des postes hors du monde académique.",
        },
        {
          q: "Est-ce gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0, et ne lit que les métadonnées publiques de recherche.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "phd-cv": {
      metaTitle: "CV de candidature en doctorat, construit depuis votre dossier ORCID",
      metaDescription:
        "Construisez un CV solide pour une candidature en doctorat. SigmaCV rassemble votre expérience de recherche et vos publications depuis ORCID et OpenAlex, met en forme les citations et exporte en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
      navLabel: "CV de candidature en doctorat",
      heading: "Construisez un CV pour votre candidature en doctorat",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV assemble un CV soigné, aux citations mises en forme, à partir de votre dossier scientifique ouvert — idéal pour les candidatures en doctorat et aux programmes doctoraux, prêt à sélectionner et à exporter.",
      bullets: [
        "Partez de votre vrai dossier — publications, preprints et posters récupérés depuis ORCID et OpenAlex par identifiant, jamais par nom.",
        "Citations cohérentes dans n'importe quel style CSL, exportées en PDF, DOCX, LaTeX ou Markdown.",
        "Gratuit pour les particuliers et open source ; vous choisissez exactement ce que le comité voit.",
      ],
      cta: "Construisez votre CV de doctorat",
      faq: [
        {
          q: "Ai-je besoin de publications pour un CV de candidature en doctorat ?",
          a: "Non — à ce stade, ce sont l'expérience de recherche, les projets et les compétences qui comptent le plus. SigmaCV inclut les publications, preprints ou posters que vous avez, mis en forme de façon cohérente, et vous pouvez ajouter un travail par son DOI.",
        },
        {
          q: "Est-ce gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0, et ne lit que les métadonnées publiques de recherche.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "CV de postdoctorat, construit automatiquement depuis ORCID et OpenAlex",
      metaDescription:
        "Construisez un CV de postdoctorat à partir de votre dossier ORCID et OpenAlex. SigmaCV rassemble vos publications, vos financements et votre enseignement, met en forme les citations et exporte en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
      navLabel: "CV de postdoctorat",
      heading: "Construisez un CV de postdoctorat à partir de votre dossier de recherche",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV assemble un CV à jour, aux citations mises en forme, à partir de votre dossier scientifique ouvert — pour les candidatures en postdoctorat, bourses et postes en début de carrière, prêt à sélectionner et à exporter.",
      bullets: [
        "Publications, financements et enseignement récupérés depuis ORCID et OpenAlex — appariés par identifiant, jamais par nom.",
        "Citations CSL cohérentes exportées en PDF, DOCX, LaTeX ou Markdown — gardez un seul CV à jour pour des échéances continues.",
        "Gratuit pour les particuliers et open source ; métriques optionnelles, normalisées par domaine (aucune par défaut, aligné DORA).",
      ],
      cta: "Construisez votre CV de postdoctorat",
      faq: [
        {
          q: "Puis-je garder un seul CV à jour pour de nombreuses candidatures ?",
          a: "Oui. SigmaCV construit à partir d'un seul dossier canonique qui se resynchronise depuis les sources ouvertes : vous mettez à jour une fois et exportez une version adaptée pour chaque candidature en postdoctorat, bourse ou poste.",
        },
        {
          q: "Est-ce gratuit ?",
          a: "Oui. SigmaCV est gratuit pour les particuliers et open source sous licence Apache-2.0, et ne lit que les métadonnées publiques de recherche.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
  },
  "de-DE": {
    "grad-school-cv": {
      metaTitle:
        "Lebenslauf für die Bewerbung um Master/Promotion, erstellt aus Ihrem ORCID-Verzeichnis",
      metaDescription:
        "Erstellen Sie einen akademischen Lebenslauf für Bewerbungen um einen Master- oder Promotionsplatz. SigmaCV stellt Ihre Forschungserfahrung und etwaige Publikationen aus ORCID und OpenAlex zusammen, formatiert Zitate und exportiert als PDF, DOCX, LaTeX oder Markdown. Kostenlos und quelloffen.",
      navLabel: "Lebenslauf für Master/Promotion",
      heading: "Erstellen Sie einen akademischen Lebenslauf für Master und Promotion",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV stellt aus Ihrem offenen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen Lebenslauf zusammen — für Bewerbungen um Master-, Promotions- und weiterführende Studienplätze, bereit zum Auswählen und Exportieren.",
      bullets: [
        "Beginnen Sie mit Ihrem echten Verzeichnis — etwaige Publikationen, Preprints und Poster, über Kennungen aus ORCID und OpenAlex geholt, niemals über den Namen.",
        "Einheitliche Zitate in jedem CSL-Stil, exportiert als PDF, DOCX, LaTeX oder Markdown.",
        "Kostenlos für Einzelpersonen und quelloffen; Sie bestimmen genau, was das Auswahlkomitee sieht.",
      ],
      cta: "Lebenslauf für Master/Promotion erstellen",
      faq: [
        {
          q: "Was, wenn ich noch keine Publikationen habe?",
          a: "Das ist im Bewerbungsstadium normal. SigmaCV nimmt alle vorhandenen Preprints oder Poster auf, und Ihre Forschungserfahrung und Kompetenzen zählen am meisten — Sie bestimmen, was erscheint, und können Arbeiten über die DOI hinzufügen.",
        },
        {
          q: "Ist es kostenlos?",
          a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz und liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "Lebenslauf für Professur & Berufung aus ORCID & OpenAlex",
      metaDescription:
        "Erstellen Sie einen Lebenslauf für eine Professur oder Berufung aus Ihrem ORCID- und OpenAlex-Verzeichnis. SigmaCV stellt Publikationen, Förderungen, Lehre und akademische Selbstverwaltung zusammen, formatiert Zitate und exportiert als PDF, DOCX, LaTeX oder Markdown. Kostenlos und quelloffen.",
      navLabel: "Lebenslauf für Professur",
      heading:
        "Erstellen Sie einen Lebenslauf für Professur oder Berufung aus Ihrem Forschungsverzeichnis",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV stellt aus Ihrem offenen Forschungsverzeichnis einen umfassenden, mit formatierten Zitaten versehenen Lebenslauf zusammen — für Bewerbungen auf Professuren, Berufungs- und Beförderungsunterlagen, bereit zum Auswählen und Exportieren.",
      bullets: [
        "Publikationen, Förderungen, Lehre und akademische Selbstverwaltung aus ORCID und OpenAlex geholt — über Kennungen zugeordnet, niemals über den Namen.",
        "Einheitliche CSL-Zitate über PDF, DOCX, LaTeX und Markdown hinweg; ein kanonischer Lebenslauf, viele Förderer-Layouts.",
        "Kostenlos für Einzelpersonen und quelloffen; optionale, feldnormierte Metriken (standardmäßig keine, DORA-konform).",
      ],
      cta: "Lebenslauf für Professur erstellen",
      faq: [
        {
          q: "Kann es Förderer- und Berufungs-Lebenslaufformate erzeugen?",
          a: "Ja. SigmaCV bietet Ein-Klick-Layouts für große Förderer (NIH, NSF, ERC, UKRI R4RI, SNSF und mehr), reversibel auf denselben kanonischen Lebenslauf angewendet, sodass Sie einen Berufungs- oder Förder-Lebenslauf ableiten können, ohne ihn neu aufzubauen.",
        },
        {
          q: "Ist es kostenlos?",
          a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz und liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "research-cv": {
      metaTitle: "Wissenschaftlicher Lebenslauf, automatisch aus ORCID & OpenAlex erstellt",
      metaDescription:
        "Erstellen Sie einen wissenschaftlichen Lebenslauf (Forschungs- bzw. wissenschaftlichen Lebenslauf) aus Ihrem ORCID- und OpenAlex-Verzeichnis. SigmaCV formatiert Zitate und exportiert als PDF, DOCX, LaTeX, Markdown oder BibTeX. Kostenlos und quelloffen.",
      navLabel: "Wissenschaftlicher Lebenslauf",
      heading: "Erstellen Sie einen wissenschaftlichen Lebenslauf aus dem offenen Verzeichnis",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV stellt aus Ihrem offenen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen wissenschaftlichen Lebenslauf zusammen — Ihnen über Kennungen zugeordnet, bereit zum Auswählen und Exportieren.",
      bullets: [
        "Publikationen, Datensätze, Software und mehr aus ORCID und OpenAlex geholt — über Kennungen zugeordnet, niemals über den Namen.",
        "Einheitliche CSL-Zitate, exportiert als PDF, DOCX, LaTeX, Markdown oder BibTeX.",
        "Kostenlos für Einzelpersonen und quelloffen; optionale, feldnormierte Metriken (standardmäßig keine, DORA-konform).",
      ],
      cta: "Wissenschaftlichen Lebenslauf erstellen",
      faq: [
        {
          q: "Was ist der Unterschied zwischen einem wissenschaftlichen Lebenslauf und einem Resümee?",
          a: "Ein wissenschaftlicher (akademischer) Lebenslauf ist ein vollständiges Verzeichnis Ihrer wissenschaftlichen Arbeit — Publikationen, Förderungen, Lehre, akademische Selbstverwaltung — und wächst mit der Zeit; ein Resümee ist ein kurzes, maßgeschneidertes Dokument für nicht-akademische Stellen.",
        },
        {
          q: "Ist es kostenlos?",
          a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz und liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "phd-cv": {
      metaTitle: "Lebenslauf für die Promotionsbewerbung, erstellt aus Ihrem ORCID-Verzeichnis",
      metaDescription:
        "Erstellen Sie einen überzeugenden Lebenslauf für die Promotionsbewerbung. SigmaCV stellt Ihre Forschungserfahrung und Publikationen aus ORCID und OpenAlex zusammen, formatiert Zitate und exportiert als PDF, DOCX, LaTeX oder Markdown. Kostenlos und quelloffen.",
      navLabel: "Lebenslauf für die Promotionsbewerbung",
      heading: "Erstellen Sie einen Lebenslauf für Ihre Promotionsbewerbung",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV stellt aus Ihrem offenen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen Lebenslauf zusammen — ideal für Promotions- und Doktorandenprogramm-Bewerbungen, bereit zum Auswählen und Exportieren.",
      bullets: [
        "Beginnen Sie mit Ihrem echten Verzeichnis — Publikationen, Preprints und Poster, über Kennungen aus ORCID und OpenAlex geholt, niemals über den Namen.",
        "Einheitliche Zitate in jedem CSL-Stil, exportiert als PDF, DOCX, LaTeX oder Markdown.",
        "Kostenlos für Einzelpersonen und quelloffen; Sie bestimmen genau, was das Auswahlkomitee sieht.",
      ],
      cta: "Promotions-Lebenslauf erstellen",
      faq: [
        {
          q: "Brauche ich Publikationen für einen Lebenslauf zur Promotionsbewerbung?",
          a: "Nein — Forschungserfahrung, Projekte und Kompetenzen zählen in dieser Phase am meisten. SigmaCV nimmt alle vorhandenen Publikationen, Preprints oder Poster auf, einheitlich formatiert, und Sie können Arbeiten über die DOI hinzufügen.",
        },
        {
          q: "Ist es kostenlos?",
          a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz und liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "Postdoc-Lebenslauf, automatisch aus ORCID & OpenAlex erstellt",
      metaDescription:
        "Erstellen Sie einen Postdoc-Lebenslauf aus Ihrem ORCID- und OpenAlex-Verzeichnis. SigmaCV stellt Ihre Publikationen, Förderungen und Lehre zusammen, formatiert Zitate und exportiert als PDF, DOCX, LaTeX oder Markdown. Kostenlos und quelloffen.",
      navLabel: "Postdoc-Lebenslauf",
      heading: "Erstellen Sie einen Postdoc-Lebenslauf aus Ihrem Forschungsverzeichnis",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV stellt aus Ihrem offenen Forschungsverzeichnis einen aktuellen, mit formatierten Zitaten versehenen Lebenslauf zusammen — für Postdoc-, Fellowship- und Early-Career-Bewerbungen, bereit zum Auswählen und Exportieren.",
      bullets: [
        "Publikationen, Förderungen und Lehre aus ORCID und OpenAlex geholt — zugeordnet über Kennungen, niemals über den Namen.",
        "Einheitliche CSL-Zitate, exportiert als PDF, DOCX, LaTeX oder Markdown — halten Sie einen Lebenslauf aktuell für laufende Fristen.",
        "Kostenlos für Einzelpersonen und quelloffen; optionale, feldnormierte Metriken (standardmäßig keine, DORA-konform).",
      ],
      cta: "Postdoc-Lebenslauf erstellen",
      faq: [
        {
          q: "Kann ich einen Lebenslauf für viele Bewerbungen aktuell halten?",
          a: "Ja. SigmaCV erstellt aus einem kanonischen Verzeichnis, das sich aus den offenen Quellen neu synchronisiert, sodass Sie einmal aktualisieren und für jede Postdoc-, Fellowship- oder Stellenbewerbung eine maßgeschneiderte Version exportieren.",
        },
        {
          q: "Ist es kostenlos?",
          a: "Ja. SigmaCV ist für Einzelpersonen kostenlos und quelloffen unter der Apache-2.0-Lizenz und liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
  },
  "ja-JP": {
    "grad-school-cv": {
      metaTitle: "大学院出願 CV を、あなたの ORCID 記録から作成",
      metaDescription:
        "大学院出願用の学術 CV を作成します。SigmaCV は ORCID と OpenAlex からあなたの研究経験と論文（あれば）をまとめ、引用を整形して、PDF・DOCX・LaTeX・Markdown に書き出します。無料・オープンソース。",
      navLabel: "大学院出願 CV",
      heading: "大学院向けの学術 CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録から、引用が整形された洗練された CV を作成します——修士・博士・大学院への出願向けで、整理してそのまま書き出せます。",
      bullets: [
        "実際の記録から開始——論文・プレプリント・ポスターは ORCID と OpenAlex から識別子で取得し、名前では照合しません。",
        "任意の CSL スタイルで一貫した引用を、PDF・DOCX・LaTeX・Markdown に書き出し。",
        "個人には無料でオープンソース。入学審査委員会が見る内容はあなたが正確に選べます。",
      ],
      cta: "大学院出願 CV を作成",
      faq: [
        {
          q: "まだ論文がない場合はどうすればよいですか？",
          a: "出願段階ではそれが普通です。SigmaCV は、お持ちのプレプリントやポスターがあれば含めます。最も重視されるのは研究経験とスキルです——表示する内容はあなたが整理でき、DOI で業績を追加することもできます。",
        },
        {
          q: "無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "faculty-cv": {
      metaTitle: "ORCID と OpenAlex から作る教員・テニュア CV",
      metaDescription:
        "あなたの ORCID と OpenAlex の記録から教員・テニュア CV を作成します。SigmaCV が論文・助成・教育・サービスをまとめ、引用を整形して、PDF・DOCX・LaTeX・Markdown に書き出します。無料・オープンソース。",
      navLabel: "教員 CV",
      heading: "研究記録から教員・テニュア CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録から、引用が整形された網羅的な CV を作成します——教員職・テニュア・昇進ファイル向けで、整理してそのまま書き出せます。",
      bullets: [
        "論文・助成・教育・サービスを ORCID と OpenAlex から取得——名前ではなく識別子で照合します。",
        "PDF・DOCX・LaTeX・Markdown で一貫した CSL 引用。一つの正規 CV から、多数の助成機関レイアウトへ。",
        "個人には無料でオープンソース。オプトインのフィールド正規化メトリクス（デフォルトは非表示、DORA 準拠）。",
      ],
      cta: "教員 CV を作成",
      faq: [
        {
          q: "助成機関やテニュアの CV 形式も作れますか？",
          a: "はい。SigmaCV は主要な助成機関（NIH・NSF・ERC・UKRI R4RI・SNSF ほか）向けのワンクリックレイアウトを備え、同一の正規 CV に可逆的に適用します。そのため、作り直すことなくテニュアや助成用の CV を導けます。",
        },
        {
          q: "無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "research-cv": {
      metaTitle: "研究者 CV を ORCID と OpenAlex から自動作成",
      metaDescription:
        "あなたの ORCID と OpenAlex の記録から研究者 CV（研究者向け／学術 CV）を作成します。SigmaCV が引用を整形し、PDF・DOCX・LaTeX・Markdown・BibTeX に書き出します。無料・オープンソース。",
      navLabel: "研究者 CV",
      heading: "公開記録から研究者 CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録から、引用が整形された洗練された研究者 CV を作成します——識別子であなたに照合し、整理してそのまま書き出せます。",
      bullets: [
        "論文・データセット・ソフトウェアなどを ORCID と OpenAlex から取得——名前ではなく識別子で照合します。",
        "一貫した CSL 引用を PDF・DOCX・LaTeX・Markdown・BibTeX に書き出し。",
        "個人には無料でオープンソース。オプトインのフィールド正規化メトリクス（デフォルトは非表示、DORA 準拠）。",
      ],
      cta: "研究者 CV を作成",
      faq: [
        {
          q: "研究者 CV と履歴書（レジュメ）の違いは何ですか？",
          a: "研究者（学術）CV は、あなたの学術的業績——論文・助成・教育・サービス——の完全な記録で、時間とともに増えていきます。一方、履歴書（レジュメ）は、非学術職向けに調整された短い文書です。",
        },
        {
          q: "無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "phd-cv": {
      metaTitle: "博士課程出願 CV を、あなたの ORCID 記録から作成",
      metaDescription:
        "説得力のある博士課程出願用 CV を作成します。SigmaCV は ORCID と OpenAlex からあなたの研究経験と論文をまとめ、引用を整形して、PDF・DOCX・LaTeX・Markdown に書き出します。無料・オープンソース。",
      navLabel: "博士課程出願 CV",
      heading: "博士課程出願用の CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録から、引用が整形された洗練された CV を作成します——博士課程・博士プログラムへの出願に最適で、整理してそのまま書き出せます。",
      bullets: [
        "実際の記録から開始——論文・プレプリント・ポスターは ORCID と OpenAlex から識別子で取得し、名前では照合しません。",
        "任意の CSL スタイルで一貫した引用を、PDF・DOCX・LaTeX・Markdown に書き出し。",
        "個人には無料でオープンソース。審査委員会が見る内容はあなたが正確に選べます。",
      ],
      cta: "博士課程 CV を作成",
      faq: [
        {
          q: "博士課程出願 CV に論文は必要ですか？",
          a: "いいえ——この段階では研究経験・プロジェクト・スキルが最も重視されます。SigmaCV は、お持ちの論文・プレプリント・ポスターがあればすべて一貫した形式で含め、DOI で業績を追加することもできます。",
        },
        {
          q: "無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "postdoc-cv": {
      metaTitle: "ポスドク CV を ORCID と OpenAlex から自動作成",
      metaDescription:
        "あなたの ORCID と OpenAlex の記録からポスドク CV を作成します。SigmaCV が論文・助成・教育をまとめ、引用を整形して、PDF・DOCX・LaTeX・Markdown に書き出します。無料・オープンソース。",
      navLabel: "ポスドク CV",
      heading: "研究記録からポスドク CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録から、引用が整形された最新の CV を作成します——ポスドク・フェローシップ・若手研究者の求人への応募向けで、整理してそのまま書き出せます。",
      bullets: [
        "論文・助成・教育を ORCID と OpenAlex から取得——名前ではなく識別子で照合します。",
        "一貫した CSL 引用を PDF・DOCX・LaTeX・Markdown に書き出し——一つの CV を最新に保ち、随時の締切に対応できます。",
        "個人には無料でオープンソース。オプトインのフィールド正規化メトリクス（デフォルトは非表示、DORA 準拠）。",
      ],
      cta: "ポスドク CV を作成",
      faq: [
        {
          q: "一つの CV を多くの応募に使い回せますか？",
          a: "はい。SigmaCV はオープンソースから再同期される一つの正規記録から構築するため、一度更新すれば、ポスドク・フェローシップ・求人の応募ごとに合わせたバージョンを書き出せます。",
        },
        {
          q: "無料ですか？",
          a: "はい。SigmaCV は個人には無料で、Apache-2.0 ライセンスのオープンソースです。読み取るのは公開された研究メタデータのみです。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
  },
  "pt-BR": {
    "grad-school-cv": {
      metaTitle: "Currículo de mestrado e doutorado, criado a partir do seu registro do ORCID",
      metaDescription:
        "Crie um currículo acadêmico para candidaturas a mestrado e doutorado. O SigmaCV reúne sua experiência de pesquisa e quaisquer publicações do ORCID e do OpenAlex, formata as citações e exporta para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
      navLabel: "Currículo de mestrado e doutorado",
      heading: "Crie um currículo acadêmico para mestrado e doutorado",
      subhead:
        "Entre com o ORCID e o SigmaCV reúne um currículo limpo, com citações formatadas, a partir do seu registro de pesquisa aberto — para candidaturas a mestrado, doutorado e pós-graduação, pronto para curar e exportar.",
      bullets: [
        "Comece pelo seu registro real — quaisquer publicações, preprints e pôsteres extraídos do ORCID e do OpenAlex por identificador, nunca por nome.",
        "Citações consistentes em qualquer estilo CSL, exportadas para PDF, DOCX, LaTeX ou Markdown.",
        "Gratuito para indivíduos e de código aberto; você cura exatamente o que a comissão de seleção vê.",
      ],
      cta: "Crie seu currículo de mestrado e doutorado",
      faq: [
        {
          q: "E se eu ainda não tiver publicações?",
          a: "Isso é normal na etapa de candidatura. O SigmaCV inclui quaisquer preprints ou pôsteres que você tenha, e sua experiência de pesquisa e competências têm o maior peso — você cura o que aparece e pode adicionar trabalhos por DOI.",
        },
        {
          q: "É gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0, e lê apenas metadados públicos de pesquisa.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "Currículo de docente e efetivação a partir do ORCID e do OpenAlex",
      metaDescription:
        "Crie um currículo de docente ou de efetivação a partir do seu registro do ORCID e do OpenAlex. O SigmaCV reúne publicações, financiamentos, atividade docente e serviços, formata as citações e exporta para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
      navLabel: "Currículo de docente",
      heading: "Crie um currículo de docente ou de efetivação a partir do seu registro de pesquisa",
      subhead:
        "Entre com o ORCID e o SigmaCV reúne um currículo abrangente, com citações formatadas, a partir do seu registro de pesquisa aberto — para vagas docentes, processos de efetivação e de promoção, pronto para curar e exportar.",
      bullets: [
        "Publicações, financiamentos, atividade docente e serviços extraídos do ORCID e do OpenAlex — correspondidos por identificador, nunca por nome.",
        "Citações CSL consistentes em PDF, DOCX, LaTeX e Markdown; um único currículo canônico, muitos layouts de financiador.",
        "Gratuito para indivíduos e de código aberto; métricas opcionais e normalizadas por campo (nenhuma por padrão, alinhado ao DORA).",
      ],
      cta: "Crie seu currículo de docente",
      faq: [
        {
          q: "Ele consegue produzir formatos de currículo de financiadores e de efetivação?",
          a: "Sim. O SigmaCV tem layouts em um clique para os principais financiadores (NIH, NSF, ERC, UKRI R4RI, SNSF e mais), aplicados de forma reversível ao mesmo currículo canônico, para que você derive um currículo de efetivação ou de financiamento sem reconstruí-lo.",
        },
        {
          q: "É gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0, e lê apenas metadados públicos de pesquisa.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "research-cv": {
      metaTitle: "Currículo de pesquisador, criado automaticamente a partir do ORCID e do OpenAlex",
      metaDescription:
        "Crie um currículo de pesquisador (currículo científico ou acadêmico) a partir do seu registro do ORCID e do OpenAlex. O SigmaCV formata as citações e exporta para PDF, DOCX, LaTeX, Markdown ou BibTeX. Gratuito e de código aberto.",
      navLabel: "Currículo de pesquisador",
      heading: "Crie um currículo de pesquisador a partir do registro aberto",
      subhead:
        "Entre com o ORCID e o SigmaCV reúne um currículo de pesquisador limpo, com citações formatadas, a partir do seu registro de pesquisa aberto — correspondido a você por identificador, pronto para curar e exportar.",
      bullets: [
        "Publicações, conjuntos de dados, software e mais extraídos do ORCID e do OpenAlex — correspondidos por identificador, nunca por nome.",
        "Citações CSL consistentes exportadas para PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        "Gratuito para indivíduos e de código aberto; métricas opcionais e normalizadas por campo (nenhuma por padrão, alinhado ao DORA).",
      ],
      cta: "Crie seu currículo de pesquisador",
      faq: [
        {
          q: "Qual é a diferença entre um currículo de pesquisador e um currículo profissional?",
          a: "Um currículo de pesquisador (acadêmico) é um registro completo do seu trabalho acadêmico — publicações, financiamentos, atividade docente, serviços — e cresce ao longo do tempo; um currículo profissional é um documento curto e adaptado para funções fora da academia.",
        },
        {
          q: "É gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0, e lê apenas metadados públicos de pesquisa.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "phd-cv": {
      metaTitle: "Currículo para candidatura ao doutorado, criado a partir do seu registro ORCID",
      metaDescription:
        "Crie um currículo forte para candidatura ao doutorado. O SigmaCV reúne sua experiência de pesquisa e suas publicações do ORCID e do OpenAlex, formata as citações e exporta para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
      navLabel: "Currículo para candidatura ao doutorado",
      heading: "Crie um currículo para sua candidatura ao doutorado",
      subhead:
        "Entre com o ORCID e o SigmaCV reúne um currículo limpo, com citações formatadas, a partir do seu registro de pesquisa aberto — ideal para candidaturas a doutorados e programas de pós-graduação, pronto para curar e exportar.",
      bullets: [
        "Comece a partir do seu registro real — publicações, preprints e pôsteres extraídos do ORCID e do OpenAlex por identificador, nunca por nome.",
        "Citações consistentes em qualquer estilo CSL, exportadas para PDF, DOCX, LaTeX ou Markdown.",
        "Gratuito para indivíduos e de código aberto; você decide exatamente o que a comissão vê.",
      ],
      cta: "Crie seu currículo de doutorado",
      faq: [
        {
          q: "Preciso ter publicações para um currículo de candidatura ao doutorado?",
          a: "Não — nesta etapa, o que mais conta é a experiência de pesquisa, os projetos e as competências. O SigmaCV inclui quaisquer publicações, preprints ou pôsteres que você já tenha, formatados de maneira consistente, e você pode adicionar trabalhos por DOI.",
        },
        {
          q: "É gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0, e lê apenas metadados públicos de pesquisa.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "Currículo de pós-doc, criado automaticamente a partir do ORCID e do OpenAlex",
      metaDescription:
        "Crie um currículo de pós-doc a partir do seu registro do ORCID e do OpenAlex. O SigmaCV reúne suas publicações, financiamentos e atividade docente, formata as citações e exporta para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
      navLabel: "Currículo de pós-doc",
      heading: "Crie um currículo de pós-doc a partir do seu registro de pesquisa",
      subhead:
        "Entre com o ORCID e o SigmaCV reúne um currículo atualizado, com citações formatadas, a partir do seu registro de pesquisa aberto — para candidaturas a pós-doc, bolsas e empregos em início de carreira, pronto para curar e exportar.",
      bullets: [
        "Publicações, financiamentos e atividade docente extraídos do ORCID e do OpenAlex — correspondidos por identificador, nunca por nome.",
        "Citações CSL consistentes exportadas para PDF, DOCX, LaTeX ou Markdown — mantenha um único currículo atualizado para prazos contínuos.",
        "Gratuito para indivíduos e de código aberto; métricas opcionais e normalizadas por campo (nenhuma por padrão, alinhado ao DORA).",
      ],
      cta: "Crie seu currículo de pós-doc",
      faq: [
        {
          q: "Posso manter um único currículo atualizado para muitas candidaturas?",
          a: "Sim. O SigmaCV é montado a partir de um único registro canônico que se ressincroniza com as fontes abertas, então você atualiza uma vez e exporta uma versão adaptada para cada candidatura a pós-doc, bolsa ou emprego.",
        },
        {
          q: "É gratuito?",
          a: "Sim. O SigmaCV é gratuito para indivíduos e de código aberto sob a licença Apache-2.0, e lê apenas metadados públicos de pesquisa.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
  },
  "it-IT": {
    "grad-school-cv": {
      metaTitle: "CV per la laurea magistrale o il dottorato, creato dal tuo registro ORCID",
      metaDescription:
        "Crea un CV accademico per le candidature alla laurea magistrale o al dottorato. SigmaCV riunisce la tua esperienza di ricerca ed eventuali pubblicazioni da ORCID e OpenAlex, formatta le citazioni ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
      navLabel: "CV per la laurea magistrale o il dottorato",
      heading: "Crea un CV accademico per la laurea magistrale o il dottorato",
      subhead:
        "Accedi con ORCID e SigmaCV riunisce un CV curato, con citazioni formattate, a partire dal tuo registro di ricerca aperto — per le candidature a corsi di laurea magistrale, dottorato e PhD, pronto da selezionare ed esportare.",
      bullets: [
        "Parti dal tuo registro reale — pubblicazioni, preprint e poster recuperati da ORCID e OpenAlex tramite identificativo, mai tramite il nome.",
        "Citazioni coerenti in qualsiasi stile CSL, esportate in PDF, DOCX, LaTeX o Markdown.",
        "Gratuito per i singoli individui e open source; decidi tu esattamente cosa vede la commissione di ammissione.",
      ],
      cta: "Crea il tuo CV per la laurea magistrale o il dottorato",
      faq: [
        {
          q: "E se non ho ancora pubblicazioni?",
          a: "È normale nella fase di candidatura. SigmaCV include eventuali preprint o poster che hai, e la tua esperienza di ricerca e le tue competenze pesano di più — decidi tu cosa appare e puoi aggiungere lavori tramite DOI.",
        },
        {
          q: "È gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "CV da docente e per il ruolo da ORCID e OpenAlex",
      metaDescription:
        "Crea un CV da docente o per il ruolo a partire dal tuo registro ORCID e OpenAlex. SigmaCV riunisce pubblicazioni, finanziamenti, attività didattica e di servizio, formatta le citazioni ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
      navLabel: "CV da docente",
      heading: "Crea un CV da docente o per il ruolo a partire dal tuo registro di ricerca",
      subhead:
        "Accedi con ORCID e SigmaCV riunisce un CV completo, con citazioni formattate, a partire dal tuo registro di ricerca aperto — per candidature a posizioni da docente, fascicoli per il ruolo e la promozione, pronto da selezionare ed esportare.",
      bullets: [
        "Pubblicazioni, finanziamenti, attività didattica e di servizio recuperati da ORCID e OpenAlex — abbinati tramite identificativo, mai tramite il nome.",
        "Citazioni CSL coerenti in PDF, DOCX, LaTeX e Markdown; un unico CV canonico, molte strutture di enti finanziatori.",
        "Gratuito per i singoli individui e open source; metriche opzionali e normalizzate per campo (nessuna per impostazione predefinita, in linea con DORA).",
      ],
      cta: "Crea il tuo CV da docente",
      faq: [
        {
          q: "Può produrre i formati di CV per gli enti finanziatori e per il ruolo?",
          a: "Sì. SigmaCV dispone di strutture in un clic per i principali enti finanziatori (NIH, NSF, ERC, UKRI R4RI, SNSF e altri), applicate in modo reversibile allo stesso CV canonico, così puoi ricavare un CV per il ruolo o per un finanziamento senza ricostruirlo.",
        },
        {
          q: "È gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "research-cv": {
      metaTitle: "CV da ricercatore, creato automaticamente da ORCID e OpenAlex",
      metaDescription:
        "Crea un CV da ricercatore (CV scientifico) a partire dal tuo registro ORCID e OpenAlex. SigmaCV formatta le citazioni ed esporta in PDF, DOCX, LaTeX, Markdown o BibTeX. Gratuito e open source.",
      navLabel: "CV da ricercatore",
      heading: "Crea un CV da ricercatore a partire dal registro aperto",
      subhead:
        "Accedi con ORCID e SigmaCV riunisce un CV da ricercatore curato, con citazioni formattate, a partire dal tuo registro di ricerca aperto — abbinato a te tramite identificativo, pronto da selezionare ed esportare.",
      bullets: [
        "Pubblicazioni, dataset, software e altro recuperati da ORCID e OpenAlex — abbinati tramite identificativo, mai tramite il nome.",
        "Citazioni CSL coerenti esportate in PDF, DOCX, LaTeX, Markdown o BibTeX.",
        "Gratuito per i singoli individui e open source; metriche opzionali e normalizzate per campo (nessuna per impostazione predefinita, in linea con DORA).",
      ],
      cta: "Crea il tuo CV da ricercatore",
      faq: [
        {
          q: "Qual è la differenza tra un CV da ricercatore e un résumé?",
          a: "Un CV da ricercatore (accademico) è un registro completo del tuo lavoro scientifico — pubblicazioni, finanziamenti, attività didattica, servizio — e cresce nel tempo; un résumé è un documento breve e mirato per ruoli non accademici.",
        },
        {
          q: "È gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "phd-cv": {
      metaTitle: "CV per la candidatura al dottorato, creato dal tuo registro ORCID",
      metaDescription:
        "Crea un CV solido per la candidatura al dottorato. SigmaCV riunisce la tua esperienza di ricerca e le tue pubblicazioni da ORCID e OpenAlex, formatta le citazioni ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
      navLabel: "CV per la candidatura al dottorato",
      heading: "Crea un CV per la tua candidatura al dottorato",
      subhead:
        "Accedi con ORCID e SigmaCV riunisce un CV curato, con citazioni formattate, a partire dal tuo registro di ricerca aperto — ideale per le candidature a programmi di dottorato e PhD, pronto da selezionare ed esportare.",
      bullets: [
        "Parti dal tuo registro reale — pubblicazioni, preprint e poster recuperati da ORCID e OpenAlex tramite identificativo, mai tramite il nome.",
        "Citazioni coerenti in qualsiasi stile CSL, esportate in PDF, DOCX, LaTeX o Markdown.",
        "Gratuito per i singoli individui e open source; decidi tu esattamente cosa vede la commissione.",
      ],
      cta: "Crea il tuo CV per il dottorato",
      faq: [
        {
          q: "Mi servono delle pubblicazioni per un CV di candidatura al dottorato?",
          a: "No — in questa fase contano soprattutto l'esperienza di ricerca, i progetti e le competenze. SigmaCV include eventuali pubblicazioni, preprint o poster che hai, formattati in modo coerente, e puoi aggiungere lavori tramite DOI.",
        },
        {
          q: "È gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "CV per postdoc, creato automaticamente da ORCID e OpenAlex",
      metaDescription:
        "Crea un CV per postdoc dal tuo registro ORCID e OpenAlex. SigmaCV riunisce le tue pubblicazioni, i finanziamenti e l'attività didattica, formatta le citazioni ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
      navLabel: "CV per postdoc",
      heading: "Crea un CV per postdoc dal tuo registro di ricerca",
      subhead:
        "Accedi con ORCID e SigmaCV riunisce un CV aggiornato, con citazioni formattate, a partire dal tuo registro di ricerca aperto — per candidature a posizioni postdoc, borse e lavori a inizio carriera, pronto da selezionare ed esportare.",
      bullets: [
        "Pubblicazioni, finanziamenti e attività didattica recuperati da ORCID e OpenAlex — abbinati tramite identificativo, mai tramite il nome.",
        "Citazioni CSL coerenti esportate in PDF, DOCX, LaTeX o Markdown — mantieni un unico CV aggiornato per le scadenze continue.",
        "Gratuito per i singoli individui e open source; metriche opzionali e normalizzate per campo (nessuna per impostazione predefinita, in linea con DORA).",
      ],
      cta: "Crea il tuo CV per postdoc",
      faq: [
        {
          q: "Posso mantenere un unico CV aggiornato per molte candidature?",
          a: "Sì. SigmaCV parte da un unico registro canonico che si risincronizza dalle fonti aperte, così aggiorni una volta sola ed esporti una versione su misura per ogni candidatura a una posizione postdoc, a una borsa o a un lavoro.",
        },
        {
          q: "È gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0. Legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
  },
  "ko-KR": {
    "grad-school-cv": {
      metaTitle: "ORCID 기록으로 만드는 대학원 지원 이력서",
      metaDescription:
        "대학원 지원용 학술 이력서를 만드세요. SigmaCV는 ORCID와 OpenAlex에서 회원님의 연구 경험과 논문을 모아 인용을 서식화하고 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "대학원 지원 이력서",
      heading: "대학원 지원용 학술 이력서 만들기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 인용이 서식화된 깔끔한 이력서를 만들어 드립니다. 석사, 박사, 대학원 지원에 적합하며, 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "실제 기록에서 시작하세요 — 논문, 프리프린트, 포스터를 ORCID와 OpenAlex에서 이름이 아니라 식별자로 가져옵니다.",
        "어떤 CSL 스타일로도 일관된 인용을 제공하며 PDF, DOCX, LaTeX, Markdown으로 내보냅니다.",
        "개인에게 무료이며 오픈 소스입니다. 입학 심사위원회에 무엇을 보여줄지 정확히 회원님이 선별합니다.",
      ],
      cta: "대학원 지원 이력서 만들기",
      faq: [
        {
          q: "아직 논문이 없으면 어떻게 하나요?",
          a: "지원 단계에서는 흔한 일입니다. SigmaCV는 회원님이 가진 프리프린트나 포스터를 포함하며, 연구 경험과 역량이 가장 큰 비중을 차지합니다 — 무엇이 표시될지 회원님이 선별하고, DOI로 업적을 추가할 수도 있습니다.",
        },
        {
          q: "무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 공개된 연구 메타데이터만 읽습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "faculty-cv": {
      metaTitle: "ORCID와 OpenAlex로 만드는 교수·정년심사 이력서",
      metaDescription:
        "ORCID와 OpenAlex 기록으로 교수 또는 정년심사 이력서를 만드세요. SigmaCV는 논문, 연구비, 강의, 봉사를 모아 인용을 서식화하고 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "교수 이력서",
      heading: "연구 기록으로 교수·정년심사 이력서 만들기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 인용이 서식화된 포괄적인 이력서를 만들어 드립니다. 교수 채용, 정년심사, 승진 서류에 적합하며, 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "논문, 연구비, 강의, 봉사를 ORCID와 OpenAlex에서 가져옵니다 — 이름이 아니라 식별자로 매칭합니다.",
        "PDF, DOCX, LaTeX, Markdown 전반에 일관된 CSL 인용을 제공하며, 하나의 정규 이력서로 다양한 지원기관 레이아웃을 만듭니다.",
        "개인에게 무료이며 오픈 소스입니다. 옵트인 방식의 필드 정규화 지표를 제공합니다(기본값 미표시, DORA에 부합).",
      ],
      cta: "교수 이력서 만들기",
      faq: [
        {
          q: "지원기관 및 정년심사 이력서 형식을 만들 수 있나요?",
          a: "네. SigmaCV는 주요 지원기관(NIH, NSF, ERC, UKRI R4RI, SNSF 등)을 위한 원클릭 레이아웃을 제공하며, 동일한 정규 이력서에 가역적으로 적용됩니다. 따라서 처음부터 다시 만들지 않고도 정년심사용 또는 연구비 지원용 이력서를 만들 수 있습니다.",
        },
        {
          q: "무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 공개된 연구 메타데이터만 읽습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "research-cv": {
      metaTitle: "ORCID와 OpenAlex로 자동 생성하는 연구자 CV",
      metaDescription:
        "ORCID와 OpenAlex 기록으로 연구자 CV(연구·학술 CV)를 만드세요. SigmaCV가 인용을 서식화하고 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "연구자 CV",
      heading: "공개 기록으로 연구자 CV 만들기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 인용이 서식화된 깔끔한 연구자 CV를 만들어 드립니다 — 식별자로 매칭하며, 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "논문, 데이터셋, 소프트웨어 등을 ORCID와 OpenAlex에서 가져옵니다 — 이름이 아니라 식별자로 매칭합니다.",
        "일관된 CSL 인용을 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보냅니다.",
        "개인에게 무료이며 오픈 소스입니다. 옵트인 방식의 필드 정규화 지표를 제공합니다(기본값 미표시, DORA에 부합).",
      ],
      cta: "연구자 CV 만들기",
      faq: [
        {
          q: "연구자 CV와 일반 이력서(résumé)는 무엇이 다른가요?",
          a: "연구자(학술) CV는 논문, 연구비, 강의, 봉사 등 회원님의 학술 업적 전체를 담은 기록으로 시간이 지나며 늘어납니다. 일반 이력서(résumé)는 비학술 직무를 위해 짧게 맞춤 작성한 문서입니다.",
        },
        {
          q: "무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 공개된 연구 메타데이터만 읽습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "phd-cv": {
      metaTitle: "ORCID 기록으로 만드는 박사과정 지원 이력서",
      metaDescription:
        "탄탄한 박사과정 지원 이력서를 만드세요. SigmaCV는 ORCID와 OpenAlex에서 회원님의 연구 경험과 논문을 모아 인용을 서식화하고 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "박사과정 지원 이력서",
      heading: "박사과정 지원용 이력서 만들기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 인용이 서식화된 깔끔한 이력서를 만들어 드립니다. 박사 및 박사과정 프로그램 지원에 이상적이며, 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "실제 기록에서 시작하세요 — 논문, 프리프린트, 포스터를 ORCID와 OpenAlex에서 이름이 아니라 식별자로 가져옵니다.",
        "어떤 CSL 스타일로도 일관된 인용을 제공하며 PDF, DOCX, LaTeX, Markdown으로 내보냅니다.",
        "개인에게 무료이며 오픈 소스입니다. 심사위원에게 무엇을 보여줄지 정확히 회원님이 선별합니다.",
      ],
      cta: "박사과정 이력서 만들기",
      faq: [
        {
          q: "박사과정 지원 이력서에 논문이 꼭 있어야 하나요?",
          a: "아니요 — 이 단계에서는 연구 경험, 프로젝트, 역량이 가장 중요합니다. SigmaCV는 회원님이 가진 논문, 프리프린트, 포스터를 일관되게 서식화해 포함하며, DOI로 업적을 추가할 수도 있습니다.",
        },
        {
          q: "무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 공개된 연구 메타데이터만 읽습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "postdoc-cv": {
      metaTitle: "ORCID와 OpenAlex로 자동 생성하는 박사후연구원 이력서",
      metaDescription:
        "ORCID와 OpenAlex 기록으로 박사후연구원 이력서를 만드세요. SigmaCV는 회원님의 논문, 연구비, 강의를 모아 인용을 서식화하고 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "박사후연구원 이력서",
      heading: "연구 기록으로 박사후연구원 이력서 만들기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 바탕으로 인용이 서식화된 최신 이력서를 만들어 드립니다. 박사후연구원, 펠로십, 초기 경력 채용 지원에 적합하며, 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "논문, 연구비, 강의를 ORCID와 OpenAlex에서 가져옵니다 — 이름이 아니라 식별자로 매칭합니다.",
        "일관된 CSL 인용을 PDF, DOCX, LaTeX, Markdown으로 내보냅니다 — 수시 마감에 대비해 하나의 이력서를 최신으로 유지하세요.",
        "개인에게 무료이며 오픈 소스입니다. 옵트인 방식의 필드 정규화 지표를 제공합니다(기본값 미표시, DORA에 부합).",
      ],
      cta: "박사후연구원 이력서 만들기",
      faq: [
        {
          q: "여러 지원에 하나의 이력서를 최신으로 유지할 수 있나요?",
          a: "네. SigmaCV는 공개 출처에서 다시 동기화되는 하나의 정규 기록으로 만들어지므로, 한 번 갱신한 뒤 각 박사후연구원, 펠로십, 채용 지원에 맞춘 버전을 내보낼 수 있습니다.",
        },
        {
          q: "무료인가요?",
          a: "네. SigmaCV는 개인에게 무료이며 Apache-2.0 라이선스의 오픈 소스입니다. 공개된 연구 메타데이터만 읽습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
  },
  "ru-RU": {
    "grad-school-cv": {
      metaTitle: "Резюме для аспирантуры из вашей записи ORCID",
      metaDescription:
        "Создайте академическое резюме для поступления в магистратуру или аспирантуру. SigmaCV собирает ваш научный опыт и любые публикации из ORCID и OpenAlex, форматирует ссылки и экспортирует в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым исходным кодом.",
      navLabel: "Резюме для аспирантуры",
      heading: "Создайте академическое резюме для аспирантуры",
      subhead:
        "Войдите через ORCID, и SigmaCV соберёт аккуратное резюме с отформатированными ссылками из вашей открытой научной записи — для поступления в магистратуру, аспирантуру и на программы последипломного образования, готовое к отбору и экспорту.",
      bullets: [
        "Начните с вашей реальной записи — любые публикации, препринты и постеры извлекаются из ORCID и OpenAlex по идентификатору, а не по имени.",
        "Единообразные ссылки в любом стиле CSL, экспортируемые в PDF, DOCX, LaTeX или Markdown.",
        "Бесплатно для частных лиц и с открытым исходным кодом; вы сами отбираете ровно то, что увидит приёмная комиссия.",
      ],
      cta: "Создайте резюме для аспирантуры",
      faq: [
        {
          q: "А если у меня пока нет публикаций?",
          a: "На этапе поступления это нормально. SigmaCV включает любые ваши препринты или постеры, а наибольший вес имеют ваш научный опыт и навыки — вы сами отбираете то, что отображается, и можете добавить работу по DOI.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код под лицензией Apache-2.0, а считывает только публичные научные метаданные.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "faculty-cv": {
      metaTitle: "Резюме преподавателя из ORCID и OpenAlex",
      metaDescription:
        "Создайте резюме преподавателя или на постоянную позицию из вашей записи ORCID и OpenAlex. SigmaCV собирает публикации, гранты, преподавание и общественную работу, форматирует ссылки и экспортирует в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым исходным кодом.",
      navLabel: "Резюме преподавателя",
      heading: "Создайте резюме преподавателя или на постоянную позицию из вашей научной записи",
      subhead:
        "Войдите через ORCID, и SigmaCV соберёт исчерпывающее резюме с отформатированными ссылками из вашей открытой научной записи — для заявок на преподавательские должности, постоянную позицию и продвижение, готовое к отбору и экспорту.",
      bullets: [
        "Публикации, гранты, преподавание и общественная работа извлекаются из ORCID и OpenAlex — сопоставляются по идентификатору, а не по имени.",
        "Единообразные ссылки CSL в PDF, DOCX, LaTeX и Markdown; одно каноническое резюме, множество макетов грантодателей.",
        "Бесплатно для частных лиц и с открытым исходным кодом; подключаемые по желанию, нормированные по области метрики (по умолчанию отключены, в соответствии с DORA).",
      ],
      cta: "Создайте резюме преподавателя",
      faq: [
        {
          q: "Может ли сервис создавать форматы резюме для грантодателей и на постоянную позицию?",
          a: "Да. SigmaCV предлагает макеты в один щелчок для крупных грантодателей (NIH, NSF, ERC, UKRI R4RI, SNSF и других), применяемые обратимо к одному и тому же каноническому резюме, так что вы можете получить резюме для постоянной позиции или гранта, не пересобирая его.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код под лицензией Apache-2.0, а считывает только публичные научные метаданные.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "research-cv": {
      metaTitle: "Резюме исследователя, авто-собранное из ORCID и OpenAlex",
      metaDescription:
        "Создайте резюме исследователя (научное резюме) из вашей записи ORCID и OpenAlex. SigmaCV форматирует ссылки и экспортирует в PDF, DOCX, LaTeX, Markdown или BibTeX. Бесплатно и с открытым исходным кодом.",
      navLabel: "Резюме исследователя",
      heading: "Создайте резюме исследователя из открытой записи",
      subhead:
        "Войдите через ORCID, и SigmaCV соберёт аккуратное резюме исследователя с отформатированными ссылками из вашей открытой научной записи — сопоставленное с вами по идентификатору, готовое к отбору и экспорту.",
      bullets: [
        "Публикации, наборы данных, программное обеспечение и многое другое извлекаются из ORCID и OpenAlex — сопоставляются по идентификатору, а не по имени.",
        "Единообразные ссылки CSL, экспортируемые в PDF, DOCX, LaTeX, Markdown или BibTeX.",
        "Бесплатно для частных лиц и с открытым исходным кодом; подключаемые по желанию, нормированные по области метрики (по умолчанию отключены, в соответствии с DORA).",
      ],
      cta: "Создайте резюме исследователя",
      faq: [
        {
          q: "В чём разница между резюме исследователя и обычным резюме (CV vs. résumé)?",
          a: "Резюме исследователя (академическое резюме) — это полная запись вашей научной работы — публикации, финансирование, преподавание, общественная работа — и оно растёт со временем; обычное résumé — это короткий, адаптированный документ для неакадемических ролей.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код под лицензией Apache-2.0, а считывает только публичные научные метаданные.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "phd-cv": {
      metaTitle: "Резюме для поступления в аспирантуру на основе вашей записи ORCID",
      metaDescription:
        "Создайте убедительное резюме для поступления в аспирантуру. SigmaCV собирает ваш научный опыт и публикации из ORCID и OpenAlex, форматирует ссылки и экспортирует в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым исходным кодом.",
      navLabel: "Резюме для аспирантуры",
      heading: "Создайте резюме для поступления в аспирантуру",
      subhead:
        "Войдите через ORCID, и SigmaCV соберёт аккуратное резюме с отформатированными ссылками из ваших открытых научных записей — идеально для поступления в аспирантуру и на докторские программы, готовое к отбору и экспорту.",
      bullets: [
        "Начните с реального профиля — публикации, препринты и постеры извлекаются из ORCID и OpenAlex по идентификатору, никогда по имени.",
        "Единообразные ссылки в любом стиле CSL, экспорт в PDF, DOCX, LaTeX или Markdown.",
        "Бесплатно для частных лиц и с открытым исходным кодом; вы сами решаете, что увидит комиссия.",
      ],
      cta: "Создать резюме для аспирантуры",
      faq: [
        {
          q: "Нужны ли публикации для резюме при поступлении в аспирантуру?",
          a: "Нет — на этом этапе важнее всего научный опыт, проекты и навыки. SigmaCV включает любые ваши публикации, препринты или постеры, единообразно отформатированные, и вы можете добавить работу по DOI.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код по лицензии Apache-2.0. Он считывает только публичные метаданные исследований.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "postdoc-cv": {
      metaTitle: "Резюме постдока, автоматически собранное из ORCID и OpenAlex",
      metaDescription:
        "Создайте резюме постдока из ваших записей в ORCID и OpenAlex. SigmaCV собирает ваши публикации, гранты и преподавание, форматирует ссылки и экспортирует в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым исходным кодом.",
      navLabel: "Резюме постдока",
      heading: "Создайте резюме постдока из ваших научных записей",
      subhead:
        "Войдите через ORCID, и SigmaCV соберёт актуальное резюме с отформатированными ссылками из ваших открытых научных записей — для заявок на постдок, стипендии и должности на ранней стадии карьеры, готовое к отбору и экспорту.",
      bullets: [
        "Публикации, гранты и преподавание извлекаются из ORCID и OpenAlex — сопоставление по идентификатору, никогда по имени.",
        "Единообразные CSL-ссылки, экспортируемые в PDF, DOCX, LaTeX или Markdown — держите одно резюме актуальным для скользящих дедлайнов.",
        "Бесплатно для частных лиц и с открытым исходным кодом; подключаемые, нормированные по области метрики (по умолчанию нет, в соответствии с DORA).",
      ],
      cta: "Создать резюме постдока",
      faq: [
        {
          q: "Можно ли держать одно резюме актуальным для многих заявок?",
          a: "Да. SigmaCV строится из одной канонической записи, которая повторно синхронизируется с открытыми источниками, поэтому вы обновляете её один раз и экспортируете адаптированную версию под каждую заявку на постдок, стипендию или должность.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код по лицензии Apache-2.0. Он считывает только публичные метаданные исследований.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
  },
};

const PERSONA_CONTENT_I18N: Record<Locale, Record<PersonaPageId, LandingPageContent>> = {
  "en-US": {
    "grad-school-cv": {
      intro: [
        "A strong academic CV helps your master's, PhD or grad-school application stand out — but a blank template is a slow way to build one. SigmaCV assembles a clean, citation-formatted CV from your open research record, so you start from your real work: any publications, preprints, posters and research projects.",
        "Your work is matched to you by your ORCID iD, not your name, and you curate exactly what the admissions committee sees. It is free and open source, and the same CV exports to PDF, Word, LaTeX or Markdown.",
      ],
      stepsHeading: "How to build a grad-school CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "SigmaCV reads only your public ORCID record — no blank form to fill.",
        },
        {
          title: "Your record fills in",
          body: "Any publications, preprints and posters are pulled from ORCID and OpenAlex and formatted; add anything missing by DOI.",
        },
        {
          title: "Lead with research experience",
          body: "Foreground projects, methods and skills, and choose which items appear for the programme you are applying to.",
        },
        {
          title: "Style and export",
          body: "Pick a citation style and template, then export to PDF, DOCX, LaTeX or Markdown.",
        },
      ],
      whyHeading: "Why build your grad-school CV with SigmaCV",
      why: [
        "At the application stage your record is small, so accuracy and clean presentation matter more than length. SigmaCV formats your early outputs properly and keeps everything consistent, so a poster or a first preprint reads well rather than awkwardly.",
        "It is free for individuals and open source, reads only public metadata, and never invents anything: you decide exactly what the committee sees, and the same canonical CV exports to every format.",
      ],
      faqExtra: [
        {
          q: "How long should a grad-school CV be?",
          a: "Usually about 2–4 pages. Clear research experience and a few representative outputs beat padding.",
        },
        {
          q: "What should I include if I'm early in my studies?",
          a: "Education, research experience and projects, any publications/preprints/posters, relevant skills, awards and references — lead with what shows research potential.",
        },
        {
          q: "Can I add a paper that isn't on my ORCID yet?",
          a: "Yes — add any work by its DOI and SigmaCV formats it to match the rest of your CV.",
        },
      ],
      relatedHeading: "Related ways to build your CV",
    },
    "faculty-cv": {
      intro: [
        "A faculty or tenure CV is long and comprehensive — publications, grants, teaching, supervision and service — and keeping it current across job, tenure and promotion files is real work. SigmaCV assembles it from your open research record and keeps one canonical version you can reshape for each purpose.",
        "Your work is matched by your ORCID / OpenAlex identifier, not your name, citations are formatted consistently through CSL, and metrics stay off by default and field-normalized when you opt in — aligned with DORA. It is free and open source.",
      ],
      stepsHeading: "How to build a faculty CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "SigmaCV reads your public ORCID and OpenAlex record — no manual list-keeping.",
        },
        {
          title: "Your full record assembles",
          body: "Publications, grants, teaching and service are pulled in and formatted; add anything missing by DOI.",
        },
        {
          title: "Apply a layout for the purpose",
          body: "Switch between a full CV, a funder format (NIH, ERC, UKRI…) or a trimmed version — reversibly, from one record.",
        },
        {
          title: "Style and export",
          body: "Pick a citation style, optionally show field-normalized metrics, and export to PDF, DOCX, LaTeX or Markdown.",
        },
      ],
      whyHeading: "Why build your faculty CV with SigmaCV",
      why: [
        "Senior CVs are large and constantly out of date. SigmaCV separates your record from its presentation: keep one canonical CV that re-syncs from the open record, and reshape it — section order, funder layout, which works appear — without rebuilding it for every committee.",
        "It is free for individuals and open source, matches work by identifier, and treats metrics responsibly: off by default, opt-in, and field-normalized over raw counts, never a journal Impact Factor — in line with DORA.",
      ],
      faqExtra: [
        {
          q: "Does it handle a long publication list?",
          a: "Yes. Publications are pulled in automatically and formatted consistently; you group, order and curate them, and the same list exports to every format.",
        },
        {
          q: "Can I keep one CV and derive funder versions?",
          a: "Yes — one canonical CV, with one-click funder/tenure layouts applied reversibly, so you don't maintain several copies.",
        },
        {
          q: "Are metrics shown by default?",
          a: "No. Metrics are off by default and opt-in; when enabled, SigmaCV prefers field-normalized indicators and never shows a journal Impact Factor.",
        },
      ],
      relatedHeading: "Related CV tools and formats",
    },
    "research-cv": {
      intro: [
        "A research CV — also called a researcher or scientific CV — is the complete record of your scholarly work. SigmaCV builds one from your open research record, so your publications, datasets, software and academic history are assembled and formatted automatically rather than typed by hand.",
        "Your work is matched to you by your ORCID / OpenAlex identifier, not your name, citations are formatted consistently through CSL, and you curate exactly what appears. It is free and open source, and the same CV exports to every format.",
      ],
      stepsHeading: "How to build a research CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "SigmaCV reads your public ORCID and OpenAlex record — no copy-pasting.",
        },
        {
          title: "Your record assembles",
          body: "Publications, datasets, software and your academic history are pulled in and formatted; add anything missing by DOI.",
        },
        {
          title: "Curate and style",
          body: "Choose which work appears, pick a citation style and template, and (optionally) switch on field-normalized metrics.",
        },
        {
          title: "Export or publish",
          body: "Export to PDF, DOCX, LaTeX, Markdown or BibTeX — or publish a living public page that re-syncs.",
        },
      ],
      whyHeading: "Why build your research CV with SigmaCV",
      why: [
        "A research CV should reflect the full breadth of your scholarship accurately. SigmaCV pulls your work by identifier — so common and non-Latin-script names resolve correctly — formats every citation through one engine, and keeps your own name highlighted in author lists.",
        "It is free for individuals and open source, reads only public metadata, and treats metrics responsibly: off by default, opt-in, and field-normalized over raw counts, in line with DORA.",
      ],
      faqExtra: [
        {
          q: "Does it include datasets and software, not just papers?",
          a: "Yes. Where available, SigmaCV pulls datasets and software (via DataCite / OpenAIRE) alongside your publications, so your research CV reflects all your outputs.",
        },
        {
          q: "Can I publish my research CV online?",
          a: "Yes — you can publish a living, machine-readable public page that re-syncs from the open record, with per-field consent over what is shown.",
        },
        {
          q: "Can I export to BibTeX?",
          a: "Yes — alongside PDF, DOCX, LaTeX and Markdown, SigmaCV exports your curated publications as BibTeX and CSL-JSON.",
        },
      ],
      relatedHeading: "Related CV tools and formats",
    },
    "phd-cv": {
      intro: [
        "Applying for a PhD means convincing a committee of your research potential, and your CV is where that case is made. SigmaCV builds a clean, citation-formatted PhD-application CV from your open research record, so you start from your real work — publications, preprints, posters and projects — rather than a blank template.",
        "Your work is matched to you by your ORCID iD, not your name, so nothing is misattributed, and you curate exactly what the committee sees. It is free and open source, and the same CV exports to PDF, Word, LaTeX or Markdown.",
      ],
      stepsHeading: "How to build a PhD-application CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "SigmaCV reads only your public ORCID record — no manual entry of your work.",
        },
        {
          title: "Your record fills in",
          body: "Publications, preprints and posters are pulled from ORCID and OpenAlex and formatted automatically; add anything missing by DOI.",
        },
        {
          title: "Curate for the programme",
          body: "Lead with research experience, choose which items appear, and order them for the committee you are applying to.",
        },
        {
          title: "Style and export",
          body: "Pick a citation style and template, then export to PDF, DOCX, LaTeX or Markdown.",
        },
      ],
      whyHeading: "Why build your PhD CV with SigmaCV",
      why: [
        "At the application stage your record is small and every item counts, so accuracy and clean formatting matter. SigmaCV pulls your work by identifier, formats citations consistently, and lets you present early outputs — a preprint, a poster, a conference talk — properly rather than awkwardly.",
        "It is free for individuals and open source, reads only public metadata, and never invents anything: you curate exactly what the committee sees, and the same canonical CV exports to every format.",
      ],
      faqExtra: [
        {
          q: "How long should a PhD-application CV be?",
          a: "Usually about 2–4 pages. Clear research experience and a few representative outputs beat padding.",
        },
        {
          q: "What should I emphasise if I have few publications?",
          a: "Lead with research experience — projects, methods, your role and outcomes — plus relevant skills, awards and presentations. That is what committees weigh most at this stage.",
        },
        {
          q: "Can I add a paper that isn't on my ORCID yet?",
          a: "Yes. You can add any work by its DOI and SigmaCV formats it to match the rest of your CV.",
        },
      ],
      relatedHeading: "Related ways to build your CV",
    },
    "postdoc-cv": {
      intro: [
        "As a postdoc you are applying for fellowships, grants and your next position on rolling deadlines, and re-formatting your CV each time is a drain. SigmaCV builds a current, citation-formatted CV from your open research record — publications, funding, teaching and service — so you keep one canonical version and export whatever each application needs.",
        "Your work is matched by your ORCID / OpenAlex identifier, not your name, citations are formatted consistently through CSL, and metrics stay off by default and field-normalized when you do opt in — aligned with DORA. It is free and open source.",
      ],
      stepsHeading: "How to build a postdoc CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "SigmaCV reads your public ORCID and OpenAlex record — no copy-pasting your publication list.",
        },
        {
          title: "Your record assembles",
          body: "Publications, funding, teaching and service are pulled in and formatted; add anything missing by DOI.",
        },
        {
          title: "Curate for each application",
          body: "Choose which work appears and apply a funder layout (NIH, ERC, UKRI…) for grant and fellowship applications, reversibly.",
        },
        {
          title: "Style and export",
          body: "Pick a citation style, optionally switch on field-normalized metrics, and export to PDF, DOCX, LaTeX or Markdown.",
        },
      ],
      whyHeading: "Why build your postdoc CV with SigmaCV",
      why: [
        "Postdoc applications come thick and fast, and each funder or employer wants a slightly different format. SigmaCV separates your record from its presentation: keep one canonical CV and reshape it — funder layout, section order, which works appear — in a click, without rebuilding it each time.",
        "It is free for individuals and open source, matches your work by identifier, and treats metrics responsibly: off by default, opt-in, and field-normalized over raw counts, in line with DORA.",
      ],
      faqExtra: [
        {
          q: "Does it support funder CV formats?",
          a: "Yes. SigmaCV has one-click layouts for major funders (NIH, NSF, ERC, UKRI R4RI, SNSF and more), applied reversibly to the same canonical CV.",
        },
        {
          q: "Will my metrics be shown by default?",
          a: "No. Metrics are off by default and opt-in; when enabled, SigmaCV prefers field-normalized indicators and never shows a journal Impact Factor.",
        },
        {
          q: "Can I export to LaTeX?",
          a: "Yes — SigmaCV exports a ready-to-compile .tex CV plus a .bib bibliography, alongside PDF, DOCX and Markdown.",
        },
      ],
      relatedHeading: "Related CV tools and formats",
    },
  },
  "zh-CN": {
    "grad-school-cv": {
      intro: [
        "一份出色的学术简历能让您的硕士、博士或研究生申请脱颖而出——但从空白模板入手是一种缓慢的方式。SigmaCV 依据您公开的研究记录生成一份简洁、已格式化引用的简历，让您从自己真实的成果出发：任何论文、预印本、海报和研究项目。",
        "您的成果通过 ORCID iD 与您匹配，而非通过姓名，并且您可精确决定招生委员会看到哪些内容。它免费且开源，同一份简历可导出为 PDF、Word、LaTeX 或 Markdown。",
      ],
      stepsHeading: "如何打造一份研究生申请简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 仅读取您的公开 ORCID 记录——无需填写空白表单。",
        },
        {
          title: "您的记录自动填充",
          body: "任何论文、预印本和海报都会从 ORCID 和 OpenAlex 提取并格式化；通过 DOI 添加任何缺失的内容。",
        },
        {
          title: "以研究经历为先",
          body: "突出项目、方法和技能，并针对您所申请的项目选择显示哪些条目。",
        },
        {
          title: "设置样式并导出",
          body: "选择一种引用样式和模板，然后导出为 PDF、DOCX、LaTeX 或 Markdown。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 打造您的研究生申请简历",
      why: [
        "在申请阶段，您的记录尚不庞大，因此准确性和整洁的呈现比篇幅更重要。SigmaCV 会恰当地格式化您的早期成果并保持一切一致，让一张海报或第一篇预印本读起来得体而非别扭。",
        "它对个人免费且开源，仅读取公开元数据，并绝不凭空编造：您可精确决定委员会看到哪些内容，同一份规范简历可导出为每一种格式。",
      ],
      faqExtra: [
        {
          q: "研究生申请简历应该有多长？",
          a: "通常约 2–4 页。清晰的研究经历加上几项有代表性的成果，胜过冗余的堆砌。",
        },
        {
          q: "如果我尚处于学习初期，应该包含哪些内容？",
          a: "教育经历、研究经历和项目、任何论文/预印本/海报、相关技能、奖项和推荐人——以能体现研究潜力的内容为先。",
        },
        {
          q: "我可以添加一篇尚未出现在 ORCID 上的论文吗？",
          a: "可以——通过 DOI 添加任何成果，SigmaCV 会将其格式化为与简历其余部分相匹配。",
        },
      ],
      relatedHeading: "构建简历的相关方式",
    },
    "faculty-cv": {
      intro: [
        "教职或终身教职简历篇幅长且内容全面——论文、资助、教学、指导和服务——而要让它在求职、终身教职和晋升各类材料中保持最新着实是件费力的事。SigmaCV 依据您公开的研究记录构建简历，并保留一份可针对各种用途重塑的规范版本。",
        "您的成果通过 ORCID / OpenAlex 标识符匹配，而非通过姓名，引用通过 CSL 统一格式化，指标默认关闭，当您选择启用时则经过字段归一化——符合 DORA 原则。它免费且开源。",
      ],
      stepsHeading: "如何构建教职简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 读取您的公开 ORCID 和 OpenAlex 记录——无需手动维护清单。",
        },
        {
          title: "您的完整记录自动组装",
          body: "论文、资助、教学和服务会被提取并格式化；通过 DOI 添加任何缺失的内容。",
        },
        {
          title: "针对用途套用布局",
          body: "在完整简历、资助机构格式（NIH、ERC、UKRI…）或精简版之间切换——从同一份记录出发，且可逆。",
        },
        {
          title: "设置样式并导出",
          body: "选择一种引用样式，可选地显示经过字段归一化的指标，然后导出为 PDF、DOCX、LaTeX 或 Markdown。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 构建您的教职简历",
      why: [
        "资深简历篇幅庞大且时常过时。SigmaCV 将您的记录与其呈现方式分离：保留一份会从开放记录重新同步的规范简历，并重塑它——章节顺序、资助机构布局、显示哪些成果——无需为每个委员会都重新构建。",
        "它对个人免费且开源，通过标识符匹配成果，并负责任地对待指标：默认关闭、可选启用，且偏向字段归一化指标而非原始计数，绝不使用期刊影响因子——与 DORA 保持一致。",
      ],
      faqExtra: [
        {
          q: "它能处理很长的论文列表吗？",
          a: "可以。论文会被自动提取并统一格式化；您可对其进行分组、排序和整理，同一份列表可导出为每一种格式。",
        },
        {
          q: "我可以保留一份简历并衍生出资助机构版本吗？",
          a: "可以——一份规范简历，配合以可逆方式应用的一键式资助机构/终身教职布局，因此您无需维护多个副本。",
        },
        {
          q: "指标会默认显示吗？",
          a: "不会。指标默认关闭并需选择启用；启用后，SigmaCV 偏向使用字段归一化指标，绝不显示期刊影响因子。",
        },
      ],
      relatedHeading: "相关的简历工具与格式",
    },
    "research-cv": {
      intro: [
        "研究简历——也称为研究人员简历或科研简历——是您学术成果的完整记录。SigmaCV 依据您公开的研究记录构建简历，因此您的论文、数据集、软件和学术经历都会被自动汇总和格式化，而无需手动录入。",
        "您的成果通过 ORCID / OpenAlex 标识符与您匹配，而非通过姓名，引用通过 CSL 统一格式化，并且您可精确决定显示哪些内容。它免费且开源，同一份简历可导出为每一种格式。",
      ],
      stepsHeading: "如何构建研究简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 读取您的公开 ORCID 和 OpenAlex 记录——无需复制粘贴。",
        },
        {
          title: "您的记录自动组装",
          body: "论文、数据集、软件和您的学术经历会被提取并格式化；通过 DOI 添加任何缺失的内容。",
        },
        {
          title: "整理并设置样式",
          body: "选择显示哪些成果，挑选一种引用样式和模板，并（可选地）开启经过字段归一化的指标。",
        },
        {
          title: "导出或发布",
          body: "导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX——或发布一个会重新同步的实时公开页面。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 构建您的研究简历",
      why: [
        "研究简历应当准确地反映您学术成果的全部广度。SigmaCV 通过标识符提取您的成果——因此常见姓名和非拉丁文字的姓名都能正确解析——通过单一引擎格式化每一条引用，并在作者列表中持续高亮您自己的姓名。",
        "它对个人免费且开源，仅读取公开元数据，并负责任地对待指标：默认关闭、可选启用，且偏向字段归一化指标而非原始计数，与 DORA 保持一致。",
      ],
      faqExtra: [
        {
          q: "它是否包含数据集和软件，而不仅仅是论文？",
          a: "是的。在可获取的情况下，SigmaCV 会（通过 DataCite / OpenAIRE）将数据集和软件与您的论文一并提取，让您的研究简历反映您的全部成果。",
        },
        {
          q: "我可以在线发布我的研究简历吗？",
          a: "可以——您可以发布一个实时、机器可读的公开页面，它会从开放记录重新同步，并对所显示的内容提供逐字段同意控制。",
        },
        {
          q: "我可以导出为 BibTeX 吗？",
          a: "可以——除 PDF、DOCX、LaTeX 和 Markdown 外，SigmaCV 还会将您整理后的论文导出为 BibTeX 和 CSL-JSON。",
        },
      ],
      relatedHeading: "相关的简历工具与格式",
    },
    "phd-cv": {
      intro: [
        "申请博士意味着要让评审委员会相信您的研究潜力，而您的简历正是陈述这一理由的地方。SigmaCV 依据您公开的学术记录构建一份简洁、已格式化引用的博士申请简历，让您从自己真实的成果——论文、预印本、海报和项目——出发，而不是从一张空白模板开始。",
        "您的成果通过 ORCID iD 与您匹配，而非通过姓名，因此不会有任何张冠李戴，并且您可精确决定评审委员会看到哪些内容。它免费且开源，同一份简历可导出为 PDF、Word、LaTeX 或 Markdown。",
      ],
      stepsHeading: "如何打造一份博士申请简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 仅读取您的公开 ORCID 记录——无需手动录入您的成果。",
        },
        {
          title: "您的记录自动填充",
          body: "论文、预印本和海报会从 ORCID 和 OpenAlex 提取并自动格式化；通过 DOI 添加任何缺失的内容。",
        },
        {
          title: "针对申请项目进行整理",
          body: "以研究经历为先，选择显示哪些条目，并按您所申请的评审委员会进行排序。",
        },
        {
          title: "设置样式并导出",
          body: "选择一种引用样式和模板，然后导出为 PDF、DOCX、LaTeX 或 Markdown。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 打造您的博士简历",
      why: [
        "在申请阶段，您的记录尚不庞大，每一条都很重要，因此准确性和整洁的格式都至关重要。SigmaCV 通过标识符提取您的成果，统一格式化引用，并让您把早期成果——一篇预印本、一张海报、一次会议报告——恰当而非别扭地呈现出来。",
        "它对个人免费且开源，仅读取公开元数据，并绝不凭空编造：您可精确决定评审委员会看到哪些内容，同一份规范简历可导出为每一种格式。",
      ],
      faqExtra: [
        {
          q: "博士申请简历应该有多长？",
          a: "通常约 2–4 页。清晰的研究经历加上几项有代表性的成果，胜过冗余的堆砌。",
        },
        {
          q: "如果我论文很少，应该突出什么？",
          a: "以研究经历为先——项目、方法、您的角色和成果——再加上相关的技能、奖项和报告。这正是评审委员会在这个阶段最看重的内容。",
        },
        {
          q: "我可以添加一篇尚未出现在 ORCID 上的论文吗？",
          a: "可以。您可以通过 DOI 添加任何成果，SigmaCV 会将其格式化为与简历其余部分相匹配。",
        },
      ],
      relatedHeading: "构建简历的相关方式",
    },
    "postdoc-cv": {
      intro: [
        "作为博士后，您要按滚动截止日期申请研究金、资助和下一份职位，而每次都重新排版简历是件令人疲于应付的事。SigmaCV 依据您公开的学术记录构建一份最新、已格式化引用的简历——论文、资助、教学和服务——让您只保留一份规范版本，并导出每个申请所需的内容。",
        "您的成果通过 ORCID / OpenAlex 标识符匹配，而非通过姓名，引用通过 CSL 统一格式化，指标默认关闭，当您选择启用时则经过字段归一化——符合 DORA 原则。它免费且开源。",
      ],
      stepsHeading: "如何构建博士后简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 读取您的公开 ORCID 和 OpenAlex 记录——无需复制粘贴您的论文清单。",
        },
        {
          title: "您的记录自动组装",
          body: "论文、资助、教学和服务会被提取并格式化；通过 DOI 添加任何缺失的内容。",
        },
        {
          title: "针对每个申请进行整理",
          body: "选择显示哪些成果，并为资助和研究金申请套用某种资助机构布局（NIH、ERC、UKRI…），且可逆。",
        },
        {
          title: "设置样式并导出",
          body: "选择一种引用样式，可选地开启经过字段归一化的指标，然后导出为 PDF、DOCX、LaTeX 或 Markdown。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 构建您的博士后简历",
      why: [
        "博士后申请接踵而至，而每家资助机构或雇主想要的格式都略有不同。SigmaCV 将您的记录与其呈现方式分离：保留一份规范简历，并一键重塑它——资助机构布局、章节顺序、显示哪些成果——无需每次都重新构建。",
        "它对个人免费且开源，通过标识符匹配您的成果，并负责任地对待指标：默认关闭、可选启用，且偏向字段归一化指标而非原始计数，与 DORA 保持一致。",
      ],
      faqExtra: [
        {
          q: "它支持资助机构的简历格式吗？",
          a: "支持。SigmaCV 为主要资助机构（NIH、NSF、ERC、UKRI R4RI、SNSF 等）提供一键式布局，并以可逆的方式应用于同一份规范简历。",
        },
        {
          q: "我的指标会默认显示吗？",
          a: "不会。指标默认关闭并需选择启用；启用后，SigmaCV 偏向使用字段归一化指标，绝不显示期刊影响因子。",
        },
        {
          q: "我可以导出为 LaTeX 吗？",
          a: "可以——SigmaCV 会导出一份可直接编译的 .tex 简历以及一份 .bib 参考文献，同时也支持 PDF、DOCX 和 Markdown。",
        },
      ],
      relatedHeading: "相关的简历工具与格式",
    },
  },
  "es-ES": {
    "grad-school-cv": {
      intro: [
        "Un buen CV académico ayuda a que tu solicitud de máster, doctorado o posgrado destaque, pero una plantilla en blanco es una forma lenta de crearlo. SigmaCV reúne un CV limpio y con citas formateadas a partir de tu registro científico abierto, de modo que partes de tu trabajo real: cualquier publicación, preprint, póster y proyecto de investigación.",
        "Tu trabajo se identifica contigo mediante tu iD ORCID, no por tu nombre, y tú seleccionas exactamente lo que ve el comité de admisiones. Es gratis y de código abierto, y el mismo CV se exporta a PDF, Word, LaTeX o Markdown.",
      ],
      stepsHeading: "Cómo crear un CV para posgrado",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "SigmaCV solo lee tu registro público de ORCID: sin formularios en blanco que rellenar.",
        },
        {
          title: "Tu registro se rellena",
          body: "Cualquier publicación, preprint y póster se extrae de ORCID y OpenAlex y se le da formato; añade lo que falte por DOI.",
        },
        {
          title: "Empieza por la experiencia investigadora",
          body: "Destaca proyectos, métodos y competencias, y elige qué entradas aparecen para el programa al que te presentas.",
        },
        {
          title: "Da estilo y exporta",
          body: "Elige un estilo de citas y una plantilla, y luego exporta a PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Por qué crear tu CV para posgrado con SigmaCV",
      why: [
        "En la fase de solicitud tu registro es reducido, así que la precisión y una presentación limpia importan más que la extensión. SigmaCV da formato correcto a tus primeros resultados y mantiene todo coherente, de modo que un póster o un primer preprint se lean bien en lugar de quedar desajustados.",
        "Es gratis para particulares y de código abierto, solo lee metadatos públicos y nunca inventa nada: tú decides exactamente lo que ve el comité, y el mismo CV canónico se exporta a todos los formatos.",
      ],
      faqExtra: [
        {
          q: "¿Qué extensión debe tener un CV para posgrado?",
          a: "Normalmente unas 2-4 páginas. Una experiencia investigadora clara y unos pocos resultados representativos valen más que el relleno.",
        },
        {
          q: "¿Qué debo incluir si estoy al principio de mis estudios?",
          a: "Formación, experiencia investigadora y proyectos, cualquier publicación/preprint/póster, competencias relevantes, premios y referencias; empieza por lo que demuestre potencial investigador.",
        },
        {
          q: "¿Puedo añadir un artículo que aún no está en mi ORCID?",
          a: "Sí: añade cualquier trabajo por su DOI y SigmaCV le da formato para que encaje con el resto de tu CV.",
        },
      ],
      relatedHeading: "Otras formas de crear tu CV",
    },
    "faculty-cv": {
      intro: [
        "Un CV de profesorado o de plaza permanente es largo y completo —publicaciones, financiación, docencia, supervisión y servicio— y mantenerlo al día en los procesos de profesorado, plaza permanente y promoción supone un trabajo real. SigmaCV lo reúne a partir de tu registro científico abierto y mantiene una única versión canónica que puedes remodelar para cada propósito.",
        "Tu trabajo se identifica por tu identificador de ORCID / OpenAlex, no por tu nombre; las citas se formatean de forma coherente mediante CSL, y las métricas permanecen desactivadas por defecto y normalizadas por campo cuando decides activarlas, en línea con DORA. Es gratis y de código abierto.",
      ],
      stepsHeading: "Cómo crear un CV de profesorado",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "SigmaCV lee tu registro público de ORCID y OpenAlex: sin listas que mantener a mano.",
        },
        {
          title: "Tu registro completo se reúne",
          body: "Publicaciones, financiación, docencia y servicio se extraen y se les da formato; añade lo que falte por DOI.",
        },
        {
          title: "Aplica una plantilla para cada propósito",
          body: "Cambia entre un CV completo, un formato de financiador (NIH, ERC, UKRI…) o una versión recortada, de forma reversible y a partir de un único registro.",
        },
        {
          title: "Da estilo y exporta",
          body: "Elige un estilo de citas, muestra opcionalmente las métricas normalizadas por campo y exporta a PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Por qué crear tu CV de profesorado con SigmaCV",
      why: [
        "Los CV de perfil sénior son extensos y se quedan desactualizados constantemente. SigmaCV separa tu registro de su presentación: mantén un único CV canónico que se resincroniza desde el registro abierto y remodélalo —orden de las secciones, plantilla de financiador, qué trabajos aparecen— sin reconstruirlo para cada comité.",
        "Es gratis para particulares y de código abierto, identifica el trabajo por identificador y trata las métricas de forma responsable: desactivadas por defecto, opcionales y normalizadas por campo en lugar de recuentos brutos, nunca el factor de impacto de una revista, en línea con DORA.",
      ],
      faqExtra: [
        {
          q: "¿Gestiona una lista de publicaciones larga?",
          a: "Sí. Las publicaciones se extraen automáticamente y se formatean de manera coherente; tú las agrupas, ordenas y seleccionas, y la misma lista se exporta a todos los formatos.",
        },
        {
          q: "¿Puedo mantener un único CV y derivar versiones para financiadores?",
          a: "Sí: un único CV canónico, con plantillas de financiador o de plaza permanente en un clic aplicadas de forma reversible, para que no mantengas varias copias.",
        },
        {
          q: "¿Se muestran las métricas por defecto?",
          a: "No. Las métricas están desactivadas por defecto y son opcionales; cuando se activan, SigmaCV prefiere los indicadores normalizados por campo y nunca muestra el factor de impacto de una revista.",
        },
      ],
      relatedHeading: "Herramientas y formatos de CV relacionados",
    },
    "research-cv": {
      intro: [
        "Un CV de investigación —también llamado CV de investigador o CV científico— es el registro completo de tu trabajo científico. SigmaCV crea uno a partir de tu registro científico abierto, de modo que tus publicaciones, conjuntos de datos, software e historial académico se reúnen y se formatean automáticamente en lugar de escribirse a mano.",
        "Tu trabajo se identifica contigo por tu identificador de ORCID / OpenAlex, no por tu nombre; las citas se formatean de forma coherente mediante CSL, y tú seleccionas exactamente lo que aparece. Es gratis y de código abierto, y el mismo CV se exporta a todos los formatos.",
      ],
      stepsHeading: "Cómo crear un CV de investigación",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "SigmaCV lee tu registro público de ORCID y OpenAlex: sin copiar y pegar.",
        },
        {
          title: "Tu registro se reúne",
          body: "Publicaciones, conjuntos de datos, software y tu historial académico se extraen y se les da formato; añade lo que falte por DOI.",
        },
        {
          title: "Selecciona y da estilo",
          body: "Elige qué trabajo aparece, escoge un estilo de citas y una plantilla y (opcionalmente) activa las métricas normalizadas por campo.",
        },
        {
          title: "Exporta o publica",
          body: "Exporta a PDF, DOCX, LaTeX, Markdown o BibTeX, o publica una página pública viva que se resincroniza.",
        },
      ],
      whyHeading: "Por qué crear tu CV de investigación con SigmaCV",
      why: [
        "Un CV de investigación debe reflejar con precisión toda la amplitud de tu trabajo científico. SigmaCV extrae tu trabajo por identificador —de modo que los nombres comunes y los de alfabetos no latinos se resuelven correctamente—, formatea cada cita con un único motor y mantiene tu propio nombre resaltado en las listas de autores.",
        "Es gratis para particulares y de código abierto, solo lee metadatos públicos y trata las métricas de forma responsable: desactivadas por defecto, opcionales y normalizadas por campo en lugar de recuentos brutos, en línea con DORA.",
      ],
      faqExtra: [
        {
          q: "¿Incluye conjuntos de datos y software, no solo artículos?",
          a: "Sí. Cuando están disponibles, SigmaCV extrae conjuntos de datos y software (a través de DataCite / OpenAIRE) junto con tus publicaciones, de modo que tu CV de investigación refleje todos tus resultados.",
        },
        {
          q: "¿Puedo publicar mi CV de investigación en línea?",
          a: "Sí: puedes publicar una página pública viva y legible por máquina que se resincroniza desde el registro abierto, con consentimiento por campo sobre lo que se muestra.",
        },
        {
          q: "¿Puedo exportar a BibTeX?",
          a: "Sí: junto con PDF, DOCX, LaTeX y Markdown, SigmaCV exporta tus publicaciones seleccionadas como BibTeX y CSL-JSON.",
        },
      ],
      relatedHeading: "Herramientas y formatos de CV relacionados",
    },
    "phd-cv": {
      intro: [
        "Solicitar un doctorado significa convencer a un comité de tu potencial investigador, y tu CV es donde se defiende ese argumento. SigmaCV crea un CV de solicitud de doctorado limpio y con citas formateadas a partir de tu registro científico abierto, de modo que partes de tu trabajo real —publicaciones, preprints, pósteres y proyectos— en lugar de una plantilla en blanco.",
        "Tu trabajo se identifica contigo mediante tu iD ORCID, no por tu nombre, así que nada se atribuye erróneamente y tú seleccionas exactamente lo que ve el comité. Es gratis y de código abierto, y el mismo CV se exporta a PDF, Word, LaTeX o Markdown.",
      ],
      stepsHeading: "Cómo crear un CV de solicitud de doctorado",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "SigmaCV solo lee tu registro público de ORCID; no hay que introducir tu trabajo a mano.",
        },
        {
          title: "Tu registro se rellena solo",
          body: "Las publicaciones, preprints y pósteres se extraen de ORCID y OpenAlex y se formatean automáticamente; añade lo que falte por DOI.",
        },
        {
          title: "Selecciona para el programa",
          body: "Encabeza con tu experiencia investigadora, elige qué entradas aparecen y ordénalas para el comité al que te presentas.",
        },
        {
          title: "Da estilo y exporta",
          body: "Elige un estilo de citas y una plantilla, y luego exporta a PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Por qué crear tu CV de doctorado con SigmaCV",
      why: [
        "En la etapa de solicitud tu registro es pequeño y cada entrada cuenta, así que la exactitud y un formato limpio importan. SigmaCV extrae tu trabajo por identificador, da formato coherente a las citas y te permite presentar tus primeros resultados —un preprint, un póster, una comunicación en un congreso— de forma adecuada en lugar de torpe.",
        "Es gratis para particulares y de código abierto, solo lee metadatos públicos y nunca inventa nada: tú seleccionas exactamente lo que ve el comité, y el mismo CV canónico se exporta a todos los formatos.",
      ],
      faqExtra: [
        {
          q: "¿Cuánto debe ocupar un CV de solicitud de doctorado?",
          a: "Normalmente entre 2 y 4 páginas. Una experiencia investigadora clara y unos pocos resultados representativos valen más que el relleno.",
        },
        {
          q: "¿Qué debo destacar si tengo pocas publicaciones?",
          a: "Encabeza con tu experiencia investigadora —proyectos, métodos, tu papel y los resultados— junto con competencias, premios y presentaciones relevantes. Es lo que más valoran los comités en esta etapa.",
        },
        {
          q: "¿Puedo añadir un artículo que aún no está en mi ORCID?",
          a: "Sí. Puedes añadir cualquier trabajo por su DOI y SigmaCV le da formato para que encaje con el resto de tu CV.",
        },
      ],
      relatedHeading: "Otras formas de crear tu CV",
    },
    "postdoc-cv": {
      intro: [
        "Como posdoc, te presentas a becas, ayudas y a tu siguiente puesto con plazos continuos, y volver a dar formato a tu CV cada vez es agotador. SigmaCV crea un CV actualizado y con citas formateadas a partir de tu registro científico abierto —publicaciones, financiación, docencia y servicio—, de modo que mantienes una única versión canónica y exportas lo que cada solicitud necesite.",
        "Tu trabajo se identifica por tu identificador de ORCID / OpenAlex, no por tu nombre; las citas se formatean de forma coherente mediante CSL, y las métricas permanecen desactivadas por defecto y normalizadas por campo cuando decides activarlas, en línea con DORA. Es gratis y de código abierto.",
      ],
      stepsHeading: "Cómo crear un CV de posdoctorado",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "SigmaCV lee tu registro público de ORCID y OpenAlex: sin copiar y pegar tu lista de publicaciones.",
        },
        {
          title: "Tu registro se ensambla",
          body: "Las publicaciones, la financiación, la docencia y el servicio se reúnen y se formatean; añade lo que falte por DOI.",
        },
        {
          title: "Selecciona para cada solicitud",
          body: "Elige qué trabajo aparece y aplica una plantilla de financiador (NIH, ERC, UKRI…) para solicitudes de ayudas y becas, de forma reversible.",
        },
        {
          title: "Da estilo y exporta",
          body: "Elige un estilo de citas, activa opcionalmente las métricas normalizadas por campo y exporta a PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Por qué crear tu CV de posdoctorado con SigmaCV",
      why: [
        "Las solicitudes de posdoctorado llegan sin parar, y cada financiador o empleador quiere un formato ligeramente distinto. SigmaCV separa tu registro de su presentación: mantén un único CV canónico y dale otra forma —plantilla de financiador, orden de secciones, qué trabajos aparecen— con un clic, sin reconstruirlo cada vez.",
        "Es gratis para particulares y de código abierto, identifica tu trabajo por identificador y trata las métricas de forma responsable: desactivadas por defecto, opcionales y normalizadas por campo en lugar de recuentos brutos, en línea con DORA.",
      ],
      faqExtra: [
        {
          q: "¿Admite formatos de CV para financiadores?",
          a: "Sí. SigmaCV tiene plantillas en un clic para los principales financiadores (NIH, NSF, ERC, UKRI R4RI, SNSF y más), aplicadas de forma reversible al mismo CV canónico.",
        },
        {
          q: "¿Se mostrarán mis métricas por defecto?",
          a: "No. Las métricas están desactivadas por defecto y son opcionales; cuando se activan, SigmaCV prefiere los indicadores normalizados por campo y nunca muestra el factor de impacto de una revista.",
        },
        {
          q: "¿Puedo exportar a LaTeX?",
          a: "Sí: SigmaCV exporta un CV .tex listo para compilar junto con una bibliografía .bib, además de PDF, DOCX y Markdown.",
        },
      ],
      relatedHeading: "Herramientas y formatos de CV relacionados",
    },
  },
  "fr-FR": {
    "grad-school-cv": {
      intro: [
        "Un CV académique solide aide votre candidature en master, en doctorat ou à un programme doctoral à se démarquer — mais un modèle vierge est une façon lente d'en construire un. SigmaCV assemble un CV soigné, aux citations mises en forme, à partir de votre dossier scientifique ouvert : vous partez ainsi de vos vrais travaux — publications, preprints, posters et projets de recherche.",
        "Vos travaux vous sont appariés par votre iD ORCID, et non par votre nom, et vous sélectionnez exactement ce que le comité d'admission voit. C'est gratuit et open source, et le même CV s'exporte en PDF, Word, LaTeX ou Markdown.",
      ],
      stepsHeading: "Comment construire un CV de master ou de doctorat",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "SigmaCV ne lit que votre dossier ORCID public — aucun formulaire vierge à remplir.",
        },
        {
          title: "Votre dossier se remplit",
          body: "Vos publications, preprints et posters sont récupérés depuis ORCID et OpenAlex puis mis en forme ; ajoutez ce qui manque par son DOI.",
        },
        {
          title: "Mettez l'expérience de recherche en avant",
          body: "Faites ressortir vos projets, vos méthodes et vos compétences, et choisissez les entrées qui apparaissent pour le programme visé.",
        },
        {
          title: "Mettez en forme et exportez",
          body: "Choisissez un style de citations et un modèle, puis exportez en PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Pourquoi construire votre CV de master/doctorat avec SigmaCV",
      why: [
        "Au stade de la candidature, votre dossier est encore réduit : l'exactitude et une présentation soignée comptent donc plus que la longueur. SigmaCV met correctement en forme vos premiers travaux et garde tout cohérent, pour qu'un poster ou un premier preprint soit présenté avec élégance plutôt que maladroitement.",
        "Il est gratuit pour les particuliers et open source, ne lit que les métadonnées publiques et n'invente jamais rien : vous décidez exactement ce que le comité voit, et le même CV canonique s'exporte dans tous les formats.",
      ],
      faqExtra: [
        {
          q: "Quelle longueur pour un CV de master ou de doctorat ?",
          a: "En général de 2 à 4 pages environ. Une expérience de recherche claire et quelques travaux représentatifs valent mieux que du remplissage.",
        },
        {
          q: "Que dois-je inclure si je débute mes études ?",
          a: "Formation, expérience de recherche et projets, vos éventuels publications/preprints/posters, compétences pertinentes, distinctions et références — mettez en avant ce qui montre votre potentiel de recherche.",
        },
        {
          q: "Puis-je ajouter un article qui n'est pas encore sur mon ORCID ?",
          a: "Oui — ajoutez n'importe quel travail par son DOI et SigmaCV le met en forme pour qu'il s'accorde au reste de votre CV.",
        },
      ],
      relatedHeading: "Autres façons de construire votre CV",
    },
    "faculty-cv": {
      intro: [
        "Un CV d'enseignant-chercheur ou de titularisation est long et complet — publications, financements, enseignement, encadrement et responsabilités collectives — et le tenir à jour entre les dossiers de poste, de titularisation et de promotion représente un vrai travail. SigmaCV l'assemble à partir de votre dossier scientifique ouvert et conserve une version canonique unique que vous pouvez remodeler selon chaque usage.",
        "Vos travaux sont appariés par votre identifiant ORCID / OpenAlex, et non par votre nom, les citations sont mises en forme de façon cohérente via CSL, et les métriques restent désactivées par défaut et normalisées par domaine lorsque vous les activez — en accord avec DORA. C'est gratuit et open source.",
      ],
      stepsHeading: "Comment construire un CV d'enseignant-chercheur",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "SigmaCV lit votre dossier ORCID et OpenAlex public — aucune liste à tenir à la main.",
        },
        {
          title: "Votre dossier complet s'assemble",
          body: "Publications, financements, enseignement et responsabilités collectives sont récupérés puis mis en forme ; ajoutez ce qui manque par son DOI.",
        },
        {
          title: "Appliquez une mise en page selon l'usage",
          body: "Basculez entre un CV complet, un format de financeur (NIH, ERC, UKRI…) ou une version allégée — de manière réversible, depuis un seul dossier.",
        },
        {
          title: "Mettez en forme et exportez",
          body: "Choisissez un style de citations, affichez éventuellement des métriques normalisées par domaine, et exportez en PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Pourquoi construire votre CV d'enseignant-chercheur avec SigmaCV",
      why: [
        "Les CV de chercheurs confirmés sont volumineux et constamment dépassés. SigmaCV sépare votre dossier de sa présentation : gardez un seul CV canonique qui se resynchronise depuis le dossier ouvert, et remodelez-le — ordre des sections, mise en page de financeur, travaux affichés — sans le reconstruire pour chaque comité.",
        "Il est gratuit pour les particuliers et open source, apparie les travaux par identifiant, et traite les métriques de façon responsable : désactivées par défaut, optionnelles, et normalisées par domaine plutôt que des comptages bruts, jamais un facteur d'impact de revue — en accord avec DORA.",
      ],
      faqExtra: [
        {
          q: "Gère-t-il une longue liste de publications ?",
          a: "Oui. Les publications sont récupérées automatiquement et mises en forme de façon cohérente ; vous les regroupez, les ordonnez et les sélectionnez, et la même liste s'exporte dans tous les formats.",
        },
        {
          q: "Puis-je garder un seul CV et en dériver des versions pour financeurs ?",
          a: "Oui — un seul CV canonique, avec des mises en page de financeur ou de titularisation appliquées en un clic et de manière réversible, pour ne pas avoir à entretenir plusieurs copies.",
        },
        {
          q: "Les métriques sont-elles affichées par défaut ?",
          a: "Non. Les métriques sont désactivées par défaut et optionnelles ; une fois activées, SigmaCV privilégie les indicateurs normalisés par domaine et n'affiche jamais de facteur d'impact de revue.",
        },
      ],
      relatedHeading: "Outils et formats de CV apparentés",
    },
    "research-cv": {
      intro: [
        "Un CV de recherche — aussi appelé CV de chercheur ou CV scientifique — est le relevé complet de vos travaux scientifiques. SigmaCV en construit un à partir de votre dossier scientifique ouvert : vos publications, jeux de données, logiciels et votre parcours académique sont assemblés et mis en forme automatiquement, plutôt que saisis à la main.",
        "Vos travaux vous sont appariés par votre identifiant ORCID / OpenAlex, et non par votre nom, les citations sont mises en forme de façon cohérente via CSL, et vous sélectionnez exactement ce qui apparaît. C'est gratuit et open source, et le même CV s'exporte dans tous les formats.",
      ],
      stepsHeading: "Comment construire un CV de recherche",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "SigmaCV lit votre dossier ORCID et OpenAlex public — aucun copier-coller.",
        },
        {
          title: "Votre dossier s'assemble",
          body: "Publications, jeux de données, logiciels et votre parcours académique sont récupérés puis mis en forme ; ajoutez ce qui manque par son DOI.",
        },
        {
          title: "Sélectionnez et mettez en forme",
          body: "Choisissez les travaux qui apparaissent, sélectionnez un style de citations et un modèle, et activez (en option) les métriques normalisées par domaine.",
        },
        {
          title: "Exportez ou publiez",
          body: "Exportez en PDF, DOCX, LaTeX, Markdown ou BibTeX — ou publiez une page publique vivante qui se resynchronise.",
        },
      ],
      whyHeading: "Pourquoi construire votre CV de recherche avec SigmaCV",
      why: [
        "Un CV de recherche doit refléter fidèlement toute l'étendue de votre activité scientifique. SigmaCV récupère vos travaux par identifiant — de sorte que les noms courants et en écriture non latine soient résolus correctement — met en forme chaque citation via un moteur unique, et garde votre propre nom mis en valeur dans les listes d'auteurs.",
        "Il est gratuit pour les particuliers et open source, ne lit que les métadonnées publiques, et traite les métriques de façon responsable : désactivées par défaut, optionnelles, et normalisées par domaine plutôt que des comptages bruts, en accord avec DORA.",
      ],
      faqExtra: [
        {
          q: "Inclut-il les jeux de données et les logiciels, pas seulement les articles ?",
          a: "Oui. Lorsque c'est possible, SigmaCV récupère vos jeux de données et logiciels (via DataCite / OpenAIRE) aux côtés de vos publications, pour que votre CV de recherche reflète l'ensemble de vos travaux.",
        },
        {
          q: "Puis-je publier mon CV de recherche en ligne ?",
          a: "Oui — vous pouvez publier une page publique vivante et lisible par machine qui se resynchronise depuis le dossier ouvert, avec un consentement champ par champ sur ce qui est affiché.",
        },
        {
          q: "Puis-je exporter en BibTeX ?",
          a: "Oui — en plus de PDF, DOCX, LaTeX et Markdown, SigmaCV exporte vos publications sélectionnées en BibTeX et CSL-JSON.",
        },
      ],
      relatedHeading: "Outils et formats de CV apparentés",
    },
    "phd-cv": {
      intro: [
        "Postuler à un doctorat, c'est convaincre un comité de votre potentiel de recherche, et c'est dans votre CV que cet argument se construit. SigmaCV bâtit un CV de candidature en doctorat soigné, aux citations mises en forme, à partir de votre dossier scientifique ouvert : vous partez ainsi de vos vrais travaux — publications, preprints, posters et projets — plutôt que d'un modèle vierge.",
        "Vos travaux vous sont appariés par votre iD ORCID, et non par votre nom, ce qui évite toute attribution erronée, et vous choisissez exactement ce que le comité voit. C'est gratuit et open source, et le même CV s'exporte en PDF, Word, LaTeX ou Markdown.",
      ],
      stepsHeading: "Comment construire un CV de candidature en doctorat",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "SigmaCV ne lit que votre dossier ORCID public — aucune saisie manuelle de vos travaux.",
        },
        {
          title: "Votre dossier se remplit tout seul",
          body: "Vos publications, preprints et posters sont récupérés depuis ORCID et OpenAlex et mis en forme automatiquement ; ajoutez ce qui manque par son DOI.",
        },
        {
          title: "Sélectionnez pour le programme visé",
          body: "Mettez en avant votre expérience de recherche, choisissez les entrées qui apparaissent et ordonnez-les pour le comité auquel vous postulez.",
        },
        {
          title: "Mettez en forme et exportez",
          body: "Choisissez un style de citations et un modèle, puis exportez en PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Pourquoi construire votre CV de doctorat avec SigmaCV",
      why: [
        "Au stade de la candidature, votre dossier est mince et chaque entrée compte : l'exactitude et une mise en forme soignée sont donc essentielles. SigmaCV récupère vos travaux par identifiant, met en forme les citations de façon cohérente et vous permet de présenter correctement vos premières productions — un preprint, un poster, une communication en congrès — plutôt que maladroitement.",
        "C'est gratuit pour les particuliers et open source, cela ne lit que les métadonnées publiques et n'invente jamais rien : vous choisissez exactement ce que le comité voit, et le même CV canonique s'exporte dans tous les formats.",
      ],
      faqExtra: [
        {
          q: "Quelle longueur doit faire un CV de candidature en doctorat ?",
          a: "En général de 2 à 4 pages environ. Une expérience de recherche claire et quelques productions représentatives valent mieux que du remplissage.",
        },
        {
          q: "Que dois-je mettre en avant si j'ai peu de publications ?",
          a: "Mettez en avant votre expérience de recherche — projets, méthodes, votre rôle et vos résultats — ainsi que vos compétences, distinctions et présentations pertinentes. C'est ce que les comités pèsent le plus à ce stade.",
        },
        {
          q: "Puis-je ajouter un article qui n'est pas encore sur mon ORCID ?",
          a: "Oui. Vous pouvez ajouter n'importe quel travail par son DOI, et SigmaCV le met en forme pour qu'il s'accorde au reste de votre CV.",
        },
      ],
      relatedHeading: "Autres façons de construire votre CV",
    },
    "postdoc-cv": {
      intro: [
        "En tant que postdoctorant, vous postulez à des bourses, des financements et votre prochain poste au fil d'échéances continues, et reformater votre CV à chaque fois est épuisant. SigmaCV construit un CV à jour, aux citations mises en forme, à partir de votre dossier scientifique ouvert — publications, financements, enseignement et activités de service — pour que vous gardiez une seule version canonique et exportiez ce dont chaque candidature a besoin.",
        "Vos travaux sont appariés par votre identifiant ORCID / OpenAlex, et non par votre nom, les citations sont mises en forme de façon cohérente via CSL, et les métriques restent désactivées par défaut et normalisées par domaine lorsque vous les activez — en accord avec DORA. C'est gratuit et open source.",
      ],
      stepsHeading: "Comment construire un CV de postdoctorat",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "SigmaCV lit votre dossier ORCID et OpenAlex public — aucun copier-coller de votre liste de publications.",
        },
        {
          title: "Votre dossier s'assemble",
          body: "Vos publications, financements, enseignement et activités de service sont récupérés et mis en forme ; ajoutez ce qui manque par son DOI.",
        },
        {
          title: "Sélectionnez pour chaque candidature",
          body: "Choisissez les travaux qui apparaissent et appliquez une mise en page de financeur (NIH, ERC, UKRI…) pour les demandes de financement et de bourse, de manière réversible.",
        },
        {
          title: "Mettez en forme et exportez",
          body: "Choisissez un style de citations, activez éventuellement les métriques normalisées par domaine, et exportez en PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Pourquoi construire votre CV de postdoctorat avec SigmaCV",
      why: [
        "Les candidatures en postdoctorat s'enchaînent vite, et chaque financeur ou employeur attend un format légèrement différent. SigmaCV sépare votre dossier de sa présentation : gardez un seul CV canonique et remodelez-le — mise en page de financeur, ordre des sections, travaux affichés — en un clic, sans le reconstruire à chaque fois.",
        "C'est gratuit pour les particuliers et open source, vos travaux sont appariés par identifiant, et les métriques sont traitées de façon responsable : désactivées par défaut, optionnelles et normalisées par domaine plutôt que des comptes bruts, conformément à DORA.",
      ],
      faqExtra: [
        {
          q: "Les formats de CV pour financeurs sont-ils pris en charge ?",
          a: "Oui. SigmaCV propose des mises en page en un clic pour les principaux financeurs (NIH, NSF, ERC, UKRI R4RI, SNSF et plus), appliquées de manière réversible au même CV canonique.",
        },
        {
          q: "Mes métriques seront-elles affichées par défaut ?",
          a: "Non. Les métriques sont désactivées par défaut et optionnelles ; lorsqu'elles sont activées, SigmaCV privilégie les indicateurs normalisés par domaine et n'affiche jamais le facteur d'impact d'une revue.",
        },
        {
          q: "Puis-je exporter en LaTeX ?",
          a: "Oui — SigmaCV exporte un CV .tex prêt à compiler ainsi qu'une bibliographie .bib, aux côtés des formats PDF, DOCX et Markdown.",
        },
      ],
      relatedHeading: "Outils et formats de CV apparentés",
    },
  },
  "de-DE": {
    "grad-school-cv": {
      intro: [
        "Ein überzeugender akademischer Lebenslauf hilft Ihrer Bewerbung um einen Master-, Promotions- oder weiterführenden Studienplatz, sich abzuheben — aber eine leere Vorlage ist ein langsamer Weg dorthin. SigmaCV stellt aus Ihrem offenen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen Lebenslauf zusammen, sodass Sie von Ihren tatsächlichen Arbeiten ausgehen: etwaige Publikationen, Preprints, Poster und Forschungsprojekte.",
        "Ihre Arbeiten werden Ihnen über Ihre ORCID iD zugeordnet, nicht über Ihren Namen, und Sie bestimmen genau, was das Auswahlkomitee sieht. Es ist kostenlos und quelloffen, und derselbe Lebenslauf wird als PDF, Word, LaTeX oder Markdown exportiert.",
      ],
      stepsHeading: "So erstellen Sie einen Lebenslauf für Master/Promotion",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "SigmaCV liest ausschließlich Ihr öffentliches ORCID-Verzeichnis — kein leeres Formular zum Ausfüllen.",
        },
        {
          title: "Ihr Verzeichnis füllt sich",
          body: "Etwaige Publikationen, Preprints und Poster werden aus ORCID und OpenAlex geholt und formatiert; fügen Sie Fehlendes per DOI hinzu.",
        },
        {
          title: "Mit der Forschungserfahrung führen",
          body: "Stellen Sie Projekte, Methoden und Kompetenzen in den Vordergrund und wählen Sie, welche Einträge für das Programm erscheinen, auf das Sie sich bewerben.",
        },
        {
          title: "Gestalten und exportieren",
          body: "Wählen Sie einen Zitierstil und eine Vorlage und exportieren Sie dann als PDF, DOCX, LaTeX oder Markdown.",
        },
      ],
      whyHeading: "Warum Sie Ihren Lebenslauf für Master/Promotion mit SigmaCV erstellen sollten",
      why: [
        "Im Bewerbungsstadium ist Ihr Verzeichnis klein, daher zählen Genauigkeit und eine saubere Darstellung mehr als der Umfang. SigmaCV formatiert Ihre frühen Arbeiten korrekt und hält alles einheitlich, sodass ein Poster oder ein erstes Preprint gut statt unbeholfen wirkt.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, liest ausschließlich öffentliche Metadaten und erfindet niemals etwas: Sie entscheiden genau, was das Komitee sieht, und derselbe kanonische Lebenslauf wird in jedes Format exportiert.",
      ],
      faqExtra: [
        {
          q: "Wie lang sollte ein Lebenslauf für Master/Promotion sein?",
          a: "Üblicherweise etwa 2–4 Seiten. Klare Forschungserfahrung und einige repräsentative Arbeiten schlagen aufgeblähten Umfang.",
        },
        {
          q: "Was sollte ich aufnehmen, wenn ich noch am Anfang meines Studiums stehe?",
          a: "Ausbildung, Forschungserfahrung und Projekte, etwaige Publikationen/Preprints/Poster, einschlägige Kompetenzen, Auszeichnungen und Referenzen — führen Sie mit dem, was Forschungspotenzial zeigt.",
        },
        {
          q: "Kann ich eine Arbeit hinzufügen, die noch nicht in meinem ORCID-Verzeichnis steht?",
          a: "Ja — fügen Sie jede Arbeit über ihre DOI hinzu, und SigmaCV formatiert sie passend zum Rest Ihres Lebenslaufs.",
        },
      ],
      relatedHeading: "Verwandte Wege, Ihren Lebenslauf zu erstellen",
    },
    "faculty-cv": {
      intro: [
        "Ein Lebenslauf für eine Professur oder Berufung ist lang und umfassend — Publikationen, Förderungen, Lehre, Betreuung und akademische Selbstverwaltung — und ihn über Bewerbungs-, Berufungs- und Beförderungsunterlagen hinweg aktuell zu halten, ist echte Arbeit. SigmaCV stellt ihn aus Ihrem offenen Forschungsverzeichnis zusammen und hält eine kanonische Fassung vor, die Sie für jeden Zweck umformen können.",
        "Ihre Arbeiten werden über Ihre ORCID- / OpenAlex-Kennung zugeordnet, nicht über Ihren Namen, Zitate werden über CSL einheitlich formatiert, und Metriken bleiben standardmäßig deaktiviert und feldnormiert, wenn Sie sie aktivieren — im Einklang mit DORA. Es ist kostenlos und quelloffen.",
      ],
      stepsHeading: "So erstellen Sie einen Lebenslauf für eine Professur",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "SigmaCV liest Ihr öffentliches ORCID- und OpenAlex-Verzeichnis — keine manuelle Listenpflege.",
        },
        {
          title: "Ihr vollständiges Verzeichnis fügt sich zusammen",
          body: "Publikationen, Förderungen, Lehre und akademische Selbstverwaltung werden eingelesen und formatiert; fügen Sie Fehlendes per DOI hinzu.",
        },
        {
          title: "Ein Layout für den Zweck anwenden",
          body: "Wechseln Sie zwischen einem vollständigen Lebenslauf, einem Förderer-Format (NIH, ERC, UKRI…) oder einer gekürzten Fassung — reversibel, aus einem Verzeichnis.",
        },
        {
          title: "Gestalten und exportieren",
          body: "Wählen Sie einen Zitierstil, zeigen Sie auf Wunsch feldnormierte Metriken an und exportieren Sie als PDF, DOCX, LaTeX oder Markdown.",
        },
      ],
      whyHeading: "Warum Sie Ihren Lebenslauf für eine Professur mit SigmaCV erstellen sollten",
      why: [
        "Lebensläufe erfahrener Forschender sind umfangreich und ständig veraltet. SigmaCV trennt Ihr Verzeichnis von seiner Darstellung: Halten Sie einen kanonischen Lebenslauf vor, der sich aus dem offenen Verzeichnis neu synchronisiert, und formen Sie ihn um — Abschnittsreihenfolge, Förderer-Layout, welche Arbeiten erscheinen — ohne ihn für jedes Komitee neu aufzubauen.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, ordnet Arbeiten über Kennungen zu und geht verantwortungsvoll mit Metriken um: standardmäßig deaktiviert, optional aktivierbar und feldnormiert statt roher Zählungen, niemals ein Journal-Impact-Faktor — im Einklang mit DORA.",
      ],
      faqExtra: [
        {
          q: "Bewältigt es eine lange Publikationsliste?",
          a: "Ja. Publikationen werden automatisch eingelesen und einheitlich formatiert; Sie gruppieren, ordnen und wählen sie aus, und dieselbe Liste wird in jedes Format exportiert.",
        },
        {
          q: "Kann ich einen Lebenslauf behalten und Förderer-Fassungen ableiten?",
          a: "Ja — ein kanonischer Lebenslauf, mit Ein-Klick-Layouts für Förderer/Berufung, reversibel angewendet, sodass Sie nicht mehrere Kopien pflegen.",
        },
        {
          q: "Werden Metriken standardmäßig angezeigt?",
          a: "Nein. Metriken sind standardmäßig deaktiviert und optional aktivierbar; wenn aktiviert, bevorzugt SigmaCV feldnormierte Indikatoren und zeigt niemals einen Journal-Impact-Faktor.",
        },
      ],
      relatedHeading: "Verwandte Lebenslaufwerkzeuge und -formate",
    },
    "research-cv": {
      intro: [
        "Ein wissenschaftlicher Lebenslauf — auch Forschungs- oder wissenschaftlicher Lebenslauf genannt — ist das vollständige Verzeichnis Ihrer wissenschaftlichen Arbeit. SigmaCV erstellt einen solchen aus Ihrem offenen Forschungsverzeichnis, sodass Ihre Publikationen, Datensätze, Software und Ihr akademischer Werdegang automatisch zusammengestellt und formatiert werden, statt von Hand getippt.",
        "Ihre Arbeiten werden Ihnen über Ihre ORCID- / OpenAlex-Kennung zugeordnet, nicht über Ihren Namen, Zitate werden über CSL einheitlich formatiert, und Sie bestimmen genau, was erscheint. Es ist kostenlos und quelloffen, und derselbe Lebenslauf wird in jedes Format exportiert.",
      ],
      stepsHeading: "So erstellen Sie einen wissenschaftlichen Lebenslauf",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "SigmaCV liest Ihr öffentliches ORCID- und OpenAlex-Verzeichnis — kein Kopieren und Einfügen.",
        },
        {
          title: "Ihr Verzeichnis fügt sich zusammen",
          body: "Publikationen, Datensätze, Software und Ihr akademischer Werdegang werden eingelesen und formatiert; fügen Sie Fehlendes per DOI hinzu.",
        },
        {
          title: "Auswählen und gestalten",
          body: "Wählen Sie, welche Arbeiten erscheinen, einen Zitierstil und eine Vorlage und schalten Sie (optional) feldnormierte Metriken ein.",
        },
        {
          title: "Exportieren oder veröffentlichen",
          body: "Exportieren Sie als PDF, DOCX, LaTeX, Markdown oder BibTeX — oder veröffentlichen Sie eine lebende öffentliche Seite, die sich neu synchronisiert.",
        },
      ],
      whyHeading: "Warum Sie Ihren wissenschaftlichen Lebenslauf mit SigmaCV erstellen sollten",
      why: [
        "Ein wissenschaftlicher Lebenslauf sollte die gesamte Breite Ihrer Wissenschaft genau widerspiegeln. SigmaCV holt Ihre Arbeiten über die Kennung — sodass häufige Namen und Namen in nicht-lateinischen Schriften korrekt aufgelöst werden — formatiert jedes Zitat über eine einzige Engine und hält Ihren eigenen Namen in Autorenlisten hervorgehoben.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, liest ausschließlich öffentliche Metadaten und geht verantwortungsvoll mit Metriken um: standardmäßig deaktiviert, optional aktivierbar und feldnormiert statt roher Zählungen, im Einklang mit DORA.",
      ],
      faqExtra: [
        {
          q: "Umfasst es Datensätze und Software, nicht nur Aufsätze?",
          a: "Ja. Sofern verfügbar, holt SigmaCV Datensätze und Software (über DataCite / OpenAIRE) neben Ihren Publikationen, sodass Ihr wissenschaftlicher Lebenslauf alle Ihre Arbeiten widerspiegelt.",
        },
        {
          q: "Kann ich meinen wissenschaftlichen Lebenslauf online veröffentlichen?",
          a: "Ja — Sie können eine lebende, maschinenlesbare öffentliche Seite veröffentlichen, die sich aus dem offenen Verzeichnis neu synchronisiert, mit feldweiser Einwilligung darüber, was angezeigt wird.",
        },
        {
          q: "Kann ich als BibTeX exportieren?",
          a: "Ja — neben PDF, DOCX, LaTeX und Markdown exportiert SigmaCV Ihre ausgewählten Publikationen als BibTeX und CSL-JSON.",
        },
      ],
      relatedHeading: "Verwandte Lebenslaufwerkzeuge und -formate",
    },
    "phd-cv": {
      intro: [
        "Sich um eine Promotion zu bewerben bedeutet, ein Auswahlkomitee von Ihrem Forschungspotenzial zu überzeugen, und Ihr Lebenslauf ist der Ort, an dem dieser Nachweis erbracht wird. SigmaCV erstellt aus Ihrem offenen Forschungsverzeichnis einen übersichtlichen, mit formatierten Zitaten versehenen Lebenslauf für die Promotionsbewerbung, sodass Sie mit Ihrer echten Arbeit beginnen — Publikationen, Preprints, Poster und Projekte — statt mit einer leeren Vorlage.",
        "Ihre Arbeit wird Ihnen über Ihre ORCID iD zugeordnet, nicht über Ihren Namen, sodass nichts falsch zugeordnet wird, und Sie bestimmen genau, was das Auswahlkomitee sieht. Es ist kostenlos und quelloffen, und derselbe Lebenslauf wird als PDF, Word, LaTeX oder Markdown exportiert.",
      ],
      stepsHeading: "So erstellen Sie einen Lebenslauf für die Promotionsbewerbung",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "SigmaCV liest ausschließlich Ihr öffentliches ORCID-Verzeichnis — kein manuelles Eintippen Ihrer Arbeit.",
        },
        {
          title: "Ihr Verzeichnis füllt sich",
          body: "Publikationen, Preprints und Poster werden aus ORCID und OpenAlex geholt und automatisch formatiert; fügen Sie Fehlendes über die DOI hinzu.",
        },
        {
          title: "Für das Programm kuratieren",
          body: "Stellen Sie Ihre Forschungserfahrung voran, wählen Sie aus, welche Einträge erscheinen, und ordnen Sie sie für das Auswahlkomitee an, bei dem Sie sich bewerben.",
        },
        {
          title: "Gestalten und exportieren",
          body: "Wählen Sie einen Zitierstil und ein Layout und exportieren Sie dann als PDF, DOCX, LaTeX oder Markdown.",
        },
      ],
      whyHeading: "Warum Sie Ihren Promotions-Lebenslauf mit SigmaCV erstellen sollten",
      why: [
        "In der Bewerbungsphase ist Ihr Verzeichnis klein und jeder Eintrag zählt, daher kommt es auf Genauigkeit und saubere Formatierung an. SigmaCV holt Ihre Arbeit über Kennungen, formatiert Zitate einheitlich und lässt Sie frühe Ergebnisse — ein Preprint, ein Poster, einen Konferenzvortrag — angemessen präsentieren statt umständlich.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, liest ausschließlich öffentliche Metadaten und erfindet niemals etwas: Sie bestimmen genau, was das Auswahlkomitee sieht, und derselbe kanonische Lebenslauf wird in jedes Format exportiert.",
      ],
      faqExtra: [
        {
          q: "Wie lang sollte ein Lebenslauf für die Promotionsbewerbung sein?",
          a: "Üblicherweise etwa 2–4 Seiten. Klar dargestellte Forschungserfahrung und einige repräsentative Ergebnisse sind besser als Füllmaterial.",
        },
        {
          q: "Worauf sollte ich den Schwerpunkt legen, wenn ich wenige Publikationen habe?",
          a: "Stellen Sie die Forschungserfahrung voran — Projekte, Methoden, Ihre Rolle und Ergebnisse — dazu relevante Kompetenzen, Auszeichnungen und Präsentationen. Das gewichten Auswahlkomitees in dieser Phase am stärksten.",
        },
        {
          q: "Kann ich eine Arbeit hinzufügen, die noch nicht in meinem ORCID-Verzeichnis steht?",
          a: "Ja. Sie können jede Arbeit über ihre DOI hinzufügen, und SigmaCV formatiert sie passend zum Rest Ihres Lebenslaufs.",
        },
      ],
      relatedHeading: "Verwandte Wege, Ihren Lebenslauf zu erstellen",
    },
    "postdoc-cv": {
      intro: [
        "Als Postdoc bewerben Sie sich um Fellowships, Förderungen und Ihre nächste Stelle zu laufenden Fristen, und Ihren Lebenslauf jedes Mal neu zu formatieren ist zermürbend. SigmaCV erstellt aus Ihrem offenen Forschungsverzeichnis einen aktuellen, mit formatierten Zitaten versehenen Lebenslauf — Publikationen, Förderungen, Lehre und Gremienarbeit — sodass Sie eine kanonische Version pflegen und exportieren, was jede Bewerbung braucht.",
        "Ihre Arbeit wird über Ihre ORCID- / OpenAlex-Kennung zugeordnet, nicht über Ihren Namen, Zitate werden über CSL einheitlich formatiert, und Metriken bleiben standardmäßig deaktiviert und sind feldnormiert, wenn Sie sie aktivieren — im Einklang mit DORA. Es ist kostenlos und quelloffen.",
      ],
      stepsHeading: "So erstellen Sie einen Postdoc-Lebenslauf",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "SigmaCV liest Ihr öffentliches ORCID- und OpenAlex-Verzeichnis — kein Kopieren und Einfügen Ihrer Publikationsliste.",
        },
        {
          title: "Ihr Verzeichnis stellt sich zusammen",
          body: "Publikationen, Förderungen, Lehre und Gremienarbeit werden eingelesen und formatiert; fügen Sie Fehlendes über die DOI hinzu.",
        },
        {
          title: "Für jede Bewerbung kuratieren",
          body: "Wählen Sie aus, welche Arbeiten erscheinen, und wenden Sie reversibel ein Förderlayout (NIH, ERC, UKRI …) für Förder- und Fellowship-Bewerbungen an.",
        },
        {
          title: "Gestalten und exportieren",
          body: "Wählen Sie einen Zitierstil, schalten Sie optional feldnormierte Metriken ein und exportieren Sie als PDF, DOCX, LaTeX oder Markdown.",
        },
      ],
      whyHeading: "Warum Sie Ihren Postdoc-Lebenslauf mit SigmaCV erstellen sollten",
      why: [
        "Postdoc-Bewerbungen kommen dicht und schnell, und jeder Förderer oder Arbeitgeber wünscht ein etwas anderes Format. SigmaCV trennt Ihr Verzeichnis von seiner Darstellung: Pflegen Sie einen kanonischen Lebenslauf und formen Sie ihn um — Förderlayout, Abschnittsreihenfolge, welche Arbeiten erscheinen — mit einem Klick, ohne ihn jedes Mal neu aufzubauen.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, ordnet Ihre Arbeit über Kennungen zu und geht verantwortungsvoll mit Metriken um: standardmäßig deaktiviert, optional und feldnormiert statt reiner Zählungen, im Einklang mit DORA.",
      ],
      faqExtra: [
        {
          q: "Unterstützt es Förder-Lebenslaufformate?",
          a: "Ja. SigmaCV bietet Ein-Klick-Layouts für große Förderer (NIH, NSF, ERC, UKRI R4RI, SNSF und weitere), reversibel auf denselben kanonischen Lebenslauf angewendet.",
        },
        {
          q: "Werden meine Metriken standardmäßig angezeigt?",
          a: "Nein. Metriken sind standardmäßig deaktiviert und optional; wenn sie aktiviert sind, bevorzugt SigmaCV feldnormierte Indikatoren und zeigt niemals den Impact-Faktor einer Zeitschrift an.",
        },
        {
          q: "Kann ich nach LaTeX exportieren?",
          a: "Ja — SigmaCV exportiert einen kompilierfertigen .tex-Lebenslauf samt einer .bib-Bibliografie, neben PDF, DOCX und Markdown.",
        },
      ],
      relatedHeading: "Verwandte Lebenslauf-Werkzeuge und -Formate",
    },
  },
  "ja-JP": {
    "grad-school-cv": {
      intro: [
        "充実した学術 CV は、修士・博士・大学院への出願であなたを際立たせます——とはいえ、空白のテンプレートから作るのは時間のかかる方法です。SigmaCV はあなたの公開された研究記録から、引用が整形された洗練された CV をまとめます。そのため、論文・プレプリント・ポスター・研究プロジェクトといった実際の業績から始められます。",
        "あなたの業績は、名前ではなく ORCID iD によってあなたに照合され、入学審査委員会が見る内容をあなたが正確に整理できます。無料でオープンソースであり、同一の CV を PDF・Word・LaTeX・Markdown に書き出せます。",
      ],
      stepsHeading: "大学院出願 CV の作成方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "SigmaCV はあなたの公開 ORCID 記録のみを読み取ります——埋めるべき空白のフォームはありません。",
        },
        {
          title: "記録が埋まる",
          body: "論文・プレプリント・ポスターは ORCID と OpenAlex から取得されて整形されます。不足しているものは DOI で追加できます。",
        },
        {
          title: "研究経験を前面に",
          body: "プロジェクト・手法・スキルを前面に出し、出願するプログラムに合わせて表示する項目を選びます。",
        },
        {
          title: "スタイルを整えて書き出す",
          body: "引用スタイルとテンプレートを選び、PDF・DOCX・LaTeX・Markdown に書き出します。",
        },
      ],
      whyHeading: "SigmaCV で大学院出願 CV を作る理由",
      why: [
        "出願段階では記録が少ないため、長さよりも正確さときれいな見せ方が大切になります。SigmaCV はあなたの初期の成果を適切に整形し、すべてを一貫させるため、ポスターや最初のプレプリントが不格好ではなく、見栄えよく読めます。",
        "個人には無料でオープンソースであり、読み取るのは公開メタデータのみで、何かを捏造することは一切ありません。審査委員会が見る内容はあなたが正確に決め、同一の正規 CV をあらゆる形式に書き出せます。",
      ],
      faqExtra: [
        {
          q: "大学院出願 CV はどのくらいの長さにすべきですか？",
          a: "通常はおよそ 2〜4 ページです。明確な研究経験と、代表的な成果をいくつか示すことが、水増しよりも効果的です。",
        },
        {
          q: "学業の初期段階では何を含めるべきですか？",
          a: "学歴・研究経験とプロジェクト・論文／プレプリント／ポスター（あれば）・関連スキル・受賞・推薦者——研究ポテンシャルを示すものを前面に出してください。",
        },
        {
          q: "まだ ORCID に載っていない論文を追加できますか？",
          a: "はい——DOI を指定すればどんな業績でも追加でき、SigmaCV が CV の他の部分に合わせて整形します。",
        },
      ],
      relatedHeading: "CV を作る関連の方法",
    },
    "faculty-cv": {
      intro: [
        "教員・テニュア CV は長く網羅的で——論文・助成・教育・指導・サービス——教員職・テニュア・昇進ファイルにわたって最新に保つのは相応の手間です。SigmaCV はそれをあなたの公開された研究記録から組み立て、目的ごとに作り替えられる一つの正規バージョンを保ちます。",
        "あなたの業績は、名前ではなく ORCID / OpenAlex 識別子で照合され、引用は CSL で一貫して整形されます。メトリクスはデフォルトで非表示のままで、オプトインした場合もフィールド正規化されます——DORA に沿っています。無料でオープンソースです。",
      ],
      stepsHeading: "教員 CV の作成方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "SigmaCV はあなたの公開された ORCID と OpenAlex の記録を読み取ります——手作業でリストを管理する必要はありません。",
        },
        {
          title: "記録の全体が組み上がる",
          body: "論文・助成・教育・サービスが取り込まれて整形されます。不足しているものは DOI で追加できます。",
        },
        {
          title: "目的に合わせてレイアウトを適用",
          body: "フル CV、助成機関の形式（NIH・ERC・UKRI など）、簡略版を——一つの記録から可逆的に——切り替えます。",
        },
        {
          title: "スタイルを整えて書き出す",
          body: "引用スタイルを選び、必要に応じてフィールド正規化メトリクスを表示し、PDF・DOCX・LaTeX・Markdown に書き出します。",
        },
      ],
      whyHeading: "SigmaCV で教員 CV を作る理由",
      why: [
        "シニアの CV は大きく、常に最新ではなくなりがちです。SigmaCV はあなたの記録とその見せ方を切り離します。公開記録から再同期される一つの正規 CV を保ち、委員会ごとに作り直すことなく作り替えられます——セクション順・助成機関レイアウト・表示する業績まで。",
        "個人には無料でオープンソースであり、業績を識別子で照合し、メトリクスを責任を持って扱います。デフォルトは非表示、オプトイン、生のカウントよりフィールド正規化を優先し、ジャーナルのインパクトファクターを表示することは決してありません——DORA に沿っています。",
      ],
      faqExtra: [
        {
          q: "長い論文リストにも対応していますか？",
          a: "はい。論文は自動で取り込まれて一貫して整形されます。グループ化・並べ替え・整理はあなたが行い、同一のリストをあらゆる形式に書き出せます。",
        },
        {
          q: "一つの CV を保ったまま助成機関版を導けますか？",
          a: "はい——一つの正規 CV に、助成機関／テニュア向けのワンクリックレイアウトを可逆的に適用するため、複数のコピーを管理せずに済みます。",
        },
        {
          q: "メトリクスはデフォルトで表示されますか？",
          a: "いいえ。メトリクスはデフォルトで非表示でオプトインです。有効にした場合、SigmaCV はフィールド正規化された指標を優先し、ジャーナルのインパクトファクターを表示することは決してありません。",
        },
      ],
      relatedHeading: "関連する CV ツールと形式",
    },
    "research-cv": {
      intro: [
        "研究者 CV——研究者向け CV、学術 CV とも呼ばれます——は、あなたの学術的業績の完全な記録です。SigmaCV はそれをあなたの公開された研究記録から構築します。そのため、論文・データセット・ソフトウェア・学歴が、手入力ではなく自動でまとめられて整形されます。",
        "あなたの業績は、名前ではなく ORCID / OpenAlex 識別子によってあなたに照合され、引用は CSL で一貫して整形され、表示する内容をあなたが正確に整理できます。無料でオープンソースであり、同一の CV をあらゆる形式に書き出せます。",
      ],
      stepsHeading: "研究者 CV の作成方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "SigmaCV はあなたの公開された ORCID と OpenAlex の記録を読み取ります——コピー＆ペーストは不要です。",
        },
        {
          title: "記録が組み上がる",
          body: "論文・データセット・ソフトウェア・学歴が取り込まれて整形されます。不足しているものは DOI で追加できます。",
        },
        {
          title: "整理してスタイルを整える",
          body: "表示する業績を選び、引用スタイルとテンプレートを選んで、（必要に応じて）フィールド正規化メトリクスを有効にします。",
        },
        {
          title: "書き出すか公開する",
          body: "PDF・DOCX・LaTeX・Markdown・BibTeX に書き出す——あるいは、再同期される生きた公開ページを公開します。",
        },
      ],
      whyHeading: "SigmaCV で研究者 CV を作る理由",
      why: [
        "研究者 CV は、あなたの学術活動の幅を正確に反映すべきものです。SigmaCV はあなたの業績を識別子で取得するため——ありふれた名前や非ラテン文字の名前も正しく解決され——すべての引用を一つのエンジンで整形し、著者リスト内であなた自身の名前をハイライトしたまま保ちます。",
        "個人には無料でオープンソースであり、読み取るのは公開メタデータのみで、メトリクスを責任を持って扱います。デフォルトは非表示、オプトイン、生のカウントよりフィールド正規化を優先し、DORA に沿っています。",
      ],
      faqExtra: [
        {
          q: "論文だけでなく、データセットやソフトウェアも含まれますか？",
          a: "はい。利用可能な場合、SigmaCV は論文とあわせてデータセットとソフトウェア（DataCite / OpenAIRE 経由）を取得するため、研究者 CV があなたのすべての成果を反映します。",
        },
        {
          q: "研究者 CV をオンラインで公開できますか？",
          a: "はい——公開記録から再同期される、機械可読の生きた公開ページを公開でき、表示内容についてはフィールドごとに同意を設定できます。",
        },
        {
          q: "BibTeX に書き出せますか？",
          a: "はい——PDF・DOCX・LaTeX・Markdown とあわせて、SigmaCV は整理した論文を BibTeX と CSL-JSON として書き出します。",
        },
      ],
      relatedHeading: "関連する CV ツールと形式",
    },
    "phd-cv": {
      intro: [
        "博士課程への出願では、あなたの研究ポテンシャルを審査委員会に納得させる必要があり、その主張を形にする場が CV です。SigmaCV はあなたの公開された研究記録から、引用が整形された洗練された博士課程出願 CV を構築します。そのため、空白のテンプレートではなく、論文・プレプリント・ポスター・プロジェクトといった実際の業績から始められます。",
        "あなたの業績は、名前ではなく ORCID iD によってあなたに照合されるため、誤った帰属は起こらず、審査委員会が見る内容をあなたが正確に整理できます。無料でオープンソースであり、同一の CV を PDF・Word・LaTeX・Markdown に書き出せます。",
      ],
      stepsHeading: "博士課程出願 CV の作成方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "SigmaCV はあなたの公開 ORCID 記録のみを読み取ります——業績を手入力する必要はありません。",
        },
        {
          title: "記録が自動で埋まる",
          body: "論文・プレプリント・ポスターは ORCID と OpenAlex から取得され、自動で整形されます。不足しているものは DOI で追加できます。",
        },
        {
          title: "プログラムに合わせて整理",
          body: "研究経験を前面に出し、表示する項目を選び、出願先の審査委員会に合わせて並べ替えます。",
        },
        {
          title: "スタイルを整えて書き出す",
          body: "引用スタイルとテンプレートを選び、PDF・DOCX・LaTeX・Markdown に書き出します。",
        },
      ],
      whyHeading: "SigmaCV で博士課程 CV を作る理由",
      why: [
        "出願の段階では記録が少なく、一つひとつの項目が重要なため、正確さときれいな整形が大切です。SigmaCV はあなたの業績を識別子で取得し、引用を一貫して整形し、プレプリント・ポスター・学会発表といった初期の成果を、不格好にならず適切に提示できるようにします。",
        "個人には無料でオープンソースであり、読み取るのは公開メタデータのみで、何かを捏造することは一切ありません。審査委員会が見る内容はあなたが正確に整理し、同一の正規 CV をあらゆる形式に書き出せます。",
      ],
      faqExtra: [
        {
          q: "博士課程出願 CV はどのくらいの長さにすべきですか？",
          a: "通常はおよそ 2〜4 ページです。明確な研究経験と、代表的な成果をいくつか示すことが、水増しよりも効果的です。",
        },
        {
          q: "論文が少ない場合は何を強調すべきですか？",
          a: "研究経験——プロジェクト、手法、あなたの役割と成果——に加えて、関連するスキル・受賞・発表を前面に出してください。この段階では審査委員会がそれを最も重視します。",
        },
        {
          q: "まだ ORCID に載っていない論文を追加できますか？",
          a: "はい。DOI を指定すればどんな業績でも追加でき、SigmaCV が CV の他の部分に合わせて整形します。",
        },
      ],
      relatedHeading: "CV を作る関連の方法",
    },
    "postdoc-cv": {
      intro: [
        "ポスドクとして、あなたはフェローシップ・助成・次のポジションに随時の締切で応募しており、そのたびに CV を整形し直すのは負担です。SigmaCV はあなたの公開された研究記録——論文・助成・教育・サービス——から、引用が整形された最新の CV を構築します。そのため、一つの正規バージョンを保ちつつ、各応募に必要なものを書き出せます。",
        "あなたの業績は、名前ではなく ORCID / OpenAlex 識別子で照合され、引用は CSL で一貫して整形されます。メトリクスはデフォルトで非表示のままで、オプトインした場合もフィールド正規化されます——DORA に準拠しています。無料でオープンソースです。",
      ],
      stepsHeading: "ポスドク CV の作成方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "SigmaCV はあなたの公開された ORCID と OpenAlex の記録を読み取ります——論文リストをコピー＆ペーストする必要はありません。",
        },
        {
          title: "記録が組み上がる",
          body: "論文・助成・教育・サービスが取り込まれて整形されます。不足しているものは DOI で追加できます。",
        },
        {
          title: "応募ごとに整理",
          body: "表示する業績を選び、助成・フェローシップへの応募には助成機関レイアウト（NIH・ERC・UKRI など）を可逆的に適用します。",
        },
        {
          title: "スタイルを整えて書き出す",
          body: "引用スタイルを選び、必要に応じてフィールド正規化メトリクスを有効にして、PDF・DOCX・LaTeX・Markdown に書き出します。",
        },
      ],
      whyHeading: "SigmaCV でポスドク CV を作る理由",
      why: [
        "ポスドクの応募は次々とやってきて、助成機関や雇用主ごとに少しずつ異なる形式を求めてきます。SigmaCV はあなたの記録とその見せ方を切り離します。一つの正規 CV を保ち、助成機関レイアウト・セクション順・表示する業績をワンクリックで作り替えられ、毎回作り直す必要はありません。",
        "個人には無料でオープンソースであり、あなたの業績を識別子で照合し、メトリクスを責任を持って扱います。デフォルトは非表示でオプトイン、生のカウントよりフィールド正規化を優先し、DORA に沿っています。",
      ],
      faqExtra: [
        {
          q: "助成機関の CV 形式に対応していますか？",
          a: "はい。SigmaCV は主要な助成機関（NIH・NSF・ERC・UKRI R4RI・SNSF ほか）向けのワンクリックレイアウトを備えており、同一の正規 CV に可逆的に適用されます。",
        },
        {
          q: "メトリクスはデフォルトで表示されますか？",
          a: "いいえ。メトリクスはデフォルトで非表示でオプトインです。有効にした場合、SigmaCV はフィールド正規化された指標を優先し、ジャーナルのインパクトファクターを表示することは決してありません。",
        },
        {
          q: "LaTeX で書き出せますか？",
          a: "はい——SigmaCV は、コンパイル可能な .tex の CV と .bib 参考文献を、PDF・DOCX・Markdown とあわせて書き出します。",
        },
      ],
      relatedHeading: "関連する CV ツールと形式",
    },
  },
  "pt-BR": {
    "grad-school-cv": {
      intro: [
        "Um currículo acadêmico forte ajuda sua candidatura a mestrado, doutorado ou pós-graduação a se destacar — mas um modelo em branco é uma forma lenta de criá-lo. O SigmaCV reúne um currículo limpo, com citações formatadas, a partir do seu registro de pesquisa aberto, de modo que você parte do seu trabalho real: quaisquer publicações, preprints, pôsteres e projetos de pesquisa.",
        "Seu trabalho é correspondido a você pelo seu ORCID iD, não pelo seu nome, e você cura exatamente o que a comissão de seleção vê. É gratuito e de código aberto, e o mesmo currículo é exportado para PDF, Word, LaTeX ou Markdown.",
      ],
      stepsHeading: "Como criar um currículo de mestrado e doutorado",
      steps: [
        {
          title: "Entre com seu ORCID iD",
          body: "O SigmaCV lê apenas o seu registro público do ORCID — sem formulário em branco para preencher.",
        },
        {
          title: "Seu registro se preenche",
          body: "Quaisquer publicações, preprints e pôsteres são extraídos do ORCID e do OpenAlex e formatados; adicione qualquer coisa que esteja faltando por DOI.",
        },
        {
          title: "Comece pela experiência de pesquisa",
          body: "Coloque em primeiro plano projetos, métodos e competências, e escolha quais itens aparecem para o programa ao qual você está se candidatando.",
        },
        {
          title: "Estilize e exporte",
          body: "Escolha um estilo de citações e um modelo e, em seguida, exporte para PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Por que criar seu currículo de mestrado e doutorado com o SigmaCV",
      why: [
        "Na etapa de candidatura seu registro é pequeno, então a precisão e a apresentação limpa importam mais do que a extensão. O SigmaCV formata seus primeiros resultados de maneira adequada e mantém tudo consistente, para que um pôster ou um primeiro preprint fique bem apresentado, e não desajeitado.",
        "Ele é gratuito para indivíduos e de código aberto, lê apenas metadados públicos e nunca inventa nada: você decide exatamente o que a comissão vê, e o mesmo currículo canônico é exportado para todos os formatos.",
      ],
      faqExtra: [
        {
          q: "Qual deve ser o tamanho de um currículo de mestrado e doutorado?",
          a: "Em geral, cerca de 2 a 4 páginas. Uma experiência de pesquisa clara e alguns resultados representativos valem mais do que enchimento.",
        },
        {
          q: "O que devo incluir se estou no início dos meus estudos?",
          a: "Formação, experiência de pesquisa e projetos, quaisquer publicações/preprints/pôsteres, competências relevantes, prêmios e referências — comece pelo que demonstra potencial de pesquisa.",
        },
        {
          q: "Posso adicionar um artigo que ainda não está no meu ORCID?",
          a: "Sim — adicione qualquer trabalho pelo seu DOI e o SigmaCV o formata para combinar com o restante do seu currículo.",
        },
      ],
      relatedHeading: "Outras formas de criar seu currículo",
    },
    "faculty-cv": {
      intro: [
        "Um currículo de docente ou de efetivação é longo e abrangente — publicações, financiamentos, atividade docente, orientação e serviços — e mantê-lo atualizado entre vagas, processos de efetivação e de promoção dá trabalho de verdade. O SigmaCV o reúne a partir do seu registro de pesquisa aberto e mantém uma única versão canônica que você pode remodelar para cada finalidade.",
        "Seu trabalho é correspondido pelo seu identificador do ORCID / OpenAlex, não pelo seu nome, as citações são formatadas de maneira consistente por meio do CSL, e as métricas permanecem desativadas por padrão e normalizadas por campo quando você opta por usá-las — alinhado ao DORA. É gratuito e de código aberto.",
      ],
      stepsHeading: "Como criar um currículo de docente",
      steps: [
        {
          title: "Entre com seu ORCID iD",
          body: "O SigmaCV lê o seu registro público do ORCID e do OpenAlex — sem manter listas manualmente.",
        },
        {
          title: "Seu registro completo se monta",
          body: "Publicações, financiamentos, atividade docente e serviços são extraídos e formatados; adicione qualquer coisa que esteja faltando por DOI.",
        },
        {
          title: "Aplique um layout para a finalidade",
          body: "Alterne entre um currículo completo, um formato de financiador (NIH, ERC, UKRI…) ou uma versão enxuta — de forma reversível, a partir de um único registro.",
        },
        {
          title: "Estilize e exporte",
          body: "Escolha um estilo de citações, opcionalmente exiba métricas normalizadas por campo e exporte para PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Por que criar seu currículo de docente com o SigmaCV",
      why: [
        "Currículos sêniores são extensos e estão constantemente desatualizados. O SigmaCV separa o seu registro da sua apresentação: mantenha um único currículo canônico que re-sincroniza a partir do registro aberto e remodele-o — ordem das seções, layout de financiador, quais trabalhos aparecem — sem reconstruí-lo para cada comissão.",
        "Ele é gratuito para indivíduos e de código aberto, corresponde o trabalho por identificador e trata as métricas de forma responsável: desativadas por padrão, opcionais e normalizadas por campo em vez de contagens brutas, nunca o Fator de Impacto de uma revista — em linha com o DORA.",
      ],
      faqExtra: [
        {
          q: "Ele lida com uma longa lista de publicações?",
          a: "Sim. As publicações são extraídas automaticamente e formatadas de maneira consistente; você as agrupa, ordena e cura, e a mesma lista é exportada para todos os formatos.",
        },
        {
          q: "Posso manter um único currículo e derivar versões para financiadores?",
          a: "Sim — um único currículo canônico, com layouts de financiador/efetivação em um clique aplicados de forma reversível, para que você não mantenha várias cópias.",
        },
        {
          q: "As métricas são exibidas por padrão?",
          a: "Não. As métricas ficam desativadas por padrão e são opcionais; quando ativadas, o SigmaCV prefere indicadores normalizados por campo e nunca mostra o Fator de Impacto de uma revista.",
        },
      ],
      relatedHeading: "Ferramentas e formatos de currículo relacionados",
    },
    "research-cv": {
      intro: [
        "Um currículo de pesquisador — também chamado de currículo científico ou acadêmico — é o registro completo do seu trabalho acadêmico. O SigmaCV cria um a partir do seu registro de pesquisa aberto, de modo que suas publicações, conjuntos de dados, software e histórico acadêmico são reunidos e formatados automaticamente, em vez de digitados à mão.",
        "Seu trabalho é correspondido a você pelo seu identificador do ORCID / OpenAlex, não pelo seu nome, as citações são formatadas de maneira consistente por meio do CSL, e você cura exatamente o que aparece. É gratuito e de código aberto, e o mesmo currículo é exportado para todos os formatos.",
      ],
      stepsHeading: "Como criar um currículo de pesquisador",
      steps: [
        {
          title: "Entre com seu ORCID iD",
          body: "O SigmaCV lê o seu registro público do ORCID e do OpenAlex — sem copiar e colar.",
        },
        {
          title: "Seu registro se monta",
          body: "Publicações, conjuntos de dados, software e seu histórico acadêmico são extraídos e formatados; adicione qualquer coisa que esteja faltando por DOI.",
        },
        {
          title: "Cure e estilize",
          body: "Escolha qual trabalho aparece, escolha um estilo de citações e um modelo e (opcionalmente) ative as métricas normalizadas por campo.",
        },
        {
          title: "Exporte ou publique",
          body: "Exporte para PDF, DOCX, LaTeX, Markdown ou BibTeX — ou publique uma página pública viva que re-sincroniza.",
        },
      ],
      whyHeading: "Por que criar seu currículo de pesquisador com o SigmaCV",
      why: [
        "Um currículo de pesquisador deve refletir com precisão toda a amplitude do seu trabalho acadêmico. O SigmaCV extrai o seu trabalho por identificador — para que nomes comuns e em alfabetos não latinos sejam resolvidos corretamente — formata cada citação por meio de um único motor e mantém o seu próprio nome destacado nas listas de autores.",
        "Ele é gratuito para indivíduos e de código aberto, lê apenas metadados públicos e trata as métricas de forma responsável: desativadas por padrão, opcionais e normalizadas por campo em vez de contagens brutas, em linha com o DORA.",
      ],
      faqExtra: [
        {
          q: "Ele inclui conjuntos de dados e software, e não apenas artigos?",
          a: "Sim. Quando disponíveis, o SigmaCV extrai conjuntos de dados e software (via DataCite / OpenAIRE) junto com suas publicações, para que o seu currículo de pesquisador reflita todos os seus resultados.",
        },
        {
          q: "Posso publicar meu currículo de pesquisador on-line?",
          a: "Sim — você pode publicar uma página pública viva e legível por máquina que re-sincroniza a partir do registro aberto, com consentimento por campo sobre o que é exibido.",
        },
        {
          q: "Posso exportar para BibTeX?",
          a: "Sim — além de PDF, DOCX, LaTeX e Markdown, o SigmaCV exporta suas publicações curadas como BibTeX e CSL-JSON.",
        },
      ],
      relatedHeading: "Ferramentas e formatos de currículo relacionados",
    },
    "phd-cv": {
      intro: [
        "Candidatar-se a um doutorado significa convencer uma comissão do seu potencial de pesquisa, e é no seu currículo que esse argumento é construído. O SigmaCV cria um currículo limpo, com citações formatadas, para sua candidatura ao doutorado a partir do seu registro de pesquisa aberto, de modo que você parte do seu trabalho real — publicações, preprints, pôsteres e projetos — em vez de um modelo em branco.",
        "Seu trabalho é correspondido a você pelo seu ORCID iD, não pelo seu nome, então nada é atribuído de forma incorreta, e você decide exatamente o que a comissão vê. É gratuito e de código aberto, e o mesmo currículo é exportado para PDF, Word, LaTeX ou Markdown.",
      ],
      stepsHeading: "Como criar um currículo de candidatura ao doutorado",
      steps: [
        {
          title: "Entre com seu ORCID iD",
          body: "O SigmaCV lê apenas o seu registro público do ORCID — sem inserção manual do seu trabalho.",
        },
        {
          title: "Seu registro se preenche",
          body: "Publicações, preprints e pôsteres são extraídos do ORCID e do OpenAlex e formatados automaticamente; adicione qualquer coisa que esteja faltando por DOI.",
        },
        {
          title: "Cure para o programa",
          body: "Comece pela experiência de pesquisa, escolha quais itens aparecem e ordene-os para a comissão à qual você está se candidatando.",
        },
        {
          title: "Estilize e exporte",
          body: "Escolha um estilo de citações e um modelo e, em seguida, exporte para PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Por que criar seu currículo de doutorado com o SigmaCV",
      why: [
        "Na etapa de candidatura, seu registro é pequeno e cada item conta, então a precisão e a formatação limpa importam. O SigmaCV extrai seu trabalho por identificador, formata as citações de maneira consistente e permite apresentar resultados iniciais — um preprint, um pôster, uma apresentação em congresso — de forma adequada, e não desajeitada.",
        "Ele é gratuito para indivíduos e de código aberto, lê apenas metadados públicos e nunca inventa nada: você decide exatamente o que a comissão vê, e o mesmo currículo canônico é exportado para todos os formatos.",
      ],
      faqExtra: [
        {
          q: "Qual deve ser o tamanho de um currículo de candidatura ao doutorado?",
          a: "Em geral, cerca de 2 a 4 páginas. Uma experiência de pesquisa clara e alguns resultados representativos valem mais do que enchimento.",
        },
        {
          q: "O que devo destacar se tenho poucas publicações?",
          a: "Comece pela experiência de pesquisa — projetos, métodos, seu papel e os resultados — além de competências, prêmios e apresentações relevantes. É isso que as comissões mais valorizam nesta etapa.",
        },
        {
          q: "Posso adicionar um artigo que ainda não está no meu ORCID?",
          a: "Sim. Você pode adicionar qualquer trabalho pelo seu DOI, e o SigmaCV o formata para combinar com o restante do seu currículo.",
        },
      ],
      relatedHeading: "Outras formas de criar seu currículo",
    },
    "postdoc-cv": {
      intro: [
        "Como pós-doc, você se candidata a bolsas, financiamentos e à sua próxima posição em prazos contínuos, e reformatar seu currículo a cada vez é um desgaste. O SigmaCV cria um currículo atualizado, com citações formatadas, a partir do seu registro de pesquisa aberto — publicações, financiamentos, atividade docente e serviços — para que você mantenha uma única versão canônica e exporte o que cada candidatura exigir.",
        "Seu trabalho é correspondido pelo seu identificador do ORCID / OpenAlex, não pelo seu nome, as citações são formatadas de maneira consistente por meio do CSL, e as métricas permanecem desativadas por padrão e normalizadas por campo quando você opta por usá-las — alinhado ao DORA. É gratuito e de código aberto.",
      ],
      stepsHeading: "Como criar um currículo de pós-doc",
      steps: [
        {
          title: "Entre com seu ORCID iD",
          body: "O SigmaCV lê o seu registro público do ORCID e do OpenAlex — sem copiar e colar a sua lista de publicações.",
        },
        {
          title: "Seu registro se monta",
          body: "Publicações, financiamentos, atividade docente e serviços são extraídos e formatados; adicione qualquer coisa que esteja faltando por DOI.",
        },
        {
          title: "Cure para cada candidatura",
          body: "Escolha qual trabalho aparece e aplique um layout de financiador (NIH, ERC, UKRI…) para candidaturas a financiamentos e bolsas, de forma reversível.",
        },
        {
          title: "Estilize e exporte",
          body: "Escolha um estilo de citações, opcionalmente ative as métricas normalizadas por campo e exporte para PDF, DOCX, LaTeX ou Markdown.",
        },
      ],
      whyHeading: "Por que criar seu currículo de pós-doc com o SigmaCV",
      why: [
        "As candidaturas a pós-doc vêm em ritmo intenso, e cada financiador ou empregador quer um formato ligeiramente diferente. O SigmaCV separa o seu registro da sua apresentação: mantenha um único currículo canônico e reformule-o — layout de financiador, ordem das seções, quais trabalhos aparecem — em um clique, sem reconstruí-lo a cada vez.",
        "Ele é gratuito para indivíduos e de código aberto, correspondendo o seu trabalho por identificador, e trata as métricas de forma responsável: desativadas por padrão, opcionais e normalizadas por campo em vez de contagens brutas, em linha com o DORA.",
      ],
      faqExtra: [
        {
          q: "Ele oferece suporte a formatos de currículo de financiadores?",
          a: "Sim. O SigmaCV tem layouts em um clique para os principais financiadores (NIH, NSF, ERC, UKRI R4RI, SNSF e mais), aplicados de forma reversível ao mesmo currículo canônico.",
        },
        {
          q: "Minhas métricas serão exibidas por padrão?",
          a: "Não. As métricas ficam desativadas por padrão e são opcionais; quando ativadas, o SigmaCV prefere indicadores normalizados por campo e nunca mostra o Fator de Impacto de uma revista.",
        },
        {
          q: "Posso exportar para LaTeX?",
          a: "Sim — o SigmaCV exporta um currículo .tex pronto para compilar mais uma bibliografia .bib, junto com PDF, DOCX e Markdown.",
        },
      ],
      relatedHeading: "Ferramentas e formatos de currículo relacionados",
    },
  },
  "it-IT": {
    "grad-school-cv": {
      intro: [
        "Un CV accademico solido aiuta la tua candidatura alla laurea magistrale, al dottorato o al PhD a distinguersi — ma un modello vuoto è un modo lento per costruirne uno. SigmaCV riunisce un CV curato, con citazioni formattate, a partire dal tuo registro di ricerca aperto, così parti dal tuo lavoro reale: pubblicazioni, preprint, poster e progetti di ricerca.",
        "Il tuo lavoro viene abbinato a te tramite il tuo iD ORCID, non tramite il tuo nome, e decidi tu esattamente cosa vede la commissione di ammissione. È gratuito e open source, e lo stesso CV si esporta in PDF, Word, LaTeX o Markdown.",
      ],
      stepsHeading: "Come creare un CV per la laurea magistrale o il dottorato",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "SigmaCV legge solo il tuo registro ORCID pubblico — nessun modulo vuoto da compilare.",
        },
        {
          title: "Il tuo registro si compila",
          body: "Pubblicazioni, preprint e poster vengono recuperati da ORCID e OpenAlex e formattati; aggiungi ciò che manca tramite DOI.",
        },
        {
          title: "Metti in primo piano l'esperienza di ricerca",
          body: "Dai risalto a progetti, metodi e competenze, e scegli quali voci appaiono per il programma a cui ti candidi.",
        },
        {
          title: "Imposta lo stile ed esporta",
          body: "Scegli uno stile di citazione e un modello, poi esporta in PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Perché creare il tuo CV per la laurea magistrale o il dottorato con SigmaCV",
      why: [
        "Nella fase di candidatura il tuo registro è ridotto, quindi l'accuratezza e una presentazione pulita contano più della lunghezza. SigmaCV formatta correttamente i tuoi primi risultati e mantiene tutto coerente, così un poster o un primo preprint si presenta bene anziché in modo goffo.",
        "È gratuito per i singoli individui e open source, legge solo i metadati pubblici e non inventa mai nulla: decidi tu esattamente cosa vede la commissione, e lo stesso CV canonico si esporta in ogni formato.",
      ],
      faqExtra: [
        {
          q: "Quanto dovrebbe essere lungo un CV per la laurea magistrale o il dottorato?",
          a: "Di solito circa 2–4 pagine. Un'esperienza di ricerca chiara e alcuni risultati rappresentativi valgono più del riempitivo.",
        },
        {
          q: "Cosa dovrei includere se sono all'inizio degli studi?",
          a: "Formazione, esperienza di ricerca e progetti, eventuali pubblicazioni/preprint/poster, competenze pertinenti, premi e referenze — metti in primo piano ciò che mostra il tuo potenziale di ricerca.",
        },
        {
          q: "Posso aggiungere un articolo che non è ancora sul mio ORCID?",
          a: "Sì — aggiungi qualsiasi lavoro tramite il suo DOI e SigmaCV lo formatta in modo coerente con il resto del tuo CV.",
        },
      ],
      relatedHeading: "Altri modi per creare il tuo CV",
    },
    "faculty-cv": {
      intro: [
        "Un CV da docente o per il ruolo è lungo e completo — pubblicazioni, finanziamenti, attività didattica, supervisione e servizio — e tenerlo aggiornato tra fascicoli per le candidature, il ruolo e la promozione è un lavoro vero e proprio. SigmaCV lo riunisce a partire dal tuo registro di ricerca aperto e mantiene un'unica versione canonica che puoi rimodellare per ogni scopo.",
        "Il tuo lavoro viene abbinato tramite il tuo identificativo ORCID / OpenAlex, non tramite il tuo nome, le citazioni sono formattate in modo coerente con CSL, e le metriche restano disattivate per impostazione predefinita e normalizzate per campo quando le attivi — in linea con DORA. È gratuito e open source.",
      ],
      stepsHeading: "Come creare un CV da docente",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "SigmaCV legge il tuo registro ORCID e OpenAlex pubblico — nessun elenco da tenere aggiornato a mano.",
        },
        {
          title: "Il tuo registro completo si assembla",
          body: "Pubblicazioni, finanziamenti, attività didattica e di servizio vengono recuperati e formattati; aggiungi ciò che manca tramite DOI.",
        },
        {
          title: "Applica una struttura adatta allo scopo",
          body: "Passa da un CV completo a un formato di ente finanziatore (NIH, ERC, UKRI…) o a una versione ridotta — in modo reversibile, da un unico registro.",
        },
        {
          title: "Imposta lo stile ed esporta",
          body: "Scegli uno stile di citazione, mostra se vuoi le metriche normalizzate per campo, ed esporta in PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Perché creare il tuo CV da docente con SigmaCV",
      why: [
        "I CV senior sono ampi e costantemente non aggiornati. SigmaCV separa il tuo registro dalla sua presentazione: mantieni un unico CV canonico che si risincronizza dal registro aperto e lo rimodelli — ordine delle sezioni, struttura di ente finanziatore, quali lavori appaiono — senza ricostruirlo per ogni commissione.",
        "È gratuito per i singoli individui e open source, abbina il lavoro tramite identificativo e tratta le metriche in modo responsabile: disattivate per impostazione predefinita, opzionali e normalizzate per campo anziché conteggi grezzi, mai un Impact Factor di rivista — in linea con DORA.",
      ],
      faqExtra: [
        {
          q: "Gestisce un lungo elenco di pubblicazioni?",
          a: "Sì. Le pubblicazioni vengono recuperate automaticamente e formattate in modo coerente; le raggruppi, le ordini e le selezioni, e lo stesso elenco si esporta in ogni formato.",
        },
        {
          q: "Posso mantenere un unico CV e ricavarne le versioni per gli enti finanziatori?",
          a: "Sì — un unico CV canonico, con strutture in un clic per enti finanziatori/ruolo applicate in modo reversibile, così non devi mantenere più copie.",
        },
        {
          q: "Le metriche vengono mostrate per impostazione predefinita?",
          a: "No. Le metriche sono disattivate per impostazione predefinita e opzionali; quando vengono attivate, SigmaCV preferisce gli indicatori normalizzati per campo e non mostra mai un Impact Factor di rivista.",
        },
      ],
      relatedHeading: "Strumenti e formati di CV correlati",
    },
    "research-cv": {
      intro: [
        "Un CV da ricercatore — chiamato anche CV scientifico — è il registro completo del tuo lavoro scientifico. SigmaCV ne crea uno a partire dal tuo registro di ricerca aperto, così le tue pubblicazioni, i dataset, il software e la tua storia accademica vengono riuniti e formattati automaticamente anziché digitati a mano.",
        "Il tuo lavoro viene abbinato a te tramite il tuo identificativo ORCID / OpenAlex, non tramite il tuo nome, le citazioni sono formattate in modo coerente con CSL, e decidi tu esattamente cosa appare. È gratuito e open source, e lo stesso CV si esporta in ogni formato.",
      ],
      stepsHeading: "Come creare un CV da ricercatore",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "SigmaCV legge il tuo registro ORCID e OpenAlex pubblico — nessun copia-incolla.",
        },
        {
          title: "Il tuo registro si assembla",
          body: "Pubblicazioni, dataset, software e la tua storia accademica vengono recuperati e formattati; aggiungi ciò che manca tramite DOI.",
        },
        {
          title: "Seleziona e imposta lo stile",
          body: "Scegli quali lavori appaiono, scegli uno stile di citazione e un modello, e (se vuoi) attiva le metriche normalizzate per campo.",
        },
        {
          title: "Esporta o pubblica",
          body: "Esporta in PDF, DOCX, LaTeX, Markdown o BibTeX — oppure pubblica una pagina pubblica viva che si risincronizza.",
        },
      ],
      whyHeading: "Perché creare il tuo CV da ricercatore con SigmaCV",
      why: [
        "Un CV da ricercatore dovrebbe riflettere accuratamente tutta l'ampiezza del tuo lavoro scientifico. SigmaCV recupera il tuo lavoro tramite identificativo — così i nomi comuni e in alfabeti non latini si risolvono correttamente — formatta ogni citazione con un unico motore e mantiene il tuo nome evidenziato negli elenchi di autori.",
        "È gratuito per i singoli individui e open source, legge solo i metadati pubblici e tratta le metriche in modo responsabile: disattivate per impostazione predefinita, opzionali e normalizzate per campo anziché conteggi grezzi, in linea con DORA.",
      ],
      faqExtra: [
        {
          q: "Include dataset e software, non solo articoli?",
          a: "Sì. Quando disponibili, SigmaCV recupera dataset e software (tramite DataCite / OpenAIRE) insieme alle tue pubblicazioni, così il tuo CV da ricercatore riflette tutti i tuoi risultati.",
        },
        {
          q: "Posso pubblicare il mio CV da ricercatore online?",
          a: "Sì — puoi pubblicare una pagina pubblica viva e leggibile dalle macchine che si risincronizza dal registro aperto, con consenso per ogni campo su ciò che viene mostrato.",
        },
        {
          q: "Posso esportare in BibTeX?",
          a: "Sì — oltre a PDF, DOCX, LaTeX e Markdown, SigmaCV esporta le tue pubblicazioni selezionate in formato BibTeX e CSL-JSON.",
        },
      ],
      relatedHeading: "Strumenti e formati di CV correlati",
    },
    "phd-cv": {
      intro: [
        "Candidarsi a un dottorato significa convincere una commissione del tuo potenziale di ricerca, e il tuo CV è il luogo in cui questo argomento prende forma. SigmaCV crea un CV curato e con citazioni formattate per la candidatura al dottorato a partire dal tuo registro di ricerca aperto, così parti dal tuo lavoro reale — pubblicazioni, preprint, poster e progetti — anziché da un modello vuoto.",
        "Il tuo lavoro viene abbinato a te tramite il tuo iD ORCID, non tramite il tuo nome, così nulla viene attribuito per errore, e decidi tu esattamente cosa vede la commissione. È gratuito e open source, e lo stesso CV si esporta in PDF, Word, LaTeX o Markdown.",
      ],
      stepsHeading: "Come creare un CV per la candidatura al dottorato",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "SigmaCV legge solo il tuo registro ORCID pubblico — nessun inserimento manuale dei tuoi lavori.",
        },
        {
          title: "Il tuo registro si compila",
          body: "Pubblicazioni, preprint e poster vengono recuperati da ORCID e OpenAlex e formattati automaticamente; aggiungi ciò che manca tramite DOI.",
        },
        {
          title: "Seleziona per il programma",
          body: "Metti in primo piano l'esperienza di ricerca, scegli quali voci appaiono e ordinale per la commissione a cui ti candidi.",
        },
        {
          title: "Imposta lo stile ed esporta",
          body: "Scegli uno stile di citazione e un modello, poi esporta in PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Perché creare il tuo CV per il dottorato con SigmaCV",
      why: [
        "Nella fase di candidatura il tuo registro è ridotto e ogni voce conta, quindi l'accuratezza e una formattazione pulita sono importanti. SigmaCV recupera il tuo lavoro tramite identificativo, formatta le citazioni in modo coerente e ti permette di presentare correttamente, anziché in modo goffo, i primi risultati — un preprint, un poster, un intervento a un convegno.",
        "È gratuito per i singoli individui e open source, legge solo i metadati pubblici e non inventa mai nulla: decidi tu esattamente cosa vede la commissione, e lo stesso CV canonico si esporta in ogni formato.",
      ],
      faqExtra: [
        {
          q: "Quanto dovrebbe essere lungo un CV per la candidatura al dottorato?",
          a: "Di solito circa 2–4 pagine. Un'esperienza di ricerca chiara e alcuni risultati rappresentativi valgono più del riempitivo.",
        },
        {
          q: "Cosa dovrei mettere in evidenza se ho poche pubblicazioni?",
          a: "Metti in primo piano l'esperienza di ricerca — progetti, metodi, il tuo ruolo e i risultati — oltre a competenze, premi e presentazioni pertinenti. È ciò che le commissioni considerano di più in questa fase.",
        },
        {
          q: "Posso aggiungere un articolo che non è ancora sul mio ORCID?",
          a: "Sì. Puoi aggiungere qualsiasi lavoro tramite il suo DOI e SigmaCV lo formatta in modo coerente con il resto del tuo CV.",
        },
      ],
      relatedHeading: "Altri modi per creare il tuo CV",
    },
    "postdoc-cv": {
      intro: [
        "Come postdoc ti candidi a borse, finanziamenti e alla tua prossima posizione con scadenze continue, e riformattare il tuo CV ogni volta è un dispendio di energie. SigmaCV crea un CV aggiornato e con citazioni formattate a partire dal tuo registro di ricerca aperto — pubblicazioni, finanziamenti, attività didattica e di servizio — così mantieni un'unica versione canonica ed esporti ciò che serve a ogni candidatura.",
        "Il tuo lavoro viene abbinato tramite il tuo identificativo ORCID / OpenAlex, non tramite il tuo nome, le citazioni sono formattate in modo coerente con CSL, e le metriche restano disattivate per impostazione predefinita e normalizzate per campo quando le attivi — in linea con DORA. È gratuito e open source.",
      ],
      stepsHeading: "Come creare un CV per postdoc",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "SigmaCV legge il tuo registro ORCID e OpenAlex pubblico — nessun copia-incolla del tuo elenco di pubblicazioni.",
        },
        {
          title: "Il tuo registro si assembla",
          body: "Pubblicazioni, finanziamenti, attività didattica e di servizio vengono recuperati e formattati; aggiungi ciò che manca tramite DOI.",
        },
        {
          title: "Seleziona per ogni candidatura",
          body: "Scegli quali lavori appaiono e applica una struttura di ente finanziatore (NIH, ERC, UKRI…) per le candidature a finanziamenti e borse, in modo reversibile.",
        },
        {
          title: "Imposta lo stile ed esporta",
          body: "Scegli uno stile di citazione, attiva se vuoi le metriche normalizzate per campo, ed esporta in PDF, DOCX, LaTeX o Markdown.",
        },
      ],
      whyHeading: "Perché creare il tuo CV per postdoc con SigmaCV",
      why: [
        "Le candidature per postdoc arrivano fitte e veloci, e ogni ente finanziatore o datore di lavoro vuole un formato leggermente diverso. SigmaCV separa il tuo registro dalla sua presentazione: mantieni un unico CV canonico e lo rimodelli — struttura di ente finanziatore, ordine delle sezioni, quali lavori appaiono — con un clic, senza ricostruirlo ogni volta.",
        "È gratuito per i singoli individui e open source, abbina il tuo lavoro tramite identificativo e tratta le metriche in modo responsabile: disattivate per impostazione predefinita, opzionali e normalizzate per campo anziché conteggi grezzi, in linea con DORA.",
      ],
      faqExtra: [
        {
          q: "Supporta i formati di CV degli enti finanziatori?",
          a: "Sì. SigmaCV dispone di strutture in un clic per i principali enti finanziatori (NIH, NSF, ERC, UKRI R4RI, SNSF e altri), applicate in modo reversibile allo stesso CV canonico.",
        },
        {
          q: "Le mie metriche verranno mostrate per impostazione predefinita?",
          a: "No. Le metriche sono disattivate per impostazione predefinita e opzionali; quando vengono attivate, SigmaCV preferisce gli indicatori normalizzati per campo e non mostra mai un Impact Factor di rivista.",
        },
        {
          q: "Posso esportare in LaTeX?",
          a: "Sì — SigmaCV esporta un CV .tex pronto da compilare più una bibliografia .bib, oltre a PDF, DOCX e Markdown.",
        },
      ],
      relatedHeading: "Strumenti e formati di CV correlati",
    },
  },
  "ko-KR": {
    "grad-school-cv": {
      intro: [
        "탄탄한 학술 이력서는 석사, 박사, 대학원 지원을 돋보이게 합니다 — 하지만 빈 템플릿으로 만들기에는 시간이 오래 걸립니다. SigmaCV는 공개된 연구 기록을 바탕으로 인용이 서식화된 깔끔한 이력서를 만들어, 논문, 프리프린트, 포스터, 연구 프로젝트 같은 회원님의 실제 업적에서 시작하게 합니다.",
        "회원님의 업적은 이름이 아니라 ORCID iD로 매칭되며, 입학 심사위원회에 무엇을 보여줄지 정확히 회원님이 선별합니다. 무료이며 오픈 소스이고, 동일한 이력서가 PDF, Word, LaTeX, Markdown으로 내보내집니다.",
      ],
      stepsHeading: "대학원 지원 이력서를 만드는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "SigmaCV는 공개된 ORCID 기록만 읽으며, 채워야 할 빈 양식이 없습니다.",
        },
        {
          title: "기록이 자동으로 채워집니다",
          body: "논문, 프리프린트, 포스터가 ORCID와 OpenAlex에서 가져와져 서식화됩니다. 누락된 항목은 DOI로 추가하세요.",
        },
        {
          title: "연구 경험을 앞세우기",
          body: "프로젝트, 방법, 역량을 전면에 내세우고, 지원하려는 프로그램에 맞게 어떤 항목을 표시할지 선택하세요.",
        },
        {
          title: "스타일 지정 및 내보내기",
          body: "인용 스타일과 템플릿을 고른 뒤 PDF, DOCX, LaTeX, Markdown으로 내보내세요.",
        },
      ],
      whyHeading: "SigmaCV로 대학원 지원 이력서를 만드는 이유",
      why: [
        "지원 단계에서는 기록이 적으므로 분량보다 정확성과 깔끔한 표현이 더 중요합니다. SigmaCV는 회원님의 초기 성과물을 올바르게 서식화하고 모든 항목을 일관되게 유지하여, 포스터나 첫 프리프린트가 어색하지 않고 보기 좋게 읽히도록 합니다.",
        "개인에게 무료이며 오픈 소스이고, 공개 메타데이터만 읽으며, 결코 없는 내용을 지어내지 않습니다. 심사위원회에 무엇을 보여줄지 정확히 회원님이 정하며, 동일한 정규 이력서가 모든 형식으로 내보내집니다.",
      ],
      faqExtra: [
        {
          q: "대학원 지원 이력서는 길이가 얼마나 되어야 하나요?",
          a: "보통 2~4페이지 정도입니다. 분량을 늘리기보다 명확한 연구 경험과 대표적인 성과물 몇 가지가 더 낫습니다.",
        },
        {
          q: "학업 초기 단계라면 무엇을 포함해야 하나요?",
          a: "학력, 연구 경험과 프로젝트, 논문/프리프린트/포스터, 관련 역량, 수상, 추천인 — 연구 잠재력을 보여주는 것을 앞세우세요.",
        },
        {
          q: "아직 ORCID에 없는 논문을 추가할 수 있나요?",
          a: "네 — DOI로 어떤 업적이든 추가할 수 있으며, SigmaCV가 이력서의 나머지와 일치하도록 서식화합니다.",
        },
      ],
      relatedHeading: "이력서를 만드는 다른 방법",
    },
    "faculty-cv": {
      intro: [
        "교수 또는 정년심사 이력서는 길고 포괄적입니다 — 논문, 연구비, 강의, 지도, 봉사 — 그리고 채용, 정년심사, 승진 서류에 걸쳐 최신으로 유지하는 일은 만만치 않습니다. SigmaCV는 이를 공개된 연구 기록에서 모아 만들고, 목적마다 다시 빚어낼 수 있는 하나의 정규 버전을 유지합니다.",
        "회원님의 업적은 이름이 아니라 ORCID / OpenAlex 식별자로 매칭되고, 인용은 CSL을 통해 일관되게 서식화되며, 지표는 기본적으로 꺼져 있고 옵트인할 때에도 필드 정규화되어 — DORA에 부합합니다. 무료이며 오픈 소스입니다.",
      ],
      stepsHeading: "교수 이력서를 만드는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "SigmaCV가 공개된 ORCID와 OpenAlex 기록을 읽으므로 목록을 직접 관리할 필요가 없습니다.",
        },
        {
          title: "전체 기록이 모입니다",
          body: "논문, 연구비, 강의, 봉사가 가져와져 서식화됩니다. 누락된 항목은 DOI로 추가하세요.",
        },
        {
          title: "목적에 맞는 레이아웃 적용하기",
          body: "전체 이력서, 지원기관 형식(NIH, ERC, UKRI…), 또는 간추린 버전 사이를 — 하나의 기록에서 가역적으로 — 전환하세요.",
        },
        {
          title: "스타일 지정 및 내보내기",
          body: "인용 스타일을 고르고, 원하면 필드 정규화 지표를 표시한 뒤 PDF, DOCX, LaTeX, Markdown으로 내보내세요.",
        },
      ],
      whyHeading: "SigmaCV로 교수 이력서를 만드는 이유",
      why: [
        "고경력 이력서는 방대하고 끊임없이 뒤처집니다. SigmaCV는 회원님의 기록과 그 표현을 분리합니다. 공개 기록에서 다시 동기화되는 하나의 정규 이력서를 유지하면서, 섹션 순서, 지원기관 레이아웃, 표시할 업적을 — 위원회마다 다시 만들 필요 없이 — 다시 빚어내세요.",
        "개인에게 무료이며 오픈 소스이고, 업적을 식별자로 매칭하며, 지표를 책임 있게 다룹니다. 기본적으로 꺼져 있고 옵트인 방식이며, 단순 횟수보다 필드 정규화 지표를 선호하고, 결코 저널 임팩트 팩터를 쓰지 않습니다 — DORA에 부합합니다.",
      ],
      faqExtra: [
        {
          q: "긴 논문 목록도 처리할 수 있나요?",
          a: "네. 논문은 자동으로 가져와져 일관되게 서식화됩니다. 회원님이 묶고, 순서를 정하고, 선별하며, 동일한 목록이 모든 형식으로 내보내집니다.",
        },
        {
          q: "하나의 이력서를 유지하면서 지원기관 버전을 만들 수 있나요?",
          a: "네 — 하나의 정규 이력서에 원클릭 지원기관·정년심사 레이아웃이 가역적으로 적용되므로, 여러 사본을 관리하지 않아도 됩니다.",
        },
        {
          q: "지표가 기본으로 표시되나요?",
          a: "아니요. 지표는 기본적으로 꺼져 있고 옵트인 방식입니다. 켜면 SigmaCV는 필드 정규화 지표를 선호하며, 결코 저널 임팩트 팩터를 표시하지 않습니다.",
        },
      ],
      relatedHeading: "관련 이력서 도구 및 형식",
    },
    "research-cv": {
      intro: [
        "연구자 CV — 연구 CV 또는 학술 CV라고도 합니다 — 는 회원님의 학술 업적 전체를 담은 기록입니다. SigmaCV는 이를 공개된 연구 기록에서 만들어, 논문, 데이터셋, 소프트웨어, 학력을 직접 입력하지 않고도 자동으로 모아 서식화합니다.",
        "회원님의 업적은 이름이 아니라 ORCID / OpenAlex 식별자로 매칭되고, 인용은 CSL을 통해 일관되게 서식화되며, 무엇이 표시될지 정확히 회원님이 선별합니다. 무료이며 오픈 소스이고, 동일한 CV가 모든 형식으로 내보내집니다.",
      ],
      stepsHeading: "연구자 CV를 만드는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "SigmaCV가 공개된 ORCID와 OpenAlex 기록을 읽으므로 복사·붙여넣기 할 필요가 없습니다.",
        },
        {
          title: "기록이 모입니다",
          body: "논문, 데이터셋, 소프트웨어, 학력이 가져와져 서식화됩니다. 누락된 항목은 DOI로 추가하세요.",
        },
        {
          title: "선별하고 스타일 지정하기",
          body: "어떤 업적을 표시할지 고르고, 인용 스타일과 템플릿을 선택하며, (원하면) 필드 정규화 지표를 켜세요.",
        },
        {
          title: "내보내기 또는 공개하기",
          body: "PDF, DOCX, LaTeX, Markdown, BibTeX로 내보내거나 — 다시 동기화되는 살아 있는 공개 페이지로 게시하세요.",
        },
      ],
      whyHeading: "SigmaCV로 연구자 CV를 만드는 이유",
      why: [
        "연구자 CV는 회원님 학술 활동의 폭을 정확히 반영해야 합니다. SigmaCV는 업적을 식별자로 가져오므로 — 흔한 이름이나 비라틴 문자 이름도 올바르게 해소되며 — 모든 인용을 하나의 엔진으로 서식화하고, 저자 목록에서 회원님 본인의 이름을 강조 표시합니다.",
        "개인에게 무료이며 오픈 소스이고, 공개 메타데이터만 읽으며, 지표를 책임 있게 다룹니다. 기본적으로 꺼져 있고 옵트인 방식이며, 단순 횟수보다 필드 정규화 지표를 선호해 DORA에 부합합니다.",
      ],
      faqExtra: [
        {
          q: "논문뿐 아니라 데이터셋과 소프트웨어도 포함하나요?",
          a: "네. 가능한 경우 SigmaCV는 논문과 함께 데이터셋과 소프트웨어를(DataCite / OpenAIRE를 통해) 가져오므로, 연구자 CV가 회원님의 모든 성과물을 반영합니다.",
        },
        {
          q: "연구자 CV를 온라인에 공개할 수 있나요?",
          a: "네 — 공개 기록에서 다시 동기화되는, 살아 있고 기계가 읽을 수 있는 공개 페이지를 게시할 수 있으며, 무엇을 표시할지 필드별 동의로 정합니다.",
        },
        {
          q: "BibTeX로 내보낼 수 있나요?",
          a: "네 — SigmaCV는 PDF, DOCX, LaTeX, Markdown과 함께 정리한 논문을 BibTeX 및 CSL-JSON으로 내보냅니다.",
        },
      ],
      relatedHeading: "관련 이력서 도구 및 형식",
    },
    "phd-cv": {
      intro: [
        "박사과정에 지원한다는 것은 심사위원에게 회원님의 연구 잠재력을 설득하는 일이며, 이력서가 바로 그 근거를 제시하는 곳입니다. SigmaCV는 공개된 연구 기록을 바탕으로 인용이 서식화된 깔끔한 박사과정 지원 이력서를 만들어, 빈 템플릿이 아니라 논문, 프리프린트, 포스터, 프로젝트 같은 회원님의 실제 업적에서 시작하게 합니다.",
        "회원님의 업적은 이름이 아니라 ORCID iD로 매칭되므로 어떤 항목도 잘못 귀속되지 않으며, 심사위원에게 무엇을 보여줄지 정확히 회원님이 선별합니다. 무료이며 오픈 소스이고, 동일한 이력서가 PDF, Word, LaTeX, Markdown으로 내보내집니다.",
      ],
      stepsHeading: "박사과정 지원 이력서를 만드는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "SigmaCV는 공개된 ORCID 기록만 읽으며, 회원님의 업적을 수동으로 입력할 필요가 없습니다.",
        },
        {
          title: "기록이 자동으로 채워집니다",
          body: "논문, 프리프린트, 포스터가 ORCID와 OpenAlex에서 가져와져 자동으로 서식화됩니다. 누락된 항목은 DOI로 추가하세요.",
        },
        {
          title: "프로그램에 맞춰 선별하기",
          body: "연구 경험을 앞세우고, 어떤 항목을 표시할지 선택하며, 지원하려는 심사위원에 맞게 순서를 배열하세요.",
        },
        {
          title: "스타일 지정 및 내보내기",
          body: "인용 스타일과 템플릿을 고른 뒤 PDF, DOCX, LaTeX, Markdown으로 내보내세요.",
        },
      ],
      whyHeading: "SigmaCV로 박사과정 이력서를 만드는 이유",
      why: [
        "지원 단계에서는 기록이 적고 모든 항목이 중요하므로 정확성과 깔끔한 서식이 관건입니다. SigmaCV는 회원님의 업적을 식별자로 가져와 인용을 일관되게 서식화하며, 프리프린트, 포스터, 학회 발표 같은 초기 성과물을 어색하지 않고 올바르게 제시할 수 있게 합니다.",
        "개인에게 무료이며 오픈 소스이고, 공개 메타데이터만 읽으며, 결코 없는 내용을 지어내지 않습니다. 심사위원에게 무엇을 보여줄지 정확히 회원님이 선별하며, 동일한 정규 이력서가 모든 형식으로 내보내집니다.",
      ],
      faqExtra: [
        {
          q: "박사과정 지원 이력서는 길이가 얼마나 되어야 하나요?",
          a: "보통 2~4페이지 정도입니다. 분량을 늘리기보다 명확한 연구 경험과 대표적인 성과물 몇 가지가 더 낫습니다.",
        },
        {
          q: "논문이 적다면 무엇을 강조해야 하나요?",
          a: "연구 경험을 앞세우세요 — 프로젝트, 방법, 회원님의 역할과 성과 — 그리고 관련 역량, 수상, 발표를 함께 제시하세요. 이 단계에서 심사위원이 가장 비중 있게 보는 것이 바로 그것입니다.",
        },
        {
          q: "아직 ORCID에 없는 논문을 추가할 수 있나요?",
          a: "네. DOI로 어떤 업적이든 추가할 수 있으며, SigmaCV가 이력서의 나머지와 일치하도록 서식화합니다.",
        },
      ],
      relatedHeading: "이력서를 만드는 다른 방법",
    },
    "postdoc-cv": {
      intro: [
        "박사후연구원으로서 회원님은 수시 마감에 맞춰 펠로십, 연구비, 다음 자리에 지원하게 되며, 매번 이력서 서식을 다시 맞추는 일은 큰 부담입니다. SigmaCV는 공개된 연구 기록 — 논문, 연구비, 강의, 봉사 — 을 바탕으로 인용이 서식화된 최신 이력서를 만들어, 하나의 정규 버전을 유지하면서 각 지원에 필요한 것을 그때그때 내보낼 수 있게 합니다.",
        "회원님의 업적은 이름이 아니라 ORCID / OpenAlex 식별자로 매칭되고, 인용은 CSL을 통해 일관되게 서식화되며, 지표는 기본적으로 꺼져 있고 옵트인할 때에도 필드 정규화되어 — DORA에 부합합니다. 무료이며 오픈 소스입니다.",
      ],
      stepsHeading: "박사후연구원 이력서를 만드는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "SigmaCV가 공개된 ORCID와 OpenAlex 기록을 읽으므로 논문 목록을 복사·붙여넣기 할 필요가 없습니다.",
        },
        {
          title: "기록이 모입니다",
          body: "논문, 연구비, 강의, 봉사가 가져와져 서식화됩니다. 누락된 항목은 DOI로 추가하세요.",
        },
        {
          title: "각 지원에 맞춰 선별하기",
          body: "어떤 업적을 표시할지 선택하고, 연구비 및 펠로십 지원을 위해 지원기관 레이아웃(NIH, ERC, UKRI…)을 가역적으로 적용하세요.",
        },
        {
          title: "스타일 지정 및 내보내기",
          body: "인용 스타일을 고르고, 원하면 필드 정규화 지표를 켠 뒤 PDF, DOCX, LaTeX, Markdown으로 내보내세요.",
        },
      ],
      whyHeading: "SigmaCV로 박사후연구원 이력서를 만드는 이유",
      why: [
        "박사후연구원 지원은 빠르고 빈번하게 이어지며, 지원기관이나 고용주마다 조금씩 다른 형식을 원합니다. SigmaCV는 회원님의 기록과 그 표현을 분리합니다. 하나의 정규 이력서를 유지하면서 매번 다시 만들 필요 없이 클릭 한 번으로 지원기관 레이아웃, 섹션 순서, 표시할 업적을 다시 빚어내세요.",
        "개인에게 무료이며 오픈 소스이고, 회원님의 업적을 식별자로 매칭하며, 지표를 책임 있게 다룹니다. 지표는 기본적으로 꺼져 있고 옵트인 방식이며, 단순 횟수보다 필드 정규화 지표를 선호해 DORA에 부합합니다.",
      ],
      faqExtra: [
        {
          q: "지원기관 이력서 형식을 지원하나요?",
          a: "네. SigmaCV는 주요 지원기관(NIH, NSF, ERC, UKRI R4RI, SNSF 등)을 위한 원클릭 레이아웃을 제공하며, 동일한 정규 이력서에 가역적으로 적용됩니다.",
        },
        {
          q: "내 지표가 기본으로 표시되나요?",
          a: "아니요. 지표는 기본적으로 꺼져 있고 옵트인 방식입니다. 켜면 SigmaCV는 필드 정규화 지표를 선호하며, 결코 저널 임팩트 팩터를 표시하지 않습니다.",
        },
        {
          q: "LaTeX로 내보낼 수 있나요?",
          a: "네 — SigmaCV는 PDF, DOCX, Markdown과 함께 바로 컴파일할 수 있는 .tex 이력서와 .bib 참고문헌을 내보냅니다.",
        },
      ],
      relatedHeading: "관련 이력서 도구 및 형식",
    },
  },
  "ru-RU": {
    "grad-school-cv": {
      intro: [
        "Сильное академическое резюме помогает вашей заявке в магистратуру, аспирантуру или на программу последипломного образования выделиться — но пустой шаблон собирать долго. SigmaCV собирает аккуратное резюме с отформатированными ссылками из вашей открытой научной записи, поэтому вы начинаете с реальных работ: любых публикаций, препринтов, постеров и исследовательских проектов.",
        "Ваши работы сопоставляются с вами по вашему iD ORCID, а не по имени, и вы сами отбираете ровно то, что увидит приёмная комиссия. Это бесплатно и с открытым исходным кодом, и то же самое резюме экспортируется в PDF, Word, LaTeX или Markdown.",
      ],
      stepsHeading: "Как создать резюме для аспирантуры",
      steps: [
        {
          title: "Войдите с помощью вашего iD ORCID",
          body: "SigmaCV считывает только вашу публичную запись ORCID — никакой пустой формы для заполнения.",
        },
        {
          title: "Ваша запись заполняется",
          body: "Любые публикации, препринты и постеры извлекаются из ORCID и OpenAlex и форматируются; добавьте недостающее по DOI.",
        },
        {
          title: "Сделайте упор на научный опыт",
          body: "Поставьте на первое место проекты, методы и навыки и выберите, какие записи отображать для программы, в которую вы подаёте заявку.",
        },
        {
          title: "Оформите и экспортируйте",
          body: "Выберите стиль цитирования и шаблон, затем экспортируйте в PDF, DOCX, LaTeX или Markdown.",
        },
      ],
      whyHeading: "Почему стоит создать резюме для аспирантуры в SigmaCV",
      why: [
        "На этапе поступления ваш профиль невелик, поэтому точность и аккуратное представление важнее объёма. SigmaCV правильно форматирует ваши ранние результаты и сохраняет всё единообразным, так что постер или первый препринт читаются хорошо, а не неуклюже.",
        "Это бесплатно для частных лиц и с открытым исходным кодом, считывает только публичные метаданные и ничего не выдумывает: вы сами решаете, что именно увидит комиссия, и то же каноническое резюме экспортируется в каждый формат.",
      ],
      faqExtra: [
        {
          q: "Каким должен быть объём резюме для аспирантуры?",
          a: "Обычно около 2–4 страниц. Понятный научный опыт и несколько показательных результатов лучше, чем «вода».",
        },
        {
          q: "Что включить, если я в самом начале обучения?",
          a: "Образование, научный опыт и проекты, любые публикации/препринты/постеры, релевантные навыки, награды и рекомендации — на первом месте то, что показывает научный потенциал.",
        },
        {
          q: "Можно ли добавить статью, которой ещё нет в моём ORCID?",
          a: "Да — добавьте любую работу по её DOI, и SigmaCV оформит её в соответствии с остальным резюме.",
        },
      ],
      relatedHeading: "Похожие способы создать резюме",
    },
    "faculty-cv": {
      intro: [
        "Резюме преподавателя или на постоянную позицию объёмное и исчерпывающее — публикации, гранты, преподавание, руководство и общественная работа — и поддерживать его в актуальном виде во всех заявках на должности, постоянную позицию и продвижение — это настоящий труд. SigmaCV собирает его из вашей открытой научной записи и хранит одну каноническую версию, которую вы можете переформировать под каждую цель.",
        "Ваши работы сопоставляются по вашему идентификатору ORCID / OpenAlex, а не по имени, ссылки единообразно форматируются через CSL, а метрики по умолчанию отключены и нормированы по области, когда вы их подключаете, — в соответствии с DORA. Это бесплатно и с открытым исходным кодом.",
      ],
      stepsHeading: "Как создать резюме преподавателя",
      steps: [
        {
          title: "Войдите с помощью вашего iD ORCID",
          body: "SigmaCV считывает вашу публичную запись ORCID и OpenAlex — никакого ведения списка вручную.",
        },
        {
          title: "Ваша полная запись собирается",
          body: "Публикации, гранты, преподавание и общественная работа извлекаются и форматируются; добавьте недостающее по DOI.",
        },
        {
          title: "Примените макет под цель",
          body: "Переключайтесь между полным резюме, форматом грантодателя (NIH, ERC, UKRI…) или сокращённой версией — обратимо, из одной записи.",
        },
        {
          title: "Оформите и экспортируйте",
          body: "Выберите стиль цитирования, при желании покажите нормированные по области метрики и экспортируйте в PDF, DOCX, LaTeX или Markdown.",
        },
      ],
      whyHeading: "Почему стоит создать резюме преподавателя в SigmaCV",
      why: [
        "Резюме старших научных сотрудников объёмны и постоянно устаревают. SigmaCV отделяет вашу запись от её представления: держите одно каноническое резюме, которое повторно синхронизируется с открытой записью, и переформируйте его — порядок разделов, макет грантодателя, какие работы отображать — не пересобирая его для каждой комиссии.",
        "Это бесплатно для частных лиц и с открытым исходным кодом, сопоставляет работы по идентификатору и относится к метрикам ответственно: по умолчанию отключены, подключаются по желанию и нормированы по области вместо сырых подсчётов, никогда не импакт-фактор журнала — в соответствии с DORA.",
      ],
      faqExtra: [
        {
          q: "Справляется ли сервис с длинным списком публикаций?",
          a: "Да. Публикации извлекаются автоматически и форматируются единообразно; вы группируете, упорядочиваете и отбираете их, и тот же список экспортируется в каждый формат.",
        },
        {
          q: "Можно ли держать одно резюме и выводить из него версии для грантодателей?",
          a: "Да — одно каноническое резюме, с макетами грантодателей и для постоянной позиции, применяемыми обратимо в один щелчок, так что вам не нужно поддерживать несколько копий.",
        },
        {
          q: "Показываются ли метрики по умолчанию?",
          a: "Нет. Метрики по умолчанию отключены и подключаются по желанию; при включении SigmaCV предпочитает нормированные по области показатели и никогда не показывает импакт-фактор журнала.",
        },
      ],
      relatedHeading: "Похожие инструменты и форматы резюме",
    },
    "research-cv": {
      intro: [
        "Резюме исследователя — также называемое научным резюме — это полная запись вашей научной работы. SigmaCV собирает его из вашей открытой научной записи, поэтому ваши публикации, наборы данных, программное обеспечение и академическая история собираются и форматируются автоматически, а не вводятся вручную.",
        "Ваши работы сопоставляются с вами по вашему идентификатору ORCID / OpenAlex, а не по имени, ссылки единообразно форматируются через CSL, и вы сами отбираете ровно то, что отображается. Это бесплатно и с открытым исходным кодом, и то же самое резюме экспортируется в каждый формат.",
      ],
      stepsHeading: "Как создать резюме исследователя",
      steps: [
        {
          title: "Войдите с помощью вашего iD ORCID",
          body: "SigmaCV считывает вашу публичную запись ORCID и OpenAlex — никакого копирования-вставки.",
        },
        {
          title: "Ваша запись собирается",
          body: "Публикации, наборы данных, программное обеспечение и ваша академическая история извлекаются и форматируются; добавьте недостающее по DOI.",
        },
        {
          title: "Отберите и оформите",
          body: "Выберите, какие работы отображать, подберите стиль цитирования и шаблон и (при желании) включите нормированные по области метрики.",
        },
        {
          title: "Экспортируйте или опубликуйте",
          body: "Экспортируйте в PDF, DOCX, LaTeX, Markdown или BibTeX — либо опубликуйте живую публичную страницу, которая повторно синхронизируется.",
        },
      ],
      whyHeading: "Почему стоит создать резюме исследователя в SigmaCV",
      why: [
        "Резюме исследователя должно точно отражать всю широту вашей научной деятельности. SigmaCV извлекает ваши работы по идентификатору — так что распространённые имена и имена в нелатинской письменности разрешаются корректно — форматирует каждую ссылку через единый движок и сохраняет ваше собственное имя выделенным в списках авторов.",
        "Это бесплатно для частных лиц и с открытым исходным кодом, считывает только публичные метаданные и относится к метрикам ответственно: по умолчанию отключены, подключаются по желанию и нормированы по области вместо сырых подсчётов, в соответствии с DORA.",
      ],
      faqExtra: [
        {
          q: "Включает ли сервис наборы данных и программное обеспечение, а не только статьи?",
          a: "Да. Где это возможно, SigmaCV извлекает наборы данных и программное обеспечение (через DataCite / OpenAIRE) наряду с вашими публикациями, так что ваше резюме исследователя отражает все ваши результаты.",
        },
        {
          q: "Можно ли опубликовать моё резюме исследователя онлайн?",
          a: "Да — вы можете опубликовать живую, машиночитаемую публичную страницу, которая повторно синхронизируется с открытой записью, с пофайловым согласием на то, что отображается.",
        },
        {
          q: "Можно ли экспортировать в BibTeX?",
          a: "Да — наряду с PDF, DOCX, LaTeX и Markdown, SigmaCV экспортирует ваши отобранные публикации в формате BibTeX и CSL-JSON.",
        },
      ],
      relatedHeading: "Похожие инструменты и форматы резюме",
    },
    "phd-cv": {
      intro: [
        "Поступление в аспирантуру означает убедить комиссию в вашем научном потенциале, и именно в резюме строится это обоснование. SigmaCV создаёт аккуратное резюме с отформатированными ссылками для поступления в аспирантуру из ваших открытых научных записей, так что вы начинаете с реальных работ — публикаций, препринтов, постеров и проектов — а не с пустого шаблона.",
        "Ваши работы сопоставляются с вами по вашему iD ORCID, а не по имени, поэтому ничто не приписывается ошибочно, и вы сами решаете, что именно увидит комиссия. Это бесплатно и с открытым исходным кодом, и то же самое резюме экспортируется в PDF, Word, LaTeX или Markdown.",
      ],
      stepsHeading: "Как создать резюме для поступления в аспирантуру",
      steps: [
        {
          title: "Войдите с помощью вашего iD ORCID",
          body: "SigmaCV считывает только ваши публичные записи в ORCID — никакого ручного ввода ваших работ.",
        },
        {
          title: "Ваша запись заполняется",
          body: "Публикации, препринты и постеры извлекаются из ORCID и OpenAlex и форматируются автоматически; добавьте недостающее по DOI.",
        },
        {
          title: "Отберите под программу",
          body: "Поставьте на первое место научный опыт, выберите, какие записи отображать, и упорядочьте их под комиссию, в которую вы подаёте заявку.",
        },
        {
          title: "Оформите и экспортируйте",
          body: "Выберите стиль цитирования и шаблон, затем экспортируйте в PDF, DOCX, LaTeX или Markdown.",
        },
      ],
      whyHeading: "Почему стоит создать резюме для аспирантуры в SigmaCV",
      why: [
        "На этапе поступления ваш профиль невелик, и каждая запись на счету, поэтому важны точность и аккуратное форматирование. SigmaCV извлекает ваши работы по идентификатору, единообразно форматирует ссылки и позволяет правильно, а не неуклюже представить ранние результаты — препринт, постер, доклад на конференции.",
        "Это бесплатно для частных лиц и с открытым исходным кодом, считывает только публичные метаданные и ничего не выдумывает: вы сами решаете, что именно увидит комиссия, и то же каноническое резюме экспортируется в каждый формат.",
      ],
      faqExtra: [
        {
          q: "Каким должен быть объём резюме при поступлении в аспирантуру?",
          a: "Обычно около 2–4 страниц. Понятный научный опыт и несколько показательных результатов лучше, чем «вода».",
        },
        {
          q: "На что сделать упор, если у меня мало публикаций?",
          a: "Поставьте на первое место научный опыт — проекты, методы, вашу роль и результаты — плюс релевантные навыки, награды и выступления. Именно это комиссии оценивают больше всего на данном этапе.",
        },
        {
          q: "Можно ли добавить статью, которой ещё нет в моём ORCID?",
          a: "Да. Вы можете добавить любую работу по её DOI, и SigmaCV оформит её в соответствии с остальным резюме.",
        },
      ],
      relatedHeading: "Похожие способы создать резюме",
    },
    "postdoc-cv": {
      intro: [
        "Будучи постдоком, вы подаёте заявки на стипендии, гранты и следующую позицию по скользящим дедлайнам, и каждый раз переформатировать резюме — это утомительно. SigmaCV создаёт актуальное резюме с отформатированными ссылками из ваших открытых научных записей — публикаций, грантов, преподавания и общественной работы — так что вы держите одну каноническую версию и экспортируете то, что нужно для каждой заявки.",
        "Ваши работы сопоставляются по вашему идентификатору ORCID / OpenAlex, а не по имени, ссылки единообразно форматируются через CSL, а метрики по умолчанию отключены и нормированы по области, когда вы их всё-таки подключаете, — в соответствии с DORA. Это бесплатно и с открытым исходным кодом.",
      ],
      stepsHeading: "Как создать резюме постдока",
      steps: [
        {
          title: "Войдите с помощью вашего iD ORCID",
          body: "SigmaCV считывает ваши публичные записи в ORCID и OpenAlex — никакого копирования-вставки списка публикаций.",
        },
        {
          title: "Ваша запись собирается",
          body: "Публикации, гранты, преподавание и общественная работа извлекаются и форматируются; добавьте недостающее по DOI.",
        },
        {
          title: "Отберите под каждую заявку",
          body: "Выберите, какие работы отображать, и обратимо примените макет грантодателя (NIH, ERC, UKRI…) для заявок на гранты и стипендии.",
        },
        {
          title: "Оформите и экспортируйте",
          body: "Выберите стиль цитирования, при желании включите нормированные по области метрики и экспортируйте в PDF, DOCX, LaTeX или Markdown.",
        },
      ],
      whyHeading: "Почему стоит создать резюме постдока в SigmaCV",
      why: [
        "Заявки на постдок идут плотно и быстро, и каждый грантодатель или работодатель хочет немного иной формат. SigmaCV отделяет ваш профиль от его представления: держите одно каноническое резюме и переформируйте его — макет грантодателя, порядок разделов, какие работы отображать — одним щелчком, не пересобирая его каждый раз.",
        "Это бесплатно для частных лиц и с открытым исходным кодом, сопоставляет ваши работы по идентификатору и относится к метрикам ответственно: по умолчанию отключены, подключаются по желанию и нормированы по области вместо сырых подсчётов, в соответствии с DORA.",
      ],
      faqExtra: [
        {
          q: "Поддерживаются ли форматы резюме грантодателей?",
          a: "Да. SigmaCV предлагает макеты в один щелчок для крупных грантодателей (NIH, NSF, ERC, UKRI R4RI, SNSF и другие), применяемые обратимо к одному и тому же каноническому резюме.",
        },
        {
          q: "Будут ли мои метрики показываться по умолчанию?",
          a: "Нет. Метрики по умолчанию отключены и подключаются по желанию; при включении SigmaCV предпочитает нормированные по области показатели и никогда не показывает импакт-фактор журнала.",
        },
        {
          q: "Можно ли экспортировать в LaTeX?",
          a: "Да — SigmaCV экспортирует готовое к компиляции резюме в формате .tex плюс библиографию .bib, наряду с PDF, DOCX и Markdown.",
        },
      ],
      relatedHeading: "Похожие инструменты и форматы резюме",
    },
  },
};

/** Localized thin copy for a persona page (falls back to English). */
export function personaPageStrings(page: PersonaPageId, locale: string): LandingPageStrings {
  return PERSONA_PAGES_I18N[asLocale(locale)][page];
}

/** Localized deep content for a persona page (falls back to English). */
export function personaPageContent(page: PersonaPageId, locale: string): LandingPageContent {
  return PERSONA_CONTENT_I18N[asLocale(locale)][page];
}
