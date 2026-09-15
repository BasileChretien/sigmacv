"use client";

import { publisherPolicyLines, statutoryLine } from "@/lib/archiving/rightsSentences";
import type { StatutoryArchivingEntry } from "@/lib/archiving/statutoryRights";
import type { CvItem } from "@/lib/canonical/schema";
import type { Locale } from "@/lib/i18n";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

interface WorklistRightsProps {
  locale: Locale;
  /** The stored OA.Works record for the work, when the owner's sync holds one. */
  selfArchiving?: NonNullable<CvItem["meta"]["selfArchiving"]>;
  /** The statutory entries for the countries printed on the owner's authorship. */
  statutory: readonly StatutoryArchivingEntry[];
}

/**
 * The rights lines under one closed work in the owner worklist: the publisher's
 * policy as OA.Works recorded it — both dates, the publisher's required statement
 * quoted verbatim, a link to the archived policy — and one sentence per statutory
 * rule that may also apply, dated and linked. Facts beside the work, never a
 * verdict; the sentences are built in `lib/archiving/rightsSentences.ts`. Renders
 * nothing when neither exists.
 */
export default function WorklistRights({ locale, selfArchiving, statutory }: WorklistRightsProps) {
  if (!selfArchiving && statutory.length === 0) return null;
  const wu = workspaceUi(locale);
  const publisher = selfArchiving ? publisherPolicyLines(selfArchiving, wu, locale) : undefined;
  return (
    <div className="cv-worklist-rights" data-worklist="rights">
      {publisher ? (
        <div className="muted cv-worklist-rights-publisher">
          <p>
            {[publisher.summary, ...publisher.details].join(" ")}
            {publisher.policyUrl ? (
              <>
                {" "}
                <a href={publisher.policyUrl} target="_blank" rel="noopener noreferrer">
                  {wu.wlArchivingPolicyLink}
                </a>
              </>
            ) : null}
          </p>
          {publisher.statement ? (
            <>
              <p>{wu.wlArchivingStatement}</p>
              <blockquote className="cv-worklist-rights-statement">
                {publisher.statement}
              </blockquote>
            </>
          ) : null}
          <p className="cv-worklist-rights-dates">{publisher.dates}</p>
        </div>
      ) : null}
      {statutory.map((entry) => {
        const line = statutoryLine(entry, wu, locale);
        return (
          <p key={entry.countryCode} className="muted cv-worklist-rights-statutory">
            {line.text} {line.verification}{" "}
            <a href={line.sourceUrl} target="_blank" rel="noopener noreferrer">
              {line.sourceLabel}
            </a>
            {line.guidanceUrl ? (
              <>
                {" · "}
                <a href={line.guidanceUrl} target="_blank" rel="noopener noreferrer">
                  {wu.wlStatutoryGuidanceLink}
                </a>
              </>
            ) : null}
          </p>
        );
      })}
    </div>
  );
}
