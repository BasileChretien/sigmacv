import { asLocale, type Locale } from "./index";

/**
 * Per-metric "why field-normalised" tooltips for the editor's metric picker
 * (roadmap F2), plus the responsible-metrics ONBOARDING copy for the metrics
 * group: a gentle DORA-aligned framing line (metrics are optional, the narrative
 * leads) and a contextual caution shown when the header turns metrics-heavy.
 * Field-normalised indicators (FWCI, RCR) are comparable across fields and
 * preferred under DORA / the Leiden Manifesto; raw counts and the h-index are
 * not. Surfaced at the point of choice so the responsible-reading guidance is
 * where the decision is made. Editor-only — the rendered CV's inline metric
 * context is handled separately in `render/metrics`.
 *
 * NOTE: non-English copy is an initial translation pending native review.
 */
export interface MetricHintStrings {
  /** Tooltip for a field-normalised metric (FWCI mean, RCR mean) — preferred. */
  normalized: string;
  /** Tooltip for a metric that is NOT field-normalised (h-index, raw counts). */
  raw: string;
  /**
   * Gentle DORA-aligned framing at the top of the metric picker: metrics are
   * optional and the narrative leads. Each locale keeps the literal token "DORA"
   * so the editor can linkify it to the declaration.
   */
  nudge: string;
  /**
   * Contextual caution shown when many metrics are enabled at once
   * (`METRICS_CROWDING_THRESHOLD`+): a long metric strip crowds out the work.
   */
  crowding: string;
}

