import { describe, expect, it } from "vitest";
import {
  CV_HEALTH_CATEGORIES,
  computeCvHealth,
  healthTargets,
  nextHealthTarget,
  type HealthTarget,
} from "@/lib/cv/health";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { orderedSections } from "@/lib/canonical/curate";

function item(over: Partial<CvItem> = {}): CvItem {
  return {
    id: over.id ?? "W1",
    source: "openalex",
    sourceId: "s",
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

function cv(items: CvItem[], display: Record<string, unknown> = {}): CanonicalCv {
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
        items: items.map((it, i) => ({ ...it, order: it.order ?? i })),
      },
    ],
    display,
  } as unknown as CanonicalCv;
}

const flagged = (id: string, reviewFlag: string, over: Partial<CvItem> = {}) =>
  item({ id, meta: { reviewFlag }, ...over } as Partial<CvItem>);

describe("healthTargets", () => {
  it("returns EVERY outstanding item of a category, not just the first", () => {
    // The gap this closes: the checklist could count a set but not read through
    // it. Jumping always landed on the same row.
    const t = healthTargets(
      cv([
        flagged("A", "likely-misattributed"),
        item({ id: "B" }),
        flagged("C", "likely-misattributed"),
        flagged("D", "likely-misattributed"),
      ]),
    );
    expect(t.misattributed.map((x) => x.itemId)).toEqual(["A", "C", "D"]);
    expect(t.misattributed[0]!.sectionId).toBe("publications");
  });

  it("includes VISIBLE flagged works, which no other walk in the editor reaches", () => {
    // An included work flagged orcid-conflict is a stranger's paper sitting on
    // the CV — the highest-stakes case, and the one reviewNavigation skips
    // because it requires !included.
    const t = healthTargets(cv([flagged("A", "orcid-conflict", { included: true })]));
    expect(t.conflicts.map((x) => x.itemId)).toEqual(["A"]);
  });

  it("walks in item order within a section", () => {
    const c = cv([
      flagged("second", "likely-misattributed", { order: 2 }),
      flagged("first", "likely-misattributed", { order: 1 }),
    ]);
    expect(healthTargets(c).misattributed.map((x) => x.itemId)).toEqual(["first", "second"]);
  });

  it("walks sections in the order the EDITOR renders them, not by stored order", () => {
    // The regression this pins: an earlier version sorted `cv.sections` by the
    // raw `order` field. When `display.sectionsCustomized` is unset — the common
    // case, nobody has dragged a section — the editor renders by
    // DEFAULT_SECTION_ORDER[type] and IGNORES the stored order, which is stale on
    // any document synced before that table was last renumbered. The walk then
    // visited rows in a different order from the one on screen.
    //
    // Both sections carry the same stale order, so a raw sort is decided by array
    // position; DEFAULT_SECTION_ORDER puts publications before grants.
    const twoSections = {
      schemaVersion: 2,
      owner: { name: "A Researcher" },
      sections: [
        {
          id: "grants",
          type: "grants",
          title: "Grants",
          visible: true,
          order: 2,
          items: [flagged("g1", "likely-misattributed")],
        },
        {
          id: "publications",
          type: "publications",
          title: "Publications",
          visible: true,
          order: 2,
          items: [flagged("p1", "likely-misattributed")],
        },
      ],
      display: {},
    } as unknown as CanonicalCv;

    expect(healthTargets(twoSections).misattributed.map((x) => x.itemId)).toEqual(["p1", "g1"]);
    expect(orderedSections(twoSections).map((s) => s.id)).toEqual(["publications", "grants"]);
  });

  it("honours a user's own section order once they have customised it", () => {
    const customised = {
      schemaVersion: 2,
      owner: { name: "A Researcher" },
      sections: [
        {
          id: "publications",
          type: "publications",
          title: "Publications",
          visible: true,
          order: 9,
          items: [flagged("p1", "likely-misattributed")],
        },
        {
          id: "grants",
          type: "grants",
          title: "Grants",
          visible: true,
          order: 1,
          items: [flagged("g1", "likely-misattributed")],
        },
      ],
      display: { sectionsCustomized: true },
    } as unknown as CanonicalCv;
    // Customised ⇒ stored order wins, and the walk follows it.
    expect(healthTargets(customised).misattributed.map((x) => x.itemId)).toEqual(["g1", "p1"]);
  });

  it("counts and targets agree for every category", () => {
    // These two used to live in different files with a "keep in sync" comment
    // and nothing enforcing it. Now one module — and this pins the equivalence.
    const c = cv(
      [
        flagged("r1", "name-matched", { included: false }),
        flagged("r2", "orcid-doi", { included: false }),
        flagged("d1", "duplicate"),
        flagged("c1", "orcid-conflict"),
        flagged("m1", "likely-misattributed"),
        item({ id: "x1", meta: { retracted: true } }),
      ],
      {},
    );
    const health = computeCvHealth(c);
    const t = healthTargets(c);
    expect(t.review).toHaveLength(health.pendingReviewCandidates);
    expect(t.duplicates).toHaveLength(health.pendingDuplicates);
    expect(t.conflicts).toHaveLength(health.orcidConflicts);
    expect(t.misattributed).toHaveLength(health.likelyMisattributed);
    expect(t.retracted).toHaveLength(health.retractedVisible);
    // And nothing is silently missing a category.
    for (const k of CV_HEALTH_CATEGORIES) expect(Array.isArray(t[k])).toBe(true);
  });

  it("respects dismissal, hiding and not-mine exactly as the counts do", () => {
    const dismissed = { dismissedReviewCandidates: ["m1", "r1"] };
    const c = cv(
      [
        flagged("m1", "likely-misattributed"),
        flagged("r1", "name-matched", { included: false }),
        flagged("m2", "likely-misattributed", { included: false }), // hidden
        flagged("c1", "orcid-conflict", { notMine: true }), // asserted away
      ],
      dismissed,
    );
    const t = healthTargets(c);
    expect(t.misattributed).toHaveLength(0);
    expect(t.review).toHaveLength(0);
    expect(t.conflicts).toHaveLength(0);
  });

  it("omits retracted works when the user has chosen to hide them", () => {
    const items = [item({ id: "x", meta: { retracted: true } })];
    expect(healthTargets(cv(items)).retracted).toHaveLength(1);
    expect(healthTargets(cv(items, { hideRetracted: true })).retracted).toHaveLength(0);
  });
});

