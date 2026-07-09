import { visibleItems, visibleSections } from "./curate";
import type { CanonicalCv, CvItem, CvSectionType } from "./schema";

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

export interface NarrativeEvidenceTitles {
  type: CvSectionType;
  titles: string[];
}

/**
 * Up to `maxPerSection` representative TITLES per relevant output section for a
 * narrative module — concrete material for the AI first-draft prompt. Titles
 * only (no abstracts, co-authors or identifiers) and only VISIBLE items, so the
 * prompt stays minimal + reflects what the user actually shows. Pure; [] for a
 * non-narrative type.
 */
export function narrativeEvidenceTitles(
  cv: CanonicalCv,
  type: CvSectionType,
  maxPerSection = 6,
): NarrativeEvidenceTitles[] {
  const relevant = EVIDENCE_SECTIONS[type];
  if (!relevant) return [];
  const byType = new Map<CvSectionType, string[]>();
  for (const section of visibleSections(cv)) {
    if (!relevant.includes(section.type)) continue;
    const list = byType.get(section.type) ?? [];
    for (const it of visibleItems(section)) {
      if (list.length >= maxPerSection) break;
      const t = itemTitle(it);
      if (t) list.push(t);
    }
    byType.set(section.type, list);
  }
  return relevant
    .map((t) => ({ type: t, titles: byType.get(t) ?? [] }))
    .filter((e) => e.titles.length > 0);
}

/** A short, plain title for an item: the user's text override, else the CSL
 *  title, else the plain display string. Trimmed + capped; undefined if none. */
function itemTitle(item: CvItem): string | undefined {
  const raw = item.displayTextOverride ?? item.csl?.title ?? item.displayText;
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length > 0 ? t.slice(0, 250) : undefined;
}
