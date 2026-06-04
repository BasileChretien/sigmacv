import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { authorshipCounts } from "@/lib/render/authorship";
import { authorshipTableHtml } from "@/lib/render/templates/shared";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

/** A journal work where the self-author sits at `pos` (1-based) of `n` authors. */
function work(id: string, pos: number, n: number, corresponding = false): OpenAlexWork {
  const authorships = Array.from({ length: n }, (_, i) => ({
    author: { id: i === pos - 1 ? SELF : `https://openalex.org/A_other${i}` },
    is_corresponding: i === pos - 1 ? corresponding : false,
  }));
  return {
    id: `https://openalex.org/${id}`,
    title: id,
    display_name: id,
    type: "article",
    publication_year: 2024,
    authorships,
    primary_location: { source: { display_name: "J. Pharmacology", type: "journal" } },
  } as OpenAlexWork;
}

function build(works: OpenAlexWork[]) {
  return buildCanonicalCv({ id: "a", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}

describe("build: author position + corresponding", () => {
  it("records the 1-based author position and corresponding flag", () => {
    const cv = build([work("W1", 2, 5, true)]);
    const item = cv.sections.flatMap((s) => s.items).find((i) => i.sourceId === "https://openalex.org/W1")!;
    expect(item.meta.authorPosition).toBe(2);
    expect(item.meta.authorCount).toBe(5);
    expect(item.meta.isCorresponding).toBe(true);
  });
});

describe("build: no-venue work is treated as a preprint", () => {
  it("routes a venue-less article to Preprints (not peer-reviewed)", () => {
    const noVenue = work("Wnv", 1, 1);
    noVenue.primary_location = { source: undefined };
    const cv = build([noVenue]);
    const item = cv.sections.flatMap((s) => s.items).find((i) => i.sourceId === "https://openalex.org/Wnv")!;
    expect(item.meta.peerReviewed).toBe(false);
    expect(cv.sections.find((s) => s.type === "preprints")?.items.length).toBe(1);
  });
});

describe("authorshipCounts", () => {
  // Position roles partition each paper (front ordinal wins ties; last wins the
  // final position): first(1/3) · last+corr(3/3, p===n) · second(2/4) ·
  // first(1/1, single) · third(3/4, front wins over second-to-last).
  const cv = build([
    work("Wa", 1, 3),
    work("Wb", 3, 3, true),
    work("Wc", 2, 4),
    work("Wd", 1, 1),
    work("We", 3, 4),
  ]);

  it("counts every authorship role over peer-reviewed publications", () => {
    const rows = authorshipCounts(cv, [
      "first",
      "second",
      "third",
      "middle",
      "second-last",
      "last",
      "corresponding",
    ]);
    const by = Object.fromEntries(rows.map((r) => [r.role, r.count]));
    expect(by.first).toBe(2); // Wa (1/3) + Wd (1/1)
    expect(by.second).toBe(1); // Wc (2/4)
    expect(by.third).toBe(1); // We (3/4); Wb (3/3) is the LAST author, not third
    expect(by.middle).toBe(0); // nobody is in positions 4..n-2 (max n is 4)
    expect(by["second-last"]).toBe(0); // We (3/4) is "third" — front ordinal wins
    expect(by.last).toBe(1); // Wb (3/3); Wd 1/1 → first, not "last"
    expect(by.corresponding).toBe(1); // Wb (orthogonal — overlaps "last")
  });

  it("position roles are a partition: each paper counts once → they sum to 100%", () => {
    const deep = build([
      work("Wf", 1, 5), // first
      work("Wk1", 5, 8), // 5 of 8 → k-th middle
      work("Wk2", 4, 6), // 4 of 6 → k-th middle
      work("Ws2", 2, 4), // second
      work("Ws3", 2, 3), // 2 of 3 → second (front wins over second-to-last)
      work("Wt", 3, 4), // 3 of 4 → third (front wins over second-to-last)
      work("Wstl", 7, 8), // second-to-last (n-1=7)
      work("Wl", 6, 6), // last
      work("Wl2", 2, 2), // 2 of 2 → LAST (last wins over second)
    ]);
    const roles = ["first", "second", "third", "middle", "second-last", "last"] as const;
    const rows = authorshipCounts(deep, roles);
    const by = Object.fromEntries(rows.map((r) => [r.role, r.count]));
    expect(by.first).toBe(1); // Wf
    expect(by.second).toBe(2); // Ws2 (2/4) + Ws3 (2/3)
    expect(by.third).toBe(1); // Wt (3/4)
    expect(by.middle).toBe(2); // Wk1 (5/8) + Wk2 (4/6)
    expect(by["second-last"]).toBe(1); // Wstl (7/8)
    expect(by.last).toBe(2); // Wl (6/6) + Wl2 (2/2)
    // The defining property: every paper lands in exactly one position role.
    expect(roles.reduce((acc, r) => acc + (by[r] ?? 0), 0)).toBe(9);
    expect(rows.every((r) => r.total === 9)).toBe(true);
  });

  it("reports a shared denominator and per-role percentage", () => {
    const rows = authorshipCounts(cv, ["first", "second", "corresponding"]);
    // 5 peer-reviewed works → the percentage base is the same for every row.
    expect(rows.every((r) => r.total === 5)).toBe(true);
    const by = Object.fromEntries(rows.map((r) => [r.role, r.percent]));
    expect(by.first).toBe(40); // 2 of 5
    expect(by.second).toBe(20); // 1 of 5
    expect(by.corresponding).toBe(20); // 1 of 5
  });

  it("yields a 0% (not NaN) percentage when there are no counted works", () => {
    const empty = build([]);
    const rows = authorshipCounts(empty, ["first"]);
    expect(rows).toEqual([
      { role: "first", label: "First author", count: 0, total: 0, percent: 0 },
    ]);
  });

  it("excludes preprints from the counts", () => {
    const preprint = work("Wp", 1, 2);
    preprint.type = "preprint";
    preprint.primary_location = { source: { display_name: "bioRxiv", type: "repository" } };
    const withPre = build([work("Wj", 1, 2), preprint]);
    const rows = authorshipCounts(withPre, ["first"]);
    expect(rows[0]!.count).toBe(1); // only the journal article, not the preprint
  });

  it("ignores unknown role strings", () => {
    expect(authorshipCounts(cv, ["bogus"])).toEqual([]);
  });

  it("counts letters only when countLetters is on", () => {
    const item = (pos: number, n: number, peerReviewed: boolean) => ({
      csl: {},
      authoredBySelf: true,
      included: true,
      notMine: false,
      selfNameVariants: [],
      meta: { authorPosition: pos, authorCount: n, peerReviewed },
    });
    const make = (countLetters: boolean) =>
      ({
        display: { countLetters },
        sections: [
          { type: "publications", items: [item(1, 3, true), item(1, 2, false)] }, // 2nd is a letter
        ],
      }) as unknown as CanonicalCv;
    const off = authorshipCounts(make(false), ["first"])[0]!;
    expect([off.count, off.total]).toEqual([1, 1]); // letter excluded
    const on = authorshipCounts(make(true), ["first"])[0]!;
    expect([on.count, on.total]).toEqual([2, 2]); // letter included
  });
});

describe("authorshipTableHtml", () => {
  const base = build([work("Wa", 1, 3), work("Wb", 3, 3, true)]);
  it("renders nothing when disabled", () => {
    expect(authorshipTableHtml(base)).toBe("");
  });
  it("renders nothing when enabled but no roles are chosen", () => {
    const cv = updateDisplay(base, { showAuthorshipTable: true, authorshipRoles: [] });
    expect(authorshipTableHtml(cv)).toBe("");
  });
  it("renders nothing when every chosen role count is zero (stale/empty data)", () => {
    // base has a 1st author (Wa) and a 3rd-of-3 author (Wb); nobody is "second".
    const cv = updateDisplay(base, {
      showAuthorshipTable: true,
      authorshipRoles: ["second"],
    });
    expect(authorshipTableHtml(cv)).toBe("");
  });
  it("renders a table with the chosen roles when enabled", () => {
    const cv = updateDisplay(base, {
      showAuthorshipTable: true,
      authorshipRoles: ["first", "last", "corresponding"],
    });
    const html = authorshipTableHtml(cv);
    expect(html).toContain("cv-authorship");
    expect(html).toContain("First author");
    expect(html).toContain("Corresponding author");
    // base has 2 peer-reviewed works; first/last/corresponding are each 1 → 50%.
    expect(html).toContain("cv-authorship-pct");
    expect(html).toContain("50%");
    expect(html).toContain("n=2"); // denominator surfaced in the caption
  });
  it("drops the '(peer-reviewed)' caption qualifier when letters are counted", () => {
    const cv = updateDisplay(base, {
      showAuthorshipTable: true,
      authorshipRoles: ["first", "last"],
      countLetters: true,
    });
    const html = authorshipTableHtml(cv);
    expect(html).toContain("Authorship"); // base caption kept
    expect(html).not.toContain("peer-reviewed"); // qualifier dropped (letters counted)
  });
});
