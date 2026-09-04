import {
  isHidden,
  isProseSectionType,
  itemDisplayText,
  itemEffectiveYear,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type OwnerMetrics,
} from "@/lib/canonical/schema";
import { stripInternalItemSignals } from "@/lib/cv/publicProjection";

/**
 * Frozen CV snapshots — "freeze & cite this version" (open-science roadmap C5).
 *
 * PURE helpers only: freezing a canonical document into the immutable copy a
 * snapshot stores, and diffing two frozen documents into a structured "what
 * changed" report. No DB, no IO — the persistence layer is `snapshotStore.ts`,
 * the HTML/Markdown renderers of the diff live in `render/diff.ts`.
 */

/** At most this many snapshots per CV; creation is refused at the cap and the
 *  owner deletes explicitly (a snapshot is a deliberate, citable act — not a
 *  rolling history, so no silent eviction). */
export const MAX_SNAPSHOTS_PER_CV = 20;

/** Longest snapshot label ("Tenure review 2026", "Grant application"). */
export const SNAPSHOT_LABEL_MAX = 80;

/** Item-label cap in the diff (a work title can run to hundreds of chars). */
const DIFF_LABEL_MAX = 140;

/**
 * Freeze a canonical CV into the copy a snapshot stores. A deep copy (via
 * JSON), with every OWNER-ONLY field the public projection strips removed —
 * so the frozen document holds nothing a snapshot page could later leak, and
 * nothing the owner wouldn't want kept beyond the live document's lifetime:
 *
 *  - `notes` (private scratchpad), `presets` (saved editor layouts) and
 *    `owner.personal` (rirekisho personal data) are dropped outright;
 *  - the per-item internal review signals are stripped via the SAME helper the
 *    public projection uses ({@link stripInternalItemSignals}) — the lists can't
 *    drift;
 *  - the internal curation-decision records (`display.dismissedDuplicates`,
 *    `dismissedReviewCandidates`) go too.
 *
 * KEPT on purpose: hidden / "not mine" items (with their `included` / `notMine`
 * flags) and `display.excludedItems` — a snapshot is frozen at the OWNER level
 * so a later diff can tell "hidden" from "removed", and the public snapshot page
 * runs the frozen copy through `projectCvForPublic` at serve time exactly like
 * the live page (hidden items dropped, contact fields gated by the frozen
 * `display.publicContact` flags, metrics gated by the frozen `showMetrics`).
 * Pure + immutable — never mutates the input.
 */
export function freezeCanonical(cv: CanonicalCv): CanonicalCv {
  const copy = JSON.parse(JSON.stringify(cv)) as CanonicalCv;
  return {
    ...copy,
    notes: undefined,
    presets: [],
    owner: { ...copy.owner, personal: undefined },
    sections: copy.sections.map((s) => ({
      ...s,
      items: s.items.map(stripInternalItemSignals),
    })),
    display: {
      ...copy.display,
      dismissedDuplicates: undefined,
      dismissedReviewCandidates: undefined,
    },
  };
}

/** A short, human-readable reference to one CV item in a diff. */
export interface DiffItemRef {
  id: string;
  /** Title / display text, trimmed to {@link DIFF_LABEL_MAX}; "" when unknown. */
  label: string;
  year?: number;
}

/** Per-section item-level changes (only sections with at least one change). */
export interface DiffSection {
  sectionId: string;
  sectionType: string;
  /** Title from the NEWER document (or the older one for a removed section). */
  title: string;
  added: DiffItemRef[];
  removed: DiffItemRef[];
  /** Present in both, visible before, hidden (or "not mine") now. */
  hidden: DiffItemRef[];
  /** Present in both, hidden before, visible now. */
  unhidden: DiffItemRef[];
}

/** A prose (narrative) section whose body text changed. */
export interface DiffNarrative {
  sectionId: string;
  title: string;
  wordsBefore: number;
  wordsAfter: number;
  /** wordsAfter − wordsBefore. */
  delta: number;
}

/** One author-level metric whose value changed. `from`/`to` are null when the
 *  metric was absent on that side. */
export interface DiffMetric {
  key: string;
  from: number | null;
  to: number | null;
}

