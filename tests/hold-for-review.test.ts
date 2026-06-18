import { describe, expect, it } from "vitest";
import { applyHoldForReview } from "@/lib/cv/holdForReview";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

function item(over: Partial<CvItem> & { id: string }): CvItem {
  return {
    source: "openalex",
    sourceId: `https://openalex.org/${over.id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id: over.id, type: "article-journal", title: over.id },
    meta: {},
    ...over,
  };
}

function cv(opts: { hold?: boolean; items: CvItem[] }): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: { holdNewForReview: opts.hold ?? false },
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: opts.items,
      },
    ],
    provenance: { generatedAt: "2026-06-11T12:00:00.000Z", sources: ["openalex"] },
  });
}

describe("applyHoldForReview", () => {
  it("holds only freshly-found own works; leaves everything else untouched", () => {
    const previous = cv({ items: [item({ id: "W0" })] });
    const next = cv({
      hold: true,
      items: [
        item({ id: "W0" }), // already present → untouched
        item({ id: "W1" }), // NEW own auto-include → held
        item({ id: "W2", included: false, meta: { reviewFlag: "name-matched" } }), // already a candidate → untouched
        item({ id: "W3", authoredBySelf: false }), // new but not the owner's → untouched
        item({ id: "W4", notMine: true }), // new but asserted "not mine" → untouched
      ],
    });
    const section = applyHoldForReview(next, previous).sections.find(
      (s) => s.type === "publications",
    )!;
    const find = (id: string): CvItem => {
      const it = section.items.find((i) => i.id === id);
      if (!it) throw new Error(`missing item ${id}`);
      return it;
    };

    expect(find("W0").included).toBe(true);
    expect(find("W0").meta.reviewFlag).toBeUndefined();
    expect(find("W1").included).toBe(false);
    expect(find("W1").meta.reviewFlag).toBe("held-for-review");
    expect(find("W2").included).toBe(false);
    expect(find("W2").meta.reviewFlag).toBe("name-matched");
    expect(find("W3").included).toBe(true);
    expect(find("W3").meta.reviewFlag).toBeUndefined();
    expect(find("W4").meta.reviewFlag).toBeUndefined();
  });

  it("is a no-op when the toggle is off", () => {
    const next = cv({ hold: false, items: [item({ id: "W1" })] });
    expect(applyHoldForReview(next, cv({ items: [] }))).toBe(next);
  });

  it("is a no-op on the first sync (no previous document)", () => {
    const next = cv({ hold: true, items: [item({ id: "W1" })] });
    expect(applyHoldForReview(next, null)).toBe(next);
  });

  it("returns the document unchanged when the toggle is on but nothing is new", () => {
    const items = [item({ id: "W1" }), item({ id: "W2" })];
    const next = cv({ hold: true, items });
    // Every id is already present in `previous` → no section changes → same ref back.
    expect(applyHoldForReview(next, cv({ items }))).toBe(next);
  });
});
