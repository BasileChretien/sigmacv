"use client";

import { useState } from "react";
import {
  displayInstitution,
  isHidden,
  itemDateRange,
  itemDepartment,
  itemDisplayText,
  itemInstitution,
  itemRoleTitle,
  NOT_MINE_REASONS,
  type CvItem,
  type CvSectionType,
  type NotMineReason,
} from "@/lib/canonical/schema";
import { reasonLabel, t, type Locale } from "@/lib/i18n";
import { stripInlineMarkup } from "@/lib/text/markup";
import { ui } from "@/lib/i18n/ui";
import { dupReasonText, dupStrings } from "@/lib/i18n/duplicates";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/** Parse a year-field value to an integer, or undefined when blank/non-numeric. */
function parseYear(v: string): number | undefined {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

/** Proper-noun data-source names (not translated); "manual" is localized below. */
const SOURCE_NAMES: Record<string, string> = {
  openalex: "OpenAlex",
  orcid: "ORCID",
  oep: "Open Editors Plus",
  datacite: "DataCite",
  openaire: "OpenAIRE",
  dblp: "DBLP",
  crossref: "Crossref",
  ukri: "UKRI",
  nih: "NIH",
  nsf: "NSF",
  clinicaltrials: "ClinicalTrials.gov",
  ctis: "EU CTIS",
  ictrp: "WHO ICTRP",
  epo: "EPO",
  derived: "derived",
};

/**
 * A compact factual summary of ONE entry, shown for both sides of the
 * duplicate-comparison panel so the user can see the full picture (title,
 * authors, year, venue, source, peer-review status, citations, DOI) and decide
 * which to keep. Read-only; works for citation and non-citation items alike.
 */
function DupFacts({ item, locale }: { item: CvItem; locale: Locale }) {
  const ds = dupStrings(locale);
  const u = ui(locale);
  // Flatten any kept inline tags (<i>/<sub>/…) — these read the raw CSL title,
  // which only citeproc renders; here a tag would show as literal text.
  const title = stripInlineMarkup(item.csl?.title ?? itemDisplayText(item) ?? u.itemUntitled);
  const authors = (item.csl?.author ?? [])
    .map((a) =>
      typeof a.family === "string" ? a.family : typeof a.literal === "string" ? a.literal : "",
    )
    .filter(Boolean);
  const authorLine = authors.length
    ? authors.slice(0, 3).join(", ") + (authors.length > 3 ? " et al." : "")
    : "";
  const venue =
    typeof item.csl?.["container-title"] === "string" ? item.csl["container-title"] : "";
  const sourceLabel =
    item.source === "manual"
      ? t(locale, "sourceManual")
      : (SOURCE_NAMES[item.source] ?? item.source);
  const doi = item.csl?.DOI ?? item.meta.doi;
  // Only build a doi.org link from a well-formed DOI — defence-in-depth so a
  // malformed/untrusted value can never become a non-DOI href.
  const doiLink = doi && /^10\.\d{4,9}\/\S+$/.test(doi) ? `https://doi.org/${doi}` : undefined;
  const facts: string[] = [];
  if (item.meta.year !== undefined) facts.push(String(item.meta.year));
  if (venue) facts.push(venue);
  facts.push(sourceLabel);
  if (item.meta.peerReviewed === true) facts.push(ds.peerReviewedTag);
  else if (item.meta.peerReviewed === false) facts.push(ds.notPeerReviewedTag);
  if (typeof item.meta.citedByCount === "number") {
    facts.push(`${item.meta.citedByCount} ${ds.citesTag}`);
  }
  return (
    <div className="cv-dup-facts">
      <div className="cv-dup-facts-title">{title}</div>
      {authorLine ? <div className="cv-dup-facts-authors muted">{authorLine}</div> : null}
      <div className="cv-dup-facts-meta muted">{facts.join(" · ")}</div>
      {doiLink ? (
        <a className="cv-dup-facts-doi" href={doiLink} target="_blank" rel="noopener noreferrer">
          doi.org/{doi}
        </a>
      ) : doi ? (
        <span className="cv-dup-facts-doi muted">{doi}</span>
      ) : null}
    </div>
  );
}

interface ItemRowProps {
  item: CvItem;
  locale: Locale;
  /**
   * The type of the section this row sits in. Used to decide whether "not mine"
   * is offered for Positions entries (which carry no third-party identifier on
   * the item itself, so the section is what distinguishes a Positions ORCID
   * employment from, say, an Education one). Optional — back-compat for callers
   * that don't pass it; "not mine" then falls back to the source-based rule.
   */
  sectionType?: CvSectionType;
  isFirst: boolean;
  isLast: boolean;
  onToggleIncluded: () => void;
  onToggleNotMine: () => void;
  /** Pin / unpin this publication as a "selected / featured" work (citation rows only). */
  onToggleFeatured?: () => void;
  /** Whether this item is shown in the CURRENT view/preset (per-view selection). */
  shownInView?: boolean;
  /** Toggle this item in/out of the current view only (not a global hide). */
  onToggleInView?: () => void;
  /** Set/clear the structured reason for a "not mine" assertion. */
  onSetNotMineReason?: (reason: NotMineReason | undefined) => void;
  /** Every member of this item's duplicate GROUP (≥2, including this row's item),
   *  with full data + localized section name — resolved by the editor and shown
   *  side-by-side so the user can compare them all and choose which to keep. */
  duplicateGroup?: ReadonlyArray<{ item: CvItem; sectionTitle: string }>;
  /** "Keep this one" on a group member → keep it, hide the rest of the group. */
  onKeepOnly?: (itemId: string) => void;
  /** "Keep all" — dismiss the whole group so it isn't re-flagged on re-sync. */
  onKeepAll?: () => void;
  /** Controlled open-state of the compare panel — the editor drives this so it
   *  can focus a duplicate (banner jump) and auto-advance to the next one.
   *  When omitted, the badge toggles the panel locally (uncontrolled). */
  dupOpen?: boolean;
  /** Badge click handler when `dupOpen` is controlled. */
  onDupToggle?: () => void;
  /** Ref to this row's <li>, so the editor can scroll it into view during review. */
  rowRef?: (el: HTMLLIElement | null) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** Drag-and-drop reorder: this row started being dragged. */
  onDragStart?: () => void;
  /** Drag-and-drop reorder: a dragged row was dropped onto this one. */
  onDropOver?: () => void;
  /** Edit a manual entry's text (only passed for source === "manual"). */
  onUpdateText?: (text: string) => void;
  /**
   * Set/clear the user override of a SOURCE-DERIVED entry's text — the editable
   * title on a Positions/Education line from ORCID/OpenAlex. Passing "" reverts
   * to the live source text. Only acted on for non-citation positions/education
   * rows (the editor passes it for every row; the gate lives here).
   */
  onSetTextOverride?: (text: string) => void;
  /**
   * Set/clear the user's structured role on a SOURCE-DERIVED Positions/Education
   * entry — the editor's "Role / title" field. Passing "" reverts to the source
   * role. The editor passes it for every row; the gate (positions/education) lives
   * here.
   */
  onSetRole?: (role: string) => void;
  /** Set/clear the department override on a source-derived positions/education
   *  entry — the "Edit details" disclosure. Passing "" reverts to source. */
  onSetDepartment?: (name: string) => void;
  /** Set/clear the institution-name override on a source-derived positions/
   *  education entry — the "Edit details" disclosure. Passing "" reverts to source. */
  onSetInstitution?: (name: string) => void;
  /** Set/replace the date-range override (an omitted `endYear` = ongoing), or
   *  clear it with `null` (revert to the source dates). */
  onSetDateRange?: (range: { startYear?: number; endYear?: number } | null) => void;
  /** Delete a manual entry (only passed for source === "manual"). */
  onRemove?: () => void;
  /** Bulk-selection mode: render a leading checkbox instead of drag affordances. */
  selectable?: boolean;
  /** Whether this row is in the current bulk selection. */
  selected?: boolean;
  /** Toggle this row's membership in the bulk selection. */
  onSelectedChange?: (selected: boolean) => void;
  /** True when this review candidate was triaged with "Keep hidden" — its review
   *  badge + the "Keep hidden" action are suppressed (the decision is recorded). */
  reviewDismissed?: boolean;
  /** For a pending ORCID-discovered candidate: the display title of a work
   *  already shown on the CV that looks like the same one — surfaced as an
   *  advisory "you may already have this" note. */
  similarTitle?: string;
  /** "Keep hidden" on a pending review candidate (orcid-doi / name-matched):
   *  keep it off the CV and stop flagging it for review, with no "not mine" claim. */
  onDismissReview?: () => void;
  /** "Yes, it's mine" on a likely-misattributed work: confirm it's the user's, keep
   *  it shown, and stop flagging it (records the id; no "not mine" claim). */
  onConfirmMine?: () => void;
  /** Briefly highlight this row — set when the CV-health checklist jumps the
   *  user here, so the just-scrolled-to item stands out. */
  flash?: boolean;
}

export default function ItemRow({
  item,
  locale,
  sectionType,
  isFirst,
  isLast,
  onToggleIncluded,
  onToggleNotMine,
  onToggleFeatured,
  shownInView = true,
  onToggleInView,
  onSetNotMineReason,
  duplicateGroup,
  onKeepOnly,
  onKeepAll,
  dupOpen,
  onDupToggle,
  rowRef,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDropOver,
  onUpdateText,
  onSetTextOverride,
  onSetRole,
  onSetDepartment,
  onSetInstitution,
  onSetDateRange,
  onRemove,
  selectable = false,
  selected = false,
  onSelectedChange,
  reviewDismissed = false,
  similarTitle,
  onDismissReview,
  onConfirmMine,
  flash = false,
}: ItemRowProps) {
  const u = ui(locale);
  const wu = workspaceUi(locale);
  const ds = dupStrings(locale);
  // The compare panel is open when the editor focuses this duplicate (controlled
  // via `dupOpen`), or when the user clicks the badge (uncontrolled fallback).
  const [localDupOpen, setLocalDupOpen] = useState(false);
  const isDupOpen = dupOpen ?? localDupOpen;
  const toggleDup = () => {
    if (dupOpen !== undefined) onDupToggle?.();
    else setLocalDupOpen((v) => !v);
  };
  const dup = item.meta.duplicateOf;
  // Only nag about a VISIBLE duplicate the user hasn't resolved yet.
  const showDupBadge = item.meta.reviewFlag === "duplicate" && !!dup && !isHidden(item);
  // A still-pending review candidate the user can Show / mark "not mine" / keep
  // hidden: an ORCID-discovered work or a name+org-matched registry entry that
  // is hidden, not asserted "not mine", and not already dismissed ("Keep hidden").
  const isPendingReviewCandidate =
    (item.meta.reviewFlag === "orcid-doi" || item.meta.reviewFlag === "name-matched") &&
    !item.included &&
    !item.notMine &&
    !reviewDismissed;
  const dupBadge = showDupBadge ? (
    <button
      type="button"
      className="cv-review-badge is-duplicate"
      onClick={toggleDup}
      aria-expanded={isDupOpen}
      title={ds.badgeHint}
    >
      {ds.badge}
    </button>
  ) : null;
  const isCitation = Boolean(item.csl);
  const isManual = item.source === "manual";
  // A still-flagged likely-misattributed work the user can confirm ("Yes, it's
  // mine"), disclaim ("not mine") or hide — shown, not asserted not-mine, not yet
  // dismissed. Its tooltip names exactly which signals fired (blame-free, factual).
  const isMisattributed =
    item.meta.reviewFlag === "likely-misattributed" && !item.notMine && !reviewDismissed;
  const misattributionWhy = (() => {
    const clauseKey = {
      "no-coauthor-overlap": "misWhyCoauthor",
      "different-field": "misWhyField",
      "affiliation-novel": "misWhyAffiliation",
      "pre-career": "misWhyYear",
    } as const;
    const clauses = (item.meta.misattribution?.signals ?? []).map((s) => t(locale, clauseKey[s]));
    return clauses.length
      ? `${t(locale, "misWhyPrefix")} ${clauses.join("; ")}.`
      : t(locale, "reviewHintMisattributed");
  })();
  // "Not mine" is a disambiguation correction for an item a THIRD PARTY
  // attributed to the account holder by IDENTIFIER match: bibliographic works
  // (citations, from OpenAlex), DataCite + OpenAIRE datasets/software, DBLP
  // conference papers (ORCID→PID matched), and Open Editors Plus editorial roles.
  // The NAME+org-matched registries (UKRI/NIH/NSF grants, clinical trials) are
  // review candidates curated via Hide/Show — there is no identifier to
  // contradict, so they never expose a "not mine" disambiguation claim.
  //
  // Positions are a special case: BOTH the OpenAlex-inferred affiliations (a
  // third party attributed an institution to the account holder by author id —
  // often noisy) AND the self-asserted ORCID employments expose "not mine", so a
  // wrong institution can be corrected uniformly. Only the section distinguishes
  // a Positions ORCID employment from an Education one (the item carries no
  // section context), hence the `sectionType` check. Manual entries stay
  // Delete-only everywhere — a self-typed row has no source attribution to
  // contradict, and it already has an explicit Delete action.
  const canMarkNotMine =
    isCitation ||
    item.source === "oep" ||
    item.source === "datacite" ||
    item.source === "openaire" ||
    item.source === "dblp" ||
    (sectionType === "positions" && !isManual);
  // Source-derived Positions / Education lines (built from ORCID/OpenAlex) are
  // free-text the user may refine: an editable title backed by `displayTextOverride`
  // (the source value keeps refreshing underneath and is restored by clearing the
  // field). Citation rows are excluded (they render only through citeproc); manual
  // rows use the `onUpdateText` path below.
  const canEditText =
    !isCitation && !isManual && (sectionType === "positions" || sectionType === "education");
  // Flatten any kept inline tags (<i>/<sub>/…) — these read the raw CSL title,
  // which only citeproc renders; here a tag would show as literal text.
  const title = stripInlineMarkup(item.csl?.title ?? itemDisplayText(item) ?? u.itemUntitled);
  // Institution name (ROR-localized) shown as read-only context beside the
  // editable role, so "Add your title…" has something to attach to.
  const institution = displayInstitution(item, locale);
  // "Edit details" date controls: the effective range + whether it's ongoing.
  const { startYear: dateStart, endYear: dateEnd } = itemDateRange(item);
  // "Ongoing" (open end) means a START year with no end. An entry with NO dates at
  // all is NOT ongoing, so its empty form shows an editable end field instead of a
  // disabled, pre-checked "ongoing" one — the common case when ADDING dates to a
  // degree that ORCID listed without them.
  const ongoing = dateStart !== undefined && dateEnd === undefined;
  // Whether the entry already has structured dates baked into meta (a current
  // build, or a carried-over override). Legacy items predate this.
  const hasStructuredDates =
    item.meta.startYear !== undefined ||
    item.meta.endYear !== undefined ||
    item.meta.dateRangeOverride !== undefined;
  // Dates are editable — and can be ADDED when the source supplied none — whenever
  // the line is re-derivable from structured meta, i.e. the entry has an effective
  // institution (every ORCID/OpenAlex position & education entry does). ORCID
  // degrees frequently carry no dates; without this they'd dead-end on the re-sync
  // note below with no way to add a range. Only a legacy entry with no structured
  // institution (whose line can't be re-derived) still needs a re-sync first.
  const datesEditable = Boolean(itemInstitution(item)) || hasStructuredDates;
  const year = item.meta.year ?? "—";
  const venue =
    typeof item.csl?.["container-title"] === "string" ? item.csl["container-title"] : "";

  // Where this entry's data came from (hover to see). "+ Crossref" when its
  // bibliographic gaps were filled by Crossref.
  const sourceName = isManual
    ? t(locale, "sourceManual")
    : (SOURCE_NAMES[item.source] ?? item.source);
  const sourceText = item.meta.enriched ? `${sourceName} + Crossref` : sourceName;
  const sourceBadge = (
    <span className="cv-source-badge" title={`${t(locale, "source")}: ${sourceText}`}>
      {sourceText}
    </span>
  );

  const rowClass = [
    "cv-item-row",
    isHidden(item) ? "is-excluded" : "",
    item.notMine ? "is-not-mine" : "",
    // Shown on the CV but omitted from the CURRENT view/preset (cosmetic).
    !isHidden(item) && onToggleInView && !shownInView ? "is-view-hidden" : "",
    // The duplicate currently being reviewed (panel open) — highlighted so the
    // banner-jump / auto-advance lands the eye on the right row.
    showDupBadge && isDupOpen ? "is-dup-active" : "",
    // Briefly highlighted after a CV-health checklist jump.
    flash ? "is-flash" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
      ref={rowRef}
      className={rowClass}
      onDragOver={onDropOver ? (e) => e.preventDefault() : undefined}
      onDrop={
        onDropOver
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              onDropOver();
            }
          : undefined
      }
    >
      {selectable ? (
        <input
          type="checkbox"
          className="bulk-check"
          checked={selected}
          onChange={(e) => onSelectedChange?.(e.target.checked)}
          aria-label={`${wu.bulkSelectRow}: ${title}`}
        />
      ) : null}
      {onDragStart ? (
        <span
          className="drag-handle"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            onDragStart();
          }}
          title={u.dragItem}
          aria-hidden="true"
        >
          ⠿
        </span>
      ) : null}
      <div className="cv-item-body">
        {isManual && onUpdateText ? (
          <input
            className="cv-item-edit"
            value={item.displayText ?? ""}
            onChange={(e) => onUpdateText(e.target.value)}
            placeholder={u.manualPlaceholder}
            aria-label={u.entryTextAria}
          />
        ) : canEditText && onSetRole && item.displayTextOverride === undefined ? (
          // Source-derived Positions/Education: a dedicated, fillable "Role / title"
          // field (the institution + dates come from ORCID/ROR and show as context
          // + in the preview). An empty field invites the missing role; the revert
          // restores the source role. A legacy whole-line override (below) takes
          // over the row until it's cleared.
          <>
            <div className="cv-item-edit-wrap">
              <input
                className="cv-item-edit cv-item-role"
                value={itemRoleTitle(item) ?? ""}
                onChange={(e) => onSetRole(e.target.value)}
                placeholder={u.rolePlaceholder}
                aria-label={u.roleAria}
              />
              {institution ? (
                <span className="cv-item-edit-context" title={institution}>
                  · {institution}
                </span>
              ) : null}
              {item.meta.roleTitleOverride !== undefined ? (
                <button
                  type="button"
                  className="icon-btn cv-item-revert"
                  onClick={() => onSetRole("")}
                  title={u.revertToSourceHint}
                  aria-label={u.revertToSource}
                >
                  ↺
                </button>
              ) : null}
            </div>
            {onSetInstitution && onSetDateRange ? (
              <details className="cv-item-details">
                <summary>{u.editDetails}</summary>
                <div className="cv-item-details-body">
                  {onSetDepartment ? (
                    <div className="cv-item-edit-wrap">
                      <input
                        className="cv-item-edit"
                        value={itemDepartment(item) ?? ""}
                        onChange={(e) => onSetDepartment(e.target.value)}
                        placeholder={u.departmentAria}
                        aria-label={u.departmentAria}
                      />
                      {item.meta.departmentOverride !== undefined ? (
                        <button
                          type="button"
                          className="icon-btn cv-item-revert"
                          onClick={() => onSetDepartment("")}
                          title={u.revertToSourceHint}
                          aria-label={u.revertToSource}
                        >
                          ↺
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="cv-item-edit-wrap">
                    <input
                      className="cv-item-edit"
                      value={itemInstitution(item) ?? ""}
                      onChange={(e) => onSetInstitution(e.target.value)}
                      placeholder={u.institutionAria}
                      aria-label={u.institutionAria}
                    />
                    {item.meta.institutionOverride !== undefined ? (
                      <button
                        type="button"
                        className="icon-btn cv-item-revert"
                        onClick={() => onSetInstitution("")}
                        title={u.revertToSourceHint}
                        aria-label={u.revertToSource}
                      >
                        ↺
                      </button>
                    ) : null}
                  </div>
                  {datesEditable ? (
                    <div className="cv-item-dates">
                      <input
                        className="cv-item-year"
                        type="number"
                        inputMode="numeric"
                        value={dateStart ?? ""}
                        onChange={(e) =>
                          onSetDateRange({
                            startYear: parseYear(e.target.value),
                            endYear: ongoing ? undefined : dateEnd,
                          })
                        }
                        aria-label={u.startYearAria}
                        placeholder={u.startYearAria}
                      />
                      <span aria-hidden="true">–</span>
                      <input
                        className="cv-item-year"
                        type="number"
                        inputMode="numeric"
                        value={ongoing ? "" : (dateEnd ?? "")}
                        disabled={ongoing}
                        onChange={(e) =>
                          onSetDateRange({
                            startYear: dateStart,
                            endYear: parseYear(e.target.value),
                          })
                        }
                        aria-label={u.endYearAria}
                        placeholder={u.endYearAria}
                      />
                      <label className="cv-item-ongoing">
                        <input
                          type="checkbox"
                          checked={ongoing}
                          onChange={(e) =>
                            onSetDateRange({
                              startYear: dateStart,
                              endYear: e.target.checked ? undefined : (dateEnd ?? dateStart),
                            })
                          }
                        />
                        {u.ongoingLabel}
                      </label>
                      {item.meta.dateRangeOverride !== undefined ? (
                        <button
                          type="button"
                          className="icon-btn cv-item-revert"
                          onClick={() => onSetDateRange(null)}
                          title={u.revertToSourceHint}
                          aria-label={u.revertToSource}
                        >
                          ↺
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="cv-item-dates-note">{u.resyncForDates}</p>
                  )}
                </div>
              </details>
            ) : null}
          </>
        ) : canEditText && onSetTextOverride ? (
          <div className="cv-item-edit-wrap">
            <input
              className="cv-item-edit"
              value={itemDisplayText(item) ?? ""}
              onChange={(e) => onSetTextOverride(e.target.value)}
              placeholder={u.manualPlaceholder}
              aria-label={u.entryTextAria}
            />
            {item.displayTextOverride !== undefined ? (
              <button
                type="button"
                className="icon-btn cv-item-revert"
                onClick={() => onSetTextOverride("")}
                title={u.revertToSourceHint}
                aria-label={u.revertToSource}
              >
                ↺
              </button>
            ) : null}
          </div>
        ) : (
          <div className="cv-item-title">{title}</div>
        )}
        {isCitation ? (
          <div className="cv-item-meta">
            <span>{year}</span>
            {venue ? <span> · {venue}</span> : null}
            {item.authoredBySelf ? (
              <span
                className={`cv-self-badge${
                  item.meta.matchBasis === "openalex-id" ? " is-weak-match" : ""
                }`}
                title={
                  item.meta.matchBasis === "openalex-id" ? u.matchedByIdOnly : u.matchedByIdentifier
                }
              >
                {t(locale, "youBadge")}
              </span>
            ) : null}
            {item.notMine ? (
              <span className="cv-notmine-badge" title={t(locale, "notMineHint")}>
                {t(locale, "notMineBadge")}
              </span>
            ) : null}
            {item.authoredBySelf && item.meta.reviewFlag === "orcid-conflict" && !item.notMine ? (
              <span className="cv-review-badge" title={t(locale, "reviewHint")}>
                {t(locale, "reviewBadge")}
              </span>
            ) : null}
            {/* Likely a same-name over-merge: matched only by an OpenAlex author
                profile and out of step with the rest of the profile. Calm soft
                badge (not the ⚠ conflict cue); the tooltip names exactly why;
                silenced once confirmed ("Yes, it's mine") or "kept hidden". */}
            {isMisattributed ? (
              <span className="cv-review-badge cv-review-badge--soft" title={misattributionWhy}>
                {t(locale, "reviewBadgeSoft")}
              </span>
            ) : null}
            {/* ORCID-listed work OpenAlex didn't attribute: a hidden review
                candidate. Badge shows only while still pending — confirm with
                "Show" (includes it), mark "not mine", or "Keep hidden". */}
            {item.meta.reviewFlag === "orcid-doi" && isPendingReviewCandidate ? (
              <span
                className="cv-review-badge cv-review-badge--soft"
                title={t(locale, "reviewHintOrcidDoi")}
              >
                {t(locale, "reviewBadgeSoft")}
              </span>
            ) : null}
            {dupBadge}
            {sourceBadge}
          </div>
        ) : (
          <div className="cv-item-meta">
            {item.notMine ? (
              <span className="cv-notmine-badge" title={t(locale, "notMineHint")}>
                {t(locale, "notMineBadge")}
              </span>
            ) : null}
            {/* Name+org-matched registry candidate (grants / trials): flag for
                review. Hidden by default until the user confirms it's theirs;
                suppressed once triaged with "Keep hidden". */}
            {item.meta.reviewFlag === "name-matched" && !reviewDismissed ? (
              <span
                className="cv-review-badge cv-review-badge--soft"
                title={t(locale, "reviewHintNameMatched")}
              >
                {t(locale, "reviewBadgeSoft")}
              </span>
            ) : null}
            {dupBadge}
            {sourceBadge}
          </div>
        )}
        {/* "You may already have this": a pending ORCID-discovered candidate
            whose title/identifier matches a work already shown on the CV. */}
        {similarTitle && item.meta.reviewFlag === "orcid-doi" && isPendingReviewCandidate ? (
          <p className="cv-review-similar muted">
            {t(locale, "reviewSimilarShown").replace("{title}", similarTitle)}
          </p>
        ) : null}
        {/* Possible-duplicate COMPARISON. Advisory: NEVER auto-removes. Shows the
            full facts for EVERY member of the group (2, 3, or more); "Keep this
            one" under any member keeps it and hides the rest (kept on file);
            "Keep all" dismisses the whole group (survives re-sync). */}
        {showDupBadge && dup && isDupOpen && duplicateGroup && duplicateGroup.length >= 2 ? (
          <div className="cv-dup-panel" role="group" aria-label={ds.panelAria}>
            <p className="cv-dup-why muted">{dupReasonText(locale, dup.tier, dup.relationship)}</p>
            <p className="cv-dup-prompt">{ds.comparePrompt}</p>
            <div className="cv-dup-compare">
              {duplicateGroup.map((member) => {
                const isSelf = member.item.id === item.id;
                return (
                  <div className={`cv-dup-entry${isSelf ? " is-self" : ""}`} key={member.item.id}>
                    <DupFacts item={member.item} locale={locale} />
                    <div className="cv-dup-entry-where muted">
                      {isSelf ? ds.thisEntryTag : ds.otherIn.replace("{s}", member.sectionTitle)}
                      {isHidden(member.item) ? (
                        <span className="cv-dup-hidden-tag"> · {ds.hiddenTag}</span>
                      ) : null}
                    </div>
                    {onKeepOnly ? (
                      <button
                        type="button"
                        className="mine-btn is-restore cv-dup-keep"
                        onClick={() => onKeepOnly(member.item.id)}
                        title={ds.keepThisHint}
                      >
                        {ds.keepThis}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {onKeepAll ? (
              <button
                type="button"
                className="mine-btn cv-dup-keepboth"
                onClick={onKeepAll}
                title={duplicateGroup.length > 2 ? ds.keepAllHint : ds.keepBothHint}
              >
                {duplicateGroup.length > 2 ? ds.keepAll : ds.keepBoth}
              </button>
            ) : null}
          </div>
        ) : null}
        {canMarkNotMine && item.notMine && onSetNotMineReason ? (
          <select
            className="cv-reason-select"
            value={item.notMineReason ?? ""}
            onChange={(e) =>
              onSetNotMineReason(e.target.value ? (e.target.value as NotMineReason) : undefined)
            }
            aria-label={t(locale, "reasonAria")}
            title={t(locale, "reasonAria")}
          >
            <option value="">{t(locale, "reasonPrompt")}</option>
            {NOT_MINE_REASONS.map((r) => (
              <option key={r} value={r}>
                {reasonLabel(locale, r)}
              </option>
            ))}
          </select>
        ) : null}
        <div className="cv-item-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={t(locale, "moveUp")}
            title={t(locale, "moveUp")}
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={t(locale, "moveDown")}
            title={t(locale, "moveDown")}
          >
            ↓
          </button>
          {isCitation && onToggleFeatured ? (
            <button
              type="button"
              className={`mine-btn is-feature${item.featured ? " is-on" : ""}`}
              onClick={onToggleFeatured}
              aria-pressed={Boolean(item.featured)}
              aria-label={`${u.featureItem}: ${title}`}
              title={u.featureItem}
            >
              {item.featured ? "★" : "☆"}
            </button>
          ) : null}
          <button
            type="button"
            className="mine-btn"
            onClick={onToggleIncluded}
            aria-pressed={!item.included}
            aria-label={`${item.included ? t(locale, "hide") : t(locale, "show")}: ${title}`}
            title={t(locale, "hideHint")}
          >
            {item.included ? t(locale, "hide") : t(locale, "show")}
          </button>
          {onToggleInView && item.included && !item.notMine ? (
            <button
              type="button"
              className={`mine-btn is-view${shownInView ? "" : " is-restore"}`}
              onClick={onToggleInView}
              aria-pressed={!shownInView}
              aria-label={`${shownInView ? t(locale, "viewExclude") : t(locale, "viewInclude")}: ${title}`}
              title={t(locale, "viewScopeHint")}
            >
              {shownInView ? t(locale, "viewExclude") : t(locale, "viewInclude")}
            </button>
          ) : null}
          {isMisattributed && onConfirmMine ? (
            <button
              type="button"
              className="mine-btn"
              onClick={onConfirmMine}
              aria-label={`${t(locale, "reviewMine")}: ${title}`}
              title={t(locale, "reviewMineHint")}
            >
              {t(locale, "reviewMine")}
            </button>
          ) : null}
          {canMarkNotMine ? (
            <button
              type="button"
              className={`mine-btn${item.notMine ? " is-restore" : ""}`}
              onClick={onToggleNotMine}
              aria-pressed={item.notMine}
              aria-label={`${item.notMine ? t(locale, "mine") : t(locale, "notMine")}: ${title}`}
              title={t(locale, "notMineHint")}
            >
              {item.notMine ? t(locale, "mine") : t(locale, "notMine")}
            </button>
          ) : null}
          {isPendingReviewCandidate && onDismissReview ? (
            <button
              type="button"
              className="mine-btn"
              onClick={onDismissReview}
              aria-label={`${t(locale, "reviewKeepHidden")}: ${title}`}
              title={t(locale, "reviewKeepHiddenHint")}
            >
              {t(locale, "reviewKeepHidden")}
            </button>
          ) : null}
          {isManual && onRemove ? (
            <button
              type="button"
              className="mine-btn is-delete"
              onClick={onRemove}
              title={t(locale, "delete")}
              aria-label={t(locale, "delete")}
            >
              {t(locale, "delete")}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}
