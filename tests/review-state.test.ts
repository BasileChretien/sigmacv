import { describe, expect, it } from "vitest";
import {
  isReviewable,
  itemReviewState,
  reviewCoverage,
  unreviewedItems,
} from "@/lib/canonical/review";
import { setItemNotMine, setItemReviewed } from "@/lib/canonical/curate";
import { setItemsNotMine } from "@/lib/canonical/bulkCurate";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";

const NOW = "2026-09-02T10:00:00.000Z";

function item(over: Partial<CvItem> = {}): CvItem {
  return {
    id: over.id ?? "W1",
    source: "openalex",
    sourceId: "https://openalex.org/W1",
    csl: { id: over.id ?? "W1", type: "article-journal", title: "A work" },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: {},
    ...over,
  } as CvItem;
}

function cv(items: CvItem[]): CanonicalCv {
  return {
    schemaVersion: 2,
    owner: { name: "A Researcher" },
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items,
      },
    ],
    display: {},
  } as unknown as CanonicalCv;
}

describe("itemReviewState", () => {
  it("defaults to unreviewed for a freshly synced item", () => {
    expect(itemReviewState(item())).toBe("unreviewed");
  });

  it("is confirmed once reviewedAt is stamped", () => {
    expect(itemReviewState(item({ reviewedAt: NOW }))).toBe("confirmed");
  });

  it("is rejected when notMine is asserted", () => {
    expect(itemReviewState(item({ notMine: true }))).toBe("rejected");
  });

  it("gives notMine precedence, so confirmed+notMine cannot be represented", () => {
    // The contradictory pair is storable but never readable as "confirmed" —
    // this is the invariant that lets us keep a single timestamp field.
    expect(itemReviewState(item({ notMine: true, reviewedAt: NOW }))).toBe("rejected");
  });
});

describe("isReviewable", () => {
  it("counts a source-attributed citation item", () => {
    expect(isReviewable(item())).toBe(true);
  });

  it("excludes non-citation entries (positions, editorial roles)", () => {
    expect(isReviewable(item({ csl: undefined, displayText: "Lecturer, Somewhere" }))).toBe(false);
  });

  it("excludes user-supplied items, which cannot pad the denominator", () => {
    expect(isReviewable(item({ source: "manual" }))).toBe(false);
    expect(isReviewable(item({ source: "bibtex" }))).toBe(false);
    expect(isReviewable(item({ meta: { claimed: true } }))).toBe(false);
  });

  it("still counts hidden and rejected works", () => {
    // Rejecting a work must not shrink the denominator, or the percentage would
    // climb every time the user found a misattribution.
    expect(isReviewable(item({ included: false }))).toBe(true);
    expect(isReviewable(item({ notMine: true }))).toBe(true);
  });
});

describe("reviewCoverage", () => {
  it("reports no fraction for a profile with nothing to review", () => {
    const c = reviewCoverage(cv([item({ source: "manual" })]));
    expect(c.reviewable).toBe(0);
    expect(c.fraction).toBeUndefined();
  });

  it("counts confirmed and rejected as reviewed", () => {
    const c = reviewCoverage(
      cv([
        item({ id: "W1", reviewedAt: NOW }),
        item({ id: "W2", notMine: true }),
        item({ id: "W3" }),
        item({ id: "W4" }),
      ]),
    );
    expect(c).toMatchObject({
      reviewable: 4,
      reviewed: 2,
      confirmed: 1,
      rejected: 1,
      fraction: 0.5,
    });
  });

  it("ignores user-supplied items in both numerator and denominator", () => {
    const c = reviewCoverage(
      cv([
        item({ id: "W1", reviewedAt: NOW }),
        item({ id: "M1", source: "manual", reviewedAt: NOW }),
      ]),
    );
    expect(c.reviewable).toBe(1);
    expect(c.fraction).toBe(1);
  });
});

