import Link from "next/link";
import type { ReactNode } from "react";
import { asLocale } from "@/lib/i18n";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import { institutionCompareStrings } from "@/lib/i18n/institutionsCompare";
import {
  MAX_COMPARED,
  SNAPSHOT_SKEW_DAYS,
  type ComparableInstitution,
  type CompareColumn,
  type CompareShareRow,
  type CompareWithheld,
  type InstitutionComparison,
} from "@/lib/institutions/compare";
import { openAlexInstitutionUrl } from "@/lib/institutions/institutions";
import { MIN_SHARE_DENOMINATOR } from "@/lib/institutions/oaShare";
import { MAX_FOLDED_IDS, OA_STATUS_ORDER } from "@/lib/institutions/snapshot";
import {
  localeHomePath,
  localeInstitutionComparePath,
  localeInstitutionPath,
  localeInstitutionsIndexPath,
} from "@/lib/seo";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The comparison view: two or three organisations' OpenAlex records side by
 * side (`compare.ts`), or — with fewer than two — the picker. Rendered from the
 * stored snapshots only; nothing here calls out. The page's structure is its
 * argument: the method box and the field label come BEFORE the numbers, the
 * columns are alphabetical and each carries its own total and as-of date, the
 * share sits in one cell with both of its counts (and is spoken with them
 * named), and there is no sort, no difference, no chart and no third column
 * SigmaCV chose. Shared by `/i/compare` and `/[locale]/i/compare`; `lang` is
 * set on the subtree. The page is wider than a document page so that three
 * columns really sit side by side (`.inst-compare-page`).
 */

/** Where questions about the page go: the same address as the privacy notice. */
const CONTACT = "privacy@sigmacv.org";

type Strings = ReturnType<typeof institutionCompareStrings>;

export default function InstitutionCompare({
  locale,
  comparison,
  picker,
}: {
  locale: string;
  comparison: InstitutionComparison;
  picker: ComparableInstitution[];
}) {
  const loc = asLocale(locale);
  const c = institutionCompareStrings(loc);
  const s = institutionStrings(loc);
  const num = new Intl.NumberFormat(loc);
  const ready = comparison.columns.length >= 2;
  const floor = num.format(MIN_SHARE_DENOMINATOR);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page inst-compare-page" id="site-main">
        <p className="muted">
          <Link href={localeInstitutionsIndexPath(loc)}>{s.backToIndex}</Link>
        </p>
        <h1>{c.heading}</h1>
        <p className="doc-lede">{c.promise}</p>

        {ready ? (
          <Comparison locale={loc} c={c} comparison={comparison} num={num} floor={floor} />
        ) : (
          <>
            <Picker locale={loc} c={c} picker={picker} comparison={comparison} />
            <Notices c={c} comparison={comparison} floor={floor} />
          </>
        )}

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}

/** One neutral line per requested id that has nothing to show (the id linked
 *  to its ROR record, since no page may exist to name it), and one line when
 *  ids were left out over the cap — never naming those. */
function Notices({
  c,
  comparison,
  floor,
}: {
  c: Strings;
  comparison: InstitutionComparison;
  floor: string;
}) {
  const dropped = comparison.dropped.filter((d) => d.reason !== "over-cap");
  const overCap = comparison.dropped.some((d) => d.reason === "over-cap");
  // `{ror}` leads the sentence in every locale; the id becomes a link.
  const [before, after] = c.dropped.split("{ror}");
  return (
    <>
      {dropped.map((d) => (
        <p key={d.rorId} className="muted">
          {before}
          <a href={`https://ror.org/${d.rorId}`}>{d.rorId}</a>
          {fillInstitutionString(after ?? "", { floor })}
        </p>
      ))}
      {overCap ? (
        <p className="muted">{fillInstitutionString(c.overCap, { max: MAX_COMPARED })}</p>
      ) : null}
    </>
  );
}

/** The picker: a plain GET form over the organisations that can be set side by
 *  side (those with a snapshot among the opted-in sets), nothing pre-chosen
 *  beyond what the URL already carries, capped server-side. */
function Picker({
  locale,
  c,
  picker,
  comparison,
}: {
  locale: string;
  c: Strings;
  picker: ComparableInstitution[];
  comparison: InstitutionComparison;
}) {
  const chosen = new Set(comparison.columns.map((col) => col.rorId));
  return (
    <>
      <p>{c.pickerIntro}</p>
      {picker.length === 0 ? (
        <p className="muted">{c.pickerEmpty}</p>
      ) : (
        <form method="get" action={localeInstitutionComparePath(locale)} className="inst-picker">
          <fieldset>
            <legend>{c.pickerNeedTwo}</legend>
            {picker.map((inst) => (
              <label key={inst.rorId}>
                <input
                  type="checkbox"
                  name="ror"
                  value={inst.rorId}
                  defaultChecked={chosen.has(inst.rorId)}
                />{" "}
                {inst.name}
              </label>
            ))}
          </fieldset>
          <p>
            <button type="submit" className="btn btn-primary">
              {c.pickerSubmit}
            </button>
          </p>
        </form>
      )}
    </>
  );
}

