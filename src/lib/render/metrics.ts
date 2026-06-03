import type { CanonicalCv, OwnerMetrics } from "@/lib/canonical/schema";
import { metricContext, metricLabel } from "@/lib/i18n/render";

/**
 * Metric catalog. Order is the display order: FIELD-NORMALIZED measures first
 * (the brief prefers them over raw h-index), then plain counts. Labels +
 * responsible-reading context are localized at display time (see lib/i18n/render).
 */
export const METRIC_DEFS = [
  { key: "2yr_mean_citedness", format: "decimal" },
  { key: "fwci_mean", format: "decimal" },
  // NOTE: a by-year citation percentile ("top 10%") was removed from the
  // selectable catalog — it is NOT field-normalised and reads ~100% for most
  // active researchers (most works globally are barely cited), which looked
  // contradictory next to FWCI. It is still computed + stored for research use.
  { key: "h_index", format: "integer" },
  { key: "i10_index", format: "integer" },
  { key: "works_count", format: "integer" },
  { key: "cited_by_count", format: "integer" },
] as const;

export type MetricKey = (typeof METRIC_DEFS)[number]["key"];
export const METRIC_KEYS: readonly string[] = METRIC_DEFS.map((m) => m.key);

export interface FormattedMetric {
  key: string;
  label: string;
  value: string;
  /** Short interpretive context — encourages responsible reading of the number. */
  context?: string;
}

function formatValue(format: string, raw: number): string {
  if (format === "integer") return String(raw);
  return raw.toFixed(1); // decimal
}

/** Format a raw metric value using its catalog format (for the editor preview). */
export function formatMetricValue(key: string, raw: number): string {
  const def = METRIC_DEFS.find((d) => d.key === key);
  return formatValue(def?.format ?? "decimal", raw);
}

/**
 * The metrics to actually display: only when the master toggle is on, only the
 * user-selected keys, and only those with a captured numeric value. Empty array
 * → show nothing (the default).
 */
export function formattedMetrics(cv: CanonicalCv): FormattedMetric[] {
  if (!cv.display.showMetrics || cv.display.metrics.length === 0) return [];
  const values: OwnerMetrics = cv.owner.metrics ?? {};
  const selected = new Set(cv.display.metrics);

  const locale = cv.display.locale;
  return METRIC_DEFS.filter((def) => selected.has(def.key))
    .map((def): FormattedMetric | null => {
      const raw = values[def.key as keyof OwnerMetrics];
      if (typeof raw !== "number") return null;
      return {
        key: def.key,
        label: metricLabel(locale, def.key),
        value: formatValue(def.format, raw),
        context: metricContext(locale, def.key),
      };
    })
    .filter((m): m is FormattedMetric => m !== null);
}

/** A " · "-joined plain-text metrics line (empty string if none to show). */
export function metricsLineText(cv: CanonicalCv): string {
  return formattedMetrics(cv)
    .map((m) => `${m.label}: ${m.value}`)
    .join(" · ");
}
