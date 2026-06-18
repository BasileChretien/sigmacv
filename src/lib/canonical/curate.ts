import {
  DEFAULT_SECTION_ORDER,
  PROSE_BODY_MAX,
  isHidden,
  isProseSectionType,
  type CanonicalCv,
  type CvItem,
  type CvOwner,
  type CvSection,
  type CvSectionType,
  type DisplayChoices,
  type NotMineReason,
} from "./schema";
import { isDefaultSectionTitle, sectionTitle } from "@/lib/i18n";
import { toCslName } from "@/lib/openalex/toCsl";
import { duplicatePairKey } from "./duplicates";
import { rederiveEntryLine } from "./entryLine";
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
    items: s.items.map((it) => (it.id === itemId ? { ...it, included } : it)),
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

/**
 * Pin / unpin a publication as "selected / featured". A pure display-curation
 * choice: a featured work sorts to the TOP of its section (ahead of the normal
 * order) and is marked with a quiet "Selected" star at render — the equivalent of
 * a CV's hand-picked "Selected publications" list. Survives re-sync (`build.ts`
 * carries `featured` like `included`). Distinct from `included`/`notMine`.
 */
export function setItemFeatured(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  featured: boolean,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) => (it.id === itemId ? { ...it, featured } : it)),
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

export function renameSection(cv: CanonicalCv, sectionId: string, title: string): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({ ...s, title }));
}

/** Move a whole section up/down. */
export function moveSection(cv: CanonicalCv, sectionId: string, direction: Direction): CanonicalCv {
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
export function reorderSections(cv: CanonicalCv, orderedIds: readonly string[]): CanonicalCv {
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
export function updateDisplay(cv: CanonicalCv, patch: Partial<DisplayChoices>): CanonicalCv {
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
    sectionVisibility: Object.fromEntries(cv.sections.map((s) => [s.id, s.visible])),
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
    s.id in preset.sectionVisibility ? { ...s, visible: preset.sectionVisibility[s.id]! } : s,
  );
  return { ...cv, display: { ...preset.display }, sections };
}

/** Delete a saved preset by id (no-op if unknown). */
export function deletePreset(cv: CanonicalCv, id: string): CanonicalCv {
  const presets = cv.presets ?? [];
  const next = presets.filter((p) => p.id !== id);
  return next.length === presets.length ? cv : { ...cv, presets: next };
}

// ─── Per-view item selection (display.excludedItems) ─────────────────────────
// A preset captures the WHOLE `display`, so these per-view show/hide choices are
// saved + restored with presets automatically — no preset-specific code needed.

/** Immutable: set (or prune-when-empty) a section's exclusion list. Exported
 *  for the bulk ops (`bulkCurate.ts`), which rewrite a whole list at once. */
export function withExcludedItems(cv: CanonicalCv, sectionId: string, ids: string[]): CanonicalCv {
  const rest: Record<string, string[]> = { ...(cv.display.excludedItems ?? {}) };
  if (ids.length === 0) delete rest[sectionId];
  else rest[sectionId] = ids;
  const excludedItems = Object.keys(rest).length > 0 ? rest : undefined;
  return { ...cv, display: { ...cv.display, excludedItems } };
}

/** Item ids excluded from the current view for a section (empty if none). */
export function viewExcludedIds(display: DisplayChoices, sectionId: string): Set<string> {
  return new Set(display.excludedItems?.[sectionId] ?? []);
}

/** True if `itemId` is shown (not excluded) in the current view. */
export function isItemShownInView(
  display: DisplayChoices,
  sectionId: string,
  itemId: string,
): boolean {
  return !(display.excludedItems?.[sectionId] ?? []).includes(itemId);
}

/**
 * Show or hide ONE item in the CURRENT view — a cosmetic per-view choice, NOT
 * "not mine". Hiding adds it to the section's exclusion list; showing removes it.
 * Immutable; empty lists are pruned so an untouched section leaves no trace.
 */
export function setItemInView(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  show: boolean,
): CanonicalCv {
  const existing = cv.display.excludedItems?.[sectionId] ?? [];
  const next = show
    ? existing.filter((id) => id !== itemId)
    : existing.includes(itemId)
      ? existing
      : [...existing, itemId];
  return withExcludedItems(cv, sectionId, next);
}

/** Show ALL of a section's items in the current view (clear its exclusions). */
export function clearViewExclusions(cv: CanonicalCv, sectionId: string): CanonicalCv {
  return withExcludedItems(cv, sectionId, []);
}

/**
 * Show ONLY `keepIds` in the current view (hide every other currently-visible
 * item in the section) — the "show just these" shortcut on top of the deny-list.
 * A later-synced item, absent from the section now, is NOT pre-hidden.
 */
export function showOnlyInView(cv: CanonicalCv, sectionId: string, keepIds: string[]): CanonicalCv {
  const section = cv.sections.find((s) => s.id === sectionId);
  if (!section) return cv;
  const keep = new Set(keepIds);
  const excluded = visibleItems(section)
    .map((it) => it.id)
    .filter((id) => !keep.has(id));
  return withExcludedItems(cv, sectionId, excluded);
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
      isDefaultSectionTitle(s.type, s.title) ? { ...s, title: sectionTitle(locale, s.type) } : s,
    ),
  };
}

