import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import {
  openAlexInstitutionUrl,
  type InstitutionOpenAlexSnapshot,
} from "@/lib/institutions/institutions";
import { OA_STATUS_ORDER, TOP_N, type InstitutionAggregates } from "@/lib/institutions/snapshot";

/**
 * "OpenAlex's record of this organisation" on the institution page: rendered
 * ONLY from the snapshot the internal resync job stored on the `Institution`
 * row (`snapshot.ts`) — this component, like the whole page, never calls out.
 * With no stored row it says so and shows nothing else.
 *
 * Counts, in tables: works by year, OA status by year with the year's total as
 * the explicit denominator, then the top co-author countries and the top
 * co-affiliated organisations. No ratio, no percentage, no share axis — the
 * plan's "Compliance verdicts" veto — and a sentence saying these are
 * OpenAlex's figures about the organisation, not about the listed researchers,
 * and that the two are not compared.
 */
export default function InstitutionOpenAlexSection({
  locale,
  snapshot,
}: {
  locale: Locale;
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
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(snapshot.fetchedAt),
  );
  const entityUrl = openAlexInstitutionUrl(snapshot.openalexId);
  const statuses = oaStatusColumns(a);
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
      <CountTable
        columns={[s.openalexColYear, ...statuses, s.openalexColTotal]}
        rows={oaRowsByYear(a, statuses).map((r) => ({
          key: r.year,
          head: r.year,
          counts: [...r.counts, r.total],
        }))}
        num={num}
      />

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
    </>
  );
}

/** A table of counts: a label column, then right-aligned numeric columns. A
 *  year row is a row header (`th scope="row"`); a name row is a plain cell.
 *  Wide tables scroll inside the wrapper, never the page. */
function CountTable({
  columns,
  rows,
  num,
}: {
  columns: string[];
  rows: Array<{ key: string | number; head: ReactNode; counts: number[] }>;
  num: Intl.NumberFormat;
}) {
  return (
    <div className="inst-table-wrap">
      <table className="inst-table">
        <thead>
          <tr>
            {columns.map((label, i) => (
              <th key={label} scope="col" className={i === 0 ? undefined : "num"}>
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
 *  absent) and the year's total — the denominator, stated, never divided. */
function oaRowsByYear(
  a: InstitutionAggregates,
  statuses: string[],
): Array<{ year: number; counts: number[]; total: number }> {
  return a.worksByYear.map(({ year }) => {
    const byStatus = new Map<string, number>();
    for (const r of a.oaByStatusByYear) if (r.year === year) byStatus.set(r.status, r.count);
    const counts = statuses.map((st) => byStatus.get(st) ?? 0);
    return { year, counts, total: counts.reduce((sum, c) => sum + c, 0) };
  });
}
