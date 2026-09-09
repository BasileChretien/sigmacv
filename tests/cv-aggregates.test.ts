import { describe, expect, it } from "vitest";
import type { CanonicalCv, CvItem, CvSectionType } from "@/lib/canonical/schema";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { OPEN_ACCESS_STATES } from "@/lib/cv/worklist";
import {
  CV_AGGREGATES_VERSION,
  UNKNOWN_YEAR,
  computeCvAggregates,
  parseCvAggregates,
  type CvAggregates,
} from "@/lib/institutions/cvAggregates";
import { workRecords } from "@/lib/oai/oai";

/**
 * The per-CV aggregate the institution page sums: counts of the works the
 * PUBLIC page lists — the same selection the OAI-PMH per-work records use —
 * by year × open-access state and by section type. Counts only, integers
 * only; hidden, "not mine", excluded and retracted works never enter it.
 */

type Meta = Record<string, unknown>;

function item(id: string, meta: Meta, extra: Partial<CvItem> = {}): CvItem {
  return {
    id,
    included: true,
    csl: { id, type: "article-journal", title: `Work ${id}` },
    meta,
    ...extra,
  } as unknown as CvItem;
}

function section(
  id: string,
  type: CvSectionType,
  items: CvItem[],
  order: number,
  visible = true,
): CanonicalCv["sections"][number] {
  return { id, type, title: id, visible, order, items } as CanonicalCv["sections"][number];
}

function doc(
  sections: CanonicalCv["sections"],
  display: Record<string, unknown> = {},
): CanonicalCv {
  return {
    schemaVersion: 2,
    owner: { displayName: "Ada Lovelace", orcid: "0000-0002-7483-2489" },
    display: { locale: "en-US", cslStyle: "apa", ...display },
    sections,
  } as unknown as CanonicalCv;
}

/** The CV every case below starts from: two visible sections, one hidden one,
 *  and every way a work can be kept off the public page. */
function fixture(): CanonicalCv {
  return doc([
    section(
      "publications",
      "publications",
      [
        item("p-cc", { year: 2020, oaIsOpen: true, license: "cc-by" }),
        item("p-other", { year: 2020, oaIsOpen: true, license: "publisher-specific-oa" }),
        item("p-closed", { year: 2021, oaIsOpen: false }),
        item("p-unknown", { year: 2021 }),
        item("p-noyear", { oaIsOpen: true }),
        item("p-override", { year: 2019, yearOverride: 2022, oaIsOpen: false }),
        item("p-retracted", { year: 2021, oaIsOpen: true, retracted: true }),
        item("p-notmine", { year: 2021 }, { notMine: true }),
        item("p-hidden", { year: 2021 }, { included: false }),
        item("p-excluded", { year: 2021 }),
      ],
      0,
    ),
    section("preprints", "preprints", [item("pre-1", { year: 2023, peerReviewed: false })], 1),
    section("datasets", "datasets", [item("d-1", { year: 2023 })], 2, false),
  ]);
}

const EXCLUDED = { excludedItems: { publications: ["p-excluded"] } };

