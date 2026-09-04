import {
  degreeLabel,
  renderStrings,
  superviseeNoun,
  supervisionRoleLabel,
} from "@/lib/i18n/render";
import { visibleItems, visibleSections } from "./curate";
import {
  hasStructuredSupervision,
  itemInstitution,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "./schema";

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

export interface NarrativeEvidenceEntry {
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
 * Up to `maxPerSection` representative ENTRIES (title + venue + year) per relevant
 * output section for a narrative module — concrete material for the AI first-draft
 * prompt. Titles/venues/years only (no abstracts, co-authors or identifiers) and
 * only VISIBLE items, so the prompt stays minimal + reflects what the user shows.
 * Pure; [] for a non-narrative type.
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
      const e = itemEntry(it, cv.display.locale);
      if (e) list.push(e);
    }
    byType.set(section.type, list);
  }
  return relevant
    .map((t) => ({ type: t, entries: byType.get(t) ?? [] }))
    .filter((g) => g.entries.length > 0);
}

/**
 * A STRUCTURED supervision record as evidence — WITHOUT the supervisee's name.
 * The entries feed the AI first-draft prompt and the module's evidence list, and a
 * supervisee's name is third-party personal data the owner never asked to send
 * anywhere; what the narrative needs is the shape of the contribution ("PhD,
 * primary supervisor — <thesis>, <institution>, 2023"), which is exactly what is
 * kept. undefined for an unstructured entry (its free-text line is used instead).
 */
function supervisionEntry(item: CvItem, locale: string): NarrativeEvidenceEntry | undefined {
  if (!hasStructuredSupervision(item)) return undefined;
  const rs = renderStrings(locale);
  const m = item.meta;
  const qualifiers = [
    m.degreeLevel ? degreeLabel(rs, m.degreeLevel) : "",
    m.supervisionRole ? supervisionRoleLabel(rs, m.supervisionRole) : "",
  ].filter(Boolean);
  const thesis = m.thesisTitle?.trim();
  // A record with only a name has no name-free descriptor → the generic noun,
  // never the free-text line (which is where the name would be).
  const title =
    [qualifiers.join(", "), thesis].filter(Boolean).join(" — ").slice(0, 250) ||
    superviseeNoun(rs, undefined);
  const inst = itemInstitution(item)?.trim();
  const year = m.endYear ?? m.startYear;
  return {
    title,
    ...(inst ? { venue: inst.slice(0, 150) } : {}),
    ...(typeof year === "number" ? { year } : {}),
  };
}

/** Title (override → CSL → display string) + venue + year for an item, trimmed +
 *  capped. undefined when there's no usable title. */
function itemEntry(item: CvItem, locale: string): NarrativeEvidenceEntry | undefined {
  const structured = supervisionEntry(item, locale);
  if (structured) return structured;
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
  return { title, ...(venue ? { venue } : {}), ...(year ? { year } : {}) };
}
