import { asLocale, type Locale } from "./index";
import type { LandingPageId, LandingPageStrings } from "./landingPages";
import type { LandingPageContent } from "./landingContent";
import type { PersonaPageId } from "./personaPages";

/**
 * Topic SEO landing pages (C4) — high-intent pages for specific queries that the
 * core pages don't cover head-on (e.g. "CV from Google Scholar", "ERC CV",
 * "import publications to CV"). They reuse the regular landing-page shapes
 * (`LandingPageStrings` + `LandingPageContent`) and are surfaced through the
 * `landingAll` facade, leaving the original pages and personas untouched.
 *
 * Typed Record<Locale, Record<TopicPageId, …>> so a missing locale/page/field is a
 * compile error. Non-English copy was machine-drafted and is flagged for native
 * review (same convention as landingPages.ts / personaPages.ts).
 */

export const TOPIC_PAGE_IDS = [
  "cv-from-google-scholar",
  "erc-cv",
  "import-publications-to-cv",
] as const;
export type TopicPageId = (typeof TOPIC_PAGE_IDS)[number];

/** Cross-links for each topic page (existing landing ids, personas, or topics). */
export const TOPIC_RELATED: Record<
  TopicPageId,
  readonly (LandingPageId | PersonaPageId | TopicPageId)[]
> = {
  "cv-from-google-scholar": ["orcid-to-cv", "openalex-cv", "publication-list"],
  "erc-cv": ["funder-cv-templates", "nih-biosketch", "faculty-cv"],
  "import-publications-to-cv": ["publication-list", "orcid-to-cv", "openalex-cv"],
};

