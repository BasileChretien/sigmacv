import { sectionTitle, type Locale } from "@/lib/i18n";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import { OPEN_ACCESS_STATES, type OpenAccessState } from "@/lib/cv/worklist";
import { UNKNOWN_YEAR } from "@/lib/institutions/cvAggregates";
import type { InstitutionFigures } from "@/lib/institutions/institutions";

/**
 * "Figures from researchers who chose to be counted here" on the institution
 * page: the k-anonymous sum (`aggregateSum.ts`) of the stored per-CV aggregates
 * of the researchers who gave the PINNED institution-page consent — their own
 * figures, never OpenAlex's, and never related to the OAI-set count above it
 * (each is a count with its own sentence). Rendered from the summary alone;
 * this component, like the whole page, never calls out.
 *
 * Counts, in tables: works by year with the four open-access states of the
 * owner worklist as columns (its labels reused, not redefined) and the year's
 * total as the explicit denominator; then works by section. A suppressed cell
 * reads "fewer than k researchers". No chart, no percentage, no name, no
 * per-person column and no link to any CV (the "Employment claims" veto: the
 * only anchor-free section of the page). Below k contributors, one sentence.
 */
export default function InstitutionFiguresSection({
  locale,
  figures,
}: {
  locale: Locale;
  figures: InstitutionFigures;
}) {
  const s = institutionStrings(locale);
  const k = figures.k;
  const num = new Intl.NumberFormat(locale);
  const pending = figures.pending > 0 && (
    <p>{fillInstitutionString(s.figuresPending, { pending: num.format(figures.pending) })}</p>
  );
  const truncated = figures.truncated && (
    <p className="muted">
      {fillInstitutionString(s.figuresTruncated, { limit: num.format(figures.limit) })}
    </p>
  );
  if (figures.contributors < k) {
    return (
      <section className="inst-figures">
        <h2>{s.figuresHeading}</h2>
        <p>{fillInstitutionString(s.figuresBelowK, { k })}</p>
        {pending}
        {truncated}
      </section>
    );
  }
  const wl = workspaceUi(locale);
  const oaLabel: Record<OpenAccessState, string> = {
    "open-cc": wl.wlStateOpenCc,
    "open-other": wl.wlStateOpenOther,
    "no-open-copy-found": wl.wlStateClosed,
    "not-determined": wl.wlStateUnknown,
  };
  const suppressed = fillInstitutionString(s.figuresSuppressed, { k });
  const cell = (value: { count: number } | null, key: string) =>
    value ? (
      <td key={key} className="num">
        {num.format(value.count)}
      </td>
    ) : (
      <td key={key} className="num muted">
        {suppressed}
      </td>
    );
  return (
    <section className="inst-figures">
      <h2>{s.figuresHeading}</h2>
      <p>
        {fillInstitutionString(s.figuresContributors, { count: num.format(figures.contributors) })}
      </p>
      {pending}
      {truncated}
      <p>{fillInstitutionString(s.figuresScope, { k })}</p>
      <p>{s.figuresNotCompared}</p>

      <h3>{s.figuresByYearHeading}</h3>
      <div className="inst-table-wrap">
        <table className="inst-table">
          <thead>
            <tr>
              <th scope="col">{s.figuresColYear}</th>
              <th scope="col" className="num">
                {s.figuresColTotal}
              </th>
              {OPEN_ACCESS_STATES.map((st) => (
                <th key={st} scope="col" className="num">
                  {oaLabel[st]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {figures.byYear.map((row) => (
              <tr key={row.year}>
                <th scope="row">{row.year === UNKNOWN_YEAR ? s.figuresYearUnknown : row.year}</th>
                {cell(row.total, "total")}
                {OPEN_ACCESS_STATES.map((st) => cell(row.oa[st], st))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3>{s.figuresByTypeHeading}</h3>
      <div className="inst-table-wrap">
        <table className="inst-table">
          <thead>
            <tr>
              <th scope="col">{s.figuresColSection}</th>
              <th scope="col" className="num">
                {s.figuresColWorks}
              </th>
            </tr>
          </thead>
          <tbody>
            {figures.byType.map((row) => (
              <tr key={row.type}>
                <td>{sectionTitle(locale, row.type)}</td>
                {cell(row.cell, "works")}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
