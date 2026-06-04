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
  const max = Math.max(1, ...points.map((p) => p.value));
  const labelEvery = points.length > 8 ? 2 : 1; // avoid crowding x-axis labels
  return points
    .map((p, i) => {
      const h = Math.round((p.value / max) * CHART_H);
      const x = i * (BAR_W + GAP);
      const y = CHART_H - h;
      const showLabel = i % labelEvery === 0 || i === points.length - 1;
      const yearLabel = showLabel
        ? `<text x="${x + BAR_W / 2}" y="${CHART_H + 11}" font-size="7" text-anchor="middle" fill="#777">${escapeXml(p.label.slice(2))}</text>`
        : "";
      return `<rect x="${x}" y="${y}" width="${BAR_W}" height="${h}" rx="1" fill="${fill}"><title>${escapeXml(p.label)}: ${p.value}</title></rect>${yearLabel}`;
    })
    .join("");
}

/** HTML <figure> chart (accent bars via the CSS variable). */
function barChart(title: string, points: Point[]): string {
  const width = chartWidth(points);
  return `<figure class="cv-chart">
  <figcaption>${escapeXml(title)}</figcaption>
  <svg viewBox="0 0 ${width} ${SVG_H}" width="${width}" height="${SVG_H}" role="img" aria-label="${escapeXml(title)}">${bars(points, "var(--cv-accent)")}</svg>
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
  return [...byYear.entries()].map(([year, v]) => ({ year, works: v.works, citations: v.citations }));
}

/** Per-year publication + citation points (last 12 years), or null when charts
 *  are disabled / there's too little data. */
function chartPoints(cv: CanonicalCv): { pubs: Point[]; cites: Point[] } | null {
  if (!cv.display.showCharts) return null;
  const data = curatedCountsByYear(cv)
    .sort((a, b) => a.year - b.year)
    .slice(-12);
  if (data.length < 2) return null;
  return {
    pubs: data.map((d) => ({ label: String(d.year), value: d.works })),
    cites: data.map((d) => ({ label: String(d.year), value: d.citations })),
  };
}

/** Render the charts block, or "" when disabled / insufficient data. */
export function renderChartsHtml(cv: CanonicalCv): string {
  const pts = chartPoints(cv);
  if (!pts) return "";
  const s = renderStrings(cv.display.locale);
  return `<div class="cv-charts">${barChart(s.chartPublicationsPerYear, pts.pubs)}${barChart(s.chartCitationsPerYear, pts.cites)}</div>`;
}

/** The same charts as standalone SVGs for embedding in the DOCX (neutral bars,
 *  since the .docx is plain). Empty when charts are off / data is too sparse. */
export function cvChartSvgs(cv: CanonicalCv): ChartSvg[] {
  const pts = chartPoints(cv);
  if (!pts) return [];
  const s = renderStrings(cv.display.locale);
  const mk = (caption: string, points: Point[]): ChartSvg => {
    const width = chartWidth(points);
    return {
      caption,
      width,
      height: SVG_H,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${SVG_H}" width="${width}" height="${SVG_H}">${bars(points, "#444444")}</svg>`,
    };
  };
  return [mk(s.chartPublicationsPerYear, pts.pubs), mk(s.chartCitationsPerYear, pts.cites)];
}
