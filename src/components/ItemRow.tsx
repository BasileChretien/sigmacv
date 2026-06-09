"use client";

import { useState } from "react";
import {
  isHidden,
  NOT_MINE_REASONS,
  type CvItem,
  type CvSectionType,
  type NotMineReason,
} from "@/lib/canonical/schema";
import { reasonLabel, t, type Locale } from "@/lib/i18n";
import { ui } from "@/lib/i18n/ui";
import { dupReasonText, dupStrings } from "@/lib/i18n/duplicates";

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
  const title = item.csl?.title ?? item.displayText ?? u.itemUntitled;
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
  /** Whether this item is shown in the CURRENT view/preset (per-view selection). */
  shownInView?: boolean;
  /** Toggle this item in/out of the current view only (not a global hide). */
  onToggleInView?: () => void;
  /** Set/clear the structured reason for a "not mine" assertion. */
  onSetNotMineReason?: (reason: NotMineReason | undefined) => void;
  /** The other entry this item likely duplicates (full data, resolved by the
   *  editor), shown side-by-side so the user can compare and choose. */
  duplicatePartner?: CvItem;
  /** Localized name of the section the partner entry lives in (e.g. "Preprints"). */
  duplicatePartnerSection?: string;
  /** "Keep this one" on THIS entry → keep it, hide the partner. */
  onKeepThis?: () => void;
  /** "Keep this one" on the PARTNER entry → keep the partner, hide this one. */
  onKeepPartner?: () => void;
  /** "Keep both" — dismiss the duplicate flag so it isn't re-raised on re-sync. */
  onDupKeepBoth?: () => void;
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
  sectionType,
  isFirst,
  isLast,
  onToggleIncluded,
  onToggleNotMine,
  shownInView = true,
  onToggleInView,
  onSetNotMineReason,
  duplicatePartner,
  duplicatePartnerSection,
  onKeepThis,
  onKeepPartner,
  onDupKeepBoth,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDropOver,
  onUpdateText,
  onRemove,
}: ItemRowProps) {
  const u = ui(locale);
  const ds = dupStrings(locale);
  // The "possible duplicate" explainer is collapsed until the badge is clicked.
  const [dupExpanded, setDupExpanded] = useState(false);
  const dup = item.meta.duplicateOf;
  // Only nag about a VISIBLE duplicate the user hasn't resolved yet.
  const showDupBadge = item.meta.reviewFlag === "duplicate" && !!dup && !isHidden(item);
  const dupBadge = showDupBadge ? (
    <button
      type="button"
      className="cv-review-badge is-duplicate"
      onClick={() => setDupExpanded((v) => !v)}
      aria-expanded={dupExpanded}
      title={ds.badgeHint}
    >
      {ds.badge}
    </button>
  ) : null;
  const isCitation = Boolean(item.csl);
  const isManual = item.source === "manual";
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
            {/* ORCID-listed work OpenAlex didn't attribute: a hidden review
                candidate. Badge shows only while still pending — confirm with
                "Show" (which includes it) or mark "not mine". */}
            {item.meta.reviewFlag === "orcid-doi" && !item.included && !item.notMine ? (
              <span className="cv-review-badge" title={t(locale, "reviewHintOrcidDoi")}>
                {t(locale, "reviewBadge")}
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
                review. Hidden by default until the user confirms it's theirs. */}
            {item.meta.reviewFlag === "name-matched" ? (
              <span className="cv-review-badge" title={t(locale, "reviewHintNameMatched")}>
                {t(locale, "reviewBadge")}
              </span>
            ) : null}
            {dupBadge}
            {sourceBadge}
          </div>
        )}
        {/* Possible-duplicate COMPARISON. Advisory: NEVER auto-removes. Shows the
            full facts for BOTH entries side-by-side; "Keep this one" under either
            keeps that entry and hides the other (kept on file); "Keep both"
            dismisses the pair (survives re-sync). */}
        {showDupBadge && dup && dupExpanded ? (
          <div className="cv-dup-panel" role="group" aria-label={ds.panelAria}>
            <p className="cv-dup-why muted">{dupReasonText(locale, dup.tier, dup.relationship)}</p>
            <p className="cv-dup-prompt">{ds.comparePrompt}</p>
            <div className="cv-dup-compare">
              <div className="cv-dup-entry">
                <DupFacts item={item} locale={locale} />
                {onKeepThis && duplicatePartner ? (
                  <button
                    type="button"
                    className="mine-btn is-restore cv-dup-keep"
                    onClick={onKeepThis}
                    title={ds.keepThisHint}
                  >
                    {ds.keepThis}
                  </button>
                ) : null}
              </div>
              {duplicatePartner ? (
                <div className="cv-dup-entry">
                  <DupFacts item={duplicatePartner} locale={locale} />
                  <div className="cv-dup-entry-where muted">
                    {duplicatePartnerSection
                      ? ds.otherIn.replace("{s}", duplicatePartnerSection)
                      : null}
                    {isHidden(duplicatePartner) ? (
                      <span className="cv-dup-hidden-tag"> · {ds.hiddenTag}</span>
                    ) : null}
                  </div>
                  {onKeepPartner ? (
                    <button
                      type="button"
                      className="mine-btn is-restore cv-dup-keep"
                      onClick={onKeepPartner}
                      title={ds.keepThisHint}
                    >
                      {ds.keepThis}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {onDupKeepBoth ? (
              <button
                type="button"
                className="mine-btn cv-dup-keepboth"
                onClick={onDupKeepBoth}
                title={ds.keepBothHint}
              >
                {ds.keepBoth}
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
