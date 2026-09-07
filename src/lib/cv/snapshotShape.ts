import { applyCvModel, isCvModelId } from "@/lib/canonical/cvModels";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { FreezePreset } from "@/lib/cv/freezeRequest";
import { applyHiringPreset, applyReaderMode } from "@/lib/render/readerMode";

/**
 * "Freeze in this shape": the document a snapshot freezes when the owner asks
 * for a CV model and/or a display preset. Applied to a COPY on the way into the
 * snapshot — the owner's live document is never touched, which is what makes a
 * request-driven freeze safe to answer with one click.
 *
 *  - `modelId` → `applyCvModel` (pure: section visibility / order / titles +
 *    the model's display overrides; never item data). Unknown ids are ignored.
 *  - `preset: "reader"` → the reader-mode preset is MATERIALISED into the frozen
 *    display (so the provenance ledger computed on the shaped document — e.g.
 *    its "retracted works shown" line — matches what the frozen page renders,
 *    which forces `hideRetracted` off).
 *  - `preset: "hiring"` → contact details on, academic evidence marks and
 *    metrics off (`applyHiringPreset`).
 *
 * Pure + immutable.
 */
export interface FreezeShape {
  modelId?: string;
  preset?: FreezePreset;
}

export function shapeForFreeze(cv: CanonicalCv, shape: FreezeShape): CanonicalCv {
  let next = cv;
  if (shape.modelId && isCvModelId(shape.modelId)) {
    // Start from the model's OWN list settings: `applyCvModel` only spreads the
    // model's display overrides, so a "full record" model (no overrides) frozen
    // over a live layout narrowed to "10 peer-reviewed" would inherit that
    // narrowing. Reset the two narrowing fields first; sort order is the owner's.
    next = {
      ...next,
      display: { ...next.display, publicationsLimit: undefined, peerReviewedOnly: false },
    };
    next = applyCvModel(next, shape.modelId);
  }
  if (shape.preset === "reader") next = { ...next, display: applyReaderMode(next.display) };
  else if (shape.preset === "hiring") next = { ...next, display: applyHiringPreset(next.display) };
  return next;
}
