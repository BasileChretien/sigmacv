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
import type { Locale } from "@/lib/i18n";
import { workspaceUi, type WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";

interface WorklistPanelProps {
  cv: CanonicalCv;
  locale: Locale;
  /** The ROR ids the owner consented to on the institution page (bare ids).
   *  With none, the affiliation buckets are empty; positions and open access
   *  are still listed. */
  consentedRorIds: readonly string[];
  /** Jump to an item in the editor (expand its section + scroll/focus). When
   *  omitted (a read-only context) rows are plain text. */
  onJump?: (itemId: string) => void;
}

const STATE_LABEL: Record<OpenAccessState, keyof WorkspaceUiStrings> = {
  "open-cc": "wlStateOpenCc",
  "open-other": "wlStateOpenOther",
  "no-open-copy-found": "wlStateClosed",
  "not-determined": "wlStateUnknown",
};

/** Every substitution below uses a FUNCTION replacer: a source value (a ROR
 *  key, a funder name) may contain `$'`, `$&` or `` $` ``, which a string
 *  replacement would read as a pattern and corrupt the copy with. */
function counted(template: string, n: number, total: number): string {
  return template.replace("{n}", () => String(n)).replace("{total}", () => String(total));
}

/**
 * The owner's "Affiliations & open access" worklist — the researcher-first half
 * of reconciliation with an institution's record, shown ONLY in the editor: (a)
 * current positions without a ROR record, (b) works dated during a consented
 * position whose printed affiliation lacks that institution, grouped by the
 * ROR they DO carry, plus the OpenAlex works with no affiliation data (works
 * from other sources never carry it: counted on one line, not checked), (c) the
 * countable works with no open copy found, each with its four-state label and a
 * link to the journal's policy. Counts carry their denominators. Every row
 * jumps to the entry. It is help, not judgement — no compliance state exists
 * (the i18n test bans the vocabulary) — and nothing here reaches the CV, the
 * public page or an export. Renders nothing when there is nothing to show.
 */
export default function WorklistPanel({ cv, locale, consentedRorIds, onJump }: WorklistPanelProps) {
  const wu = workspaceUi(locale);
  const gaps = useMemo(() => affiliationGaps(cv, consentedRorIds), [cv, consentedRorIds]);
  const oa = useMemo(() => openAccessStates(cv), [cv]);
  if (!hasWorklistContent(gaps, oa)) return null;

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

  return (
    <details className="cv-worklist" data-owner-only="worklist">
      <summary className="cv-worklist-title">{wu.wlTitle}</summary>
      <p className="muted cv-worklist-intro">{wu.wlIntro}</p>

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
            {closed.map((r) => {
              const policy = policyFinderUrl(r.venue);
              return (
                <li key={r.itemId}>
                  {jump(r.itemId, rowText(r))}{" "}
                  <span className="cv-worklist-chip" data-state={r.state}>
                    {wu[STATE_LABEL[r.state]]}
                  </span>
                  {r.venue ? <span className="muted"> · {r.venue}</span> : null}
                  {policy ? (
                    <>
                      {" "}
                      <a href={policy} target="_blank" rel="noopener noreferrer">
                        {wu.wlPolicyLink}
                      </a>
                    </>
                  ) : null}
                  {r.funderNames.length > 0 ? (
                    <div className="muted cv-worklist-funders">
                      {wu.wlFunders.replace("{names}", () => r.funderNames.join(", "))}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </details>
  );
}
