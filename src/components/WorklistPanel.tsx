"use client";

import { useCallback, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  basisChangesPrimary,
  depositActionKind,
  depositRoutes,
  regionName,
  type DepositActionKind,
  type DepositBasis,
} from "@/lib/archiving/depositRoutes";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import {
  affiliationGaps,
  hasWorklistContent,
  openAccessStates,
  policyFinderUrl,
  type OpenAccessRow,
  type OpenAccessState,
  type WorklistRow,
} from "@/lib/cv/worklist";
import { unlistedAffiliations } from "@/lib/cv/institutionPrompt";
import { joinOwnerFunding, toCrosswalk, type FunderRow } from "@/lib/funders/join";
import { funderOaPolicy } from "@/lib/funders/oaPolicies";
import type { Locale } from "@/lib/i18n";
import { fill } from "@/lib/i18n/fill";
import { workspaceUi, type WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";
import InstitutionListingRow, { type InstitutionListing } from "./InstitutionListingRow";
import IndexingRow from "./IndexingRow";
import WorklistDeposit, { hasDepositDetails } from "./WorklistDeposit";
import WorklistRights from "./WorklistRights";

/** A stable empty crosswalk (a fresh `[]` per render would defeat the memo). */
const NO_FUNDER_CROSSWALK: readonly FunderRow[] = [];

interface WorklistPanelProps {
  cv: CanonicalCv;
  locale: Locale;
  /** The OpenAlex funder crosswalk rows for the funders printed on the owner's
   *  works (owner-only, loaded by the page). With none, the owner's grants
   *  still join by award number. */
  funderCrosswalk?: readonly FunderRow[];
  /** Jump to an item in the editor (expand its section + scroll/focus). When
   *  omitted (a read-only context) rows are plain text. */
  onJump?: (itemId: string) => void;
  /** The publish state and its setter, for the "Institution listing" status
   *  line (owner-only; the anonymous preview passes nothing and gets no row). */
  listing?: InstitutionListing;
  /** ISO-3166 code of the owner's current affiliation (the Institution table, loaded
   *  by the page), for the deposit routes' "current affiliation" choice. */
  currentAffiliationCountry?: string;
  /** Open the panel at once: in its own editor tab the tab is the disclosure. */
  defaultOpen?: boolean;
  /** Rendered instead of nothing when there is nothing to list — a tab must not
   *  go blank. Omitted (the classic layout), the panel vanishes as before. */
  whenEmpty?: ReactNode;
  /** The deposit routes' basis, when the editor owns the choice (it also shows
   *  chips on the publication rows that must agree). Alone, the panel keeps it. */
  depositBasis?: DepositBasis;
  onDepositBasisChange?: (basis: DepositBasis) => void;
}

const STATE_LABEL: Record<OpenAccessState, keyof WorkspaceUiStrings> = {
  "open-cc": "wlStateOpenCc",
  "open-other": "wlStateOpenOther",
  "no-open-copy-found": "wlStateClosed",
  "not-determined": "wlStateUnknown",
};

// Every substitution below uses a FUNCTION replacer: a source value (a ROR
// key, a funder name, an award number) may contain `$'`, `$&` or `` $` ``,
// which a string replacement would read as a pattern and corrupt the copy with.

/**
 * The owner's worklist — "What you can act on" — shown ONLY in the editor (in the
 * regions layout, in its own "Open access" tab, never among the sections): (a)
 * current positions without a ROR record (the organisation, added on ORCID,
 * resolves at the next sync), (b) the countable works with no open copy found —
 * TWO visible lines each (title · journal · chip; then, for a journal article, the
 * one place to deposit it with Copy DOI, `WorklistDeposit`) and ONE disclosure
 * per work holding the journal-policy search link (whenever OA.Works gives no
 * policy link), the funders named, the publisher's policy as OA.Works recorded it
 * with the statutory rule that may also apply (`WorklistRights`), the form notes
 * and the other places; ordered by what the owner can do now (a named version,
 * then no record, then "only if", then works with no deposit action), the one
 * disclaimer under the list; (c) the
 * works that acknowledge one of the owner's OWN grants (`funders/join.ts`), each
 * beside the funder's recorded open-access policy — dated, linked — and what
 * SigmaCV found. No heading carries a count or a share — no "N of M", no
 * open-access breakdown (actions, never states). Every row jumps to the entry.
 * It is help, not judgement — no compliance state exists (the i18n tests ban the
 * vocabulary) — and nothing here reaches the CV, the public page or an export.
 * Accessible by construction: the title is the tabpanel's h2 and the groups h3;
 * every external link and every jump button is described by one hidden note;
 * "DOI copied" is announced once, in one status region, not by a live region
 * per button. Renders nothing (or `whenEmpty`) when there is nothing to show.
 */
export default function WorklistPanel({
  cv,
  locale,
  funderCrosswalk = NO_FUNDER_CROSSWALK,
  onJump,
  listing,
  currentAffiliationCountry,
  defaultOpen = false,
  whenEmpty = null,
  depositBasis: basisProp,
  onDepositBasisChange,
}: WorklistPanelProps) {
  const wu = workspaceUi(locale);
  const gaps = useMemo(() => affiliationGaps(cv), [cv]);
  const oa = useMemo(() => openAccessStates(cv), [cv]);
  const crosswalk = useMemo(() => toCrosswalk(funderCrosswalk), [funderCrosswalk]);
  const funding = useMemo(() => joinOwnerFunding(cv, crosswalk), [cv, crosswalk]);
  // Which affiliation the deposit routes follow: the one printed on each paper by
  // default, the owner's current one when they choose it.
  const [localBasis, setLocalBasis] = useState<DepositBasis>("paper");
  const depositBasis = basisProp ?? localBasis;
  const setDepositBasis = onDepositBasisChange ?? setLocalBasis;
  // One hidden note each for the jump buttons and the external links, and ONE
  // polite status region for "DOI copied". A live region speaks only when its
  // text MUTATES, and React skips a same-value render — so a second copy within
  // the clearing delay would be silent. A tick makes every announcement a DOM
  // change: even ticks append a zero-width space, which no reader voices.
  const jumpNoteId = useId();
  const newTabNoteId = useId();
  const [announce, setAnnounce] = useState({ text: "", tick: 0 });
  const onCopied = useCallback(
    (text: string) => setAnnounce((a) => ({ text, tick: a.tick + 1 })),
    [],
  );
  useEffect(() => {
    if (!announce.text) return;
    const timer = window.setTimeout(() => setAnnounce((a) => ({ text: "", tick: a.tick })), 2000);
    return () => window.clearTimeout(timer);
  }, [announce]);
  const itemsById = useMemo(
    () => new Map<string, CvItem>(cv.sections.flatMap((s) => s.items).map((it) => [it.id, it])),
    [cv],
  );
  // The deposit action is for journal articles: the works OA.Works records a
  // publisher policy for, and the ones repositories take as manuscripts.
  const depositItem = useCallback(
    (itemId: string): CvItem | undefined => {
      const item = itemsById.get(itemId);
      return item?.csl?.type === "article-journal" ? item : undefined;
    },
    [itemsById],
  );
  // Closed works in the order of what the owner can do now: a named version
  // first, then no record, then "only if", then works with no deposit action —
  // document order within each. The rank reads the same routes the action
  // shows, computed once per row here, which also answers whether the deposit
  // details half has anything to show (a disclosure is never empty). Memoised
  // so a copy's announcement does not re-route sixty works.
  const closedRows = useMemo(() => {
    const RANK: Record<DepositActionKind, number> = { version: 0, unrecorded: 1, conditional: 2 };
    const ctx = { basis: depositBasis, currentCountry: currentAffiliationCountry, crosswalk };
    return oa.rows
      .filter((r) => r.state === "no-open-copy-found")
      .map((r: OpenAccessRow, i) => {
        const item = depositItem(r.itemId);
        if (!item) return { r, i, item, rank: 3, depositDetails: false };
        const routes = depositRoutes(cv, item, ctx);
        return {
          r,
          i,
          item,
          rank: RANK[depositActionKind(item, routes[0]!)],
          depositDetails: hasDepositDetails(item, routes, locale),
        };
      })
      .sort((a, b) => a.rank - b.rank || a.i - b.i);
  }, [oa, depositItem, cv, depositBasis, currentAffiliationCountry, crosswalk, locale]);
  // The status line is a reason to show the panel only while a choice is open
  // (an unlisted ROR-linked current affiliation) — never counted anywhere.
  const unlisted = listing ? unlistedAffiliations(listing.state).length > 0 : false;
  // So is an open indexing decision on a live page (not decided, or "not now"):
  // the choice must stay reachable, never buried by a clean CV. Indexing ON is a
  // status, not a reason (like a completed listing).
  const indexingOpen = listing
    ? listing.state.published && listing.state.slug !== null && !listing.state.indexable
    : false;
  if (!hasWorklistContent(gaps, oa, funding.length, unlisted) && !indexingOpen) {
    return whenEmpty;
  }

  const closed = closedRows.map((x) => x.r);

  const rowText = (row: WorklistRow): string => {
    const title = row.title ?? wu.srNoTitle;
    return row.year === undefined ? title : `${title} (${row.year})`;
  };
  const jump = (itemId: string, label: string): ReactNode =>
    onJump ? (
      <button
        type="button"
        className="cv-worklist-link"
        onClick={() => onJump(itemId)}
        title={wu.wlJump}
        aria-describedby={jumpNoteId}
      >
        {label}
      </button>
    ) : (
      <span>{label}</span>
    );
  const stateChip = (state: OpenAccessState): ReactNode => (
    <span className="cv-worklist-chip" data-state={state}>
      {wu[STATE_LABEL[state]]}
    </span>
  );
  const finderLink = (venue: string | undefined): ReactNode => {
    const policy = policyFinderUrl(venue);
    return policy ? (
      <a href={policy} target="_blank" rel="noopener noreferrer" aria-describedby={newTabNoteId}>
        {wu.wlPolicyLink}
      </a>
    ) : null;
  };
  // "SigmaCV found: {state}" with the chip in the placeholder's place.
  const [foundBefore, foundAfter] = wu.wlFundingFound.split("{state}");

  return (
    <>
      {/* The tabpanel's second-level heading, for heading navigation. It sits
          BESIDE the summary: a heading inside a summary (a button) is flattened
          by several browser + reader pairs. */}
      <h2 className="visually-hidden">{wu.wlTitle}</h2>
      <details
        className="cv-worklist"
        data-owner-only="worklist"
        // Uncontrolled after the first render: the owner may still fold it.
        open={defaultOpen ? true : undefined}
      >
        <summary className="cv-worklist-title">{wu.wlTitle}</summary>
        <p className="muted cv-worklist-intro">{wu.wlIntro}</p>
        <span id={jumpNoteId} className="visually-hidden">
          {wu.wlJump}
        </span>
        <span id={newTabNoteId} className="visually-hidden">
          {wu.wlOpensNewTab}
        </span>
        <span
          role="status"
          aria-live="polite"
          className="visually-hidden"
          data-testid="worklist-status"
        >
          {announce.text}
          {announce.text && announce.tick % 2 === 0 ? "\u200b" : ""}
        </span>

        {listing ? (
          <>
            <IndexingRow
              locale={locale}
              state={listing.state}
              onPublishStateChange={listing.onPublishStateChange}
              newTabDescribedBy={newTabNoteId}
            />
            <InstitutionListingRow
              locale={locale}
              state={listing.state}
              onPublishStateChange={listing.onPublishStateChange}
              newTabDescribedBy={newTabNoteId}
            />
          </>
        ) : null}

        {gaps.positionsWithoutRor.length > 0 ? (
          <section className="cv-worklist-group">
            <h3>{wu.wlPositionsHeading}</h3>
            <p className="muted">{wu.wlPositionsHelp}</p>
            <ul>
              {gaps.positionsWithoutRor.map((p) => (
                <li key={p.itemId}>{jump(p.itemId, p.label || wu.srNoTitle)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {closed.length > 0 ? (
          <section className="cv-worklist-group">
            <h3>{wu.wlClosedHeading}</h3>
            <p className="muted">{wu.wlClosedHelp}</p>
            {closed.some((r) => depositItem(r.itemId)) ? (
              <p className="muted cv-worklist-deposit-help">{wu.wlDepositHelp}</p>
            ) : null}
            {currentAffiliationCountry &&
            closed.some((r) => {
              const item = depositItem(r.itemId);
              return item
                ? basisChangesPrimary(cv, item, {
                    currentCountry: currentAffiliationCountry,
                    crosswalk,
                  })
                : false;
            }) ? (
              <fieldset className="cv-worklist-deposit-basis">
                <legend>{wu.wlDepositBasisLabel}</legend>
                <label>
                  <input
                    type="radio"
                    name="cv-worklist-deposit-basis"
                    checked={depositBasis === "paper"}
                    onChange={() => setDepositBasis("paper")}
                  />{" "}
                  {wu.wlDepositBasisPaper}
                </label>
                <label>
                  <input
                    type="radio"
                    name="cv-worklist-deposit-basis"
                    checked={depositBasis === "current"}
                    onChange={() => setDepositBasis("current")}
                  />{" "}
                  {fill(wu.wlDepositBasisCurrent, {
                    country: regionName(currentAffiliationCountry, locale),
                  })}
                </label>
              </fieldset>
            ) : null}
            <ul>
              {closedRows.map(({ r, item, depositDetails }) => {
                const hasRights = r.selfArchiving !== undefined || r.statutory.length > 0;
                const finder = r.selfArchiving?.policyUrl ? null : finderLink(r.venue);
                const more =
                  hasRights || finder !== null || r.funderNames.length > 0 || depositDetails;
                return (
                  <li
                    key={r.itemId}
                    className="cv-worklist-row"
                    // The chip on the publication row jumps here (CvEditor).
                    data-worklist-item={r.itemId}
                    tabIndex={-1}
                  >
                    <p className="cv-worklist-row-head">
                      {jump(r.itemId, rowText(r))} {stateChip(r.state)}
                      {r.venue ? <span className="muted"> · {r.venue}</span> : null}
                    </p>
                    {item ? (
                      <WorklistDeposit
                        part="action"
                        locale={locale}
                        cv={cv}
                        item={item}
                        hasStatutoryRight={r.statutory.some(
                          (entry) => entry.kind === "author-right",
                        )}
                        basis={depositBasis}
                        currentCountry={currentAffiliationCountry}
                        crosswalk={crosswalk}
                        onCopied={onCopied}
                        newTabDescribedBy={newTabNoteId}
                      />
                    ) : null}
                    {more ? (
                      <details className="cv-worklist-row-more">
                        <summary>{wu.wlRowDetails}</summary>
                        {finder ? <p className="muted cv-worklist-finder">{finder}</p> : null}
                        {r.funderNames.length > 0 ? (
                          <div className="muted cv-worklist-funders">
                            {wu.wlFunders.replace("{names}", () => r.funderNames.join(", "))}
                          </div>
                        ) : null}
                        <WorklistRights
                          locale={locale}
                          selfArchiving={r.selfArchiving}
                          statutory={r.statutory}
                          newTabDescribedBy={newTabNoteId}
                        />
                        {item ? (
                          <WorklistDeposit
                            part="details"
                            locale={locale}
                            cv={cv}
                            item={item}
                            hasStatutoryRight={r.statutory.some(
                              (entry) => entry.kind === "author-right",
                            )}
                            basis={depositBasis}
                            currentCountry={currentAffiliationCountry}
                            crosswalk={crosswalk}
                            newTabDescribedBy={newTabNoteId}
                          />
                        ) : null}
                      </details>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {closed.some((r) => r.selfArchiving || r.statutory.length > 0) ? (
              <p className="muted cv-worklist-note">{wu.wlArchivingDisclaimer}</p>
            ) : null}
          </section>
        ) : null}

        {funding.length > 0 ? (
          <section className="cv-worklist-group" data-worklist="funding">
            <h3>{wu.wlFundingHeading}</h3>
            <p className="muted">{wu.wlFundingHelp}</p>
            <ul>
              {funding.map((row) => {
                const funder = row.funderName ?? wu.wlFundingUnnamedFunder;
                const policy = funderOaPolicy(row.fundrefDoi);
                const basis =
                  row.matchBasis === "award-number"
                    ? fill(wu.wlFundingAward, { award: row.awardId ?? "", funder })
                    : fill(wu.wlFundingFunderOnly, { funder });
                return (
                  <li key={`${row.workId}/${row.grantId}`}>
                    {jump(
                      row.workId,
                      rowText({ itemId: row.workId, title: row.title, year: row.year }),
                    )}{" "}
                    <span className="cv-worklist-funding-basis">{basis}</span>
                    <div className="muted cv-worklist-funding-policy">
                      {policy ? (
                        <>
                          {policy.verifiedBy === "maintainer"
                            ? fill(wu.wlFundingPolicy, {
                                funder,
                                date: policy.lastVerified,
                                statements: policy.statements.join("; "),
                              })
                            : // Drafted from memory, never checked live: no date
                              // exists, and the sentence says so rather than
                              // "as recorded on".
                              fill(wu.wlFundingPolicyPending, {
                                funder,
                                statements: policy.statements.join("; "),
                              })}{" "}
                          <a
                            href={policy.policyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-describedby={newTabNoteId}
                          >
                            {wu.wlFundingPolicyLink}
                          </a>
                        </>
                      ) : (
                        fill(wu.wlFundingNoPolicy, { funder })
                      )}
                    </div>
                    <div className="muted cv-worklist-funding-found">
                      {foundBefore}
                      {stateChip(row.openAccess)}
                      {foundAfter} {finderLink(row.venue)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </details>
    </>
  );
}
