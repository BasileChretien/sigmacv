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
export const LANDING_PAGE_IDS = ["orcid-to-cv", "nih-biosketch"] as const;
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

const LANDING_PAGES_I18N: Record<
  Locale,
  Record<LandingPageId, LandingPageStrings>
> = {
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
  },
};

/** Localized copy for a given SEO landing page (falls back to English). */
export function landingPageStrings(
  page: LandingPageId,
  locale: string,
): LandingPageStrings {
  return LANDING_PAGES_I18N[asLocale(locale)][page];
}
