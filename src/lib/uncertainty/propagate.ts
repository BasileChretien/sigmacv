import type { CvItem } from "@/lib/canonical/schema";
import { priorFor } from "./attribution";
import { CURRENT_MODEL, type UncertaintyModel } from "./version";

/**
 * MONTE-CARLO PROPAGATION of attribution uncertainty into author-level indicators.
 *
 * Each work carries a probability that it is genuinely the account holder's
 * (`attribution.ts`). Draw many realisations of the work set — including each work
 * independently with its own probability — recompute the indicator on each, and
 * report the resulting distribution. An indicator stops being a number and becomes
 * a range whose width is driven by how much of the profile rests on weak evidence.
 *
 * ── REPRODUCIBILITY ───────────────────────────────────────────────────────────
 * The generator is SEEDED and the seed is part of the result. A figure computed
 * here can be recomputed exactly from the archived inputs, the model version and
 * the seed — which is the whole point of a research instrument, and impossible
 * with `Math.random()`. Nothing in this module reads wall-clock time or global
 * randomness.
 *
 * ── THE POINT ESTIMATE IS NOT THE CENTRE ──────────────────────────────────────
 * A consequence worth stating loudly, because it will surprise whoever builds the
 * display. `point` is the indicator computed with EVERY work included — the value
 * assuming every attribution is correct. Since probabilities are <= 1 the expected
 * realisation is a SMALLER work set, so the distribution sits at or below the
 * point, and once enough works are doubtful the interval stops containing it at
 * all. On a simulated 123-work profile with 45 flagged works the CV-scoped
 * h-index is 27 at the point and [18, 24] across realisations.
 *
 * That is not a bug: 27 is reachable only if every doubtful work really is the
 * author's, so it is the optimistic EXTREME rather than a best guess. But it means
 * an interval must never be rendered as "27 [18-24]", which reads as an error. The
 * honest presentation leads with the range and names the point for what it is —
 * the figure other systems report, which silently assumes attribution is perfect.
 *
 * ── WHAT IS BEING MEASURED ────────────────────────────────────────────────────
 * These indicators are computed OVER THE WORKS ON THE CV, which is deliberately
 * NOT the same quantity as OpenAlex's author-level figures. `render/metrics.ts`
 * leaves those pass-through numbers alone precisely because recomputing them from
 * a possibly-partial works list would undercount. The same caveat applies here and
 * is sharper: a CV-scoped h-index is a statement about this document, not about
 * the person's whole record, and it must be labelled as such wherever it surfaces.
 */

/** Deterministic PRNG (mulberry32). Small, fast, adequate for inclusion draws. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A function computing one indicator over a work set. Must be pure. */
export type Indicator = (items: readonly CvItem[]) => number;

export interface PropagateOptions {
  /** Realisations to draw. More = tighter quantile estimates, linear cost. */
  draws?: number;
  /** PRNG seed. Fixed by default so a result is reproducible without ceremony. */
  seed?: number;
  /** Model supplying the per-work probabilities (stamped onto the result). */
  model?: UncertaintyModel;
  /** Override the per-work probability (the calibration harness injects fitted values). */
  probability?: (item: CvItem) => number;
}

export interface PropagatedIndicator {
  /** The indicator computed on the works as they actually stand — the point value. */
  point: number;
  /** Median across realisations. */
  median: number;
  /** 2.5th percentile. */
  lower: number;
  /** 97.5th percentile. */
  upper: number;
  /** Realisations drawn. */
  draws: number;
  /** Seed used — part of the reproducibility record. */
  seed: number;
  /** Model id/version that supplied the probabilities. */
  modelId: string;
  modelVersion: number;
  /**
   * Whether the model behind this was calibrated. **FALSE MEANS DO NOT DISPLAY
   * THE INTERVAL** — see `version.ts`. Carried on the result so a consumer cannot
   * receive an interval without also receiving the fact that it is provisional.
   */
  calibrated: boolean;
}

export const DEFAULT_DRAWS = 2000;
export const DEFAULT_SEED = 0x5c_11_a7;

/**
 * Propagate attribution uncertainty through one indicator.
 *
 * Works are included independently, each with its own probability — a deliberate
 * simplification worth naming: real attribution errors are CORRELATED (a namesake
 * over-merge injects a whole cluster of one stranger's papers at once, not a
 * scattering of independent coin flips). Independence therefore UNDERSTATES the
 * true spread, and any interval from this model is a lower bound on uncertainty.
 * Modelling the correlation needs the co-author-cluster structure and belongs to a
 * later version; stating the limitation is what keeps this one honest.
 */
export function propagate(
  items: readonly CvItem[],
  indicator: Indicator,
  opts: PropagateOptions = {},
): PropagatedIndicator {
  const draws = opts.draws ?? DEFAULT_DRAWS;
  const seed = opts.seed ?? DEFAULT_SEED;
  const model = opts.model ?? CURRENT_MODEL;
  const prob = opts.probability ?? priorFor;
  const rand = mulberry32(seed);

  const probs = items.map(prob);
  const results: number[] = [];
  const bag: CvItem[] = [];
  for (let d = 0; d < draws; d++) {
    bag.length = 0;
    for (let i = 0; i < items.length; i++) {
      if (rand() < probs[i]!) bag.push(items[i]!);
    }
    results.push(indicator(bag));
  }
  results.sort((a, b) => a - b);

  return {
    point: indicator(items),
    median: quantile(results, 0.5),
    lower: quantile(results, 0.025),
    upper: quantile(results, 0.975),
    draws,
    seed,
    modelId: model.id,
    modelVersion: model.version,
    calibrated: model.calibrated,
  };
}

/** Nearest-rank quantile of an ASCENDING-sorted array. */
export function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx]!;
}
