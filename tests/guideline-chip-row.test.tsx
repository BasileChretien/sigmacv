// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The guideline chip on a publication row (the editor's Content tab): a work the
 * owner sync found cited in clinical practice guidelines says how many, and
 * names them in its tooltip after the partial-coverage note. A work with none
 * shows nothing.
 */

function work(id: string, meta: CvItem["meta"] = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, DOI: `10.1234/${id}` },
    meta: { year: 2023, oaIsOpen: true, ...meta },
  };
}

function makeCv(works: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "chip",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: works,
      },
    ],
    provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["openalex"] },
  });
}

const chips = () => [...document.querySelectorAll<HTMLElement>(".cv-guideline-chip")];
const expandSections = () =>
  document
    .querySelectorAll<HTMLButtonElement>('button.section-toggle[aria-expanded="false"]')
    .forEach((b) => fireEvent.click(b));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(0), 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
});
afterEach(cleanup);

describe("Guideline chip on a publication row", () => {
  it("counts the guidelines, one or many, and lists them in the tooltip after the coverage note", () => {
    render(
      <CvEditor
        cv={makeCv([
          work("W-two", {
            guidelineCitations: [
              {
                pmid: "34724392",
                title: "ASCO Guideline Update.",
                source: "J Clin Oncol",
                year: 2021,
              },
              {
                pmid: "38228461",
                title: "Position statement.",
                source: "Gastroenterol Hepatol",
                year: 2024,
              },
            ],
          }),
          work("W-one", {
            guidelineCitations: [{ pmid: "1", title: "Single guideline", year: 2020 }],
          }),
          work("W-none"),
        ])}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
        variant="regions"
      />,
    );
    expandSections();
    expect(chips().map((c) => c.textContent)).toEqual([
      "Cited in 2 clinical guidelines",
      "Cited in 1 clinical guideline",
    ]);
    expect(chips()[0]!.closest("li")!.textContent).toContain("Work W-two");
    expect(chips()[0]!.getAttribute("title")).toBe(
      [
        "Practice guidelines indexed in PubMed that cite this work, found through NIH iCite. A guideline PubMed does not index is not seen.",
        "• ASCO Guideline Update (J Clin Oncol, 2021)",
        "• Position statement (Gastroenterol Hepatol, 2024)",
      ].join("\n"),
    );
    expect(chips()[1]!.getAttribute("title")).toContain("• Single guideline (2020)");
  });
});
