import {
  DEFAULT_SECTION_ORDER,
  isHidden,
  type CanonicalCv,
  type CvItem,
  type CvNarrativeModule,
  type CvOwner,
  type CvSection,
  type CvSectionType,
  type DisplayChoices,
  type NarrativeModuleKey,
  type NotMineReason,
} from "./schema";
import { isDefaultSectionTitle, sectionTitle } from "@/lib/i18n";
import { narrativeModuleStrings } from "@/lib/i18n/narrative";
import { toCslName } from "@/lib/openalex/toCsl";
import type { CslItem, CslName } from "@/types/csl";

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

/**
 * Remove a section from the CV entirely (distinct from `setSectionVisible`,
 * which keeps it in the editor but hides it from the rendered CV). Re-addable
 * types reappear in the "Add a section" menu (it lists addable types not
 * currently present); a manual "other"/custom section is simply gone (re-add a
 * blank one anytime). Its items are dropped — source-driven sections are
 * rebuilt on the next re-sync, manual entries are not. No-op for unknown ids.
 */
export function removeSection(cv: CanonicalCv, sectionId: string): CanonicalCv {
  const next = cv.sections.filter((s) => s.id !== sectionId);
  return next.length === cv.sections.length ? cv : { ...cv, sections: next };
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
  return {
    ...cv,
    sections: next.map((s, i) => ({ ...s, order: i })),
    display: { ...cv.display, sectionsCustomized: true },
  };
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
  return {
    ...cv,
    sections: next.map((s, i) => ({ ...s, order: i })),
    display: { ...cv.display, sectionsCustomized: true },
  };
}

/**
 * Reorder sections to an explicit id sequence — the result of a pointer
 * drag-and-drop (Motion `Reorder` hands back the full new order). Any ids the
 * caller omits (defensive) keep their existing relative order, appended at the
 * end, so a stale/partial list can never drop a section.
 */
export function reorderSections(
  cv: CanonicalCv,
  orderedIds: readonly string[],
): CanonicalCv {
  const sorted = sortByOrder(cv.sections);
  const byId = new Map(cv.sections.map((s) => [s.id, s]));
  const ordered: CvSection[] = [];
  for (const id of orderedIds) {
    const s = byId.get(id);
    if (s) {
      ordered.push(s);
      byId.delete(id);
    }
  }
  for (const s of sortByOrder([...byId.values()])) ordered.push(s);
  // No-op (preserve identity) when the order is unchanged — avoids a needless
  // save/re-render when Motion fires onReorder with the current order.
  const unchanged = ordered.every((s, i) => sorted[i]?.id === s.id);
  if (unchanged) return cv;
  return {
    ...cv,
    sections: ordered.map((s, i) => ({ ...s, order: i })),
    display: { ...cv.display, sectionsCustomized: true },
  };
}

/** Update one or more display choices (citation style, highlight, etc.). */
export function updateDisplay(
  cv: CanonicalCv,
  patch: Partial<DisplayChoices>,
): CanonicalCv {
  return { ...cv, display: { ...cv.display, ...patch } };
}

/** Stable preset id derived from its name (so re-saving a name updates it). */
function presetId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `preset:${slug || "view"}`;
}

/**
 * Save the current display choices + section visibility as a NAMED preset (a
 * reusable "view" of the same curated data — e.g. full CV vs. grant biosketch).
 * Upserts by name. No-op for a blank name. Curation data is never duplicated.
 */
export function savePreset(cv: CanonicalCv, name: string): CanonicalCv {
  const trimmed = name.trim();
  if (!trimmed) return cv;
  const id = presetId(trimmed);
  const preset = {
    id,
    name: trimmed,
    display: cv.display,
    sectionVisibility: Object.fromEntries(
      cv.sections.map((s) => [s.id, s.visible]),
    ),
  };
  const others = (cv.presets ?? []).filter((p) => p.id !== id);
  return { ...cv, presets: [...others, preset] };
}

/** Apply a saved preset: restore its display choices + section visibility. The
 *  underlying items/curation are untouched. No-op if the id is unknown. */
export function applyPreset(cv: CanonicalCv, id: string): CanonicalCv {
  const preset = (cv.presets ?? []).find((p) => p.id === id);
  if (!preset) return cv;
  const sections = cv.sections.map((s) =>
    s.id in preset.sectionVisibility
      ? { ...s, visible: preset.sectionVisibility[s.id]! }
      : s,
  );
  return { ...cv, display: { ...preset.display }, sections };
}

/** Delete a saved preset by id (no-op if unknown). */
export function deletePreset(cv: CanonicalCv, id: string): CanonicalCv {
  const presets = cv.presets ?? [];
  const next = presets.filter((p) => p.id !== id);
  return next.length === presets.length ? cv : { ...cv, presets: next };
}

