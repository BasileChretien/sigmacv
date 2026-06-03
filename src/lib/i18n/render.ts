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
  provGeneratedFrom: string;
  provOn: string;
  provRecords: string;
  provHidden: string;
  provCorrected: string;
  sourceManualEntries: string;
  sourceDerived: string;
  cvFallbackTitle: string;
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
  roleFirst: string;
  roleSecond: string;
  roleThird: string;
  roleMiddle: string;
  roleSecondLast: string;
  roleLast: string;
  roleCorresponding: string;
}

const RENDER_I18N: Record<Locale, RenderStrings> = {
  "en-US": {
    chartPublicationsPerYear: "Publications / year",
    chartCitationsPerYear: "Citations / year",
    authorshipCaption: "Authorship (peer-reviewed)",
    provGeneratedFrom: "Generated from",
    provOn: "on",
    provRecords: "records",
    provHidden: "hidden",
    provCorrected: "corrected",
    sourceManualEntries: "manual entries",
    sourceDerived: "derived",
    cvFallbackTitle: "Curriculum Vitae",
    metric2yr: "2-yr mean citedness",
    metricFwci: "Mean work FWCI",
    metricHIndex: "h-index",
    metricI10: "i10-index",
    metricWorks: "Works",
    metricCitations: "Citations",
    metricContextFwci: "1.0 = world average for field & year",
    metricContext2yr: "2-year citation rate — not field-normalised (varies by field)",
    metricFwciCoverage: "mean over {n} works with FWCI",
    roleFirst: "First author",
    roleSecond: "Second author",
    roleThird: "Third author",
    roleMiddle: "Middle author",
    roleSecondLast: "Second-to-last author",
    roleLast: "Last author",
    roleCorresponding: "Corresponding author",
  },
  "zh-CN": {
    chartPublicationsPerYear: "年度发表数",
    chartCitationsPerYear: "年度被引数",
    authorshipCaption: "作者署名（同行评审）",
    provGeneratedFrom: "数据来源",
    provOn: "时间",
    provRecords: "条记录",
    provHidden: "已隐藏",
    provCorrected: "已更正",
    sourceManualEntries: "手动录入",
    sourceDerived: "推导得出",
    cvFallbackTitle: "简历",
    metric2yr: "两年平均被引率",
    metricFwci: "平均成果 FWCI",
    metricHIndex: "h 指数",
    metricI10: "i10 指数",
    metricWorks: "成果数",
    metricCitations: "被引数",
    metricContextFwci: "1.0 = 同领域同年度的全球平均水平",
    metricContext2yr: "两年期被引率 — 非领域归一化（因领域而异）",
    metricFwciCoverage: "基于 {n} 篇有 FWCI 的成果的均值",
    roleFirst: "第一作者",
    roleSecond: "第二作者",
    roleThird: "第三作者",
    roleMiddle: "中间作者",
    roleSecondLast: "倒数第二作者",
    roleLast: "末位作者",
    roleCorresponding: "通讯作者",
  },
  "es-ES": {
    chartPublicationsPerYear: "Publicaciones / año",
    chartCitationsPerYear: "Citas / año",
    authorshipCaption: "Autoría (revisado por pares)",
    provGeneratedFrom: "Generado a partir de",
    provOn: "el",
    provRecords: "registros",
    provHidden: "ocultos",
    provCorrected: "corregidos",
    sourceManualEntries: "entradas manuales",
    sourceDerived: "derivado",
    cvFallbackTitle: "Curriculum Vitae",
    metric2yr: "Citación media a 2 años",
    metricFwci: "FWCI medio por trabajo",
    metricHIndex: "índice h",
    metricI10: "índice i10",
    metricWorks: "Trabajos",
    metricCitations: "Citas",
    metricContextFwci: "1,0 = media mundial del campo y año",
    metricContext2yr: "tasa de citación a 2 años — no normalizada por campo (varía según el campo)",
    metricFwciCoverage: "media sobre {n} trabajos con FWCI",
    roleFirst: "Primer autor",
    roleSecond: "Segundo autor",
    roleThird: "Tercer autor",
    roleMiddle: "Autor intermedio",
    roleSecondLast: "Penúltimo autor",
    roleLast: "Último autor",
    roleCorresponding: "Autor de correspondencia",
  },
  "fr-FR": {
    chartPublicationsPerYear: "Publications / an",
    chartCitationsPerYear: "Citations / an",
    authorshipCaption: "Qualité d’auteur (évaluées par les pairs)",
    provGeneratedFrom: "Généré à partir de",
    provOn: "le",
    provRecords: "enregistrements",
    provHidden: "masqués",
    provCorrected: "corrigés",
    sourceManualEntries: "saisies manuelles",
    sourceDerived: "dérivé",
    cvFallbackTitle: "Curriculum Vitae",
    metric2yr: "Citations moyennes sur 2 ans",
    metricFwci: "FWCI moyen des travaux",
    metricHIndex: "indice h",
    metricI10: "indice i10",
    metricWorks: "Travaux",
    metricCitations: "Citations",
    metricContextFwci: "1,0 = moyenne mondiale pour le domaine et l’année",
    metricContext2yr: "taux de citation sur 2 ans — non normalisé par domaine (varie selon le domaine)",
    metricFwciCoverage: "moyenne sur {n} travaux avec FWCI",
    roleFirst: "Premier auteur",
    roleSecond: "Deuxième auteur",
    roleThird: "Troisième auteur",
    roleMiddle: "Auteur intermédiaire",
    roleSecondLast: "Avant-dernier auteur",
    roleLast: "Dernier auteur",
    roleCorresponding: "Auteur correspondant",
  },
  "de-DE": {
    chartPublicationsPerYear: "Publikationen / Jahr",
    chartCitationsPerYear: "Zitationen / Jahr",
    authorshipCaption: "Autorschaft (begutachtet)",
    provGeneratedFrom: "Erstellt aus",
    provOn: "am",
    provRecords: "Einträge",
    provHidden: "ausgeblendet",
    provCorrected: "korrigiert",
    sourceManualEntries: "manuelle Einträge",
    sourceDerived: "abgeleitet",
    cvFallbackTitle: "Lebenslauf",
    metric2yr: "Mittlere Zitationsrate (2 Jahre)",
    metricFwci: "Mittlerer FWCI",
    metricHIndex: "h-Index",
    metricI10: "i10-Index",
    metricWorks: "Werke",
    metricCitations: "Zitationen",
    metricContextFwci: "1,0 = Weltdurchschnitt für Fachgebiet & Jahr",
    metricContext2yr: "2-Jahres-Zitationsrate — nicht fachnormiert (variiert je nach Fach)",
    metricFwciCoverage: "Mittel über {n} Werke mit FWCI",
    roleFirst: "Erstautor",
    roleSecond: "Zweitautor",
    roleThird: "Drittautor",
    roleMiddle: "Mittelautor",
    roleSecondLast: "Vorletzter Autor",
    roleLast: "Letztautor",
    roleCorresponding: "Korrespondierender Autor",
  },
  "ja-JP": {
    chartPublicationsPerYear: "年別論文数",
    chartCitationsPerYear: "年別被引用数",
    authorshipCaption: "著者貢献（査読付き）",
    provGeneratedFrom: "生成元",
    provOn: "日付",
    provRecords: "件",
    provHidden: "非表示",
    provCorrected: "修正済み",
    sourceManualEntries: "手動入力",
    sourceDerived: "推定",
    cvFallbackTitle: "履歴書",
    metric2yr: "2年間平均被引用度",
    metricFwci: "平均FWCI",
    metricHIndex: "h指数",
    metricI10: "i10指数",
    metricWorks: "業績数",
    metricCitations: "被引用数",
    metricContextFwci: "1.0 = 分野・年の世界平均",
    metricContext2yr: "2年間の被引用率 — 分野標準化なし（分野により大きく異なる）",
    metricFwciCoverage: "FWCIのある{n}件の業績による平均",
    roleFirst: "筆頭著者",
    roleSecond: "第二著者",
    roleThird: "第三著者",
    roleMiddle: "中間著者",
    roleSecondLast: "最終から2番目の著者",
    roleLast: "最終著者",
    roleCorresponding: "責任著者",
  },
  "pt-BR": {
    chartPublicationsPerYear: "Publicações / ano",
    chartCitationsPerYear: "Citações / ano",
    authorshipCaption: "Autoria (revisado por pares)",
    provGeneratedFrom: "Gerado a partir de",
    provOn: "em",
    provRecords: "registros",
    provHidden: "ocultos",
    provCorrected: "corrigidos",
    sourceManualEntries: "entradas manuais",
    sourceDerived: "derivado",
    cvFallbackTitle: "Curriculum Vitae",
    metric2yr: "Citação média em 2 anos",
    metricFwci: "FWCI médio dos trabalhos",
    metricHIndex: "índice h",
    metricI10: "índice i10",
    metricWorks: "Trabalhos",
    metricCitations: "Citações",
    metricContextFwci: "1,0 = média mundial para a área e o ano",
    metricContext2yr: "taxa de citação em 2 anos — não normalizada por área (varia conforme a área)",
    metricFwciCoverage: "média sobre {n} trabalhos com FWCI",
    roleFirst: "Primeiro autor",
    roleSecond: "Segundo autor",
    roleThird: "Terceiro autor",
    roleMiddle: "Autor intermediário",
    roleSecondLast: "Penúltimo autor",
    roleLast: "Último autor",
    roleCorresponding: "Autor correspondente",
  },
  "it-IT": {
    chartPublicationsPerYear: "Pubblicazioni / anno",
    chartCitationsPerYear: "Citazioni / anno",
    authorshipCaption: "Paternità (sottoposto a revisione paritaria)",
    provGeneratedFrom: "Generato da",
    provOn: "il",
    provRecords: "record",
    provHidden: "nascosti",
    provCorrected: "corretti",
    sourceManualEntries: "voci manuali",
    sourceDerived: "derivato",
    cvFallbackTitle: "Curriculum Vitae",
    metric2yr: "Citazioni medie a 2 anni",
    metricFwci: "FWCI medio dei lavori",
    metricHIndex: "indice h",
    metricI10: "indice i10",
    metricWorks: "Lavori",
    metricCitations: "Citazioni",
    metricContextFwci: "1,0 = media mondiale per campo e anno",
    metricContext2yr: "tasso di citazione a 2 anni — non normalizzato per campo (varia per disciplina)",
    metricFwciCoverage: "media su {n} lavori con FWCI",
    roleFirst: "Primo autore",
    roleSecond: "Secondo autore",
    roleThird: "Terzo autore",
    roleMiddle: "Autore intermedio",
    roleSecondLast: "Penultimo autore",
    roleLast: "Ultimo autore",
    roleCorresponding: "Autore corrispondente",
  },
  "ko-KR": {
    chartPublicationsPerYear: "연도별 논문 수",
    chartCitationsPerYear: "연도별 피인용 수",
    authorshipCaption: "저자 정보 (동료 심사)",
    provGeneratedFrom: "출처",
    provOn: "생성일",
    provRecords: "건",
    provHidden: "숨김",
    provCorrected: "수정됨",
    sourceManualEntries: "수동 입력",
    sourceDerived: "파생",
    cvFallbackTitle: "이력서",
    metric2yr: "2년 평균 피인용도",
    metricFwci: "평균 논문 FWCI",
    metricHIndex: "h-지수",
    metricI10: "i10-지수",
    metricWorks: "논문 수",
    metricCitations: "피인용 수",
    metricContextFwci: "1.0 = 분야 및 연도별 세계 평균",
    metricContext2yr: "2년 피인용률 — 분야 정규화 아님 (분야별로 크게 다름)",
    metricFwciCoverage: "FWCI가 있는 {n}편 논문 기준 평균",
    roleFirst: "제1저자",
    roleSecond: "제2저자",
    roleThird: "제3저자",
    roleMiddle: "중간 저자",
    roleSecondLast: "끝에서 두 번째 저자",
    roleLast: "마지막 저자",
    roleCorresponding: "교신저자",
  },
  "ru-RU": {
    chartPublicationsPerYear: "Публикации / год",
    chartCitationsPerYear: "Цитирования / год",
    authorshipCaption: "Авторство (рецензируемые)",
    provGeneratedFrom: "Сформировано из",
    provOn: "от",
    provRecords: "записей",
    provHidden: "скрыто",
    provCorrected: "исправлено",
    sourceManualEntries: "ручные записи",
    sourceDerived: "производные",
    cvFallbackTitle: "Резюме",
    metric2yr: "Средняя цитируемость за 2 года",
    metricFwci: "Средний FWCI работы",
    metricHIndex: "h-индекс",
    metricI10: "i10-индекс",
    metricWorks: "Работы",
    metricCitations: "Цитирования",
    metricContextFwci: "1,0 = среднемировой уровень для области и года",
    metricContext2yr: "цитируемость за 2 года — без нормализации по области (зависит от области)",
    metricFwciCoverage: "среднее по {n} работам с FWCI",
    roleFirst: "Первый автор",
    roleSecond: "Второй автор",
    roleThird: "Третий автор",
    roleMiddle: "Средний автор",
    roleSecondLast: "Предпоследний автор",
    roleLast: "Последний автор",
    roleCorresponding: "Автор для корреспонденции",
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
    "2yr_mean_citedness": s.metricContext2yr,
  };
  return map[key];
}

/**
 * Localized "mean over N works with FWCI" coverage note. Returns undefined when
 * N is not a positive number, so callers can omit it cleanly.
 */
export function metricCoverageNote(
  locale: string,
  n: number | undefined,
): string | undefined {
  if (typeof n !== "number" || n <= 0) return undefined;
  return renderStrings(locale).metricFwciCoverage.replace("{n}", String(n));
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
