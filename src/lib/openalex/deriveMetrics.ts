import type { OpenAlexWork } from "./types";

/**
 * Author-level metrics DERIVED from per-work OpenAlex fields (computed at build
 * time, since the author record alone doesn't carry them). All fields optional:
 * when the underlying per-work data is absent, the aggregate is omitted rather
 * than fabricated.
 */
export interface DerivedMetrics {
  /** Mean of per-work FWCI (a proxy — NOT OpenAlex's official author FWCI). */
  fwci_mean?: number;
  /** Fraction (0..1) of works in the top decile by field+year citations. */
  top10pct_share?: number;
  sigma_score?: number;
}

export function computeDerivedMetrics(works: OpenAlexWork[]): DerivedMetrics {
  const out: DerivedMetrics = {};

  const fwcis = works
    .map((w) => w.fwci)
    .filter((x): x is number => typeof x === "number");
  if (fwcis.length > 0) {
    out.fwci_mean = fwcis.reduce((a, b) => a + b, 0) / fwcis.length;
  }

  const percentiles = works
    .map((w) => w.cited_by_percentile_year?.value)
    .filter((x): x is number => typeof x === "number");
  if (percentiles.length > 0) {
    out.top10pct_share =
      percentiles.filter((v) => v >= 90).length / percentiles.length;
  }

  const sigma = computeSigmaScore();
  // Placeholder always returns undefined today, so the assignment is dormant
  // until a validated formula lands.
  /* v8 ignore next */
  if (typeof sigma.value === "number") out.sigma_score = sigma.value;

  return out;
}

/**
 * Sigma-Score — PLACEHOLDER. A defensible, citable Sigma-Score needs field/year
 * reference distributions and per-work normalized scores aggregated, almost
 * certainly from a precomputed table or batch job rather than a single OpenAlex
 * pull. Until that exists and is validated, emit NO value (so nothing is ever
 * presented as authoritative). This function is the single place the future
 * computation will live.
 */
export function computeSigmaScore(): { value?: number; isPlaceholder: true } {
  return { value: undefined, isPlaceholder: true };
}
