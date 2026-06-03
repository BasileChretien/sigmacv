import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { escapeHtml } from "./escape";

/**
 * Tiny, dependency-free inline-SVG bar charts for the CV header — publications
 * and citations per year. SVG works in both the HTML preview and the headless-
 * Chromium PDF, and carries no script (CSP-safe). Bars use the accent colour
 * via the `--cv-accent` CSS variable defined by the template's common CSS.
 *
 * Text formats (Markdown / LaTeX / DOCX) don't include charts.
 */

interface Point {
  label: string;
  value: number;
}

const BAR_W = 12;
const GAP = 4;
const CHART_H = 64;

const escapeXml = escapeHtml;

function barChart(title: string, points: Point[]): string {
  const max = Math.max(1, ...points.map((p) => p.value));
  const width = points.length * (BAR_W + GAP);
  const labelEvery = points.length > 8 ? 2 : 1; // avoid crowding x-axis labels

  const bars = points
    .map((p, i) => {
      const h = Math.round((p.value / max) * CHART_H);
      const x = i * (BAR_W + GAP);
      const y = CHART_H - h;
      const showLabel = i % labelEvery === 0 || i === points.length - 1;
      const yearLabel = showLabel
        ? `<text x="${x + BAR_W / 2}" y="${CHART_H + 11}" font-size="7" text-anchor="middle" fill="#777">${escapeXml(p.label.slice(2))}</text>`
        : "";
      return `<rect x="${x}" y="${y}" width="${BAR_W}" height="${h}" rx="1" fill="var(--cv-accent)"><title>${escapeXml(p.label)}: ${p.value}</title></rect>${yearLabel}`;
    })
    .join("");

  return `<figure class="cv-chart">
  <figcaption>${escapeXml(title)}</figcaption>
  <svg viewBox="0 0 ${Math.max(width, 1)} ${CHART_H + 14}" width="${Math.max(width, 1)}" height="${CHART_H + 14}" role="img" aria-label="${escapeXml(title)}">${bars}</svg>
</figure>`;
}

/**
 * Render the charts block, or "" when disabled / insufficient data. Uses the
 * last 12 years of OpenAlex per-year counts.
 */
export function renderChartsHtml(cv: CanonicalCv): string {
  if (!cv.display.showCharts) return "";
  const data = [...(cv.owner.countsByYear ?? [])]
    .filter((d) => Number.isFinite(d.year))
    .sort((a, b) => a.year - b.year)
    .slice(-12);
  if (data.length < 2) return "";

  const s = renderStrings(cv.display.locale);
  const pubs = barChart(
    s.chartPublicationsPerYear,
    data.map((d) => ({ label: String(d.year), value: d.works })),
  );
  const cites = barChart(
    s.chartCitationsPerYear,
    data.map((d) => ({ label: String(d.year), value: d.citations })),
  );
  return `<div class="cv-charts">${pubs}${cites}</div>`;
}
