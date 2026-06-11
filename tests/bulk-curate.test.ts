import { describe, expect, it } from "vitest";
import {
  filterSectionItems,
  hiddenIds,
  matchesBulkFilter,
  notMineEligibleIds,
  setItemsInView,
  setItemsIncluded,
  setItemsNotMine,
} from "@/lib/canonical/bulkCurate";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";

const NOW = "2026-06-11T12:00:00.000Z";

function makeItem(over: Partial<CvItem> & { id: string }): CvItem {
  return {
    source: "openalex",
    sourceId: "https://openalex.org/x",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
    ...over,
  };
}

function makeCv(items: CvItem[], extra: Partial<CanonicalCv> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items,
      },
      {
        id: "preprints",
        type: "preprints",
        title: "Preprints",
        visible: true,
        order: 1,
        items: [makeItem({ id: "PRE1" })],
      },
    ],
    provenance: { generatedAt: NOW, sources: ["openalex"] },
    ...extra,
  });
}

const pubs = (cv: CanonicalCv): CvSection => cv.sections.find((s) => s.id === "publications")!;

describe("matchesBulkFilter", () => {
  const item = makeItem({
    id: "W1",
    csl: {
      id: "W1",
      type: "article-journal",
      title: "Adverse drug reactions in oncology",
      "container-title": "British Journal of Clinical Pharmacology",
    },
    meta: { year: 2021, reviewFlag: "orcid-doi" },
  });

  it("matches case-insensitively on title, venue and display text", () => {
    expect(matchesBulkFilter(item, { text: "ADVERSE drug" })).toBe(true);
    expect(matchesBulkFilter(item, { text: "british journal" })).toBe(true);
    expect(matchesBulkFilter(item, { text: "nephrology" })).toBe(false);
    const positional = makeItem({ id: "P1", displayText: "Professor — Nagoya University" });
    expect(matchesBulkFilter(positional, { text: "nagoya" })).toBe(true);
    // A user override is what the editor shows, so it is what filters match.
    const overridden = makeItem({ id: "P2", displayText: "Old", displayTextOverride: "Lecturer" });
    expect(matchesBulkFilter(overridden, { text: "lecturer" })).toBe(true);
  });

  it("applies inclusive year bounds; an item without a year never matches bounds", () => {
    expect(matchesBulkFilter(item, { yearFrom: 2021, yearTo: 2021 })).toBe(true);
    expect(matchesBulkFilter(item, { yearFrom: 2022 })).toBe(false);
    expect(matchesBulkFilter(item, { yearTo: 2020 })).toBe(false);
    const noYear = makeItem({ id: "W2" });
    expect(matchesBulkFilter(noYear, { yearFrom: 2000 })).toBe(false);
    expect(matchesBulkFilter(noYear, { yearTo: 2030 })).toBe(false);
    expect(matchesBulkFilter(noYear, {})).toBe(true);
  });

  it("flaggedOnly keeps only review-flagged items; blank text is ignored", () => {
    expect(matchesBulkFilter(item, { flaggedOnly: true })).toBe(true);
    expect(matchesBulkFilter(makeItem({ id: "W2" }), { flaggedOnly: true })).toBe(false);
    expect(matchesBulkFilter(makeItem({ id: "W2" }), { text: "   " })).toBe(true);
  });
});

describe("filterSectionItems", () => {
  it("returns matches in display order", () => {
    const cv = makeCv([
      makeItem({ id: "B", order: 1, meta: { year: 2020 } }),
      makeItem({ id: "A", order: 0, meta: { year: 2019 } }),
      makeItem({ id: "C", order: 2, meta: { year: 1999 } }),
    ]);
    const out = filterSectionItems(pubs(cv), { yearFrom: 2010 });
    expect(out.map((i) => i.id)).toEqual(["A", "B"]);
  });
});