/**
 * Update owner/header profile fields (name, headline, summary, photo, contact,
 * links, personal). Shallow-merges the top level; nested `contact`/`personal`
 * patches are merged with the existing sub-object so a partial update never
 * drops sibling fields. Immutable.
 */
export function updateOwner(cv: CanonicalCv, patch: Partial<CvOwner>): CanonicalCv {
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
function appendManualItem(cv: CanonicalCv, sectionType: CvSectionType, item: CvItem): CanonicalCv {
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
export function buildManualCsl(id: string, fields: ManualEntryFields): CslItem | null {
  const title = fields.title.trim();
  if (!title) return null;

  const csl: CslItem = {
    id,
    type: fields.type?.trim() || "article-journal",
    title,
  };
  const authors = parseAuthors(fields.authors);
  if (authors.length) csl.author = authors;

  const year = typeof fields.year === "string" ? parseInt(fields.year, 10) : fields.year;
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
 * Printed-name variants for a USER-ASSERTED self author on a manual entry, so
 * the highlighter can wrap the right substring in any citation style. citeproc
 * renders names in style-specific forms ("Chrétien, B.", "B. Chrétien"), and
 * the reliably-present token is the FAMILY name — so it is always included,
 * alongside the raw input and both name orders. Reuses the same name splitter
 * as the CSL build (handles CJK and "Family, Given").
 */
export function manualSelfNameVariants(rawName: string): string[] {
  const raw = rawName.trim();
  if (!raw) return [];
  const name = toCslName(raw);
  const variants = new Set<string>([raw]);
  if (typeof name.family === "string" && name.family) {
    variants.add(name.family);
    if (typeof name.given === "string" && name.given) {
      variants.add(`${name.family}, ${name.given}`);
      variants.add(`${name.given} ${name.family}`);
    }
  }
  return [...variants].filter((v) => v.length >= 2);
}

/** Options for {@link addStructuredEntry}. */
export interface StructuredEntryOptions {
  /**
   * The author name (as typed in the form) that IS the account holder. When set,
   * the entry is marked `authoredBySelf` with `matchBasis: "claimed"` — the same
   * user-asserted basis as the claim-by-DOI flow (NEVER an automatic name match;
   * the user ticked "this is my work" and chose which author they are) — and the
   * self-name highlight applies to it like any imported work.
   */
  selfAuthorName?: string;
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
  opts: StructuredEntryOptions = {},
): CanonicalCv {
  const csl = buildManualCsl(id, fields);
  if (!csl) return cv;

  const selfName = opts.selfAuthorName?.trim();
  const authoredBySelf = Boolean(selfName);
  const year = typeof fields.year === "string" ? parseInt(fields.year, 10) : fields.year;
  return appendManualItem(cv, sectionType, {
    id,
    source: "manual",
    sourceId: "manual",
    csl,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf,
    selfNameVariants: selfName ? manualSelfNameVariants(selfName) : [],
    meta: {
      year: typeof year === "number" && Number.isFinite(year) ? year : undefined,
      type: csl.type,
      doi: csl.DOI,
      matchBasis: authoredBySelf ? "claimed" : undefined,
    },
  });
}

/**
 * Append a DOI-claimed work (built by `buildClaimedItem` from OpenAlex data) to
 * the right section — Preprints if it's a preprint, else Publications — creating
 * the section if needed. The metadata is source-driven; only ownership is asserted.
 */
export function addClaimedWork(cv: CanonicalCv, item: CvItem, isPreprint: boolean): CanonicalCv {
  return appendManualItem(cv, isPreprint ? "preprints" : "publications", item);
}

/**
 * "Keep both" — dismiss a detected duplicate so the detector never re-flags this
 * pair (the decision must survive re-sync, unlike the recomputed verdict). It
 * (1) records the order-independent pair key in `display.dismissedDuplicates`
 * (keyed by stable DOI/PMID anchors so it survives id churn) and (2) clears the
 * item's advisory hint now so the badge disappears immediately. Pure + immutable;
 * a no-op when the item carries no duplicate hint. Locating the representative
 * spans sections (a duplicate group can cross Publications/Preprints/Datasets).
 */
export function dismissDuplicate(cv: CanonicalCv, sectionId: string, itemId: string): CanonicalCv {
  const section = cv.sections.find((s) => s.id === sectionId);
  const item = section?.items.find((it) => it.id === itemId);
  const dup = item?.meta.duplicateOf;
  if (!item || !dup) return cv;

  let rep: CvItem | undefined;
  for (const s of cv.sections) {
    const found = s.items.find((it) => it.id === dup.itemId);
    if (found) {
      rep = found;
      break;
    }
  }
  // The representative should always exist (same build), but stay defensive.
  /* v8 ignore next -- representative is always present in a freshly-built CV */
  if (!rep) return cv;

  const key = duplicatePairKey(item, rep);
  const existing = cv.display.dismissedDuplicates ?? [];
  const dismissedDuplicates = existing.includes(key) ? existing : [...existing, key];

  return {
    ...cv,
    display: { ...cv.display, dismissedDuplicates },
    sections: cv.sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            items: s.items.map((it) =>
              it.id === itemId ? { ...it, meta: clearedDuplicateHint(it) } : it,
            ),
          }
        : s,
    ),
  };
}

/** A copy of an item's `meta` with the duplicate hint removed (other review
 *  flags preserved; a bare "duplicate" flag cleared). */
function clearedDuplicateHint(it: CvItem): CvItem["meta"] {
  const { duplicateOf: _drop, ...rest } = it.meta;
  return {
    ...rest,
    reviewFlag: it.meta.reviewFlag === "duplicate" ? undefined : it.meta.reviewFlag,
  };
}

/**
 * Clear an item's advisory duplicate hint WITHOUT dismissing the pair — used when
 * the user keeps THIS entry and hides the OTHER one. The badge lives on this row
 * but the resolving action (hiding the partner) happens on a different row, so
 * this clears the badge optimistically. No dismissal key is recorded: the
 * detector already ignores the now-hidden partner, so the pair won't re-flag, and
 * "keep both" stays the only path that marks a pair as a non-duplicate (keeping
 * the research false-positive signal honest). No-op if there's no hint.
 */
export function clearDuplicateFlag(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
): CanonicalCv {
  const item = cv.sections.find((s) => s.id === sectionId)?.items.find((it) => it.id === itemId);
  if (!item || (item.meta.reviewFlag !== "duplicate" && item.meta.duplicateOf === undefined)) {
    return cv; // nothing to clear (preserve identity → no needless re-render)
  }
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) => (it.id === itemId ? { ...it, meta: clearedDuplicateHint(it) } : it)),
  }));
}