/**
 * Switch the document language. Beyond setting `display.locale` (which drives
 * citeproc's citation language), this RE-LOCALIZES every section heading that
 * still holds its default title — so changing the language immediately changes
 * the visible section titles in the rendered CV, not just the editor chrome.
 * Headings the user deliberately renamed are left untouched.
 */
export function setLocale(cv: CanonicalCv, locale: string): CanonicalCv {
  return {
    ...cv,
    display: { ...cv.display, locale },
    sections: cv.sections.map((s) =>
      isDefaultSectionTitle(s.type, s.title)
        ? { ...s, title: sectionTitle(locale, s.type) }
        : s,
    ),
  };
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

  return appendManualItem(cv, sectionType, {
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
  });
}

/** Append a manual item to its section (creating the section if absent), giving
 *  it the next order. Shared by the free-text and structured add-entry paths. */
function appendManualItem(
  cv: CanonicalCv,
  sectionType: CvSectionType,
  item: CvItem,
): CanonicalCv {
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
    items: [{ ...item, order: 0 }],
  };
  return { ...cv, sections: [...cv.sections, newSection] };
}

/** Fields for a structured (citation-style) manual entry. Only `title` is
 *  required; the rest are optional and omitted from the CSL when blank. */
export interface ManualEntryFields {
  /** CSL type (e.g. "article-journal", "paper-conference", "chapter"). */
  type?: string;
  title: string;
  /** Authors, one per line or separated by ";" — ideally "Family, Given". */
  authors?: string;
  /** Journal / conference / publisher (CSL container-title). */
  venue?: string;
  year?: number | string;
  doi?: string;
  url?: string;
}

/** "https://doi.org/10.1/x" (or "doi:10.1/x") → "10.1/x". */
function bareDoi(doi: string): string {
  return doi.trim().replace(/^(https?:\/\/(dx\.)?doi\.org\/|doi:)/i, "");
}

/** Split an authors string ("Smith, J; Doe, A") into CSL names (one per
 *  line/semicolon), reusing the OpenAlex name splitter (handles CJK + commas). */
function parseAuthors(raw: string | undefined): CslName[] {
  return (raw ?? "")
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(toCslName);
}

/**
 * Build a CSL-JSON item from structured manual fields, so the entry renders
 * through the SAME citeproc pipeline (and chosen citation style) as imported
 * works — no per-entry formatting. Returns null when the title is blank.
 */
export function buildManualCsl(
  id: string,
  fields: ManualEntryFields,
): CslItem | null {
  const title = fields.title.trim();
  if (!title) return null;

  const csl: CslItem = {
    id,
    type: fields.type?.trim() || "article-journal",
    title,
  };
  const authors = parseAuthors(fields.authors);
  if (authors.length) csl.author = authors;

  const year =
    typeof fields.year === "string" ? parseInt(fields.year, 10) : fields.year;
  if (typeof year === "number" && Number.isFinite(year)) {
    csl.issued = { "date-parts": [[year]] };
  }
  const venue = fields.venue?.trim();
  if (venue) csl["container-title"] = venue;

  // The editor offers a single "DOI or URL" field: a value that looks like a
  // DOI becomes a DOI (+ doi.org URL); anything else is kept as a plain URL.
  const rawDoi = (fields.doi ?? "").trim();
  if (rawDoi) {
    const stripped = bareDoi(rawDoi);
    if (/^10\.\d+\/\S+$/.test(stripped)) {
      csl.DOI = stripped;
      csl.URL = `https://doi.org/${stripped}`;
    } else {
      csl.URL = rawDoi;
    }
  } else if (fields.url?.trim()) {
    csl.URL = fields.url.trim();
  }
  return csl;
}

/**
 * Add a STRUCTURED manual entry to the section of the given type. Builds a CSL
 * item (rendered via citeproc, consistent with the chosen style) rather than a
 * free-text string. Preserved across re-sync like every manual item. No-op when
 * the title is blank.
 */
export function addStructuredEntry(
  cv: CanonicalCv,
  sectionType: CvSectionType,
  fields: ManualEntryFields,
  id: string,
): CanonicalCv {
  const csl = buildManualCsl(id, fields);
  if (!csl) return cv;

  const year =
    typeof fields.year === "string" ? parseInt(fields.year, 10) : fields.year;
  return appendManualItem(cv, sectionType, {
    id,
    source: "manual",
    sourceId: "manual",
    csl,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {
      year: typeof year === "number" && Number.isFinite(year) ? year : undefined,
      type: csl.type,
      doi: csl.DOI,
    },
  });
}

