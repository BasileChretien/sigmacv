import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
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
  // first(1/3) · last+corresponding(3/3) · second & middle(2/4) ·
  // single(1/1) · third & middle & second-last(3/4).
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
    expect(by.third).toBe(2); // Wb (3/3) + We (3/4)
    expect(by.middle).toBe(2); // Wc (2/4) + We (3/4); Wb 3/3 is "last", not middle
    expect(by["second-last"]).toBe(1); // We (3 of 4); needs ≥3 authors
    expect(by.last).toBe(1); // Wb (3/3); Wd 1/1 → not counted as "last"
    expect(by.corresponding).toBe(1); // Wb
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
  });
});
