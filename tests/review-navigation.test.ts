import { describe, expect, it } from "vitest";
import { nextReviewItemId, pendingReviewItems } from "@/lib/cv/reviewNavigation";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";

/**
 * Backs the "Matched by name — review these" chips: the provenance panel is
 * where a user learns a source left them decisions, so it is also where they
 * should be able to go and make them.
 */

function item(id: string, source: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source,
    sourceId: id,
    displayText: id,
    included: false,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: { reviewFlag: "name-matched" },
    ...over,
  } as CvItem;
}

function cvWith(items: CvItem[]): CanonicalCv {
  return {
    sections: [
      {
        id: "editorial",
        type: "editorial",
        title: "Editorial Roles",
        visible: true,
        order: 6,
        items: items.slice(0, 2),
      },
      {
        id: "trials",
        type: "trials",
        title: "Clinical Trials",
        visible: true,
        order: 7,
        items: items.slice(2),
      },
    ],
  } as unknown as CanonicalCv;
}

describe("pendingReviewItems", () => {
  it("returns only undecided candidates from the requested source", () => {
    const cv = cvWith([
      item("oep-1", "oep"),
      item("oep-included", "oep", { included: true }),
      item("trial-1", "clinicaltrials"),
    ]);
    expect(pendingReviewItems(cv, "oep").map((i) => i.id)).toEqual(["oep-1"]);
    expect(pendingReviewItems(cv, "clinicaltrials").map((i) => i.id)).toEqual(["trial-1"]);
  });

  it("excludes a candidate the user confirmed or rejected", () => {
    // Both are finished decisions; jumping to either would be a dead end.
    const cv = cvWith([
      item("confirmed", "oep", { included: true }),
      item("rejected", "oep", { notMine: true }),
    ]);
    expect(pendingReviewItems(cv, "oep")).toEqual([]);
  });

  it("excludes an auto-included row that was never a candidate", () => {
    // A scraped OEP role carries no reviewFlag — it is on the CV, not pending.
    const cv = cvWith([item("scraped", "oep", { included: true, meta: {} })]);
    expect(pendingReviewItems(cv, "oep")).toEqual([]);
  });

  it("is safe with no cv or no source", () => {
    expect(pendingReviewItems(null, "oep")).toEqual([]);
    expect(pendingReviewItems(cvWith([item("a", "oep")]), undefined)).toEqual([]);
  });
});

describe("nextReviewItemId", () => {
  const cv = cvWith([item("a", "oep"), item("b", "oep"), item("c", "oep")]);

  it("starts at the first candidate", () => {
    expect(nextReviewItemId(cv, "oep")).toBe("a");
  });

  it("cycles through the set and wraps", () => {
    expect(nextReviewItemId(cv, "oep", "a")).toBe("b");
    expect(nextReviewItemId(cv, "oep", "b")).toBe("c");
    expect(nextReviewItemId(cv, "oep", "c")).toBe("a");
  });

  it("restarts from the first when the remembered id is gone", () => {
    // The row was curated away between clicks; don't strand the user.
    expect(nextReviewItemId(cv, "oep", "vanished")).toBe("a");
  });

  it("returns null when the source has nothing outstanding", () => {
    expect(nextReviewItemId(cv, "nih")).toBeNull();
    expect(nextReviewItemId(cvWith([]), "oep")).toBeNull();
    expect(nextReviewItemId(null, "oep")).toBeNull();
  });
});