describe("nextHealthTarget", () => {
  const ts: HealthTarget[] = [
    { sectionId: "s", itemId: "A" },
    { sectionId: "s", itemId: "B" },
    { sectionId: "s", itemId: "C" },
  ];

  it("starts at the first when nothing has been visited", () => {
    expect(nextHealthTarget(ts)?.itemId).toBe("A");
    expect(nextHealthTarget(ts, null)?.itemId).toBe("A");
  });

  it("advances, and WRAPS — so repeated activation reads the whole set", () => {
    expect(nextHealthTarget(ts, "A")?.itemId).toBe("B");
    expect(nextHealthTarget(ts, "B")?.itemId).toBe("C");
    expect(nextHealthTarget(ts, "C")?.itemId).toBe("A");
  });

  it("restarts from the first when the last-visited row is gone", () => {
    // It was acted on and left the category — don't strand the walk.
    expect(nextHealthTarget(ts, "vanished")?.itemId).toBe("A");
  });

  it("returns null for an empty category rather than a bogus target", () => {
    expect(nextHealthTarget([])).toBeNull();
    expect(nextHealthTarget([], "A")).toBeNull();
  });

  it("stays on the single item of a one-item category", () => {
    const one: HealthTarget[] = [{ sectionId: "s", itemId: "only" }];
    expect(nextHealthTarget(one, "only")?.itemId).toBe("only");
  });
});
