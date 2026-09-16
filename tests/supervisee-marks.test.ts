import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { applyCvModel, resetCvSections } from "@/lib/canonical/cvModels";
import { updateDisplay } from "@/lib/canonical/curate";
import {
  shouldMarkSupervisees,
  superviseeNameVariants,
  superviseePrintedForms,
} from "@/lib/canonical/supervisees";
import { appendAfterNamesHtml, appendAfterNamesText } from "@/lib/render/nameMarks";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";

const hasApa = listAvailableStyles().includes("apa");

function item(id: string, extra: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "manual",
    sourceId: "manual",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: ["Chrétien"],
    meta: {},
    ...extra,
  };
}
function section(type: CvSectionType, items: CvItem[]): CvSection {
  return {
    id: type,
    type,
    title: type,
    visible: true,
    order: 0,
    items: items.map((it, i) => ({ ...it, order: i })),
  };
}

/** A CV whose one publication has a co-author the owner supervised (a PhD record). */
function makeCv(display: Partial<CanonicalCv["display"]> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "marks_test",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Basile Chrétien",
      links: [],
      countsByYear: [],
    },
    display: { locale: "en-US", cslStyle: "apa", ...display },
    sections: [
      section("publications", [
        item("W1", {
          source: "openalex",
          sourceId: "https://openalex.org/W1",
          csl: {
            id: "W1",
            type: "article-journal",
            title: "Hepatotoxicity signal",
            author: [
              { family: "Chrétien", given: "Basile" },
              { family: "Kaur", given: "Priya" },
              { family: "Moreau", given: "Denis" },
            ],
            issued: { "date-parts": [[2022]] },
            "container-title": "Revue fictive",
          },
          meta: { year: 2022 },
        }),
      ]),
      section("supervision", [
        item("sup:1", {
          authoredBySelf: false,
          selfNameVariants: [],
          displayText: "Priya Kaur, PhD",
          meta: { superviseeName: "Priya Kaur", degreeLevel: "phd", supervisionRole: "primary" },
        }),
        // A hidden record must not mark anyone.
        item("sup:2", {
          included: false,
          authoredBySelf: false,
          selfNameVariants: [],
          displayText: "Denis Moreau",
          meta: { superviseeName: "Denis Moreau" },
        }),
      ]),
    ].map((s, i) => ({ ...s, order: i })),
    presets: [],
    provenance: { generatedAt: "2026-09-16T00:00:00.000Z", sources: ["manual"] },
  });
}

describe("supervisee printed forms", () => {
  it("cover the forms a citation style prints, longest first, family name last", () => {
    const forms = superviseePrintedForms("Jean-Baptiste Nguyen");
    expect(forms).toContain("Nguyen, J.-B.");
    expect(forms).toContain("J.-B. Nguyen");
    expect(forms).toContain("Nguyen J-B");
    expect(forms).toContain("Jean-Baptiste Nguyen");
    expect(forms).toContain("Nguyen, Jean-Baptiste");
    expect(forms[forms.length - 1]).toBe("Nguyen");
    expect(superviseePrintedForms("  ")).toEqual([]);
    // A single-token name has only itself.
    expect(superviseePrintedForms("Madonna")).toEqual(["Madonna"]);
  });

  it("collect the names of included supervision records only", () => {
    const variants = superviseeNameVariants(makeCv());
    expect(variants).toContain("Kaur, P.");
    expect(variants).not.toContain("Moreau, D."); // hidden record
    expect(variants[0]!.length).toBeGreaterThanOrEqual(variants[variants.length - 1]!.length);
  });

  it("skips a record excluded from the current view, and one carrying the owner's own name", () => {
    const cv = makeCv();
    const supervision = cv.sections.find((s) => s.type === "supervision")!;
    // The view leaves Priya Kaur's record out: her name is not marked in that view.
    const excluded = updateDisplay(cv, { excludedItems: { [supervision.id]: ["sup:1"] } });
    expect(superviseeNameVariants(excluded)).not.toContain("Kaur, P.");
    // A record typed with the owner's own name never marks the owner.
    const selfRecord = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.type !== "supervision"
          ? s
          : {
              ...s,
              items: [
                ...s.items,
                item("sup:me", {
                  authoredBySelf: false,
                  selfNameVariants: [],
                  displayText: "Basile Chrétien",
                  meta: { superviseeName: "Basile Chrétien" },
                }),
              ],
            },
      ),
    };
    const variants = superviseeNameVariants(selfRecord);
    expect(variants).toContain("Kaur, P.");
    expect(variants).not.toContain("Chrétien, B.");
    expect(variants).not.toContain("Chrétien");
  });

  it("mark only when asked and while names are not hidden", () => {
    const cv = makeCv();
    expect(shouldMarkSupervisees(cv.display)).toBe(false);
    expect(shouldMarkSupervisees({ ...cv.display, markSupervisees: true })).toBe(true);
    expect(
      shouldMarkSupervisees({ ...cv.display, markSupervisees: true, hideSuperviseeNames: true }),
    ).toBe(false);
  });
});

