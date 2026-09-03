import { describe, expect, it } from "vitest";
import {
  isSourceAttributed,
  itemReviewState,
  needsReview,
  reviewCoverage,
  unreviewedItems,
} from "@/lib/canonical/review";
import { setItemNotMine, setItemReviewed } from "@/lib/canonical/curate";
import { setItemsNotMine } from "@/lib/canonical/bulkCurate";
import { reviewedAtAfterNotMine } from "@/lib/canonical/curate";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { safeParseCanonicalCv } from "@/lib/canonical/schema";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";
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

describe("isSourceAttributed (the base population)", () => {
  it("counts a source-attributed citation item", () => {
    expect(isSourceAttributed(item())).toBe(true);
  });

  it("excludes non-citation entries (positions, editorial roles)", () => {
    expect(isSourceAttributed(item({ csl: undefined, displayText: "Lecturer" }))).toBe(false);
  });

  it("excludes user-supplied items, which cannot pad the denominator", () => {
    expect(isSourceAttributed(item({ source: "manual" }))).toBe(false);
    expect(isSourceAttributed(item({ source: "bibtex" }))).toBe(false);
    expect(isSourceAttributed(item({ meta: { claimed: true } }))).toBe(false);
  });
});

describe("needsReview (the denominator: only what is actually doubtful)", () => {
  it("does NOT ask about a cleanly ORCID-matched work with no adverse signal", () => {
    // The point of the whole module. A researcher with 123 sound publications
    // must not be told 115 of them "need review" — that is busywork, and it
    // contradicts misattribution.ts's precision-over-recall design.
    expect(needsReview(item({ meta: { matchBasis: "orcid" } }))).toBe(false);
    expect(needsReview(item({ meta: { matchBasis: "both" } }))).toBe(false);
    expect(needsReview(item())).toBe(false);
  });

  it("asks about a work carrying a review flag", () => {
    expect(needsReview(item({ meta: { reviewFlag: "name-matched" } }))).toBe(true);
    expect(needsReview(item({ meta: { reviewFlag: "orcid-conflict" } }))).toBe(true);
    expect(needsReview(item({ meta: { reviewFlag: "likely-misattributed" } }))).toBe(true);
  });

  it("asks about a work the misattribution heuristic fired on", () => {
    const flagged = item({
      meta: { misattribution: { score: 0.8, signals: ["no-coauthor-overlap"] } },
    });
    expect(needsReview(flagged)).toBe(true);
  });

  it("does NOT treat a bare openalex-id match as doubt", () => {
    // Tempting, but ORCID is on only a minority of OpenAlex authorships, so most
    // of a sound profile matches by author id alone. Flagging it would put the
    // majority of a 123-work CV back on the to-do list. It is a prior for an
    // attribution-probability model, not a task; misattribution.ts already
    // combines it with corroborating signals, and THAT verdict counts.
    expect(needsReview(item({ meta: { matchBasis: "openalex-id" } }))).toBe(false);
  });

  it("never asks about items outside the base population, however flagged", () => {
    expect(needsReview(item({ source: "manual", meta: { reviewFlag: "duplicate" } }))).toBe(false);
    expect(needsReview(item({ meta: { claimed: true, reviewFlag: "duplicate" } }))).toBe(false);
  });

  it("still counts hidden and rejected works", () => {
    // Rejecting must not shrink the denominator, or the figure would climb every
    // time the user found a misattribution.
    const base = { reviewFlag: "name-matched" } as const;
    expect(needsReview(item({ included: false, meta: base }))).toBe(true);
    expect(needsReview(item({ notMine: true, meta: base }))).toBe(true);
  });
});

