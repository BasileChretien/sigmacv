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
/** The output section types that support a narrative module, or undefined for
 *  any other section type (a free `statement` can draw on every section). */
export function narrativeEvidenceSectionTypes(type: CvSectionType): CvSectionType[] | undefined {
  return EVIDENCE_SECTIONS[type];
}

/** Whether a section type is one of the four narrative contribution modules. */
export function isNarrativeModuleType(type: CvSectionType): boolean {
  return type in EVIDENCE_SECTIONS;
}

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

export interface NarrativeEvidenceEntry {
  /** The entry's canonical id — the `[[id]]` evidence token a narrative can cite. */
  id: string;
  title: string;
  /** Journal / conference / publisher (CSL container-title), when known. */
  venue?: string;
  /** Publication year, when known. */
  year?: number;
}
export interface NarrativeEvidenceGroup {
  type: CvSectionType;
  entries: NarrativeEvidenceEntry[];
}

/**
 * Up to `maxPerSection` representative ENTRIES (id + title + venue + year) per
 * relevant output section for a narrative module — concrete material for the AI
 * first-draft prompt. Titles/venues/years plus the entry's own id (the evidence
 * token the draft cites — a public WORK identifier, never a personal one); no
 * abstracts or co-authors, and only VISIBLE items, so the prompt stays minimal +
 * reflects what the user shows. Pure; [] for a non-narrative type.
 */
export function narrativeEvidenceEntries(
  cv: CanonicalCv,
  type: CvSectionType,
  maxPerSection = 8,
): NarrativeEvidenceGroup[] {
  const relevant = EVIDENCE_SECTIONS[type];
  if (!relevant) return [];
  const byType = new Map<CvSectionType, NarrativeEvidenceEntry[]>();
  for (const section of visibleSections(cv)) {
    if (!relevant.includes(section.type)) continue;
    const list = byType.get(section.type) ?? [];
    for (const it of visibleItems(section)) {
      if (list.length >= maxPerSection) break;
      const e = itemEntry(it);
      if (e) list.push(e);
    }
    byType.set(section.type, list);
  }
  return relevant
    .map((t) => ({ type: t, entries: byType.get(t) ?? [] }))
    .filter((g) => g.entries.length > 0);
}

/** Title (override → CSL → display string) + venue + year for an item, trimmed +
 *  capped. undefined when there's no usable title. */
function itemEntry(item: CvItem): NarrativeEvidenceEntry | undefined {
  const raw = item.displayTextOverride ?? item.csl?.title ?? item.displayText;
  if (typeof raw !== "string") return undefined;
  const title = raw.trim().slice(0, 250);
  if (!title) return undefined;
  const venueRaw = item.csl?.["container-title"];
  const venue =
    typeof venueRaw === "string" && venueRaw.trim() ? venueRaw.trim().slice(0, 150) : undefined;
  const cslYear = item.csl?.issued?.["date-parts"]?.[0]?.[0];
  const year =
    typeof item.meta.year === "number"
      ? item.meta.year
      : typeof cslYear === "number"
        ? cslYear
        : undefined;
  return { id: item.id, title, ...(venue ? { venue } : {}), ...(year ? { year } : {}) };
}