/**
 * "Keep all" for a duplicate GROUP of N≥2 members — dismiss EVERY pair among the
 * members (so the detector can never re-form the cluster) and clear all their
 * hints now. This is the only path that records the group as a non-duplicate
 * (the research false-positive signal); "keep only one" instead hides the rest,
 * which the detector already ignores, so it needs no dismissal. Pure + immutable;
 * a no-op for fewer than 2 resolvable ids. Keyed by stable DOI/PMID anchors so it
 * survives re-sync id churn, exactly like {@link dismissDuplicate}.
 */
export function dismissDuplicateGroup(cv: CanonicalCv, itemIds: readonly string[]): CanonicalCv {
  const ids = new Set(itemIds);
  const members: CvItem[] = [];
  for (const s of cv.sections) for (const it of s.items) if (ids.has(it.id)) members.push(it);
  if (members.length < 2) return cv;

  const keys = new Set(cv.display.dismissedDuplicates ?? []);
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      keys.add(duplicatePairKey(members[i]!, members[j]!));
    }
  }
  return {
    ...cv,
    display: { ...cv.display, dismissedDuplicates: [...keys] },
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) =>
        ids.has(it.id) && (it.meta.reviewFlag === "duplicate" || it.meta.duplicateOf !== undefined)
          ? { ...it, meta: clearedDuplicateHint(it) }
          : it,
      ),
    })),
  };
}

