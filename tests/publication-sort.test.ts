import { describe, expect, it } from "vitest";
import {
  CITATION_SECTION_TYPES,
  publicationSortActive,
  sortPublicationItems,
} from "@/lib/canonical/publicationSort";
import type { CvItem } from "@/lib/canonical/schema";

/** Minimal CvItem carrying only the fields the sort reads. */
function item(id: string, order: number, year?: number, citedByCount?: number): CvItem {
  return { id, order, meta: { year, citedByCount } } as unknown as CvItem;
}
const ids = (items: CvItem[]) => items.map((i) => i.id);

describe("sortPublicationItems", () => {
  // Input order is deliberately NOT year-sorted — as if newer works were appended
  // last on re-sync (the exact situation that put a fresh paper at the bottom).
  const input = [
    item("a", 0, 2020, 5),
    item("b", 1, 2026, 1), // newest, fewest citations
    item("c", 2, 2018, 99), // oldest, most cited
  ];

  it("custom returns an unchanged COPY (never mutates)", () => {
    const out = sortPublicationItems(input, "custom");
    expect(ids(out)).toEqual(["a", "b", "c"]);
    expect(out).not.toBe(input);
  });

  it("year-desc sorts newest first", () => {
    expect(ids(sortPublicationItems(input, "year-desc"))).toEqual(["b", "a", "c"]);
  });

  it("year-asc sorts oldest first", () => {
    expect(ids(sortPublicationItems(input, "year-asc"))).toEqual(["c", "a", "b"]);
  });

  it("citations sorts most-cited first", () => {
    expect(ids(sortPublicationItems(input, "citations"))).toEqual(["c", "a", "b"]);
  });

  it("treats missing year/citations as 0 (sinks to the bottom for descending orders)", () => {
    expect(ids(sortPublicationItems([item("y", 0), item("x", 1, 2025)], "year-desc"))).toEqual([
      "x",
      "y",
    ]);
    expect(
      ids(sortPublicationItems([item("m", 0), item("n", 1, undefined, 10)], "citations")),
    ).toEqual(["n", "m"]);
  });

  it("is stable — equal keys keep the incoming order", () => {
    const ties = [item("p", 0, 2024), item("q", 1, 2024), item("r", 2, 2024)];
    expect(ids(sortPublicationItems(ties, "year-desc"))).toEqual(["p", "q", "r"]);
  });

  it("does not mutate the input array", () => {
    const before = ids(input);
    sortPublicationItems(input, "year-desc");
    expect(ids(input)).toEqual(before);
  });
});

describe("publicationSortActive", () => {
  it("is true only for citation sections with a non-custom order", () => {
    expect(publicationSortActive("publications", "year-desc")).toBe(true);
    expect(publicationSortActive("preprints", "citations")).toBe(true);
    expect(publicationSortActive("publications", "custom")).toBe(false);
    expect(publicationSortActive("positions", "year-desc")).toBe(false);
    expect(publicationSortActive("education", "custom")).toBe(false);
  });
});

describe("CITATION_SECTION_TYPES", () => {
  it("contains exactly publications + preprints", () => {
    expect([...CITATION_SECTION_TYPES].sort()).toEqual(["preprints", "publications"]);
    expect(CITATION_SECTION_TYPES.has("datasets")).toBe(false);
  });
});

describe("sortPublicationItems honours the owner's year correction", () => {
  // The editor + every render bind the year field to itemEffectiveYear
  // (yearOverride ?? year); the sort must read the same value or a corrected
  // work lands visibly out of order under "Newest first".
  const withOverride = (id: string, year: number, yearOverride?: number): CvItem =>
    ({ id, order: 0, meta: { year, yearOverride } }) as unknown as CvItem;
  const input = [
    withOverride("plain-2020", 2020),
    withOverride("corrected-2019-to-2023", 2019, 2023),
    withOverride("plain-2021", 2021),
  ];

  it("year-desc puts a work corrected to 2023 above 2021 and 2020", () => {
    expect(ids(sortPublicationItems(input, "year-desc"))).toEqual([
      "corrected-2019-to-2023",
      "plain-2021",
      "plain-2020",
    ]);
  });

  it("year-asc puts it last", () => {
    expect(ids(sortPublicationItems(input, "year-asc"))).toEqual([
      "plain-2020",
      "plain-2021",
      "corrected-2019-to-2023",
    ]);
  });
});
