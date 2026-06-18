import { describe, expect, it } from "vitest";
import {
  SYNC_REPORT_MAX_ITEMS,
  SYNC_REPORT_SUMMARY_THRESHOLD,
  SyncReportSchema,
  addedBySectionType,
  computeSyncReport,
  publicRecentAdditions,
  reviewEntries,
  safeParseSyncReport,
  type SyncReport,
} from "@/lib/cv/syncReport";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

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

function makeCv(sections: Array<{ id: string; type: string; items: CvItem[] }>): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: sections.map((s, i) => ({ title: s.type, visible: true, order: i, ...s })),
    provenance: { generatedAt: NOW, sources: ["openalex"] },
  });
}

describe("computeSyncReport", () => {
  it("reports the first sync as initial with the whole import counted", () => {
    const next = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          makeItem({ id: "W1", csl: { id: "W1", type: "article-journal", title: "A" } }),
          makeItem({ id: "G1", meta: { reviewFlag: "name-matched" }, included: false }),
        ],
      },
    ]);
    const report = computeSyncReport(null, next, { syncedAt: NOW });
    expect(report.initial).toBe(true);
    expect(report.addedTotal).toBe(2);
    expect(report.removedTotal).toBe(0);
    expect(report.added).toEqual([]); // no per-item flood on first import
    expect(report.reviewCandidates).toBe(1);
    expect(report.syncedAt).toBe(NOW);
  });

  it("diffs added and removed items by stable id across sections", () => {
    const prev = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          makeItem({ id: "W1", csl: { id: "W1", type: "article-journal", title: "Kept" } }),
          makeItem({ id: "W2", csl: { id: "W2", type: "article-journal", title: "Gone" } }),
        ],
      },
    ]);
    const next = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          makeItem({ id: "W1", csl: { id: "W1", type: "article-journal", title: "Kept" } }),
          makeItem({
            id: "W3",
            csl: { id: "W3", type: "article-journal", title: "Brand new" },
            meta: { reviewFlag: "orcid-doi" },
          }),
        ],
      },
      {
        id: "grants",
        type: "grants",
        items: [makeItem({ id: "G1", displayText: "New grant", included: false })],
      },
    ]);
    const report = computeSyncReport(prev, next, { syncedAt: NOW });
    expect(report.initial).toBe(false);
    expect(report.addedTotal).toBe(2);
    expect(report.removedTotal).toBe(1);
    expect(report.added).toEqual([
      { sectionType: "publications", itemId: "W3", title: "Brand new", reviewFlag: "orcid-doi" },
      { sectionType: "grants", itemId: "G1", title: "New grant", reviewFlag: undefined },
    ]);
    expect(report.reviewCandidates).toBe(1);
  });

  it("flattens inline markup in a stored entry title (the banner is plain text)", () => {
    const next = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          makeItem({
            id: "W9",
            csl: {
              id: "W9",
              type: "article-journal",
              title: "Role of <i>TP53</i> in <scp>NSCLC</scp>",
            },
          }),
        ],
      },
    ]);
    // Not the first sync (prev exists), so per-item entries are recorded.
    const prev = makeCv([{ id: "publications", type: "publications", items: [] }]);
    const report = computeSyncReport(prev, next, { syncedAt: NOW });
    expect(report.added[0]?.title).toBe("Role of TP53 in NSCLC");
  });

  it("a curation flip (hide / not-mine) is never an add or a remove", () => {
    const prev = makeCv([
      { id: "publications", type: "publications", items: [makeItem({ id: "W1" })] },
    ]);
    const next = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [makeItem({ id: "W1", included: false, notMine: true })],
      },
    ]);
    const report = computeSyncReport(prev, next, { syncedAt: NOW });
    expect(report.addedTotal).toBe(0);
    expect(report.removedTotal).toBe(0);
  });

  it("prefers the user's text override and truncates long titles", () => {
    const prev = makeCv([{ id: "positions", type: "positions", items: [] }]);
    const next = makeCv([
      {
        id: "positions",
        type: "positions",
        items: [
          makeItem({
            id: "P1",
            displayText: "Source title",
            displayTextOverride: "User title",
          }),
          makeItem({ id: "P2", displayText: "x".repeat(500) }),
          makeItem({ id: "P3" }), // neither csl nor text → empty title, still listed
        ],
      },
    ]);
    const report = computeSyncReport(prev, next, { syncedAt: NOW });
    expect(report.added[0]!.title).toBe("User title");
    expect(report.added[1]!.title).toHaveLength(200);
    expect(report.added[2]!.title).toBe("");
  });

  it("caps the stored entries while counting every added item and flag", () => {
    const prev = makeCv([{ id: "publications", type: "publications", items: [] }]);
    const many = Array.from({ length: SYNC_REPORT_MAX_ITEMS + 10 }, (_, i) =>
      makeItem({
        id: `W${i}`,
        // Flags placed AFTER the cap must still be counted.
        meta: i >= SYNC_REPORT_MAX_ITEMS ? { reviewFlag: "name-matched" } : {},
      }),
    );
    const next = makeCv([{ id: "publications", type: "publications", items: many }]);
    const report = computeSyncReport(prev, next, { syncedAt: NOW });
    expect(report.added).toHaveLength(SYNC_REPORT_MAX_ITEMS);
    expect(report.addedTotal).toBe(SYNC_REPORT_MAX_ITEMS + 10);
    expect(report.reviewCandidates).toBe(10);
  });

  it("passes through source counts and timings and validates against its schema", () => {
    const next = makeCv([{ id: "publications", type: "publications", items: [] }]);
    const report = computeSyncReport(null, next, {
      syncedAt: NOW,
      sourceCounts: { openalex: 12, datacite: 0 },
      timingsMs: { openalex: 812 },
    });
    expect(report.sourceCounts).toEqual({ openalex: 12, datacite: 0 });
    expect(report.timingsMs).toEqual({ openalex: 812 });
    expect(SyncReportSchema.safeParse(report).success).toBe(true);
  });
});

