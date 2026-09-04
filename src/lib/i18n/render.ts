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
  /** Label inside the opt-in "Verified" mark on an institution-asserted entry. */
  badgeVerified: string;
  /** Accessible title for the verified mark when the asserting organisation is unknown. */
  badgeVerifiedTitle: string;
  /** Accessible title for the verified mark; "{org}" → the asserting organisation. */
  badgeVerifiedByTitle: string;
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
  /** Reader-facing caveat for the h-index (not field-normalised; career-length-sensitive). */
  metricContextHIndex: string;
  /** Reader-facing caveat for the i10-index (works with ≥10 citations; not field-normalised). */
  metricContextI10: string;
  /** Reader-facing caveat for the raw works count (coverage-dependent; not a quality measure). */
  metricContextWorks: string;
  /** Reader-facing caveat for the raw citation total (not field-normalised). */
  metricContextCitations: string;
  /** Coverage note appended to mean-RCR; "{n}" is replaced with the work count. */
  metricRcrCoverage: string;
  /** Small-sample caveat appended to a field-normalized coverage note below the
   *  reliability threshold. */
  metricSmallN: string;
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
  /** Public-page footer credit for the "Hanko" style's brushed-kanji section
   *  headings. "{kanjivg}" → the linked "KanjiVG" term; the proper nouns
   *  (Yuji Boku) and licence identifiers (CC BY-SA 3.0, SIL OFL) stay untranslated. */
  hankoCredit: string;
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
  /** Per-work RCR pill (opt-in `showWorkIndicators`); "{v}" → the locale-formatted value. */
  indicatorRcr: string;
  /** Tooltip caveat on the RCR pill (NIH iCite; biomedical-only). */
  indicatorRcrTitle: string;
  /** Per-work FWCI pill; "{v}" → the locale-formatted value. */
  indicatorFwci: string;
  /** Tooltip caveat on the FWCI pill (OpenAlex). */
  indicatorFwciTitle: string;
  /** Per-work clinical-citations pill, plural; "{n}" → the count. */
  indicatorClinicalCitations: string;
  /** Per-work clinical-citations pill, singular; "{n}" → the count (1). */
  indicatorClinicalCitationOne: string;
  /** Structured label of the clinical-citations indicator. */
  indicatorClinicalCitationsLabel: string;
  /** Tooltip caveat on the clinical-citations pill (NIH iCite). */
  indicatorClinicalCitationsTitle: string;
  /** Per-work pill for a work iCite classifies as a clinical article. */
  indicatorClinical: string;
  /** Tooltip on the clinical-article pill. */
  indicatorClinicalTitle: string;
  /** Heading of the opt-in provenance-ledger table (footer + editor panel). */
  provLedgerTitle: string;
  /** Editor-panel caveat under the ledger: it measures the document, never the person. */
  provLedgerNote: string;
  provLedgerIdentifier: string;
  provLedgerClaimed: string;
  provLedgerSelfEntered: string;
  provLedgerNameMatched: string;
  provLedgerOther: string;
  provLedgerVerified: string;
  provLedgerPid: string;
  provLedgerReviewed: string;
  provLedgerRetracted: string;
  /** Ledger figure; "{n}", "{total}", "{pct}" substituted at render. */
  provLedgerOf: string;
  /** Collaboration-breadth line; "{countries}" and "{pct}" substituted. */
  collabLine: string;
  /** Same line for a single country ("{pct}" only). */
  collabLineOne: string;
  /** Top-countries clause; "{list}" is a locale-joined list of country names. */
  collabTop: string;
  /** Basis clause; "{n}" → the number of works with country data. */
  collabContext: string;
}