/**
 * "Keep hidden" on a review candidate (an ORCID-discovered `orcid-doi` work, or
 * a name+org-matched `name-matched` registry entry): the user has triaged it and
 * wants it OFF the CV without nagging — and WITHOUT recording a "not mine"
 * disambiguation claim (it may well be theirs; they just don't want it shown).
 * Records the item id in `display.dismissedReviewCandidates` so the review badge
 * and the CV-health checklist stop flagging it, and keeps the item hidden
 * (`included:false`). Pure + immutable. The decision survives re-sync (the id is
 * stable for both flavours). A no-op when the item is absent or already
 * dismissed (preserve identity → no needless re-render).
 */
export function dismissReviewCandidate(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
): CanonicalCv {
  const item = cv.sections.find((s) => s.id === sectionId)?.items.find((it) => it.id === itemId);
  if (!item) return cv;
  const existing = cv.display.dismissedReviewCandidates ?? [];
  if (existing.includes(itemId) && !item.included) return cv;
  const dismissedReviewCandidates = existing.includes(itemId) ? existing : [...existing, itemId];
  return {
    ...cv,
    display: { ...cv.display, dismissedReviewCandidates },
    sections: cv.sections.map((s) =>
      s.id === sectionId
        ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, included: false } : it)) }
        : s,
    ),
  };
}

/**
 * "Yes, it's mine" on a `likely-misattributed` work: the user has confirmed the
 * heuristic was wrong and the paper IS theirs. UNLIKE "Keep hidden", the work stays
 * SHOWN (`included` untouched) — we only record its id in
 * `display.dismissedReviewCandidates` so the misattribution badge + the CV-health
 * count stop flagging it. Pure + immutable; survives re-sync (the flag is recomputed
 * every build but the dismissal silences it). No-op if already dismissed.
 */
export function confirmMisattribution(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
): CanonicalCv {
  const item = cv.sections.find((s) => s.id === sectionId)?.items.find((it) => it.id === itemId);
  if (!item) return cv;
  const existing = cv.display.dismissedReviewCandidates ?? [];
  if (existing.includes(itemId)) return cv;
  return {
    ...cv,
    display: { ...cv.display, dismissedReviewCandidates: [...existing, itemId] },
  };
}

/**
 * Bulk "they're all mine": confirm EVERY visible, still-flagged
 * `likely-misattributed` work at once (the escape hatch for a high-namesake user
 * facing several flags). Records each id in `display.dismissedReviewCandidates`,
 * leaving the works shown. Pure + immutable; only ever the SAFE direction (never a
 * bulk hide/disown). No-op when nothing is outstanding.
 */
export function confirmAllMisattributed(cv: CanonicalCv): CanonicalCv {
  const existing = cv.display.dismissedReviewCandidates ?? [];
  const seen = new Set(existing);
  const add: string[] = [];
  for (const s of cv.sections) {
    for (const it of s.items) {
      if (it.meta.reviewFlag === "likely-misattributed" && !isHidden(it) && !seen.has(it.id)) {
        add.push(it.id);
        seen.add(it.id);
      }
    }
  }
  if (add.length === 0) return cv;
  return {
    ...cv,
    display: { ...cv.display, dismissedReviewCandidates: [...existing, ...add] },
  };
}

/**
 * Whether the CV already contains a work with the given OpenAlex id or DOI, so
 * the "add by DOI" flow can refuse a duplicate rather than list it twice.
 */
