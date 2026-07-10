import type { CanonicalCv, OwnerMetrics } from "@/lib/canonical/schema";
import {
  metricContext,
  metricCoverageNote,
  metricLabel,
  metricRcrCoverageNote,
  metricSmallNNote,
} from "@/lib/i18n/render";
import { countableWorks } from "./countable";

/**
 * Below this many works, a field-normalized aggregate rides on too small a sample
 * to read as a precise score, so its coverage note carries a small-sample caveat
 * (Leiden principle 7). Kept deliberately conservative.
 */
export const SMALL_N_THRESHOLD = 10;

/**
 * Metrics adjusted for curation. The FIELD-NORMALIZED measures we DERIVE from
 * per-work data (the MNCS ratio-of-sums + its coverage N, the mean-FWCI proxy +
 * its N, the by-year top-10% share, and the NIH iCite RCR mean + its N) are
 * recomputed over the CURATED, non-preprint works, so works marked "not mine" /
 * hidden — and the preprint section — no longer inflate them. They need the
 * per-work `fwci`/`citedByCount`/`topDecile`/`rcr` captured at build/enrich (a CV
 * synced before those fields existed has none → we keep the author-level value
 * until re-sync).
 *
 * OpenAlex's OFFICIAL author numbers (h-index, i10, works/citation counts, 2-yr
 * mean citedness) are LEFT AS-IS: they are OpenAlex's own author-level figures,
 * and recomputing them from a possibly-partial works list would undercount.
 */
export function curatedMetrics(cv: CanonicalCv): OwnerMetrics {
  const base: OwnerMetrics = cv.owner.metrics ?? {};
  const works = countableWorks(cv);
  const fwcis = works.map((w) => w.meta.fwci).filter((x): x is number => typeof x === "number");
  const deciles = works
    .map((w) => w.meta.topDecile)
    .filter((x): x is boolean => typeof x === "boolean");
  const rcrs = works.map((w) => w.meta.rcr).filter((x): x is number => typeof x === "number");
  // MNCS as a RATIO OF SUMS (Waltman et al. 2011): Σ observed ÷ Σ expected, where
  // expected_i = c_i / FWCI_i (recoverable only when FWCI_i > 0). This is the
  // consistent author-level field normalization — NOT the mean of per-work ratios.
  const mncsWorks = works.filter(
    (w) =>
      typeof w.meta.fwci === "number" && w.meta.fwci > 0 && typeof w.meta.citedByCount === "number",
  );
  const mncs = computeMncs(mncsWorks);
  return {
    ...base,
    ...(mncs !== undefined ? { mncs, mncs_n: mncsWorks.length } : {}),
    ...(fwcis.length > 0
      ? { fwci_mean: fwcis.reduce((a, b) => a + b, 0) / fwcis.length, fwci_n: fwcis.length }
      : {}),
    ...(deciles.length > 0
      ? { top10pct_share: deciles.filter(Boolean).length / deciles.length }
      : {}),
    ...(rcrs.length > 0
      ? { rcr_mean: rcrs.reduce((a, b) => a + b, 0) / rcrs.length, rcr_n: rcrs.length }
      : {}),
  };
}

/** MNCS (ratio of sums) over works carrying an FWCI (>0) and a citation count;
 *  undefined for an empty set. */
function computeMncs(
  mncsWorks: ReadonlyArray<{ meta: { fwci?: number; citedByCount?: number } }>,
): number | undefined {
  if (mncsWorks.length === 0) return undefined;
  const observed = mncsWorks.reduce((s, w) => s + (w.meta.citedByCount as number), 0);
  const expected = mncsWorks.reduce(
    (s, w) => s + (w.meta.citedByCount as number) / (w.meta.fwci as number),
    0,
  );
  /* v8 ignore next -- expected > 0 whenever a work with FWCI>0 exists (FWCI>0 ⟺ cited) */
  return expected > 0 ? observed / expected : undefined;
}

/**
 * Metric catalog. Order is the display order: FIELD-NORMALIZED measures first
 * (the responsible, cross-field-comparable ones), then the not-field-normalized
 * measures. Labels + responsible-reading context are localized at display time
 * (see lib/i18n/render).
 *
 * NONE of the FWCI-derived aggregates are offered as a headline, because they can
 * only be computed over CITED works: the per-work expected baseline is recovered as
 * `e_i = c_i / FWCI_i`, which is `0/0` for an uncited work, so uncited (and very
 * recent, FWCI-null) works are silently excluded — biasing the score UPWARD (a true
 * MNCS counts uncited works in the denominator). So both the MNCS ratio-of-sums
 * (`mncs`) and the mean-of-per-work-FWCI (`fwci_mean`) are computed + stored for
 * research/back-compat but NO LONGER offered here. A by-year citation percentile
 * ("top 10%") is likewise NOT offered: OpenAlex's `cited_by_percentile_year` is
 * year- not field-normalized. The offered field-normalized measure is the NIH iCite
 * RCR (biomedical, PMID-keyed), which does not have this cited-only limitation.
 */
