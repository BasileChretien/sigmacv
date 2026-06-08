"use client";

import {
  isHidden,
  NOT_MINE_REASONS,
  type CvItem,
  type NotMineReason,
} from "@/lib/canonical/schema";
import { reasonLabel, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/i18n/ui";

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

interface ItemRowProps {
  item: CvItem;
  locale: Locale;
  isFirst: boolean;
  isLast: boolean;
  onToggleIncluded: () => void;
  onToggleNotMine: () => void;
  /** Whether this item is shown in the CURRENT view/preset (per-view selection). */
  shownInView?: boolean;
  /** Toggle this item in/out of the current view only (not a global hide). */
  onToggleInView?: () => void;
  /** Set/clear the structured reason for a "not mine" assertion. */
  onSetNotMineReason?: (reason: NotMineReason | undefined) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** Drag-and-drop reorder: this row started being dragged. */
  onDragStart?: () => void;
  /** Drag-and-drop reorder: a dragged row was dropped onto this one. */
  onDropOver?: () => void;
  /** Edit a manual entry's text (only passed for source === "manual"). */
  onUpdateText?: (text: string) => void;
  /** Delete a manual entry (only passed for source === "manual"). */
  onRemove?: () => void;
}

export default function ItemRow({
  item,
  locale,
  isFirst,
  isLast,
  onToggleIncluded,
  onToggleNotMine,
  shownInView = true,
  onToggleInView,
  onSetNotMineReason,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDropOver,
  onUpdateText,
  onRemove,
}: ItemRowProps) {
  const u = ui(locale);
  const isCitation = Boolean(item.csl);
  const isManual = item.source === "manual";
  // "Not mine" is a disambiguation correction for an item a THIRD PARTY
  // attributed to the account holder by IDENTIFIER match: bibliographic works
  // (citations, from OpenAlex), DataCite + OpenAIRE datasets/software, DBLP
  // conference papers (ORCID→PID matched), and Open Editors Plus editorial roles.
  // ORCID records are self-asserted and manual entries are self-added, so those
  // get Hide / Delete only. The NAME+org-matched registries (UKRI/NIH/NSF grants,
  // clinical trials) are review candidates curated via Hide/Show — there is no
  // identifier to contradict, so they never expose a "not mine" disambiguation
  // claim. Inferred OpenAlex affiliations (a positions item) stay Hide-only too.
  const canMarkNotMine =
    isCitation ||
    item.source === "oep" ||
    item.source === "datacite" ||
    item.source === "openaire" ||
    item.source === "dblp";
  const title = item.csl?.title ?? item.displayText ?? u.itemUntitled;
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
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li
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
                review. Hidden by default until the user confirms it's theirs. */}
            {item.meta.reviewFlag === "name-matched" ? (
              <span className="cv-review-badge" title={t(locale, "reviewHint")}>
                {t(locale, "reviewBadge")}
              </span>
            ) : null}
            {sourceBadge}
          </div>
        )}
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
