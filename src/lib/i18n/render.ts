import { asLocale, type Locale } from "./index";

/**
 * Localized strings that appear in the RENDERED CV (the exported PDF/DOCX/LaTeX/
 * Markdown and the public page) — charts, the metrics line, the authorship
 * table, and the provenance footer. Keyed off `cv.display.locale` so the
 * document is fully in the chosen language. Distinct from the editor chrome
 * dictionary (`t`), but enforced the same way: Record<Locale, RenderStrings>
 * makes a missing translation a compile error.
 */
export interface RenderStrings {
  chartPublicationsPerYear: string;
  chartCitationsPerYear: string;
  authorshipCaption: string;
  /** Caveat shown under the authorship table when a "corresponding" row is present. */
  authorshipCorrespondingNote: string;
  /** Provenance caveat: peer-reviewed vs preprint split is a heuristic. */
  provClassificationNote: string;
  provGeneratedFrom: string;
  provOn: string;
  provRecords: string;
  provHidden: string;
  provCorrected: string;
  sourceManualEntries: string;
  sourceDerived: string;
  cvFallbackTitle: string;
  /** Date-range term for an ongoing position/education entry ("…–present"). */
  datePresent: string;
  /** Date-range term for an end-only range; "{year}" → the end year ("until {year}"). */
  dateUntil: string;
  /** Short label inside the open-access badge on a publication entry. */
  badgeOpenAccess: string;
  /** Accessible title/tooltip for the OA badge; "{status}" → the OA status. */
  badgeOpenAccessTitle: string;
  /** Profile-level open-access label (the metric-row term, e.g. "Open access");
   *  the percentage value is formatted separately at render time. */
  openAccessLabel: string;
  /** Default heading for the research-summary block when it renders as its own
   *  section ("top"/"bottom" placement) and the user left the heading blank. */
  researchSummaryHeading: string;
  /** Public "What's new" strip label — the most recent sync's additions. */
  whatsNewLabel: string;
  /** Accessible label for the research-output breadth ledger ("N Publications · …"). */
  outputSummaryLabel: string;
  /** Inline "Retracted" badge label on a retracted publication entry. */
  badgeRetracted: string;
  /** Accessible title/tooltip for the retracted badge. */
  badgeRetractedTitle: string;
  /** Per-entry citation-count badge; "{n}" → the (locale-formatted) count. */
  badgeCitations: string;
  /** Tooltip caveat on the citation pill (raw counts aren't field-normalised). */
  badgeCitationsTitle: string;
  metric2yr: string;
  metricFwci: string;
  metricHIndex: string;
  metricI10: string;
  metricWorks: string;
  metricCitations: string;
  metricContextFwci: string;
  metricContext2yr: string;
  /** Coverage note appended to mean-FWCI; "{n}" is replaced with the work count. */
  metricFwciCoverage: string;
  /** Label for the NIH iCite mean-RCR metric. */
  metricRcr: string;
  /** Responsible-reading context for mean-RCR (benchmark + biomedical caveat). */
  metricContextRcr: string;
  /** Coverage note appended to mean-RCR; "{n}" is replaced with the work count. */
  metricRcrCoverage: string;
  roleFirst: string;
  roleSecond: string;
  roleThird: string;
  roleMiddle: string;
  roleSecondLast: string;
  roleLast: string;
  roleCorresponding: string;
  /** Prefix of the public-page "Made with SigmaCV" footer; "SigmaCV" follows untranslated. */
  madeWith: string;
  /** Label beside the document QR + link to this CV's public live page ("Live version"). */
  liveVersionLabel: string;
  /** Public-page "living CV" line; "{date}" is the localized last-synced date. */
  livingNote: string;
  /** Public-page hint that the publications can be saved to a reference manager
   *  (Zotero/Mendeley) via the browser connector — the page carries COinS metadata. */
  refManagerNote: string;
  /** Heading for the public-page "Co-authors on SigmaCV" block (opt-in); "SigmaCV" stays untranslated. */
  coauthorsHeading: string;
  /** Tooltip/aria for the institution→ROR-record link on a positions/education line. */
  rorRecordTitle: string;
  /** Tooltip/aria when the institution name links to its own homepage (ROR `links.website`). */
  institutionSiteTitle: string;
  /** Header label for the aggregated "Research areas" chip row (opt-in). */
  researchAreasLabel: string;
  /** Public-page per-publication "Cite" disclosure label. */
  citeLabel: string;
  /** Public-page per-publication "Abstract" disclosure label. */
  abstractLabel: string;
  /** Public-page per-publication open-access "Full text" link label. */
  fullTextLabel: string;
  /** "Selected" star badge on a featured publication. */
  badgeFeatured: string;
  /** Tooltip for the featured-publication star badge. */
  badgeFeaturedTitle: string;
  /** Public-page "Subscribe" (Atom/RSS feed) link label. */
  subscribeLabel: string;
  /** Hint shown when the public-page "Subscribe" disclosure is opened — explains that the feed URL goes into an RSS reader. */
  subscribeHint: string;
  /** Leading label of the public-page view-filter bar. */
  filterLabel: string;
  /** Filter chip: clear all filters / show everything. */
  filterAll: string;
  /** Filter chip for a year cutoff; "{year}" -> the start year ("Since 2021"). */
  filterSince: string;
  /** Filter chip: open-access works only. */
  filterOpenAccess: string;
  /** Work-type filter chip labels (bucketed: article/preprint/review/conference/book/dataset). */
  filterTypeArticle: string;
  filterTypePreprint: string;
  filterTypeReview: string;
  filterTypeConference: string;
  filterTypeBook: string;
  filterTypeDataset: string;
}

