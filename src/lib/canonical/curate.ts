import {
  DEFAULT_SECTION_ORDER,
  isHidden,
  type CanonicalCv,
  type CvItem,
  type CvOwner,
  type CvSection,
  type CvSectionType,
  type DisplayChoices,
  type NotMineReason,
} from "./schema";
import { sectionTitle } from "@/lib/i18n";

/**
 * Pure, immutable curation operations on the canonical CV object.
 *
 * Every function returns a NEW object and never mutates its input — these run
 * both client-side (optimistic editor state) and server-side, so they must be
 * dependency-free and side-effect-free. This is "display curation" only: it
 * touches the user's own document and writes nowhere external.
 */

type Direction = "up" | "down";

function sortByOrder<T extends { order: number }>(arr: readonly T[]): T[] {
  return [...arr].sort((a, b) => a.order - b.order);
}

function reindex<T extends { order: number }>(arr: readonly T[]): T[] {
  return sortByOrder(arr).map((x, i) => ({ ...x, order: i }));
}

function mapSection(
  cv: CanonicalCv,
  sectionId: string,
  fn: (s: CvSection) => CvSection,
): CanonicalCv {
  return {
    ...cv,
    sections: cv.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
  };
}

/** Hide/show an item on the CV (display curation; the work is still the user's). */
export function setItemIncluded(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  included: boolean,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) =>
      it.id === itemId ? { ...it, included } : it,
    ),
  }));
}

/**
 * Assert / retract "this work is not mine" (a disambiguation claim, distinct
 * from a display hide). On assert: stamps `notMineAssertedAt` and records the
 * optional structured `reason`. On retract: clears both. `now` is threaded in
 * for determinism; falls back to wall-clock if omitted.
 */
export function setItemNotMine(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  notMine: boolean,
  opts: { reason?: NotMineReason; now?: string } = {},
): CanonicalCv {
  const now = opts.now ?? new Date().toISOString();
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            notMine,
            notMineAssertedAt: notMine ? now : undefined,
            notMineReason: notMine ? opts.reason : undefined,
          }
        : it,
    ),
  }));
}

/** Move an item up/down within its section. */
export function moveItem(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  direction: Direction,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => {
    const items = sortByOrder(s.items);
    const idx = items.findIndex((i) => i.id === itemId);
    if (idx < 0) return s;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= items.length) return s;
    const next = [...items];
    const a = next[idx]!;
    const b = next[target]!;
    next[idx] = b;
    next[target] = a;
    return { ...s, items: next.map((it, i) => ({ ...it, order: i })) };
  });
}

/** Move an item to an explicit index within its section (drag-and-drop). */
export function moveItemTo(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  targetIndex: number,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => {
    const items = sortByOrder(s.items);
    const from = items.findIndex((i) => i.id === itemId);
    if (from < 0) return s;
    const clamped = Math.max(0, Math.min(targetIndex, items.length - 1));
    if (clamped === from) return s;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(clamped, 0, moved!);
    return { ...s, items: next.map((it, i) => ({ ...it, order: i })) };
  });
}

export function setSectionVisible(
  cv: CanonicalCv,
  sectionId: string,
  visible: boolean,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({ ...s, visible }));
}

export function renameSection(
  cv: CanonicalCv,
  sectionId: string,
  title: string,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({ ...s, title }));
}

/** Move a whole section up/down. */
export function moveSection(
  cv: CanonicalCv,
  sectionId: string,
  direction: Direction,
): CanonicalCv {
  const sections = sortByOrder(cv.sections);
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) return cv;
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= sections.length) return cv;
  const next = [...sections];
  const a = next[idx]!;
  const b = next[target]!;
  next[idx] = b;
  next[target] = a;
  return { ...cv, sections: next.map((s, i) => ({ ...s, order: i })) };
}

/** Move a section to an explicit index (drag-and-drop). */
export function moveSectionTo(
  cv: CanonicalCv,
  sectionId: string,
  targetIndex: number,
): CanonicalCv {
  const sections = sortByOrder(cv.sections);
  const from = sections.findIndex((s) => s.id === sectionId);
  if (from < 0) return cv;
  const clamped = Math.max(0, Math.min(targetIndex, sections.length - 1));
  if (clamped === from) return cv;
  const next = [...sections];
  const [moved] = next.splice(from, 1);
  next.splice(clamped, 0, moved!);
  return { ...cv, sections: next.map((s, i) => ({ ...s, order: i })) };
}

