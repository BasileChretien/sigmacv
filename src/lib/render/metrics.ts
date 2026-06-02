import type { CanonicalCv, OwnerMetrics } from "@/lib/canonical/schema";

/**
 * Metric catalog. Order is the display order: FIELD-NORMALIZED measures first
 * (the brief prefers them over raw h-index), then the experimental Sigma-Score
 * placeholder, then plain counts.
 *
 * `placeholder: true` marks a metric whose value is not yet computed/validated;
 * such metrics never render a number (see computeSigmaScore) and are flagged
 * "experimental" in the UI + output.
 */
export const METRIC_DEFS = [
  { key: "2yr_mean_citedness", label: "2-yr mean citedness", tier: "field", format: "decimal", placeholder: false },
  { key: "fwci_mean", label: "Mean work FWCI", tier: "field", format: "decimal", placeholder: false },
  { key: "top10pct_share", label: "Top-10% works", tier: "field", format: "percent", placeholder: false },
  { key: "sigma_score", label: "Sigma-Score", tier: "experimental", format: "decimal", placeholder: true },
  { key: "h_index", label: "h-index", tier: "count", format: "integer", placeholder: false },
  { key: "i10_index", label: "i10-index", tier: "count", format: "integer", placeholder: false },
  { key: "works_count", label: "Works", tier: "count", format: "integer", placeholder: false },
  { key: "cited_by_count", label: "Citations", tier: "count", format: "integer", placeholder: false },
] as const;

export type MetricKey = (typeof METRIC_DEFS)[number]["key"];
export const METRIC_KEYS: readonly string[] = METRIC_DEFS.map((m) => m.key);

export interface FormattedMetric {
  key: string;
  label: string;
  value: string;
  placeholder: boolean;
}

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
 * → show nothing (the default). Placeholder metrics (e.g. Sigma-Score) carry no
 * value yet, so they're naturally dropped here.
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
        placeholder: def.placeholder,
      };
    })
    .filter((m): m is FormattedMetric => m !== null);
}

/** A " · "-joined plain-text metrics line (empty string if none to show). */
export function metricsLineText(cv: CanonicalCv): string {
  return formattedMetrics(cv)
    .map((m) => `${m.label}${m.placeholder ? " (experimental)" : ""}: ${m.value}`)
    .join(" · ");
}
