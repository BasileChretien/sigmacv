import { asLocale, type Locale } from "./index";

/**
 * Per-metric "why field-normalised" tooltips for the editor's metric picker
 * (roadmap F2). Field-normalised indicators (FWCI, RCR) are comparable across
 * fields and preferred under DORA / the Leiden Manifesto; raw counts and the
 * h-index are not. Surfaced as a `title` tooltip on each metric option so the
 * responsible-reading guidance is at the point of choice. Editor-only — the
 * rendered CV's inline metric context is handled separately in `render/metrics`.
 *
 * NOTE: non-English copy is an initial translation pending native review.
 */
export interface MetricHintStrings {
  /** Tooltip for a field-normalised metric (FWCI mean, RCR mean) — preferred. */
  normalized: string;
  /** Tooltip for a metric that is NOT field-normalised (h-index, raw counts). */
  raw: string;
}

const METRIC_HINTS_I18N: Record<Locale, MetricHintStrings> = {
  "en-US": {
    normalized:
      "Field-normalised: comparable across fields and years. Preferred under DORA and the Leiden Manifesto.",
    raw: "Not field-normalised: varies by field, database coverage and career stage — compare only within the same field.",
  },
  "zh-CN": {
    normalized: "领域归一化：可跨领域和年份比较。DORA 与莱顿宣言推荐使用。",
    raw: "非领域归一化：随领域、数据库覆盖范围和职业阶段而变化——仅应在同一领域内比较。",
  },
  "es-ES": {
    normalized:
      "Normalizado por campo: comparable entre campos y años. Preferido según DORA y el Manifiesto de Leiden.",
    raw: "No normalizado por campo: varía según el campo, la cobertura de la base de datos y la etapa profesional; compara solo dentro del mismo campo.",
  },
  "fr-FR": {
    normalized:
      "Normalisé par domaine : comparable entre domaines et années. Recommandé par la DORA et le Manifeste de Leyde.",
    raw: "Non normalisé par domaine : varie selon le domaine, la couverture de la base et l'étape de carrière — à comparer uniquement au sein du même domaine.",
  },
  "de-DE": {
    normalized:
      "Feldnormiert: über Fachgebiete und Jahre hinweg vergleichbar. Bevorzugt gemäß DORA und dem Leiden-Manifest.",
    raw: "Nicht feldnormiert: variiert je nach Fachgebiet, Datenbankabdeckung und Karrierestufe – nur innerhalb desselben Fachgebiets vergleichen.",
  },
  "ja-JP": {
    normalized: "分野正規化済み：分野や年をまたいで比較可能。DORA とライデン声明が推奨。",
    raw: "分野正規化なし：分野・データベースの収録範囲・キャリア段階によって変動します——同じ分野内でのみ比較してください。",
  },
  "pt-BR": {
    normalized:
      "Normalizado por área: comparável entre áreas e anos. Preferido segundo a DORA e o Manifesto de Leiden.",
    raw: "Não normalizado por área: varia conforme a área, a cobertura da base de dados e o estágio da carreira — compare apenas dentro da mesma área.",
  },
  "it-IT": {
    normalized:
      "Normalizzato per campo: confrontabile tra campi e anni. Preferito secondo la DORA e il Manifesto di Leida.",
    raw: "Non normalizzato per campo: varia in base al campo, alla copertura della banca dati e alla fase di carriera — confronta solo all'interno dello stesso campo.",
  },
  "ko-KR": {
    normalized: "분야 정규화됨: 분야와 연도를 가로질러 비교 가능. DORA와 라이덴 선언이 권장합니다.",
    raw: "분야 정규화 안 됨: 분야, 데이터베이스 수록 범위, 경력 단계에 따라 달라집니다 — 같은 분야 내에서만 비교하세요.",
  },
  "ru-RU": {
    normalized:
      "Нормировано по области: сопоставимо между областями и годами. Рекомендуется DORA и Лейденским манифестом.",
    raw: "Не нормировано по области: зависит от области, охвата базы данных и этапа карьеры — сравнивайте только в пределах одной области.",
  },
};

/**
 * Field-normalised metric keys (comparable across fields). Everything else in
 * the catalog — h-index, i10, 2-year mean citedness, raw work/citation counts —
 * is not field-normalised.
 */
export const FIELD_NORMALIZED_METRICS: ReadonlySet<string> = new Set(["fwci_mean", "rcr_mean"]);

/** Tooltip explaining a metric's field-normalisation status (falls back to English). */
export function metricHint(locale: string, metricKey: string): string {
  const s = METRIC_HINTS_I18N[asLocale(locale)];
  return FIELD_NORMALIZED_METRICS.has(metricKey) ? s.normalized : s.raw;
}
