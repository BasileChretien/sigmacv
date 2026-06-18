import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { countableWorks } from "./countable";
import { escapeHtml } from "./escape";

/**
 * Tiny, dependency-free inline-SVG bar charts for the CV — publications and
 * citations per year. The HTML/PDF use the accent colour via the `--cv-accent`
 * CSS variable; the DOCX embeds the SAME charts as standalone SVG images
 * (concrete colours, since CSS variables don't resolve outside HTML).
 */

interface Point {
  label: string;
  value: number;
}

/** A standalone chart ready to embed in a .docx as an SVG image. */
export interface ChartSvg {
  caption: string;
  svg: string;
  width: number;
  height: number;
}

const BAR_W = 12;
const GAP = 4;
const CHART_H = 64;
const SVG_H = CHART_H + 14;

const escapeXml = escapeHtml;

const chartWidth = (points: Point[]): number => Math.max(points.length * (BAR_W + GAP), 1);

/** The bars + year labels (the SVG body), with a caller-supplied bar fill. */
function bars(points: Point[], fill: string): string {
  // LINEAR scale. The chart now shows only publications-per-year — small integers
  // — so a linear axis is honest and legible at this size. (A log bar is
  // undecodable to a reader without a y-axis, and the y-axis won't fit here; log
  // was only there to keep a 1-citation year visible next to a 200-citation year,
  // and the citations chart is gone — see chartPoints.) The <title> keeps the raw
  // count for the hover tooltip.
  const max = Math.max(0, ...points.map((p) => p.value));
  const labelEvery = points.length > 8 ? 2 : 1; // avoid crowding x-axis labels
  return points
    .map((p, i) => {
      /* v8 ignore next -- a charted year always has ≥1 publication, so max>0 */
      const h = max > 0 ? Math.round((Math.max(0, p.value) / max) * CHART_H) : 0;
      const x = i * (BAR_W + GAP);
      const y = CHART_H - h;
      const showLabel = i % labelEvery === 0 || i === points.length - 1;
      const yearLabel = showLabel
        ? `<text x="${x + BAR_W / 2}" y="${CHART_H + 11}" font-size="7" text-anchor="middle" fill="#595959">${escapeXml(p.label.slice(2))}</text>`
        : "";
      return `<rect x="${x}" y="${y}" width="${BAR_W}" height="${h}" rx="1" fill="${fill}"><title>${escapeXml(p.label)}: ${p.value}</title></rect>${yearLabel}`;
    })
    .join("");
}

/** HTML <figure> chart (accent bars via the CSS variable). */
function barChart(title: string, points: Point[]): string {
  const width = chartWidth(points);
  // Fold the data series into the accessible name so the chart isn't content-free
  // to a screen-reader or touch user (the per-bar counts otherwise live only in the
  // mouse-hover <title> tooltips — WCAG 1.1.1).
  const series = points.map((p) => `${p.label}: ${p.value}`).join(", ");
  return `<figure class="cv-chart">
  <figcaption>${escapeXml(title)}</figcaption>
  <svg viewBox="0 0 ${width} ${SVG_H}" width="${width}" height="${SVG_H}" role="img" aria-label="${escapeXml(`${title}. ${series}`)}">${bars(points, "var(--cv-accent)")}</svg>
</figure>`;
}

/**
 * Per-year counts derived from the CURATED work items — so works marked "not
 * mine" or hidden are excluded (the build-time `owner.countsByYear` is the whole
 * OpenAlex author aggregate and would keep counting removed works). PREPRINTS
 * are excluded too: the charts summarise peer-reviewed-style output, not the
 * preprint section. "works" is the number of kept publications that year;
 * "citations" is their total cited-by count.
 */
export function curatedCountsByYear(
  cv: CanonicalCv,
): { year: number; works: number; citations: number }[] {
  const byYear = new Map<number, { works: number; citations: number }>();
  for (const item of countableWorks(cv)) {
    const year = item.meta.year;
    if (typeof year !== "number" || !Number.isFinite(year)) continue;
    const e = byYear.get(year) ?? { works: 0, citations: 0 };
    e.works += 1;
    e.citations += item.meta.citedByCount ?? 0;
    byYear.set(year, e);
  }
  return [...byYear.entries()].map(([year, v]) => ({
    year,
    works: v.works,
    citations: v.citations,
  }));
}

/**
 * Per-year PUBLICATION points (last 12 years), or null when charts are disabled /
 * there's too little data. Citations-per-year was deliberately dropped: on a
 * recent-weighted window it is depressed by citation lag — the most recent years
 * look near-empty regardless of the work's eventual impact — so a per-year
 * citation bar misleads a reader more than it informs. Publications-per-year is an
 * honest output/activity trace.
 */
function chartPoints(cv: CanonicalCv): Point[] | null {
  if (!cv.display.showCharts) return null;
  const data = curatedCountsByYear(cv)
    .sort((a, b) => a.year - b.year)
    .slice(-12);
  if (data.length < 2) return null;
  return data.map((d) => ({ label: String(d.year), value: d.works }));
}

/** Render the (single, publications-per-year) chart block, or "" when disabled /
 *  insufficient data. */
export function renderChartsHtml(cv: CanonicalCv): string {
  const pts = chartPoints(cv);
  if (!pts) return "";
  const s = renderStrings(cv.display.locale);
  return `<div class="cv-charts">${barChart(s.chartPublicationsPerYear, pts)}</div>`;
}

/** The same (single, publications-per-year) chart as a standalone SVG for
 *  embedding in the DOCX (neutral bars, since the .docx is plain). Empty when
 *  charts are off / data is too sparse. */
export function cvChartSvgs(cv: CanonicalCv): ChartSvg[] {
  const pts = chartPoints(cv);
  if (!pts) return [];
  const s = renderStrings(cv.display.locale);
  const width = chartWidth(pts);
  return [
    {
      caption: s.chartPublicationsPerYear,
      width,
      height: SVG_H,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${SVG_H}" width="${width}" height="${SVG_H}">${bars(pts, "#444444")}</svg>`,
    },
  ];
}
