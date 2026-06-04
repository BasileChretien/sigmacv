import HTMLtoDOCX from "@turbodocx/html-to-docx";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "./authorship";
import { wrapSelf } from "./emphasize";
import { escapeHtml } from "./escape";
import { textHeader } from "./headerText";
import { parsePhoto, photoBox } from "./image";
import { metricsLineText } from "./metrics";
import { prepareSections, type PreparedSection } from "./prepare";
import { docStyle, type DocStyle } from "./templateStyle";

/**
 * HTML→DOCX renderer. Instead of hand-assembling the document, we emit
 * DOCX-targeted HTML (inline styles, TABLE-based layout — Word has no
 * flexbox/grid) and convert it with @turbodocx/html-to-docx. This carries the
 * template's accent colour, fonts, the coloured sidebar, the photo and the data
 * tables far more faithfully than a hand-built document, while staying a real,
 * editable .docx (not a converted-from-PDF blob).
 *
 * The hand-built `renderCvDocxBuffer` (docx.ts) remains the fallback.
 */

type DocxStrings = ReturnType<typeof renderStrings>;

const INK = "#111827";
const MUTED = "#4b5563";

/** Escaped citation entry with the account holder's name bolded on own works. */
function entryHtml(cv: CanonicalCv, item: PreparedSection["items"][number]): string {
  const escaped = escapeHtml(item.entry);
  if (cv.display.highlightSelf && item.item.authoredBySelf && item.item.selfNameVariants.length > 0) {
    return wrapSelf(escaped, item.item.selfNameVariants.map(escapeHtml), (s) => `<strong>${s}</strong>`);
  }
  return escaped;
}

/** The profile photo as an inline <img> (data URL), scaled to ~92px wide. */
function photoHtml(cv: CanonicalCv, style: DocStyle): string {
  if (style.plain) return "";
  const photo = parsePhoto(cv.owner.photo);
  if (!photo) return "";
  const { width, height } = photoBox(photo, 92);
  return `<p style="margin:0 0 8px;"><img src="${cv.owner.photo}" width="${width}" height="${height}" alt="" /></p>`;
}

/** The masthead (name, headline, ORCID, contact, metrics). On the sidebar's
 *  coloured column text is white + left-aligned; otherwise it follows the
 *  template (centred for Classic, accent name for Modern). */
