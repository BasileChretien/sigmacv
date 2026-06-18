import { visibleItems, visibleSections } from "./curate";
import type { CanonicalCv, CvSectionType } from "./schema";

export interface NarrativeEvidenceItem {
  type: CvSectionType;
  count: number;
}

/**
 * Which of the owner's OUTPUT sections are relevant evidence for each R4RI /
 * "Résumé for Researchers" narrative module — surfaced as counts under that
 * module's editor so the writer can weave concrete contributions into the prose
 * instead of staring at a blank box. Order = display priority.
 *  - knowledge   → the scholarly outputs (publications, preprints, conference, data/software);
 *  - individuals → developing people (supervision, teaching);
 *  - community   → service to the field (peer review, editorial, service/memberships);
 *  - society     → impact beyond academia (patents, clinical trials).
 */
const EVIDENCE_SECTIONS: Partial<Record<CvSectionType, CvSectionType[]>> = {
  "narrative-knowledge": ["publications", "preprints", "conference", "datasets"],
  "narrative-individuals": ["supervision", "teaching"],
  "narrative-community": ["peer-review", "editorial", "service"],
  "narrative-society": ["patents", "clinical-trials"],
};

/**
 * Counts of the visible outputs relevant to a narrative module (e.g. publications
 * + datasets for "contributions to knowledge"), in display priority, omitting any
 * type the owner has none of. Returns [] for a non-narrative section type. Reads
 * only what's actually shown on the CV (visible sections + visible items) — a
 * hidden / "not mine" work is never counted. Pure.
 */
export function narrativeEvidence(cv: CanonicalCv, type: CvSectionType): NarrativeEvidenceItem[] {
  const relevant = EVIDENCE_SECTIONS[type];
  if (!relevant) return [];
  const counts = new Map<CvSectionType, number>();
  for (const section of visibleSections(cv)) {
    if (relevant.includes(section.type)) {
      counts.set(section.type, (counts.get(section.type) ?? 0) + visibleItems(section).length);
    }
  }
  return relevant
    .filter((t) => (counts.get(t) ?? 0) > 0)
    .map((t) => ({ type: t, count: counts.get(t)! }));
}