function Comparison({
  locale,
  c,
  comparison,
  num,
  floor,
}: {
  locale: string;
  c: Strings;
  comparison: InstitutionComparison;
  num: Intl.NumberFormat;
  floor: string;
}) {
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  const countries = new Set(comparison.columns.map((col) => col.country).filter(Boolean));
  return (
    <>
      <div className="inst-method">
        <p>{fillInstitutionString(c.method, { floor })}</p>
        <p>
          <strong>{c.label}</strong>
        </p>
        <p>{c.alphabetical}</p>
      </div>
      {comparison.skewed ? (
        <p className="muted">{fillInstitutionString(c.skewNote, { days: SNAPSHOT_SKEW_DAYS })}</p>
      ) : null}

      <div className="inst-compare">
        {comparison.columns.map((col) => (
          <Column
            key={col.rorId}
            locale={locale}
            c={c}
            col={col}
            years={comparison.commonYears}
            num={num}
            pct={pct}
            date={dateFmt}
          />
        ))}
      </div>

      <Notices c={c} comparison={comparison} floor={floor} />
      <p>
        <Link href={localeInstitutionComparePath(locale)}>{c.pickerChange}</Link>
      </p>

      {countries.size > 1 ? <p className="muted">{c.caveatCountries}</p> : null}

      <h2>{c.caveatsHeading}</h2>
      <ul>
        <li>{c.caveatField}</li>
        <li>{c.caveatSize}</li>
        <li>{c.caveatCurrent}</li>
        <li>{c.caveatRecent}</li>
        <li>{c.caveatClosed}</li>
        <li>{fillInstitutionString(c.caveatFolding, { max: MAX_FOLDED_IDS })}</li>
        <li>{c.caveatUniverse}</li>
        <li>{c.caveatDrift}</li>
      </ul>
      <p>{fillInstitutionString(c.disclaimer, { contact: CONTACT })}</p>
    </>
  );
}

/** One organisation's column: its name (linking to its own page), country,
 *  counted entity, as-of date, and its own table — named for assistive
 *  technology by a hidden caption — over the common full years plus its
 *  incomplete year. */
