import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import {
  openAlexInstitutionUrl,
  type InstitutionOpenAlexSnapshot,
} from "@/lib/institutions/institutions";
import {
  MIN_SHARE_DENOMINATOR,
  oaShareByYear,
  previousReading,
  yearsWhereTotalsDiffer,
  type OaShareRow,
  type OaShareWithheld,
  type PreviousReading,
} from "@/lib/institutions/oaShare";
import { OA_STATUS_ORDER, TOP_N, type InstitutionAggregates } from "@/lib/institutions/snapshot";
import { localeInstitutionComparePath } from "@/lib/seo";

/**
 * "OpenAlex's record of this organisation" on the institution page: rendered
 * ONLY from the snapshot the internal resync job stored on the `Institution`
 * row (`snapshot.ts`) — this component, like the whole page, never calls out.
 * With no stored row it says so and shows nothing else.
 *
 * Counts, in tables: works by year, OA status by year with the year's number
 * of works with a status as the explicit denominator, then the top co-author
 * countries and the top co-affiliated organisations, and — for a row refreshed
 * since 2026-09-10 — the field mix (works by the OpenAlex domain of their
 * primary topic, with that request's own total), so a reader can see whether
 * two organisations are alike before reading their shares. The one derived figure
 * is the open share (`oaShare.ts`): a whole percent printed beside both of
 * its counts, withheld below the floor and for the incomplete current year,
 * with its definition and limits stated above the table. No sort, no
 * difference, no axis — and a sentence saying these are OpenAlex's figures
 * about the organisation, not about the listed researchers, and that the two
 * are not compared.
 */
export default function InstitutionOpenAlexSection({
  locale,
  rorId,
  snapshot,
}: {
  locale: Locale;
  /** The page's bare ROR id: pre-fills the comparison view's picker. */
  rorId: string;
  snapshot: InstitutionOpenAlexSnapshot | null;
}) {
  const s = institutionStrings(locale);
  if (!snapshot) {
    return (
      <>
        <h2>{s.openalexHeading}</h2>
        <p>{s.openalexNotFetched}</p>
      </>
    );
  }
  const a = snapshot.aggregates;
  const num = new Intl.NumberFormat(locale);
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(snapshot.fetchedAt),
  );
  const entityUrl = openAlexInstitutionUrl(snapshot.openalexId);
  const statuses = oaStatusColumns(a);
  const shares = oaShareByYear(a);
  const differing = yearsWhereTotalsDiffer(a);
  const previous = previousReading(a, snapshot.previous);
  return (
    <>
      <h2>{s.openalexHeading}</h2>
      <p>
        {fillInstitutionString(s.openalexCountedEntity, {
          id: snapshot.openalexId,
          entityName: a.countedEntity.displayName,
          lineage: num.format(a.countedEntity.lineageSize),
          related: num.format(a.countedEntity.relatedCount),
        })}{" "}
        <a href={entityUrl}>{entityUrl}</a>
      </p>
      <p>{fillInstitutionString(s.openalexScope, { from: a.years.from, to: a.years.to })}</p>
      <p>{s.openalexNotCompared}</p>

      <h3>{s.openalexWorksByYearHeading}</h3>
      <CountTable
        columns={[s.openalexColYear, s.openalexColWorks]}
        rows={a.worksByYear.map((r) => ({ key: r.year, head: r.year, counts: [r.count] }))}
        num={num}
      />

      <h3>{s.openalexOaByYearHeading}</h3>
      <p className="muted">{s.openalexOaNote}</p>
      <p className="muted">
        {fillInstitutionString(s.openalexShareNote, { floor: num.format(MIN_SHARE_DENOMINATOR) })}
      </p>
      <CountTable
        columns={[s.openalexColYear, ...statuses, s.openalexColTotal, s.openalexColShare]}
        rows={oaRowsByYear(a, statuses, shares).map((r) => ({
          key: r.year,
          head: r.year,
          counts: [...r.counts, r.share.known],
          tail: shareCell(r.share, s, num, pct),
        }))}
        num={num}
      />
      {differing.length > 0 && (
        <p className="muted">
          {fillInstitutionString(s.openalexTotalsDiffer, {
            // "2023 and 2024" / "2023、2024": the locale's own list separators.
            years: new Intl.ListFormat(locale, { type: "conjunction" }).format(
              differing.map(String),
            ),
          })}
        </p>
      )}
      {previous && <p className="muted">{previousReadingLine(previous, s, locale, num, pct)}</p>}

      {a.domains && (
        <>
          <h3>{s.openalexDomainsHeading}</h3>
          <p className="muted">
            {fillInstitutionString(s.openalexDomainsNote, {
              from: a.years.from,
              to: a.years.to,
              total: num.format(a.domains.total),
            })}
          </p>
          <CountTable
            columns={[s.openalexColDomain, s.openalexColWorks]}
            rows={a.domains.byDomain.map((r) => ({
              key: r.id,
              head: r.name || r.id,
              counts: [r.count],
            }))}
            num={num}
          />
        </>
      )}

      <h3>{fillInstitutionString(s.openalexCountriesHeading, { n: TOP_N })}</h3>
      <p className="muted">{s.openalexCountriesNote}</p>
      <CountTable
        columns={[s.openalexColCountry, s.openalexColWorks]}
        rows={a.topCountries.map((r) => ({
          key: r.code,
          head: r.name || r.code,
          counts: [r.count],
        }))}
        num={num}
      />

      <h3>{fillInstitutionString(s.openalexCoAffiliationsHeading, { n: TOP_N })}</h3>
      <p className="muted">{s.openalexCoAffiliationsNote}</p>
      <CountTable
        columns={[s.openalexColOrganisation, s.openalexColWorks]}
        rows={a.topCoAffiliations.map((r) => ({
          key: r.openalexId,
          head: <a href={openAlexInstitutionUrl(r.openalexId)}>{r.name || r.openalexId}</a>,
          counts: [r.count],
        }))}
        num={num}
      />

      <p className="muted">{fillInstitutionString(s.openalexAsOf, { date })}</p>
      <p>
        <Link href={localeInstitutionComparePath(locale, `ror=${rorId}`)}>
          {s.openalexCompareLink}
        </Link>
      </p>
    </>
  );
}

