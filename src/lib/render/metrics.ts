import type { CanonicalCv, OwnerMetrics } from "@/lib/canonical/schema";

/**
 * Metric catalog. Order is the display order: FIELD-NORMALIZED measures first
 * (the brief prefers them over raw h-index), then plain counts.
 */
export const METRIC_DEFS = [
  { key: "2yr_mean_citedness", label: "2-yr mean citedness", format: "decimal" },
  { key: "fwci_mean", label: "Mean work FWCI", format: "decimal" },
  { key: "top10pct_share", label: "Top 10% by year", format: "percent" },
  { key: "h_index", label: "h-index", format: "integer" },
  { key: "i10_index", label: "i10-index", format: "integer" },
  { key: "works_count", label: "Works", format: "integer" },
  { key: "cited_by_count", label: "Citations", format: "integer" },
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

/**
 * Responsible-metrics context: a one-line interpretation shown beside a metric
 * so a number is never presented bare. Only for genuinely field-normalized
 * indicators — we deliberately do NOT fabricate peer percentiles we can't back.
 */
const METRIC_CONTEXT: Record<string, string> = {
  fwci_mean: "1.0 = world average for field & year",
  // NOTE: cited_by_percentile_year is a percentile by PUBLICATION YEAR across
  // all fields — NOT field-normalised. Most works globally are barely cited, so
  // this often reads high even when the field-normalised FWCI is ~average. Label
  // it honestly so it doesn't look contradictory next to FWCI.
  top10pct_share: "most-cited 10% for their year (by citations, not field-normalised)",
  "2yr_mean_citedness": "field-normalised journal-independent",
};

function formatValue(format: string, raw: number): string {
  if (format === "percent") return `${Math.round(raw * 100)}%`;
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

  return METRIC_DEFS.filter((def) => selected.has(def.key))
    .map((def): FormattedMetric | null => {
      const raw = values[def.key as keyof OwnerMetrics];
      if (typeof raw !== "number") return null;
      return {
        key: def.key,
        label: def.label,
        value: formatValue(def.format, raw),
        context: METRIC_CONTEXT[def.key],
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
