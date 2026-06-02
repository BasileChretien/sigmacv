import { isHidden, type CanonicalCv, type CvSection, type DisplayChoices } from "./schema";

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
 * from a display hide). Stamps `notMineAssertedAt` on assert, clears on retract.
 * `now` is threaded in for determinism; falls back to wall-clock if omitted.
 */
export function setItemNotMine(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  notMine: boolean,
  now: string = new Date().toISOString(),
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            notMine,
            notMineAssertedAt: notMine ? now : undefined,
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

/** Update one or more display choices (citation style, highlight, etc.). */
export function updateDisplay(
  cv: CanonicalCv,
  patch: Partial<DisplayChoices>,
): CanonicalCv {
  return { ...cv, display: { ...cv.display, ...patch } };
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