function Column({
  locale,
  c,
  col,
  years,
  num,
  pct,
  date,
}: {
  locale: string;
  c: Strings;
  col: CompareColumn;
  years: number[];
  num: Intl.NumberFormat;
  pct: Intl.NumberFormat;
  date: Intl.DateTimeFormat;
}) {
  const s = institutionStrings(locale);
  const entityUrl = openAlexInstitutionUrl(col.openalexId);
  const statuses = openStatusColumns(col);
  return (
    <section className="inst-compare-col">
      <h2>
        <Link href={localeInstitutionPath(locale, col.rorId)}>{col.name}</Link>
      </h2>
      {col.country ? <p className="muted">{regionName(locale, col.country)}</p> : null}
      <p className="muted">
        {fillInstitutionString(c.entity, { id: col.openalexId, n: num.format(col.foldedCount) })}{" "}
        <a href={entityUrl}>{entityUrl}</a>
      </p>
      <p className="muted">
        {fillInstitutionString(c.asOf, { date: date.format(new Date(col.fetchedAt)) })}
      </p>
      <Sparkline
        col={col}
        years={years}
        label={fillInstitutionString(c.sparklineLabel, { name: col.name })}
      />
      <div className="inst-table-wrap">
        <table className="inst-table">
          <caption className="visually-hidden">{col.name}</caption>
          <thead>
            <tr>
              <th scope="col">{s.openalexColYear}</th>
              <th scope="col" className="num">
                {s.openalexColTotal}
              </th>
              <th scope="col" className="num">
                {c.colOpen}
              </th>
              <th scope="col" className="num">
                {c.colNone}
              </th>
              <th scope="col" className="num inst-share">
                {s.openalexColShare}
              </th>
            </tr>
          </thead>
          <tbody>
            {col.rows.map((r) => (
              <tr key={r.year}>
                <th scope="row">{r.year}</th>
                <td className="num">{num.format(r.known)}</td>
                <td className="num">{num.format(r.open)}</td>
                <td className="num">{num.format(r.closed)}</td>
                <td className="num inst-share">{shareCell(r, c, s, num, pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>{c.statusHeading}</h3>
      <div className="inst-table-wrap">
        <table className="inst-table">
          <caption className="visually-hidden">
            {c.statusHeading} — {col.name}
          </caption>
          <thead>
            <tr>
              <th scope="col">{s.openalexColYear}</th>
              {statuses.map((st) => (
                <th key={st} scope="col" className="num">
                  {st}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {col.rows.map((r) => (
              <tr key={r.year}>
                <th scope="row">{r.year}</th>
                {statuses.map((st) => (
                  <td key={st} className="num">
                    {num.format(r.statuses[st] ?? 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {col.domains ? (
        <>
          <h3>{s.openalexDomainsHeading}</h3>
          <p className="muted">
            {fillInstitutionString(s.openalexDomainsNote, {
              from: col.years.from,
              to: col.years.to,
              total: num.format(col.domains.total),
            })}
          </p>
          <div className="inst-table-wrap">
            <table className="inst-table">
              <caption className="visually-hidden">
                {s.openalexDomainsHeading} — {col.name}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{s.openalexColDomain}</th>
                  <th scope="col" className="num">
                    {s.openalexColWorks}
                  </th>
                </tr>
              </thead>
              <tbody>
                {col.domains.byDomain.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name || d.id}</td>
                    <td className="num">{num.format(d.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}

/** The open statuses in OpenAlex's order (never `closed`, which is the
 *  "none found" column above), then any status the stored rows carry that the
 *  list does not know, so a new one is shown rather than dropped. */
function openStatusColumns(col: CompareColumn): string[] {
  const known = new Set<string>(OA_STATUS_ORDER);
  const present = new Set(col.rows.flatMap((r) => Object.keys(r.statuses)));
  const extra = [...present].filter((st) => !known.has(st) && st !== "closed").sort();
  return [...OA_STATUS_ORDER.filter((st) => st !== "closed"), ...extra];
}

/**
 * One organisation's trajectory: its stated shares over the COMMON full
 * years on a fixed 0–100 axis, one figure per column — never two lines on one
 * plot, never a bar against another column's. A withheld year is a gap, not
 * a zero. With fewer than two stated shares nothing is drawn: a lone dot on
 * a shared axis is a height, not a trajectory. The axis is labelled 0 and
 * 100 and the first and last year are printed (visual only; the accessible
 * name says what the figure is), so the fixed scale is read as one.
 */
function Sparkline({ col, years, label }: { col: CompareColumn; years: number[]; label: string }) {
  const W = 240;
  const H = 68;
  const L = 30;
  const R = 8;
  const T = 8;
  const B = 50;
  const points = years.map((year, i) => {
    const r = col.rows.find((row) => row.year === year);
    if (!r || r.percent === null) return null;
    const x = L + (i * (W - L - R)) / (years.length - 1);
    return { x: Number(x.toFixed(1)), y: Number((B - (r.percent / 100) * (B - T)).toFixed(1)) };
  });
  if (points.filter(Boolean).length < 2) return null;
  const segments: string[] = [];
  let run: string[] = [];
  for (const p of points) {
    if (p) run.push(`${p.x},${p.y}`);
    else {
      if (run.length > 1) segments.push(run.join(" "));
      run = [];
    }
  }
  if (run.length > 1) segments.push(run.join(" "));
  return (
    <svg className="inst-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <title>{label}</title>
      <line className="inst-spark-axis" x1={L} y1={T} x2={W - R} y2={T} />
      <line className="inst-spark-axis" x1={L} y1={B} x2={W - R} y2={B} />
      <text className="inst-spark-label" x={L - 4} y={T + 3} textAnchor="end" aria-hidden="true">
        100
      </text>
      <text className="inst-spark-label" x={L - 4} y={B + 3} textAnchor="end" aria-hidden="true">
        0
      </text>
      <text className="inst-spark-label" x={L} y={H - 2} aria-hidden="true">
        {years[0]}
      </text>
      <text className="inst-spark-label" x={W - R} y={H - 2} textAnchor="end" aria-hidden="true">
        {years[years.length - 1]}
      </text>
      {segments.map((d) => (
        <polyline key={d} points={d} fill="none" />
      ))}
      {points.map((p, i) => (p ? <circle key={years[i]} cx={p.x} cy={p.y} r="2.5" /> : null))}
    </svg>
  );
}

/** The country's name in the reader's language, from its ISO code; the code
 *  itself when the runtime cannot name it. */
function regionName(locale: string, code: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The share cell: `open / known = n %` for the eye, and — because "/" and
 *  "=" are not reliably voiced — the percent with both counts named for the
 *  ear; or the stated reason it is withheld. */
function shareCell(
  r: CompareShareRow,
  c: Strings,
  s: ReturnType<typeof institutionStrings>,
  num: Intl.NumberFormat,
  pct: Intl.NumberFormat,
): ReactNode {
  if (r.percent === null) {
    return (
      <span className="inst-share-withheld">
        {withheldLabel(r.withheld ?? "small-denominator", c)}
      </span>
    );
  }
  const open = num.format(r.open);
  const known = num.format(r.known);
  const share = pct.format(r.percent / 100);
  return (
    <>
      <span aria-hidden="true">{`${open} / ${known} = ${share}`}</span>
      <span className="visually-hidden">
        {`${share} — ${open} ${c.colOpen}, ${known} ${s.openalexColTotal}`}
      </span>
    </>
  );
}

/** Exhaustive over the reasons `compare.ts` can give. */
function withheldLabel(w: CompareWithheld, c: Strings): string {
  switch (w) {
    case "partial-year":
      return c.shareIncomplete;
    case "small-denominator":
      return c.shareFew;
    case "snapshot-skew":
      return c.shareSkew;
  }
}