describe("appending the mark", () => {
  const forms = superviseePrintedForms("Priya Kaur");
  it("marks the whole printed name, once, at word boundaries, in text and in HTML text runs", () => {
    expect(appendAfterNamesText("Chrétien, B., & Kaur, P. (2022).", forms)).toBe(
      "Chrétien, B., & Kaur, P.* (2022).",
    );
    // Already marked: left alone.
    expect(appendAfterNamesText("Kaur, P.* (2022)", forms)).toBe("Kaur, P.* (2022)");
    // Not inside a longer word.
    expect(appendAfterNamesText("Kaurismäki, A.", forms)).toBe("Kaurismäki, A.");
    // HTML: tags untouched, text marked.
    expect(
      appendAfterNamesHtml('<span class="a" title="Kaur, P.">Kaur, P.</span> & <i>Kaur</i>', forms),
    ).toBe('<span class="a" title="Kaur, P.">Kaur, P.*</span> & <i>Kaur*</i>');
    expect(appendAfterNamesText("nothing here", [])).toBe("nothing here");
  });
});

describe.skipIf(!hasApa)("the mark in the rendered document", () => {
  it("HTML, Markdown and DOCX print Kaur, P.* when the switch is on and nothing otherwise", async () => {
    const off = makeCv();
    const on = makeCv({ markSupervisees: true });
    expect(renderCvHtml(off)).toContain("Kaur, P.");
    expect(renderCvHtml(off)).not.toContain("Kaur, P.*");
    const html = renderCvHtml(on);
    expect(html).toContain("Kaur, P.*");
    expect(html).not.toContain("Moreau, D.*"); // hidden record
    expect(html).not.toContain("Chrétien, B.*"); // the owner is never a supervisee
    // Markdown escapes the asterisk so it prints literally.
    expect(renderCvMarkdown(on)).toContain("Kaur, P.\\*");
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(on));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Kaur, P.*");
  });

  it("stays off while supervisee names are hidden", () => {
    const hidden = makeCv({ markSupervisees: true, hideSuperviseeNames: true });
    expect(renderCvHtml(hidden)).not.toContain("Kaur, P.*");
  });
});

describe("the FRQ layouts and the switch", () => {
  it("CV-FRQ turns the mark on; another layout or the reset hands the owner's setting back", () => {
    const base = makeCv();
    const frq = applyCvModel(base, "frq");
    expect(frq.display.markSupervisees).toBe(true);
    expect(frq.display.layoutStyleRestore?.markSupervisees).toBe(false);
    expect(applyCvModel(frq, "erc").display.markSupervisees).toBe(false);
    expect(resetCvSections(frq).display.markSupervisees).toBe(false);
    // An owner who had it on keeps it on after leaving FRQ.
    const own = updateDisplay(base, { markSupervisees: true });
    expect(applyCvModel(applyCvModel(own, "frq-en"), "erc").display.markSupervisees).toBe(true);
  });

  it("has its strings in every locale, the label showing the FRQ form and the hint naming the namesake caveat", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const eu = editorUi(loc);
      expect(eu.markSupervisees, loc).toContain("Kaur, P.*");
      expect(eu.markSuperviseesHint.trim().length, loc).toBeGreaterThan(40);
    }
  });
});