const TOPIC_PAGES_I18N: Record<Locale, Record<TopicPageId, LandingPageStrings>> = {
  "en-US": {
    "cv-from-google-scholar": {
      metaTitle: "CV from Google Scholar? Build one from ORCID & OpenAlex",
      metaDescription:
        "Google Scholar has no API to build a CV from. SigmaCV builds your academic CV from the open record instead — your ORCID and OpenAlex profile — and exports to PDF, DOCX, LaTeX or Markdown. Free and open source.",
      navLabel: "Google Scholar → CV",
      heading: "Building a CV from Google Scholar: the open alternative",
      subhead:
        "Google Scholar doesn't offer a way to export your profile into a CV. SigmaCV builds one from the open research record — your ORCID iD and OpenAlex profile — ready to curate and export.",
      bullets: [
        "Google Scholar has no public API or CV export; SigmaCV uses your ORCID and OpenAlex record instead — open, and matched by identifier.",
        "Consistent CSL citations exported to PDF, DOCX, LaTeX, Markdown or BibTeX.",
        "Free for individuals and open source; you curate exactly what appears.",
      ],
      cta: "Build your CV from the open record",
      faq: [
        {
          q: "Can SigmaCV import my Google Scholar profile?",
          a: "No — Google Scholar has no public API or export for this, so no tool can reliably build a CV from it. SigmaCV uses the open alternatives, ORCID and OpenAlex, which cover most of the same publications and match your work by identifier.",
        },
        {
          q: "What if my work is on Scholar but not OpenAlex?",
          a: "OpenAlex has very broad coverage, but you can add any missing work to your SigmaCV by its DOI, and it will be formatted to match the rest of your CV.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "erc-cv": {
      metaTitle: "ERC CV: build it from ORCID & OpenAlex",
      metaDescription:
        "Build an ERC CV from your ORCID and OpenAlex record. SigmaCV applies an ERC-style layout, formats citations, and exports to PDF, DOCX or LaTeX. Free and open source.",
      navLabel: "ERC CV",
      heading: "Build an ERC CV from your research record",
      subhead:
        "Sign in with ORCID and SigmaCV assembles your open research record into an ERC-style CV — one of 58 one-click funder layouts — ready to curate and export.",
      bullets: [
        "An ERC-style layout among 58 one-click funder, institution and industry formats, applied reversibly.",
        "Publications, funding and more pulled from ORCID and OpenAlex — matched by identifier, never by name.",
        "Consistent CSL citations exported to PDF, DOCX or LaTeX; free for individuals and open source.",
      ],
      cta: "Build your ERC CV",
      faq: [
        {
          q: "Is this the official ERC CV template?",
          a: "SigmaCV provides an ERC-style layout modelled on the European Research Council's structure. Always check the ERC's current official forms and instructions for your specific call before submitting.",
        },
        {
          q: "Can I switch between funder formats?",
          a: "Yes — layouts are applied reversibly to the same canonical CV, so you can move between ERC, UKRI R4RI, NIH, NSF, SNSF and more without rebuilding it.",
        },
      ],
      backLink: "← Back to SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "Import publications to your CV automatically",
      metaDescription:
        "Import your publications into a CV automatically from ORCID and OpenAlex. SigmaCV formats every citation and exports to PDF, DOCX, LaTeX, Markdown or BibTeX. Free and open source.",
      navLabel: "Import publications",
      heading: "Import your publications into a CV automatically",
      subhead:
        "Sign in with ORCID and SigmaCV imports your publications from the open record — no copy-pasting — formats them consistently, and builds them into a CV ready to curate and export.",
      bullets: [
        "Publications imported automatically from ORCID and OpenAlex — matched by identifier, never by name.",
        "Every citation formatted through one CSL style; export to PDF, DOCX, LaTeX, Markdown or BibTeX.",
        "Free for individuals and open source; add anything missing by DOI.",
      ],
      cta: "Import your publications",
      faq: [
        {
          q: "Where does SigmaCV import publications from?",
          a: "From the open scholarly record — primarily OpenAlex and your ORCID profile, with gap-fill from Crossref — matched to you by identifier. You can also add any work by its DOI.",
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
    "cv-from-google-scholar": {
      metaTitle: "从 Google Scholar 生成简历？改用 ORCID 和 OpenAlex 来生成",
      metaDescription:
        "Google Scholar 没有可用于生成简历的 API。SigmaCV 改为依据公开的学术记录——您的 ORCID 和 OpenAlex 档案——生成您的学术简历，并导出为 PDF、DOCX、LaTeX 或 Markdown。免费且开源。",
      navLabel: "Google Scholar → 简历",
      heading: "从 Google Scholar 生成简历：开放的替代方案",
      subhead:
        "Google Scholar 并不提供将您的档案导出为简历的方式。SigmaCV 改为依据公开的学术记录——您的 ORCID iD 和 OpenAlex 档案——生成简历，随时可整理和导出。",
      bullets: [
        "Google Scholar 没有公开 API，也无法导出简历；SigmaCV 改用您的 ORCID 和 OpenAlex 记录——开放，且通过标识符匹配。",
        "以 CSL 提供一致的引用，并导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。",
        "对个人免费且开源；您可精确决定显示哪些内容。",
      ],
      cta: "依据公开记录生成您的简历",
      faq: [
        {
          q: "SigmaCV 能导入我的 Google Scholar 档案吗？",
          a: "不能——Google Scholar 没有为此提供公开 API 或导出功能，因此没有任何工具能可靠地据此生成简历。SigmaCV 使用开放的替代方案 ORCID 和 OpenAlex，它们涵盖了大部分相同的论文，并通过标识符将成果匹配到您。",
        },
        {
          q: "如果我的成果在 Scholar 上但不在 OpenAlex 上怎么办？",
          a: "OpenAlex 的覆盖范围非常广，但您可以通过 DOI 将任何缺失的成果添加到您的 SigmaCV 中，它会被格式化以与您简历的其余部分保持一致。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "erc-cv": {
      metaTitle: "ERC 简历：依据 ORCID 和 OpenAlex 生成",
      metaDescription:
        "依据您的 ORCID 和 OpenAlex 记录生成 ERC 简历。SigmaCV 应用 ERC 风格的布局、格式化引用，并导出为 PDF、DOCX 或 LaTeX。免费且开源。",
      navLabel: "ERC 简历",
      heading: "依据您的学术记录生成 ERC 简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可将您公开的学术记录汇总为一份 ERC 风格的简历——58 种一键式资助机构布局之一——随时可整理和导出。",
      bullets: [
        "在 58 种一键式资助机构、高校和行业格式中提供 ERC 风格的布局，以可逆方式应用。",
        "论文、资助等从 ORCID 和 OpenAlex 提取——通过标识符匹配，绝不通过姓名。",
        "以 CSL 提供一致的引用，并导出为 PDF、DOCX 或 LaTeX；对个人免费且开源。",
      ],
      cta: "生成您的 ERC 简历",
      faq: [
        {
          q: "这是 ERC 官方的简历模板吗？",
          a: "SigmaCV 提供一种参照欧洲研究理事会（ERC）结构设计的 ERC 风格布局。在提交之前，请务必查看 ERC 针对您具体项目征集的现行官方表格和说明。",
        },
        {
          q: "我可以在不同资助机构格式之间切换吗？",
          a: "可以——布局以可逆方式应用于同一份规范简历，因此您可以在 ERC、UKRI R4RI、NIH、NSF、SNSF 等之间切换，而无需重新构建。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "自动将论文导入您的简历",
      metaDescription:
        "从 ORCID 和 OpenAlex 自动将您的论文导入简历。SigmaCV 格式化每一条引用，并导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。免费且开源。",
      navLabel: "导入论文",
      heading: "自动将您的论文导入简历",
      subhead:
        "使用 ORCID 登录，SigmaCV 即可从公开记录导入您的论文——无需复制粘贴——以一致的方式格式化它们，并构建为一份随时可整理和导出的简历。",
      bullets: [
        "论文自动从 ORCID 和 OpenAlex 导入——通过标识符匹配，绝不通过姓名。",
        "每一条引用都通过同一种 CSL 样式格式化；导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。",
        "对个人免费且开源；通过 DOI 添加任何缺失内容。",
      ],
      cta: "导入您的论文",
      faq: [
        {
          q: "SigmaCV 从哪里导入论文？",
          a: "从公开的学术记录——主要是 OpenAlex 和您的 ORCID 档案，并由 Crossref 补充缺口——通过标识符匹配到您。您也可以通过 DOI 添加任何成果。",
        },
        {
          q: "它免费吗？",
          a: "是的。SigmaCV 对个人免费，并采用 Apache-2.0 许可证开源，且仅读取公开的研究元数据。",
        },
      ],
      backLink: "← 返回 SigmaCV",
    },
  },
  "es-ES": {
    "cv-from-google-scholar": {
      metaTitle: "¿CV desde Google Scholar? Créalo a partir de ORCID y OpenAlex",
      metaDescription:
        "Google Scholar no tiene una API con la que crear un CV. SigmaCV construye tu CV académico a partir del registro abierto —tu ORCID y tu perfil de OpenAlex— y exporta a PDF, DOCX, LaTeX o Markdown. Gratis y de código abierto.",
      navLabel: "Google Scholar → CV",
      heading: "Crear un CV desde Google Scholar: la alternativa abierta",
      subhead:
        "Google Scholar no ofrece ninguna forma de exportar tu perfil a un CV. SigmaCV crea uno a partir del registro científico abierto —tu iD ORCID y tu perfil de OpenAlex—, listo para seleccionar y exportar.",
      bullets: [
        "Google Scholar no tiene API pública ni exportación de CV; SigmaCV usa en su lugar tu registro de ORCID y OpenAlex —abierto e identificado por identificador.",
        "Citas CSL coherentes exportadas a PDF, DOCX, LaTeX, Markdown o BibTeX.",
        "Gratis para particulares y de código abierto; tú seleccionas exactamente lo que aparece.",
      ],
      cta: "Crea tu CV a partir del registro abierto",
      faq: [
        {
          q: "¿Puede SigmaCV importar mi perfil de Google Scholar?",
          a: "No: Google Scholar no tiene API pública ni exportación para esto, así que ninguna herramienta puede crear un CV a partir de él de forma fiable. SigmaCV usa las alternativas abiertas, ORCID y OpenAlex, que cubren la mayoría de las mismas publicaciones e identifican tu trabajo por identificador.",
        },
        {
          q: "¿Y si mi trabajo está en Scholar pero no en OpenAlex?",
          a: "OpenAlex tiene una cobertura muy amplia, pero puedes añadir a tu SigmaCV cualquier trabajo que falte mediante su DOI, y se le dará formato para que encaje con el resto de tu CV.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "erc-cv": {
      metaTitle: "CV para el ERC: créalo a partir de ORCID y OpenAlex",
      metaDescription:
        "Crea un CV para el ERC a partir de tu registro de ORCID y OpenAlex. SigmaCV aplica un diseño al estilo del ERC, da formato a las citas y exporta a PDF, DOCX o LaTeX. Gratis y de código abierto.",
      navLabel: "CV ERC",
      heading: "Crea un CV para el ERC a partir de tu registro de investigación",
      subhead:
        "Inicia sesión con ORCID y SigmaCV reúne tu registro científico abierto en un CV al estilo del ERC —uno de los 58 diseños de financiador en un clic—, listo para seleccionar y exportar.",
      bullets: [
        "Un diseño al estilo del ERC entre 58 formatos de financiador, institución e industria en un clic, aplicado de forma reversible.",
        "Publicaciones, financiación y más, extraídas de ORCID y OpenAlex, identificadas por identificador, nunca por nombre.",
        "Citas CSL coherentes exportadas a PDF, DOCX o LaTeX; gratis para particulares y de código abierto.",
      ],
      cta: "Crea tu CV para el ERC",
      faq: [
        {
          q: "¿Es esta la plantilla oficial de CV del ERC?",
          a: "SigmaCV ofrece un diseño al estilo del ERC inspirado en la estructura del European Research Council. Consulta siempre los formularios y las instrucciones oficiales vigentes del ERC para tu convocatoria concreta antes de presentar la solicitud.",
        },
        {
          q: "¿Puedo cambiar entre formatos de financiadores?",
          a: "Sí: los diseños se aplican de forma reversible al mismo CV canónico, así que puedes pasar entre el ERC, UKRI R4RI, NIH, NSF, SNSF y más sin reconstruirlo.",
        },
      ],
      backLink: "← Volver a SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "Importa publicaciones a tu CV automáticamente",
      metaDescription:
        "Importa tus publicaciones a un CV automáticamente desde ORCID y OpenAlex. SigmaCV da formato a cada cita y exporta a PDF, DOCX, LaTeX, Markdown o BibTeX. Gratis y de código abierto.",
      navLabel: "Importar publicaciones",
      heading: "Importa tus publicaciones a un CV automáticamente",
      subhead:
        "Inicia sesión con ORCID y SigmaCV importa tus publicaciones del registro abierto —sin copiar y pegar—, les da formato coherente y las reúne en un CV listo para seleccionar y exportar.",
      bullets: [
        "Publicaciones importadas automáticamente desde ORCID y OpenAlex, identificadas por identificador, nunca por nombre.",
        "Cada cita formateada mediante un único estilo CSL; exporta a PDF, DOCX, LaTeX, Markdown o BibTeX.",
        "Gratis para particulares y de código abierto; añade lo que falte por DOI.",
      ],
      cta: "Importa tus publicaciones",
      faq: [
        {
          q: "¿De dónde importa SigmaCV las publicaciones?",
          a: "Del registro científico abierto —principalmente OpenAlex y tu perfil de ORCID, con relleno de huecos desde Crossref—, identificadas contigo por identificador. También puedes añadir cualquier trabajo por su DOI.",
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
    "cv-from-google-scholar": {
      metaTitle: "Un CV depuis Google Scholar ? Construisez-le depuis ORCID et OpenAlex",
      metaDescription:
        "Google Scholar n'offre aucune API pour en construire un CV. SigmaCV construit plutôt votre CV académique à partir du dossier ouvert — votre ORCID et votre profil OpenAlex — et exporte en PDF, DOCX, LaTeX ou Markdown. Gratuit et open source.",
      navLabel: "Google Scholar → CV",
      heading: "Construire un CV depuis Google Scholar : l'alternative ouverte",
      subhead:
        "Google Scholar n'offre aucun moyen d'exporter votre profil vers un CV. SigmaCV en construit un à partir du dossier scientifique ouvert — votre iD ORCID et votre profil OpenAlex — prêt à sélectionner et à exporter.",
      bullets: [
        "Google Scholar n'a ni API publique ni export de CV ; SigmaCV utilise plutôt votre dossier ORCID et OpenAlex — ouvert, et apparié par identifiant.",
        "Citations CSL cohérentes exportées en PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        "Gratuit pour les particuliers et open source ; vous choisissez exactement ce qui apparaît.",
      ],
      cta: "Construisez votre CV depuis le dossier ouvert",
      faq: [
        {
          q: "SigmaCV peut-il importer mon profil Google Scholar ?",
          a: "Non — Google Scholar n'a ni API publique ni export pour cela, donc aucun outil ne peut construire un CV à partir de lui de manière fiable. SigmaCV utilise les alternatives ouvertes, ORCID et OpenAlex, qui couvrent l'essentiel des mêmes publications et apparient vos travaux par identifiant.",
        },
        {
          q: "Et si mes travaux sont sur Scholar mais pas sur OpenAlex ?",
          a: "OpenAlex a une couverture très large, mais vous pouvez ajouter à votre SigmaCV tout travail manquant par son DOI, et il sera mis en forme pour s'accorder au reste de votre CV.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "erc-cv": {
      metaTitle: "CV ERC : construisez-le depuis ORCID et OpenAlex",
      metaDescription:
        "Construisez un CV ERC à partir de votre dossier ORCID et OpenAlex. SigmaCV applique une mise en page de style ERC, met en forme les citations et exporte en PDF, DOCX ou LaTeX. Gratuit et open source.",
      navLabel: "CV ERC",
      heading: "Construisez un CV ERC à partir de votre dossier de recherche",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV assemble votre dossier scientifique ouvert en un CV de style ERC — l'une des 58 mises en page de financeur en un clic — prêt à sélectionner et à exporter.",
      bullets: [
        "Une mise en page de style ERC parmi 58 formats de financeur, d'institution et d'industrie en un clic, appliqués de manière réversible.",
        "Publications, financements et plus encore récupérés depuis ORCID et OpenAlex — appariés par identifiant, jamais par nom.",
        "Citations CSL cohérentes exportées en PDF, DOCX ou LaTeX ; gratuit pour les particuliers et open source.",
      ],
      cta: "Construisez votre CV ERC",
      faq: [
        {
          q: "S'agit-il du modèle de CV ERC officiel ?",
          a: "SigmaCV fournit une mise en page de style ERC modelée sur la structure du Conseil européen de la recherche. Vérifiez toujours les formulaires et consignes officiels en vigueur de l'ERC pour votre appel précis avant de soumettre.",
        },
        {
          q: "Puis-je passer d'un format de financeur à l'autre ?",
          a: "Oui — les mises en page sont appliquées de manière réversible au même CV canonique, vous pouvez donc passer entre ERC, UKRI R4RI, NIH, NSF, SNSF et plus encore sans le reconstruire.",
        },
      ],
      backLink: "← Retour à SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "Importez automatiquement vos publications dans votre CV",
      metaDescription:
        "Importez automatiquement vos publications dans un CV depuis ORCID et OpenAlex. SigmaCV met en forme chaque citation et exporte en PDF, DOCX, LaTeX, Markdown ou BibTeX. Gratuit et open source.",
      navLabel: "Importer des publications",
      heading: "Importez automatiquement vos publications dans un CV",
      subhead:
        "Connectez-vous avec ORCID et SigmaCV importe vos publications depuis le dossier ouvert — sans copier-coller — les met en forme de façon cohérente et les assemble en un CV prêt à sélectionner et à exporter.",
      bullets: [
        "Publications importées automatiquement depuis ORCID et OpenAlex — appariées par identifiant, jamais par nom.",
        "Chaque citation mise en forme via un seul style CSL ; export en PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        "Gratuit pour les particuliers et open source ; ajoutez ce qui manque par son DOI.",
      ],
      cta: "Importez vos publications",
      faq: [
        {
          q: "D'où SigmaCV importe-t-il les publications ?",
          a: "Depuis le dossier scientifique ouvert — principalement OpenAlex et votre profil ORCID, complété par Crossref — apparié à vous par identifiant. Vous pouvez aussi ajouter n'importe quel travail par son DOI.",
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
    "cv-from-google-scholar": {
      metaTitle: "Lebenslauf aus Google Scholar? Erstellen Sie ihn aus ORCID & OpenAlex",
      metaDescription:
        "Google Scholar bietet keine API, aus der sich ein Lebenslauf erstellen ließe. SigmaCV erstellt Ihren akademischen Lebenslauf stattdessen aus dem offenen Forschungsverzeichnis — Ihrer ORCID und Ihrem OpenAlex-Profil — und exportiert als PDF, DOCX, LaTeX oder Markdown. Kostenlos und quelloffen.",
      navLabel: "Google Scholar → Lebenslauf",
      heading: "Einen Lebenslauf aus Google Scholar erstellen: die offene Alternative",
      subhead:
        "Google Scholar bietet keine Möglichkeit, Ihr Profil in einen Lebenslauf zu exportieren. SigmaCV erstellt einen aus dem offenen Forschungsverzeichnis — Ihrer ORCID iD und Ihrem OpenAlex-Profil — bereit zum Auswählen und Exportieren.",
      bullets: [
        "Google Scholar hat keine öffentliche API und keinen Lebenslauf-Export; SigmaCV nutzt stattdessen Ihr ORCID- und OpenAlex-Verzeichnis — offen und über Kennungen zugeordnet.",
        "Einheitliche CSL-Zitate, exportiert als PDF, DOCX, LaTeX, Markdown oder BibTeX.",
        "Kostenlos für Einzelpersonen und quelloffen; Sie bestimmen genau, was erscheint.",
      ],
      cta: "Lebenslauf aus dem offenen Verzeichnis erstellen",
      faq: [
        {
          q: "Kann SigmaCV mein Google-Scholar-Profil importieren?",
          a: "Nein — Google Scholar hat dafür keine öffentliche API und keinen Export, daher kann kein Werkzeug zuverlässig einen Lebenslauf daraus erstellen. SigmaCV nutzt die offenen Alternativen ORCID und OpenAlex, die die meisten derselben Publikationen abdecken und Ihre Arbeiten über Kennungen zuordnen.",
        },
        {
          q: "Was, wenn eine Arbeit bei Scholar steht, aber nicht in OpenAlex?",
          a: "OpenAlex hat eine sehr breite Abdeckung, aber Sie können jede fehlende Arbeit über ihren DOI zu Ihrem SigmaCV hinzufügen, und sie wird passend zum Rest Ihres Lebenslaufs formatiert.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "erc-cv": {
      metaTitle: "ERC-Lebenslauf: aus ORCID & OpenAlex erstellen",
      metaDescription:
        "Erstellen Sie einen ERC-Lebenslauf aus Ihrem ORCID- und OpenAlex-Verzeichnis. SigmaCV wendet ein Layout im ERC-Stil an, formatiert Zitate und exportiert als PDF, DOCX oder LaTeX. Kostenlos und quelloffen.",
      navLabel: "ERC-Lebenslauf",
      heading: "Einen ERC-Lebenslauf aus Ihrem Forschungsverzeichnis erstellen",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV fügt Ihr offenes Forschungsverzeichnis zu einem Lebenslauf im ERC-Stil zusammen — eines von 58 Förder-Layouts mit einem Klick — bereit zum Auswählen und Exportieren.",
      bullets: [
        "Ein Layout im ERC-Stil unter 58 Förderer-, Institutions- und Industrieformaten mit einem Klick, reversibel angewendet.",
        "Publikationen, Förderungen und mehr aus ORCID und OpenAlex — über Kennungen zugeordnet, niemals über den Namen.",
        "Einheitliche CSL-Zitate, exportiert als PDF, DOCX oder LaTeX; kostenlos für Einzelpersonen und quelloffen.",
      ],
      cta: "Ihren ERC-Lebenslauf erstellen",
      faq: [
        {
          q: "Ist das die offizielle ERC-Lebenslaufvorlage?",
          a: "SigmaCV bietet ein Layout im ERC-Stil, das an der Struktur des European Research Council orientiert ist. Prüfen Sie vor der Einreichung für Ihre konkrete Ausschreibung stets die aktuellen offiziellen Formulare und Anweisungen des ERC.",
        },
        {
          q: "Kann ich zwischen Förderformaten wechseln?",
          a: "Ja — Layouts werden reversibel auf denselben kanonischen Lebenslauf angewendet, sodass Sie zwischen ERC, UKRI R4RI, NIH, NSF, SNSF und weiteren wechseln können, ohne ihn neu aufzubauen.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "Publikationen automatisch in Ihren Lebenslauf importieren",
      metaDescription:
        "Importieren Sie Ihre Publikationen automatisch aus ORCID und OpenAlex in einen Lebenslauf. SigmaCV formatiert jedes Zitat und exportiert als PDF, DOCX, LaTeX, Markdown oder BibTeX. Kostenlos und quelloffen.",
      navLabel: "Publikationen importieren",
      heading: "Ihre Publikationen automatisch in einen Lebenslauf importieren",
      subhead:
        "Melden Sie sich mit ORCID an, und SigmaCV importiert Ihre Publikationen aus dem offenen Verzeichnis — ohne Kopieren und Einfügen —, formatiert sie einheitlich und fügt sie zu einem Lebenslauf zusammen, bereit zum Auswählen und Exportieren.",
      bullets: [
        "Publikationen automatisch aus ORCID und OpenAlex importiert — über Kennungen zugeordnet, niemals über den Namen.",
        "Jedes Zitat über einen einzigen CSL-Stil formatiert; Export als PDF, DOCX, LaTeX, Markdown oder BibTeX.",
        "Kostenlos für Einzelpersonen und quelloffen; fügen Sie Fehlendes per DOI hinzu.",
      ],
      cta: "Ihre Publikationen importieren",
      faq: [
        {
          q: "Woher importiert SigmaCV Publikationen?",
          a: "Aus dem offenen wissenschaftlichen Verzeichnis — in erster Linie OpenAlex und Ihrem ORCID-Profil, mit Lückenfüllung aus Crossref — Ihnen über Kennungen zugeordnet. Sie können außerdem jede Arbeit über ihren DOI hinzufügen.",
        },
        {
          q: "Ist es kostenlos?",
          a: "Ja. SigmaCV ist kostenlos für Einzelpersonen und quelloffen unter der Apache-2.0-Lizenz und liest ausschließlich öffentliche Forschungsmetadaten.",
        },
      ],
      backLink: "← Zurück zu SigmaCV",
    },
  },
  "ja-JP": {
    "cv-from-google-scholar": {
      metaTitle: "Google Scholar から CV を？ ORCID と OpenAlex から作成",
      metaDescription:
        "Google Scholar には CV を作るための API がありません。SigmaCV は代わりに公開された記録——あなたの ORCID と OpenAlex プロフィール——から学術 CV を作成し、PDF・DOCX・LaTeX・Markdown に書き出します。無料・オープンソース。",
      navLabel: "Google Scholar → CV",
      heading: "Google Scholar から CV を作る：オープンな代替手段",
      subhead:
        "Google Scholar には、プロフィールを CV に書き出す手段がありません。SigmaCV は代わりに公開された研究記録——あなたの ORCID iD と OpenAlex プロフィール——から CV を作成し、整理してそのまま書き出せます。",
      bullets: [
        "Google Scholar には公開 API も CV の書き出しもありません。SigmaCV は代わりにあなたの ORCID と OpenAlex の記録——オープンで、識別子で照合——を使います。",
        "一貫した CSL 引用を PDF・DOCX・LaTeX・Markdown・BibTeX に書き出し。",
        "個人には無料でオープンソース。表示する内容はあなたが正確に選べます。",
      ],
      cta: "公開された記録から CV を作成",
      faq: [
        {
          q: "SigmaCV は私の Google Scholar プロフィールを取り込めますか？",
          a: "いいえ——Google Scholar にはこのための公開 API も書き出しもないため、どのツールも確実にそこから CV を作ることはできません。SigmaCV はオープンな代替手段である ORCID と OpenAlex を使います。これらは同じ論文の大半をカバーし、あなたの業績を識別子で照合します。",
        },
        {
          q: "Scholar にあって OpenAlex にない業績はどうなりますか？",
          a: "OpenAlex は非常に広範にカバーしていますが、不足している業績はその DOI で SigmaCV に追加でき、CV の他の部分に合わせて整形されます。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "erc-cv": {
      metaTitle: "ERC CV：ORCID と OpenAlex から作成",
      metaDescription:
        "あなたの ORCID と OpenAlex の記録から ERC CV を作成します。SigmaCV が ERC 形式のレイアウトを適用し、引用を整形して、PDF・DOCX・LaTeX に書き出します。無料・オープンソース。",
      navLabel: "ERC CV",
      heading: "あなたの研究記録から ERC CV を作成",
      subhead:
        "ORCID でサインインすると、SigmaCV があなたの公開された研究記録を ERC 形式の CV——58 種のワンクリック助成機関レイアウトの一つ——にまとめます。整理してそのまま書き出せます。",
      bullets: [
        "58 種のワンクリック助成機関・機関・業界フォーマットの中の ERC 形式レイアウトを、可逆的に適用。",
        "論文・助成その他を ORCID と OpenAlex から取得——名前ではなく識別子で照合します。",
        "一貫した CSL 引用を PDF・DOCX・LaTeX に書き出し。個人には無料でオープンソース。",
      ],
      cta: "ERC CV を作成",
      faq: [
        {
          q: "これは ERC の公式 CV テンプレートですか？",
          a: "SigmaCV は欧州研究会議（ERC）の構造をモデルにした ERC 形式のレイアウトを提供します。提出前には必ず、ご自身の公募に対応する ERC の現行の公式様式と指示を確認してください。",
        },
        {
          q: "助成機関フォーマット間を切り替えられますか？",
          a: "はい——レイアウトは同一の正規 CV に可逆的に適用されるため、作り直すことなく ERC・UKRI R4RI・NIH・NSF・SNSF などの間を移動できます。",
        },
      ],
      backLink: "← SigmaCV に戻る",
    },
    "import-publications-to-cv": {
      metaTitle: "論文を CV に自動でインポート",
      metaDescription:
        "ORCID と OpenAlex から論文を CV に自動でインポートします。SigmaCV がすべての引用を整形し、PDF・DOCX・LaTeX・Markdown・BibTeX に書き出します。無料・オープンソース。",
      navLabel: "論文をインポート",
      heading: "論文を CV に自動でインポート",
      subhead:
        "ORCID でサインインすると、SigmaCV が公開された記録からあなたの論文をインポートし——コピー＆ペースト不要——一貫して整形し、整理・書き出しができる CV にまとめます。",
      bullets: [
        "論文は ORCID と OpenAlex から自動インポート——名前ではなく識別子で照合します。",
        "すべての引用は一つの CSL スタイルで整形。PDF・DOCX・LaTeX・Markdown・BibTeX に書き出し。",
        "個人には無料でオープンソース。不足しているものは DOI で追加できます。",
      ],
      cta: "論文をインポート",
      faq: [
        {
          q: "SigmaCV はどこから論文をインポートしますか？",
          a: "公開された学術記録から——主に OpenAlex とあなたの ORCID プロフィール、Crossref による補完を加えて——識別子であなたに照合します。任意の業績をその DOI で追加することもできます。",
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
    "cv-from-google-scholar": {
      metaTitle: "Currículo do Google Scholar? Crie um a partir do ORCID e do OpenAlex",
      metaDescription:
        "O Google Scholar não tem API para criar um currículo. Em vez disso, o SigmaCV monta seu currículo acadêmico a partir do registro aberto — seu ORCID e seu perfil no OpenAlex — e exporta para PDF, DOCX, LaTeX ou Markdown. Gratuito e de código aberto.",
      navLabel: "Google Scholar → currículo",
      heading: "Criar um currículo a partir do Google Scholar: a alternativa aberta",
      subhead:
        "O Google Scholar não oferece uma forma de exportar seu perfil para um currículo. O SigmaCV monta um a partir do registro de pesquisa aberto — seu iD ORCID e seu perfil no OpenAlex — pronto para curar e exportar.",
      bullets: [
        "O Google Scholar não tem API pública nem exportação de currículo; em vez disso, o SigmaCV usa seu registro do ORCID e do OpenAlex — aberto e correspondido por identificador.",
        "Citações CSL consistentes exportadas para PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        "Gratuito para indivíduos e de código aberto; você cura exatamente o que aparece.",
      ],
      cta: "Crie seu currículo a partir do registro aberto",
      faq: [
        {
          q: "O SigmaCV pode importar meu perfil do Google Scholar?",
          a: "Não — o Google Scholar não tem API pública nem exportação para isso, então nenhuma ferramenta consegue criar um currículo a partir dele de forma confiável. O SigmaCV usa as alternativas abertas, ORCID e OpenAlex, que cobrem a maioria das mesmas publicações e correspondem seu trabalho por identificador.",
        },
        {
          q: "E se meu trabalho estiver no Scholar, mas não no OpenAlex?",
          a: "O OpenAlex tem uma cobertura muito ampla, mas você pode adicionar qualquer trabalho ausente ao seu SigmaCV pelo DOI, e ele será formatado para combinar com o restante do seu currículo.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "erc-cv": {
      metaTitle: "Currículo ERC: monte-o a partir do ORCID e do OpenAlex",
      metaDescription:
        "Monte um currículo ERC a partir do seu registro do ORCID e do OpenAlex. O SigmaCV aplica um layout no estilo ERC, formata as citações e exporta para PDF, DOCX ou LaTeX. Gratuito e de código aberto.",
      navLabel: "Currículo ERC",
      heading: "Monte um currículo ERC a partir do seu registro de pesquisa",
      subhead:
        "Entre com o ORCID e o SigmaCV reúne seu registro de pesquisa aberto em um currículo no estilo ERC — um dos 58 layouts de financiador em um clique — pronto para curar e exportar.",
      bullets: [
        "Um layout no estilo ERC entre 58 formatos de financiador, instituição e indústria em um clique, aplicados de forma reversível.",
        "Publicações, financiamentos e mais extraídos do ORCID e do OpenAlex — correspondidos por identificador, nunca por nome.",
        "Citações CSL consistentes exportadas para PDF, DOCX ou LaTeX; gratuito para indivíduos e de código aberto.",
      ],
      cta: "Monte seu currículo ERC",
      faq: [
        {
          q: "Este é o modelo oficial de currículo do ERC?",
          a: "O SigmaCV oferece um layout no estilo ERC, baseado na estrutura do Conselho Europeu de Pesquisa (ERC). Sempre verifique os formulários e as instruções oficiais atuais do ERC para a sua chamada específica antes de enviar.",
        },
        {
          q: "Posso alternar entre formatos de financiadores?",
          a: "Sim — os layouts são aplicados de forma reversível ao mesmo currículo canônico, então você pode alternar entre ERC, UKRI R4RI, NIH, NSF, SNSF e mais sem montá-lo de novo.",
        },
      ],
      backLink: "← Voltar ao SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "Importe publicações para seu currículo automaticamente",
      metaDescription:
        "Importe suas publicações para um currículo automaticamente a partir do ORCID e do OpenAlex. O SigmaCV formata cada citação e exporta para PDF, DOCX, LaTeX, Markdown ou BibTeX. Gratuito e de código aberto.",
      navLabel: "Importar publicações",
      heading: "Importe suas publicações para um currículo automaticamente",
      subhead:
        "Entre com o ORCID e o SigmaCV importa suas publicações do registro aberto — sem copiar e colar —, formata-as de maneira consistente e as monta em um currículo pronto para curar e exportar.",
      bullets: [
        "Publicações importadas automaticamente do ORCID e do OpenAlex — correspondidas por identificador, nunca por nome.",
        "Cada citação formatada por um único estilo CSL; exporte para PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        "Gratuito para indivíduos e de código aberto; adicione qualquer coisa ausente pelo DOI.",
      ],
      cta: "Importe suas publicações",
      faq: [
        {
          q: "De onde o SigmaCV importa as publicações?",
          a: "Do registro científico aberto — principalmente o OpenAlex e seu perfil do ORCID, com complemento de lacunas pelo Crossref — correspondido a você por identificador. Você também pode adicionar qualquer trabalho pelo DOI.",
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
    "cv-from-google-scholar": {
      metaTitle: "CV da Google Scholar? Creane uno da ORCID e OpenAlex",
      metaDescription:
        "Google Scholar non offre alcuna API da cui creare un CV. SigmaCV crea invece il tuo CV accademico dal registro aperto — il tuo ORCID e il tuo profilo OpenAlex — ed esporta in PDF, DOCX, LaTeX o Markdown. Gratuito e open source.",
      navLabel: "Google Scholar → CV",
      heading: "Creare un CV da Google Scholar: l'alternativa aperta",
      subhead:
        "Google Scholar non offre un modo per esportare il tuo profilo in un CV. SigmaCV ne crea uno dal registro di ricerca aperto — il tuo iD ORCID e il tuo profilo OpenAlex — pronto da selezionare ed esportare.",
      bullets: [
        "Google Scholar non ha alcuna API pubblica né esportazione di CV; SigmaCV usa invece il tuo registro ORCID e OpenAlex — aperto, e abbinato tramite identificativo.",
        "Citazioni CSL coerenti esportate in PDF, DOCX, LaTeX, Markdown o BibTeX.",
        "Gratuito per i singoli individui e open source; decidi tu esattamente cosa appare.",
      ],
      cta: "Crea il tuo CV dal registro aperto",
      faq: [
        {
          q: "SigmaCV può importare il mio profilo Google Scholar?",
          a: "No — Google Scholar non ha alcuna API pubblica né esportazione per questo, quindi nessuno strumento può creare un CV da esso in modo affidabile. SigmaCV usa le alternative aperte, ORCID e OpenAlex, che coprono la maggior parte delle stesse pubblicazioni e abbinano i tuoi lavori tramite identificativo.",
        },
        {
          q: "E se un mio lavoro è su Scholar ma non su OpenAlex?",
          a: "OpenAlex ha una copertura molto ampia, ma puoi aggiungere al tuo SigmaCV qualsiasi lavoro mancante tramite il suo DOI, e verrà formattato per corrispondere al resto del tuo CV.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "erc-cv": {
      metaTitle: "CV ERC: crealo da ORCID e OpenAlex",
      metaDescription:
        "Crea un CV ERC a partire dal tuo registro ORCID e OpenAlex. SigmaCV applica una struttura in stile ERC, formatta le citazioni ed esporta in PDF, DOCX o LaTeX. Gratuito e open source.",
      navLabel: "CV ERC",
      heading: "Crea un CV ERC dal tuo registro di ricerca",
      subhead:
        "Accedi con ORCID e SigmaCV assembla il tuo registro di ricerca aperto in un CV in stile ERC — una delle 58 strutture di ente finanziatore applicabili in un clic — pronto da selezionare ed esportare.",
      bullets: [
        "Una struttura in stile ERC tra 58 formati in un clic per enti finanziatori, istituzioni e industria, applicata in modo reversibile.",
        "Pubblicazioni, finanziamenti e altro recuperati da ORCID e OpenAlex — abbinati tramite identificativo, mai tramite il nome.",
        "Citazioni CSL coerenti esportate in PDF, DOCX o LaTeX; gratuito per i singoli individui e open source.",
      ],
      cta: "Crea il tuo CV ERC",
      faq: [
        {
          q: "È questo il modello ufficiale di CV ERC?",
          a: "SigmaCV fornisce una struttura in stile ERC modellata sulla struttura dell'European Research Council. Verifica sempre i moduli e le istruzioni ufficiali attuali dell'ERC per il tuo specifico bando prima di inviare la candidatura.",
        },
        {
          q: "Posso passare da un formato di ente finanziatore all'altro?",
          a: "Sì — le strutture vengono applicate in modo reversibile allo stesso CV canonico, quindi puoi spostarti tra ERC, UKRI R4RI, NIH, NSF, SNSF e altri senza ricostruirlo.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "Importa automaticamente le pubblicazioni nel tuo CV",
      metaDescription:
        "Importa automaticamente le tue pubblicazioni in un CV da ORCID e OpenAlex. SigmaCV formatta ogni citazione ed esporta in PDF, DOCX, LaTeX, Markdown o BibTeX. Gratuito e open source.",
      navLabel: "Importa pubblicazioni",
      heading: "Importa automaticamente le tue pubblicazioni in un CV",
      subhead:
        "Accedi con ORCID e SigmaCV importa le tue pubblicazioni dal registro aperto — senza copia-incolla — le formatta in modo coerente e le assembla in un CV pronto da selezionare ed esportare.",
      bullets: [
        "Pubblicazioni importate automaticamente da ORCID e OpenAlex — abbinate tramite identificativo, mai tramite il nome.",
        "Ogni citazione formattata tramite un unico stile CSL; esporta in PDF, DOCX, LaTeX, Markdown o BibTeX.",
        "Gratuito per i singoli individui e open source; aggiungi tramite DOI ciò che manca.",
      ],
      cta: "Importa le tue pubblicazioni",
      faq: [
        {
          q: "Da dove importa le pubblicazioni SigmaCV?",
          a: "Dal registro scientifico aperto — principalmente OpenAlex e il tuo profilo ORCID, con integrazione da Crossref — abbinate a te tramite identificativo. Puoi anche aggiungere qualsiasi lavoro tramite il suo DOI.",
        },
        {
          q: "È gratuito?",
          a: "Sì. SigmaCV è gratuito per i singoli individui e open source con licenza Apache-2.0, e legge solo i metadati pubblici della ricerca.",
        },
      ],
      backLink: "← Torna a SigmaCV",
    },
  },
  "ko-KR": {
    "cv-from-google-scholar": {
      metaTitle: "Google Scholar로 이력서를? ORCID와 OpenAlex로 만드세요",
      metaDescription:
        "Google Scholar에는 이력서를 만들 수 있는 API가 없습니다. SigmaCV는 대신 공개된 기록 — 회원님의 ORCID와 OpenAlex 프로필 — 으로 학술 이력서를 만들고 PDF, DOCX, LaTeX, Markdown으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "Google Scholar → 이력서",
      heading: "Google Scholar로 이력서 만들기: 열린 대안",
      subhead:
        "Google Scholar는 프로필을 이력서로 내보내는 방법을 제공하지 않습니다. SigmaCV는 공개된 연구 기록 — 회원님의 ORCID iD와 OpenAlex 프로필 — 으로 이력서를 만들어, 바로 정리하고 내보낼 수 있게 합니다.",
      bullets: [
        "Google Scholar에는 공개 API나 이력서 내보내기가 없습니다. SigmaCV는 대신 회원님의 ORCID와 OpenAlex 기록을 사용합니다 — 공개되어 있고 식별자로 매칭됩니다.",
        "일관된 CSL 인용을 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보냅니다.",
        "개인에게 무료이며 오픈 소스입니다. 무엇을 표시할지 정확히 선택할 수 있습니다.",
      ],
      cta: "공개 기록으로 이력서 만들기",
      faq: [
        {
          q: "SigmaCV가 제 Google Scholar 프로필을 가져올 수 있나요?",
          a: "아니요 — Google Scholar에는 이를 위한 공개 API나 내보내기가 없으므로, 어떤 도구도 그것으로 이력서를 안정적으로 만들 수 없습니다. SigmaCV는 열린 대안인 ORCID와 OpenAlex를 사용하며, 이들은 동일한 논문의 대부분을 포함하고 회원님의 업적을 식별자로 매칭합니다.",
        },
        {
          q: "제 업적이 Scholar에는 있지만 OpenAlex에는 없으면 어떻게 하나요?",
          a: "OpenAlex는 매우 폭넓은 커버리지를 갖지만, 누락된 업적은 DOI로 SigmaCV에 추가할 수 있으며 나머지 이력서와 동일한 서식으로 정리됩니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "erc-cv": {
      metaTitle: "ERC CV: ORCID와 OpenAlex로 만드세요",
      metaDescription:
        "회원님의 ORCID와 OpenAlex 기록으로 ERC CV를 만드세요. SigmaCV가 ERC 양식 레이아웃을 적용하고 인용을 서식화하여 PDF, DOCX, LaTeX으로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "ERC CV",
      heading: "연구 기록으로 ERC CV 만들기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 연구 기록을 ERC 양식의 CV로 구성합니다 — 58가지 원클릭 지원기관 레이아웃 중 하나로, 바로 정리하고 내보낼 수 있습니다.",
      bullets: [
        "58가지 원클릭 지원기관·기관·산업 형식 중 하나인 ERC 양식 레이아웃을 가역적으로 적용합니다.",
        "논문, 연구비 등을 ORCID와 OpenAlex에서 가져옵니다 — 이름이 아니라 식별자로 매칭합니다.",
        "일관된 CSL 인용을 PDF, DOCX, LaTeX으로 내보냅니다. 개인에게 무료이며 오픈 소스입니다.",
      ],
      cta: "ERC CV 만들기",
      faq: [
        {
          q: "이것이 공식 ERC CV 템플릿인가요?",
          a: "SigmaCV는 European Research Council의 구조를 본떠 만든 ERC 양식 레이아웃을 제공합니다. 제출 전에는 반드시 해당 공모에 맞는 ERC의 현행 공식 양식과 안내를 확인하세요.",
        },
        {
          q: "지원기관 형식 간에 전환할 수 있나요?",
          a: "네 — 레이아웃은 동일한 정규 이력서에 가역적으로 적용되므로, 다시 만들지 않고도 ERC, UKRI R4RI, NIH, NSF, SNSF 등 사이를 오갈 수 있습니다.",
        },
      ],
      backLink: "← SigmaCV로 돌아가기",
    },
    "import-publications-to-cv": {
      metaTitle: "논문을 이력서로 자동으로 가져오기",
      metaDescription:
        "ORCID와 OpenAlex에서 논문을 이력서로 자동으로 가져오세요. SigmaCV가 모든 인용을 서식화하여 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보냅니다. 무료이며 오픈 소스입니다.",
      navLabel: "논문 가져오기",
      heading: "논문을 이력서로 자동으로 가져오기",
      subhead:
        "ORCID로 로그인하면 SigmaCV가 공개된 기록에서 회원님의 논문을 가져와 — 복사·붙여넣기 없이 — 일관되게 서식화하고, 바로 정리하고 내보낼 수 있는 이력서로 구성합니다.",
      bullets: [
        "논문을 ORCID와 OpenAlex에서 자동으로 가져옵니다 — 이름이 아니라 식별자로 매칭합니다.",
        "모든 인용을 하나의 CSL 스타일로 서식화하고 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보냅니다.",
        "개인에게 무료이며 오픈 소스입니다. 누락된 것은 DOI로 추가할 수 있습니다.",
      ],
      cta: "논문 가져오기",
      faq: [
        {
          q: "SigmaCV는 논문을 어디에서 가져오나요?",
          a: "공개된 학술 기록에서 — 주로 OpenAlex와 회원님의 ORCID 프로필에서, Crossref로 빈틈을 채워 — 식별자로 회원님과 매칭하여 가져옵니다. DOI로 어떤 업적이든 추가할 수도 있습니다.",
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
    "cv-from-google-scholar": {
      metaTitle: "Резюме из Google Scholar? Создайте его из ORCID и OpenAlex",
      metaDescription:
        "У Google Scholar нет API, из которого можно было бы построить резюме. SigmaCV вместо этого формирует ваше академическое резюме из открытой записи — вашего ORCID и профиля OpenAlex — и экспортирует в PDF, DOCX, LaTeX или Markdown. Бесплатно и с открытым исходным кодом.",
      navLabel: "Google Scholar → резюме",
      heading: "Создание резюме из Google Scholar: открытая альтернатива",
      subhead:
        "Google Scholar не предлагает способа экспортировать ваш профиль в резюме. SigmaCV формирует его из открытой научной записи — вашего iD ORCID и профиля OpenAlex — готовое к отбору и экспорту.",
      bullets: [
        "У Google Scholar нет публичного API или экспорта резюме; SigmaCV вместо этого использует вашу запись в ORCID и OpenAlex — открытую и сопоставляемую по идентификатору.",
        "Единообразные CSL-ссылки, экспортируемые в PDF, DOCX, LaTeX, Markdown или BibTeX.",
        "Бесплатно для частных лиц и с открытым исходным кодом; вы сами решаете, что именно отображать.",
      ],
      cta: "Создайте резюме из открытой записи",
      faq: [
        {
          q: "Может ли SigmaCV импортировать мой профиль Google Scholar?",
          a: "Нет — у Google Scholar нет публичного API или экспорта для этого, поэтому ни один инструмент не может надёжно построить из него резюме. SigmaCV использует открытые альтернативы — ORCID и OpenAlex, — которые охватывают большинство тех же публикаций и сопоставляют ваши работы по идентификатору.",
        },
        {
          q: "Что делать, если работа есть в Scholar, но нет в OpenAlex?",
          a: "OpenAlex имеет очень широкое покрытие, но вы можете добавить любую недостающую работу в SigmaCV по её DOI, и она будет отформатирована в едином стиле с остальной частью вашего резюме.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "erc-cv": {
      metaTitle: "Резюме для ERC: создайте его из ORCID и OpenAlex",
      metaDescription:
        "Создайте резюме для ERC из ваших записей в ORCID и OpenAlex. SigmaCV применяет макет в стиле ERC, форматирует ссылки и экспортирует в PDF, DOCX или LaTeX. Бесплатно и с открытым исходным кодом.",
      navLabel: "Резюме для ERC",
      heading: "Создайте резюме для ERC из вашей научной записи",
      subhead:
        "Войдите через ORCID, и SigmaCV соберёт вашу открытую научную запись в резюме в стиле ERC — один из 58 макетов грантодателей «в один щелчок» — готовое к отбору и экспорту.",
      bullets: [
        "Макет в стиле ERC — один из 58 форматов «в один щелчок» для грантодателей, учреждений и индустрии, применяемых обратимо.",
        "Публикации, финансирование и другое подтягиваются из ORCID и OpenAlex — сопоставление по идентификатору, никогда по имени.",
        "Единообразные CSL-ссылки, экспортируемые в PDF, DOCX или LaTeX; бесплатно для частных лиц и с открытым исходным кодом.",
      ],
      cta: "Создать резюме для ERC",
      faq: [
        {
          q: "Это официальный шаблон резюме ERC?",
          a: "SigmaCV предоставляет макет в стиле ERC, смоделированный по структуре Европейского исследовательского совета. Перед подачей всегда сверяйтесь с актуальными официальными формами и инструкциями ERC для вашего конкретного конкурса.",
        },
        {
          q: "Можно ли переключаться между форматами грантодателей?",
          a: "Да — макеты применяются обратимо к одному и тому же каноническому резюме, поэтому вы можете переходить между ERC, UKRI R4RI, NIH, NSF, SNSF и другими, не пересобирая его.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
    "import-publications-to-cv": {
      metaTitle: "Импортируйте публикации в резюме автоматически",
      metaDescription:
        "Импортируйте свои публикации в резюме автоматически из ORCID и OpenAlex. SigmaCV форматирует каждую ссылку и экспортирует в PDF, DOCX, LaTeX, Markdown или BibTeX. Бесплатно и с открытым исходным кодом.",
      navLabel: "Импорт публикаций",
      heading: "Импортируйте свои публикации в резюме автоматически",
      subhead:
        "Войдите через ORCID, и SigmaCV импортирует ваши публикации из открытой записи — без копирования-вставки, — единообразно отформатирует их и соберёт в резюме, готовое к отбору и экспорту.",
      bullets: [
        "Публикации импортируются автоматически из ORCID и OpenAlex — сопоставление по идентификатору, никогда по имени.",
        "Каждая ссылка форматируется через единый стиль CSL; экспорт в PDF, DOCX, LaTeX, Markdown или BibTeX.",
        "Бесплатно для частных лиц и с открытым исходным кодом; добавьте недостающее по DOI.",
      ],
      cta: "Импортировать публикации",
      faq: [
        {
          q: "Откуда SigmaCV импортирует публикации?",
          a: "Из открытой научной записи — в первую очередь из OpenAlex и вашего профиля ORCID, с восполнением пробелов из Crossref, — сопоставляя их с вами по идентификатору. Вы также можете добавить любую работу по её DOI.",
        },
        {
          q: "Это бесплатно?",
          a: "Да. SigmaCV бесплатен для частных лиц и имеет открытый исходный код по лицензии Apache-2.0, и он считывает только публичные метаданные исследований.",
        },
      ],
      backLink: "← Назад к SigmaCV",
    },
  },
};

const TOPIC_CONTENT_I18N: Record<Locale, Record<TopicPageId, LandingPageContent>> = {
  "en-US": {
    "cv-from-google-scholar": {
      intro: [
        "Many researchers keep their publication list on Google Scholar and want to turn it into a CV — but Google Scholar offers no public API or export to build one from, so no tool can do that reliably. The good news: there is an open route that works.",
        "SigmaCV builds your academic CV from the open research record — your ORCID iD and your OpenAlex profile — which together cover most of what is on a typical Scholar profile, matched to you by identifier rather than name. Anything missing you can add by DOI.",
      ],
      stepsHeading: "How to build your CV without a Google Scholar export",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "Instead of Google Scholar, SigmaCV reads your public ORCID record (free to create at orcid.org if you don't have one).",
        },
        {
          title: "Your publications import from OpenAlex",
          body: "SigmaCV resolves your OpenAlex author profile and pulls your works — broad, open coverage comparable to a Scholar profile.",
        },
        {
          title: "Fill any gaps by DOI",
          body: "If a paper on your Scholar profile isn't in OpenAlex, add it by its DOI; it is formatted to match.",
        },
        {
          title: "Curate and export",
          body: "Pick a citation style and template, then export to PDF, DOCX, LaTeX or Markdown — or publish a living page.",
        },
      ],
      whyHeading: "Why ORCID + OpenAlex, not Google Scholar",
      why: [
        "Google Scholar is convenient for discovery but closed: there is no API or bulk export, and it matches by name, which mixes up common-named authors. ORCID and OpenAlex are open, identifier-based, and built to be reused — exactly what a tool needs to assemble an accurate CV.",
        "SigmaCV is free for individuals and open source, reads only public metadata, and matches your work by ORCID / OpenAlex identifier, so your CV reflects your work and not a namesake's.",
      ],
      faqExtra: [
        {
          q: "Does Google Scholar have an API?",
          a: "No. Google Scholar provides no official public API or export, which is why CVs can't be built directly from it. ORCID and OpenAlex are the open, reusable alternatives.",
        },
        {
          q: "How do I get an ORCID iD?",
          a: "Register free at orcid.org in about a minute. It is the identifier SigmaCV — and many publishers and funders — use to find your work reliably.",
        },
        {
          q: "Will my OpenAlex record match my Scholar list?",
          a: "Usually very closely — OpenAlex has broad coverage. Where it differs, you curate what appears and add anything missing by DOI.",
        },
      ],
      relatedHeading: "Related ways to build your CV",
    },
    "erc-cv": {
      intro: [
        "Applying to the European Research Council means presenting your CV in the ERC's expected structure. SigmaCV assembles your open research record and applies an ERC-style layout, so you start from your real publications and funding rather than a blank form.",
        "It is one of 58 one-click funder, institution and industry layouts, applied reversibly to a single canonical CV — so you can prepare an ERC CV and a different funder's CV from the same record. Always follow the ERC's current official guidance for your call.",
      ],
      stepsHeading: "How to build an ERC CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "SigmaCV reads your public ORCID and OpenAlex record — no manual entry.",
        },
        {
          title: "Apply the ERC layout",
          body: "Choose the ERC-style layout; it reshapes your canonical CV into the expected structure, reversibly.",
        },
        {
          title: "Curate for the call",
          body: "Select the publications and details that fit the specific ERC call.",
        },
        {
          title: "Export",
          body: "Export to PDF, DOCX or LaTeX, with consistent citations throughout.",
        },
      ],
      whyHeading: "Why build your ERC CV with SigmaCV",
      why: [
        "Funder CVs differ in structure, not in your underlying record. SigmaCV separates the two: your data lives in one canonical CV, and the ERC layout is a presentation applied on top — so switching from an ERC CV to another funder's format is a click, not a rebuild.",
        "It is free for individuals and open source, matches your work by identifier, and keeps citations consistent. Always confirm the ERC's current official template and rules before you submit.",
      ],
      faqExtra: [
        {
          q: "Which other funder formats are supported?",
          a: "58 one-click layouts spanning funders, institutions and industry — including UKRI R4RI, the Royal Society, SNSF, NIH and NSF alongside ERC — each filled from your open research record.",
        },
        {
          q: "Will switching layouts lose my edits?",
          a: "No. Layouts apply reversibly to the same canonical CV, so your curation is preserved as you move between formats.",
        },
        {
          q: "Does it guarantee ERC compliance?",
          a: "No tool can — funder rules change. SigmaCV gives you an ERC-style starting point; always check the ERC's current official forms and instructions for your specific call.",
        },
      ],
      relatedHeading: "Related funder CV tools",
    },
    "import-publications-to-cv": {
      intro: [
        "Re-typing your publication list into a CV is slow and error-prone. SigmaCV imports your publications automatically from the open research record — sign in with ORCID and your works are pulled in, formatted, and assembled into a CV.",
        "Everything is matched to you by identifier (ORCID / OpenAlex ID), not by name, so you don't inherit a namesake's papers, and every citation is formatted through one CSL style for consistency across every export.",
      ],
      stepsHeading: "How to import publications into your CV",
      steps: [
        {
          title: "Sign in with your ORCID iD",
          body: "SigmaCV reads your public ORCID record and resolves your OpenAlex profile.",
        },
        {
          title: "Publications import automatically",
          body: "Your works are pulled from OpenAlex and ORCID and turned into formatted CV entries — no copy-paste.",
        },
        {
          title: "Add anything missing by DOI",
          body: "If a paper isn't found, add it by its DOI and it is formatted to match.",
        },
        {
          title: "Curate and export",
          body: "Choose which works appear and in what order, then export to PDF, DOCX, LaTeX, Markdown or BibTeX.",
        },
      ],
      whyHeading: "Why import from the open record",
      why: [
        "Importing by identifier from open sources is both faster and more accurate than typing or name-based search: it avoids the misattributions that plague common and non-Latin-script names, and it keeps your list current as the open record updates.",
        "SigmaCV is free for individuals and open source, formats every reference through one CSL engine, and lets you export the same curated list to PDF, DOCX, LaTeX, Markdown, BibTeX and CSL-JSON.",
      ],
      faqExtra: [
        {
          q: "Can I import from Google Scholar?",
          a: "No — Google Scholar has no public API. SigmaCV imports from the open alternatives, ORCID and OpenAlex, and you can add anything missing by DOI.",
        },
        {
          q: "Does it import by name?",
          a: "No — by author identifier (ORCID / OpenAlex ID), which avoids the false matches common with shared or transliterated names.",
        },
        {
          q: "Can I export the imported list as BibTeX?",
          a: "Yes — alongside PDF, DOCX, LaTeX and Markdown, SigmaCV exports your curated publications as BibTeX and CSL-JSON.",
        },
      ],
      relatedHeading: "Related ways to build your CV",
    },
  },
  "zh-CN": {
    "cv-from-google-scholar": {
      intro: [
        "许多研究者将论文列表保存在 Google Scholar 上，并希望把它变成一份简历——但 Google Scholar 没有提供可据此生成简历的公开 API 或导出功能，因此没有任何工具能可靠地做到这一点。好消息是：有一条行之有效的开放路径。",
        "SigmaCV 依据公开的学术记录——您的 ORCID iD 和您的 OpenAlex 档案——生成您的学术简历，两者合起来涵盖了典型 Scholar 档案上的大部分内容，并通过标识符而非姓名将其匹配到您。任何缺失的内容都可以通过 DOI 添加。",
      ],
      stepsHeading: "如何在没有 Google Scholar 导出的情况下生成您的简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 读取您公开的 ORCID 记录，而不是 Google Scholar（如果您还没有，可在 orcid.org 免费创建）。",
        },
        {
          title: "您的论文从 OpenAlex 导入",
          body: "SigmaCV 解析您的 OpenAlex 作者档案并提取您的成果——开放且覆盖广泛，可与 Scholar 档案相媲美。",
        },
        {
          title: "通过 DOI 补齐任何缺口",
          body: "如果您 Scholar 档案上的某篇论文不在 OpenAlex 中，可通过其 DOI 添加；它会被格式化以保持一致。",
        },
        {
          title: "整理并导出",
          body: "选择一种引用样式和模板，然后导出为 PDF、DOCX、LaTeX 或 Markdown——或发布一个实时页面。",
        },
      ],
      whyHeading: "为什么选择 ORCID + OpenAlex，而非 Google Scholar",
      why: [
        "Google Scholar 便于发现文献，但它是封闭的：没有 API 或批量导出，而且它通过姓名匹配，会把同名作者混在一起。ORCID 和 OpenAlex 是开放的、基于标识符的，并且生来就是为了被复用——这正是工具汇总一份准确简历所需要的。",
        "SigmaCV 对个人免费且开源，仅读取公开的元数据，并通过 ORCID / OpenAlex 标识符匹配您的成果，因此您的简历反映的是您本人的工作，而非同名者的工作。",
      ],
      faqExtra: [
        {
          q: "Google Scholar 有 API 吗？",
          a: "没有。Google Scholar 不提供官方的公开 API 或导出功能，这正是无法直接据此生成简历的原因。ORCID 和 OpenAlex 是开放、可复用的替代方案。",
        },
        {
          q: "我如何获取 ORCID iD？",
          a: "在 orcid.org 免费注册，大约一分钟即可完成。它是 SigmaCV——以及许多出版商和资助机构——用来可靠地查找您成果的标识符。",
        },
        {
          q: "我的 OpenAlex 记录会与我的 Scholar 列表匹配吗？",
          a: "通常非常接近——OpenAlex 覆盖范围广泛。若有差异，您可整理显示哪些内容，并通过 DOI 添加任何缺失的成果。",
        },
      ],
      relatedHeading: "生成简历的相关方式",
    },
    "erc-cv": {
      intro: [
        "申请欧洲研究理事会（ERC）意味着要按照 ERC 预期的结构来呈现您的简历。SigmaCV 汇总您公开的学术记录并应用 ERC 风格的布局，因此您从真实的论文和资助出发，而不是一张空白表格。",
        "它是 58 种一键式资助机构、高校和行业布局之一，以可逆方式应用于同一份规范简历——因此您可以从同一份记录准备一份 ERC 简历和一份其他资助机构的简历。请始终遵循 ERC 针对您项目征集的现行官方指南。",
      ],
      stepsHeading: "如何生成 ERC 简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 读取您公开的 ORCID 和 OpenAlex 记录——无需手动录入。",
        },
        {
          title: "应用 ERC 布局",
          body: "选择 ERC 风格的布局；它会以可逆方式将您的规范简历重塑为预期的结构。",
        },
        {
          title: "为项目征集进行整理",
          body: "选择适合具体 ERC 项目征集的论文和细节。",
        },
        {
          title: "导出",
          body: "导出为 PDF、DOCX 或 LaTeX，全文保持一致的引用。",
        },
      ],
      whyHeading: "为什么用 SigmaCV 生成您的 ERC 简历",
      why: [
        "资助机构的简历差异在于结构，而非您底层的记录。SigmaCV 将两者分离：您的数据存放在一份规范简历中，而 ERC 布局只是在其之上应用的一种呈现方式——因此从 ERC 简历切换到另一家资助机构的格式只需一次点击，而非重新构建。",
        "它对个人免费且开源，通过标识符匹配您的成果，并保持引用一致。在提交之前，请始终确认 ERC 的现行官方模板和规则。",
      ],
      faqExtra: [
        {
          q: "还支持哪些其他资助机构格式？",
          a: "58 种一键式布局，涵盖资助机构、高校和行业——除 ERC 外，还包括 UKRI R4RI、Royal Society、SNSF、NIH 和 NSF——每种均从您公开的学术记录填充。",
        },
        {
          q: "切换布局会丢失我的编辑内容吗？",
          a: "不会。布局以可逆方式应用于同一份规范简历，因此您在各格式之间切换时，整理内容始终保留。",
        },
        {
          q: "它能保证符合 ERC 要求吗？",
          a: "没有任何工具能保证——资助机构的规则会变化。SigmaCV 为您提供一个 ERC 风格的起点；请始终查看 ERC 针对您具体项目征集的现行官方表格和说明。",
        },
      ],
      relatedHeading: "相关的资助机构简历工具",
    },
    "import-publications-to-cv": {
      intro: [
        "把论文列表重新敲进简历既慢又容易出错。SigmaCV 从公开的学术记录自动导入您的论文——使用 ORCID 登录，您的成果便会被提取、格式化并汇总成一份简历。",
        "一切都通过标识符（ORCID / OpenAlex ID）而非姓名匹配到您，因此您不会继承同名者的论文，而且每一条引用都通过同一种 CSL 样式格式化，在每一次导出中保持一致。",
      ],
      stepsHeading: "如何将论文导入您的简历",
      steps: [
        {
          title: "使用您的 ORCID iD 登录",
          body: "SigmaCV 读取您公开的 ORCID 记录并解析您的 OpenAlex 档案。",
        },
        {
          title: "论文自动导入",
          body: "您的成果从 OpenAlex 和 ORCID 提取，并转换为已格式化的简历条目——无需复制粘贴。",
        },
        {
          title: "通过 DOI 添加任何缺失内容",
          body: "如果某篇论文未被找到，可通过其 DOI 添加，它会被格式化以保持一致。",
        },
        {
          title: "整理并导出",
          body: "选择显示哪些成果以及以何种顺序，然后导出为 PDF、DOCX、LaTeX、Markdown 或 BibTeX。",
        },
      ],
      whyHeading: "为什么从公开记录导入",
      why: [
        "从开放来源按标识符导入，比手动录入或基于姓名的搜索更快、也更准确：它避免了困扰常见姓名和非拉丁文姓名的错误归属，并在公开记录更新时保持您的列表为最新。",
        "SigmaCV 对个人免费且开源，通过同一个 CSL 引擎格式化每一条引用，并让您将同一份整理过的列表导出为 PDF、DOCX、LaTeX、Markdown、BibTeX 和 CSL-JSON。",
      ],
      faqExtra: [
        {
          q: "我可以从 Google Scholar 导入吗？",
          a: "不可以——Google Scholar 没有公开 API。SigmaCV 从开放的替代方案 ORCID 和 OpenAlex 导入，您可以通过 DOI 添加任何缺失内容。",
        },
        {
          q: "它是通过姓名导入的吗？",
          a: "不是——而是通过作者标识符（ORCID / OpenAlex ID），从而避免了共享姓名或音译姓名常见的错误匹配。",
        },
        {
          q: "我可以将导入的列表导出为 BibTeX 吗？",
          a: "可以——除 PDF、DOCX、LaTeX 和 Markdown 外，SigmaCV 还可将您整理过的论文导出为 BibTeX 和 CSL-JSON。",
        },
      ],
      relatedHeading: "生成简历的相关方式",
    },
  },
  "es-ES": {
    "cv-from-google-scholar": {
      intro: [
        "Muchos investigadores mantienen su lista de publicaciones en Google Scholar y quieren convertirla en un CV, pero Google Scholar no ofrece ninguna API pública ni exportación con la que crear uno, así que ninguna herramienta puede hacerlo de forma fiable. La buena noticia: existe una vía abierta que sí funciona.",
        "SigmaCV crea tu CV académico a partir del registro científico abierto —tu iD ORCID y tu perfil de OpenAlex—, que juntos cubren la mayor parte de lo que hay en un perfil de Scholar típico, identificándote por identificador en lugar de por nombre. Lo que falte lo puedes añadir por DOI.",
      ],
      stepsHeading: "Cómo crear tu CV sin exportar desde Google Scholar",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "En lugar de Google Scholar, SigmaCV lee tu registro público de ORCID (gratuito de crear en orcid.org si aún no tienes uno).",
        },
        {
          title: "Tus publicaciones se importan de OpenAlex",
          body: "SigmaCV resuelve tu perfil de autor de OpenAlex y extrae tus trabajos: una cobertura amplia y abierta, comparable a la de un perfil de Scholar.",
        },
        {
          title: "Rellena los huecos por DOI",
          body: "Si un artículo de tu perfil de Scholar no está en OpenAlex, añádelo por su DOI; se le da formato para que encaje.",
        },
        {
          title: "Selecciona y exporta",
          body: "Elige un estilo de citas y una plantilla, y luego exporta a PDF, DOCX, LaTeX o Markdown, o publica una página viva.",
        },
      ],
      whyHeading: "Por qué ORCID + OpenAlex, y no Google Scholar",
      why: [
        "Google Scholar es cómodo para descubrir trabajos, pero es cerrado: no tiene API ni exportación masiva, e identifica por nombre, lo que confunde a autores con nombres comunes. ORCID y OpenAlex son abiertos, basados en identificadores y pensados para reutilizarse: exactamente lo que una herramienta necesita para componer un CV preciso.",
        "SigmaCV es gratis para particulares y de código abierto, solo lee metadatos públicos e identifica tu trabajo por identificador de ORCID / OpenAlex, de modo que tu CV refleja tu trabajo y no el de un homónimo.",
      ],
      faqExtra: [
        {
          q: "¿Tiene Google Scholar una API?",
          a: "No. Google Scholar no ofrece ninguna API pública oficial ni exportación, y por eso no se pueden crear CV directamente a partir de él. ORCID y OpenAlex son las alternativas abiertas y reutilizables.",
        },
        {
          q: "¿Cómo consigo un iD ORCID?",
          a: "Regístrate gratis en orcid.org en alrededor de un minuto. Es el identificador que SigmaCV —y muchas editoriales y financiadores— usan para encontrar tu trabajo de forma fiable.",
        },
        {
          q: "¿Coincidirá mi registro de OpenAlex con mi lista de Scholar?",
          a: "Normalmente, muy de cerca: OpenAlex tiene una cobertura amplia. Donde difieran, tú seleccionas lo que aparece y añades lo que falte por DOI.",
        },
      ],
      relatedHeading: "Otras formas de crear tu CV",
    },
    "erc-cv": {
      intro: [
        "Solicitar financiación al European Research Council implica presentar tu CV con la estructura que el ERC espera. SigmaCV reúne tu registro científico abierto y aplica un diseño al estilo del ERC, de modo que partes de tus publicaciones y tu financiación reales en lugar de un formulario en blanco.",
        "Es uno de los 58 diseños de financiador, institución e industria en un clic, aplicados de forma reversible a un único CV canónico, así que puedes preparar un CV para el ERC y un CV para otro financiador a partir del mismo registro. Sigue siempre las directrices oficiales vigentes del ERC para tu convocatoria.",
      ],
      stepsHeading: "Cómo crear un CV para el ERC",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "SigmaCV lee tu registro público de ORCID y OpenAlex: sin introducir nada manualmente.",
        },
        {
          title: "Aplica el diseño del ERC",
          body: "Elige el diseño al estilo del ERC; reorganiza tu CV canónico en la estructura esperada, de forma reversible.",
        },
        {
          title: "Selecciona para la convocatoria",
          body: "Elige las publicaciones y los detalles que encajan con la convocatoria concreta del ERC.",
        },
        {
          title: "Exporta",
          body: "Exporta a PDF, DOCX o LaTeX, con citas coherentes a lo largo del documento.",
        },
      ],
      whyHeading: "Por qué crear tu CV para el ERC con SigmaCV",
      why: [
        "Los CV para financiadores difieren en la estructura, no en tu registro subyacente. SigmaCV separa ambas cosas: tus datos viven en un único CV canónico y el diseño del ERC es una presentación que se aplica encima, así que pasar de un CV para el ERC al formato de otro financiador es un clic, no una reconstrucción.",
        "Es gratis para particulares y de código abierto, identifica tu trabajo por identificador y mantiene las citas coherentes. Confirma siempre la plantilla y las reglas oficiales vigentes del ERC antes de presentar la solicitud.",
      ],
      faqExtra: [
        {
          q: "¿Qué otros formatos de financiadores se admiten?",
          a: "58 diseños en un clic que abarcan financiadores, instituciones e industria, incluidos UKRI R4RI, la Royal Society, SNSF, NIH y NSF junto al ERC, cada uno rellenado a partir de tu registro científico abierto.",
        },
        {
          q: "¿Cambiar de diseño perderá mis ediciones?",
          a: "No. Los diseños se aplican de forma reversible al mismo CV canónico, así que tu selección se conserva al pasar de un formato a otro.",
        },
        {
          q: "¿Garantiza el cumplimiento de los requisitos del ERC?",
          a: "Ninguna herramienta puede hacerlo: las reglas de los financiadores cambian. SigmaCV te da un punto de partida al estilo del ERC; consulta siempre los formularios y las instrucciones oficiales vigentes del ERC para tu convocatoria concreta.",
        },
      ],
      relatedHeading: "Herramientas de CV para financiadores relacionadas",
    },
    "import-publications-to-cv": {
      intro: [
        "Reescribir tu lista de publicaciones en un CV es lento y propenso a errores. SigmaCV importa tus publicaciones automáticamente del registro científico abierto: inicia sesión con ORCID y tus trabajos se extraen, se formatean y se reúnen en un CV.",
        "Todo se identifica contigo por identificador (ID de ORCID / OpenAlex), no por nombre, así que no heredas los artículos de un homónimo, y cada cita se formatea mediante un único estilo CSL para mantener la coherencia en todas las exportaciones.",
      ],
      stepsHeading: "Cómo importar publicaciones a tu CV",
      steps: [
        {
          title: "Inicia sesión con tu iD ORCID",
          body: "SigmaCV lee tu registro público de ORCID y resuelve tu perfil de OpenAlex.",
        },
        {
          title: "Las publicaciones se importan automáticamente",
          body: "Tus trabajos se extraen de OpenAlex y ORCID y se convierten en entradas de CV formateadas, sin copiar ni pegar.",
        },
        {
          title: "Añade lo que falte por DOI",
          body: "Si no se encuentra un artículo, añádelo por su DOI y se le da formato para que encaje.",
        },
        {
          title: "Selecciona y exporta",
          body: "Elige qué trabajos aparecen y en qué orden, y luego exporta a PDF, DOCX, LaTeX, Markdown o BibTeX.",
        },
      ],
      whyHeading: "Por qué importar desde el registro abierto",
      why: [
        "Importar por identificador desde fuentes abiertas es más rápido y más preciso que escribir o buscar por nombre: evita las atribuciones erróneas que afectan a los nombres comunes y en alfabetos no latinos, y mantiene tu lista al día a medida que el registro abierto se actualiza.",
        "SigmaCV es gratis para particulares y de código abierto, da formato a cada referencia mediante un único motor CSL y te permite exportar la misma lista seleccionada a PDF, DOCX, LaTeX, Markdown, BibTeX y CSL-JSON.",
      ],
      faqExtra: [
        {
          q: "¿Puedo importar desde Google Scholar?",
          a: "No: Google Scholar no tiene API pública. SigmaCV importa desde las alternativas abiertas, ORCID y OpenAlex, y puedes añadir lo que falte por DOI.",
        },
        {
          q: "¿Importa por nombre?",
          a: "No: por identificador de autor (ID de ORCID / OpenAlex), lo que evita las coincidencias falsas habituales con nombres compartidos o transliterados.",
        },
        {
          q: "¿Puedo exportar la lista importada como BibTeX?",
          a: "Sí: junto a PDF, DOCX, LaTeX y Markdown, SigmaCV exporta tus publicaciones seleccionadas como BibTeX y CSL-JSON.",
        },
      ],
      relatedHeading: "Otras formas de crear tu CV",
    },
  },
  "fr-FR": {
    "cv-from-google-scholar": {
      intro: [
        "Beaucoup de chercheurs tiennent leur liste de publications sur Google Scholar et souhaitent en faire un CV — mais Google Scholar n'offre ni API publique ni export pour en construire un, donc aucun outil ne peut le faire de manière fiable. La bonne nouvelle : il existe une voie ouverte qui fonctionne.",
        "SigmaCV construit votre CV académique à partir du dossier scientifique ouvert — votre iD ORCID et votre profil OpenAlex — qui ensemble couvrent l'essentiel de ce qui figure sur un profil Scholar typique, apparié à vous par identifiant plutôt que par nom. Tout ce qui manque, vous pouvez l'ajouter par son DOI.",
      ],
      stepsHeading: "Comment construire votre CV sans export Google Scholar",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "Au lieu de Google Scholar, SigmaCV lit votre dossier ORCID public (gratuit à créer sur orcid.org si vous n'en avez pas).",
        },
        {
          title: "Vos publications s'importent depuis OpenAlex",
          body: "SigmaCV résout votre profil d'auteur OpenAlex et récupère vos travaux — une couverture large et ouverte, comparable à un profil Scholar.",
        },
        {
          title: "Comblez les lacunes par DOI",
          body: "Si un article de votre profil Scholar n'est pas dans OpenAlex, ajoutez-le par son DOI ; il est mis en forme pour s'accorder.",
        },
        {
          title: "Sélectionnez et exportez",
          body: "Choisissez un style de citations et un modèle, puis exportez en PDF, DOCX, LaTeX ou Markdown — ou publiez une page vivante.",
        },
      ],
      whyHeading: "Pourquoi ORCID + OpenAlex, et non Google Scholar",
      why: [
        "Google Scholar est pratique pour la découverte mais fermé : il n'a ni API ni export en masse, et il apparie par nom, ce qui mélange les auteurs aux noms répandus. ORCID et OpenAlex sont ouverts, fondés sur l'identifiant et conçus pour être réutilisés — exactement ce dont un outil a besoin pour assembler un CV exact.",
        "SigmaCV est gratuit pour les particuliers et open source, ne lit que les métadonnées publiques et apparie vos travaux par identifiant ORCID / OpenAlex, de sorte que votre CV reflète vos travaux et non ceux d'un homonyme.",
      ],
      faqExtra: [
        {
          q: "Google Scholar a-t-il une API ?",
          a: "Non. Google Scholar ne fournit aucune API publique officielle ni export, c'est pourquoi on ne peut pas en construire directement un CV. ORCID et OpenAlex sont les alternatives ouvertes et réutilisables.",
        },
        {
          q: "Comment obtenir un iD ORCID ?",
          a: "Inscrivez-vous gratuitement sur orcid.org en une minute environ. C'est l'identifiant que SigmaCV — et de nombreux éditeurs et financeurs — utilisent pour retrouver vos travaux de façon fiable.",
        },
        {
          q: "Mon dossier OpenAlex correspondra-t-il à ma liste Scholar ?",
          a: "Le plus souvent de très près — OpenAlex a une couverture large. Là où il diffère, vous sélectionnez ce qui apparaît et ajoutez ce qui manque par son DOI.",
        },
      ],
      relatedHeading: "Autres façons de construire votre CV",
    },
    "erc-cv": {
      intro: [
        "Candidater au Conseil européen de la recherche, c'est présenter votre CV dans la structure attendue par l'ERC. SigmaCV assemble votre dossier scientifique ouvert et applique une mise en page de style ERC : vous partez ainsi de vos vraies publications et financements plutôt que d'un formulaire vierge.",
        "C'est l'une des 58 mises en page de financeur, d'institution et d'industrie en un clic, appliquées de manière réversible à un seul CV canonique — vous pouvez donc préparer un CV ERC et le CV d'un autre financeur à partir du même dossier. Suivez toujours les consignes officielles en vigueur de l'ERC pour votre appel.",
      ],
      stepsHeading: "Comment construire un CV ERC",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "SigmaCV lit votre dossier ORCID et OpenAlex public — aucune saisie manuelle.",
        },
        {
          title: "Appliquez la mise en page ERC",
          body: "Choisissez la mise en page de style ERC ; elle remodèle votre CV canonique selon la structure attendue, de manière réversible.",
        },
        {
          title: "Sélectionnez pour l'appel",
          body: "Choisissez les publications et détails qui correspondent à l'appel ERC précis.",
        },
        {
          title: "Exportez",
          body: "Exportez en PDF, DOCX ou LaTeX, avec des citations cohérentes d'un bout à l'autre.",
        },
      ],
      whyHeading: "Pourquoi construire votre CV ERC avec SigmaCV",
      why: [
        "Les CV de financeurs diffèrent par leur structure, non par votre dossier sous-jacent. SigmaCV sépare les deux : vos données vivent dans un seul CV canonique, et la mise en page ERC est une présentation appliquée par-dessus — passer ainsi d'un CV ERC au format d'un autre financeur se fait en un clic, et non par une reconstruction.",
        "Il est gratuit pour les particuliers et open source, apparie vos travaux par identifiant et garde les citations cohérentes. Confirmez toujours le modèle et les règles officiels en vigueur de l'ERC avant de soumettre.",
      ],
      faqExtra: [
        {
          q: "Quels autres formats de financeurs sont pris en charge ?",
          a: "58 mises en page en un clic couvrant financeurs, institutions et industrie — dont UKRI R4RI, la Royal Society, le SNSF, les NIH et NSF aux côtés de l'ERC — chacune remplie depuis votre dossier scientifique ouvert.",
        },
        {
          q: "Changer de mise en page va-t-il perdre mes modifications ?",
          a: "Non. Les mises en page s'appliquent de manière réversible au même CV canonique, votre sélection est donc préservée lorsque vous passez d'un format à l'autre.",
        },
        {
          q: "Cela garantit-il la conformité ERC ?",
          a: "Aucun outil ne le peut — les règles des financeurs changent. SigmaCV vous donne un point de départ de style ERC ; vérifiez toujours les formulaires et consignes officiels en vigueur de l'ERC pour votre appel précis.",
        },
      ],
      relatedHeading: "Outils de CV pour financeurs apparentés",
    },
    "import-publications-to-cv": {
      intro: [
        "Ressaisir votre liste de publications dans un CV est lent et source d'erreurs. SigmaCV importe automatiquement vos publications depuis le dossier scientifique ouvert — connectez-vous avec ORCID et vos travaux sont récupérés, mis en forme et assemblés en un CV.",
        "Tout vous est apparié par identifiant (iD ORCID / OpenAlex), et non par nom, de sorte que vous n'héritez pas des articles d'un homonyme, et chaque citation est mise en forme via un seul style CSL pour la cohérence sur tous les exports.",
      ],
      stepsHeading: "Comment importer des publications dans votre CV",
      steps: [
        {
          title: "Connectez-vous avec votre iD ORCID",
          body: "SigmaCV lit votre dossier ORCID public et résout votre profil OpenAlex.",
        },
        {
          title: "Les publications s'importent automatiquement",
          body: "Vos travaux sont récupérés depuis OpenAlex et ORCID puis transformés en entrées de CV mises en forme — sans copier-coller.",
        },
        {
          title: "Ajoutez ce qui manque par DOI",
          body: "Si un article est introuvable, ajoutez-le par son DOI et il est mis en forme pour s'accorder.",
        },
        {
          title: "Sélectionnez et exportez",
          body: "Choisissez quels travaux apparaissent et dans quel ordre, puis exportez en PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        },
      ],
      whyHeading: "Pourquoi importer depuis le dossier ouvert",
      why: [
        "Importer par identifiant depuis des sources ouvertes est à la fois plus rapide et plus exact que la saisie ou la recherche par nom : cela évite les attributions erronées qui touchent les noms répandus et en écriture non latine, et garde votre liste à jour à mesure que le dossier ouvert évolue.",
        "SigmaCV est gratuit pour les particuliers et open source, met en forme chaque référence via un seul moteur CSL, et vous laisse exporter la même liste sélectionnée en PDF, DOCX, LaTeX, Markdown, BibTeX et CSL-JSON.",
      ],
      faqExtra: [
        {
          q: "Puis-je importer depuis Google Scholar ?",
          a: "Non — Google Scholar n'a pas d'API publique. SigmaCV importe depuis les alternatives ouvertes, ORCID et OpenAlex, et vous pouvez ajouter ce qui manque par son DOI.",
        },
        {
          q: "Importe-t-il par nom ?",
          a: "Non — par identifiant d'auteur (iD ORCID / OpenAlex), ce qui évite les fausses correspondances fréquentes avec les noms partagés ou translittérés.",
        },
        {
          q: "Puis-je exporter la liste importée en BibTeX ?",
          a: "Oui — aux côtés de PDF, DOCX, LaTeX et Markdown, SigmaCV exporte vos publications sélectionnées en BibTeX et CSL-JSON.",
        },
      ],
      relatedHeading: "Autres façons de construire votre CV",
    },
  },
  "de-DE": {
    "cv-from-google-scholar": {
      intro: [
        "Viele Forschende führen ihre Publikationsliste bei Google Scholar und möchten daraus einen Lebenslauf machen — aber Google Scholar bietet keine öffentliche API und keinen Export, aus dem sich einer erstellen ließe, daher kann das kein Werkzeug zuverlässig leisten. Die gute Nachricht: Es gibt einen offenen Weg, der funktioniert.",
        "SigmaCV erstellt Ihren akademischen Lebenslauf aus dem offenen Forschungsverzeichnis — Ihrer ORCID iD und Ihrem OpenAlex-Profil —, die zusammen das meiste abdecken, was auf einem typischen Scholar-Profil steht, Ihnen über Kennungen statt über den Namen zugeordnet. Alles Fehlende können Sie per DOI hinzufügen.",
      ],
      stepsHeading: "So erstellen Sie Ihren Lebenslauf ohne einen Google-Scholar-Export",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "Statt Google Scholar liest SigmaCV Ihr öffentliches ORCID-Verzeichnis (kostenlos auf orcid.org zu erstellen, falls Sie noch keines haben).",
        },
        {
          title: "Ihre Publikationen werden aus OpenAlex importiert",
          body: "SigmaCV ermittelt Ihr OpenAlex-Autorenprofil und holt Ihre Werke — breite, offene Abdeckung, vergleichbar mit einem Scholar-Profil.",
        },
        {
          title: "Lücken per DOI schließen",
          body: "Falls eine Arbeit auf Ihrem Scholar-Profil nicht in OpenAlex ist, fügen Sie sie über ihren DOI hinzu; sie wird passend formatiert.",
        },
        {
          title: "Auswählen und exportieren",
          body: "Wählen Sie einen Zitierstil und eine Vorlage und exportieren Sie dann als PDF, DOCX, LaTeX oder Markdown — oder veröffentlichen Sie eine lebende Seite.",
        },
      ],
      whyHeading: "Warum ORCID + OpenAlex statt Google Scholar",
      why: [
        "Google Scholar ist praktisch zum Entdecken, aber geschlossen: Es gibt keine API und keinen Massenexport, und es ordnet über den Namen zu, wodurch Autoren mit häufigen Namen verwechselt werden. ORCID und OpenAlex sind offen, kennungsbasiert und auf Weiterverwendung ausgelegt — genau das, was ein Werkzeug braucht, um einen korrekten Lebenslauf zusammenzustellen.",
        "SigmaCV ist kostenlos für Einzelpersonen und quelloffen, liest ausschließlich öffentliche Metadaten und ordnet Ihre Arbeiten über die ORCID- / OpenAlex-Kennung zu, sodass Ihr Lebenslauf Ihre Arbeiten widerspiegelt und nicht die eines Namensvetters.",
      ],
      faqExtra: [
        {
          q: "Hat Google Scholar eine API?",
          a: "Nein. Google Scholar bietet keine offizielle öffentliche API und keinen Export, weshalb sich Lebensläufe nicht direkt daraus erstellen lassen. ORCID und OpenAlex sind die offenen, weiterverwendbaren Alternativen.",
        },
        {
          q: "Wie erhalte ich eine ORCID iD?",
          a: "Registrieren Sie sich kostenlos auf orcid.org in etwa einer Minute. Es ist die Kennung, die SigmaCV — und viele Verlage und Förderer — nutzen, um Ihre Arbeiten zuverlässig zu finden.",
        },
        {
          q: "Stimmt mein OpenAlex-Verzeichnis mit meiner Scholar-Liste überein?",
          a: "Meist sehr weitgehend — OpenAlex hat eine breite Abdeckung. Wo es abweicht, wählen Sie aus, was erscheint, und fügen Fehlendes per DOI hinzu.",
        },
      ],
      relatedHeading: "Weitere Wege, Ihren Lebenslauf zu erstellen",
    },
    "erc-cv": {
      intro: [
        "Eine Bewerbung beim European Research Council bedeutet, Ihren Lebenslauf in der vom ERC erwarteten Struktur zu präsentieren. SigmaCV stellt Ihr offenes Forschungsverzeichnis zusammen und wendet ein Layout im ERC-Stil an, sodass Sie von Ihren echten Publikationen und Förderungen ausgehen statt von einem leeren Formular.",
        "Es ist eines von 58 Förderer-, Institutions- und Industrie-Layouts mit einem Klick, reversibel auf einen einzigen kanonischen Lebenslauf angewendet — sodass Sie aus demselben Verzeichnis einen ERC-Lebenslauf und den Lebenslauf eines anderen Förderers vorbereiten können. Befolgen Sie für Ihre Ausschreibung stets die aktuelle offizielle Anleitung des ERC.",
      ],
      stepsHeading: "So erstellen Sie einen ERC-Lebenslauf",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "SigmaCV liest Ihr öffentliches ORCID- und OpenAlex-Verzeichnis — keine manuelle Eingabe.",
        },
        {
          title: "Das ERC-Layout anwenden",
          body: "Wählen Sie das Layout im ERC-Stil; es formt Ihren kanonischen Lebenslauf reversibel in die erwartete Struktur um.",
        },
        {
          title: "Für die Ausschreibung auswählen",
          body: "Wählen Sie die Publikationen und Angaben aus, die zur konkreten ERC-Ausschreibung passen.",
        },
        {
          title: "Exportieren",
          body: "Exportieren Sie als PDF, DOCX oder LaTeX, durchgehend mit einheitlichen Zitaten.",
        },
      ],
      whyHeading: "Warum Sie Ihren ERC-Lebenslauf mit SigmaCV erstellen sollten",
      why: [
        "Förder-Lebensläufe unterscheiden sich in der Struktur, nicht in Ihrem zugrunde liegenden Verzeichnis. SigmaCV trennt beides: Ihre Daten leben in einem kanonischen Lebenslauf, und das ERC-Layout ist eine darauf angewendete Darstellung — sodass der Wechsel von einem ERC-Lebenslauf zum Format eines anderen Förderers ein Klick ist und kein Neuaufbau.",
        "Es ist kostenlos für Einzelpersonen und quelloffen, ordnet Ihre Arbeiten über Kennungen zu und hält die Zitate einheitlich. Bestätigen Sie vor der Einreichung stets die aktuelle offizielle Vorlage und die Regeln des ERC.",
      ],
      faqExtra: [
        {
          q: "Welche anderen Förderformate werden unterstützt?",
          a: "58 Layouts mit einem Klick, die Förderer, Institutionen und Industrie abdecken — darunter UKRI R4RI, die Royal Society, SNSF, NIH und NSF neben ERC — jedes aus Ihrem offenen Forschungsverzeichnis befüllt.",
        },
        {
          q: "Gehen meine Bearbeitungen beim Wechsel des Layouts verloren?",
          a: "Nein. Layouts werden reversibel auf denselben kanonischen Lebenslauf angewendet, sodass Ihre Auswahl beim Wechsel zwischen Formaten erhalten bleibt.",
        },
        {
          q: "Garantiert es ERC-Konformität?",
          a: "Das kann kein Werkzeug — Förderregeln ändern sich. SigmaCV gibt Ihnen einen Ausgangspunkt im ERC-Stil; prüfen Sie für Ihre konkrete Ausschreibung stets die aktuellen offiziellen Formulare und Anweisungen des ERC.",
        },
      ],
      relatedHeading: "Weitere Förder-Lebenslaufwerkzeuge",
    },
    "import-publications-to-cv": {
      intro: [
        "Ihre Publikationsliste neu in einen Lebenslauf einzutippen, ist langsam und fehleranfällig. SigmaCV importiert Ihre Publikationen automatisch aus dem offenen Forschungsverzeichnis — melden Sie sich mit ORCID an, und Ihre Werke werden eingelesen, formatiert und zu einem Lebenslauf zusammengefügt.",
        "Alles wird Ihnen über eine Kennung (ORCID- / OpenAlex-ID) zugeordnet, nicht über den Namen, sodass Sie nicht die Arbeiten eines Namensvetters erben, und jedes Zitat wird über einen einzigen CSL-Stil formatiert, für Einheitlichkeit in jedem Export.",
      ],
      stepsHeading: "So importieren Sie Publikationen in Ihren Lebenslauf",
      steps: [
        {
          title: "Mit Ihrer ORCID iD anmelden",
          body: "SigmaCV liest Ihr öffentliches ORCID-Verzeichnis und ermittelt Ihr OpenAlex-Profil.",
        },
        {
          title: "Publikationen werden automatisch importiert",
          body: "Ihre Werke werden aus OpenAlex und ORCID geholt und in formatierte Lebenslaufeinträge umgewandelt — kein Kopieren und Einfügen.",
        },
        {
          title: "Fehlendes per DOI hinzufügen",
          body: "Falls eine Arbeit nicht gefunden wird, fügen Sie sie über ihren DOI hinzu, und sie wird passend formatiert.",
        },
        {
          title: "Auswählen und exportieren",
          body: "Wählen Sie, welche Werke in welcher Reihenfolge erscheinen, und exportieren Sie dann als PDF, DOCX, LaTeX, Markdown oder BibTeX.",
        },
      ],
      whyHeading: "Warum aus dem offenen Verzeichnis importieren",
      why: [
        "Der Import über Kennungen aus offenen Quellen ist sowohl schneller als auch genauer als Eintippen oder namensbasierte Suche: Er vermeidet die Falschzuordnungen, die häufige und nicht-lateinisch geschriebene Namen plagen, und hält Ihre Liste aktuell, während sich das offene Verzeichnis aktualisiert.",
        "SigmaCV ist kostenlos für Einzelpersonen und quelloffen, formatiert jede Literaturangabe über eine einzige CSL-Engine und lässt Sie dieselbe ausgewählte Liste als PDF, DOCX, LaTeX, Markdown, BibTeX und CSL-JSON exportieren.",
      ],
      faqExtra: [
        {
          q: "Kann ich aus Google Scholar importieren?",
          a: "Nein — Google Scholar hat keine öffentliche API. SigmaCV importiert aus den offenen Alternativen ORCID und OpenAlex, und Sie können Fehlendes per DOI hinzufügen.",
        },
        {
          q: "Importiert es über den Namen?",
          a: "Nein — über die Autorenkennung (ORCID- / OpenAlex-ID), was die Falschtreffer vermeidet, die bei geteilten oder transliterierten Namen häufig sind.",
        },
        {
          q: "Kann ich die importierte Liste als BibTeX exportieren?",
          a: "Ja — neben PDF, DOCX, LaTeX und Markdown exportiert SigmaCV Ihre ausgewählten Publikationen als BibTeX und CSL-JSON.",
        },
      ],
      relatedHeading: "Weitere Wege, Ihren Lebenslauf zu erstellen",
    },
  },
  "ja-JP": {
    "cv-from-google-scholar": {
      intro: [
        "多くの研究者は論文リストを Google Scholar に置いており、それを CV にしたいと考えます——しかし Google Scholar には、そこから CV を作るための公開 API も書き出しもないため、どのツールも確実にそれを行うことはできません。朗報は、機能するオープンな経路があることです。",
        "SigmaCV は公開された研究記録——あなたの ORCID iD と OpenAlex プロフィール——から学術 CV を作成します。両者を合わせれば、一般的な Scholar プロフィールに載っている内容の大半をカバーでき、名前ではなく識別子であなたに照合します。不足しているものは DOI で追加できます。",
      ],
      stepsHeading: "Google Scholar の書き出しなしで CV を作る方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "Google Scholar の代わりに、SigmaCV はあなたの公開された ORCID 記録を読み取ります（お持ちでなければ orcid.org で無料作成できます）。",
        },
        {
          title: "論文は OpenAlex から取り込まれます",
          body: "SigmaCV はあなたの OpenAlex 著者プロフィールを解決し、成果を取得します——Scholar プロフィールに匹敵する、広範でオープンなカバレッジです。",
        },
        {
          title: "不足分を DOI で補完",
          body: "Scholar プロフィールにある論文が OpenAlex にない場合は、その DOI で追加してください。CV に合わせて整形されます。",
        },
        {
          title: "整理して書き出し",
          body: "引用スタイルとテンプレートを選び、PDF・DOCX・LaTeX・Markdown に書き出します——あるいは更新され続ける公開ページとして公開できます。",
        },
      ],
      whyHeading: "なぜ Google Scholar ではなく ORCID + OpenAlex なのか",
      why: [
        "Google Scholar は発見には便利ですが、クローズドです。API も一括書き出しもなく、名前で照合するため、同姓名の著者が混ざってしまいます。ORCID と OpenAlex はオープンで識別子に基づき、再利用を前提に作られています——正確な CV を組み立てるためにツールが必要とするものそのものです。",
        "SigmaCV は個人には無料でオープンソースであり、読み取るのは公開メタデータのみで、あなたの業績を ORCID / OpenAlex 識別子で照合します。だから CV には、同姓名の他人ではなく、あなた自身の業績が反映されます。",
      ],
      faqExtra: [
        {
          q: "Google Scholar に API はありますか？",
          a: "ありません。Google Scholar は公式の公開 API も書き出しも提供していません。そのため、そこから直接 CV を作ることはできません。ORCID と OpenAlex が、オープンで再利用可能な代替手段です。",
        },
        {
          q: "ORCID iD はどうやって取得しますか？",
          a: "orcid.org で約 1 分、無料で登録できます。これは SigmaCV——そして多くの出版社や助成機関——があなたの業績を確実に見つけるために使う識別子です。",
        },
        {
          q: "私の OpenAlex 記録は Scholar のリストと一致しますか？",
          a: "通常はかなり近く一致します——OpenAlex は広範にカバーしています。異なる場合は、表示する内容をあなたが整理し、不足しているものは DOI で追加できます。",
        },
      ],
      relatedHeading: "CV を作るその他の方法",
    },
    "erc-cv": {
      intro: [
        "欧州研究会議（ERC）への申請では、CV を ERC が想定する構造で提示する必要があります。SigmaCV はあなたの公開された研究記録をまとめて ERC 形式のレイアウトを適用するため、空白の様式ではなく、実在するあなたの論文や助成から始められます。",
        "これは 58 種のワンクリック助成機関・機関・業界レイアウトの一つで、一つの正規 CV に可逆的に適用されます——だから ERC の CV と別の助成機関の CV を、同じ記録から準備できます。ご自身の公募については、必ず ERC の現行の公式ガイダンスに従ってください。",
      ],
      stepsHeading: "ERC CV を作る方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "SigmaCV はあなたの公開された ORCID と OpenAlex の記録を読み取ります——手入力は不要です。",
        },
        {
          title: "ERC レイアウトを適用",
          body: "ERC 形式のレイアウトを選びます。あなたの正規 CV を、想定される構造に可逆的に作り変えます。",
        },
        {
          title: "公募に合わせて整理",
          body: "ご自身の ERC 公募に合う論文や詳細を選びます。",
        },
        {
          title: "書き出し",
          body: "全体を通して一貫した引用で、PDF・DOCX・LaTeX に書き出します。",
        },
      ],
      whyHeading: "なぜ SigmaCV で ERC CV を作るのか",
      why: [
        "助成機関の CV は構造が異なるだけで、その基盤となる記録は同じです。SigmaCV はこの二つを切り離します。あなたのデータは一つの正規 CV に存在し、ERC レイアウトはその上に適用される表示上の選択です——だから ERC の CV から別の助成機関のフォーマットへの切り替えは、作り直しではなくワンクリックです。",
        "個人には無料でオープンソースであり、あなたの業績を識別子で照合し、引用を一貫させます。提出前には必ず、ERC の現行の公式テンプレートと規則を確認してください。",
      ],
      faqExtra: [
        {
          q: "他にどの助成機関フォーマットに対応していますか？",
          a: "助成機関・機関・業界にわたる 58 種のワンクリックレイアウト——ERC のほか UKRI R4RI、Royal Society、SNSF、NIH、NSF を含む——で、それぞれあなたの公開された研究記録から入力されます。",
        },
        {
          q: "レイアウトを切り替えると編集内容は失われますか？",
          a: "いいえ。レイアウトは同一の正規 CV に可逆的に適用されるため、フォーマット間を移動しても整理内容は保持されます。",
        },
        {
          q: "ERC への準拠を保証しますか？",
          a: "どのツールも保証できません——助成機関の規則は変わります。SigmaCV は ERC 形式の出発点を提供します。ご自身の公募については、必ず ERC の現行の公式様式と指示を確認してください。",
        },
      ],
      relatedHeading: "関連する助成機関 CV ツール",
    },
    "import-publications-to-cv": {
      intro: [
        "論文リストを CV に打ち直すのは時間がかかり、間違いも起きやすい作業です。SigmaCV は公開された研究記録からあなたの論文を自動でインポートします——ORCID でサインインすると、成果が取り込まれ、整形され、CV にまとめられます。",
        "すべては名前ではなく識別子（ORCID / OpenAlex ID）であなたに照合されるため、同姓名の他人の論文を引き継ぐことはありません。そしてすべての引用は一つの CSL スタイルで整形されるため、あらゆる書き出しで一貫します。",
      ],
      stepsHeading: "論文を CV にインポートする方法",
      steps: [
        {
          title: "ORCID iD でサインイン",
          body: "SigmaCV はあなたの公開された ORCID 記録を読み取り、OpenAlex プロフィールを解決します。",
        },
        {
          title: "論文が自動でインポートされます",
          body: "あなたの成果が OpenAlex と ORCID から取得され、整形された CV 項目になります——コピー＆ペースト不要です。",
        },
        {
          title: "不足分を DOI で追加",
          body: "論文が見つからない場合は、その DOI で追加してください。CV に合わせて整形されます。",
        },
        {
          title: "整理して書き出し",
          body: "どの成果をどの順序で表示するかを選び、PDF・DOCX・LaTeX・Markdown・BibTeX に書き出します。",
        },
      ],
      whyHeading: "なぜ公開された記録からインポートするのか",
      why: [
        "オープンな情報源から識別子でインポートする方法は、手入力や名前ベースの検索よりも速く、かつ正確です。よくある名前や非ラテン文字の名前につきまとう誤った帰属を避け、公開された記録が更新されるのに合わせてリストを最新に保ちます。",
        "SigmaCV は個人には無料でオープンソースであり、すべての参考文献を一つの CSL エンジンで整形し、同じ整理済みのリストを PDF・DOCX・LaTeX・Markdown・BibTeX・CSL-JSON に書き出せます。",
      ],
      faqExtra: [
        {
          q: "Google Scholar からインポートできますか？",
          a: "いいえ——Google Scholar には公開 API がありません。SigmaCV はオープンな代替手段である ORCID と OpenAlex からインポートし、不足しているものは DOI で追加できます。",
        },
        {
          q: "名前でインポートしますか？",
          a: "いいえ——著者識別子（ORCID / OpenAlex ID）でインポートします。これにより、共有された名前や音訳された名前でよく起こる誤った照合を避けられます。",
        },
        {
          q: "インポートしたリストを BibTeX で書き出せますか？",
          a: "はい——PDF・DOCX・LaTeX・Markdown に加えて、SigmaCV は整理した論文を BibTeX や CSL-JSON として書き出します。",
        },
      ],
      relatedHeading: "CV を作るその他の方法",
    },
  },
  "pt-BR": {
    "cv-from-google-scholar": {
      intro: [
        "Muitos pesquisadores mantêm sua lista de publicações no Google Scholar e querem transformá-la em um currículo — mas o Google Scholar não oferece API pública nem exportação para criar um, então nenhuma ferramenta consegue fazer isso de forma confiável. A boa notícia: existe um caminho aberto que funciona.",
        "O SigmaCV monta seu currículo acadêmico a partir do registro de pesquisa aberto — seu iD ORCID e seu perfil no OpenAlex — que, juntos, cobrem a maior parte do que está em um perfil típico do Scholar, correspondido a você por identificador em vez de por nome. Qualquer coisa ausente você pode adicionar pelo DOI.",
      ],
      stepsHeading: "Como criar seu currículo sem uma exportação do Google Scholar",
      steps: [
        {
          title: "Entre com seu iD ORCID",
          body: "Em vez do Google Scholar, o SigmaCV lê seu registro público do ORCID (gratuito para criar em orcid.org, caso você não tenha).",
        },
        {
          title: "Suas publicações são importadas do OpenAlex",
          body: "O SigmaCV resolve seu perfil de autor no OpenAlex e extrai seus trabalhos — cobertura ampla e aberta, comparável a um perfil do Scholar.",
        },
        {
          title: "Preencha as lacunas pelo DOI",
          body: "Se um artigo do seu perfil no Scholar não estiver no OpenAlex, adicione-o pelo DOI; ele é formatado para combinar.",
        },
        {
          title: "Cure e exporte",
          body: "Escolha um estilo de citações e um layout e, em seguida, exporte para PDF, DOCX, LaTeX ou Markdown — ou publique uma página viva.",
        },
      ],
      whyHeading: "Por que ORCID + OpenAlex, e não o Google Scholar",
      why: [
        "O Google Scholar é conveniente para descoberta, mas é fechado: não há API nem exportação em massa, e ele faz a correspondência por nome, o que mistura autores de nomes comuns. ORCID e OpenAlex são abertos, baseados em identificador e feitos para serem reutilizados — exatamente o que uma ferramenta precisa para montar um currículo preciso.",
        "O SigmaCV é gratuito para indivíduos e de código aberto, lê apenas metadados públicos e corresponde seu trabalho pelo identificador do ORCID / OpenAlex, então seu currículo reflete o seu trabalho, e não o de um homônimo.",
      ],
      faqExtra: [
        {
          q: "O Google Scholar tem uma API?",
          a: "Não. O Google Scholar não oferece API pública oficial nem exportação, e é por isso que não dá para criar currículos diretamente a partir dele. ORCID e OpenAlex são as alternativas abertas e reutilizáveis.",
        },
        {
          q: "Como obtenho um iD ORCID?",
          a: "Cadastre-se gratuitamente em orcid.org em cerca de um minuto. É o identificador que o SigmaCV — e muitos editores e financiadores — usam para encontrar seu trabalho de forma confiável.",
        },
        {
          q: "Meu registro do OpenAlex vai corresponder à minha lista do Scholar?",
          a: "Geralmente de forma bem próxima — o OpenAlex tem cobertura ampla. Onde houver diferença, você cura o que aparece e adiciona qualquer coisa ausente pelo DOI.",
        },
      ],
      relatedHeading: "Outras formas de criar seu currículo",
    },
    "erc-cv": {
      intro: [
        "Candidatar-se ao Conselho Europeu de Pesquisa (ERC) significa apresentar seu currículo na estrutura esperada pelo ERC. O SigmaCV reúne seu registro de pesquisa aberto e aplica um layout no estilo ERC, para que você comece pelas suas publicações e financiamentos reais, em vez de um formulário em branco.",
        "É um dos 58 layouts de financiador, instituição e indústria em um clique, aplicados de forma reversível a um único currículo canônico — então você pode preparar um currículo ERC e o currículo de um financiador diferente a partir do mesmo registro. Sempre siga as orientações oficiais atuais do ERC para a sua chamada.",
      ],
      stepsHeading: "Como montar um currículo ERC",
      steps: [
        {
          title: "Entre com seu iD ORCID",
          body: "O SigmaCV lê seu registro público do ORCID e do OpenAlex — sem digitação manual.",
        },
        {
          title: "Aplique o layout ERC",
          body: "Escolha o layout no estilo ERC; ele reorganiza seu currículo canônico na estrutura esperada, de forma reversível.",
        },
        {
          title: "Cure para a chamada",
          body: "Selecione as publicações e os detalhes que se encaixam na chamada específica do ERC.",
        },
        {
          title: "Exporte",
          body: "Exporte para PDF, DOCX ou LaTeX, com citações consistentes em todo o documento.",
        },
      ],
      whyHeading: "Por que montar seu currículo ERC com o SigmaCV",
      why: [
        "Os currículos de financiadores diferem na estrutura, não no seu registro subjacente. O SigmaCV separa os dois: seus dados ficam em um único currículo canônico, e o layout ERC é uma apresentação aplicada por cima — então passar de um currículo ERC para o formato de outro financiador é um clique, e não uma reconstrução.",
        "Ele é gratuito para indivíduos e de código aberto, corresponde seu trabalho por identificador e mantém as citações consistentes. Sempre confirme o modelo e as regras oficiais atuais do ERC antes de enviar.",
      ],
      faqExtra: [
        {
          q: "Quais outros formatos de financiadores são suportados?",
          a: "58 layouts em um clique abrangendo financiadores, instituições e indústria — incluindo UKRI R4RI, Royal Society, SNSF, NIH e NSF além do ERC — cada um preenchido a partir do seu registro de pesquisa aberto.",
        },
        {
          q: "Trocar de layout vai apagar minhas edições?",
          a: "Não. Os layouts são aplicados de forma reversível ao mesmo currículo canônico, então sua curadoria é preservada ao alternar entre formatos.",
        },
        {
          q: "Isso garante conformidade com o ERC?",
          a: "Nenhuma ferramenta consegue garantir — as regras dos financiadores mudam. O SigmaCV oferece um ponto de partida no estilo ERC; sempre verifique os formulários e as instruções oficiais atuais do ERC para a sua chamada específica.",
        },
      ],
      relatedHeading: "Ferramentas de currículo para financiadores relacionadas",
    },
    "import-publications-to-cv": {
      intro: [
        "Redigitar sua lista de publicações em um currículo é lento e propenso a erros. O SigmaCV importa suas publicações automaticamente do registro de pesquisa aberto — entre com o ORCID e seus trabalhos são extraídos, formatados e montados em um currículo.",
        "Tudo é correspondido a você por identificador (ID do ORCID / OpenAlex), não por nome, então você não herda os artigos de um homônimo, e cada citação é formatada por um único estilo CSL para garantir consistência em todos os formatos de saída.",
      ],
      stepsHeading: "Como importar publicações para seu currículo",
      steps: [
        {
          title: "Entre com seu iD ORCID",
          body: "O SigmaCV lê seu registro público do ORCID e resolve seu perfil no OpenAlex.",
        },
        {
          title: "As publicações são importadas automaticamente",
          body: "Seus trabalhos são extraídos do OpenAlex e do ORCID e transformados em entradas de currículo formatadas — sem copiar e colar.",
        },
        {
          title: "Adicione qualquer coisa ausente pelo DOI",
          body: "Se um artigo não for encontrado, adicione-o pelo DOI e ele é formatado para combinar.",
        },
        {
          title: "Cure e exporte",
          body: "Escolha quais trabalhos aparecem e em que ordem e, em seguida, exporte para PDF, DOCX, LaTeX, Markdown ou BibTeX.",
        },
      ],
      whyHeading: "Por que importar do registro aberto",
      why: [
        "Importar por identificador a partir de fontes abertas é mais rápido e mais preciso do que digitar ou buscar por nome: evita as atribuições incorretas que afetam nomes comuns e de escrita não latina, e mantém sua lista atualizada à medida que o registro aberto é atualizado.",
        "O SigmaCV é gratuito para indivíduos e de código aberto, formata cada referência por um único motor CSL e permite exportar a mesma lista curada para PDF, DOCX, LaTeX, Markdown, BibTeX e CSL-JSON.",
      ],
      faqExtra: [
        {
          q: "Posso importar do Google Scholar?",
          a: "Não — o Google Scholar não tem API pública. O SigmaCV importa das alternativas abertas, ORCID e OpenAlex, e você pode adicionar qualquer coisa ausente pelo DOI.",
        },
        {
          q: "Ele importa por nome?",
          a: "Não — por identificador de autor (ID do ORCID / OpenAlex), o que evita as correspondências falsas comuns com nomes compartilhados ou transliterados.",
        },
        {
          q: "Posso exportar a lista importada como BibTeX?",
          a: "Sim — além de PDF, DOCX, LaTeX e Markdown, o SigmaCV exporta suas publicações curadas como BibTeX e CSL-JSON.",
        },
      ],
      relatedHeading: "Outras formas de criar seu currículo",
    },
  },
  "it-IT": {
    "cv-from-google-scholar": {
      intro: [
        "Molti ricercatori tengono il proprio elenco di pubblicazioni su Google Scholar e vorrebbero trasformarlo in un CV — ma Google Scholar non offre alcuna API pubblica né esportazione da cui crearne uno, quindi nessuno strumento può farlo in modo affidabile. La buona notizia: esiste una via aperta che funziona.",
        "SigmaCV crea il tuo CV accademico dal registro di ricerca aperto — il tuo iD ORCID e il tuo profilo OpenAlex — che insieme coprono gran parte di ciò che si trova su un tipico profilo Scholar, abbinato a te tramite identificativo anziché tramite il nome. Tutto ciò che manca puoi aggiungerlo tramite DOI.",
      ],
      stepsHeading: "Come creare il tuo CV senza un'esportazione da Google Scholar",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "Invece di Google Scholar, SigmaCV legge il tuo registro ORCID pubblico (gratuito da creare su orcid.org se non ne hai uno).",
        },
        {
          title: "Le tue pubblicazioni si importano da OpenAlex",
          body: "SigmaCV risolve il tuo profilo d'autore OpenAlex e recupera i tuoi lavori — una copertura ampia e aperta, paragonabile a un profilo Scholar.",
        },
        {
          title: "Colma eventuali lacune tramite DOI",
          body: "Se un articolo presente sul tuo profilo Scholar non è in OpenAlex, aggiungilo tramite il suo DOI; verrà formattato per corrispondere.",
        },
        {
          title: "Seleziona ed esporta",
          body: "Scegli uno stile di citazione e un modello, poi esporta in PDF, DOCX, LaTeX o Markdown — oppure pubblica una pagina viva.",
        },
      ],
      whyHeading: "Perché ORCID + OpenAlex, non Google Scholar",
      why: [
        "Google Scholar è comodo per la ricerca bibliografica ma è chiuso: non c'è alcuna API né esportazione in blocco, e abbina tramite il nome, il che confonde gli autori con nomi comuni. ORCID e OpenAlex sono aperti, basati sull'identificativo e progettati per essere riutilizzati — esattamente ciò di cui uno strumento ha bisogno per assemblare un CV accurato.",
        "SigmaCV è gratuito per i singoli individui e open source, legge solo i metadati pubblici e abbina i tuoi lavori tramite l'identificativo ORCID / OpenAlex, così il tuo CV riflette il tuo lavoro e non quello di un omonimo.",
      ],
      faqExtra: [
        {
          q: "Google Scholar ha un'API?",
          a: "No. Google Scholar non fornisce alcuna API pubblica ufficiale né esportazione, ed è per questo che i CV non possono essere creati direttamente da esso. ORCID e OpenAlex sono le alternative aperte e riutilizzabili.",
        },
        {
          q: "Come ottengo un iD ORCID?",
          a: "Registrati gratuitamente su orcid.org in circa un minuto. È l'identificativo che SigmaCV — e molti editori e finanziatori — usa per trovare i tuoi lavori in modo affidabile.",
        },
        {
          q: "Il mio registro OpenAlex corrisponderà al mio elenco Scholar?",
          a: "Di solito molto da vicino — OpenAlex ha una copertura ampia. Dove differisce, sei tu a selezionare ciò che appare e ad aggiungere tramite DOI ciò che manca.",
        },
      ],
      relatedHeading: "Altri modi correlati per creare il tuo CV",
    },
    "erc-cv": {
      intro: [
        "Candidarsi all'European Research Council significa presentare il tuo CV nella struttura attesa dall'ERC. SigmaCV assembla il tuo registro di ricerca aperto e applica una struttura in stile ERC, così parti dalle tue pubblicazioni e dai tuoi finanziamenti reali anziché da un modulo vuoto.",
        "È una delle 58 strutture in un clic per enti finanziatori, istituzioni e industria, applicate in modo reversibile a un unico CV canonico — così puoi preparare un CV ERC e un CV per un altro ente finanziatore dallo stesso registro. Segui sempre le indicazioni ufficiali attuali dell'ERC per il tuo bando.",
      ],
      stepsHeading: "Come creare un CV ERC",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "SigmaCV legge il tuo registro ORCID e OpenAlex pubblico — senza inserimento manuale.",
        },
        {
          title: "Applica la struttura ERC",
          body: "Scegli la struttura in stile ERC; rimodella il tuo CV canonico nella struttura attesa, in modo reversibile.",
        },
        {
          title: "Seleziona per il bando",
          body: "Seleziona le pubblicazioni e i dettagli adatti allo specifico bando ERC.",
        },
        {
          title: "Esporta",
          body: "Esporta in PDF, DOCX o LaTeX, con citazioni coerenti in tutto il documento.",
        },
      ],
      whyHeading: "Perché creare il tuo CV ERC con SigmaCV",
      why: [
        "I CV per enti finanziatori differiscono nella struttura, non nel tuo registro di base. SigmaCV separa le due cose: i tuoi dati vivono in un unico CV canonico, e la struttura ERC è una presentazione applicata al di sopra — così passare da un CV ERC al formato di un altro ente finanziatore è un clic, non una ricostruzione.",
        "È gratuito per i singoli individui e open source, abbina i tuoi lavori tramite identificativo e mantiene le citazioni coerenti. Conferma sempre il modello e le regole ufficiali attuali dell'ERC prima di inviare la candidatura.",
      ],
      faqExtra: [
        {
          q: "Quali altri formati di ente finanziatore sono supportati?",
          a: "58 strutture in un clic che coprono enti finanziatori, istituzioni e industria — tra cui UKRI R4RI, la Royal Society, SNSF, NIH e NSF accanto a ERC — ognuna compilata dal tuo registro di ricerca aperto.",
        },
        {
          q: "Cambiando struttura perderò le mie modifiche?",
          a: "No. Le strutture si applicano in modo reversibile allo stesso CV canonico, quindi la tua selezione viene preservata mentre ti sposti tra i formati.",
        },
        {
          q: "Garantisce la conformità all'ERC?",
          a: "Nessuno strumento può farlo — le regole degli enti finanziatori cambiano. SigmaCV ti offre un punto di partenza in stile ERC; verifica sempre i moduli e le istruzioni ufficiali attuali dell'ERC per il tuo specifico bando.",
        },
      ],
      relatedHeading: "Strumenti correlati per CV di enti finanziatori",
    },
    "import-publications-to-cv": {
      intro: [
        "Ridigitare il tuo elenco di pubblicazioni in un CV è lento e soggetto a errori. SigmaCV importa le tue pubblicazioni automaticamente dal registro di ricerca aperto — accedi con ORCID e i tuoi lavori vengono recuperati, formattati e assemblati in un CV.",
        "Tutto viene abbinato a te tramite identificativo (iD ORCID / OpenAlex), non tramite il nome, così non erediti gli articoli di un omonimo, e ogni citazione è formattata tramite un unico stile CSL per garantire coerenza in ogni esportazione.",
      ],
      stepsHeading: "Come importare le pubblicazioni nel tuo CV",
      steps: [
        {
          title: "Accedi con il tuo iD ORCID",
          body: "SigmaCV legge il tuo registro ORCID pubblico e risolve il tuo profilo OpenAlex.",
        },
        {
          title: "Le pubblicazioni si importano automaticamente",
          body: "I tuoi lavori vengono recuperati da OpenAlex e ORCID e trasformati in voci di CV formattate — senza copia-incolla.",
        },
        {
          title: "Aggiungi tramite DOI ciò che manca",
          body: "Se un articolo non viene trovato, aggiungilo tramite il suo DOI e verrà formattato per corrispondere.",
        },
        {
          title: "Seleziona ed esporta",
          body: "Scegli quali lavori appaiono e in che ordine, poi esporta in PDF, DOCX, LaTeX, Markdown o BibTeX.",
        },
      ],
      whyHeading: "Perché importare dal registro aperto",
      why: [
        "Importare tramite identificativo da fonti aperte è più rapido e più accurato che digitare o cercare tramite il nome: evita le errate attribuzioni che affliggono i nomi comuni e quelli in alfabeti non latini, e mantiene aggiornato il tuo elenco man mano che il registro aperto si aggiorna.",
        "SigmaCV è gratuito per i singoli individui e open source, formatta ogni referenza tramite un unico motore CSL e ti consente di esportare lo stesso elenco selezionato in PDF, DOCX, LaTeX, Markdown, BibTeX e CSL-JSON.",
      ],
      faqExtra: [
        {
          q: "Posso importare da Google Scholar?",
          a: "No — Google Scholar non ha alcuna API pubblica. SigmaCV importa dalle alternative aperte, ORCID e OpenAlex, e puoi aggiungere tramite DOI ciò che manca.",
        },
        {
          q: "Importa tramite il nome?",
          a: "No — tramite l'identificativo d'autore (iD ORCID / OpenAlex), che evita le false corrispondenze comuni con nomi condivisi o traslitterati.",
        },
        {
          q: "Posso esportare l'elenco importato come BibTeX?",
          a: "Sì — oltre a PDF, DOCX, LaTeX e Markdown, SigmaCV esporta le tue pubblicazioni selezionate come BibTeX e CSL-JSON.",
        },
      ],
      relatedHeading: "Altri modi correlati per creare il tuo CV",
    },
  },
  "ko-KR": {
    "cv-from-google-scholar": {
      intro: [
        "많은 연구자가 논문 목록을 Google Scholar에 두고 이를 이력서로 만들고 싶어 합니다 — 그러나 Google Scholar는 이력서를 만들 수 있는 공개 API나 내보내기를 제공하지 않으므로, 어떤 도구도 그것을 안정적으로 할 수 없습니다. 다행히 작동하는 열린 경로가 있습니다.",
        "SigmaCV는 공개된 연구 기록 — 회원님의 ORCID iD와 OpenAlex 프로필 — 으로 학술 이력서를 만듭니다. 이 둘을 합치면 일반적인 Scholar 프로필에 있는 내용의 대부분을 포함하며, 이름이 아니라 식별자로 회원님과 매칭됩니다. 누락된 것은 DOI로 추가할 수 있습니다.",
      ],
      stepsHeading: "Google Scholar 내보내기 없이 이력서를 만드는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "Google Scholar 대신, SigmaCV는 회원님의 공개 ORCID 기록을 읽습니다 (없으면 orcid.org에서 무료로 만들 수 있습니다).",
        },
        {
          title: "논문이 OpenAlex에서 가져와집니다",
          body: "SigmaCV가 회원님의 OpenAlex 저자 프로필을 확인하고 성과물을 가져옵니다 — Scholar 프로필에 견줄 만한 폭넓고 공개된 커버리지입니다.",
        },
        {
          title: "누락분은 DOI로 채우기",
          body: "Scholar 프로필에 있는 논문이 OpenAlex에 없다면 DOI로 추가하세요. 동일한 서식으로 정리됩니다.",
        },
        {
          title: "정리하고 내보내기",
          body: "인용 스타일과 템플릿을 고른 뒤 PDF, DOCX, LaTeX, Markdown으로 내보내거나 — 자동 갱신되는 페이지로 게시하세요.",
        },
      ],
      whyHeading: "왜 Google Scholar가 아니라 ORCID + OpenAlex인가",
      why: [
        "Google Scholar는 탐색에는 편리하지만 닫혀 있습니다. API나 일괄 내보내기가 없고 이름으로 매칭하므로 동명이인 저자가 뒤섞입니다. ORCID와 OpenAlex는 공개되어 있고 식별자 기반이며 재사용을 위해 만들어졌습니다 — 정확한 이력서를 구성하는 데 도구가 필요로 하는 바로 그것입니다.",
        "SigmaCV는 개인에게 무료이며 오픈 소스이고, 공개 메타데이터만 읽으며, 회원님의 업적을 ORCID / OpenAlex 식별자로 매칭합니다. 따라서 이력서는 동명이인이 아닌 회원님의 업적을 반영합니다.",
      ],
      faqExtra: [
        {
          q: "Google Scholar에 API가 있나요?",
          a: "아니요. Google Scholar는 공식 공개 API나 내보내기를 제공하지 않으며, 그래서 이력서를 그것으로 직접 만들 수 없습니다. ORCID와 OpenAlex가 공개되고 재사용 가능한 대안입니다.",
        },
        {
          q: "ORCID iD는 어떻게 받나요?",
          a: "orcid.org에서 약 1분 만에 무료로 등록할 수 있습니다. SigmaCV — 그리고 많은 출판사와 지원기관 — 이 회원님의 업적을 안정적으로 찾는 데 사용하는 식별자입니다.",
        },
        {
          q: "제 OpenAlex 기록이 Scholar 목록과 일치할까요?",
          a: "보통 매우 비슷합니다 — OpenAlex는 폭넓은 커버리지를 갖습니다. 차이가 있는 부분은 표시 내용을 직접 정리하고 누락분은 DOI로 추가하면 됩니다.",
        },
      ],
      relatedHeading: "이력서를 만드는 관련 방법",
    },
    "erc-cv": {
      intro: [
        "European Research Council에 지원한다는 것은 회원님의 CV를 ERC가 기대하는 구조로 제시한다는 뜻입니다. SigmaCV는 회원님의 공개된 연구 기록을 모아 ERC 양식 레이아웃을 적용하므로, 빈 양식이 아니라 실제 논문과 연구비에서 시작합니다.",
        "이는 58가지 원클릭 지원기관·기관·산업 레이아웃 중 하나로, 하나의 정규 이력서에 가역적으로 적용됩니다 — 따라서 동일한 기록에서 ERC CV와 다른 지원기관의 CV를 준비할 수 있습니다. 회원님의 공모에 대해서는 언제나 ERC의 현행 공식 안내를 따르세요.",
      ],
      stepsHeading: "ERC CV를 만드는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "SigmaCV가 회원님의 공개 ORCID와 OpenAlex 기록을 읽습니다 — 수동 입력이 필요 없습니다.",
        },
        {
          title: "ERC 레이아웃 적용",
          body: "ERC 양식 레이아웃을 선택하세요. 회원님의 정규 이력서를 기대되는 구조로, 가역적으로 재구성합니다.",
        },
        {
          title: "공모에 맞춰 정리",
          body: "특정 ERC 공모에 맞는 논문과 세부 사항을 선택하세요.",
        },
        {
          title: "내보내기",
          body: "전체에 걸쳐 일관된 인용과 함께 PDF, DOCX, LaTeX으로 내보냅니다.",
        },
      ],
      whyHeading: "왜 SigmaCV로 ERC CV를 만드는가",
      why: [
        "지원기관 CV는 기저의 기록이 아니라 구조에서 차이가 납니다. SigmaCV는 둘을 분리합니다. 회원님의 데이터는 하나의 정규 이력서에 담기고, ERC 레이아웃은 그 위에 적용되는 표현입니다 — 따라서 ERC CV에서 다른 지원기관 형식으로 전환하는 것은 클릭 한 번이지, 다시 만드는 일이 아닙니다.",
        "개인에게 무료이며 오픈 소스이고, 회원님의 업적을 식별자로 매칭하며, 인용을 일관되게 유지합니다. 제출 전에는 언제나 ERC의 현행 공식 템플릿과 규정을 확인하세요.",
      ],
      faqExtra: [
        {
          q: "다른 지원기관 형식은 어떤 것이 지원되나요?",
          a: "지원기관·기관·산업을 아우르는 58가지 원클릭 레이아웃입니다 — ERC와 함께 UKRI R4RI, Royal Society, SNSF, NIH, NSF를 포함하며, 각각 회원님의 공개된 연구 기록에서 채워집니다.",
        },
        {
          q: "레이아웃을 전환하면 편집 내용이 사라지나요?",
          a: "아니요. 레이아웃은 동일한 정규 이력서에 가역적으로 적용되므로, 형식 간을 오가더라도 정리 내용이 보존됩니다.",
        },
        {
          q: "ERC 규정 준수를 보장하나요?",
          a: "어떤 도구도 보장할 수 없습니다 — 지원기관 규정은 바뀝니다. SigmaCV는 ERC 양식의 출발점을 제공할 뿐이니, 해당 공모에 맞는 ERC의 현행 공식 양식과 안내를 언제나 확인하세요.",
        },
      ],
      relatedHeading: "관련 지원기관 CV 도구",
    },
    "import-publications-to-cv": {
      intro: [
        "논문 목록을 이력서에 다시 입력하는 일은 느리고 오류가 생기기 쉽습니다. SigmaCV는 공개된 연구 기록에서 회원님의 논문을 자동으로 가져옵니다 — ORCID로 로그인하면 성과물을 가져와 서식화하고 이력서로 구성합니다.",
        "모든 것이 이름이 아니라 식별자(ORCID / OpenAlex ID)로 회원님과 매칭되므로 동명이인의 논문을 떠안지 않으며, 모든 인용은 하나의 CSL 스타일로 서식화되어 모든 내보내기에서 일관성을 유지합니다.",
      ],
      stepsHeading: "논문을 이력서로 가져오는 방법",
      steps: [
        {
          title: "ORCID iD로 로그인",
          body: "SigmaCV가 회원님의 공개 ORCID 기록을 읽고 OpenAlex 프로필을 확인합니다.",
        },
        {
          title: "논문이 자동으로 가져와집니다",
          body: "회원님의 성과물을 OpenAlex와 ORCID에서 가져와 서식화된 이력서 항목으로 만듭니다 — 복사·붙여넣기가 없습니다.",
        },
        {
          title: "누락된 것은 DOI로 추가",
          body: "논문이 발견되지 않으면 DOI로 추가하세요. 동일한 서식으로 정리됩니다.",
        },
        {
          title: "정리하고 내보내기",
          body: "어떤 성과물을 어떤 순서로 표시할지 선택한 뒤 PDF, DOCX, LaTeX, Markdown, BibTeX로 내보냅니다.",
        },
      ],
      whyHeading: "왜 공개 기록에서 가져오는가",
      why: [
        "공개 출처에서 식별자로 가져오는 것은 직접 입력하거나 이름 기반으로 검색하는 것보다 빠르면서도 정확합니다. 흔한 이름과 비라틴 문자 이름에서 끊임없이 발생하는 오귀속을 피하고, 공개 기록이 갱신됨에 따라 목록을 최신 상태로 유지합니다.",
        "SigmaCV는 개인에게 무료이며 오픈 소스이고, 모든 참고문헌을 하나의 CSL 엔진으로 서식화하며, 동일하게 정리된 목록을 PDF, DOCX, LaTeX, Markdown, BibTeX, CSL-JSON으로 내보낼 수 있게 합니다.",
      ],
      faqExtra: [
        {
          q: "Google Scholar에서 가져올 수 있나요?",
          a: "아니요 — Google Scholar에는 공개 API가 없습니다. SigmaCV는 열린 대안인 ORCID와 OpenAlex에서 가져오며, 누락된 것은 DOI로 추가할 수 있습니다.",
        },
        {
          q: "이름으로 가져오나요?",
          a: "아니요 — 저자 식별자(ORCID / OpenAlex ID)로 가져옵니다. 이를 통해 공유되거나 음역된 이름에서 흔히 발생하는 오매칭을 피합니다.",
        },
        {
          q: "가져온 목록을 BibTeX로 내보낼 수 있나요?",
          a: "네 — PDF, DOCX, LaTeX, Markdown과 함께, SigmaCV는 회원님이 정리한 논문을 BibTeX 및 CSL-JSON으로 내보냅니다.",
        },
      ],
      relatedHeading: "이력서를 만드는 관련 방법",
    },
  },
  "ru-RU": {
    "cv-from-google-scholar": {
      intro: [
        "Многие исследователи ведут список своих публикаций в Google Scholar и хотят превратить его в резюме — но Google Scholar не предлагает публичного API или экспорта, из которого его можно было бы построить, поэтому ни один инструмент не может сделать это надёжно. Хорошая новость: есть открытый путь, который работает.",
        "SigmaCV формирует ваше академическое резюме из открытой научной записи — вашего iD ORCID и профиля OpenAlex, — которые вместе охватывают большую часть того, что есть в типичном профиле Scholar, сопоставляя их с вами по идентификатору, а не по имени. Всё недостающее вы можете добавить по DOI.",
      ],
      stepsHeading: "Как построить резюме без экспорта из Google Scholar",
      steps: [
        {
          title: "Войдите через ваш iD ORCID",
          body: "Вместо Google Scholar SigmaCV считывает вашу открытую запись ORCID (её можно бесплатно создать на orcid.org, если у вас её ещё нет).",
        },
        {
          title: "Ваши публикации импортируются из OpenAlex",
          body: "SigmaCV определяет ваш профиль автора в OpenAlex и подтягивает ваши работы — широкое, открытое покрытие, сопоставимое с профилем Scholar.",
        },
        {
          title: "Восполните пробелы по DOI",
          body: "Если статьи из вашего профиля Scholar нет в OpenAlex, добавьте её по DOI; она будет отформатирована в едином стиле.",
        },
        {
          title: "Отберите и экспортируйте",
          body: "Выберите стиль цитирования и шаблон, затем экспортируйте в PDF, DOCX, LaTeX или Markdown — либо опубликуйте живую страницу.",
        },
      ],
      whyHeading: "Почему ORCID + OpenAlex, а не Google Scholar",
      why: [
        "Google Scholar удобен для поиска, но закрыт: у него нет API или массового экспорта, и он сопоставляет по имени, что путает авторов с распространёнными именами. ORCID и OpenAlex открыты, основаны на идентификаторах и созданы для повторного использования — именно то, что нужно инструменту, чтобы собрать точное резюме.",
        "SigmaCV бесплатен для частных лиц и имеет открытый исходный код, считывает только публичные метаданные и сопоставляет ваши работы по идентификатору ORCID / OpenAlex, поэтому ваше резюме отражает именно ваши работы, а не работы однофамильца.",
      ],
      faqExtra: [
        {
          q: "Есть ли у Google Scholar API?",
          a: "Нет. Google Scholar не предоставляет официального публичного API или экспорта, поэтому резюме нельзя построить напрямую из него. ORCID и OpenAlex — это открытые, пригодные для повторного использования альтернативы.",
        },
        {
          q: "Как получить iD ORCID?",
          a: "Зарегистрируйтесь бесплатно на orcid.org примерно за минуту. Это тот идентификатор, который SigmaCV — а также многие издатели и грантодатели — использует, чтобы надёжно находить ваши работы.",
        },
        {
          q: "Будет ли моя запись в OpenAlex соответствовать списку в Scholar?",
          a: "Обычно очень близко — у OpenAlex широкое покрытие. Там, где есть расхождения, вы курируете то, что отображается, и добавляете недостающее по DOI.",
        },
      ],
      relatedHeading: "Другие способы построить резюме",
    },
    "erc-cv": {
      intro: [
        "Подача заявки в Европейский исследовательский совет означает, что ваше резюме нужно представить в ожидаемой ERC структуре. SigmaCV собирает вашу открытую научную запись и применяет макет в стиле ERC, поэтому вы начинаете со своих реальных публикаций и финансирования, а не с пустой формы.",
        "Это один из 58 макетов «в один щелчок» для грантодателей, учреждений и индустрии, применяемых обратимо к одному каноническому резюме, — поэтому вы можете подготовить резюме для ERC и резюме для другого грантодателя из той же записи. Всегда следуйте актуальным официальным рекомендациям ERC для вашего конкурса.",
      ],
      stepsHeading: "Как создать резюме для ERC",
      steps: [
        {
          title: "Войдите через ваш iD ORCID",
          body: "SigmaCV считывает вашу открытую запись ORCID и OpenAlex — без ручного ввода.",
        },
        {
          title: "Примените макет ERC",
          body: "Выберите макет в стиле ERC; он перестраивает ваше каноническое резюме в ожидаемую структуру, обратимо.",
        },
        {
          title: "Отберите под конкурс",
          body: "Выберите публикации и сведения, подходящие для конкретного конкурса ERC.",
        },
        {
          title: "Экспортируйте",
          body: "Экспортируйте в PDF, DOCX или LaTeX с единообразными ссылками по всему документу.",
        },
      ],
      whyHeading: "Почему стоит создавать резюме для ERC с SigmaCV",
      why: [
        "Резюме для грантодателей различаются по структуре, а не по вашей базовой записи. SigmaCV разделяет эти две вещи: ваши данные хранятся в одном каноническом резюме, а макет ERC — это представление, применяемое поверх, — поэтому переход от резюме для ERC к формату другого грантодателя — это щелчок, а не пересборка.",
        "Сервис бесплатен для частных лиц и имеет открытый исходный код, сопоставляет ваши работы по идентификатору и сохраняет единообразие ссылок. Перед подачей всегда подтверждайте актуальный официальный шаблон и правила ERC.",
      ],
      faqExtra: [
        {
          q: "Какие другие форматы грантодателей поддерживаются?",
          a: "58 макетов «в один щелчок», охватывающих грантодателей, учреждения и индустрию — включая UKRI R4RI, Royal Society, SNSF, NIH и NSF наряду с ERC, — каждый заполняется из вашей открытой научной записи.",
        },
        {
          q: "Потеряю ли я правки при переключении макетов?",
          a: "Нет. Макеты применяются обратимо к одному и тому же каноническому резюме, поэтому ваш отбор сохраняется при переходе между форматами.",
        },
        {
          q: "Гарантирует ли это соответствие требованиям ERC?",
          a: "Ни один инструмент не может этого гарантировать — правила грантодателей меняются. SigmaCV даёт вам отправную точку в стиле ERC; всегда сверяйтесь с актуальными официальными формами и инструкциями ERC для вашего конкретного конкурса.",
        },
      ],
      relatedHeading: "Похожие инструменты резюме для грантодателей",
    },
    "import-publications-to-cv": {
      intro: [
        "Перепечатывать список публикаций в резюме — долго и чревато ошибками. SigmaCV импортирует ваши публикации автоматически из открытой научной записи — войдите через ORCID, и ваши работы будут подтянуты, отформатированы и собраны в резюме.",
        "Всё сопоставляется с вами по идентификатору (ORCID / OpenAlex ID), а не по имени, поэтому вы не наследуете статьи однофамильца, и каждая ссылка форматируется через единый стиль CSL для единообразия во всех формах вывода.",
      ],
      stepsHeading: "Как импортировать публикации в резюме",
      steps: [
        {
          title: "Войдите через ваш iD ORCID",
          body: "SigmaCV считывает вашу открытую запись ORCID и определяет ваш профиль в OpenAlex.",
        },
        {
          title: "Публикации импортируются автоматически",
          body: "Ваши работы подтягиваются из OpenAlex и ORCID и превращаются в отформатированные записи резюме — без копирования-вставки.",
        },
        {
          title: "Добавьте недостающее по DOI",
          body: "Если статья не найдена, добавьте её по DOI, и она будет отформатирована в едином стиле.",
        },
        {
          title: "Отберите и экспортируйте",
          body: "Выберите, какие работы отображать и в каком порядке, затем экспортируйте в PDF, DOCX, LaTeX, Markdown или BibTeX.",
        },
      ],
      whyHeading: "Почему стоит импортировать из открытой записи",
      why: [
        "Импорт по идентификатору из открытых источников быстрее и точнее, чем ввод вручную или поиск по имени: он исключает ошибочные приписывания, которые свойственны распространённым именам и именам в нелатинской письменности, и поддерживает ваш список актуальным по мере обновления открытой записи.",
        "SigmaCV бесплатен для частных лиц и имеет открытый исходный код, форматирует каждую ссылку через единый движок CSL и позволяет экспортировать один и тот же отобранный список в PDF, DOCX, LaTeX, Markdown, BibTeX и CSL-JSON.",
      ],
      faqExtra: [
        {
          q: "Можно ли импортировать из Google Scholar?",
          a: "Нет — у Google Scholar нет публичного API. SigmaCV импортирует из открытых альтернатив — ORCID и OpenAlex, — а недостающее вы можете добавить по DOI.",
        },
        {
          q: "Сопоставляет ли он по имени?",
          a: "Нет — по идентификатору автора (ORCID / OpenAlex ID), что исключает ложные совпадения, характерные для общих или транслитерированных имён.",
        },
        {
          q: "Можно ли экспортировать импортированный список как BibTeX?",
          a: "Да — наряду с PDF, DOCX, LaTeX и Markdown SigmaCV экспортирует ваши отобранные публикации как BibTeX и CSL-JSON.",
        },
      ],
      relatedHeading: "Другие способы построить резюме",
    },
  },
};

/** Localized thin copy for a topic page (falls back to English). */
export function topicPageStrings(page: TopicPageId, locale: string): LandingPageStrings {
  return TOPIC_PAGES_I18N[asLocale(locale)][page];
}

/** Localized deep content for a topic page (falls back to English). */
export function topicPageContent(page: TopicPageId, locale: string): LandingPageContent {
  return TOPIC_CONTENT_I18N[asLocale(locale)][page];
}
