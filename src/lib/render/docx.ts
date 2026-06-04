import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "./authorship";
import { renderCvDocxViaHtml } from "./docxHtml";
import { splitSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { parsePhoto, photoBox } from "./image";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import { docStyle, type DocStyle } from "./templateStyle";
import type { Renderer, RenderInput, RenderResult } from "./types";

/** The profile photo as a docx paragraph, scaled to ~96px wide (aspect kept).
 *  Skipped for the plain (ATS) profile and for non-PNG/JPEG data URLs. */
function photoParagraph(cv: CanonicalCv, style: DocStyle): Paragraph | null {
  if (style.plain) return null;
  const photo = parsePhoto(cv.owner.photo);
  if (!photo) return null;
  const { width, height } = photoBox(photo, 96);
  return new Paragraph({
    alignment: style.centeredHeader ? AlignmentType.CENTER : undefined,
    children: [
      new ImageRun({ type: photo.type, data: photo.data, transformation: { width, height } }),
    ],
  });
}

/** A simple bordered data table (optional bold header row). An EMPTY header is
 *  omitted entirely — a `<w:tr>` with no cells is invalid OOXML and makes Word
 *  refuse to open the document. */
function dataTable(header: string[], rows: string[][]): Table {
  const cell = (text: string, bold = false) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
    });
  const headerRow = header.length
    ? [new TableRow({ tableHeader: true, children: header.map((h) => cell(h, true)) })]
    : [];
  return new Table({
    width: { size: 70, type: WidthType.PERCENTAGE },
    rows: [...headerRow, ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) }))],
  });
}

/** Publications + citations per year as a table (the HTML chart data). */
function yearTable(cv: CanonicalCv): Table | null {
  if (!cv.display.showCharts) return null;
  const data = [...(cv.owner.countsByYear ?? [])]
    .filter((d) => Number.isFinite(d.year))
    .sort((a, b) => a.year - b.year)
    .slice(-12);
  if (data.length < 2) return null;
  const s = renderStrings(cv.display.locale);
  return dataTable(
    ["", s.chartPublicationsPerYear, s.chartCitationsPerYear],
    data.map((d) => [String(d.year), String(d.works), String(d.citations)]),
  );
}

/** The authorship-summary table (role · count · %). null when off/empty. */
function authorshipTable(cv: CanonicalCv): Table | null {
  if (!cv.display.showAuthorshipTable) return null;
  const rows = authorshipCounts(cv, cv.display.authorshipRoles);
  if (rows.length === 0 || rows.every((r) => r.count === 0)) return null;
  // One metric column reading "16 (18%)" — count and share were previously two
  // unlabelled columns that ran together as a meaningless "1618%".
  return dataTable(
    [],
    rows.map((r) => [
      authorshipRoleLabel(cv.display.locale, r.role),
      `${r.count} (${r.percent}%)`,
    ]),
  );
}

type DocxStrings = ReturnType<typeof renderStrings>;

/** The masthead block (photo, name, headline, ORCID, contact, metrics). When
 *  `onAccent` (the sidebar's coloured left column), text is white and always
 *  left-aligned; otherwise it follows the template (centred name for Classic,
 *  accent-coloured name for Modern). */
function mastheadParagraphs(
  cv: CanonicalCv,
  style: DocStyle,
  s: DocxStrings,
  onAccent: boolean,
): Paragraph[] {
  const center = style.centeredHeader ? AlignmentType.CENTER : undefined;
  const alignment = onAccent ? undefined : center;
  const white = onAccent ? "FFFFFF" : undefined;
  const out: Paragraph[] = [];

  const photo = photoParagraph(cv, style);
  if (photo) out.push(photo);

  out.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment,
      children: [
        new TextRun({
          text:
            (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
            (cv.owner.displayName || s.cvFallbackTitle),
          color: onAccent
            ? "FFFFFF"
            : style.accentName && !style.plain
              ? style.accentHex
              : undefined,
        }),
      ],
    }),
  );

  const head = textHeader(cv);
  if (head.headline) {
    out.push(new Paragraph({ alignment, children: [new TextRun({ text: head.headline, color: white })] }));
  }
  if (cv.owner.orcid) {
    out.push(
      new Paragraph({
        alignment,
        children: [new TextRun({ text: `ORCID: ${cv.owner.orcid}`, italics: true, color: white })],
      }),
    );
  }
  if (head.contact.length) {
    out.push(
      new Paragraph({ alignment, children: [new TextRun({ text: head.contact.join("  ·  "), color: white })] }),
    );
  }
  const metrics = metricsLineText(cv);
  if (metrics) {
    out.push(
      new Paragraph({
        alignment,
        children: [new TextRun({ text: metrics, italics: true, color: white })],
        spacing: { after: 80 },
      }),
    );
  }
  return out;
}

/** Everything below the masthead: the per-year + authorship tables, the
 *  summary, then each section's heading and citeproc-rendered items (the
 *  account holder's name bolded on their own works). */
