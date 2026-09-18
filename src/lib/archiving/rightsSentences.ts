import type { CvItem } from "@/lib/canonical/schema";
import { fill } from "@/lib/i18n/fill";
import type { WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";
import type { DepositNow } from "./depositNow";
import type { StatutoryArchivingEntry, StatutoryKind } from "./statutoryRights";

/**
 * The worklist's rights lines, as plain strings, built ONLY from stored fields
 * and the committed statutory table: the publisher's policy as its source
 * recorded it — OA.Works or Jisc Open Policy Finder, named in every line built
 * from it (with both dates), and one sentence per statutory entry that "may also
 * apply". Pure — the React row (`components/WorklistRights.tsx`) only lays these
 * out. Facts, never a verdict: nothing here says a work is or is not allowed to
 * be deposited beyond what the record itself says, and no line counts anything.
 *
 * Country names, month durations and "or"-lists come from `Intl` in the viewer's
 * locale; OA.Works' repository kinds, the publisher's statement and the table's
 * statements stay in the language they were recorded in.
 */

type SelfArchivingRecord = NonNullable<CvItem["meta"]["selfArchiving"]>;

/** The source's own name, in every locale: the credit on each line. */
const POLICY_SOURCE_NAME: Record<SelfArchivingRecord["source"], string> = {
  "oa.works": "OA.Works",
  "open-policy-finder": "Open Policy Finder",
};
type Version = SelfArchivingRecord["versions"][number];

const VERSION_KEY: Record<Version, keyof WorkspaceUiStrings> = {
  submittedVersion: "wlArchivingVersionSubmitted",
  acceptedVersion: "wlArchivingVersionAccepted",
  publishedVersion: "wlArchivingVersionPublished",
};

const KIND_KEY: Record<StatutoryKind, keyof WorkspaceUiStrings> = {
  "author-right": "wlStatutoryAuthorRight",
  "deposit-requirement": "wlStatutoryDepositRequirement",
  "funding-policy": "wlStatutoryFundingPolicy",
};

export interface PublisherPolicyLines {
  /** Allowed (with the versions) or no permission recorded. */
  summary: string;
  /** Where, embargo, licence — only what the record states, only when allowed. */
  details: string[];
  /** The record's own update date and SigmaCV's retrieval date. */
  dates: string;
  /** The publisher's required statement, verbatim (only when allowed). */
  statement?: string;
  /** An archived copy of the publisher's policy. */
  policyUrl?: string;
}

function orList(values: readonly string[], locale: string): string {
  return new Intl.ListFormat(locale, { type: "disjunction" }).format(values);
}

export function monthsLong(months: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "month",
    unitDisplay: "long",
  }).format(months);
}

function embargoLine(
  record: SelfArchivingRecord,
  wu: WorkspaceUiStrings,
  locale: string,
): string | undefined {
  const months = record.embargoMonths;
  if (months === undefined) return undefined;
  if (months === 0) return wu.wlArchivingNoEmbargo;
  const duration = monthsLong(months, locale);
  return record.embargoEnd
    ? fill(wu.wlArchivingEmbargo, { duration, date: record.embargoEnd })
    : fill(wu.wlArchivingEmbargoDuration, { duration });
}

export function publisherPolicyLines(
  record: SelfArchivingRecord,
  wu: WorkspaceUiStrings,
  locale: string,
): PublisherPolicyLines {
  const retrieved = record.retrievedAt.slice(0, 10);
  const source = POLICY_SOURCE_NAME[record.source];
  const dates = record.recordUpdated
    ? fill(wu.wlArchivingDates, { source, updated: record.recordUpdated, retrieved })
    : fill(wu.wlArchivingRetrieved, { source, retrieved });
  if (!record.canArchive) {
    return {
      // Open Policy Finder records routes; none of them is one SigmaCV can name.
      summary:
        record.source === "open-policy-finder"
          ? wu.wlArchivingOpfNoRoute
          : fill(wu.wlArchivingNotAllowed, { source }),
      details: [],
      dates,
      policyUrl: record.policyUrl,
    };
  }
  const versions = record.versions.length
    ? orList(
        record.versions.map((v) => wu[VERSION_KEY[v]]),
        locale,
      )
    : wu.wlArchivingVersionUnstated;
  const details = [
    record.locations.length
      ? fill(wu.wlArchivingWhere, { locations: orList(record.locations, locale) })
      : undefined,
    embargoLine(record, wu, locale),
    record.licence ? fill(wu.wlArchivingLicence, { licence: record.licence }) : undefined,
    record.conditions?.length
      ? fill(wu.wlArchivingConditions, { conditions: record.conditions.join("; ") })
      : undefined,
  ].filter((line): line is string => line !== undefined);
  return {
    summary: fill(wu.wlArchivingAllowed, { source, versions }),
    details,
    dates,
    statement: record.depositStatement,
    policyUrl: record.policyUrl,
  };
}