describe("safeParseSyncReport", () => {
  it("round-trips a stored report", () => {
    const next = makeCv([{ id: "publications", type: "publications", items: [] }]);
    const report = computeSyncReport(null, next, { syncedAt: NOW });
    expect(safeParseSyncReport(JSON.parse(JSON.stringify(report)))).toEqual(report);
  });

  it("degrades a corrupt / legacy value to null", () => {
    expect(safeParseSyncReport(null)).toBeNull();
    expect(safeParseSyncReport("nope")).toBeNull();
    expect(safeParseSyncReport({ syncedAt: NOW })).toBeNull();
    expect(
      safeParseSyncReport({
        syncedAt: NOW,
        initial: false,
        addedTotal: -1, // negative count
        removedTotal: 0,
        added: [],
        reviewCandidates: 0,
      }),
    ).toBeNull();
  });
});

describe("reviewEntries / addedBySectionType", () => {
  const base: SyncReport = {
    syncedAt: NOW,
    initial: false,
    addedTotal: 4,
    removedTotal: 0,
    added: [
      { sectionType: "publications", itemId: "W1", title: "a" },
      { sectionType: "grants", itemId: "G1", title: "b", reviewFlag: "name-matched" },
      { sectionType: "publications", itemId: "W2", title: "c" },
      { sectionType: "publications", itemId: "W3", title: "d", reviewFlag: "orcid-doi" },
    ],
    reviewCandidates: 2,
  };

  it("reviewEntries keeps only the review-flagged additions, in order", () => {
    expect(reviewEntries(base).map((e) => e.itemId)).toEqual(["G1", "W3"]);
  });

  it("addedBySectionType groups additions and sorts by count desc", () => {
    expect(addedBySectionType(base)).toEqual([
      { sectionType: "publications", count: 3 },
      { sectionType: "grants", count: 1 },
    ]);
  });

  it("the summary threshold is a positive integer", () => {
    expect(Number.isInteger(SYNC_REPORT_SUMMARY_THRESHOLD)).toBe(true);
    expect(SYNC_REPORT_SUMMARY_THRESHOLD).toBeGreaterThan(0);
  });
});

describe("publicRecentAdditions", () => {
  const cv = makeCv([
    {
      id: "publications",
      type: "publications",
      items: [makeItem({ id: "W1" }), makeItem({ id: "W2" }), makeItem({ id: "W4" })],
    },
    // A since-hidden dataset: present in the report but not visible → must be dropped.
    { id: "datasets", type: "datasets", items: [makeItem({ id: "D1", included: false })] },
  ]);
  const report: SyncReport = {
    syncedAt: NOW,
    initial: false,
    addedTotal: 4,
    removedTotal: 0,
    added: [
      { sectionType: "publications", itemId: "W1", title: "Paper one" },
      { sectionType: "publications", itemId: "W2", title: "Flagged", reviewFlag: "orcid-conflict" },
      { sectionType: "datasets", itemId: "D1", title: "Hidden data" },
      { sectionType: "publications", itemId: "W4", title: "Paper four" },
    ],
    reviewCandidates: 1,
  };

  it("keeps confirmed, still-visible additions; drops flagged and hidden ones", () => {
    expect(publicRecentAdditions(report, cv)).toEqual([
      { itemId: "W1", title: "Paper one", sectionType: "publications" },
      { itemId: "W4", title: "Paper four", sectionType: "publications" },
    ]);
  });

  it("caps to `max`, in document order", () => {
    expect(publicRecentAdditions(report, cv, 1)).toEqual([
      { itemId: "W1", title: "Paper one", sectionType: "publications" },
    ]);
  });

  it("returns [] for the initial import and for a missing report", () => {
    expect(publicRecentAdditions({ ...report, initial: true }, cv)).toEqual([]);
    expect(publicRecentAdditions(null, cv)).toEqual([]);
  });
});
