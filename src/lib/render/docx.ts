import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "./authorship";
import { splitSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { Renderer, RenderInput, RenderResult } from "./types";

/** A simple bordered data table. An EMPTY header is omitted entirely — a
 *  `<w:tr>` with no cells is invalid OOXML and makes Word refuse the file. */
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

/**
 * Build a PLAIN, template-agnostic .docx: a clean, single-column, black-on-white
 * EDITABLE document — header, the per-year + authorship data tables, then each
 * section's items (citeproc text, with the account holder's name bolded on their
 * own works). Template styling (accent colour, sidebar, centring, the photo) is
 * intentionally NOT applied: the PDF is the template-faithful export, while the
 * .docx is meant to be opened and edited in Word.
 */
export async function renderCvDocxBuffer(cv: CanonicalCv): Promise<Buffer> {
  const bodyFont = cv.display.fontPairing === "sans" ? "Calibri" : "Cambria";
  const s = renderStrings(cv.display.locale);
  const sections = prepareSections(cv, "text");
  const head = textHeader(cv);
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun(
          (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
            (cv.owner.displayName || s.cvFallbackTitle),
        ),
      ],
    }),
  );
  if (head.headline) {
    children.push(new Paragraph({ children: [new TextRun(head.headline)] }));
  }
  if (cv.owner.orcid) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: `ORCID: ${cv.owner.orcid}`, italics: true })] }),
    );
  }
  if (head.contact.length) {
    children.push(new Paragraph({ children: [new TextRun(head.contact.join("  ·  "))] }));
  }
  const metrics = metricsLineText(cv);
  if (metrics) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: metrics, italics: true })],
        spacing: { after: 80 },
      }),
    );
  }

  const years = yearTable(cv);
  if (years) {
    children.push(years);
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }

  // Authorship summary: role · "N (P%)", with the denominator in the caption.
  const authorRows = cv.display.showAuthorshipTable
    ? authorshipCounts(cv, cv.display.authorshipRoles)
    : [];
  if (authorRows.length > 0 && !authorRows.every((r) => r.count === 0)) {
    const total = authorRows[0]!.total; // guard above guarantees a row
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${s.authorshipCaption} · n=${total}`, bold: true })],
        spacing: { before: 80 },
      }),
    );
    children.push(
      dataTable(
        [],
        authorRows.map((r) => [
          authorshipRoleLabel(cv.display.locale, r.role),
          `${r.count} (${r.percent}%)`,
        ]),
      ),
    );
    if (authorRows.some((r) => r.role === "corresponding")) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: s.authorshipCorrespondingNote, italics: true, size: 16 })],
          spacing: { after: 80 },
        }),
      );
    }
  }

  if (head.summary) {
    children.push(
      new Paragraph({ children: [new TextRun(head.summary)], spacing: { before: 80, after: 120 } }),
    );
  }

  for (const { section, items } of sections) {
    if (items.length === 0) continue;
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: section.title, bold: true })],
      }),
    );
    for (const { item, entry } of items) {
      const runs =
        cv.display.highlightSelf && item.authoredBySelf && item.selfNameVariants.length > 0
          ? splitSelf(entry, item.selfNameVariants).map(
              (seg) => new TextRun({ text: seg.text, bold: seg.self }),
            )
          : [new TextRun(entry)];
      children.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: bodyFont } } } },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

export const docxRenderer: Renderer = {
  format: "docx",
  async render({ cv }: RenderInput): Promise<RenderResult> {
    return {
      format: "docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: `${cvSlug(cv.owner.displayName)}-cv.docx`,
      buffer: await renderCvDocxBuffer(cv),
    };
  },
};
