import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { splitSelf } from "./emphasize";
import { textHeader } from "./headerText";
import { cvSlug } from "./html";
import { metricsLineText } from "./metrics";
import { prepareSections } from "./prepare";
import { docStyle } from "./templateStyle";
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * Build a .docx from the canonical object, styled to RESEMBLE the chosen
 * template: serif/sans body font, an accent (or centred, or plain) name, and
 * accent / uppercase / plain section headings. Citations are citeproc text
 * output; the user's name is bolded on their own works via separate runs.
 */
export async function renderCvDocxBuffer(cv: CanonicalCv): Promise<Buffer> {
  const style = docStyle(cv);
  const bodyFont = style.serif ? "Cambria" : "Calibri";
  const headColor = style.plain ? undefined : style.accentHex;
  const center = style.centeredHeader ? AlignmentType.CENTER : undefined;
  const sections = prepareSections(cv, "text");

  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: center,
      children: [
        new TextRun({
          text:
            (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
            (cv.owner.displayName ||
              renderStrings(cv.display.locale).cvFallbackTitle),
          color: style.accentName && !style.plain ? style.accentHex : undefined,
        }),
      ],
    }),
  ];

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
      new Paragraph({
        alignment: center,
        children: [new TextRun(head.contact.join("  ·  "))],
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
  const metrics = metricsLineText(cv);
  if (metrics) {
    children.push(
      new Paragraph({
        alignment: center,
        children: [new TextRun({ text: metrics, italics: true })],
        spacing: { after: 120 },
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
    // Default body font follows the template (serif vs sans).
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
