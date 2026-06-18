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
  /** Public-page "living CV" line; "{date}" is the localized last-synced date. */
  livingNote: string;
  /** Heading for the public-page "Co-authors on SigmaCV" block (opt-in); "SigmaCV" stays untranslated. */
  coauthorsHeading: string;
  /** Tooltip/aria for the institution→ROR-record link on a positions/education line. */
  rorRecordTitle: string;
  /** Tooltip/aria when the institution name links to its own homepage (ROR `links.website`). */
  institutionSiteTitle: string;
}

const RENDER_I18N: Record<Locale, RenderStrings> = {
  "en-US": {
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
    livingNote: "Updated {date} · living CV, updates automatically",
    rorRecordTitle: "ROR organization record",
    institutionSiteTitle: "Institution website",
  },
  "zh-CN": {
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
    livingNote: "更新于 {date} · 在线简历，自动更新",
    rorRecordTitle: "ROR 机构记录",
    institutionSiteTitle: "机构网站",
  },
  "es-ES": {
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
    livingNote: "Actualizado el {date} · CV vivo, se actualiza solo",
    rorRecordTitle: "Ficha de la organización en ROR",
    institutionSiteTitle: "Sitio web de la institución",
  },
  "fr-FR": {
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
    livingNote: "Mis à jour le {date} · CV vivant, mis à jour automatiquement",
    rorRecordTitle: "Fiche de l’organisation dans ROR",
    institutionSiteTitle: "Site web de l’établissement",
  },
  "de-DE": {
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
    livingNote: "Aktualisiert am {date} · lebender Lebenslauf, automatisch aktualisiert",
    rorRecordTitle: "ROR-Organisationseintrag",
    institutionSiteTitle: "Website der Einrichtung",
  },
  "ja-JP": {
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
    livingNote: "{date} 更新 · 自動更新されるライブ CV",
    rorRecordTitle: "ROR 機関レコード",
    institutionSiteTitle: "機関ウェブサイト",
  },
  "pt-BR": {
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
    livingNote: "Atualizado em {date} · currículo vivo, atualizado automaticamente",
    rorRecordTitle: "Registro da organização no ROR",
    institutionSiteTitle: "Site da instituição",
  },
  "it-IT": {
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
    livingNote: "Aggiornato il {date} · CV vivo, si aggiorna da solo",
    rorRecordTitle: "Scheda dell’organizzazione su ROR",
    institutionSiteTitle: "Sito web dell’istituzione",
  },
  "ko-KR": {
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
    livingNote: "{date} 업데이트 · 자동으로 갱신되는 라이브 CV",
    rorRecordTitle: "ROR 기관 레코드",
    institutionSiteTitle: "기관 웹사이트",
  },
  "ru-RU": {
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
