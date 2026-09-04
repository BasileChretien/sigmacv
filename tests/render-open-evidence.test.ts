import { describe, expect, it } from "vitest";
import { buildRenderedSections, renderCvHtml } from "@/lib/render/html";
import { DisplayChoicesSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

function item(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "datacite",
    sourceId: id,
    displayText: `Entry ${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
    ...over,
  };
}

function makeCv(
  displayOver: Record<string, unknown>,
  datasetItems: CvItem[],
  preprintItems: CvItem[] = [],
): CanonicalCv {
  return {
    schemaVersion: 2,
    id: "x",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "X",
      links: [],
      countsByYear: [],
    },
    display: DisplayChoicesSchema.parse(displayOver),
    sections: [
      {
        id: "datasets",
        type: "datasets",
        title: "Datasets & Software",
        visible: true,
        order: 0,
        items: datasetItems,
      },
      {
        id: "preprints",
        type: "preprints",
        title: "Preprints",
        visible: true,
        order: 1,
        items: preprintItems,
      },
    ],
    presets: [],
    provenance: { generatedAt: "t0", lastSyncedAt: "t0", sources: ["datacite"] },
  };
}

/** Find a rendered section by its (source) type, regardless of default display order. */
function byType(rendered: ReturnType<typeof buildRenderedSections>, type: string) {
  const found = rendered.find((r) => r.section.type === type);
  if (!found) throw new Error(`no rendered section of type "${type}"`);
  return found;
}

describe("archival status badge (Software Heritage)", () => {
  it("renders an 'Archived' link when the toggle is on and the item has a swhid", () => {
    const cv = makeCv({ showArchivalStatus: true }, [
      item("S1", { meta: { swhid: `swh:1:snp:${"a".repeat(40)}` } }),
    ]);
    const html = byType(buildRenderedSections(cv), "datasets").items[0]!.html;
    expect(html).toContain("cv-badge-archived");
    expect(html).toContain(`https://archive.softwareheritage.org/swh:1:snp:${"a".repeat(40)}`);
    expect(html).toContain("Archived");
  });

  it("omits the badge when the toggle is off, even with a swhid", () => {
    const cv = makeCv({ showArchivalStatus: false }, [
      item("S1", { meta: { swhid: `swh:1:snp:${"a".repeat(40)}` } }),
    ]);
    const html = byType(buildRenderedSections(cv), "datasets").items[0]!.html;
    expect(html).not.toContain("cv-badge-archived");
  });

  it("omits the badge when the toggle is on but there's no swhid", () => {
    const cv = makeCv({ showArchivalStatus: true }, [item("S1")]);
    const html = byType(buildRenderedSections(cv), "datasets").items[0]!.html;
    expect(html).not.toContain("cv-badge-archived");
  });
});

describe("public evaluations line (Sciety)", () => {
  it("renders a 'Publicly evaluated' line with linked group names", () => {
    const cv = makeCv(
      { showPublicEvaluations: true },
      [],
      [
        item("PP1", {
          meta: {
            publicEvaluations: [
              {
                group: "eLife",
                type: "evaluation-summary",
                url: "https://x/1",
                date: "2024-03-01",
              },
              { group: "PREreview", type: "review-article", url: "https://x/2" },
            ],
          },
        }),
      ],
    );
    const html = byType(buildRenderedSections(cv), "preprints").items[0]!.html;
    expect(html).toContain("cv-public-evaluations");
    expect(html).toContain('<a href="https://x/1">eLife (2024)</a>');
    expect(html).toContain('<a href="https://x/2">PREreview</a>');
  });

  it("omits the line when the toggle is off", () => {
    const cv = makeCv(
      { showPublicEvaluations: false },
      [],
      [
        item("PP1", {
          meta: {
            publicEvaluations: [{ group: "eLife", type: "evaluation-summary", url: "https://x/1" }],
          },
        }),
      ],
    );
    const html = byType(buildRenderedSections(cv), "preprints").items[0]!.html;
    expect(html).not.toContain("cv-public-evaluations");
  });

  it("omits the line when there are no evaluations", () => {
    const cv = makeCv({ showPublicEvaluations: true }, [], [item("PP1")]);
    const html = byType(buildRenderedSections(cv), "preprints").items[0]!.html;
    expect(html).not.toContain("cv-public-evaluations");
  });
});

describe("renderCvHtml offline-safety with the new features", () => {
  it("keeps the archived link inside the escaped/self-contained document", () => {
    const cv = makeCv({ showArchivalStatus: true, showPublicEvaluations: true }, [
      item("S1", { meta: { swhid: `swh:1:snp:${"b".repeat(40)}` } }),
    ]);
    const html = renderCvHtml(cv);
    expect(html).toContain("cv-badge-archived");
  });

  it("strips the public-evaluations line in the ATS (parser-safe) template", () => {
    const cv = makeCv({ showPublicEvaluations: true }, [], [
      item("PP1", {
        meta: {
          publicEvaluations: [{ group: "eLife", type: "evaluation-summary", url: "https://x/1" }],
        },
      }),
    ]);
    const html = renderCvHtml({ ...cv, display: { ...cv.display, template: "ats" } });
    // .cv-badge/.cv-badges are already hidden in ATS (covers the archived link);
    // .cv-public-evaluations is a separate class and must be stripped alongside them.
    expect(html).toMatch(
      /\.cv-badge,\s*\.cv-badges[^{}]*\.cv-public-evaluations[^{}]*\{[^{}]*display:\s*none\s*!important/,
    );
  });
});