function mastheadHtml(cv: CanonicalCv, style: DocStyle, s: DocxStrings, onAccent: boolean): string {
  const head = textHeader(cv);
  const align = onAccent ? "left" : style.centeredHeader ? "center" : "left";
  const body = onAccent ? "#ffffff" : INK;
  const muted = onAccent ? "#e5e7eb" : MUTED;
  const nameColor = onAccent ? "#ffffff" : style.accentName && !style.plain ? style.accent : INK;
  const name =
    (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
    (cv.owner.displayName || s.cvFallbackTitle);

  const out: string[] = [];
  out.push(
    `<p style="margin:0 0 4px;font-size:21px;font-weight:bold;color:${nameColor};text-align:${align};">${escapeHtml(name)}</p>`,
  );
  if (head.headline) {
    out.push(`<p style="margin:0 0 4px;font-size:12px;color:${body};text-align:${align};">${escapeHtml(head.headline)}</p>`);
  }
  if (cv.owner.orcid) {
    out.push(`<p style="margin:0 0 2px;font-size:10px;font-style:italic;color:${muted};text-align:${align};">ORCID: ${escapeHtml(cv.owner.orcid)}</p>`);
  }
  if (head.contact.length) {
    out.push(`<p style="margin:0 0 2px;font-size:10px;color:${muted};text-align:${align};">${escapeHtml(head.contact.join("  ·  "))}</p>`);
  }
  const metrics = metricsLineText(cv);
  if (metrics) {
    out.push(`<p style="margin:4px 0 0;font-size:10px;font-style:italic;color:${muted};text-align:${align};">${escapeHtml(metrics)}</p>`);
  }
  return out.join("");
}

/** A section heading with the template's accent rule beneath it. */
function headingHtml(title: string, style: DocStyle): string {
  const color = style.plain ? INK : style.accent;
  const rule = style.plain ? "#9ca3af" : style.accent;
  const text = style.uppercaseHeadings ? title.toUpperCase() : title;
  return `<p style="margin:14px 0 6px;font-size:13px;font-weight:bold;color:${color};border-bottom:1.5px solid ${rule};padding-bottom:2px;">${escapeHtml(text)}</p>`;
}

/** Publications + citations per year as a bordered table. "" when off/short. */
function yearTableHtml(cv: CanonicalCv): string {
  if (!cv.display.showCharts) return "";
  const data = [...(cv.owner.countsByYear ?? [])]
    .filter((d) => Number.isFinite(d.year))
    .sort((a, b) => a.year - b.year)
    .slice(-12);
  if (data.length < 2) return "";
  const s = renderStrings(cv.display.locale);
  const th = "border:1px solid #cbd5e1;padding:3px 9px;font-weight:bold;font-size:10px;";
  const td = "border:1px solid #cbd5e1;padding:3px 9px;font-size:10px;";
  const rows = data
    .map(
      (d) =>
        `<tr><td style="${td}">${d.year}</td><td style="${td}text-align:right;">${d.works}</td><td style="${td}text-align:right;">${d.citations}</td></tr>`,
    )
    .join("");
  return `<table style="border-collapse:collapse;margin:8px 0;"><tr><td style="${th}"></td><td style="${th}">${escapeHtml(
    s.chartPublicationsPerYear,
  )}</td><td style="${th}">${escapeHtml(s.chartCitationsPerYear)}</td></tr>${rows}</table>`;
}

/** The authorship summary as a bordered table (role · "N (P%)"). "" when off/empty. */
function authorshipHtml(cv: CanonicalCv, s: DocxStrings): string {
  if (!cv.display.showAuthorshipTable) return "";
  const rows = authorshipCounts(cv, cv.display.authorshipRoles);
  if (rows.length === 0 || rows.every((r) => r.count === 0)) return "";
  const total = rows[0]?.total ?? 0;
  const td = "border:1px solid #cbd5e1;padding:3px 9px;font-size:10px;";
  const body = rows
    .map(
      (r) =>
        `<tr><td style="${td}">${escapeHtml(authorshipRoleLabel(cv.display.locale, r.role))}</td><td style="${td}text-align:right;">${r.count} (${r.percent}%)</td></tr>`,
    )
    .join("");
  const note = rows.some((r) => r.role === "corresponding")
    ? `<p style="margin:2px 0 8px;font-size:9px;font-style:italic;color:${MUTED};">${escapeHtml(s.authorshipCorrespondingNote)}</p>`
    : "";
  return `<p style="margin:10px 0 3px;font-size:11px;font-weight:bold;">${escapeHtml(s.authorshipCaption)} · n=${total}</p><table style="border-collapse:collapse;margin:0;">${body}</table>${note}`;
}

/** Everything below the masthead: tables, summary, then the sections. */
function bodyHtml(
  cv: CanonicalCv,
  style: DocStyle,
  s: DocxStrings,
  sections: PreparedSection[],
): string {
  const out: string[] = [];
  out.push(yearTableHtml(cv));
  out.push(authorshipHtml(cv, s));
  const head = textHeader(cv);
  if (head.summary) {
    const align = style.centeredHeader ? "text-align:center;" : "";
    out.push(`<p style="margin:8px 0 12px;${align}">${escapeHtml(head.summary)}</p>`);
  }
  for (const { section, items } of sections) {
    if (items.length === 0) continue;
    out.push(headingHtml(section.title, style));
    for (const item of items) {
      out.push(`<p style="margin:0 0 8px;">${entryHtml(cv, item)}</p>`);
    }
  }
  return out.join("");
}

/** Build the DOCX-targeted HTML for the whole CV. */
export function renderCvDocxHtml(cv: CanonicalCv): string {
  const style = docStyle(cv);
  const s = renderStrings(cv.display.locale);
  const sections = prepareSections(cv, "text");
  const font = style.serif ? "Cambria, Georgia, serif" : "Calibri, Arial, sans-serif";

  let inner: string;
  if (style.twoColumn) {
    const left = photoHtml(cv, style) + mastheadHtml(cv, style, s, true);
    const right = bodyHtml(cv, style, s, sections);
    inner =
      `<table style="width:100%;border-collapse:collapse;"><tr>` +
      `<td style="width:34%;background-color:${style.accent};padding:18px 16px;vertical-align:top;">${left}</td>` +
      `<td style="width:66%;padding:18px 16px 18px 24px;vertical-align:top;">${right}</td>` +
      `</tr></table>`;
  } else {
    inner = photoHtml(cv, style) + mastheadHtml(cv, style, s, false) + bodyHtml(cv, style, s, sections);
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:${font};font-size:11pt;color:${INK};">${inner}</body></html>`;
}

/** Render the CV to a .docx by converting its DOCX-targeted HTML. */
export async function renderCvDocxViaHtml(cv: CanonicalCv): Promise<Buffer> {
  const html = renderCvDocxHtml(cv);
  const out = await HTMLtoDOCX(html, null, {
    orientation: "portrait",
    margins: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
    table: { row: { cantSplit: true } },
    footer: false,
    pageNumber: false,
  });
  if (Buffer.isBuffer(out)) return out;
  /* v8 ignore next -- turbodocx returns a Buffer in Node; ArrayBuffer path is defensive */
  return Buffer.from(out as ArrayBuffer);
}