export const METRIC_DEFS = [
  // NIH iCite Relative Citation Ratio — field-normalized but biomedical-only
  // (PMID-keyed); the mean RCR is the NIH-sanctioned portfolio aggregation
  // (Hutchins et al. 2016). Opt-in with a caveat in its responsible-reading context.
  { key: "rcr_mean", format: "decimal" },
  // NOT field-normalized — demoted below the normalized measures; each carries a
  // caveat in its responsible-reading context. 2-yr mean citedness is a JIF-analogue
  // (leads nothing); h-index / i10 / raw counts are DORA/CoARA-discouraged.
  { key: "2yr_mean_citedness", format: "decimal" },
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
  /**
   * Short interpretation ANCHOR (e.g. "1.0 = world average for field & year") —
   * the key a reader needs to read the number responsibly. Shown inline next to
   * the value.
   */
  context?: string;
  /**
   * Longer coverage/provenance note ("mean over N works with FWCI") for the
   * field-normalized means. Kept SEPARATE from {@link context} so the header can
   * style the two differently; both are rendered as VISIBLE text (the anchor, then
   * the coverage caveat) — never hidden in a hover title, which is unreachable by
   * keyboard/touch and absent in the printed PDF a committee reads.
   */
  coverageNote?: string;
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
 * Coverage/provenance note for a field-normalized measure — how it was built +
 * over how many works (+ a small-sample caveat below {@link SMALL_N_THRESHOLD}) —
 * so a small/skewed sample isn't mistaken for a precise score. Only the
 * field-normalized measures (MNCS, RCR) carry one; everything else is undefined.
 * The header surfaces this as VISIBLE text on the metric's own line (one metric per
 * line), so the responsible-reading caveat is legible to every reader and survives
 * to the printed PDF — not demoted to a mouse-only hover title.
 */
function coverageNoteFor(locale: string, key: string, values: OwnerMetrics): string | undefined {
  if (key === "fwci_mean") return metricCoverageNote(locale, values.fwci_n);
  if (key === "rcr_mean")
    return withSmallN(locale, metricRcrCoverageNote(locale, values.rcr_n), values.rcr_n);
  return undefined;
}

/** Append the localized small-sample caveat to a coverage note when N is below
 *  {@link SMALL_N_THRESHOLD}. No-op when the note or N is absent. */
function withSmallN(
  locale: string,
  note: string | undefined,
  n: number | undefined,
): string | undefined {
  if (note === undefined) return undefined;
  if (typeof n === "number" && n > 0 && n < SMALL_N_THRESHOLD) {
    return `${note} · ${metricSmallNNote(locale)}`;
  }
  return note;
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
        context: metricContext(locale, def.key),
        coverageNote: coverageNoteFor(locale, def.key, values),
      };
    })
    .filter((m): m is FormattedMetric => m !== null);
}

export interface OpenAccessShare {
  /** Countable works OpenAlex determined are open access. */
  open: number;
  /** Countable works carrying an OA determination (the honest denominator). */
  known: number;
  /** Open-access percentage, 0–100, rounded. */
  pct: number;
}

/**
 * Share of the CURATED, countable works that are open access. Computed ONLY over
 * works whose OA state OpenAlex actually determined (`meta.oaIsOpen` defined), so
 * "closed" and "not-yet-determined" are never conflated.
 *
 * Gated on its OWN toggle, `display.showOpenAccessShare`, which is DECOUPLED from
 * the per-work OA badge (`display.showOpenAccess`): selecting badges no longer
 * forces a header percentage. For backward compatibility the share toggle INHERITS
 * the badge toggle when it has never been set (`?? showOpenAccess`), so a CV
 * published before the split renders unchanged until its owner touches the control.
 *
 * Returns null when the (effective) toggle is off, or when no countable work
 * carries a determination yet (e.g. a CV synced before `oaIsOpen` existed → re-sync
 * to populate) — so the caller shows nothing rather than a misleading 0%.
 */
export function openAccessShare(cv: CanonicalCv): OpenAccessShare | null {
  if (!(cv.display.showOpenAccessShare ?? cv.display.showOpenAccess)) return null;
  const known = countableWorks(cv).filter((w) => typeof w.meta.oaIsOpen === "boolean");
  if (known.length === 0) return null;
  const open = known.filter((w) => w.meta.oaIsOpen === true).length;
  return { open, known: known.length, pct: Math.round((open / known.length) * 100) };
}

/** A " · "-joined plain-text metrics line (empty string if none to show). */
export function metricsLineText(cv: CanonicalCv): string {
  return formattedMetrics(cv)
    .map((m) => `${m.label}: ${m.value}`)
    .join(" · ");
}

/**
 * Whether the research-summary block (metrics + chart + authorship) is suppressed
 * everywhere — the "hidden" placement. The plain exports (Markdown/LaTeX/DOCX) honour
 * this to drop the block; the HTML/PDF renderer additionally supports the top/bottom
 * placements (the layout-faithful surface), so for those formats "hidden" is the one
 * placement that changes their otherwise-fixed structure.
 */
export function isSummaryBlockHidden(cv: CanonicalCv): boolean {
  return cv.display.summaryBlockPosition === "hidden";
}