function bodyBlocks(
  cv: CanonicalCv,
  style: DocStyle,
  s: DocxStrings,
  sections: ReturnType<typeof prepareSections>,
): (Paragraph | Table)[] {
  const headColor = style.plain ? undefined : style.accentHex;
  const center = style.centeredHeader ? AlignmentType.CENTER : undefined;
  const out: (Paragraph | Table)[] = [];

  const years = yearTable(cv);
  if (years) {
    out.push(years);
    out.push(new Paragraph({ spacing: { after: 80 } }));
  }
  const authorship = authorshipTable(cv);
  if (authorship) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: `${s.authorshipCaption}`, bold: true })],
        spacing: { before: 80 },
      }),
    );
    out.push(authorship);
    out.push(
      new Paragraph({
        children: [new TextRun({ text: s.authorshipCorrespondingNote, italics: true, size: 16 })],
        spacing: { after: 80 },
      }),
    );
  }

  const head = textHeader(cv);
  if (head.summary) {
    out.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun(head.summary)],
        spacing: { before: 80, after: 120 },
      }),
    );
  }

  for (const { section, items } of sections) {
    if (items.length === 0) continue;
    out.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            color: headColor,
            allCaps: style.uppercaseHeadings,
          }),
        ],
      }),
    );
    for (const { item, entry } of items) {
      const runs =
        cv.display.highlightSelf &&
        item.authoredBySelf &&
        item.selfNameVariants.length > 0
          ? splitSelf(entry, item.selfNameVariants).map(
              (seg) => new TextRun({ text: seg.text, bold: seg.self }),
            )
          : [new TextRun(entry)];
      out.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
    }
  }
  return out;
}

/** Sidebar template: a borderless two-column table — a shaded accent left cell
 *  (white masthead) and the content on the right. Mirrors the LaTeX/HTML
 *  sidebar. (Word repaints the cell shading per page, so a very long CV may show
 *  the band only beside the first page's portion — acceptable for a CV.) */
function sidebarLayout(
  cv: CanonicalCv,
  style: DocStyle,
  s: DocxStrings,
  sections: ReturnType<typeof prepareSections>,
): Table[] {
  const left = mastheadParagraphs(cv, style, s, true); // always ≥1 (the name)
  const right = bodyBlocks(cv, style, s, sections);
  // A Word table cell must hold ≥1 block; bodyBlocks is non-empty for any real
  // CV, so this fallback is purely defensive.
  /* v8 ignore next -- defensive: bodyBlocks is non-empty for any real CV */
  const rightChildren = right.length > 0 ? right : [new Paragraph("")];
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const cellBorders = { top: none, bottom: none, left: none, right: none };
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { ...cellBorders, insideHorizontal: none, insideVertical: none },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: style.accentHex },
              margins: { top: 220, bottom: 220, left: 220, right: 200 },
              verticalAlign: VerticalAlign.TOP,
              borders: cellBorders,
              children: left,
            }),
            new TableCell({
              width: { size: 66, type: WidthType.PERCENTAGE },
              margins: { top: 220, bottom: 220, left: 320, right: 120 },
              borders: cellBorders,
              children: rightChildren,
            }),
          ],
        }),
      ],
    }),
  ];
}

/**
 * Build a .docx from the canonical object, styled to RESEMBLE the chosen
 * template: serif/sans font, an accent (or centred, or plain) name, accent/
 * plain/uppercase headings, the profile PHOTO (image), and the per-year +
 * authorship data as real tables. The Sidebar template lays out as a coloured
 * two-column table. Citations are citeproc text; the user's name is bolded on
 * their own works via separate runs.
 */
export async function renderCvDocxBuffer(cv: CanonicalCv): Promise<Buffer> {
  const style = docStyle(cv);
  const bodyFont = style.serif ? "Cambria" : "Calibri";
  const sections = prepareSections(cv, "text");
  const s = renderStrings(cv.display.locale);

  const children: (Paragraph | Table)[] = style.twoColumn
    ? sidebarLayout(cv, style, s, sections)
    : [...mastheadParagraphs(cv, style, s, false), ...bodyBlocks(cv, style, s, sections)];

  const doc = new Document({
    styles: { default: { document: { run: { font: bodyFont } } } },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

export const docxRenderer: Renderer = {
  format: "docx",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    // Primary path: convert the template HTML so the .docx carries the
    // template's colours/fonts/layout. Fall back to the hand-built document if
    // the HTML conversion ever throws, so an export is always produced.
    let buffer: Buffer;
    try {
      buffer = await renderCvDocxViaHtml(cv);
    } catch {
      /* v8 ignore next 2 -- fallback: hand-built DOCX when HTML conversion fails */
      buffer = await renderCvDocxBuffer(cv);
    }
    return {
      format: "docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: `${cvSlug(cv.owner.displayName)}-cv.docx`,
      buffer,
    };
  },
};