/** "At the previous reading (date), year stood at open / known = n %": the
 *  stability signal, both readings visible, never a difference between them. */
export function previousReadingLine(
  previous: PreviousReading,
  s: ReturnType<typeof institutionStrings>,
  locale: string,
  num: Intl.NumberFormat,
  pct: Intl.NumberFormat,
): string {
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(previous.fetchedAt),
  );
  return fillInstitutionString(s.openalexPreviousReading, {
    date,
    year: previous.year,
    open: num.format(previous.open),
    known: num.format(previous.known),
    pct: pct.format(previous.percent / 100),
  });
}

/** The share cell: `open / known = n %` with both counts in the same cell as
 *  the figure, or the stated reason it is withheld. */
function shareCell(
  share: OaShareRow,
  s: ReturnType<typeof institutionStrings>,
  num: Intl.NumberFormat,
  pct: Intl.NumberFormat,
): ReactNode {
  if (share.percent === null) {
    return <span className="inst-share-withheld">{withheldLabel(share.withheld!, s)}</span>;
  }
  return `${num.format(share.open)} / ${num.format(share.known)} = ${pct.format(share.percent / 100)}`;
}

/** Exhaustive over the reasons `oaShare.ts` can give: a new reason is a type
 *  error here, never a wrong sentence in ten locales. */
function withheldLabel(w: OaShareWithheld, s: ReturnType<typeof institutionStrings>): string {
  switch (w) {
    case "partial-year":
      return s.openalexShareIncomplete;
    case "small-denominator":
      return s.openalexShareFew;
  }
}

/** A table of counts: a label column, then right-aligned numeric columns, and
 *  optionally one trailing text cell (the share). A year row is a row header
 *  (`th scope="row"`); a name row is a plain cell. Wide tables scroll inside
 *  the wrapper, never the page. */
function CountTable({
  columns,
  rows,
  num,
}: {
  columns: string[];
  rows: Array<{ key: string | number; head: ReactNode; counts: number[]; tail?: ReactNode }>;
  num: Intl.NumberFormat;
}) {
  // The trailing text column is pinned to the right edge on narrow screens
  // (CSS `inst-share`); its header must carry the class too.
  const tailHeader = rows.some((r) => r.tail !== undefined) ? columns.length - 1 : -1;
  return (
    <div className="inst-table-wrap">
      <table className="inst-table">
        <thead>
          <tr>
            {columns.map((label, i) => (
              <th
                key={label}
                scope="col"
                className={i === 0 ? undefined : i === tailHeader ? "num inst-share" : "num"}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {typeof row.head === "number" ? <th scope="row">{row.head}</th> : <td>{row.head}</td>}
              {row.counts.map((count, i) => (
                <td key={columns[i + 1]} className="num">
                  {num.format(count)}
                </td>
              ))}
              {row.tail !== undefined && <td className="num inst-share">{row.tail}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The OA-status columns: OpenAlex's known statuses in their fixed order, then
 *  any status the stored data carries that the list does not know, so a new
 *  status is shown rather than silently dropped from the total. */
function oaStatusColumns(a: InstitutionAggregates): string[] {
  const known = new Set<string>(OA_STATUS_ORDER);
  const present = new Set(a.oaByStatusByYear.map((r) => r.status));
  const extra = [...present].filter((st) => !known.has(st)).sort();
  return [...OA_STATUS_ORDER, ...extra];
}

/** One row per year of the window: the count per status column (zero when
 *  absent) and the year's share row, whose `known` is the stated total — the
 *  number of works with a status, summed from the same OpenAlex request as
 *  the columns, so the columns always add up to it. The works-by-year table
 *  comes from another request and can differ slightly; the page names the
 *  years where it does. */
function oaRowsByYear(
  a: InstitutionAggregates,
  statuses: string[],
  shares: OaShareRow[],
): Array<{ year: number; counts: number[]; share: OaShareRow }> {
  return shares.map((share) => {
    const byStatus = new Map<string, number>();
    for (const r of a.oaByStatusByYear) if (r.year === share.year) byStatus.set(r.status, r.count);
    const counts = statuses.map((st) => byStatus.get(st) ?? 0);
    return { year: share.year, counts, share };
  });
}
