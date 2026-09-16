import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  SECTION_TYPES,
  isProseSectionType,
  type CanonicalCv,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { CV_MODELS, applyCvModel, resetCvSections } from "@/lib/canonical/cvModels";
import { setSectionBody, updateDisplay } from "@/lib/canonical/curate";
import {
  CHARS_PER_PAGE,
  estimatePages,
  narrativePageEstimate,
  proseSectionPages,
} from "@/lib/canonical/pageEstimate";
import { computeCvHealth } from "@/lib/cv/health";
import { textHeader } from "@/lib/render/headerText";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/**
 * The FRQ "CV descriptif" document: no personal statement outside its three
 * sections, no figure, letter paper, six pages in French and five in English. The
 * CV-FRQ layouts carry those as display overrides, and the editor estimates the
 * pages the prose takes under the FRQnet presentation standards.
 */
function section(type: CvSectionType): CvSection {
  return { id: type, type, title: type, visible: true, order: 0, items: [] };
}

function makeCv(): CanonicalCv {
  const types = SECTION_TYPES.filter((t) => !isProseSectionType(t));
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "frqdoc_test",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Basile Chrétien",
      headline: "Pharmacologist",
      summary: "A personal summary that the FRQ template has no place for.",
      links: [],
      countsByYear: [],
    },
    display: { locale: "fr-FR", showMetrics: true, metrics: ["rcr_mean"] },
    sections: types.map((t, i) => ({ ...section(t), order: i })),
    presets: [],
    provenance: { generatedAt: "2026-09-16T00:00:00.000Z", sources: ["manual"] },
  });
}

describe("the FRQ and Tri-agency layouts shape the document", () => {
  it("leave the header summary off, hide the research-summary block, use letter paper, and carry the FRQ page limits", () => {
    for (const [id, limit] of [
      ["frq", 6],
      ["frq-en", 5],
      ["ccv", undefined],
    ] as const) {
      const next = applyCvModel(makeCv(), id);
      expect(next.display.hideHeaderSummary, id).toBe(true);
      expect(next.display.summaryBlockPosition, id).toBe("hidden");
      expect(next.display.pageFormat, id).toBe("letter");
      expect(next.display.pageLimit, id).toBe(limit);
      // The owner's text is untouched: only the rendering changes.
      expect(next.owner.summary).toBe(makeCv().owner.summary);
    }
  });

  it("any other layout brings the header summary back and drops the page limit; the reset does too", () => {
    const frq = applyCvModel(makeCv(), "frq");
    const erc = applyCvModel(frq, "erc");
    expect(erc.display.hideHeaderSummary).toBe(false);
    expect(erc.display.pageLimit).toBeUndefined();
    // The owner's paper size and block placement come back with the next layout.
    expect(erc.display.pageFormat).toBe("a4");
    expect(erc.display.summaryBlockPosition).toBe("header");
    expect(erc.display.layoutStyleRestore).toBeUndefined();
    const reset = resetCvSections(applyCvModel(makeCv(), "frq"));
    expect(reset.display.hideHeaderSummary).toBe(false);
    expect(reset.display.pageLimit).toBeUndefined();
    expect(reset.display.pageFormat).toBe("a4");
    expect(reset.display.summaryBlockPosition).toBe("header");
    expect(reset.display.layoutStyleRestore).toBeUndefined();
  });

  it("an owner's own choices survive a chain of layouts: letter + bottom before FRQ come back after ERC", () => {
    const own = updateDisplay(makeCv(), { pageFormat: "letter", summaryBlockPosition: "bottom" });
    const frq = applyCvModel(own, "frq");
    expect(frq.display.summaryBlockPosition).toBe("hidden");
    expect(frq.display.layoutStyleRestore).toEqual({
      pageFormat: "letter",
      summaryBlockPosition: "bottom",
      markSupervisees: false,
    });
    // FRQ → FRQ-EN keeps the ORIGINAL owner values aside, not FRQ's own.
    const frqEn = applyCvModel(frq, "frq-en");
    expect(frqEn.display.layoutStyleRestore).toEqual({
      pageFormat: "letter",
      summaryBlockPosition: "bottom",
      markSupervisees: false,
    });
    const erc = applyCvModel(frqEn, "erc");
    expect(erc.display.pageFormat).toBe("letter");
    expect(erc.display.summaryBlockPosition).toBe("bottom");
    expect(erc.display.layoutStyleRestore).toBeUndefined();
    // A second ERC apply, with nothing kept aside, changes neither.
    const again = applyCvModel(erc, "nih");
    expect(again.display.pageFormat).toBe("letter");
    expect(again.display.summaryBlockPosition).toBe("bottom");
  });

  it("no layout without a page limit leaks one, and only the CV-FRQ layouts set one", () => {
    const withLimit = CV_MODELS.filter((m) => m.display?.pageLimit !== undefined).map((m) => m.id);
    expect(withLimit.sort()).toEqual(["frq", "frq-en"]);
  });

  it("the renderers leave the headline and summary out when the flag is on, in HTML and in the text formats", () => {
    const shown = makeCv();
    const hidden = updateDisplay(shown, { hideHeaderSummary: true });
    expect(renderCvHtml(shown)).toContain("A personal summary that the FRQ template");
    expect(renderCvHtml(shown)).toContain('class="cv-headline"');
    const html = renderCvHtml(hidden);
    expect(html).not.toContain("A personal summary that the FRQ template");
    expect(html).not.toContain('class="cv-headline"');
    expect(html).toContain("Basile Chrétien"); // the name stays
    const head = textHeader(hidden);
    expect(head.headline).toBeUndefined();
    expect(head.summary).toBeUndefined();
    expect(textHeader(shown).summary).toContain("A personal summary");
    expect(renderCvMarkdown(hidden)).not.toContain("A personal summary that the FRQ template");
    expect(renderCvMarkdown(shown)).toContain("A personal summary that the FRQ template");
  });
});