const METRIC_HINTS_I18N: Record<Locale, MetricHintStrings> = {
  "en-US": {
    normalized:
      "Field-normalised: comparable across fields and years. Preferred under DORA and the Leiden Manifesto.",
    raw: "Not field-normalised: varies by field, database coverage and career stage — compare only within the same field.",
    nudge:
      "Metrics are optional. Under DORA, readers tend to weigh your narrative and the work itself over scores — so show them sparingly, if at all.",
    crowding:
      "That's a lot of metrics. A shorter strip reads better and keeps the focus on your work — consider showing just one or two.",
  },
  "zh-CN": {
    normalized: "领域归一化：可跨领域和年份比较。DORA 与莱顿宣言推荐使用。",
    raw: "非领域归一化：随领域、数据库覆盖范围和职业阶段而变化——仅应在同一领域内比较。",
    nudge:
      "指标是可选的。根据 DORA，读者更看重你的叙述和成果本身，而非分数——因此请尽量少用，甚至可以不用。",
    crowding: "指标有点多了。更简短的一行更易阅读，也更能突出你的成果——建议只显示一到两个。",
  },
  "es-ES": {
    normalized:
      "Normalizado por campo: comparable entre campos y años. Preferido según DORA y el Manifiesto de Leiden.",
    raw: "No normalizado por campo: varía según el campo, la cobertura de la base de datos y la etapa profesional; compara solo dentro del mismo campo.",
    nudge:
      "Las métricas son opcionales. Según DORA, quien lee suele valorar tu relato y el trabajo en sí más que las cifras, así que muéstralas con moderación, o no las muestres.",
    crowding:
      "Son muchas métricas. Una franja más corta se lee mejor y mantiene el foco en tu trabajo; considera mostrar solo una o dos.",
  },
  "fr-FR": {
    normalized:
      "Normalisé par domaine : comparable entre domaines et années. Recommandé par la DORA et le Manifeste de Leyde.",
    raw: "Non normalisé par domaine : varie selon le domaine, la couverture de la base et l'étape de carrière — à comparer uniquement au sein du même domaine.",
    nudge:
      "Les indicateurs sont facultatifs. Selon la DORA, le lecteur privilégie votre récit et le travail lui-même aux chiffres — affichez-les donc avec parcimonie, voire pas du tout.",
    crowding:
      "Cela fait beaucoup d'indicateurs. Une ligne plus courte se lit mieux et garde l'attention sur votre travail — n'en affichez qu'un ou deux.",
  },
  "de-DE": {
    normalized:
      "Feldnormiert: über Fachgebiete und Jahre hinweg vergleichbar. Bevorzugt gemäß DORA und dem Leiden-Manifest.",
    raw: "Nicht feldnormiert: variiert je nach Fachgebiet, Datenbankabdeckung und Karrierestufe – nur innerhalb desselben Fachgebiets vergleichen.",
    nudge:
      "Kennzahlen sind optional. Laut DORA gewichten Lesende Ihre Darstellung und die Arbeit selbst stärker als Zahlen – zeigen Sie sie also sparsam, wenn überhaupt.",
    crowding:
      "Das sind viele Kennzahlen. Eine kürzere Zeile liest sich besser und hält den Fokus auf Ihrer Arbeit – zeigen Sie am besten nur ein bis zwei.",
  },
  "ja-JP": {
    normalized: "分野正規化済み：分野や年をまたいで比較可能。DORA とライデン声明が推奨。",
    raw: "分野正規化なし：分野・データベースの収録範囲・キャリア段階によって変動します——同じ分野内でのみ比較してください。",
    nudge:
      "指標の表示は任意です。DORA では、読み手は数値よりもあなたの記述や業績そのものを重視するとされています——表示は控えめに、あるいは省いても構いません。",
    crowding:
      "指標がやや多めです。短くまとめたほうが読みやすく、業績に注目が集まります——1〜2 個に絞ることをおすすめします。",
  },
  "pt-BR": {
    normalized:
      "Normalizado por área: comparável entre áreas e anos. Preferido segundo a DORA e o Manifesto de Leiden.",
    raw: "Não normalizado por área: varia conforme a área, a cobertura da base de dados e o estágio da carreira — compare apenas dentro da mesma área.",
    nudge:
      "As métricas são opcionais. Segundo a DORA, quem lê tende a valorizar sua narrativa e o trabalho em si mais do que os números — então mostre-as com moderação, ou nem as mostre.",
    crowding:
      "São muitas métricas. Uma faixa mais curta se lê melhor e mantém o foco no seu trabalho — considere mostrar apenas uma ou duas.",
  },
  "it-IT": {
    normalized:
      "Normalizzato per campo: confrontabile tra campi e anni. Preferito secondo la DORA e il Manifesto di Leida.",
    raw: "Non normalizzato per campo: varia in base al campo, alla copertura della banca dati e alla fase di carriera — confronta solo all'interno dello stesso campo.",
    nudge:
      "Gli indicatori sono facoltativi. Secondo la DORA, chi legge dà più peso al tuo racconto e al lavoro stesso che ai numeri — quindi mostrali con parsimonia, se non addirittura ometterli.",
    crowding:
      "Sono molti indicatori. Una riga più breve si legge meglio e mantiene il focus sul tuo lavoro — valuta di mostrarne solo uno o due.",
  },
  "ko-KR": {
    normalized: "분야 정규화됨: 분야와 연도를 가로질러 비교 가능. DORA와 라이덴 선언이 권장합니다.",
    raw: "분야 정규화 안 됨: 분야, 데이터베이스 수록 범위, 경력 단계에 따라 달라집니다 — 같은 분야 내에서만 비교하세요.",
    nudge:
      "지표 표시는 선택 사항입니다. DORA에 따르면 독자는 점수보다 당신의 서술과 성과 자체를 더 중시합니다 — 그러니 최소한으로, 또는 아예 표시하지 않아도 됩니다.",
    crowding:
      "지표가 다소 많습니다. 짧게 추리면 읽기 쉽고 성과에 집중됩니다 — 한두 개만 표시하는 것을 권합니다.",
  },
  "ru-RU": {
    normalized:
      "Нормировано по области: сопоставимо между областями и годами. Рекомендуется DORA и Лейденским манифестом.",
    raw: "Не нормировано по области: зависит от области, охвата базы данных и этапа карьеры — сравнивайте только в пределах одной области.",
    nudge:
      "Показатели — по желанию. Согласно DORA, читатели ценят ваше описание и саму работу выше цифр, поэтому показывайте их умеренно или не показывайте вовсе.",
    crowding:
      "Это много показателей. Короткая строка читается лучше и удерживает внимание на вашей работе — лучше показать один-два.",
  },
};

/**
 * Field-normalised metric keys (comparable across fields). Everything else in
 * the catalog — h-index, i10, 2-year mean citedness, raw work/citation counts —
 * is not field-normalised.
 */
export const FIELD_NORMALIZED_METRICS: ReadonlySet<string> = new Set(["fwci_mean", "rcr_mean"]);

/**
 * Number of simultaneously-shown metrics at/above which the header reads as
 * "metrics-heavy" and the editor surfaces the {@link metricsCrowdingNote}. The
 * OA share is an extra chip on top, so four selected metrics already make a long
 * strip; this keeps the nudge from firing on a sensible one-or-two-metric header.
 */
export const METRICS_CROWDING_THRESHOLD = 4;

/** Tooltip explaining a metric's field-normalisation status (falls back to English). */
export function metricHint(locale: string, metricKey: string): string {
  const s = METRIC_HINTS_I18N[asLocale(locale)];
  return FIELD_NORMALIZED_METRICS.has(metricKey) ? s.normalized : s.raw;
}

/** Gentle DORA-aligned framing for the metric picker (falls back to English). */
export function metricsNudge(locale: string): string {
  return METRIC_HINTS_I18N[asLocale(locale)].nudge;
}

/** Caution shown when many metrics are enabled at once (falls back to English). */
export function metricsCrowdingNote(locale: string): string {
  return METRIC_HINTS_I18N[asLocale(locale)].crowding;
}
