import { asLocale, type Locale } from "./index";

/**
 * Chrome for the "where this came from" provenance panel (components/
 * SourceProvenance.tsx), shown in the no-login preview and the signed-in editor's
 * sync report. It frames the per-source breakdown and the identifier-vs-name
 * matching split.
 *
 * Source names themselves (OpenAlex, ORCID, DataCite, …) are brand proper nouns
 * kept in code (lib/cv/sourceSummary.ts) and never translated — only this framing
 * is localised. Typed Record<Locale, …> so a missing locale/field fails the build.
 * Non-English copy was machine-drafted and is flagged for native review.
 *
 * `{items}` and `{sources}` are substituted at render time.
 */
export interface SourceProvenanceStrings {
  /** Panel heading / disclosure summary. */
  title: string;
  /** One-line tally: "{items} items · {sources} open sources". */
  summary: string;
  /** Label over the ORCID/DOI-matched sources (auto-included). */
  autoIncluded: string;
  /** Label over the name+org-matched sources (review candidates). */
  needsReview: string;
}

const SOURCE_PROVENANCE_I18N: Record<Locale, SourceProvenanceStrings> = {
  "en-US": {
    title: "Where this came from",
    summary: "{items} items · {sources} open sources",
    autoIncluded: "Matched by your ID — added automatically",
    needsReview: "Matched by name — review these",
  },
  "zh-CN": {
    title: "数据来源",
    summary: "{items} 条 · {sources} 个开放数据源",
    autoIncluded: "通过您的标识符匹配——已自动收录",
    needsReview: "通过姓名匹配——请核对",
  },
  "es-ES": {
    title: "De dónde procede",
    summary: "{items} elementos · {sources} fuentes abiertas",
    autoIncluded: "Coincidencia por tu identificador: añadido automáticamente",
    needsReview: "Coincidencia por nombre: revísalos",
  },
  "fr-FR": {
    title: "D'où proviennent ces données",
    summary: "{items} éléments · {sources} sources ouvertes",
    autoIncluded: "Associé par votre identifiant — ajouté automatiquement",
    needsReview: "Associé par nom — à vérifier",
  },
  "de-DE": {
    title: "Woher diese Daten stammen",
    summary: "{items} Einträge · {sources} offene Quellen",
    autoIncluded: "Über Ihre ID zugeordnet – automatisch übernommen",
    needsReview: "Über den Namen zugeordnet – bitte prüfen",
  },
  "ja-JP": {
    title: "データの出典",
    summary: "{items} 件 · {sources} 個のオープンソース",
    autoIncluded: "あなたの識別子で一致——自動的に追加",
    needsReview: "氏名で一致——ご確認ください",
  },
  "pt-BR": {
    title: "De onde isto veio",
    summary: "{items} itens · {sources} fontes abertas",
    autoIncluded: "Correspondência pelo seu identificador — adicionado automaticamente",
    needsReview: "Correspondência pelo nome — revise estes",
  },
  "it-IT": {
    title: "Da dove provengono i dati",
    summary: "{items} elementi · {sources} fonti aperte",
    autoIncluded: "Abbinato tramite il tuo identificativo — aggiunto automaticamente",
    needsReview: "Abbinato per nome — da verificare",
  },
  "ko-KR": {
    title: "데이터 출처",
    summary: "{items}개 · 오픈 소스 {sources}곳",
    autoIncluded: "내 식별자로 일치 — 자동 추가됨",
    needsReview: "이름으로 일치 — 확인 필요",
  },
  "ru-RU": {
    title: "Источники данных",
    summary: "{items} записей · {sources} открытых источников",
    autoIncluded: "Сопоставлено по вашему идентификатору — добавлено автоматически",
    needsReview: "Сопоставлено по имени — проверьте",
  },
};

/** Provenance-panel chrome for a locale (falls back to English). */
export function sourceProvenanceStrings(locale: string): SourceProvenanceStrings {
  return SOURCE_PROVENANCE_I18N[asLocale(locale)];
}