const RENDER_I18N: Record<Locale, RenderStrings> = {
  "en-US": {
    hankoCredit:
      "Section names brushed stroke by stroke · stroke order {kanjivg} (CC BY-SA 3.0) · brush face Yuji Boku (SIL OFL)",
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
    badgeVerified: "Verified",
    badgeVerifiedTitle:
      "Confirmed by the institution via ORCID — asserted by a trusted organisation, not self-entered",
    badgeVerifiedByTitle:
      "Verified by {org} via ORCID — asserted by the organisation, not self-entered",
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
    metricContextHIndex: "not field-normalised; sensitive to career length and field",
    metricContextI10: "works with ≥10 citations — not field-normalised; grows with career length",
    metricContextWorks:
      "raw count of indexed works — depends on database coverage; not a measure of quality",
    metricContextCitations: "raw total — not field-normalised (varies by field and career length)",
    metricRcrCoverage: "mean over {n} works with RCR",
    metricSmallN: "small sample — interpret with caution",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) — field-normalised citation rate; 1.0 = the average NIH-funded article. Biomedical works only.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) — citations relative to works of the same field, type and year; 1.0 = average.",
    indicatorClinicalCitations: "cited by {n} clinical articles",
    indicatorClinicalCitationOne: "cited by {n} clinical article",
    indicatorClinicalCitationsLabel: "Clinical citations",
    indicatorClinicalCitationsTitle:
      "Number of clinical articles (guidelines, clinical trials) citing this work, per NIH iCite. Biomedical works only.",
    indicatorClinical: "Clinical article",
    indicatorClinicalTitle:
      "NIH iCite classifies this work as a clinical article (guideline or clinical study).",
    provLedgerTitle: "Provenance ledger",
    provLedgerNote:
      "How verifiable this document is — each line counts entries shown, with its own denominator. Not an assessment of the researcher, and never a score.",
    provLedgerIdentifier: "Matched by identifier (ORCID / OpenAlex)",
    provLedgerClaimed: "Added by DOI (owner-asserted)",
    provLedgerSelfEntered: "Entered by hand",
    provLedgerNameMatched: "Matched by name only",
    provLedgerOther: "Other attribution",
    provLedgerVerified: "Positions, education and distinctions asserted by a trusted organisation",
    provLedgerPid: "Resolvable by a persistent identifier (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Source-attributed publications confirmed by the owner",
    provLedgerRetracted: "Retracted works shown",
    provLedgerOf: "{n} of {total} ({pct})",
    collabLine: "Co-authors from {countries} countries · {pct} of works international",
    collabLineOne: "Co-authors from one country · {pct} of works international",
    collabTop: "most often {list}",
    collabContext: "based on OpenAlex affiliation data; n = {n}",
  },
  "zh-CN": {
    hankoCredit:
      "栏目名称按笔顺逐笔书写 · 笔顺数据 {kanjivg}（CC BY-SA 3.0）· 毛笔字体 Yuji Boku（SIL OFL）",
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
    badgeVerified: "已认证",
    badgeVerifiedTitle: "由所在机构通过 ORCID 确认——由受信任的机构录入，而非本人自行填写",
    badgeVerifiedByTitle: "由 {org} 通过 ORCID 认证——由该机构录入，而非本人自行填写",
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
    metricContextHIndex: "非领域归一化；受职业年限与领域影响",
    metricContextI10: "被引 ≥10 次的成果数 — 非领域归一化；随职业年限增长",
    metricContextWorks: "已收录成果的原始数量 — 取决于数据库覆盖范围；不代表质量",
    metricContextCitations: "原始总数 — 非领域归一化（因领域与职业年限而异）",
    metricRcrCoverage: "基于 {n} 篇有 RCR 的成果的均值",
    metricSmallN: "样本较小——请谨慎解读",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "相对引用率（NIH iCite）——经领域标准化的被引率；1.0 = NIH 资助论文的平均水平。仅限生物医学文献。",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "领域加权引用影响力（OpenAlex）——相对于同领域、同类型、同年份文献的被引情况；1.0 = 平均水平。",
    indicatorClinicalCitations: "被 {n} 篇临床文献引用",
    indicatorClinicalCitationOne: "被 {n} 篇临床文献引用",
    indicatorClinicalCitationsLabel: "临床引用",
    indicatorClinicalCitationsTitle:
      "引用本文的临床文献（指南、临床试验）数量，来源 NIH iCite。仅限生物医学文献。",
    indicatorClinical: "临床文献",
    indicatorClinicalTitle: "NIH iCite 将本文归类为临床文献（指南或临床研究）。",
    provLedgerTitle: "来源核验表",
    provLedgerNote:
      "本文档的可核验程度——每一行统计所显示的条目，并各自注明分母。这不是对研究者的评价，也绝不是评分。",
    provLedgerIdentifier: "通过标识符匹配（ORCID / OpenAlex）",
    provLedgerClaimed: "通过 DOI 添加（本人声明）",
    provLedgerSelfEntered: "手动录入",
    provLedgerNameMatched: "仅通过姓名匹配",
    provLedgerOther: "其他归属方式",
    provLedgerVerified: "由可信机构认证的职位、教育经历与荣誉",
    provLedgerPid: "可通过持久标识符解析（DOI / PMID / arXiv / ORCID）",
    provLedgerReviewed: "本人已确认的来源归属论文",
    provLedgerRetracted: "显示的已撤稿作品",
    provLedgerOf: "{n} / {total}（{pct}）",
    collabLine: "合作者来自 {countries} 个国家/地区 · {pct} 的作品为国际合作",
    collabLineOne: "合作者来自 1 个国家/地区 · {pct} 的作品为国际合作",
    collabTop: "最常见：{list}",
    collabContext: "基于 OpenAlex 机构信息；n = {n}",
  },
  "es-ES": {
    hankoCredit:
      "Nombres de sección pincelados trazo a trazo · orden de trazos {kanjivg} (CC BY-SA 3.0) · tipografía de pincel Yuji Boku (SIL OFL)",
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
    badgeVerified: "Verificado",
    badgeVerifiedTitle:
      "Confirmado por la institución mediante ORCID: registrado por una organización de confianza, no por la propia persona",
    badgeVerifiedByTitle:
      "Verificado por {org} mediante ORCID: registrado por la organización, no por la propia persona",
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
    metricContextHIndex:
      "no normalizado por campo; sensible a la duración de la carrera y al campo",
    metricContextI10:
      "trabajos con ≥10 citas — no normalizado por campo; crece con la duración de la carrera",
    metricContextWorks:
      "recuento bruto de trabajos indexados — depende de la cobertura de la base de datos; no mide la calidad",
    metricContextCitations:
      "total bruto — no normalizado por campo (varía según el campo y la duración de la carrera)",
    metricRcrCoverage: "media sobre {n} trabajos con RCR",
    metricSmallN: "muestra pequeña: interprétalo con cautela",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite): tasa de citas normalizada por campo; 1,0 = el artículo medio financiado por los NIH. Solo trabajos biomédicos.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex): citas respecto a trabajos del mismo campo, tipo y año; 1,0 = la media.",
    indicatorClinicalCitations: "citado por {n} artículos clínicos",
    indicatorClinicalCitationOne: "citado por {n} artículo clínico",
    indicatorClinicalCitationsLabel: "Citas clínicas",
    indicatorClinicalCitationsTitle:
      "Número de artículos clínicos (guías, ensayos clínicos) que citan este trabajo, según NIH iCite. Solo trabajos biomédicos.",
    indicatorClinical: "Artículo clínico",
    indicatorClinicalTitle:
      "NIH iCite clasifica este trabajo como artículo clínico (guía o estudio clínico).",
    provLedgerTitle: "Registro de procedencia",
    provLedgerNote:
      "Hasta qué punto es verificable este documento: cada línea cuenta las entradas mostradas, con su propio denominador. No es una evaluación del investigador ni, en ningún caso, una puntuación.",
    provLedgerIdentifier: "Emparejadas por identificador (ORCID / OpenAlex)",
    provLedgerClaimed: "Añadidas por DOI (afirmadas por el titular)",
    provLedgerSelfEntered: "Introducidas a mano",
    provLedgerNameMatched: "Emparejadas solo por nombre",
    provLedgerOther: "Otra atribución",
    provLedgerVerified:
      "Puestos, formación y distinciones afirmados por una organización de confianza",
    provLedgerPid: "Resolubles mediante un identificador persistente (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Publicaciones atribuidas por fuentes y confirmadas por el titular",
    provLedgerRetracted: "Trabajos retractados mostrados",
    provLedgerOf: "{n} de {total} ({pct})",
    collabLine: "Coautores de {countries} países · {pct} de los trabajos son internacionales",
    collabLineOne: "Coautores de un país · {pct} de los trabajos son internacionales",
    collabTop: "con mayor frecuencia {list}",
    collabContext: "según los datos de afiliación de OpenAlex; n = {n}",
  },
  "fr-FR": {
    hankoCredit:
      "Noms de section tracés au pinceau, trait par trait · ordre des traits {kanjivg} (CC BY-SA 3.0) · police au pinceau Yuji Boku (SIL OFL)",
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
    badgeVerified: "Vérifié",
    badgeVerifiedTitle:
      "Confirmé par l’établissement via ORCID — saisi par un organisme de confiance, et non par la personne elle-même",
    badgeVerifiedByTitle:
      "Vérifié par {org} via ORCID — saisi par l’organisme, et non par la personne elle-même",
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
    metricContextHIndex:
      "non normalisé par domaine ; sensible à la durée de carrière et au domaine",
    metricContextI10:
      "travaux cités ≥10 fois — non normalisé par domaine ; croît avec la durée de carrière",
    metricContextWorks:
      "nombre brut de travaux indexés — dépend de la couverture de la base ; ne mesure pas la qualité",
    metricContextCitations:
      "total brut — non normalisé par domaine (varie selon le domaine et la durée de carrière)",
    metricRcrCoverage: "moyenne sur {n} travaux avec RCR",
    metricSmallN: "échantillon réduit — à interpréter avec prudence",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) : taux de citation normalisé par domaine ; 1,0 = l’article moyen financé par les NIH. Travaux biomédicaux uniquement.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) : citations rapportées aux travaux de même domaine, type et année ; 1,0 = la moyenne.",
    indicatorClinicalCitations: "cité par {n} articles cliniques",
    indicatorClinicalCitationOne: "cité par {n} article clinique",
    indicatorClinicalCitationsLabel: "Citations cliniques",
    indicatorClinicalCitationsTitle:
      "Nombre d’articles cliniques (recommandations, essais cliniques) citant ce travail, d’après NIH iCite. Travaux biomédicaux uniquement.",
    indicatorClinical: "Article clinique",
    indicatorClinicalTitle:
      "NIH iCite classe ce travail comme article clinique (recommandation ou étude clinique).",
    provLedgerTitle: "Registre de provenance",
    provLedgerNote:
      "Dans quelle mesure ce document est vérifiable : chaque ligne compte les entrées affichées, avec son propre dénominateur. Ce n'est ni une évaluation du chercheur ni, en aucun cas, un score.",
    provLedgerIdentifier: "Associées par identifiant (ORCID / OpenAlex)",
    provLedgerClaimed: "Ajoutées par DOI (déclarées par le titulaire)",
    provLedgerSelfEntered: "Saisies à la main",
    provLedgerNameMatched: "Associées par le nom seul",
    provLedgerOther: "Autre attribution",
    provLedgerVerified:
      "Postes, formations et distinctions attestés par une organisation de confiance",
    provLedgerPid: "Résolubles par un identifiant pérenne (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Publications attribuées par les sources et confirmées par le titulaire",
    provLedgerRetracted: "Travaux rétractés affichés",
    provLedgerOf: "{n} sur {total} ({pct})",
    collabLine: "Co-auteurs de {countries} pays · {pct} des travaux sont internationaux",
    collabLineOne: "Co-auteurs d'un seul pays · {pct} des travaux sont internationaux",
    collabTop: "le plus souvent {list}",
    collabContext: "d'après les affiliations OpenAlex ; n = {n}",
  },
  "de-DE": {
    hankoCredit:
      "Abschnittsnamen Strich für Strich mit dem Pinsel geschrieben · Strichreihenfolge {kanjivg} (CC BY-SA 3.0) · Pinselschrift Yuji Boku (SIL OFL)",
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
    badgeVerified: "Verifiziert",
    badgeVerifiedTitle:
      "Von der Institution über ORCID bestätigt – von einer vertrauenswürdigen Organisation eingetragen, nicht selbst erfasst",
    badgeVerifiedByTitle:
      "Verifiziert durch {org} über ORCID – von der Organisation eingetragen, nicht selbst erfasst",
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
    metricContextHIndex: "nicht fachnormiert; abhängig von Karrieredauer und Fach",
    metricContextI10: "Werke mit ≥10 Zitationen — nicht fachnormiert; wächst mit der Karrieredauer",
    metricContextWorks:
      "Rohzahl indexierter Werke — abhängig von der Datenbankabdeckung; kein Qualitätsmaß",
    metricContextCitations:
      "Rohsumme — nicht fachnormiert (variiert je nach Fach und Karrieredauer)",
    metricRcrCoverage: "Mittel über {n} Werke mit RCR",
    metricSmallN: "kleine Stichprobe – mit Vorsicht interpretieren",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) – fachnormierte Zitationsrate; 1,0 = der durchschnittliche NIH-geförderte Artikel. Nur biomedizinische Arbeiten.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) – Zitationen im Verhältnis zu Arbeiten desselben Fachs, Typs und Jahres; 1,0 = Durchschnitt.",
    indicatorClinicalCitations: "zitiert von {n} klinischen Artikeln",
    indicatorClinicalCitationOne: "zitiert von {n} klinischen Artikel",
    indicatorClinicalCitationsLabel: "Klinische Zitationen",
    indicatorClinicalCitationsTitle:
      "Anzahl klinischer Artikel (Leitlinien, klinische Studien), die diese Arbeit zitieren, laut NIH iCite. Nur biomedizinische Arbeiten.",
    indicatorClinical: "Klinischer Artikel",
    indicatorClinicalTitle:
      "NIH iCite stuft diese Arbeit als klinischen Artikel ein (Leitlinie oder klinische Studie).",
    provLedgerTitle: "Herkunftsregister",
    provLedgerNote:
      "Wie überprüfbar dieses Dokument ist – jede Zeile zählt die angezeigten Einträge mit eigenem Nenner. Keine Bewertung der forschenden Person und niemals ein Score.",
    provLedgerIdentifier: "Über Identifikator zugeordnet (ORCID / OpenAlex)",
    provLedgerClaimed: "Per DOI hinzugefügt (von der Inhaberin/dem Inhaber beansprucht)",
    provLedgerSelfEntered: "Von Hand eingetragen",
    provLedgerNameMatched: "Nur über den Namen zugeordnet",
    provLedgerOther: "Sonstige Zuordnung",
    provLedgerVerified:
      "Von einer vertrauenswürdigen Organisation bestätigte Positionen, Ausbildung und Auszeichnungen",
    provLedgerPid: "Über einen persistenten Identifikator auflösbar (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Quellenzugeordnete Publikationen, von der Inhaberin/dem Inhaber bestätigt",
    provLedgerRetracted: "Angezeigte zurückgezogene Arbeiten",
    provLedgerOf: "{n} von {total} ({pct})",
    collabLine:
      "Koautorinnen und Koautoren aus {countries} Ländern · {pct} der Arbeiten international",
    collabLineOne: "Koautorinnen und Koautoren aus einem Land · {pct} der Arbeiten international",
    collabTop: "am häufigsten {list}",
    collabContext: "nach OpenAlex-Affiliationsdaten; n = {n}",
  },
  "ja-JP": {
    hankoCredit:
      "節の名称を一画ずつ筆で運筆 · 筆順 {kanjivg}（CC BY-SA 3.0）· 毛筆書体 Yuji Boku（SIL OFL）",
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
    badgeVerified: "認証済み",
    badgeVerifiedTitle:
      "所属機関が ORCID を通じて確認 — 信頼された機関が登録した情報で、本人による入力ではありません",
    badgeVerifiedByTitle:
      "{org} が ORCID を通じて認証 — 当該機関が登録した情報で、本人による入力ではありません",
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
    metricContextHIndex: "分野正規化なし；キャリア年数と分野の影響を受ける",
    metricContextI10: "被引用10回以上の業績数 — 分野正規化なし；キャリア年数とともに増加",
    metricContextWorks:
      "索引付けされた業績の生の件数 — データベースの収録範囲に依存；質の指標ではない",
    metricContextCitations: "生の合計値 — 分野正規化なし（分野・キャリア年数で変動）",
    metricRcrCoverage: "RCRのある{n}件の業績による平均",
    metricSmallN: "少数サンプル — 解釈には注意",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "相対被引用率（NIH iCite）— 分野で正規化した被引用率。1.0 = NIH 助成論文の平均。生物医学分野の論文のみ。",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "分野加重被引用インパクト（OpenAlex）— 同分野・同種別・同年の論文に対する被引用の比。1.0 = 平均。",
    indicatorClinicalCitations: "臨床文献 {n} 件に引用",
    indicatorClinicalCitationOne: "臨床文献 {n} 件に引用",
    indicatorClinicalCitationsLabel: "臨床引用",
    indicatorClinicalCitationsTitle:
      "この論文を引用する臨床文献（ガイドライン、臨床試験）の数（NIH iCite による）。生物医学分野の論文のみ。",
    indicatorClinical: "臨床文献",
    indicatorClinicalTitle:
      "NIH iCite はこの論文を臨床文献（ガイドラインまたは臨床研究）に分類しています。",
    provLedgerTitle: "出典検証表",
    provLedgerNote:
      "この文書がどの程度検証可能かを示します。各行は表示されている項目を、それぞれの分母とともに数えたものです。研究者の評価ではなく、決してスコアではありません。",
    provLedgerIdentifier: "識別子で照合（ORCID / OpenAlex）",
    provLedgerClaimed: "DOI で追加（本人申告）",
    provLedgerSelfEntered: "手入力",
    provLedgerNameMatched: "氏名のみで照合",
    provLedgerOther: "その他の帰属",
    provLedgerVerified: "信頼できる機関が証明した職歴・学歴・受賞",
    provLedgerPid: "永続識別子で解決可能（DOI / PMID / arXiv / ORCID）",
    provLedgerReviewed: "出典に基づく論文のうち本人が確認したもの",
    provLedgerRetracted: "表示中の撤回済み論文",
    provLedgerOf: "{total} 件中 {n} 件（{pct}）",
    collabLine: "共著者は {countries} か国 · 国際共著は全体の {pct}",
    collabLineOne: "共著者は 1 か国 · 国際共著は全体の {pct}",
    collabTop: "最も多いのは {list}",
    collabContext: "OpenAlex の所属データに基づく；n = {n}",
  },
  "pt-BR": {
    hankoCredit:
      "Nomes das seções pincelados traço a traço · ordem dos traços {kanjivg} (CC BY-SA 3.0) · fonte de pincel Yuji Boku (SIL OFL)",
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
    badgeVerified: "Verificado",
    badgeVerifiedTitle:
      "Confirmado pela instituição via ORCID — registrado por uma organização confiável, não pela própria pessoa",
    badgeVerifiedByTitle:
      "Verificado por {org} via ORCID — registrado pela organização, não pela própria pessoa",
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
    metricContextHIndex: "não normalizado por área; sensível ao tempo de carreira e à área",
    metricContextI10:
      "trabalhos com ≥10 citações — não normalizado por área; cresce com o tempo de carreira",
    metricContextWorks:
      "contagem bruta de trabalhos indexados — depende da cobertura da base; não mede qualidade",
    metricContextCitations:
      "total bruto — não normalizado por área (varia conforme a área e o tempo de carreira)",
    metricRcrCoverage: "média sobre {n} trabalhos com RCR",
    metricSmallN: "amostra pequena — interprete com cautela",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite): taxa de citação normalizada por área; 1,0 = o artigo médio financiado pelos NIH. Apenas trabalhos biomédicos.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex): citações em relação a trabalhos da mesma área, tipo e ano; 1,0 = a média.",
    indicatorClinicalCitations: "citado por {n} artigos clínicos",
    indicatorClinicalCitationOne: "citado por {n} artigo clínico",
    indicatorClinicalCitationsLabel: "Citações clínicas",
    indicatorClinicalCitationsTitle:
      "Número de artigos clínicos (diretrizes, ensaios clínicos) que citam este trabalho, segundo o NIH iCite. Apenas trabalhos biomédicos.",
    indicatorClinical: "Artigo clínico",
    indicatorClinicalTitle:
      "O NIH iCite classifica este trabalho como artigo clínico (diretriz ou estudo clínico).",
    provLedgerTitle: "Registro de proveniência",
    provLedgerNote:
      "Quão verificável é este documento: cada linha conta as entradas exibidas, com seu próprio denominador. Não é uma avaliação do pesquisador e nunca uma pontuação.",
    provLedgerIdentifier: "Correspondidas por identificador (ORCID / OpenAlex)",
    provLedgerClaimed: "Adicionadas por DOI (declaradas pelo titular)",
    provLedgerSelfEntered: "Inseridas manualmente",
    provLedgerNameMatched: "Correspondidas apenas pelo nome",
    provLedgerOther: "Outra atribuição",
    provLedgerVerified: "Cargos, formação e distinções atestados por uma organização confiável",
    provLedgerPid: "Resolvíveis por um identificador persistente (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Publicações atribuídas por fontes e confirmadas pelo titular",
    provLedgerRetracted: "Trabalhos retratados exibidos",
    provLedgerOf: "{n} de {total} ({pct})",
    collabLine: "Coautores de {countries} países · {pct} dos trabalhos são internacionais",
    collabLineOne: "Coautores de um país · {pct} dos trabalhos são internacionais",
    collabTop: "com mais frequência {list}",
    collabContext: "com base nos dados de afiliação do OpenAlex; n = {n}",
  },
  "it-IT": {
    hankoCredit:
      "Nomi delle sezioni tracciati a pennello, tratto per tratto · ordine dei tratti {kanjivg} (CC BY-SA 3.0) · carattere a pennello Yuji Boku (SIL OFL)",
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
    badgeVerified: "Verificato",
    badgeVerifiedTitle:
      "Confermato dall’istituzione tramite ORCID: inserito da un’organizzazione fidata, non dalla persona stessa",
    badgeVerifiedByTitle:
      "Verificato da {org} tramite ORCID: inserito dall’organizzazione, non dalla persona stessa",
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
    metricContextHIndex:
      "non normalizzato per campo; sensibile alla durata della carriera e alla disciplina",
    metricContextI10:
      "lavori con ≥10 citazioni — non normalizzato per campo; cresce con la durata della carriera",
    metricContextWorks:
      "conteggio grezzo dei lavori indicizzati — dipende dalla copertura della banca dati; non misura la qualità",
    metricContextCitations:
      "totale grezzo — non normalizzato per campo (varia per disciplina e durata della carriera)",
    metricRcrCoverage: "media su {n} lavori con RCR",
    metricSmallN: "campione ridotto — interpretare con cautela",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite): tasso di citazione normalizzato per settore; 1,0 = l’articolo medio finanziato dai NIH. Solo lavori biomedici.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex): citazioni rispetto ai lavori dello stesso settore, tipo e anno; 1,0 = la media.",
    indicatorClinicalCitations: "citato da {n} articoli clinici",
    indicatorClinicalCitationOne: "citato da {n} articolo clinico",
    indicatorClinicalCitationsLabel: "Citazioni cliniche",
    indicatorClinicalCitationsTitle:
      "Numero di articoli clinici (linee guida, studi clinici) che citano questo lavoro, secondo NIH iCite. Solo lavori biomedici.",
    indicatorClinical: "Articolo clinico",
    indicatorClinicalTitle:
      "NIH iCite classifica questo lavoro come articolo clinico (linea guida o studio clinico).",
    provLedgerTitle: "Registro di provenienza",
    provLedgerNote:
      "Quanto è verificabile questo documento: ogni riga conta le voci mostrate, con il proprio denominatore. Non è una valutazione del ricercatore e non è mai un punteggio.",
    provLedgerIdentifier: "Abbinate per identificativo (ORCID / OpenAlex)",
    provLedgerClaimed: "Aggiunte tramite DOI (dichiarate dal titolare)",
    provLedgerSelfEntered: "Inserite a mano",
    provLedgerNameMatched: "Abbinate solo per nome",
    provLedgerOther: "Altra attribuzione",
    provLedgerVerified:
      "Posizioni, formazione e riconoscimenti attestati da un'organizzazione affidabile",
    provLedgerPid: "Risolvibili tramite un identificativo persistente (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Pubblicazioni attribuite dalle fonti e confermate dal titolare",
    provLedgerRetracted: "Lavori ritrattati mostrati",
    provLedgerOf: "{n} su {total} ({pct})",
    collabLine: "Coautori da {countries} paesi · {pct} dei lavori sono internazionali",
    collabLineOne: "Coautori da un solo paese · {pct} dei lavori sono internazionali",
    collabTop: "più spesso {list}",
    collabContext: "in base ai dati di affiliazione OpenAlex; n = {n}",
  },
  "ko-KR": {
    hankoCredit:
      "구획 이름을 한 획씩 붓으로 씀 · 획순 {kanjivg} (CC BY-SA 3.0) · 붓글씨 서체 Yuji Boku (SIL OFL)",
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
    badgeVerified: "인증됨",
    badgeVerifiedTitle:
      "소속 기관이 ORCID를 통해 확인 — 신뢰할 수 있는 기관이 등록한 정보로, 본인이 직접 입력한 것이 아닙니다",
    badgeVerifiedByTitle:
      "{org}이(가) ORCID를 통해 인증 — 해당 기관이 등록한 정보로, 본인이 직접 입력한 것이 아닙니다",
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
    metricContextHIndex: "분야 정규화 아님; 경력 기간과 분야에 따라 달라짐",
    metricContextI10: "피인용 10회 이상 논문 수 — 분야 정규화 아님; 경력이 길수록 증가",
    metricContextWorks: "색인된 논문의 원시 수 — 데이터베이스 수록 범위에 좌우됨; 질의 척도가 아님",
    metricContextCitations: "원시 합계 — 분야 정규화 아님 (분야·경력 기간에 따라 다름)",
    metricRcrCoverage: "RCR가 있는 {n}편 논문 기준 평균",
    metricSmallN: "표본이 적음 — 해석에 주의",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "상대 인용 비율(NIH iCite) — 분야로 정규화한 피인용률. 1.0 = NIH 지원 논문 평균. 생의학 논문에만 해당.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "분야 가중 인용 영향력(OpenAlex) — 같은 분야·유형·연도의 논문 대비 피인용. 1.0 = 평균.",
    indicatorClinicalCitations: "임상 문헌 {n}편에 인용됨",
    indicatorClinicalCitationOne: "임상 문헌 {n}편에 인용됨",
    indicatorClinicalCitationsLabel: "임상 인용",
    indicatorClinicalCitationsTitle:
      "이 논문을 인용한 임상 문헌(가이드라인, 임상시험)의 수(NIH iCite 기준). 생의학 논문에만 해당.",
    indicatorClinical: "임상 문헌",
    indicatorClinicalTitle:
      "NIH iCite는 이 논문을 임상 문헌(가이드라인 또는 임상 연구)으로 분류합니다.",
    provLedgerTitle: "출처 검증표",
    provLedgerNote:
      "이 문서가 얼마나 검증 가능한지를 보여줍니다. 각 줄은 표시된 항목을 각자의 분모와 함께 셉니다. 연구자에 대한 평가가 아니며 결코 점수가 아닙니다.",
    provLedgerIdentifier: "식별자로 대조됨 (ORCID / OpenAlex)",
    provLedgerClaimed: "DOI로 추가됨 (본인 주장)",
    provLedgerSelfEntered: "직접 입력",
    provLedgerNameMatched: "이름만으로 대조됨",
    provLedgerOther: "기타 귀속",
    provLedgerVerified: "신뢰할 수 있는 기관이 증명한 직위·학력·수상",
    provLedgerPid: "영구 식별자로 확인 가능 (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "출처에 근거한 논문 중 본인이 확인한 것",
    provLedgerRetracted: "표시된 철회 논문",
    provLedgerOf: "{total}건 중 {n}건 ({pct})",
    collabLine: "공저자 국가 {countries}개 · 국제 공동 연구 비율 {pct}",
    collabLineOne: "공저자 국가 1개 · 국제 공동 연구 비율 {pct}",
    collabTop: "가장 많은 국가: {list}",
    collabContext: "OpenAlex 소속 데이터 기준; n = {n}",
  },
  "ru-RU": {
    hankoCredit:
      "Названия разделов выписаны кистью штрих за штрихом · порядок черт {kanjivg} (CC BY-SA 3.0) · кисть Yuji Boku (SIL OFL)",
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
    badgeVerified: "Подтверждено",
    badgeVerifiedTitle:
      "Подтверждено организацией через ORCID — внесено доверенной организацией, а не самим владельцем записи",
    badgeVerifiedByTitle:
      "Подтверждено {org} через ORCID — внесено организацией, а не самим владельцем записи",
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
    metricContextHIndex: "без нормализации по области; зависит от длительности карьеры и области",
    metricContextI10:
      "работы с ≥10 цитированиями — без нормализации по области; растёт с длительностью карьеры",
    metricContextWorks:
      "необработанное число проиндексированных работ — зависит от охвата базы; не мера качества",
    metricContextCitations:
      "необработанная сумма — без нормализации по области (зависит от области и длительности карьеры)",
    metricRcrCoverage: "среднее по {n} работам с RCR",
    metricSmallN: "малая выборка — интерпретируйте осторожно",
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
    indicatorRcr: "RCR {v}",
    indicatorRcrTitle:
      "Relative Citation Ratio (NIH iCite) — нормированная по области частота цитирования; 1,0 = средняя статья, финансируемая NIH. Только биомедицинские работы.",
    indicatorFwci: "FWCI {v}",
    indicatorFwciTitle:
      "Field-Weighted Citation Impact (OpenAlex) — цитирования относительно работ той же области, типа и года; 1,0 = среднее.",
    indicatorClinicalCitations: "цитируется в {n} клинических статьях",
    indicatorClinicalCitationOne: "цитируется в {n} клинической статье",
    indicatorClinicalCitationsLabel: "Клинические цитирования",
    indicatorClinicalCitationsTitle:
      "Число клинических статей (руководства, клинические испытания), цитирующих эту работу, по данным NIH iCite. Только биомедицинские работы.",
    indicatorClinical: "Клиническая статья",
    indicatorClinicalTitle:
      "NIH iCite относит эту работу к клиническим статьям (руководство или клиническое исследование).",
    provLedgerTitle: "Реестр происхождения данных",
    provLedgerNote:
      "Насколько проверяем этот документ: каждая строка считает показанные записи с собственным знаменателем. Это не оценка исследователя и никогда не балл.",
    provLedgerIdentifier: "Сопоставлены по идентификатору (ORCID / OpenAlex)",
    provLedgerClaimed: "Добавлены по DOI (заявлены владельцем)",
    provLedgerSelfEntered: "Введены вручную",
    provLedgerNameMatched: "Сопоставлены только по имени",
    provLedgerOther: "Иная атрибуция",
    provLedgerVerified: "Должности, образование и награды, подтверждённые доверенной организацией",
    provLedgerPid: "Разрешимы по постоянному идентификатору (DOI / PMID / arXiv / ORCID)",
    provLedgerReviewed: "Публикации из источников, подтверждённые владельцем",
    provLedgerRetracted: "Показанные отозванные работы",
    provLedgerOf: "{n} из {total} ({pct})",
    collabLine: "Соавторы из {countries} стран · {pct} работ международные",
    collabLineOne: "Соавторы из одной страны · {pct} работ международные",
    collabTop: "чаще всего {list}",
    collabContext: "по данным OpenAlex об аффилиациях; n = {n}",
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

/**
 * Map a metric key to its localized responsible-reading context (or undefined for
 * an unknown key). EVERY catalog metric carries one: the field-normalised measures
 * get their interpretation anchor, and the author-level counts (h-index, i10,
 * works, citations) get a short neutral caveat — so the DORA/CoARA caution that
 * the owner saw in the picker also reaches the READER of the PDF / public page,
 * rather than living only owner-side (`metricHints`).
 */
export function metricContext(locale: string, key: string): string | undefined {
  const s = renderStrings(locale);
  const map: Record<string, string> = {
    fwci_mean: s.metricContextFwci,
    rcr_mean: s.metricContextRcr,
    "2yr_mean_citedness": s.metricContext2yr,
    h_index: s.metricContextHIndex,
    i10_index: s.metricContextI10,
    works_count: s.metricContextWorks,
    cited_by_count: s.metricContextCitations,
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

/** Localized small-sample caveat, appended to a field-normalized coverage note
 *  when the work count is below the reliability threshold (see render/metrics). */
export function metricSmallNNote(locale: string): string {
  return renderStrings(locale).metricSmallN;
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