/** Structured diff between two frozen CVs (older → newer). Deterministic:
 *  sections in the newer document's order (removed sections last), items sorted
 *  by label then id, keys sorted alphabetically. */
export interface SnapshotDiff {
  sections: DiffSection[];
  /** Sections present only in the newer document. */
  sectionsAdded: Array<{ sectionId: string; sectionType: string; title: string }>;
  /** Sections present only in the older document. */
  sectionsRemoved: Array<{ sectionId: string; sectionType: string; title: string }>;
  /** `display.*` keys whose value changed (names only, never values). */
  displayChanged: string[];
  /** `owner.*` keys whose value changed (names only, never values). */
  ownerChanged: string[];
  narrativeChanged: DiffNarrative[];
  metricsChanged: DiffMetric[];
  hasChanges: boolean;
}

/** Display keys the diff ignores: internal editor bookkeeping (not a CV
 *  change in any reader's sense) and the resolved custom-CSL XML blob (an
 *  implementation detail — a style change already shows as `cslStyle`). */
const IGNORED_DISPLAY_KEYS = new Set([
  "excludedItems",
  "dismissedDuplicates",
  "dismissedReviewCandidates",
  "customStyle",
]);

/** Owner keys reported elsewhere (metrics) or pure sync noise (per-year counts,
 *  the embedded photo blob, the auto-derived research-area summary). */
const IGNORED_OWNER_KEYS = new Set(["metrics", "countsByYear", "photo", "researchAreas"]);

function itemLabel(it: CvItem): string {
  const raw = (it.csl?.title ?? itemDisplayText(it) ?? "").replace(/\s+/g, " ").trim();
  return raw.length > DIFF_LABEL_MAX ? `${raw.slice(0, DIFF_LABEL_MAX - 1)}…` : raw;
}

function itemRef(it: CvItem): DiffItemRef {
  const year = itemEffectiveYear(it);
  return year === undefined
    ? { id: it.id, label: itemLabel(it) }
    : { id: it.id, label: itemLabel(it), year };
}

function sortRefs(refs: DiffItemRef[]): DiffItemRef[] {
  return [...refs].sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}

function wordCount(text: string | undefined): number {
  const t = (text ?? "").trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Stable JSON for value comparison (key order normalised, undefined dropped). */
function stable(v: unknown): string {
  if (v === undefined) return "";
  return JSON.stringify(v, (_k, val) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(
          Object.keys(val as object)
            .sort()
            .map((k) => [k, (val as Record<string, unknown>)[k]]),
        )
      : val,
  );
}

/** Keys (sorted) of `a ∪ b` whose stable serialisation differs, minus `ignore`. */
function changedKeys(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  ignore: ReadonlySet<string>,
): string[] {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...keys].filter((k) => !ignore.has(k) && stable(a[k]) !== stable(b[k])).sort();
}

/** The visible (not hidden / not "not mine") items of a section, as sorted refs. */
function visibleRefs(section: CvSection): DiffItemRef[] {
  return sortRefs(section.items.filter((it) => !isHidden(it)).map(itemRef));
}

function diffItems(
  older: CvSection,
  newer: CvSection,
): Omit<DiffSection, "sectionId" | "sectionType" | "title"> {
  const before = new Map(older.items.map((it) => [it.id, it]));
  const after = new Map(newer.items.map((it) => [it.id, it]));
  const added: DiffItemRef[] = [];
  const removed: DiffItemRef[] = [];
  const hidden: DiffItemRef[] = [];
  const unhidden: DiffItemRef[] = [];
  for (const it of newer.items) {
    const prev = before.get(it.id);
    if (!prev) {
      added.push(itemRef(it));
      continue;
    }
    const wasHidden = isHidden(prev);
    const nowHidden = isHidden(it);
    if (!wasHidden && nowHidden) hidden.push(itemRef(it));
    else if (wasHidden && !nowHidden) unhidden.push(itemRef(it));
  }
  for (const it of older.items) if (!after.has(it.id)) removed.push(itemRef(it));
  return {
    added: sortRefs(added),
    removed: sortRefs(removed),
    hidden: sortRefs(hidden),
    unhidden: sortRefs(unhidden),
  };
}

