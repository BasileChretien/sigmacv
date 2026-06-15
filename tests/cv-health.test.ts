import { describe, expect, it } from "vitest";
import { computeCvHealth } from "@/lib/cv/health";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

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

function makeCv(items: CvItem[], display: Record<string, unknown> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display,
    sections: [
      { id: "publications", type: "publications", title: "P", visible: true, order: 0, items },
    ],
    provenance: { generatedAt: "2026-06-11T00:00:00.000Z", sources: ["openalex"] },
  });
}

describe("computeCvHealth", () => {
  it("is all-zero for a clean CV", () => {
    const health = computeCvHealth(makeCv([makeItem({ id: "W1" })]));
    expect(health).toEqual({
      pendingReviewCandidates: 0,
      pendingDuplicates: 0,
      orcidConflicts: 0,
      retractedVisible: 0,
      total: 0,
    });
  });

  it("counts undecided review candidates (hidden, not yet shown nor disowned)", () => {
    const health = computeCvHealth(
      makeCv([
        makeItem({ id: "G1", included: false, meta: { reviewFlag: "name-matched" } }),
        makeItem({ id: "W1", included: false, meta: { reviewFlag: "orcid-doi" } }),
        // Confirmed (Show) → no longer pending.
        makeItem({ id: "G2", included: true, meta: { reviewFlag: "name-matched" } }),
        // Disowned → decided, no longer pending.
        makeItem({
          id: "G3",
          included: false,
          notMine: true,
          meta: { reviewFlag: "name-matched" },
        }),
      ]),
    );
    expect(health.pendingReviewCandidates).toBe(2);
    expect(health.total).toBe(2);
  });

  it("stops counting a review candidate once it is kept hidden (dismissed)", () => {
    const items = [
      makeItem({ id: "W1", included: false, meta: { reviewFlag: "orcid-doi" } }),
      makeItem({ id: "G1", included: false, meta: { reviewFlag: "name-matched" } }),
    ];
    expect(computeCvHealth(makeCv(items)).pendingReviewCandidates).toBe(2);
    // "Keep hidden" records the id in display.dismissedReviewCandidates → resolved.
    expect(
      computeCvHealth(makeCv(items, { dismissedReviewCandidates: ["W1", "G1"] }))
        .pendingReviewCandidates,
    ).toBe(0);
  });

  it("counts visible duplicate hints and ORCID conflicts, ignoring hidden ones", () => {
    const dupMeta = {
      reviewFlag: "duplicate" as const,
      duplicateOf: { itemId: "W9", tier: "exact" as const, groupId: "W9" },
    };
    const health = computeCvHealth(
      makeCv([
        makeItem({ id: "D1", meta: dupMeta }),
        makeItem({ id: "D2", included: false, meta: dupMeta }), // hidden → resolved
        makeItem({ id: "C1", authoredBySelf: true, meta: { reviewFlag: "orcid-conflict" } }),
        makeItem({ id: "C2", notMine: true, meta: { reviewFlag: "orcid-conflict" } }),
      ]),
    );
    expect(health.pendingDuplicates).toBe(1);
    expect(health.orcidConflicts).toBe(1);
    expect(health.total).toBe(2);
  });

  it("counts shown retracted works, except when hideRetracted already excludes them", () => {
    const items = [
      makeItem({ id: "R1", meta: { retracted: true } }),
      makeItem({ id: "R2", included: false, meta: { retracted: true } }),
    ];
    expect(computeCvHealth(makeCv(items)).retractedVisible).toBe(1);
    expect(computeCvHealth(makeCv(items, { hideRetracted: true })).retractedVisible).toBe(0);
  });
});