describe("setItemsIncluded / setItemsNotMine", () => {
  it("hides exactly the listed ids in the target section, immutably", () => {
    const cv = makeCv([makeItem({ id: "W1" }), makeItem({ id: "W2" }), makeItem({ id: "W3" })]);
    const snapshot = JSON.stringify(cv);
    const next = setItemsIncluded(cv, "publications", ["W1", "W3"], false);
    expect(JSON.stringify(cv)).toBe(snapshot); // input untouched
    const by = Object.fromEntries(pubs(next).items.map((i) => [i.id, i.included]));
    expect(by).toEqual({ W1: false, W2: true, W3: false });
    // The other section is untouched (same reference).
    expect(next.sections.find((s) => s.id === "preprints")).toBe(
      cv.sections.find((s) => s.id === "preprints"),
    );
  });

  it("is an identity for an empty id list", () => {
    const cv = makeCv([makeItem({ id: "W1" })]);
    expect(setItemsIncluded(cv, "publications", [], false)).toBe(cv);
    expect(setItemsNotMine(cv, "publications", [], true)).toBe(cv);
    expect(setItemsInView(cv, "publications", [], false)).toBe(cv);
  });

  it("asserts not-mine on every listed item with one shared reason + timestamp", () => {
    const cv = makeCv([makeItem({ id: "W1" }), makeItem({ id: "W2" }), makeItem({ id: "W3" })]);
    const next = setItemsNotMine(cv, "publications", ["W1", "W2"], true, {
      reason: "different-person",
      now: NOW,
    });
    for (const id of ["W1", "W2"]) {
      const it = pubs(next).items.find((i) => i.id === id)!;
      expect(it.notMine).toBe(true);
      expect(it.notMineAssertedAt).toBe(NOW);
      expect(it.notMineReason).toBe("different-person");
    }
    expect(pubs(next).items.find((i) => i.id === "W3")!.notMine).toBe(false);
  });

  it("retracting not-mine clears the timestamp and reason", () => {
    const cv = makeCv([
      makeItem({
        id: "W1",
        notMine: true,
        notMineAssertedAt: NOW,
        notMineReason: "different-person",
      }),
    ]);
    const it = pubs(setItemsNotMine(cv, "publications", ["W1"], false)).items[0]!;
    expect(it.notMine).toBe(false);
    expect(it.notMineAssertedAt).toBeUndefined();
    expect(it.notMineReason).toBeUndefined();
  });

  it("stamps wall-clock time when `now` is omitted", () => {
    const cv = makeCv([makeItem({ id: "W1" })]);
    const before = Date.now();
    const it = pubs(setItemsNotMine(cv, "publications", ["W1"], true)).items[0]!;
    expect(Date.parse(it.notMineAssertedAt!)).toBeGreaterThanOrEqual(before);
  });
});

describe("setItemsInView", () => {
  it("excludes a batch from the current view in one rewrite, deduplicated", () => {
    const cv = makeCv([makeItem({ id: "W1" }), makeItem({ id: "W2" })]);
    const hidden = setItemsInView(cv, "publications", ["W1", "W2", "W2"], false);
    expect(hidden.display.excludedItems?.publications?.sort()).toEqual(["W1", "W2"]);
    // Re-hiding an already-hidden id never duplicates it.
    const again = setItemsInView(hidden, "publications", ["W1"], false);
    expect(again.display.excludedItems?.publications?.sort()).toEqual(["W1", "W2"]);
  });

  it("re-showing removes the ids and prunes an empty record", () => {
    const cv = makeCv([makeItem({ id: "W1" }), makeItem({ id: "W2" })]);
    const hidden = setItemsInView(cv, "publications", ["W1", "W2"], false);
    const shown = setItemsInView(hidden, "publications", ["W1", "W2"], true);
    expect(shown.display.excludedItems).toBeUndefined();
  });

  it("leaves other sections' exclusions in place", () => {
    const cv = makeCv([makeItem({ id: "W1" })]);
    const other = setItemsInView(cv, "preprints", ["PRE1"], false);
    const both = setItemsInView(other, "publications", ["W1"], false);
    const cleared = setItemsInView(both, "publications", ["W1"], true);
    expect(cleared.display.excludedItems).toEqual({ preprints: ["PRE1"] });
  });
});

describe("notMineEligibleIds / hiddenIds", () => {
  it("applies the per-row eligibility rule to a mixed selection", () => {
    const section: CvSection = {
      id: "publications",
      type: "publications",
      title: "Publications",
      visible: true,
      order: 0,
      items: [
        makeItem({ id: "CIT", csl: { id: "CIT", type: "article-journal", title: "T" } }),
        makeItem({ id: "MAN", source: "manual", sourceId: "manual" }),
        makeItem({ id: "DAT", source: "datacite" }),
        makeItem({ id: "OAI", source: "openaire" }),
        makeItem({ id: "DBL", source: "dblp" }),
        makeItem({ id: "OEP", source: "oep" }),
        makeItem({ id: "UKR", source: "ukri" }), // name+org matched → no claim
      ],
    };
    expect(
      notMineEligibleIds(section, ["CIT", "MAN", "DAT", "OAI", "DBL", "OEP", "UKR"]).sort(),
    ).toEqual(["CIT", "DAT", "DBL", "OAI", "OEP"]);
    // Positions: source-derived rows are eligible; manual rows stay delete-only.
    const positions: CvSection = { ...section, id: "positions", type: "positions" };
    expect(notMineEligibleIds(positions, ["UKR", "MAN"])).toEqual(["UKR"]);
    // Only ids actually in the selection are considered.
    expect(notMineEligibleIds(section, ["DAT"])).toEqual(["DAT"]);
  });

  it("hiddenIds reports the hidden subset of a selection", () => {
    const cv = makeCv([
      makeItem({ id: "W1", included: false }),
      makeItem({ id: "W2", notMine: true }),
      makeItem({ id: "W3" }),
    ]);
    expect(hiddenIds(pubs(cv), ["W1", "W2", "W3"]).sort()).toEqual(["W1", "W2"]);
    expect(hiddenIds(pubs(cv), ["W3"])).toEqual([]);
  });
});