describe("computeCvAggregates", () => {
  it("counts EXACTLY the works the OAI-PMH per-work records (the public page's selection) expose", () => {
    const cv = doc(fixture().sections, EXCLUDED);
    const a = computeCvAggregates(cv);
    const records = workRecords({
      slug: "ada-x7",
      datestamp: new Date("2026-09-09T00:00:00Z"),
      cv: projectCvForPublic(cv),
    });
    expect(records.map((r) => r.itemId).sort()).toEqual(
      ["p-cc", "p-other", "p-closed", "p-unknown", "p-noyear", "p-override", "pre-1"].sort(),
    );
    expect(a.worksTotal).toBe(records.length);
    // Every year row and every section row adds up to the same total.
    const yearSum = Object.values(a.byYear).reduce((n, y) => n + y.total, 0);
    const typeSum = Object.values(a.byType).reduce((n, c) => n + (c ?? 0), 0);
    expect(yearSum).toBe(a.worksTotal);
    expect(typeSum).toBe(a.worksTotal);
    for (const row of Object.values(a.byYear)) {
      expect(OPEN_ACCESS_STATES.reduce((n, st) => n + row.oa[st], 0)).toBe(row.total);
    }
  });

  it("never counts a 'not mine', hidden, view-excluded or retracted work, nor a hidden section", () => {
    const cv = doc(fixture().sections, EXCLUDED);
    const a = computeCvAggregates(cv);
    expect(a.byType).toEqual({ publications: 6, preprints: 1 });
    expect(a.byType).not.toHaveProperty("datasets");
    // 2021 holds the closed + undetermined works only: the retracted, the
    // "not mine", the hidden and the excluded 2021 works are all absent.
    expect(a.byYear["2021"]).toEqual({
      total: 2,
      oa: { "open-cc": 0, "open-other": 0, "no-open-copy-found": 1, "not-determined": 1 },
    });
    expect(JSON.stringify(a)).not.toContain("retract");
  });

  it("files a work with no year under the 'unknown' key and honours the owner's year override", () => {
    const a = computeCvAggregates(fixture());
    expect(UNKNOWN_YEAR).toBe("unknown");
    expect(a.byYear[UNKNOWN_YEAR]?.total).toBe(1);
    expect(a.byYear["2022"]?.total).toBe(1);
    expect(a.byYear).not.toHaveProperty("2019");
  });

  it("uses the worklist's four open-access states, derived from the stored fields", () => {
    const a = computeCvAggregates(fixture());
    expect(a.byYear["2020"]).toEqual({
      total: 2,
      oa: { "open-cc": 1, "open-other": 1, "no-open-copy-found": 0, "not-determined": 0 },
    });
    expect(a.byYear[UNKNOWN_YEAR]?.oa["open-other"]).toBe(1);
    expect(Object.keys(a.byYear["2020"]!.oa).sort()).toEqual([...OPEN_ACCESS_STATES].sort());
  });

  it("follows the public list's own choices: 'peer-reviewed only' and the publications cap narrow it", () => {
    expect(computeCvAggregates(doc(fixture().sections, { peerReviewedOnly: true })).byType).toEqual(
      { publications: 7 },
    );
    expect(
      computeCvAggregates(doc(fixture().sections, { publicationsLimit: 2 })).byType.publications,
    ).toBe(2);
  });

  it("is counts only: the serialised JSON holds integers and no share, percentage or ratio", () => {
    const json = JSON.stringify(computeCvAggregates(fixture()));
    for (const word of ["share", "pct", "ratio", "%", "percent"]) expect(json).not.toContain(word);
    for (const n of json.match(/-?\d+(\.\d+)?/g) ?? [])
      expect(Number.isInteger(Number(n))).toBe(true);
    expect(json).not.toMatch(/\d\.\d/);
  });

  it("is versioned and empty for a CV with nothing public", () => {
    const a = computeCvAggregates(doc([]));
    expect(a).toEqual({ v: CV_AGGREGATES_VERSION, worksTotal: 0, byYear: {}, byType: {} });
  });
});

describe("parseCvAggregates", () => {
  it("round-trips what computeCvAggregates produced (through JSON, as the column stores it)", () => {
    const a = computeCvAggregates(fixture());
    expect(parseCvAggregates(JSON.parse(JSON.stringify(a)))).toEqual(a);
  });

  it("refuses anything that is not the stored shape — a null, a junk row, a share, a negative or a float", () => {
    const good: CvAggregates = {
      v: 1,
      worksTotal: 1,
      byYear: {
        "2020": {
          total: 1,
          oa: { "open-cc": 1, "open-other": 0, "no-open-copy-found": 0, "not-determined": 0 },
        },
      },
      byType: { publications: 1 },
    };
    expect(parseCvAggregates(good)).toEqual(good);
    for (const bad of [
      null,
      undefined,
      "x",
      { v: 2, worksTotal: 1, byYear: {}, byType: {} },
      { ...good, worksTotal: -1 },
      { ...good, worksTotal: 0.5 },
      { ...good, byType: { publications: "1" } },
      { ...good, byYear: { "2020": { total: 1, oa: { "open-cc": 1 } } } },
      { ...good, byYear: { "2020": { total: 1, share: 0.5, oa: good.byYear["2020"]!.oa } } },
    ]) {
      expect(parseCvAggregates(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});