export function cvHasWork(cv: CanonicalCv, opts: { id?: string; doi?: string }): boolean {
  const doi = opts.doi?.toLowerCase();
  return cv.sections.some((s) =>
    s.items.some(
      (it) =>
        (opts.id !== undefined && it.id === opts.id) ||
        (doi !== undefined &&
          (it.csl?.DOI?.toLowerCase() === doi || it.meta.doi?.toLowerCase() === doi)),
    ),
  );
}

/**
 * Create an empty section of the given type (if it doesn't already exist), at
 * its canonical order with a localized title. The user then adds entries via
 * the add-entry input. Used by the editor's "Add a section" menu.
 */
export function addSection(cv: CanonicalCv, sectionType: CvSectionType): CanonicalCv {
  // A `statement` section can legitimately recur (the user titles each one), so
  // it is NOT deduplicated by type; every other type is single-instance.
  if (sectionType !== "statement" && cv.sections.some((s) => s.type === sectionType)) {
    return cv;
  }
  const isProse = isProseSectionType(sectionType);
  // Unique id: a recurring `statement` needs a distinct id per instance.
  const id =
    sectionType === "statement"
      ? `statement:${
          /* a short unique suffix; Date.now keeps it stable + deterministic-enough */
          cv.sections.filter((s) => s.type === "statement").length
        }:${cv.sections.length}`
      : sectionType;
  const newSection: CvSection = {
    id,
    type: sectionType,
    title: sectionTitle(cv.display.locale, sectionType),
    visible: true,
    order: DEFAULT_SECTION_ORDER[sectionType],
    items: [],
    // Prose sections carry a (initially empty) free-text body instead of items.
    ...(isProse ? { body: "" } : {}),
  };
  return { ...cv, sections: [...cv.sections, newSection] };
}

/**
 * Set a prose section's free-text `body` (the heading + running prose a
 * `PROSE_SECTION_TYPES` section renders instead of items). Bounded to the schema
 * cap. Pure + immutable; no-op for an unknown section id. Non-prose sections are
 * left untouched in practice (the editor only calls this for prose sections), but
 * the op itself simply writes `body` on whatever section id it's given.
 */
export function setSectionBody(cv: CanonicalCv, sectionId: string, body: string): CanonicalCv {
  const clamped = body.slice(0, PROSE_BODY_MAX);
  return mapSection(cv, sectionId, (s) => ({ ...s, body: clamped }));
}

/**
 * Set (or clear) a USER OVERRIDE of a SOURCE-DERIVED entry's display text — the
 * editable title on a Positions / Education line that came from ORCID/OpenAlex.
 * A meaningful value is stored in `displayTextOverride` (shown everywhere in
 * place of the source-built `displayText`, and carried across re-sync); a BLANK
 * value — OR text equal to the current source text — CLEARS the override, so the
 * line reverts to the live source value. Pure + immutable; a no-op for an unknown
 * section/item id. Manual entries instead edit `displayText` directly via
 * {@link updateItemText}.
 */
export function setItemTextOverride(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  text: string,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) => {
      if (it.id !== itemId) return it;
      const trimmed = text.trim();
      // Blank, or identical to the source line → no override (revert to source).
      const override =
        trimmed.length === 0 || trimmed === (it.displayText ?? "").trim() ? undefined : text;
      return { ...it, displayTextOverride: override };
    }),
  }));
}

/**
 * Set (or clear) the USER role/title for a source-derived Positions / Education
 * entry — the value typed into the editor's "Role / title" field. A meaningful
 * value is stored in `meta.roleTitleOverride` (shown in place of the source
 * `meta.roleTitle`, carried across re-sync); a BLANK value — OR text equal to the
 * current source role — CLEARS it, reverting to the source role. The line
 * `displayText` is re-derived in place from the item's structured `meta` so the
 * change shows everywhere immediately (and `build.ts` re-derives it identically on
 * the next re-sync). Pure + immutable; a no-op for an unknown section/item id, or
 * for an item that carries no institution (cannot be re-derived).
 */
export function setItemRoleTitle(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  role: string,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) => {
      if (it.id !== itemId) return it;
      const trimmed = role.trim();
      // Blank, or identical to the source role → no override (revert to source).
      // Otherwise store the RAW value (not the trimmed one) so a trailing space
      // isn't stripped on every keystroke — the user must be able to type the
      // space in "Group Leader". Edge whitespace is harmless and trimmed on render.
      const override =
        trimmed.length === 0 || trimmed === (it.meta.roleTitle ?? "").trim() ? undefined : role;
      const meta = { ...it.meta, roleTitleOverride: override };
      const next: CvItem = { ...it, meta };
      const line = rederiveEntryLine(next);
      return line === undefined ? next : { ...next, displayText: line };
    }),
  }));
}

