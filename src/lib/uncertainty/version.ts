/**
 * MODEL VERSIONING + THE CALIBRATION GATE.
 *
 * Two jobs, both load-bearing.
 *
 * 1. REPRODUCIBILITY. Every derived quantity must be recomputable from archived
 *    inputs plus a model id and version. Model versions are APPEND-ONLY: a changed
 *    model is a new version, never an edit to an existing one, so a figure quoted
 *    in a paper can always be reproduced from the version stamped alongside it.
 *
 * 2. THE GATE. Numeric uncertainty intervals may not be displayed until the model
 *    behind them has been calibrated against real human adjudications. This is
 *    enforced HERE, in code, rather than left as a policy note — because the one
 *    way this feature fails is by shipping an interval derived from coefficients
 *    somebody chose, which dresses a guess as a measurement. That would be the
 *    precise false precision the whole feature exists to reject, committed inside
 *    the feature built to reject it.
 */

export interface UncertaintyModel {
  /** Stable identifier, stamped onto every derived quantity. */
  readonly id: string;
  /** Append-only. A changed model is a NEW version. */
  readonly version: number;
  /** One line on what the model does — shown in provenance, read by reviewers. */
  readonly summary: string;
  /**
   * Whether the class→probability mapping was ESTIMATED FROM DATA. False means the
   * priors are provisional placeholders and no numeric interval derived from them
   * may be displayed. Flipping this to true requires a fitted artefact and the
   * calibration statistics below.
   */
  readonly calibrated: boolean;
  /**
   * Calibration evidence, present only when `calibrated` is true. Brier score,
   * calibration slope and intercept, and the adjudication sample it was fit on —
   * the minimum needed to judge whether the intervals mean anything.
   */
  readonly calibration?: {
    readonly brier: number;
    readonly slope: number;
    readonly intercept: number;
    readonly nAdjudications: number;
    readonly nResearchers: number;
    /** ISO date of the locked dataset the fit used. */
    readonly fittedAt: string;
  };
}

/**
 * v1 — deterministic ordinal classification, provisional priors, NOT calibrated.
 *
 * Deliberately shipped uncalibrated: the machinery is worth having in place and
 * exercised offline before any adjudications exist, and the profile-level evidence
 * summary it enables (how many works rest on weak evidence) is honest and useful
 * on its own. What it may NOT do is emit a number that looks like a measurement.
 */
export const MODEL_V1: UncertaintyModel = Object.freeze({
  id: "attribution-ordinal",
  version: 1,
  summary:
    "Ordinal attribution classes from match basis, misattribution signals and user adjudication. Priors provisional; not fit to data.",
  calibrated: false,
});

/** Every model version ever shipped, oldest first. Append only — never edit. */
export const MODELS: readonly UncertaintyModel[] = Object.freeze([MODEL_V1]);

/** The model new computations use. */
export const CURRENT_MODEL: UncertaintyModel = MODEL_V1;

/** Look up an archived version so an old figure can be reproduced exactly. */
export function modelFor(id: string, version: number): UncertaintyModel | undefined {
  return MODELS.find((m) => m.id === id && m.version === version);
}

/**
 * THE GATE. Whether this model may back a DISPLAYED numeric interval.
 *
 * Call this before rendering any interval, share, or percentage derived from
 * attribution probabilities. When it returns false the only honest surfaces are
 * ordinal ones — "3 works rest on weak evidence" — which state what is known
 * without implying a precision that was never measured.
 */
export function isCalibrated(model: UncertaintyModel = CURRENT_MODEL): boolean {
  return model.calibrated && model.calibration !== undefined;
}

/**
 * Guard for callers that intend to display a number. Returns the model when it is
 * safe to do so, and throws otherwise — loudly, at the call site, rather than
 * silently rendering a fabricated interval.
 */
export function requireCalibrated(model: UncertaintyModel = CURRENT_MODEL): UncertaintyModel {
  if (!isCalibrated(model)) {
    throw new Error(
      `Uncertainty model ${model.id} v${model.version} is not calibrated: ` +
        "numeric intervals must not be displayed. Use the ordinal summary instead.",
    );
  }
  return model;
}