describe("reviewCoverage", () => {
  it("reports no fraction for a profile with nothing worth reviewing", () => {
    // A clean profile of soundly-matched works: nothing to ask, so no figure.
    const c = reviewCoverage(cv([item({ meta: { matchBasis: "orcid" } }), item({ id: "W2" })]));
    expect(c.reviewable).toBe(0);
    expect(c.fraction).toBeUndefined();
  });

  it("counts confirmed and rejected as reviewed", () => {
    const flag = { reviewFlag: "name-matched" } as const;
    const c = reviewCoverage(
      cv([
        item({ id: "W1", reviewedAt: NOW, meta: flag }),
        item({ id: "W2", notMine: true, meta: flag }),
        item({ id: "W3", meta: flag }),
        item({ id: "W4", meta: flag }),
        // A sound work: invisible to the denominator entirely.
        item({ id: "W5", meta: { matchBasis: "orcid" } }),
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
        item({ id: "W1", reviewedAt: NOW, meta: { reviewFlag: "name-matched" } }),
        item({
          id: "M1",
          source: "manual",
          reviewedAt: NOW,
          meta: { reviewFlag: "name-matched" },
        }),
      ]),
    );
    expect(c.reviewable).toBe(1);
    expect(c.fraction).toBe(1);
  });
});