/**
 * Set (or clear) the USER institution NAME for a source-derived positions/
 * education entry — the editor's "Institution" field. Stored in
 * `meta.institutionOverride` (wins over the source `meta.institution`, carried
 * across re-sync); a BLANK value, or one equal to the source name, CLEARS it
 * (revert to source). Editing it makes the text authoritative, so its ROR
 * auto-link/localized variant no longer applies. The line is re-derived in place.
 * Pure + immutable; a no-op for an unknown id or a non-re-derivable item.
 */
export function setItemInstitution(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  name: string,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) => {
      if (it.id !== itemId) return it;
      const trimmed = name.trim();
      const override =
        trimmed.length === 0 || trimmed === (it.meta.institution ?? "").trim() ? undefined : name;
      const meta = { ...it.meta, institutionOverride: override };
      const next: CvItem = { ...it, meta };
      const line = rederiveEntryLine(next);
      return line === undefined ? next : { ...next, displayText: line };
    }),
  }));
}

/**
 * Set (or clear) the USER department/sub-unit for a source-derived positions/
 * education entry — the editor's "Department" field. Stored in
 * `meta.departmentOverride` (wins over the source `meta.department`, carried across
 * re-sync); a BLANK value, or one equal to the source, CLEARS it (revert to
 * source). The raw value is stored (not trimmed) so a trailing space survives mid-
 * typing. The line is re-derived in place. Pure + immutable; a no-op for an unknown
 * id or a non-re-derivable item.
 */
export function setItemDepartment(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  name: string,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) => {
      if (it.id !== itemId) return it;
      const trimmed = name.trim();
      const override =
        trimmed.length === 0 || trimmed === (it.meta.department ?? "").trim() ? undefined : name;
      const meta = { ...it.meta, departmentOverride: override };
      const next: CvItem = { ...it, meta };
      const line = rederiveEntryLine(next);
      return line === undefined ? next : { ...next, displayText: line };
    }),
  }));
}

/**
 * Set (or clear) the USER date range for a source-derived positions/education
 * entry — the editor's start/end year + "Ongoing" controls. A `range` object is
 * stored in `meta.dateRangeOverride` (replacing the source dates; an absent
 * `endYear` means ongoing/present), carried across re-sync; passing `null`
 * CLEARS it (revert to the source dates). The line is re-derived in place. Pure +
 * immutable; a no-op for an unknown id or a non-re-derivable item.
 */
export function setItemDateRange(
  cv: CanonicalCv,
  sectionId: string,
  itemId: string,
  range: { startYear?: number; endYear?: number } | null,
): CanonicalCv {
  return mapSection(cv, sectionId, (s) => ({
    ...s,
    items: s.items.map((it) => {
      if (it.id !== itemId) return it;
      const override =
        range === null ? undefined : { startYear: range.startYear, endYear: range.endYear };
      const meta = { ...it.meta, dateRangeOverride: override };
      const next: CvItem = { ...it, meta };
      const line = rederiveEntryLine(next);
      return line === undefined ? next : { ...next, displayText: line };
    }),
  }));
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
    items: s.items.map((it) => (it.id === itemId ? { ...it, displayText } : it)),
  }));
}

/** Remove an item from its section (used for user-added manual entries). */
export function removeItem(cv: CanonicalCv, sectionId: string, itemId: string): CanonicalCv {
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
  // Fall back to a high order for any unrecognised type (e.g. a section type
  // removed in a future schema version that survives in a stored doc) so the
  // comparator can never return NaN — a NaN comparator makes the result of
  // Array.prototype.sort implementation-defined.
  const orderOf = (s: CvSection): number => DEFAULT_SECTION_ORDER[s.type] ?? 999;
  return [...cv.sections].sort((a, b) => orderOf(a) - orderOf(b));
}

/** Visible sections that should appear, in effective display order. */
export function visibleSections(cv: CanonicalCv): CvSection[] {
  return orderedSections(cv).filter((s) => s.visible);
}
