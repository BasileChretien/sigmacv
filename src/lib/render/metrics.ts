import { isHidden, type CanonicalCv, type OwnerMetrics } from "@/lib/canonical/schema";
import {
  metricContext,
  metricCoverageNote,
  metricLabel,
} from "@/lib/i18n/render";

/**
 * Metrics adjusted for curation. The FIELD-NORMALIZED measures we DERIVE from
 * per-work data (FWCI mean + its coverage N, top-10% share) are recomputed over
 * the CURATED works, so works marked "not mine" / hidden no longer inflate them.
 * They need the per-work `fwci`/`topDecile` captured at build (a CV synced before
 * those fields existed has none → we keep the author-level value until re-sync).
 *
 * OpenAlex's OFFICIAL author numbers (h-index, i10, works/citation counts, 2-yr
 * mean citedness) are LEFT AS-IS: they are OpenAlex's own author-level figures,
 * and recomputing them from a possibly-partial works list would undercount.
 */
export function curatedMetrics(cv: CanonicalCv): OwnerMetrics {
  const base: OwnerMetrics = cv.owner.metrics ?? {};
  const works = cv.sections
    .flatMap((s) => s.items)
    .filter((it) => Boolean(it.csl) && !isHidden(it));
  const fwcis = works
    .map((w) => w.meta.fwci)
    .filter((x): x is number => typeof x === "number");
  const deciles = works
    .map((w) => w.meta.topDecile)
    .filter((x): x is boolean => typeof x === "boolean");
  return {
    ...base,
    ...(fwcis.length > 0
      ? { fwci_mean: fwcis.reduce((a, b) => a + b, 0) / fwcis.length, fwci_n: fwcis.length }
      : {}),
    ...(deciles.length > 0
      ? { top10pct_share: deciles.filter(Boolean).length / deciles.length }
      : {}),
  };
}

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

function formatValue(format: string, raw: number, locale: string): string {
  // Locale-aware so the value's decimal/grouping separators match the language
  // the rest of the CV (incl. the metric label/context) is already rendered in
  // — e.g. German "1,0" / "1.485" rather than a hardcoded "1.0" / "1485".
  if (format === "integer") return new Intl.NumberFormat(locale).format(raw);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(raw);
}

/**
 * Responsible-reading context for a metric. For mean-FWCI we append the coverage
 * ("mean over N works with FWCI") so a small/skewed sample isn't mistaken for a
 * precise field-normalized score.
 */
function contextFor(
  locale: string,
  key: string,
  values: OwnerMetrics,
): string | undefined {
  const base = metricContext(locale, key);
  if (key !== "fwci_mean") return base;
  const coverage = metricCoverageNote(locale, values.fwci_n);
  if (!coverage) return base;
  return base ? `${base} · ${coverage}` : coverage;
}

/** Format a raw metric value using its catalog format (for the editor preview). */
export function formatMetricValue(key: string, raw: number, locale = "en-US"): string {
  const def = METRIC_DEFS.find((d) => d.key === key);
  return formatValue(def?.format ?? "decimal", raw, locale);
}

/**
 * The metrics to actually display: only when the master toggle is on, only the
 * user-selected keys, and only those with a captured numeric value. Empty array
 * → show nothing (the default).
 */
export function formattedMetrics(cv: CanonicalCv): FormattedMetric[] {
  if (!cv.display.showMetrics || cv.display.metrics.length === 0) return [];
  const values: OwnerMetrics = curatedMetrics(cv);
  const selected = new Set(cv.display.metrics);

  const locale = cv.display.locale;
  return METRIC_DEFS.filter((def) => selected.has(def.key))
    .map((def): FormattedMetric | null => {
      const raw = values[def.key as keyof OwnerMetrics];
      if (typeof raw !== "number") return null;
      return {
        key: def.key,
        label: metricLabel(locale, def.key),
        value: formatValue(def.format, raw, locale),
        context: contextFor(locale, def.key, values),
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