const RENDER_I18N: Record<Locale, RenderStrings> = {
  "en-US": {
    refManagerNote:
      "Save these publications to a reference manager (Zotero, Mendeley…) — your browser connector will detect them.",
    researchAreasLabel: "Research areas",
    citeLabel: "Cite",
    abstractLabel: "Abstract",
    fullTextLabel: "Full text",
    badgeFeatured: "Selected",
    badgeFeaturedTitle: "Selected / featured publication",
    subscribeLabel: "Subscribe",
    subscribeHint: "Add this feed URL to your RSS reader:",
    filterLabel: "Filter",
    filterAll: "All",
    filterSince: "Since {year}",
    filterOpenAccess: "Open access",
    filterTypeArticle: "Articles",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Reviews",
    filterTypeConference: "Conference",
    filterTypeBook: "Books",
    filterTypeDataset: "Datasets",
    coauthorsHeading: "Co-authors on SigmaCV",
    datePresent: "present",
    dateUntil: "until {year}",
    chartPublicationsPerYear: "Publications / year",
    chartCitationsPerYear: "Citations / year",
    authorshipCaption: "Authorship (peer-reviewed)",
    authorshipCorrespondingNote: "Corresponding-author data (OpenAlex) is often incomplete.",
    provClassificationNote: "Peer-reviewed vs. preprint classification is heuristic.",
    provGeneratedFrom: "Generated from",
    provOn: "on",
    provRecords: "records",
    provHidden: "hidden",
    provCorrected: "corrected",
    sourceManualEntries: "manual entries",
    sourceDerived: "derived",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Open access ({status})",
    openAccessLabel: "Open access",
    researchSummaryHeading: "Research summary",
    whatsNewLabel: "Recently added",
    outputSummaryLabel: "Research output",
    badgeRetracted: "Retracted",
    badgeRetractedTitle: "This work has been retracted (per Crossref / Retraction Watch)",
    badgeCitations: "{n} citations",
    badgeCitationsTitle: "Raw citation count — not field-normalised (varies by field and age)",
    metric2yr: "2-yr mean citedness",
    metricFwci: "Mean work FWCI",
    metricHIndex: "h-index",
    metricI10: "i10-index",
    metricWorks: "Works",
    metricCitations: "Citations",
    metricContextFwci: "1.0 = world average for field & year",
    metricContext2yr: "2-year citation rate — not field-normalised (varies by field)",
    metricFwciCoverage: "mean over {n} works with FWCI",
    metricRcr: "Mean RCR",
    metricContextRcr: "1.0 = NIH-funded average; biomedical (PMID) works only",
    metricRcrCoverage: "mean over {n} works with RCR",
    roleFirst: "First author",
    roleSecond: "Second author",
    roleThird: "Third author",
    roleMiddle: "k-th author",
    roleSecondLast: "Second-to-last author",
    roleLast: "Last author",
    roleCorresponding: "Corresponding author",
    madeWith: "Made with",
    liveVersionLabel: "Live version",
    livingNote: "Updated {date} · living CV, updates automatically",
    rorRecordTitle: "ROR organization record",
    institutionSiteTitle: "Institution website",
  },
  "zh-CN": {
    refManagerNote:
      "可将这些论文保存到文献管理器（Zotero、Mendeley 等）——你的浏览器连接器会自动识别它们。",
    researchAreasLabel: "研究领域",
    citeLabel: "引用",
    abstractLabel: "摘要",
    fullTextLabel: "全文",
    badgeFeatured: "精选",
    badgeFeaturedTitle: "精选 / 重点论文",
    subscribeLabel: "订阅",
    subscribeHint: "将此订阅源网址添加到您的 RSS 阅读器：",
    filterLabel: "筛选",
    filterAll: "全部",
    filterSince: "{year} 年起",
    filterOpenAccess: "开放获取",
    filterTypeArticle: "论文",
    filterTypePreprint: "预印本",
    filterTypeReview: "综述",
    filterTypeConference: "会议",
    filterTypeBook: "书籍",
    filterTypeDataset: "数据集",
    coauthorsHeading: "也在 SigmaCV 的合作者",
    datePresent: "至今",
    dateUntil: "至 {year}",
    chartPublicationsPerYear: "年度发表数",
    chartCitationsPerYear: "年度被引数",
    authorshipCaption: "作者署名（同行评审）",
    authorshipCorrespondingNote: "通讯作者数据（来自 OpenAlex）通常不完整。",
    provClassificationNote: "同行评审与预印本的分类为启发式判断。",
    provGeneratedFrom: "数据来源",
    provOn: "时间",
    provRecords: "条记录",
    provHidden: "已隐藏",
    provCorrected: "已更正",
    sourceManualEntries: "手动录入",
    sourceDerived: "推导得出",
    cvFallbackTitle: "简历",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "开放获取（{status}）",
    openAccessLabel: "开放获取",
    researchSummaryHeading: "研究概要",
    whatsNewLabel: "最近新增",
    outputSummaryLabel: "研究产出",
    badgeRetracted: "已撤稿",
    badgeRetractedTitle: "该成果已被撤稿（依据 Crossref／Retraction Watch）",
    badgeCitations: "被引 {n}",
    badgeCitationsTitle: "原始被引次数——未经领域标准化（因领域与年代而异）",
    metric2yr: "两年平均被引率",
    metricFwci: "平均成果 FWCI",
    metricHIndex: "h 指数",
    metricI10: "i10 指数",
    metricWorks: "成果数",
    metricCitations: "被引数",
    metricContextFwci: "1.0 = 同领域同年度的全球平均水平",
    metricContext2yr: "两年期被引率 — 非领域归一化（因领域而异）",
    metricFwciCoverage: "基于 {n} 篇有 FWCI 的成果的均值",
    metricRcr: "平均 RCR",
    metricContextRcr: "1.0 = NIH 资助论文的平均水平；仅限生物医学（PMID）成果",
    metricRcrCoverage: "基于 {n} 篇有 RCR 的成果的均值",
    roleFirst: "第一作者",
    roleSecond: "第二作者",
    roleThird: "第三作者",
    roleMiddle: "第 k 作者",
    roleSecondLast: "倒数第二作者",
    roleLast: "末位作者",
    roleCorresponding: "通讯作者",
    madeWith: "制作工具：",
    liveVersionLabel: "在线版本",
    livingNote: "更新于 {date} · 在线简历，自动更新",
    rorRecordTitle: "ROR 机构记录",
    institutionSiteTitle: "机构网站",
  },
  "es-ES": {
    refManagerNote:
      "Guarda estas publicaciones en un gestor de referencias (Zotero, Mendeley…): el conector de tu navegador las detectará.",
    researchAreasLabel: "Áreas de investigación",
    citeLabel: "Citar",
    abstractLabel: "Resumen",
    fullTextLabel: "Texto completo",
    badgeFeatured: "Destacada",
    badgeFeaturedTitle: "Publicación destacada / seleccionada",
    subscribeLabel: "Suscribirse",
    subscribeHint: "Añade esta URL de feed a tu lector de RSS:",
    filterLabel: "Filtrar",
    filterAll: "Todas",
    filterSince: "Desde {year}",
    filterOpenAccess: "Acceso abierto",
    filterTypeArticle: "Artículos",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Revisiones",
    filterTypeConference: "Congresos",
    filterTypeBook: "Libros",
    filterTypeDataset: "Conjuntos de datos",
    coauthorsHeading: "Coautores en SigmaCV",
    datePresent: "presente",
    dateUntil: "hasta {year}",
    chartPublicationsPerYear: "Publicaciones / año",
    chartCitationsPerYear: "Citas / año",
    authorshipCaption: "Autoría (revisado por pares)",
    authorshipCorrespondingNote:
      "Los datos de autor de correspondencia (OpenAlex) suelen estar incompletos.",
    provClassificationNote: "La clasificación revisado por pares/preimpresión es heurística.",
    provGeneratedFrom: "Generado a partir de",
    provOn: "el",
    provRecords: "registros",
    provHidden: "ocultos",
    provCorrected: "corregidos",
    sourceManualEntries: "entradas manuales",
    sourceDerived: "derivado",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Acceso abierto ({status})",
    openAccessLabel: "Acceso abierto",
    researchSummaryHeading: "Resumen de investigación",
    whatsNewLabel: "Añadido recientemente",
    outputSummaryLabel: "Producción científica",
    badgeRetracted: "Retractado",
    badgeRetractedTitle: "Este trabajo ha sido retractado (según Crossref / Retraction Watch)",
    badgeCitations: "{n} citas",
    badgeCitationsTitle:
      "Recuento bruto de citas — sin normalización por campo (varía por campo y antigüedad)",
    metric2yr: "Citación media a 2 años",
    metricFwci: "FWCI medio por trabajo",
    metricHIndex: "índice h",
    metricI10: "índice i10",
    metricWorks: "Trabajos",
    metricCitations: "Citas",
    metricContextFwci: "1,0 = media mundial del campo y año",
    metricContext2yr: "tasa de citación a 2 años — no normalizada por campo (varía según el campo)",
    metricFwciCoverage: "media sobre {n} trabajos con FWCI",
    metricRcr: "RCR medio",
    metricContextRcr:
      "1,0 = media de artículos financiados por los NIH; solo trabajos biomédicos (PMID)",
    metricRcrCoverage: "media sobre {n} trabajos con RCR",
    roleFirst: "Primer autor",
    roleSecond: "Segundo autor",
    roleThird: "Tercer autor",
    roleMiddle: "k-ésimo autor",
    roleSecondLast: "Penúltimo autor",
    roleLast: "Último autor",
    roleCorresponding: "Autor de correspondencia",
    madeWith: "Hecho con",
    liveVersionLabel: "Versión en línea",
    livingNote: "Actualizado el {date} · CV vivo, se actualiza solo",
    rorRecordTitle: "Ficha de la organización en ROR",
    institutionSiteTitle: "Sitio web de la institución",
  },
  "fr-FR": {
    refManagerNote:
      "Enregistrez ces publications dans un gestionnaire de références (Zotero, Mendeley…) — le connecteur de votre navigateur les détectera.",
    researchAreasLabel: "Domaines de recherche",
    citeLabel: "Citer",
    abstractLabel: "Résumé",
    fullTextLabel: "Texte intégral",
    badgeFeatured: "Sélection",
    badgeFeaturedTitle: "Publication sélectionnée / mise en avant",
    subscribeLabel: "S'abonner",
    subscribeHint: "Ajoutez cette URL de flux à votre lecteur RSS :",
    filterLabel: "Filtrer",
    filterAll: "Tout",
    filterSince: "Depuis {year}",
    filterOpenAccess: "Libre accès",
    filterTypeArticle: "Articles",
    filterTypePreprint: "Préprints",
    filterTypeReview: "Synthèses",
    filterTypeConference: "Conférences",
    filterTypeBook: "Livres",
    filterTypeDataset: "Jeux de données",
    coauthorsHeading: "Co-auteurs sur SigmaCV",
    datePresent: "présent",
    dateUntil: "jusqu’en {year}",
    chartPublicationsPerYear: "Publications / an",
    chartCitationsPerYear: "Citations / an",
    authorshipCaption: "Rôles d’auteur (évalués par les pairs)",
    authorshipCorrespondingNote:
      "Les données d’auteur correspondant (OpenAlex) sont souvent incomplètes.",
    provClassificationNote: "La distinction évalué par les pairs / prépublication est heuristique.",
    provGeneratedFrom: "Généré à partir de",
    provOn: "le",
    provRecords: "enregistrements",
    provHidden: "masqués",
    provCorrected: "corrigés",
    sourceManualEntries: "saisies manuelles",
    sourceDerived: "dérivé",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Accès libre ({status})",
    openAccessLabel: "Accès libre",
    researchSummaryHeading: "Synthèse de recherche",
    whatsNewLabel: "Ajouté récemment",
    outputSummaryLabel: "Production scientifique",
    badgeRetracted: "Rétracté",
    badgeRetractedTitle: "Ce travail a été rétracté (selon Crossref / Retraction Watch)",
    badgeCitations: "{n} citations",
    badgeCitationsTitle:
      "Nombre brut de citations — non normalisé par domaine (varie selon le domaine et l’ancienneté)",
    metric2yr: "Citations moyennes sur 2 ans",
    metricFwci: "FWCI moyen des travaux",
    metricHIndex: "indice h",
    metricI10: "indice i10",
    metricWorks: "Travaux",
    metricCitations: "Citations",
    metricContextFwci: "1,0 = moyenne mondiale pour le domaine et l’année",
    metricContext2yr:
      "taux de citation sur 2 ans — non normalisé par domaine (varie selon le domaine)",
    metricFwciCoverage: "moyenne sur {n} travaux avec FWCI",
    metricRcr: "RCR moyen",
    metricContextRcr:
      "1,0 = moyenne des articles financés par les NIH ; uniquement les travaux biomédicaux (PMID)",
    metricRcrCoverage: "moyenne sur {n} travaux avec RCR",
    roleFirst: "Premier auteur",
    roleSecond: "Deuxième auteur",
    roleThird: "Troisième auteur",
    roleMiddle: "k-ième auteur",
    roleSecondLast: "Avant-dernier auteur",
    roleLast: "Dernier auteur",
    roleCorresponding: "Auteur correspondant",
    madeWith: "Créé avec",
    liveVersionLabel: "Version en ligne",
    livingNote: "Mis à jour le {date} · CV vivant, mis à jour automatiquement",
    rorRecordTitle: "Fiche de l’organisation dans ROR",
    institutionSiteTitle: "Site web de l’établissement",
  },
  "de-DE": {
    refManagerNote:
      "Speichern Sie diese Publikationen in einem Literaturverwaltungsprogramm (Zotero, Mendeley…) — Ihr Browser-Connector erkennt sie automatisch.",
    researchAreasLabel: "Forschungsgebiete",
    citeLabel: "Zitieren",
    abstractLabel: "Zusammenfassung",
    fullTextLabel: "Volltext",
    badgeFeatured: "Ausgewählt",
    badgeFeaturedTitle: "Ausgewählte / hervorgehobene Publikation",
    subscribeLabel: "Abonnieren",
    subscribeHint: "Füge diese Feed-URL zu deinem RSS-Reader hinzu:",
    filterLabel: "Filtern",
    filterAll: "Alle",
    filterSince: "Seit {year}",
    filterOpenAccess: "Open Access",
    filterTypeArticle: "Artikel",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Übersichten",
    filterTypeConference: "Konferenz",
    filterTypeBook: "Bücher",
    filterTypeDataset: "Datensätze",
    coauthorsHeading: "Mitautor:innen auf SigmaCV",
    datePresent: "heute",
    dateUntil: "bis {year}",
    chartPublicationsPerYear: "Publikationen / Jahr",
    chartCitationsPerYear: "Zitationen / Jahr",
    authorshipCaption: "Autorschaft (begutachtet)",
    authorshipCorrespondingNote:
      "Angaben zum korrespondierenden Autor (OpenAlex) sind oft unvollständig.",
    provClassificationNote: "Die Einstufung begutachtet/Preprint erfolgt heuristisch.",
    provGeneratedFrom: "Erstellt aus",
    provOn: "am",
    provRecords: "Einträge",
    provHidden: "ausgeblendet",
    provCorrected: "korrigiert",
    sourceManualEntries: "manuelle Einträge",
    sourceDerived: "abgeleitet",
    cvFallbackTitle: "Lebenslauf",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Open Access ({status})",
    openAccessLabel: "Open Access",
    researchSummaryHeading: "Forschungsüberblick",
    whatsNewLabel: "Kürzlich hinzugefügt",
    outputSummaryLabel: "Forschungsoutput",
    badgeRetracted: "Zurückgezogen",
    badgeRetractedTitle: "Diese Arbeit wurde zurückgezogen (laut Crossref / Retraction Watch)",
    badgeCitations: "{n} Zitationen",
    badgeCitationsTitle:
      "Reine Zitationszahl — nicht feldnormiert (variiert je nach Fach und Alter)",
    metric2yr: "Mittlere Zitationsrate (2 Jahre)",
    metricFwci: "Mittlerer FWCI",
    metricHIndex: "h-Index",
    metricI10: "i10-Index",
    metricWorks: "Werke",
    metricCitations: "Zitationen",
    metricContextFwci: "1,0 = Weltdurchschnitt für Fachgebiet & Jahr",
    metricContext2yr: "2-Jahres-Zitationsrate — nicht fachnormiert (variiert je nach Fach)",
    metricFwciCoverage: "Mittel über {n} Werke mit FWCI",
    metricRcr: "Mittlerer RCR",
    metricContextRcr:
      "1,0 = Durchschnitt NIH-geförderter Arbeiten; nur biomedizinische (PMID) Arbeiten",
    metricRcrCoverage: "Mittel über {n} Werke mit RCR",
    roleFirst: "Erstautor",
    roleSecond: "Zweitautor",
    roleThird: "Drittautor",
    roleMiddle: "k-ter Autor",
    roleSecondLast: "Vorletzter Autor",
    roleLast: "Letztautor",
    roleCorresponding: "Korrespondierender Autor",
    madeWith: "Erstellt mit",
    liveVersionLabel: "Live-Version",
    livingNote: "Aktualisiert am {date} · lebender Lebenslauf, automatisch aktualisiert",
    rorRecordTitle: "ROR-Organisationseintrag",
    institutionSiteTitle: "Website der Einrichtung",
  },
  "ja-JP": {
    refManagerNote:
      "これらの論文は文献管理ツール（Zotero、Mendeley など）に保存できます——ブラウザのコネクタが自動的に検出します。",
    researchAreasLabel: "研究分野",
    citeLabel: "引用",
    abstractLabel: "要旨",
    fullTextLabel: "全文",
    badgeFeatured: "選定",
    badgeFeaturedTitle: "選定／注目の論文",
    subscribeLabel: "購読",
    subscribeHint: "このフィードのURLをRSSリーダーに追加してください：",
    filterLabel: "絞り込み",
    filterAll: "すべて",
    filterSince: "{year}年以降",
    filterOpenAccess: "オープンアクセス",
    filterTypeArticle: "論文",
    filterTypePreprint: "プレプリント",
    filterTypeReview: "総説",
    filterTypeConference: "会議",
    filterTypeBook: "書籍",
    filterTypeDataset: "データセット",
    coauthorsHeading: "SigmaCV を使う共著者",
    datePresent: "現在",
    dateUntil: "{year} まで",
    chartPublicationsPerYear: "年別論文数",
    chartCitationsPerYear: "年別被引用数",
    authorshipCaption: "著者貢献（査読付き）",
    authorshipCorrespondingNote: "責任著者のデータ（OpenAlex）は不完全な場合が多くあります。",
    provClassificationNote: "査読付き／プレプリントの分類は推定によるものです。",
    provGeneratedFrom: "生成元",
    provOn: "日付",
    provRecords: "件",
    provHidden: "非表示",
    provCorrected: "修正済み",
    sourceManualEntries: "手動入力",
    sourceDerived: "推定",
    cvFallbackTitle: "履歴書",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "オープンアクセス（{status}）",
    openAccessLabel: "オープンアクセス",
    researchSummaryHeading: "研究サマリー",
    whatsNewLabel: "最近の追加",
    outputSummaryLabel: "研究成果",
    badgeRetracted: "撤回済み",
    badgeRetractedTitle: "この成果は撤回されています（Crossref／Retraction Watch による）",
    badgeCitations: "被引用 {n}",
    badgeCitationsTitle: "被引用数の生の値 — 分野正規化なし（分野・年代で変動）",
    metric2yr: "2年間平均被引用度",
    metricFwci: "平均FWCI",
    metricHIndex: "h指数",
    metricI10: "i10指数",
    metricWorks: "業績数",
    metricCitations: "被引用数",
    metricContextFwci: "1.0 = 分野・年の世界平均",
    metricContext2yr: "2年間の被引用率 — 分野正規化なし（分野により大きく異なる）",
    metricFwciCoverage: "FWCIのある{n}件の業績による平均",
    metricRcr: "平均 RCR",
    metricContextRcr: "1.0 = NIH 助成論文の平均；生物医学（PMID）業績のみ",
    metricRcrCoverage: "RCRのある{n}件の業績による平均",
    roleFirst: "筆頭著者",
    roleSecond: "第二著者",
    roleThird: "第三著者",
    roleMiddle: "k 番目の著者",
    roleSecondLast: "最後から2番目の著者",
    roleLast: "最終著者",
    roleCorresponding: "責任著者",
    madeWith: "作成ツール：",
    liveVersionLabel: "オンライン版",
    livingNote: "{date} 更新 · 自動更新されるライブ CV",
    rorRecordTitle: "ROR 機関レコード",
    institutionSiteTitle: "機関ウェブサイト",
  },
  "pt-BR": {
    refManagerNote:
      "Salve estas publicações em um gerenciador de referências (Zotero, Mendeley…) — o conector do seu navegador as detectará.",
    researchAreasLabel: "Áreas de pesquisa",
    citeLabel: "Citar",
    abstractLabel: "Resumo",
    fullTextLabel: "Texto completo",
    badgeFeatured: "Destaque",
    badgeFeaturedTitle: "Publicação em destaque / selecionada",
    subscribeLabel: "Assinar",
    subscribeHint: "Adicione esta URL de feed ao seu leitor de RSS:",
    filterLabel: "Filtrar",
    filterAll: "Todas",
    filterSince: "Desde {year}",
    filterOpenAccess: "Acesso aberto",
    filterTypeArticle: "Artigos",
    filterTypePreprint: "Preprints",
    filterTypeReview: "Revisões",
    filterTypeConference: "Congressos",
    filterTypeBook: "Livros",
    filterTypeDataset: "Conjuntos de dados",
    coauthorsHeading: "Coautores no SigmaCV",
    datePresent: "presente",
    dateUntil: "até {year}",
    chartPublicationsPerYear: "Publicações / ano",
    chartCitationsPerYear: "Citações / ano",
    authorshipCaption: "Autoria (revisado por pares)",
    authorshipCorrespondingNote:
      "Os dados de autor correspondente (OpenAlex) costumam estar incompletos.",
    provClassificationNote: "A classificação revisado por pares/preprint é heurística.",
    provGeneratedFrom: "Gerado a partir de",
    provOn: "em",
    provRecords: "registros",
    provHidden: "ocultos",
    provCorrected: "corrigidos",
    sourceManualEntries: "entradas manuais",
    sourceDerived: "derivado",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Acesso aberto ({status})",
    openAccessLabel: "Acesso aberto",
    researchSummaryHeading: "Resumo da pesquisa",
    whatsNewLabel: "Adicionado recentemente",
    outputSummaryLabel: "Produção científica",
    badgeRetracted: "Retratado",
    badgeRetractedTitle: "Este trabalho foi retratado (segundo o Crossref / Retraction Watch)",
    badgeCitations: "{n} citações",
    badgeCitationsTitle:
      "Contagem bruta de citações — não normalizada por área (varia por área e idade)",
    metric2yr: "Citação média em 2 anos",
    metricFwci: "FWCI médio dos trabalhos",
    metricHIndex: "índice h",
    metricI10: "índice i10",
    metricWorks: "Trabalhos",
    metricCitations: "Citações",
    metricContextFwci: "1,0 = média mundial para a área e o ano",
    metricContext2yr:
      "taxa de citação em 2 anos — não normalizada por área (varia conforme a área)",
    metricFwciCoverage: "média sobre {n} trabalhos com FWCI",
    metricRcr: "RCR médio",
    metricContextRcr:
      "1,0 = média de artigos financiados pelo NIH; apenas trabalhos biomédicos (PMID)",
    metricRcrCoverage: "média sobre {n} trabalhos com RCR",
    roleFirst: "Primeiro autor",
    roleSecond: "Segundo autor",
    roleThird: "Terceiro autor",
    roleMiddle: "k-ésimo autor",
    roleSecondLast: "Penúltimo autor",
    roleLast: "Último autor",
    roleCorresponding: "Autor correspondente",
    madeWith: "Feito com",
    liveVersionLabel: "Versão online",
    livingNote: "Atualizado em {date} · currículo vivo, atualizado automaticamente",
    rorRecordTitle: "Registro da organização no ROR",
    institutionSiteTitle: "Site da instituição",
  },
  "it-IT": {
    refManagerNote:
      "Salva queste pubblicazioni in un gestore di riferimenti (Zotero, Mendeley…): il connettore del browser le rileverà.",
    researchAreasLabel: "Aree di ricerca",
    citeLabel: "Cita",
    abstractLabel: "Abstract",
    fullTextLabel: "Testo completo",
    badgeFeatured: "In evidenza",
    badgeFeaturedTitle: "Pubblicazione selezionata / in evidenza",
    subscribeLabel: "Iscriviti",
    subscribeHint: "Aggiungi questo URL del feed al tuo lettore RSS:",
    filterLabel: "Filtra",
    filterAll: "Tutte",
    filterSince: "Dal {year}",
    filterOpenAccess: "Accesso aperto",
    filterTypeArticle: "Articoli",
    filterTypePreprint: "Preprint",
    filterTypeReview: "Rassegne",
    filterTypeConference: "Conferenze",
    filterTypeBook: "Libri",
    filterTypeDataset: "Dataset",
    coauthorsHeading: "Coautori su SigmaCV",
    datePresent: "presente",
    dateUntil: "fino al {year}",
    chartPublicationsPerYear: "Pubblicazioni / anno",
    chartCitationsPerYear: "Citazioni / anno",
    authorshipCaption: "Paternità (sottoposto a revisione paritaria)",
    authorshipCorrespondingNote:
      "I dati sull’autore corrispondente (OpenAlex) sono spesso incompleti.",
    provClassificationNote: "La classificazione con revisione paritaria/preprint è euristica.",
    provGeneratedFrom: "Generato da",
    provOn: "il",
    provRecords: "record",
    provHidden: "nascosti",
    provCorrected: "corretti",
    sourceManualEntries: "voci manuali",
    sourceDerived: "derivato",
    cvFallbackTitle: "Curriculum Vitae",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Accesso aperto ({status})",
    openAccessLabel: "Accesso aperto",
    researchSummaryHeading: "Sintesi della ricerca",
    whatsNewLabel: "Aggiunto di recente",
    outputSummaryLabel: "Produzione scientifica",
    badgeRetracted: "Ritirato",
    badgeRetractedTitle: "Questo lavoro è stato ritirato (secondo Crossref / Retraction Watch)",
    badgeCitations: "{n} citazioni",
    badgeCitationsTitle:
      "Conteggio grezzo delle citazioni — non normalizzato per campo (varia per campo ed età)",
    metric2yr: "Citazioni medie a 2 anni",
    metricFwci: "FWCI medio dei lavori",
    metricHIndex: "indice h",
    metricI10: "indice i10",
    metricWorks: "Lavori",
    metricCitations: "Citazioni",
    metricContextFwci: "1,0 = media mondiale per campo e anno",
    metricContext2yr:
      "tasso di citazione a 2 anni — non normalizzato per campo (varia per disciplina)",
    metricFwciCoverage: "media su {n} lavori con FWCI",
    metricRcr: "RCR medio",
    metricContextRcr: "1,0 = media degli articoli finanziati dai NIH; solo lavori biomedici (PMID)",
    metricRcrCoverage: "media su {n} lavori con RCR",
    roleFirst: "Primo autore",
    roleSecond: "Secondo autore",
    roleThird: "Terzo autore",
    roleMiddle: "k-esimo autore",
    roleSecondLast: "Penultimo autore",
    roleLast: "Ultimo autore",
    roleCorresponding: "Autore corrispondente",
    madeWith: "Creato con",
    liveVersionLabel: "Versione online",
    livingNote: "Aggiornato il {date} · CV vivo, si aggiorna da solo",
    rorRecordTitle: "Scheda dell’organizzazione su ROR",
    institutionSiteTitle: "Sito web dell’istituzione",
  },
  "ko-KR": {
    refManagerNote:
      "이 논문들을 문헌 관리 도구(Zotero, Mendeley 등)에 저장할 수 있습니다 — 브라우저 커넥터가 자동으로 인식합니다.",
    researchAreasLabel: "연구 분야",
    citeLabel: "인용",
    abstractLabel: "초록",
    fullTextLabel: "전문",
    badgeFeatured: "선정",
    badgeFeaturedTitle: "선정 / 주요 논문",
    subscribeLabel: "구독",
    subscribeHint: "이 피드 URL을 RSS 리더에 추가하세요:",
    filterLabel: "필터",
    filterAll: "전체",
    filterSince: "{year}년 이후",
    filterOpenAccess: "오픈 액세스",
    filterTypeArticle: "논문",
    filterTypePreprint: "프리프린트",
    filterTypeReview: "리뷰",
    filterTypeConference: "학회",
    filterTypeBook: "도서",
    filterTypeDataset: "데이터셋",
    coauthorsHeading: "SigmaCV를 사용하는 공저자",
    datePresent: "현재",
    dateUntil: "{year}까지",
    chartPublicationsPerYear: "연도별 논문 수",
    chartCitationsPerYear: "연도별 피인용 수",
    authorshipCaption: "저자 정보 (동료 심사)",
    authorshipCorrespondingNote: "교신저자 데이터(OpenAlex)는 불완전한 경우가 많습니다.",
    provClassificationNote: "동료 심사/프리프린트 분류는 추정에 기반합니다.",
    provGeneratedFrom: "출처",
    provOn: "생성일",
    provRecords: "건",
    provHidden: "숨김",
    provCorrected: "수정됨",
    sourceManualEntries: "수동 입력",
    sourceDerived: "파생",
    cvFallbackTitle: "이력서",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "오픈 액세스 ({status})",
    openAccessLabel: "오픈 액세스",
    researchSummaryHeading: "연구 요약",
    whatsNewLabel: "최근 추가됨",
    outputSummaryLabel: "연구 성과",
    badgeRetracted: "철회됨",
    badgeRetractedTitle: "이 성과는 철회되었습니다 (Crossref / Retraction Watch 기준)",
    badgeCitations: "인용 {n}회",
    badgeCitationsTitle: "원시 피인용 수 — 분야 정규화 안 됨 (분야·연도에 따라 다름)",
    metric2yr: "2년 평균 피인용도",
    metricFwci: "평균 논문 FWCI",
    metricHIndex: "h-지수",
    metricI10: "i10-지수",
    metricWorks: "논문 수",
    metricCitations: "피인용 수",
    metricContextFwci: "1.0 = 분야 및 연도별 세계 평균",
    metricContext2yr: "2년 피인용률 — 분야 정규화 아님 (분야별로 크게 다름)",
    metricFwciCoverage: "FWCI가 있는 {n}편 논문 기준 평균",
    metricRcr: "평균 RCR",
    metricContextRcr: "1.0 = NIH 지원 논문 평균; 생의학(PMID) 논문만",
    metricRcrCoverage: "RCR가 있는 {n}편 논문 기준 평균",
    roleFirst: "제1저자",
    roleSecond: "제2저자",
    roleThird: "제3저자",
    roleMiddle: "k번째 저자",
    roleSecondLast: "끝에서 두 번째 저자",
    roleLast: "마지막 저자",
    roleCorresponding: "교신저자",
    madeWith: "제작 도구:",
    liveVersionLabel: "온라인 버전",
    livingNote: "{date} 업데이트 · 자동으로 갱신되는 라이브 CV",
    rorRecordTitle: "ROR 기관 레코드",
    institutionSiteTitle: "기관 웹사이트",
  },
  "ru-RU": {
    refManagerNote:
      "Сохраните эти публикации в менеджер ссылок (Zotero, Mendeley…) — коннектор вашего браузера обнаружит их.",
    researchAreasLabel: "Области исследований",
    citeLabel: "Цитировать",
    abstractLabel: "Аннотация",
    fullTextLabel: "Полный текст",
    badgeFeatured: "Избранное",
    badgeFeaturedTitle: "Избранная / рекомендуемая публикация",
    subscribeLabel: "Подписаться",
    subscribeHint: "Добавьте этот URL ленты в свой RSS-ридер:",
    filterLabel: "Фильтр",
    filterAll: "Все",
    filterSince: "С {year}",
    filterOpenAccess: "Открытый доступ",
    filterTypeArticle: "Статьи",
    filterTypePreprint: "Препринты",
    filterTypeReview: "Обзоры",
    filterTypeConference: "Конференции",
    filterTypeBook: "Книги",
    filterTypeDataset: "Наборы данных",
    coauthorsHeading: "Соавторы в SigmaCV",
    datePresent: "наст. время",
    dateUntil: "до {year}",
    chartPublicationsPerYear: "Публикации / год",
    chartCitationsPerYear: "Цитирования / год",
    authorshipCaption: "Авторство (рецензируемые)",
    authorshipCorrespondingNote: "Данные об авторе для корреспонденции (OpenAlex) часто неполны.",
    provClassificationNote: "Классификация «рецензируемое/препринт» является эвристической.",
    provGeneratedFrom: "Сформировано из",
    provOn: "от",
    provRecords: "записей",
    provHidden: "скрыто",
    provCorrected: "исправлено",
    sourceManualEntries: "ручные записи",
    sourceDerived: "производные",
    cvFallbackTitle: "Резюме",
    badgeOpenAccess: "OA",
    badgeOpenAccessTitle: "Открытый доступ ({status})",
    openAccessLabel: "Открытый доступ",
    researchSummaryHeading: "Сводка исследований",
    whatsNewLabel: "Недавно добавлено",
    outputSummaryLabel: "Научная продукция",
    badgeRetracted: "Отозвано",
    badgeRetractedTitle: "Эта работа была отозвана (по данным Crossref / Retraction Watch)",
    badgeCitations: "{n} цитирований",
    badgeCitationsTitle:
      "Сырое число цитирований — без нормализации по области (зависит от области и возраста)",
    metric2yr: "Средняя цитируемость за 2 года",
    metricFwci: "Средний FWCI работы",
    metricHIndex: "h-индекс",
    metricI10: "i10-индекс",
    metricWorks: "Работы",
    metricCitations: "Цитирования",
    metricContextFwci: "1,0 = среднемировой уровень для области и года",
    metricContext2yr: "цитируемость за 2 года — без нормализации по области (зависит от области)",
    metricFwciCoverage: "среднее по {n} работам с FWCI",
    metricRcr: "Средний RCR",
    metricContextRcr:
      "1,0 = среднее для статей, финансируемых NIH; только биомедицинские работы (PMID)",
    metricRcrCoverage: "среднее по {n} работам с RCR",
    roleFirst: "Первый автор",
    roleSecond: "Второй автор",
    roleThird: "Третий автор",
    roleMiddle: "k-й автор",
    roleSecondLast: "Предпоследний автор",
    roleLast: "Последний автор",
    roleCorresponding: "Автор для корреспонденции",
    madeWith: "Создано с помощью",
    liveVersionLabel: "Онлайн-версия",
    livingNote: "Обновлено {date} · живое резюме, обновляется автоматически",
    rorRecordTitle: "Запись организации в ROR",
    institutionSiteTitle: "Сайт организации",
  },
};