/**
 * Append a DOI-claimed work (built by `buildClaimedItem` from OpenAlex data) to
 * the right section — Preprints if it's a preprint, else Publications — creating
 * the section if needed. The metadata is source-driven; only ownership is asserted.
 */
export function addClaimedWork(
  cv: CanonicalCv,
  item: CvItem,
  isPreprint: boolean,
): CanonicalCv {
  return appendManualItem(cv, isPreprint ? "preprints" : "publications", item);
}

/**
 * Whether the CV already contains a work with the given OpenAlex id or DOI, so
 * the "add by DOI" flow can refuse a duplicate rather than list it twice.
 */
export function cvHasWork(
  cv: CanonicalCv,
  opts: { id?: string; doi?: string },
): boolean {
  const doi = opts.doi?.toLowerCase();
  return cv.sections.some((s) =>
    s.items.some(
      (it) =>
        (opts.id !== undefined && it.id === opts.id) ||
        (doi !== undefined &&
          (it.csl?.DOI?.toLowerCase() === doi ||
            it.meta.doi?.toLowerCase() === doi)),
    ),
  );
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

/**
 * Sections in their effective display order. Until the user has manually
 * reordered (sectionsCustomized), the canonical default order is applied at
 * display time — so a stored doc built before the default existed still shows
 * Positions/Education first WITHOUT needing a re-sync. Once customized, the
 * user's stored order wins.
 */
export function orderedSections(cv: CanonicalCv): CvSection[] {
  if (cv.display.sectionsCustomized) return sortByOrder(cv.sections);
  return [...cv.sections].sort(
    (a, b) => DEFAULT_SECTION_ORDER[a.type] - DEFAULT_SECTION_ORDER[b.type],
  );
}

/** Visible sections that should appear, in effective display order. */
export function visibleSections(cv: CanonicalCv): CvSection[] {
  return orderedSections(cv).filter((s) => s.visible);
}

// ─── Narrative CV modules (funder résumé prose) ──────────────────────────────

/** Patch shape for `upsertNarrativeModule` (all fields optional). */
export interface NarrativeModulePatch {
  heading?: string;
  body?: string;
  included?: boolean;
}

/** The narrative array (back-compat: a doc stored before narratives is `[]`). */
function narrativeOf(cv: CanonicalCv): CvNarrativeModule[] {
  return cv.narrative ?? [];
}

/**
 * Create or patch a narrative module by key. When the module is absent it is
 * created from the localized default (heading from `i18n/narrative.ts`, empty
 * body, `included: true`) and then the patch is applied; when present, the patch
 * is merged onto the existing module. Pure + immutable.
 */
export function upsertNarrativeModule(
  cv: CanonicalCv,
  key: NarrativeModuleKey,
  patch: NarrativeModulePatch = {},
): CanonicalCv {
  const narrative = narrativeOf(cv);
  const existing = narrative.find((m) => m.key === key);
  if (existing) {
    return {
      ...cv,
      narrative: narrative.map((m) =>
        m.key === key ? { ...m, ...patch } : m,
      ),
    };
  }
  const seed: CvNarrativeModule = {
    key,
    heading: narrativeModuleStrings(cv.display.locale, key).heading,
    body: "",
    included: true,
  };
  return { ...cv, narrative: [...narrative, { ...seed, ...patch }] };
}

/** Toggle whether a narrative module is shown (creates it if absent). */
export function setNarrativeModuleIncluded(
  cv: CanonicalCv,
  key: NarrativeModuleKey,
  included: boolean,
): CanonicalCv {
  return upsertNarrativeModule(cv, key, { included });
}

/** Remove a narrative module entirely (no-op if absent). */
export function removeNarrativeModule(
  cv: CanonicalCv,
  key: NarrativeModuleKey,
): CanonicalCv {
  const narrative = narrativeOf(cv);
  const next = narrative.filter((m) => m.key !== key);
  return next.length === narrative.length ? cv : { ...cv, narrative: next };
}

/**
 * Move a narrative module from one index to another (drag-and-drop reorder).
 * Indices are clamped into range; a no-op (same position, or an out-of-range
 * source) preserves identity. Pure + immutable.
 */
export function reorderNarrative(
  cv: CanonicalCv,
  fromIndex: number,
  toIndex: number,
): CanonicalCv {
  const narrative = narrativeOf(cv);
  if (fromIndex < 0 || fromIndex >= narrative.length) return cv;
  const to = Math.max(0, Math.min(toIndex, narrative.length - 1));
  if (to === fromIndex) return cv;
  const next = [...narrative];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(to, 0, moved!);
  return { ...cv, narrative: next };
}