describe("unreviewedItems", () => {
  it("returns only unadjudicated reviewable items, with their section", () => {
    const flag = { reviewFlag: "name-matched" } as const;
    const out = unreviewedItems(
      cv([
        item({ id: "W1", reviewedAt: NOW, meta: flag }),
        item({ id: "W2", meta: flag }),
        item({ id: "W3", notMine: true, meta: flag }),
        // Unreviewed, but user-supplied — never a worklist entry.
        item({ id: "M1", source: "manual", meta: flag }),
        // Unreviewed and sound — nothing to ask about.
        item({ id: "W9", meta: { matchBasis: "orcid" } }),
      ]),
    );
    expect(out.map((o) => o.item.id)).toEqual(["W2"]);
    expect(out[0]!.sectionId).toBe("publications");
  });

  it("respects the bound so a huge profile cannot build an unbounded list", () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      item({ id: `W${i}`, meta: { reviewFlag: "name-matched" } }),
    );
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
    const flag = { reviewFlag: "name-matched" } as const;
    const before = cv([
      item({ id: "W1", meta: flag }),
      item({ id: "W2", meta: flag }),
      item({ id: "W3", meta: flag }),
    ]);
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

describe("reviewedAt is validated as a real timestamp", () => {
  /** A genuine canonical document, with `reviewedAt` on its first citation set
   *  to `value` — the shape safeParseCanonicalCv actually sees in production. */
  function docWithReviewedAt(value: unknown): unknown {
    const built = buildCanonicalCv({
      id: "v",
      resolved: {
        orcid: "0000-0002-7483-2489",
        authorIds: ["A5001069481"],
        displayName: "A Researcher",
      },
      works: worksFixture as unknown as OpenAlexWork[],
      now: "2026-09-03T00:00:00.000Z",
    });
    const raw = JSON.parse(JSON.stringify(built)) as {
      sections: Array<{ items: Array<Record<string, unknown>> }>;
    };
    const target = raw.sections.flatMap((s) => s.items).find((i) => i.csl);
    if (!target) throw new Error("fixture has no citation item");
    target.reviewedAt = value;
    return raw;
  }

  it("accepts what the write paths actually produce", () => {
    const parsed = safeParseCanonicalCv(docWithReviewedAt(new Date().toISOString()));
    expect(parsed.success).toBe(true);
    const stamped = parsed.success
      ? parsed.data.sections.flatMap((s) => s.items).filter((i) => i.reviewedAt)
      : [];
    expect(stamped).toHaveLength(1);
  });

  it.each(["yes", "", "2026-09-03", "2026-09-03T01:00:00+09:00", "not-a-date"])(
    "drops the malformed value %j instead of counting it as reviewed",
    (bad) => {
      const parsed = safeParseCanonicalCv(docWithReviewedAt(bad));
      // The document still loads — a bad timestamp must never cost the owner
      // their whole CV (getCvForUser returns null on a parse failure).
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      const items = parsed.data.sections.flatMap((s) => s.items);
      expect(items.filter((i) => i.reviewedAt)).toHaveLength(0);
      expect(items.every((i) => itemReviewState(i) !== "confirmed")).toBe(true);
      expect(reviewCoverage(parsed.data).confirmed).toBe(0);
    },
  );
});

describe("retraction only adjudicates items that were actually asserted", () => {
  // The bug this guards: bulk retract-not-mine stamped reviewedAt on EVERY
  // selected item, including ones that were never "not mine". One click on a
  // selection promoted works nobody had examined into the strongest evidence
  // class — laundering unreviewed works as confirmed.
  const NEVER = { id: "W1" } as const;

  it("leaves an item that was never asserted completely untouched", () => {
    // Flagged, so these sit in the review denominator — otherwise the coverage
    // assertion below would hold trivially under the buggy implementation too.
    const flag = { reviewFlag: "name-matched" } as const;
    const before = cv([item({ ...NEVER, meta: flag }), item({ id: "W2", meta: flag })]);
    const after = setItemsNotMine(before, "publications", ["W1", "W2"], false, { now: NOW });
    for (const it of after.sections[0]!.items) {
      expect(it.reviewedAt).toBeUndefined();
      expect(itemReviewState(it)).toBe("unreviewed");
    }
    const cov = reviewCoverage(after);
    expect(cov.reviewable).toBe(2); // both genuinely in the denominator
    expect(cov.reviewed).toBe(0); // and a no-op retract moved neither
  });

  it("same rule on the single-item path", () => {
    const after = setItemNotMine(cv([item(NEVER)]), "publications", "W1", false, { now: NOW });
    expect(after.sections[0]!.items[0]!.reviewedAt).toBeUndefined();
  });

  it("still records the review when a real assertion is retracted", () => {
    const asserted = setItemsNotMine(cv([item(NEVER)]), "publications", ["W1"], true, { now: NOW });
    const retracted = setItemsNotMine(asserted, "publications", ["W1"], false, { now: NOW });
    expect(itemReviewState(retracted.sections[0]!.items[0]!)).toBe("confirmed");
  });

  it("does not let a mixed selection launder the un-asserted members", () => {
    // The realistic shape of the bug: a namesake cleanup, then "actually these
    // are mine" over a wider selection than was ever flagged.
    let c = cv([item({ id: "A" }), item({ id: "B" }), item({ id: "C" })]);
    c = setItemsNotMine(c, "publications", ["A"], true, { now: NOW });
    c = setItemsNotMine(c, "publications", ["A", "B", "C"], false, { now: NOW });
    const byId = new Map(c.sections[0]!.items.map((i) => [i.id, i]));
    expect(itemReviewState(byId.get("A")!)).toBe("confirmed"); // genuinely adjudicated
    expect(byId.get("B")!.reviewedAt).toBeUndefined(); // never touched
    expect(byId.get("C")!.reviewedAt).toBeUndefined();
  });

  it("preserves an earlier review timestamp rather than refreshing it", () => {
    const EARLIER = "2026-01-01T00:00:00.000Z";
    const c = cv([item({ id: "W1", notMine: true, reviewedAt: EARLIER })]);
    const out = setItemsNotMine(c, "publications", ["W1"], false, { now: NOW });
    expect(out.sections[0]!.items[0]!.reviewedAt).toBe(EARLIER);
  });
});

describe("reviewedAtAfterNotMine (the shared rule)", () => {
  // Tested directly so the two call sites cannot drift apart again — they
  // already did once, which is how the bug above reached production.
  it.each([
    ["assert always stamps", { notMine: false }, true, NOW],
    ["assert overrides an older stamp", { notMine: false, reviewedAt: "2026-01-01" }, true, NOW],
    [
      "retract on an asserted item keeps its stamp",
      { notMine: true, reviewedAt: "2026-01-01" },
      false,
      "2026-01-01",
    ],
    ["retract on an asserted item with no stamp records one", { notMine: true }, false, NOW],
    ["retract on a never-asserted item changes nothing", { notMine: false }, false, undefined],
    [
      "retract on a never-asserted, already-reviewed item keeps its stamp",
      { notMine: false, reviewedAt: "2026-01-01" },
      false,
      "2026-01-01",
    ],
  ])("%s", (_label, it0, notMine, expected) => {
    expect(reviewedAtAfterNotMine(it0 as never, notMine as boolean, NOW)).toBe(expected);
  });
});
