import {
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
import type { Renderer, RenderInput, RenderResult } from "./types";

/**
 * Build a .docx from the canonical object. Citations are citeproc text output;
 * the user's name is bolded on their own works by emitting separate runs.
 */
export async function renderCvDocxBuffer(cv: CanonicalCv): Promise<Buffer> {
  const sections = prepareSections(cv, "text");
  const children: Paragraph[] = [
    new Paragraph({
      text:
        (cv.owner.honorific ? `${cv.owner.honorific} ` : "") +
        (cv.owner.displayName ||
          renderStrings(cv.display.locale).cvFallbackTitle),
      heading: HeadingLevel.TITLE,
    }),
  ];

  const head = textHeader(cv);
  if (head.headline) {
    children.push(
      new Paragraph({ children: [new TextRun({ text: head.headline })] }),
    );
  }

  if (cv.owner.orcid) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `ORCID: ${cv.owner.orcid}`, italics: true }),
        ],
      }),
    );
  }

  if (head.contact.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: head.contact.join("  ·  ") })],
      }),
    );
  }

  if (head.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: head.summary })],
        spacing: { before: 80, after: 120 },
      }),
    );
  }

  const metrics = metricsLineText(cv);
  if (metrics) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: metrics, italics: true })],
        spacing: { after: 120 },
      }),
    );
  }

  for (const { section, items } of sections) {
    if (items.length === 0) continue;
    children.push(
      new Paragraph({ text: section.title, heading: HeadingLevel.HEADING_2 }),
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

  const doc = new Document({ sections: [{ children }] });
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