describe("page estimates under the FRQnet presentation standards", () => {
  it("count about 3,400 characters to a page, to one decimal, with a heading allowance per section", () => {
    expect(CHARS_PER_PAGE).toBe(3400);
    expect(estimatePages(0)).toBe(0);
    expect(estimatePages(-5)).toBe(0);
    expect(estimatePages(3400)).toBe(1);
    expect(estimatePages(1700)).toBe(0.5);
    expect(estimatePages(10_000)).toBe(2.9);
    const blank = { type: "statement" as const, body: "   " };
    expect(proseSectionPages(blank)).toBe(0);
    expect(proseSectionPages({ type: "publications" as const, body: "x".repeat(5000) })).toBe(0);
    // 3,280 characters + the 120-character heading allowance = one page.
    expect(proseSectionPages({ type: "statement" as const, body: "x".repeat(3280) })).toBe(1);
  });

  it("sum the visible prose sections against the layout's limit, and flag going over", () => {
    let cv = applyCvModel(makeCv(), "frq");
    const ids = Object.fromEntries(
      cv.sections.filter((s) => isProseSectionType(s.type)).map((s) => [s.type, s.id]),
    );
    expect(narrativePageEstimate(cv)).toEqual({ pages: 0, limit: 6, over: false });
    cv = setSectionBody(cv, ids["statement"]!, "a".repeat(3280)); // 1 page
    cv = setSectionBody(cv, ids["narrative-knowledge"]!, "b".repeat(6680)); // 2 pages
    expect(narrativePageEstimate(cv)).toEqual({ pages: 3, limit: 6, over: false });
    // Over the limit: three sections of about three pages each.
    cv = setSectionBody(cv, ids["narrative-individuals"]!, "c".repeat(3280 * 4));
    const over = narrativePageEstimate(cv);
    expect(over.over).toBe(true);
    expect(over.pages).toBeGreaterThan(6);
    // A hidden prose section is not counted; without a limit there is no "over".
    const noLimit = updateDisplay(cv, { pageLimit: undefined });
    expect(narrativePageEstimate(noLimit)).toEqual({ pages: over.pages, over: false });
  });

  it("reach the CV-health panel as information only when a layout with a limit is applied, never in the total", () => {
    const plain = makeCv();
    expect(computeCvHealth(plain).narrativePages).toBeUndefined();
    let cv = applyCvModel(plain, "frq-en");
    const statement = cv.sections.find((s) => s.type === "statement")!;
    cv = setSectionBody(cv, statement.id, "x".repeat(3400 * 5 + 400)); // ≈ 5.4 pages
    const health = computeCvHealth(cv);
    expect(health.narrativePages?.limit).toBe(5);
    expect(health.narrativePages?.over).toBe(true);
    expect(health.total).toBe(0);
  });

  it("have their strings in every locale, with the placeholders the editor substitutes", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const eu = editorUi(loc);
      expect(eu.prosePagesApprox, loc).toContain("{n}");
      expect(eu.prosePagesHint.trim().length, loc).toBeGreaterThan(0);
      const wu = workspaceUi(loc);
      for (const k of ["hpPages", "hpPagesOver"] as const) {
        expect(wu[k], `${loc} ${k}`).toContain("{pages}");
        expect(wu[k], `${loc} ${k}`).toContain("{limit}");
      }
    }
  });
});