/** Localized rendered-CV strings (falls back to English for unknown locales). */
export function renderStrings(locale: string): RenderStrings {
  return RENDER_I18N[asLocale(locale)];
}

/** Map a metric key to its localized label. */
export function metricLabel(locale: string, key: string): string {
  const s = renderStrings(locale);
  const map: Record<string, string> = {
    "2yr_mean_citedness": s.metric2yr,
    fwci_mean: s.metricFwci,
    rcr_mean: s.metricRcr,
    h_index: s.metricHIndex,
    i10_index: s.metricI10,
    works_count: s.metricWorks,
    cited_by_count: s.metricCitations,
  };
  return map[key] ?? key;
}

/** Map a metric key to its localized responsible-reading context (or undefined). */
export function metricContext(locale: string, key: string): string | undefined {
  const s = renderStrings(locale);
  const map: Record<string, string> = {
    fwci_mean: s.metricContextFwci,
    rcr_mean: s.metricContextRcr,
    "2yr_mean_citedness": s.metricContext2yr,
  };
  return map[key];
}

/**
 * Localized "mean over N works with FWCI" coverage note. Returns undefined when
 * N is not a positive number, so callers can omit it cleanly.
 */
export function metricCoverageNote(locale: string, n: number | undefined): string | undefined {
  if (typeof n !== "number" || n <= 0) return undefined;
  return renderStrings(locale).metricFwciCoverage.replace("{n}", String(n));
}

/** Localized "mean over N works with RCR" coverage note (RCR counterpart of
 *  {@link metricCoverageNote}). Undefined when N is not a positive number. */
export function metricRcrCoverageNote(locale: string, n: number | undefined): string | undefined {
  if (typeof n !== "number" || n <= 0) return undefined;
  return renderStrings(locale).metricRcrCoverage.replace("{n}", String(n));
}

/** Map an authorship role to its localized label. */
export function authorshipRoleLabel(locale: string, role: string): string {
  const s = renderStrings(locale);
  const map: Record<string, string> = {
    first: s.roleFirst,
    second: s.roleSecond,
    third: s.roleThird,
    middle: s.roleMiddle,
    "second-last": s.roleSecondLast,
    last: s.roleLast,
    corresponding: s.roleCorresponding,
  };
  return map[role] ?? role;
}