/** Update one or more display choices (citation style, highlight, etc.). */
export function updateDisplay(
  cv: CanonicalCv,
  patch: Partial<DisplayChoices>,
): CanonicalCv {
  return { ...cv, display: { ...cv.display, ...patch } };
}

/**
 * Update owner/header profile fields (name, headline, summary, photo, contact,
 * links, personal). Shallow-merges the top level; nested `contact`/`personal`
 * patches are merged with the existing sub-object so a partial update never
 * drops sibling fields. Immutable.
 */
export function updateOwner(
  cv: CanonicalCv,
  patch: Partial<CvOwner>,
): CanonicalCv {
  const owner: CvOwner = { ...cv.owner, ...patch };
  if (patch.contact) owner.contact = { ...cv.owner.contact, ...patch.contact };
  if (patch.personal) owner.personal = { ...cv.owner.personal, ...patch.personal };
  return { ...cv, owner };
}

// ─── Manual entries (user-authored positions / grants / skills / …) ──────────

/**
 * Add a user-authored ("manual") item to the section of the given type, creating
 * that section if it doesn't exist yet. Manual items are preserved across
 * OpenAlex/ORCID re-syncs (see build.ts `previousManualItems`). The caller
 * supplies a stable unique id (e.g. `position:manual:<uuid>`).
 */
export function addManualEntry(
  cv: CanonicalCv,
  sectionType: CvSectionType,
  displayText: string,
  id: string,
): CanonicalCv {
  const text = displayText.trim();
  if (!text) return cv;

  const item: CvItem = {
    id,
    source: "manual",
    sourceId: "manual",
    displayText: text,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
  };

  const existing = cv.sections.find((s) => s.type === sectionType);
  if (existing) {
    const maxOrder = existing.items.reduce((m, it) => Math.max(m, it.order), -1);
    return mapSection(cv, existing.id, (s) => ({
      ...s,
      items: [...s.items, { ...item, order: maxOrder + 1 }],
    }));
  }

  const newSection: CvSection = {
    id: sectionType,
    type: sectionType,
    title: sectionTitle(cv.display.locale, sectionType),
    visible: true,
    order: DEFAULT_SECTION_ORDER[sectionType],
    items: [item],
  };
  return { ...cv, sections: [...cv.sections, newSection] };
}

/**
 * Create an empty section of the given type (if it doesn't already exist), at
 * its canonical order with a localized title. The user then adds entries via
 * the add-entry input. Used by the editor's "Add a section" menu.
 */
export function addSection(
  cv: CanonicalCv,
  sectionType: CvSectionType,
): CanonicalCv {
  if (cv.sections.some((s) => s.type === sectionType)) return cv;
  const newSection: CvSection = {
    id: sectionType,
    type: sectionType,
    title: sectionTitle(cv.display.locale, sectionType),
    visible: true,
    order: DEFAULT_SECTION_ORDER[sectionType],
    items: [],
  };
  return { ...cv, sections: [...cv.sections, newSection] };
}

/** Edit an item's free-text display string (manual entries). */
export function updateItemText(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  displayText: string,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) =>
      it.id === itemId ? { ...it, displayText } : it,
    ),
  }));
}

/** Remove an item from its section (used for user-added manual entries). */
export function removeItem(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: reindex(s.items.filter((it) => it.id !== itemId)),
  }));
}

/**
 * Return a section's displayable items, sorted by order — the exact list a
 * renderer should emit. Excludes both hidden and "not mine" items (the single
 * chokepoint every renderer shares, so the assertion is enforced everywhere).
 */
export function visibleItems(section: CvSection) {
  return reindex(section.items.filter((it) => !isHidden(it)));
}

/** Sections that should appear, in order. */
export function visibleSections(cv: CanonicalCv): CvSection[] {
  return sortByOrder(cv.sections).filter((s) => s.visible);
}
