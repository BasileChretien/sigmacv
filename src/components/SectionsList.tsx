"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Reorder, useDragControls, type DragControls } from "motion/react";
import {
  PROSE_BODY_MAX,
  isProseSectionType,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";
import { isHidden } from "@/lib/canonical/schema";
import {
  addManualEntry,
  addStructuredEntry,
  type ManualEntryFields,
  addSection,
  clearDuplicateFlag,
  clearViewExclusions,
  confirmMisattribution,
  dismissDuplicateGroup,
  dismissReviewCandidate,
  isItemShownInView,
  moveItem,
  moveItemTo,
  moveSection,
  orderedSections,
  reorderSections,
  removeItem,
  removeSection,
  renameSection,
  setSectionPageBreak,
  setItemDateRange,
  setItemDepartment,
  setItemFeatured,
  setItemInView,
  setItemIncluded,
  setItemInstitution,
  setItemNotMine,
  setItemRoleTitle,
  setItemTextOverride,
  viewExcludedIds,
  setSectionBody,
  setSectionVisible,
  updateItemText,
} from "@/lib/canonical/curate";
import {
  filterSectionItems,
  notMineEligibleIds,
  setItemsInView,
  setItemsIncluded,
  setItemsNotMine,
  type BulkFilter,
} from "@/lib/canonical/bulkCurate";
import { SECTION_TYPES, type CvSectionType } from "@/lib/canonical/schema";
import { similarVisibleForOrcidCandidates } from "@/lib/canonical/duplicates";
import { ui } from "@/lib/i18n/ui";
import { editorUi } from "@/lib/i18n/editorUi";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import { dupStrings } from "@/lib/i18n/duplicates";
import { narrativeEvidence } from "@/lib/canonical/narrativeEvidence";
import { narrativeGuidance, narrativeEvidenceLabel } from "@/lib/i18n/narrativeGuidance";
import { sectionTitle, t, type Locale } from "@/lib/i18n";
import ClaimByDoi from "./ClaimByDoi";
import type { CvHealthCategory } from "./CvHealthPanel";
import ItemRow from "./ItemRow";

/**
 * Section types offered in the "Add a section" menu — EVERY type, so any
 * section the user removed can be re-added. Source-driven types (publications,
 * preprints, peer-review) re-add as an empty section that the next re-sync
 * repopulates from the open record.
 */
const ADDABLE_SECTIONS: readonly CvSectionType[] = SECTION_TYPES;

/**
 * One reorderable section. The card itself follows the pointer while dragging
 * (Motion `Reorder.Item`, so the held section glides and the rest spring out of
 * the way); `dragListener` is off so a drag only begins from the ⠿ handle — the
 * title input and buttons inside stay clickable. The handle gets `controls` via
 * the render-prop child and calls `controls.start(e)` on pointer-down.
 */
function SectionCard({
  value,
  children,
}: {
  value: string;
  children: (controls: DragControls) => ReactNode;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={value}
      as="div"
      className="section-card"
      dragListener={false}
      dragControls={controls}
      style={{ position: "relative" }}
      whileDrag={{
        scale: 1.025,
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
        zIndex: 30,
      }}
      transition={{ type: "spring", stiffness: 550, damping: 38, mass: 0.6 }}
    >
      {children(controls)}
    </Reorder.Item>
  );
}

/**
 * Pending (visible, unresolved) duplicates in DOCUMENT order — across every
 * section, top to bottom — each tagged with a monotonic `pos` so "the next one"
 * is well-defined for the review flow. Order matches what the editor renders
 * (`orderedSections` + within-section `order`).
 */
function orderedPendingDups(
  cv: CanonicalCv,
): Array<{ id: string; sectionId: string; pos: number }> {
  const out: Array<{ id: string; sectionId: string; pos: number }> = [];
  let pos = 0;
  for (const s of orderedSections(cv)) {
    for (const it of [...s.items].sort((a, b) => a.order - b.order)) {
      const here = pos++;
      if (it.meta.reviewFlag === "duplicate" && !isHidden(it)) {
        out.push({ id: it.id, sectionId: s.id, pos: here });
      }
    }
  }
  return out;
}

/** A jump target inside the editor: which section to expand + which row to focus. */
type HealthTarget = { sectionId: string; itemId: string };

/**
 * The first outstanding item of each CV-health category, in document order, so
 * the "Needs your attention" checklist can jump straight to one. The predicates
 * mirror `computeCvHealth` (cv/health.ts) — keep the two in sync.
 */
function firstHealthTargets(cv: CanonicalCv): Record<CvHealthCategory, HealthTarget | undefined> {
  const dismissed = new Set(cv.display.dismissedReviewCandidates ?? []);
  const out: Record<CvHealthCategory, HealthTarget | undefined> = {
    review: undefined,
    duplicates: undefined,
    conflicts: undefined,
    misattributed: undefined,
    retracted: undefined,
  };
  for (const s of orderedSections(cv)) {
    for (const it of [...s.items].sort((a, b) => a.order - b.order)) {
      const flag = it.meta.reviewFlag;
      const here: HealthTarget = { sectionId: s.id, itemId: it.id };
      if (
        !out.review &&
        (flag === "name-matched" || flag === "orcid-doi") &&
        !it.included &&
        !it.notMine &&
        !dismissed.has(it.id)
      ) {
        out.review = here;
      }
      if (!out.duplicates && flag === "duplicate" && !isHidden(it)) out.duplicates = here;
      if (!out.conflicts && flag === "orcid-conflict" && !isHidden(it)) out.conflicts = here;
      if (
        !out.misattributed &&
        flag === "likely-misattributed" &&
        !isHidden(it) &&
        !dismissed.has(it.id)
      ) {
        out.misattributed = here;
      }
      if (
        !out.retracted &&
        it.meta.retracted === true &&
        !isHidden(it) &&
        !cv.display.hideRetracted
      ) {
        out.retracted = here;
      }
    }
  }
  return out;
}

/** True when the user has asked the OS to minimise motion (smooth-scroll → instant). */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Imperative surface the editor uses to drive cross-region "jump to item". */
export interface SectionsListHandle {
  /** Expand + scroll to the first outstanding item of a CV-health category. */
  resolveHealth: (category: CvHealthCategory) => void;
  /** Expand + scroll to a SPECIFIC item by id — used by the sync banner's
   *  "to review" jump. No-op if the id isn't in the current CV. */
  jumpToItem: (itemId: string) => void;
}

interface SectionsListProps {
  cv: CanonicalCv;
  /** Interface language (independent of the CV's own rendered language). */
  locale: Locale;
  onChange: (next: CanonicalCv) => void;
  /** A DOI-claimed work was added server-side; replace the CV with the saved one. */
  onClaimAdded?: (cv: CanonicalCv) => void;
}

const SectionsList = forwardRef<SectionsListHandle, SectionsListProps>(function SectionsList(
  { cv, locale, onChange, onClaimAdded = () => {} },
  ref,
) {
  const sections = orderedSections(cv);
  const u = ui(locale);
  const eu = editorUi(locale);
  const wu = workspaceUi(locale);
  const ds = dupStrings(locale);

  // Index every item by id with its full data + section (the editor owns the
  // whole CV; ItemRow only knows its own item). Used to resolve a duplicate's
  // group members side-by-side and to act on them across sections.
  type Located = { item: CvItem; sectionId: string; sectionTitle: string };
  const itemIndex = useMemo(() => {
    const m = new Map<string, Located>();
    for (const s of cv.sections) {
      for (const it of s.items) m.set(it.id, { item: it, sectionId: s.id, sectionTitle: s.title });
    }
    return m;
  }, [cv.sections]);

  // Resolve each duplicate GROUP (keyed by `duplicateOf.groupId`, the
  // representative's id) → all its located members (the representative + every
  // flagged member). A cluster can be 2, 3 or more items across sections.
  const dupGroups = useMemo(() => {
    const groups = new Map<string, Located[]>();
    const push = (gid: string, entry: Located | undefined) => {
      if (!entry) return;
      const list = groups.get(gid) ?? [];
      if (!list.some((e) => e.item.id === entry.item.id)) list.push(entry);
      groups.set(gid, list);
    };
    for (const loc of itemIndex.values()) {
      const gid = loc.item.meta.duplicateOf?.groupId;
      if (!gid) continue;
      push(gid, loc); // the flagged member
      push(gid, itemIndex.get(gid)); // the representative (carries no flag itself)
    }
    return groups;
  }, [itemIndex]);

  // ── Duplicate REVIEW flow ──────────────────────────────────────────────────
  // The id of the duplicate currently being reviewed (its compare panel is open).
  // Lifted here so the section banner can jump to a duplicate and so resolving one
  // can auto-advance to the next. `null` = nothing focused.
  const [reviewDupId, setReviewDupId] = useState<string | null>(null);
  // Live refs to each duplicate row's <li>, for scroll-into-view on focus.
  const dupRowRefs = useRef(new Map<string, HTMLLIElement>());

  // Scroll the focused duplicate into view (section auto-expanded first, so its
  // row is mounted by the time this effect runs).
  useEffect(() => {
    if (!reviewDupId) return;
    dupRowRefs.current.get(reviewDupId)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center",
    });
  }, [reviewDupId]);

  // ── CV-health checklist jump ────────────────────────────────────────────────
  // When the user clicks a "Needs your attention" row, scroll its first item
  // into view and briefly flash it. The `n` nonce makes a repeat click on the
  // same row re-run the effect; the flash auto-clears after a moment.
  const [focusItem, setFocusItem] = useState<{ id: string; n: number } | null>(null);
  useEffect(() => {
    if (!focusItem) return;
    dupRowRefs.current.get(focusItem.id)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "center",
    });
    const handle = setTimeout(() => setFocusItem(null), 1600);
    return () => clearTimeout(handle);
  }, [focusItem]);

  // After resolving the current duplicate, focus the NEXT pending one (document
  // order, wrapping), expanding its section; clear focus when none remain.
  const advanceAfter = (next: CanonicalCv, resolvedId: string) => {
    const curPos = orderedPendingDups(cv).find((d) => d.id === resolvedId)?.pos ?? -1;
    const remaining = orderedPendingDups(next);
    const target = remaining.find((d) => d.pos > curPos) ?? remaining[0] ?? null;
    if (target) {
      setExpanded((prev) => new Set(prev).add(target.sectionId));
      setReviewDupId(target.id);
    } else {
      setReviewDupId(null);
    }
  };

  // ── CV-health checklist ─────────────────────────────────────────────────────
  // Review candidates the user kept hidden (resolved, no longer flagged), the
  // first item of each outstanding category (for the checklist jump), and the
  // "you may already have this" matches for pending ORCID-discovered candidates.
  const dismissedReview = useMemo(
    () => new Set(cv.display.dismissedReviewCandidates ?? []),
    [cv.display.dismissedReviewCandidates],
  );
  const healthTargets = useMemo(() => firstHealthTargets(cv), [cv]);
  const orcidSimilar = useMemo(() => similarVisibleForOrcidCandidates(cv), [cv]);

  // Sections are COLLAPSED by default (compact list that's easy to scan +
  // reorder); the chevron expands one. Only ids in this set are expanded.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Jump to the first outstanding item of a health category: expand its section
   *  and scroll it into view (duplicates also open their compare panel). */
  const resolveHealth = (category: CvHealthCategory) => {
    const target = healthTargets[category];
    if (!target) return;
    setExpanded((prev) => new Set(prev).add(target.sectionId));
    if (category === "duplicates") {
      setReviewDupId(target.itemId);
    } else {
      setFocusItem((prev) => ({ id: target.itemId, n: (prev?.n ?? 0) + 1 }));
    }
  };

  /** Expand the section holding `itemId` and scroll+flash that row (the sync
   *  banner's "to review" jump targets a specific item, not a health category). */
  const jumpToItem = (itemId: string) => {
    const sectionId = itemIndex.get(itemId)?.sectionId;
    if (!sectionId) return;
    setExpanded((prev) => new Set(prev).add(sectionId));
    setFocusItem((prev) => ({ id: itemId, n: (prev?.n ?? 0) + 1 }));
  };

  // Expose the cross-region jumps to the editor (the persistent CV-health panel
  // and the sync banner live outside this component and drive them). Re-created
  // each render so they always close over the current `healthTargets`/index.
  useImperativeHandle(ref, () => ({ resolveHealth, jumpToItem }));

  const hasSection = (type: string): boolean => cv.sections.some((s) => s.type === type);

  // Which section types the "Add a section" menu offers. A type is addable when
  // it isn't already present — EXCEPT `statement`, a free-titled prose block the
  // user can add as many times as they like (so it's always offered).
  const isAddable = (type: CvSectionType): boolean => type === "statement" || !hasSection(type);

  function newId(type: string): string {
    const rand =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const prefix = type === "positions" ? "position" : type;
    return `${prefix}:manual:${rand}`;
  }

  // Sections where a free-text "Add an entry" makes sense. Without this, a
  // source-less section the user adds from the menu (talks/teaching/supervision/
  // skills) would render with NO input at all — silently un-fillable.
  const MANUAL_SECTIONS = new Set([
    "positions",
    "education",
    "awards",
    "service",
    "datasets",
    "editorial",
    "grants",
    "talks",
    "teaching",
    "supervision",
    "skills",
    "other",
  ]);

  // Citation-type sections where a STRUCTURED entry (title/authors/venue/…) is
  // useful — it renders through citeproc with the chosen style, like an import.
  const STRUCTURED_SECTIONS = new Set(["publications", "preprints", "conference", "other"]);

  // Draft text for the per-section "add entry" inputs, keyed by section type.
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function addEntry(type: CanonicalCv["sections"][number]["type"]) {
    const text = (drafts[type] ?? "").trim();
    if (!text) return;
    onChange(addManualEntry(cv, type, text, newId(type)));
    setDrafts((d) => ({ ...d, [type]: "" }));
  }

  // Structured (citation-style) manual entries: a small form whose fields build
  // a CSL item, so the entry renders through citeproc like an imported work.
  const [structDrafts, setStructDrafts] = useState<Record<string, ManualEntryFields>>({});
  // "This is my work" per section type: checkbox + (for multi-author entries)
  // which typed author is the account holder. USER-asserted ownership — the
  // entry gets matchBasis "claimed" and the self-name highlight, like a
  // claim-by-DOI; never an automatic name match.
  const [structSelf, setStructSelf] = useState<Record<string, boolean>>({});
  const [structSelfName, setStructSelfName] = useState<Record<string, string>>({});
  const setStructField = (type: string, key: keyof ManualEntryFields, value: string) =>
    setStructDrafts((d) => ({
      ...d,
      [type]: { ...(d[type] ?? { title: "" }), [key]: value },
    }));
  /** Author names as typed in the form (the same split the CSL build uses). */
  const structAuthors = (type: string): string[] =>
    (structDrafts[type]?.authors ?? "")
      .split(/[;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  function addStructured(type: CanonicalCv["sections"][number]["type"]) {
    const fields = structDrafts[type];
    if (!fields?.title?.trim()) return;
    let selfAuthorName: string | undefined;
    if (structSelf[type]) {
      const authors = structAuthors(type);
      const chosen = structSelfName[type];
      // The picked author if still present, else the first typed author, else
      // the account holder's display name (no authors typed at all).
      selfAuthorName =
        chosen && authors.includes(chosen) ? chosen : (authors[0] ?? cv.owner.displayName);
    }
    onChange(addStructuredEntry(cv, type, fields, newId(type), { selfAuthorName }));
    setStructDrafts((d) => ({ ...d, [type]: { title: "" } }));
    setStructSelf((s) => ({ ...s, [type]: false }));
    setStructSelfName((s) => ({ ...s, [type]: "" }));
  }

  // Languages: a language + a proficiency (CEFR level / native / a test+score),
  // composed into "French — C1 (CEFR)" and stored as a manual entry.
  const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const [langDraft, setLangDraft] = useState({
    lang: "",
    level: "C2 (CEFR)",
    other: "",
  });
  function addLanguage() {
    const lang = langDraft.lang.trim();
    if (!lang) return;
    const level = langDraft.level === "__other__" ? langDraft.other.trim() : langDraft.level;
    const text = level ? `${lang} — ${level}` : lang;
    onChange(addManualEntry(cv, "languages", text, newId("languages")));
    setLangDraft({ lang: "", level: "C2 (CEFR)", other: "" });
  }

  // References: a referee + affiliation/email/phone, composed into
  // "Name, Affiliation · email · phone" and stored as a manual entry.
  const [refDraft, setRefDraft] = useState({
    name: "",
    affiliation: "",
    email: "",
    phone: "",
  });
  function addReference() {
    const name = refDraft.name.trim();
    if (!name) return;
    const head = refDraft.affiliation.trim() ? `${name}, ${refDraft.affiliation.trim()}` : name;
    const contact = [refDraft.email.trim(), refDraft.phone.trim()].filter(Boolean).join(" · ");
    const text = contact ? `${head} · ${contact}` : head;
    onChange(addManualEntry(cv, "references", text, newId("references")));
    setRefDraft({ name: "", affiliation: "", email: "", phone: "" });
  }

  // Drag-and-drop reorder state (mouse only; the ↑/↓ buttons remain the
  // accessible fallback). Items reorder within their section via native DnD;
  // sections reorder via Motion `Reorder` (the held card tracks the pointer and
  // the rest spring out of the way) — that drag state lives inside Motion.
  const [dragItem, setDragItem] = useState<{ sectionId: string; itemId: string } | null>(null);

  // ── Bulk curation ──────────────────────────────────────────────────────────
  // One section at a time can be in bulk-selection mode: rows grow checkboxes,
  // a filter narrows the list, and the action bar applies Hide/Show/"not mine"/
  // view-exclude to the whole selection through the pure bulk ops. Drag and
  // per-row reorder are disabled while filtering (moving within a filtered
  // subset would be ambiguous).
  const [bulkSectionId, setBulkSectionId] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkText, setBulkText] = useState("");
  const [bulkYearFrom, setBulkYearFrom] = useState("");
  const [bulkYearTo, setBulkYearTo] = useState("");
  const [bulkFlagged, setBulkFlagged] = useState(false);
  const bulkFilter: BulkFilter = {
    text: bulkText.trim() || undefined,
    yearFrom: /^\d{4}$/.test(bulkYearFrom) ? Number(bulkYearFrom) : undefined,
    yearTo: /^\d{4}$/.test(bulkYearTo) ? Number(bulkYearTo) : undefined,
    flaggedOnly: bulkFlagged || undefined,
  };
  const enterBulk = (sectionId: string) => {
    setBulkSectionId(sectionId);
    setBulkSelected(new Set());
    setBulkText("");
    setBulkYearFrom("");
    setBulkYearTo("");
    setBulkFlagged(false);
  };
  const exitBulk = () => {
    setBulkSectionId(null);
    setBulkSelected(new Set());
  };
  /** Apply a bulk op to the current selection, then clear the selection. */
  const applyToSelection = (fn: (doc: CanonicalCv, ids: string[]) => CanonicalCv) => {
    const ids = [...bulkSelected];
    if (ids.length === 0) return;
    onChange(fn(cv, ids));
    setBulkSelected(new Set());
  };

  return (
    <>
      <p className="editor-hint">{t(locale, "editorHints")}</p>

      <Reorder.Group
        axis="y"
        as="div"
        className="sections-list"
        values={sections.map((s) => s.id)}
        onReorder={(ids) => onChange(reorderSections(cv, ids))}
      >
        {sections.map((section, si) => {
          const items = [...section.items].sort((a, b) => a.order - b.order);
          const shownCount = items.filter((i) => !isHidden(i)).length;
          // Bulk-selection mode for THIS section: filter narrows the rendered
          // list; reorder affordances are disabled (moving within a filtered
          // subset would be ambiguous).
          const bulkActive = bulkSectionId === section.id;
          const canBulk = !isProseSectionType(section.type) && items.length >= 5;
          const listItems = bulkActive ? filterSectionItems(section, bulkFilter) : items;
          const bulkEligibleNotMine = bulkActive
            ? notMineEligibleIds(section, [...bulkSelected])
            : [];
          // Pending (visible, unresolved) duplicate hints in this section.
          const dupCount = items.filter(
            (i) => i.meta.reviewFlag === "duplicate" && !isHidden(i),
          ).length;
          const isExpanded = expanded.has(section.id);
          return (
            <SectionCard key={section.id} value={section.id}>
              {(controls) => (
                <>
                  {/* The "add a publication by DOI" panel sits directly above the
                Publications section and moves with it when sections reorder. */}
                  {section.type === "publications" ? (
                    <ClaimByDoi locale={locale} onAdded={onClaimAdded} />
                  ) : null}
                  <div
                    className={`section-block${isExpanded ? " is-expanded" : " is-collapsed"}${
                      section.visible ? "" : " is-section-hidden"
                    }`}
                  >
                    <div className="section-head">
                      <span
                        className="drag-handle"
                        onPointerDown={(e) => controls.start(e)}
                        title={u.dragSection}
                        aria-hidden="true"
                      >
                        ⠿
                      </span>
                      <button
                        type="button"
                        className="section-toggle"
                        onClick={() => toggleExpanded(section.id)}
                        aria-expanded={isExpanded}
                        aria-label={t(locale, isExpanded ? "collapseSection" : "expandSection")}
                        title={t(locale, isExpanded ? "collapseSection" : "expandSection")}
                      >
                        {isExpanded ? "▾" : "▸"}
                      </button>
                      <input
                        className="section-title"
                        value={section.title}
                        onChange={(e) => onChange(renameSection(cv, section.id, e.target.value))}
                        aria-label={u.sectionTitleAria}
                      />
                      {isProseSectionType(section.type) ? null : (
                        <span className="section-count muted">
                          {shownCount}/{items.length} {u.shownSuffix}
                        </span>
                      )}
                      {dupCount > 0 ? (
                        <button
                          type="button"
                          className="section-dup-flag"
                          title={ds.summary.replace("{n}", String(dupCount))}
                          aria-label={ds.summary.replace("{n}", String(dupCount))}
                          onClick={() => {
                            // Open the section and jump straight to its first
                            // pending duplicate (panel open + scrolled into view).
                            setExpanded((prev) => new Set(prev).add(section.id));
                            const first = orderedPendingDups(cv).find(
                              (d) => d.sectionId === section.id,
                            );
                            if (first) setReviewDupId(first.id);
                          }}
                        >
                          ⚠ {dupCount}
                        </button>
                      ) : null}
                      <label className="field-inline">
                        <input
                          type="checkbox"
                          checked={section.visible}
                          onChange={(e) =>
                            onChange(setSectionVisible(cv, section.id, e.target.checked))
                          }
                        />
                        <span>{t(locale, "show")}</span>
                      </label>
                      <label className="field-inline" title={t(locale, "pageBreakBeforeTitle")}>
                        <input
                          type="checkbox"
                          checked={(cv.display.pageBreakBefore ?? []).includes(section.id)}
                          onChange={(e) =>
                            onChange(setSectionPageBreak(cv, section.id, e.target.checked))
                          }
                        />
                        <span>{t(locale, "pageBreakBefore")}</span>
                      </label>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onChange(moveSection(cv, section.id, "up"))}
                        disabled={si === 0}
                        aria-label={u.moveSectionUp}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => onChange(moveSection(cv, section.id, "down"))}
                        disabled={si === sections.length - 1}
                        aria-label={u.moveSectionDown}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => onChange(removeSection(cv, section.id))}
                        aria-label={t(locale, "removeSection")}
                        title={t(locale, "removeSectionTitle")}
                      >
                        ×
                      </button>
                    </div>

                    {isExpanded && isProseSectionType(section.type) ? (
                      <label className="field prose-body-field">
                        <span className="muted">{eu.proseBody}</span>
                        {/* R4RI/Royal-Society narrative modules get a writing prompt
                            (what belongs in this module) — a narrative CV is hard to
                            start from a blank box. Other prose types (statement) have
                            none. Editor-only; never rendered on the CV. */}
                        {narrativeGuidance(locale, section.type) ? (
                          <span className="field-hint narrative-guidance muted">
                            {narrativeGuidance(locale, section.type)}
                          </span>
                        ) : null}
                        {/* Evidence to draw on: counts of the owner's relevant outputs
                            for this module (publications/datasets for "knowledge", etc.),
                            so concrete contributions are at hand. Editor-only. */}
                        {(() => {
                          const ev = narrativeEvidence(cv, section.type);
                          if (ev.length === 0) return null;
                          return (
                            <span className="field-hint narrative-evidence muted">
                              {narrativeEvidenceLabel(locale)}{" "}
                              {ev
                                .map((e) => `${e.count} ${sectionTitle(locale, e.type)}`)
                                .join(" · ")}
                            </span>
                          );
                        })()}
                        <textarea
                          className="prose-body"
                          rows={6}
                          value={section.body ?? ""}
                          maxLength={PROSE_BODY_MAX}
                          aria-label={`${section.title} — ${eu.proseBody}`}
                          onChange={(e) =>
                            onChange(
                              setSectionBody(
                                cv,
                                section.id,
                                e.target.value.slice(0, PROSE_BODY_MAX),
                              ),
                            )
                          }
                        />
                        <span className="field-hint muted">
                          {eu.proseBodyHint} ·{" "}
                          {eu.proseCharsLeft.replace(
                            "{n}",
                            String(PROSE_BODY_MAX - (section.body ?? "").length),
                          )}
                        </span>
                      </label>
                    ) : isExpanded ? (
                      <>
                        {viewExcludedIds(cv.display, section.id).size > 0 ? (
                          <p className="view-selection-note muted">
                            {t(locale, "viewCount")
                              .replace(
                                "{n}",
                                String(
                                  items.filter(
                                    (it) =>
                                      it.included &&
                                      !it.notMine &&
                                      isItemShownInView(cv.display, section.id, it.id),
                                  ).length,
                                ),
                              )
                              .replace(
                                "{m}",
                                String(items.filter((it) => it.included && !it.notMine).length),
                              )}
                            {" · "}
                            <button
                              type="button"
                              className="linklike"
                              onClick={() => onChange(clearViewExclusions(cv, section.id))}
                            >
                              {t(locale, "viewShowAll")}
                            </button>
                          </p>
                        ) : null}
                        {canBulk ? (
                          <div className="bulk-bar">
                            {!bulkActive ? (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => enterBulk(section.id)}
                              >
                                {wu.bulkSelect}
                              </button>
                            ) : (
                              <>
                                <div className="bulk-filters">
                                  <input
                                    type="search"
                                    className="bulk-filter-text"
                                    value={bulkText}
                                    placeholder={wu.bulkFilterText}
                                    aria-label={wu.bulkFilterText}
                                    onChange={(e) => setBulkText(e.target.value)}
                                  />
                                  <input
                                    type="number"
                                    className="bulk-year"
                                    value={bulkYearFrom}
                                    placeholder={wu.bulkYearFrom}
                                    aria-label={wu.bulkYearFrom}
                                    onChange={(e) => setBulkYearFrom(e.target.value)}
                                  />
                                  <input
                                    type="number"
                                    className="bulk-year"
                                    value={bulkYearTo}
                                    placeholder={wu.bulkYearTo}
                                    aria-label={wu.bulkYearTo}
                                    onChange={(e) => setBulkYearTo(e.target.value)}
                                  />
                                  <label className="field-inline">
                                    <input
                                      type="checkbox"
                                      checked={bulkFlagged}
                                      onChange={(e) => setBulkFlagged(e.target.checked)}
                                    />
                                    <span>{wu.bulkFlaggedOnly}</span>
                                  </label>
                                </div>
                                <div className="bulk-actions">
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    onClick={() =>
                                      setBulkSelected(new Set(listItems.map((i) => i.id)))
                                    }
                                  >
                                    {wu.bulkSelectAll.replace("{n}", String(listItems.length))}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    disabled={bulkSelected.size === 0}
                                    onClick={() => setBulkSelected(new Set())}
                                  >
                                    {wu.bulkClear}
                                  </button>
                                  <span className="muted bulk-count">
                                    {wu.bulkSelected.replace("{n}", String(bulkSelected.size))}
                                  </span>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    disabled={bulkSelected.size === 0}
                                    onClick={() =>
                                      applyToSelection((doc, ids) =>
                                        setItemsIncluded(doc, section.id, ids, false),
                                      )
                                    }
                                  >
                                    {wu.bulkHide}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    disabled={bulkSelected.size === 0}
                                    onClick={() =>
                                      applyToSelection((doc, ids) =>
                                        setItemsIncluded(doc, section.id, ids, true),
                                      )
                                    }
                                  >
                                    {wu.bulkShow}
                                  </button>
                                  {bulkEligibleNotMine.length > 0 ? (
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      onClick={() =>
                                        applyToSelection((doc) =>
                                          setItemsNotMine(
                                            doc,
                                            section.id,
                                            bulkEligibleNotMine,
                                            true,
                                            {
                                              now: new Date().toISOString(),
                                            },
                                          ),
                                        )
                                      }
                                    >
                                      {wu.bulkNotMine}
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    disabled={bulkSelected.size === 0}
                                    onClick={() =>
                                      applyToSelection((doc, ids) =>
                                        setItemsInView(doc, section.id, ids, false),
                                      )
                                    }
                                  >
                                    {wu.bulkExcludeView}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm bulk-done"
                                    onClick={exitBulk}
                                  >
                                    {wu.bulkDone}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : null}
                        {items.length === 0 ? (
                          <p className="muted empty-note">{t(locale, "noItems")}</p>
                        ) : bulkActive && listItems.length === 0 ? (
                          <p className="muted empty-note">{wu.bulkNoMatches}</p>
                        ) : (
                          <ul className="cv-item-list">
                            {listItems.map((item, ii) => (
                              <ItemRow
                                key={item.id}
                                item={item}
                                locale={locale}
                                sectionType={section.type}
                                isFirst={bulkActive || ii === 0}
                                isLast={bulkActive || ii === listItems.length - 1}
                                selectable={bulkActive}
                                selected={bulkSelected.has(item.id)}
                                onSelectedChange={(sel) =>
                                  setBulkSelected((prev) => {
                                    const next = new Set(prev);
                                    if (sel) next.add(item.id);
                                    else next.delete(item.id);
                                    return next;
                                  })
                                }
                                onToggleIncluded={() =>
                                  onChange(setItemIncluded(cv, section.id, item.id, !item.included))
                                }
                                onToggleNotMine={() =>
                                  onChange(
                                    setItemNotMine(cv, section.id, item.id, !item.notMine, {
                                      now: new Date().toISOString(),
                                    }),
                                  )
                                }
                                onToggleFeatured={() =>
                                  onChange(setItemFeatured(cv, section.id, item.id, !item.featured))
                                }
                                shownInView={isItemShownInView(cv.display, section.id, item.id)}
                                onToggleInView={() =>
                                  onChange(
                                    setItemInView(
                                      cv,
                                      section.id,
                                      item.id,
                                      !isItemShownInView(cv.display, section.id, item.id),
                                    ),
                                  )
                                }
                                onSetNotMineReason={(reason) =>
                                  onChange(
                                    setItemNotMine(cv, section.id, item.id, true, {
                                      reason,
                                      now: new Date().toISOString(),
                                    }),
                                  )
                                }
                                duplicateGroup={
                                  item.meta.duplicateOf
                                    ? dupGroups.get(item.meta.duplicateOf.groupId)?.map((m) => ({
                                        item: m.item,
                                        sectionTitle: m.sectionTitle,
                                      }))
                                    : undefined
                                }
                                dupOpen={reviewDupId === item.id}
                                onDupToggle={() =>
                                  setReviewDupId((cur) => (cur === item.id ? null : item.id))
                                }
                                rowRef={(el) => {
                                  const m = dupRowRefs.current;
                                  if (el) m.set(item.id, el);
                                  else m.delete(item.id);
                                }}
                                reviewDismissed={dismissedReview.has(item.id)}
                                similarTitle={orcidSimilar.get(item.id)}
                                onDismissReview={() =>
                                  onChange(dismissReviewCandidate(cv, section.id, item.id))
                                }
                                onConfirmMine={() =>
                                  onChange(confirmMisattribution(cv, section.id, item.id))
                                }
                                flash={focusItem?.id === item.id}
                                onKeepOnly={(keepId) => {
                                  const members = item.meta.duplicateOf
                                    ? (dupGroups.get(item.meta.duplicateOf.groupId) ?? [])
                                    : [];
                                  // Hide every OTHER member; clear the kept member's
                                  // badge so it resolves immediately. No dismissal:
                                  // the detector ignores the now-hidden members, so
                                  // the cluster won't re-form.
                                  let next = cv;
                                  for (const m of members) {
                                    if (m.item.id !== keepId) {
                                      next = setItemIncluded(next, m.sectionId, m.item.id, false);
                                    }
                                  }
                                  const keep = members.find((m) => m.item.id === keepId);
                                  if (keep) {
                                    next = clearDuplicateFlag(next, keep.sectionId, keep.item.id);
                                  }
                                  onChange(next);
                                  advanceAfter(next, item.id);
                                }}
                                onKeepAll={() => {
                                  const members = item.meta.duplicateOf
                                    ? (dupGroups.get(item.meta.duplicateOf.groupId) ?? [])
                                    : [];
                                  const next = dismissDuplicateGroup(
                                    cv,
                                    members.map((m) => m.item.id),
                                  );
                                  onChange(next);
                                  advanceAfter(next, item.id);
                                }}
                                onMoveUp={() => onChange(moveItem(cv, section.id, item.id, "up"))}
                                onMoveDown={() =>
                                  onChange(moveItem(cv, section.id, item.id, "down"))
                                }
                                onDragStart={
                                  bulkActive
                                    ? undefined
                                    : () => setDragItem({ sectionId: section.id, itemId: item.id })
                                }
                                onDropOver={
                                  bulkActive
                                    ? undefined
                                    : () => {
                                        if (dragItem && dragItem.sectionId === section.id) {
                                          onChange(moveItemTo(cv, section.id, dragItem.itemId, ii));
                                        }
                                        setDragItem(null);
                                      }
                                }
                                onUpdateText={(text) =>
                                  onChange(updateItemText(cv, section.id, item.id, text))
                                }
                                onSetTextOverride={(text) =>
                                  onChange(setItemTextOverride(cv, section.id, item.id, text))
                                }
                                onSetRole={(role) =>
                                  onChange(setItemRoleTitle(cv, section.id, item.id, role))
                                }
                                onSetDepartment={(name) =>
                                  onChange(setItemDepartment(cv, section.id, item.id, name))
                                }
                                onSetInstitution={(name) =>
                                  onChange(setItemInstitution(cv, section.id, item.id, name))
                                }
                                onSetDateRange={(range) =>
                                  onChange(setItemDateRange(cv, section.id, item.id, range))
                                }
                                onRemove={() => onChange(removeItem(cv, section.id, item.id))}
                              />
                            ))}
                          </ul>
                        )}

                        {MANUAL_SECTIONS.has(section.type) ? (
                          <div className="add-entry-row">
                            <input
                              type="text"
                              value={drafts[section.type] ?? ""}
                              placeholder={
                                section.type === "grants"
                                  ? u.grantsPlaceholder
                                  : t(locale, "addEntryPlaceholder")
                              }
                              onChange={(e) =>
                                setDrafts((d) => ({ ...d, [section.type]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addEntry(section.type);
                                }
                              }}
                              aria-label={u.addEntryAria}
                            />
                            <button
                              type="button"
                              className="btn"
                              onClick={() => addEntry(section.type)}
                              disabled={!(drafts[section.type] ?? "").trim()}
                            >
                              {t(locale, "add")}
                            </button>
                          </div>
                        ) : null}

                        {STRUCTURED_SECTIONS.has(section.type) ? (
                          <details className="structured-entry">
                            <summary>{eu.structuredEntry}</summary>
                            <div className="structured-fields">
                              <label className="field">
                                <span>{eu.feTitle}</span>
                                <input
                                  type="text"
                                  value={structDrafts[section.type]?.title ?? ""}
                                  onChange={(e) =>
                                    setStructField(section.type, "title", e.target.value)
                                  }
                                />
                              </label>
                              <label className="field">
                                <span>{eu.feAuthors}</span>
                                <textarea
                                  rows={2}
                                  value={structDrafts[section.type]?.authors ?? ""}
                                  placeholder={eu.feAuthorsHint}
                                  onChange={(e) =>
                                    setStructField(section.type, "authors", e.target.value)
                                  }
                                />
                                <span className="field-hint muted">{eu.feAuthorsHint}</span>
                              </label>
                              <div className="structured-row">
                                <label className="field">
                                  <span>{eu.feVenue}</span>
                                  <input
                                    type="text"
                                    value={structDrafts[section.type]?.venue ?? ""}
                                    onChange={(e) =>
                                      setStructField(section.type, "venue", e.target.value)
                                    }
                                  />
                                </label>
                                <label className="field structured-year">
                                  <span>{eu.feYear}</span>
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    value={structDrafts[section.type]?.year ?? ""}
                                    onChange={(e) =>
                                      setStructField(section.type, "year", e.target.value)
                                    }
                                  />
                                </label>
                              </div>
                              <label className="field">
                                <span>{eu.feDoi}</span>
                                <input
                                  type="text"
                                  value={structDrafts[section.type]?.doi ?? ""}
                                  onChange={(e) =>
                                    setStructField(section.type, "doi", e.target.value)
                                  }
                                />
                              </label>
                              {/* User-ASSERTED ownership (matchBasis "claimed"), so
                                  the entry self-highlights like an imported work —
                                  never an automatic name match. */}
                              <label className="field-inline">
                                <input
                                  type="checkbox"
                                  checked={structSelf[section.type] ?? false}
                                  onChange={(e) =>
                                    setStructSelf((s) => ({
                                      ...s,
                                      [section.type]: e.target.checked,
                                    }))
                                  }
                                />
                                <span>{eu.feSelfWork}</span>
                              </label>
                              {structSelf[section.type] &&
                              structAuthors(section.type).length > 1 ? (
                                <label className="field">
                                  <span>{eu.claimWhichAuthor}</span>
                                  <select
                                    value={
                                      structSelfName[section.type] &&
                                      structAuthors(section.type).includes(
                                        structSelfName[section.type]!,
                                      )
                                        ? structSelfName[section.type]
                                        : structAuthors(section.type)[0]
                                    }
                                    onChange={(e) =>
                                      setStructSelfName((s) => ({
                                        ...s,
                                        [section.type]: e.target.value,
                                      }))
                                    }
                                  >
                                    {structAuthors(section.type).map((a) => (
                                      <option key={a} value={a}>
                                        {a}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : null}
                              <button
                                type="button"
                                className="btn"
                                onClick={() => addStructured(section.type)}
                                disabled={!structDrafts[section.type]?.title?.trim()}
                              >
                                {eu.feAdd}
                              </button>
                            </div>
                          </details>
                        ) : null}

                        {section.type === "languages" ? (
                          <div className="add-entry-row lang-row">
                            <input
                              type="text"
                              className="lang-name"
                              value={langDraft.lang}
                              placeholder={eu.langLabel}
                              aria-label={eu.langLabel}
                              onChange={(e) =>
                                setLangDraft((d) => ({ ...d, lang: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addLanguage();
                                }
                              }}
                            />
                            <select
                              value={langDraft.level}
                              aria-label={eu.langLevel}
                              onChange={(e) =>
                                setLangDraft((d) => ({ ...d, level: e.target.value }))
                              }
                            >
                              {CEFR_LEVELS.map((c) => (
                                <option key={c} value={`${c} (CEFR)`}>{`${c} (CEFR)`}</option>
                              ))}
                              <option value={eu.langNative}>{eu.langNative}</option>
                              <option value="__other__">{eu.langOther}</option>
                            </select>
                            {langDraft.level === "__other__" ? (
                              <input
                                type="text"
                                value={langDraft.other}
                                placeholder="TOEFL iBT 110"
                                aria-label={eu.langOther}
                                onChange={(e) =>
                                  setLangDraft((d) => ({ ...d, other: e.target.value }))
                                }
                              />
                            ) : null}
                            <button
                              type="button"
                              className="btn"
                              onClick={addLanguage}
                              disabled={!langDraft.lang.trim()}
                            >
                              {eu.feAdd}
                            </button>
                          </div>
                        ) : null}

                        {section.type === "references" ? (
                          <div className="structured-fields reference-fields">
                            <div className="structured-row">
                              <label className="field">
                                <span>{eu.refName}</span>
                                <input
                                  type="text"
                                  value={refDraft.name}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, name: e.target.value }))
                                  }
                                />
                              </label>
                              <label className="field">
                                <span>{eu.refAffiliation}</span>
                                <input
                                  type="text"
                                  value={refDraft.affiliation}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, affiliation: e.target.value }))
                                  }
                                />
                              </label>
                            </div>
                            <div className="structured-row">
                              <label className="field">
                                <span>{eu.refEmail}</span>
                                <input
                                  type="email"
                                  value={refDraft.email}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, email: e.target.value }))
                                  }
                                />
                              </label>
                              <label className="field">
                                <span>{eu.refPhone}</span>
                                <input
                                  type="tel"
                                  value={refDraft.phone}
                                  onChange={(e) =>
                                    setRefDraft((d) => ({ ...d, phone: e.target.value }))
                                  }
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              className="btn"
                              onClick={addReference}
                              disabled={!refDraft.name.trim()}
                            >
                              {eu.feAdd}
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </SectionCard>
          );
        })}
      </Reorder.Group>

      {ADDABLE_SECTIONS.some(isAddable) ? (
        <div className="add-section-row">
          <span className="muted add-section-label">{t(locale, "addSection")}:</span>
          {ADDABLE_SECTIONS.filter(isAddable).map((tp) => (
            <button
              key={tp}
              type="button"
              className="btn btn-sm"
              onClick={() => {
                onChange(addSection(cv, tp));
                // A single-instance type's id equals its type, so we can pre-
                // expand it; a recurring `statement` gets a generated id, so we
                // leave it collapsed (it appears at the bottom of the list).
                if (tp !== "statement") {
                  setExpanded((prev) => new Set(prev).add(tp));
                }
              }}
            >
              + {sectionTitle(locale, tp)}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
});

export default SectionsList;
