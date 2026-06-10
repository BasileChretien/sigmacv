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

export const PERSONA_PAGE_IDS = ["phd-cv", "postdoc-cv"] as const;
export type PersonaPageId = (typeof PERSONA_PAGE_IDS)[number];

/** Cross-links for each persona page (existing landing ids or other personas). */
export const PERSONA_RELATED: Record<PersonaPageId, readonly (LandingPageId | PersonaPageId)[]> = {
  "phd-cv": ["postdoc-cv", "orcid-to-cv", "academic-cv-template"],
  "postdoc-cv": ["phd-cv", "funder-cv-templates", "publication-list"],
};

const PERSONA_PAGES_I18N: Record<Locale, Record<PersonaPageId, LandingPageStrings>> = {
  "en-US": {
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
