import {
  AlignmentType,
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
import type { CanonicalCv } from "@/lib/canonical/schema";
import { authorshipRoleLabel, renderStrings } from "@/lib/i18n/render";
import { authorshipCounts } from "./authorship";
import { splitSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import { docStyle, type DocStyle } from "./templateStyle";
import type { Renderer, RenderInput, RenderResult } from "./types";

/** Decode intrinsic pixel size from a PNG/JPEG buffer (so the photo isn't
 *  distorted). Returns null if it can't be read. */
function imageSize(data: Buffer, type: "png" | "jpg"): { w: number; h: number } | null {
  if (type === "png") {
    if (data.length < 24) return null;
    const w = data.readUInt32BE(16);
    const h = data.readUInt32BE(20);
    return w > 0 && h > 0 ? { w, h } : null;
  }
  // JPEG: walk the segment markers (each FF-prefixed) to the Start-Of-Frame,
  // which carries the size. Stop if the stream desyncs (a non-FF marker byte).
  let o = 2;
  while (o + 9 < data.length && data[o] === 0xff) {
    const marker = data[o + 1]!;
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const h = data.readUInt16BE(o + 5);
      const w = data.readUInt16BE(o + 7);
      return w > 0 && h > 0 ? { w, h } : null;
    }
    o += 2 + data.readUInt16BE(o + 2);
  }
  return null; // no SOF found ⇒ caller falls back to a square box
}

/** The profile photo as a docx paragraph, scaled to ~96px wide (aspect kept).
 *  Skipped for the plain (ATS) profile and for non-PNG/JPEG data URLs. */
function photoParagraph(cv: CanonicalCv, style: DocStyle): Paragraph | null {
  if (style.plain || !cv.owner.photo) return null;
  const m = /^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/.exec(cv.owner.photo);
  if (!m) return null;
  const type = m[1] === "png" ? "png" : "jpg";
  const data = Buffer.from(m[2]!, "base64");
  const size = imageSize(data, type);
  const width = 96;
  const height = size ? Math.round((width * size.h) / size.w) : 96;
  return new Paragraph({
    alignment: style.centeredHeader ? AlignmentType.CENTER : undefined,
    children: [
      new ImageRun({ type, data, transformation: { width, height } }),
    ],
  });
}

/** A simple bordered data table (header row bold). */
function dataTable(header: string[], rows: string[][]): Table {
  const cell = (text: string, bold = false) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
    });
  return new Table({
    width: { size: 70, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
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
  return dataTable(
    [],
    rows.map((r) => [
      authorshipRoleLabel(cv.display.locale, r.role),
      String(r.count),
      `${r.percent}%`,
    ]),
  );
}

/**
 * Build a .docx from the canonical object, styled to RESEMBLE the chosen
 * template: serif/sans font, an accent (or centred, or plain) name, accent/
 * plain/uppercase headings, the profile PHOTO (image), and the per-year +
 * authorship data as real tables. Citations are citeproc text; the user's name
 * is bolded on their own works via separate runs.
 */
export async function renderCvDocxBuffer(cv: CanonicalCv): Promise<Buffer> {
  const style = docStyle(cv);
  const bodyFont = style.serif ? "Cambria" : "Calibri";
  const headColor = style.plain ? undefined : style.accentHex;
  const center = style.centeredHeader ? AlignmentType.CENTER : undefined;
  const sections = prepareSections(cv, "text");
  const s = renderStrings(cv.display.locale);

  const children: (Paragraph | Table)[] = [];

  const photo = photoParagraph(cv, style);
  if (photo) children.push(photo);

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: center,
      children: [
        new TextRun({
          text:
            (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
            (cv.owner.displayName || s.cvFallbackTitle),
          color: style.accentName && !style.plain ? style.accentHex : undefined,
        }),
      ],
    }),
  );

  const head = textHeader(cv);
  if (head.headline) {
    children.push(
      new Paragraph({ alignment: center, children: [new TextRun(head.headline)] }),
    );
  }
  if (cv.owner.orcid) {
    children.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun({ text: `ORCID: ${cv.owner.orcid}`, italics: true })],
      }),
    );
  }
  if (head.contact.length) {
    children.push(
      new Paragraph({ alignment: center, children: [new TextRun(head.contact.join("  ·  "))] }),
    );
  }
  const metrics = metricsLineText(cv);
  if (metrics) {
    children.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun({ text: metrics, italics: true })],
        spacing: { after: 80 },
      }),
    );
  }

  // Charts → per-year table; the authorship summary → table.
  const years = yearTable(cv);
  if (years) {
    children.push(years);
    children.push(new Paragraph({ spacing: { after: 80 } }));
  }
  const authorship = authorshipTable(cv);
  if (authorship) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `${s.authorshipCaption}`, bold: true })],
        spacing: { before: 80 },
      }),
    );
    children.push(authorship);
    children.push(
      new Paragraph({
        children: [new TextRun({ text: s.authorshipCorrespondingNote, italics: true, size: 16 })],
        spacing: { after: 80 },
      }),
    );
  }

  if (head.summary) {
    children.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun(head.summary)],
        spacing: { before: 80, after: 120 },
      }),
    );
  }

  for (const { section, items } of sections) {
    if (items.length === 0) continue;
    children.push(
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
    const buffer = await renderCvDocxBuffer(cv);
    return {
      format: "docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      filename: `${cvSlug(cv.owner.displayName)}-cv.docx`,
      buffer,
    };
  },
};