export interface StatutoryLine {
  text: string;
  /** "Recorded on <date>." or the pending wording — never a date for a draft. */
  verification: string;
  sourceUrl: string;
  /** "legal text" when the source is the text itself, else "guidance". */
  sourceLabel: string;
  guidanceUrl?: string;
}

export function statutoryLine(
  entry: StatutoryArchivingEntry,
  wu: WorkspaceUiStrings,
  locale: string,
): StatutoryLine {
  const country = new Intl.DisplayNames([locale], { type: "region" }).of(entry.countryCode);
  return {
    text: fill(wu[KIND_KEY[entry.kind]], {
      /* v8 ignore next -- DisplayNames answers every ISO code the table holds */
      country: country ?? entry.countryCode,
      instrument: entry.instrument,
      statements: entry.statements.join("; "),
    }),
    verification:
      entry.verifiedBy === "maintainer"
        ? fill(wu.wlStatutoryRecorded, { date: entry.lastVerified })
        : wu.wlStatutoryPending,
    sourceUrl: entry.sourceUrl,
    sourceLabel:
      entry.sourceKind === "legal-text"
        ? wu.wlStatutorySourceLink
        : entry.sourceKind === "policy-text"
          ? wu.wlStatutoryPolicyLink
          : wu.wlStatutoryGuidanceLink,
    guidanceUrl: entry.guidanceUrl,
  };
}

/**
 * Why the deposit is allowed today, in one sentence: the work's own licence (the
 * published version), the publisher's recorded permission (the version, the
 * record's date, the embargo's end or its absence) or the statutory right (its
 * instrument, country and delay). The conditions
 * stay in the record below the row; this line names the ground, not a verdict.
 */
export function depositNowLine(
  now: DepositNow,
  item: Pick<CvItem, "meta">,
  wu: WorkspaceUiStrings,
  locale: string,
  /** The action is "only if your agreement allows it" (the record does not cover its place). */
  hedged = false,
): string {
  if (now.basis === "licence") {
    return fill(wu.wlWhyLicence, { licence: item.meta.license! });
  }
  if (now.basis === "publisher") {
    const record = item.meta.selfArchiving!;
    // The version is the action's and the file line's to name; this is the ground.
    // Under a hedged action it says where the policy allows the deposit, never
    // "allowed" for a place the record does not cover.
    const source = POLICY_SOURCE_NAME[record.source];
    const date = record.recordUpdated ?? record.retrievedAt.slice(0, 10);
    const head = hedged
      ? fill(wu.wlWhyPublisherPlaces, {
          source,
          date,
          locations: orList(record.locations, locale),
        })
      : fill(wu.wlWhyPublisher, { source, date });
    const tail = now.since ? fill(wu.wlWhyEmbargoEnded, { date: now.since }) : wu.wlWhyNoEmbargo;
    return `${head} ${tail}`;
  }
  const entry = now.entry!;
  const params = {
    instrument: entry.instrument,
    /* v8 ignore next -- DisplayNames answers every ISO code the table holds */
    country:
      new Intl.DisplayNames([locale], { type: "region" }).of(entry.countryCode) ??
      entry.countryCode,
  };
  return now.since
    ? fill(wu.wlWhyStatute, {
        ...params,
        duration: monthsLong(entry.delayMonths!, locale),
        date: now.since,
      })
    : fill(wu.wlWhyStatuteNoDelay, params);
}
