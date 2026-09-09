"use client";

import { useMemo, type ReactNode } from "react";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  affiliationGaps,
  groupByRor,
  hasWorklistContent,
  openAccessStates,
  policyFinderUrl,
  OPEN_ACCESS_STATES,
  type OpenAccessState,
  type WorklistRow,
} from "@/lib/cv/worklist";
import { unlistedAffiliations } from "@/lib/cv/institutionPrompt";
import { joinOwnerFunding, toCrosswalk, type FunderRow } from "@/lib/funders/join";
import { funderOaPolicy } from "@/lib/funders/oaPolicies";
import type { Locale } from "@/lib/i18n";
import { workspaceUi, type WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";
import InstitutionListingRow, { type InstitutionListing } from "./InstitutionListingRow";

/** A stable empty crosswalk (a fresh `[]` per render would defeat the memo). */
const NO_FUNDER_CROSSWALK: readonly FunderRow[] = [];

interface WorklistPanelProps {
  cv: CanonicalCv;
  locale: Locale;
  /** The ROR ids the owner consented to on the institution page (bare ids).
   *  With none, the affiliation buckets are empty; positions and open access
   *  are still listed. */
  consentedRorIds: readonly string[];
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
}

const STATE_LABEL: Record<OpenAccessState, keyof WorkspaceUiStrings> = {
  "open-cc": "wlStateOpenCc",
  "open-other": "wlStateOpenOther",
  "no-open-copy-found": "wlStateClosed",
  "not-determined": "wlStateUnknown",
};

/** Every substitution below uses a FUNCTION replacer: a source value (a ROR
 *  key, a funder name, an award number) may contain `$'`, `$&` or `` $` ``,
 *  which a string replacement would read as a pattern and corrupt the copy
 *  with. */
function counted(template: string, n: number, total: number): string {
  return template.replace("{n}", () => String(n)).replace("{total}", () => String(total));
}

/** Every occurrence of each `{key}` (a locale may repeat one), function replacer. */
function fill(template: string, values: Record<string, string>): string {
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{${key}}`, () => value);
  }
  return out;
}

/**
 * The owner's "Affiliations & open access" worklist — the researcher-first half
 * of reconciliation with an institution's record, shown ONLY in the editor: (a)
 * current positions without a ROR record, (b) works dated during a consented
 * position whose printed affiliation lacks that institution, grouped by the
 * ROR they DO carry, plus the OpenAlex works with no affiliation data (works
 * from other sources never carry it: counted on one line, not checked), (c) the
 * countable works with no open copy found, each with its four-state label and a
 * link to the journal's policy, (d) the works that acknowledge one of the
 * owner's OWN grants (`funders/join.ts`), each beside the funder's recorded
 * open-access policy — dated, linked — and what SigmaCV found. Counts carry
 * their denominators; the funding heading carries none. Every row jumps to the
 * entry. It is help, not judgement — no compliance state exists (the i18n tests
 * ban the vocabulary) — and nothing here reaches the CV, the public page or an
 * export. Renders nothing when there is nothing to show.
 */
export default function WorklistPanel({
  cv,
  locale,
  consentedRorIds,
  funderCrosswalk = NO_FUNDER_CROSSWALK,
  onJump,
  listing,
}: WorklistPanelProps) {
  const wu = workspaceUi(locale);
  const gaps = useMemo(() => affiliationGaps(cv, consentedRorIds), [cv, consentedRorIds]);
  const oa = useMemo(() => openAccessStates(cv), [cv]);
  const crosswalk = useMemo(() => toCrosswalk(funderCrosswalk), [funderCrosswalk]);
  const funding = useMemo(() => joinOwnerFunding(cv, crosswalk), [cv, crosswalk]);
  // The status line is a reason to show the panel only while a choice is open
  // (an unlisted ROR-linked current affiliation) — never counted anywhere.
  const unlisted = listing ? unlistedAffiliations(listing.state).length > 0 : false;
  if (!hasWorklistContent(gaps, oa, funding.length, unlisted)) return null;

  const closed = oa.rows.filter((r) => r.state === "no-open-copy-found");
  const groups = groupByRor(gaps.missing);

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
      <>
        {" "}
        <a href={policy} target="_blank" rel="noopener noreferrer">
          {wu.wlPolicyLink}
        </a>
      </>
    ) : null;
  };
  // "SigmaCV found: {state}" with the chip in the placeholder's place.
  const [foundBefore, foundAfter] = wu.wlFundingFound.split("{state}");

  return (
    <details className="cv-worklist" data-owner-only="worklist">
      <summary className="cv-worklist-title">{wu.wlTitle}</summary>
      <p className="muted cv-worklist-intro">{wu.wlIntro}</p>

      {listing ? (
        <InstitutionListingRow
          locale={locale}
          state={listing.state}
          onPublishStateChange={listing.onPublishStateChange}
        />
      ) : null}

      {gaps.positionsWithoutRor.length > 0 ? (
        <section className="cv-worklist-group">
          <h4>
            {counted(wu.wlPositionsHeading, gaps.positionsWithoutRor.length, gaps.currentPositions)}
          </h4>
          <p className="muted">{wu.wlPositionsHelp}</p>
          <ul>
            {gaps.positionsWithoutRor.map((p) => (
              <li key={p.itemId}>{jump(p.itemId, p.label || wu.srNoTitle)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {gaps.missing.length > 0 ? (
        <section className="cv-worklist-group">
          <h4>{counted(wu.wlGapsHeading, gaps.missing.length, gaps.consideredWorks)}</h4>
          <p className="muted">{wu.wlGapsHelp}</p>
          {groups.map((g) => (
            <div key={g.rorId} className="cv-worklist-subgroup">
              <h5>
                {wu.wlGapsGroup
                  .replace("{ror}", () => g.rorId)
                  .replace("{n}", () => String(g.rows.length))}
              </h5>
              <ul>
                {g.rows.map((r) => (
                  <li key={r.itemId}>{jump(r.itemId, rowText(r))}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {gaps.noAffiliationData.length > 0 ? (
        <section className="cv-worklist-group">
          <h4>
            {counted(
              wu.wlNoAffiliationHeading,
              gaps.noAffiliationData.length,
              gaps.consideredWorks,
            )}
          </h4>
          <p className="muted">{wu.wlNoAffiliationHelp}</p>
          <ul>
            {gaps.noAffiliationData.map((r) => (
              <li key={r.itemId}>{jump(r.itemId, rowText(r))}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {gaps.notChecked > 0 ? (
        <p className="muted cv-worklist-note">
          {wu.wlNotCheckedNote.replace("{n}", () => String(gaps.notChecked))}
        </p>
      ) : null}

      {closed.length > 0 ? (
        <section className="cv-worklist-group">
          <h4>{counted(wu.wlClosedHeading, closed.length, oa.total)}</h4>
          <p className="muted cv-worklist-oa-summary">
            {wu.wlOaSummary.replace("{total}", () => String(oa.total))}{" "}
            {OPEN_ACCESS_STATES.map((s) => (
              <span key={s} className="cv-worklist-chip" data-state={s}>
                {wu[STATE_LABEL[s]]}: {oa.counts[s]}
              </span>
            ))}
          </p>
          <p className="muted">{wu.wlClosedHelp}</p>
          <ul>
            {closed.map((r) => (
              <li key={r.itemId}>
                {jump(r.itemId, rowText(r))} {stateChip(r.state)}
                {r.venue ? <span className="muted"> · {r.venue}</span> : null}
                {finderLink(r.venue)}
                {r.funderNames.length > 0 ? (
                  <div className="muted cv-worklist-funders">
                    {wu.wlFunders.replace("{names}", () => r.funderNames.join(", "))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {funding.length > 0 ? (
        <section className="cv-worklist-group" data-worklist="funding">
          <h4>{wu.wlFundingHeading}</h4>
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
                        <a href={policy.policyUrl} target="_blank" rel="noopener noreferrer">
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
                    {foundAfter}
                    {finderLink(row.venue)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </details>
  );
}