describe("unreviewedItems", () => {
  it("returns only unadjudicated reviewable items, with their section", () => {
    const out = unreviewedItems(
      cv([
        item({ id: "W1", reviewedAt: NOW }),
        item({ id: "W2" }),
        item({ id: "W3", notMine: true }),
        // Unreviewed, but user-supplied — never a worklist entry.
        item({ id: "M1", source: "manual" }),
      ]),
    );
    expect(out.map((o) => o.item.id)).toEqual(["W2"]);
    expect(out[0]!.sectionId).toBe("publications");
  });

  it("respects the bound so a huge profile cannot build an unbounded list", () => {
    const many = Array.from({ length: 50 }, (_, i) => item({ id: `W${i}` }));
    expect(unreviewedItems(cv(many), 10)).toHaveLength(10);
  });
});

describe("curate write paths", () => {
  it("setItemReviewed stamps and clears the timestamp without touching display", () => {
    const before = cv([item({ id: "W1" })]);
    const after = setItemReviewed(before, "publications", "W1", true, { now: NOW });
    const it0 = after.sections[0]!.items[0]!;
    expect(it0.reviewedAt).toBe(NOW);
    expect(it0.included).toBe(true);
    expect(it0.notMine).toBe(false);
    expect(before.sections[0]!.items[0]!.reviewedAt).toBeUndefined(); // immutable

    const cleared = setItemReviewed(after, "publications", "W1", false);
    expect(cleared.sections[0]!.items[0]!.reviewedAt).toBeUndefined();
  });

  it("asserting notMine also records the review", () => {
    const after = setItemNotMine(cv([item({ id: "W1" })]), "publications", "W1", true, {
      reason: "different-person",
      now: NOW,
    });
    const it0 = after.sections[0]!.items[0]!;
    expect(it0.reviewedAt).toBe(NOW);
    expect(itemReviewState(it0)).toBe("rejected");
  });

  it("retracting notMine leaves the item reviewed, not unreviewed", () => {
    const asserted = setItemNotMine(cv([item({ id: "W1" })]), "publications", "W1", true, {
      now: NOW,
    });
    const retracted = setItemNotMine(asserted, "publications", "W1", false, { now: NOW });
    const it0 = retracted.sections[0]!.items[0]!;
    // The user has looked at this work and decided it IS theirs — that is a
    // confirmation, not a return to "never examined".
    expect(itemReviewState(it0)).toBe("confirmed");
  });
});

describe("review state does not leak, and bulk keeps parity", () => {
  it("is stripped from the public projection, like notMineAssertedAt", () => {
    // WHEN the owner adjudicated each work is private curation behaviour. The
    // raw `json` public format serializes this object directly, so anything left
    // on the item is published.
    const reviewed = setItemReviewed(cv([item({ id: "W1" })]), "publications", "W1", true, {
      now: NOW,
    });
    const pub = projectCvForPublic(reviewed);
    const published = pub.sections.flatMap((s) => s.items);
    expect(published).toHaveLength(1);
    expect(published[0]!.reviewedAt).toBeUndefined();
    // …while the stored document keeps it for the owner.
    expect(reviewed.sections[0]!.items[0]!.reviewedAt).toBe(NOW);
  });

  it("bulk 'not mine' records the review, exactly as the single-item path does", () => {
    // A namesake cleanup is dozens of works at once — the path a high-collision
    // user actually takes. If bulk skipped the stamp, they would adjudicate 30
    // works and watch review progress stay at zero.
    const before = cv([item({ id: "W1" }), item({ id: "W2" }), item({ id: "W3" })]);
    const after = setItemsNotMine(before, "publications", ["W1", "W2"], true, {
      reason: "different-person",
      now: NOW,
    });
    const byId = new Map(after.sections[0]!.items.map((i) => [i.id, i]));
    expect(byId.get("W1")!.reviewedAt).toBe(NOW);
    expect(byId.get("W2")!.reviewedAt).toBe(NOW);
    expect(byId.get("W3")!.reviewedAt).toBeUndefined(); // untouched
    expect(reviewCoverage(after)).toMatchObject({ reviewable: 3, reviewed: 2, rejected: 2 });
  });

  it("bulk retraction leaves the items reviewed, not unreviewed", () => {
    const asserted = setItemsNotMine(cv([item({ id: "W1" })]), "publications", ["W1"], true, {
      now: NOW,
    });
    const retracted = setItemsNotMine(asserted, "publications", ["W1"], false, { now: NOW });
    expect(itemReviewState(retracted.sections[0]!.items[0]!)).toBe("confirmed");
  });
});