function metricsDiff(a: OwnerMetrics | undefined, b: OwnerMetrics | undefined): DiffMetric[] {
  const av = (a ?? {}) as Record<string, number | undefined>;
  const bv = (b ?? {}) as Record<string, number | undefined>;
  const keys = [...new Set([...Object.keys(av), ...Object.keys(bv)])].sort();
  const out: DiffMetric[] = [];
  for (const key of keys) {
    const from = av[key] ?? null;
    const to = bv[key] ?? null;
    if (from !== to) out.push({ key, from, to });
  }
  return out;
}

/**
 * Structured "what changed" between an OLDER and a NEWER frozen CV. Item-level:
 * added / removed (by item id) and hidden / unhidden (visibility flips of items
 * present in both), per section, each with a short label. Document-level: which
 * display + owner keys changed (names only — a public diff must not echo
 * values), narrative bodies with a word-count delta, and metric values.
 *
 * Works on whatever projection it is handed: the owner's diff runs on the
 * frozen documents; the PUBLIC diff route runs both sides through
 * `projectCvForPublic` first, so hidden items and unopted metrics never reach a
 * visitor (they are simply absent on both sides). Pure; deterministic ordering.
 */
export function diffSnapshots(older: CanonicalCv, newer: CanonicalCv): SnapshotDiff {
  const olderById = new Map(older.sections.map((s) => [s.id, s]));
  const newerById = new Map(newer.sections.map((s) => [s.id, s]));

  const sections: DiffSection[] = [];
  const narrativeChanged: DiffNarrative[] = [];
  const sectionsAdded: SnapshotDiff["sectionsAdded"] = [];
  const sectionsRemoved: SnapshotDiff["sectionsRemoved"] = [];

  for (const s of newer.sections) {
    const prev = olderById.get(s.id);
    if (!prev) {
      sectionsAdded.push({ sectionId: s.id, sectionType: s.type, title: s.title });
      // A brand-new section's visible items are "added" too — a reader wants to
      // see what it holds, not just that it exists.
      const items = visibleRefs(s);
      if (items.length) {
        sections.push({
          sectionId: s.id,
          sectionType: s.type,
          title: s.title,
          added: items,
          removed: [],
          hidden: [],
          unhidden: [],
        });
      }
      continue;
    }
    if (isProseSectionType(s.type)) {
      if ((prev.body ?? "") !== (s.body ?? "")) {
        const wordsBefore = wordCount(prev.body);
        const wordsAfter = wordCount(s.body);
        narrativeChanged.push({
          sectionId: s.id,
          title: s.title,
          wordsBefore,
          wordsAfter,
          delta: wordsAfter - wordsBefore,
        });
      }
      continue;
    }
    const items = diffItems(prev, s);
    if (
      items.added.length ||
      items.removed.length ||
      items.hidden.length ||
      items.unhidden.length
    ) {
      sections.push({ sectionId: s.id, sectionType: s.type, title: s.title, ...items });
    }
  }
  for (const s of older.sections) {
    if (!newerById.has(s.id)) {
      sectionsRemoved.push({ sectionId: s.id, sectionType: s.type, title: s.title });
      const items = visibleRefs(s);
      if (items.length) {
        sections.push({
          sectionId: s.id,
          sectionType: s.type,
          title: s.title,
          added: [],
          removed: items,
          hidden: [],
          unhidden: [],
        });
      }
    }
  }

  const displayChanged = changedKeys(
    older.display as unknown as Record<string, unknown>,
    newer.display as unknown as Record<string, unknown>,
    IGNORED_DISPLAY_KEYS,
  );
  const ownerChanged = changedKeys(
    older.owner as unknown as Record<string, unknown>,
    newer.owner as unknown as Record<string, unknown>,
    IGNORED_OWNER_KEYS,
  );
  const metricsChanged = metricsDiff(older.owner.metrics, newer.owner.metrics);

  const hasChanges =
    sections.length > 0 ||
    sectionsAdded.length > 0 ||
    sectionsRemoved.length > 0 ||
    displayChanged.length > 0 ||
    ownerChanged.length > 0 ||
    narrativeChanged.length > 0 ||
    metricsChanged.length > 0;

  return {
    sections,
    sectionsAdded,
    sectionsRemoved,
    displayChanged,
    ownerChanged,
    narrativeChanged,
    metricsChanged,
    hasChanges,
  };
}
