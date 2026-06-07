import {
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { isProseSectionType, type CanonicalCv } from "@/lib/canonical/schema";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "./authorship";
import { cvChartSvgs } from "./charts";
import { splitSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import type { Renderer, RenderInput, RenderResult } from "./types";

// 1×1 transparent PNG — the required fallback for the SVG charts. Modern Word
// (2016+) renders the crisp SVG; only very old viewers fall back to this.
const FALLBACK_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

/** A simple borderless data table (no header). */
function dataTable(rows: string[][]): Table {
  return new Table({
    width: { size: 70, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (r) =>
        new TableRow({
          children: r.map(
            (c) => new TableCell({ children: [new Paragraph({ children: [new TextRun(c)] })] }),
          ),
        }),
    ),
  });
}

/** The per-year publication + citation charts, embedded as SVG images (a bold
 *  caption + the chart) — the same charts the PDF shows, not a data table. */
function chartParagraphs(cv: CanonicalCv): Paragraph[] {
  const out: Paragraph[] = [];
  for (const chart of cvChartSvgs(cv)) {
    const scale = Math.min(2.2, 320 / chart.width);
    out.push(
      new Paragraph({
        children: [new TextRun({ text: chart.caption, bold: true })],
        spacing: { before: 120, after: 40 },
      }),
    );
    out.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: "svg",
            data: Buffer.from(chart.svg, "utf8"),
            transformation: {
              width: Math.round(chart.width * scale),
              height: Math.round(chart.height * scale),
            },
            fallback: { type: "png", data: FALLBACK_PNG },
          }),
        ],
        spacing: { after: 80 },
      }),
    );
  }
  return out;
}

/**
 * A prose section as DOCX paragraphs: a heading paragraph + its body split into
 * paragraphs on blank lines (the body is the user's own plain-text prose, emitted
 * as text runs — Word escapes XML for us). "" body → no paragraphs.
 */
function proseSectionParagraphs(title: string, body: string): Paragraph[] {
  const out: Paragraph[] = [];
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: title, bold: true })],
    }),
  );
  const bodyParas = body
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  for (const para of bodyParas) {
    out.push(
      new Paragraph({
        children: [new TextRun(para)],
        spacing: { after: 120 },
      }),
    );
  }
  return out;
}

/**
 * Build a PLAIN, template-agnostic .docx: a clean, single-column, black-on-white
 * EDITABLE document — header, the per-year charts (embedded as SVG images, like
 * the PDF) + the authorship table, then each section's items (citeproc text,
 * with the account holder's name bolded on their own works). Template styling
 * (accent colour, sidebar, centring) is intentionally NOT applied: the PDF is
 * the template-faithful export, while the .docx is meant to be edited in Word.
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

  children.push(...chartParagraphs(cv));

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
    // Prose sections (narrative contributions / a statement) render their
    // free-text body in the section flow, in their reordered position.
    if (isProseSectionType(section.type)) {
      const body = (section.body ?? "").trim();
      if (body) children.push(...proseSectionParagraphs(section.title, section.body ?? ""));
      continue;
    }
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
