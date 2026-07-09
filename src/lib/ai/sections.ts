import type { CanonicalCv, CvSection } from "@/lib/canonical/schema";

/**
 * The narrative-CV modules AI drafting is offered for. Kept in its OWN module (no
 * server-only imports) so client components can gate on it without pulling in the
 * provider relay (which uses node:net / node:dns and must stay server-side).
 */
export const NARRATIVE_AI_SECTIONS = [
  "narrative-knowledge",
  "narrative-individuals",
  "narrative-community",
  "narrative-society",
] as const;

export type NarrativeAiSection = (typeof NARRATIVE_AI_SECTIONS)[number];

/** Whether AI drafting is offered for a section type (narrative modules only). */
export function isNarrativeAiSection(type: string): type is NarrativeAiSection {
  return (NARRATIVE_AI_SECTIONS as readonly string[]).includes(type);
}

/** A VISIBLE narrative module whose prose body is still empty — i.e. a module a
 *  funder-CV model added that the user hasn't written yet. Drives the editor's
 *  "these need filling" attention cue. */
export function isUnfilledNarrativeModule(section: CvSection): boolean {
  return (
    section.visible !== false && isNarrativeAiSection(section.type) && !(section.body ?? "").trim()
  );
}

/** Whether the CV has any unfilled narrative module (drives the Content-region cue). */
export function hasUnfilledNarrativeModules(cv: CanonicalCv): boolean {
  return cv.sections.some(isUnfilledNarrativeModule);
}
