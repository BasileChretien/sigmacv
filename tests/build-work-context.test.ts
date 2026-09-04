import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CvItem } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

/**
 * Per-work assessment context captured from the OpenAlex work object at build:
 * `fwci`, OpenAlex's `is_retracted` flag, distinct authorship countries and the
 * reference / self-reference counts. Stored on `meta` only — no aggregate.
 */

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

const OWNER = {
  author_position: "first",
  author: {
    id: "https://openalex.org/A5001069481",
    display_name: "B. Chrétien",
    orcid: "https://orcid.org/0000-0002-7483-2489",
  },
  raw_author_name: "B. Chrétien",
};

function work(id: string, extra: Partial<OpenAlexWork> = {}): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Work ${id}`,
    display_name: `Work ${id}`,
    publication_year: 2024,
    type: "article",
    type_crossref: "journal-article",
    cited_by_count: 3,
    authorships: [OWNER],
    primary_location: { source: { id: "S1", display_name: "J", type: "journal" } },
    ids: { openalex: `https://openalex.org/${id}` },
    ...extra,
  };
}

function itemsOf(cv: ReturnType<typeof buildCanonicalCv>): Map<string, CvItem> {
  return new Map(cv.sections.flatMap((s) => s.items).map((it) => [it.id, it]));
}

function build(works: OpenAlexWork[], orcidDiscoveredWorks?: OpenAlexWork[]) {
  return itemsOf(
    buildCanonicalCv({
      id: "cv_ctx",
      resolved,
      works,
      orcidDiscoveredWorks,
      now: "2026-06-02T00:00:00.000Z",
    }),
  );
}

describe("build: OpenAlex per-work assessment context", () => {
  it("stores fwci when numeric and leaves it undefined otherwise", () => {
    const items = build([
      work("W1", { fwci: 1.3 }),
      work("W2", { fwci: null }),
      work("W3", { fwci: "2" as unknown as number }),
    ]);
    expect(items.get("W1")!.meta.fwci).toBe(1.3);
    expect(items.get("W2")!.meta.fwci).toBeUndefined();
    expect(items.get("W3")!.meta.fwci).toBeUndefined();
  });

  it("sets meta.retracted from OpenAlex `is_retracted === true` only", () => {
    const items = build([
      work("W1", { is_retracted: true }),
      work("W2", { is_retracted: false }),
      work("W3", { is_retracted: null }),
      work("W4", { is_retracted: "true" as unknown as boolean }),
      work("W5"),
    ]);
    expect(items.get("W1")!.meta.retracted).toBe(true);
    for (const id of ["W2", "W3", "W4", "W5"]) {
      // Never `false`: the Crossref enrichment unions onto an absent flag.
      expect(items.get(id)!.meta.retracted).toBeUndefined();
    }
  });

  it("collects distinct uppercased ISO-3166 alpha-2 authorship countries", () => {
    const items = build([
      work("W1", {
        authorships: [
          { ...OWNER, countries: ["fr", "FR", " us "] },
          {
            author: { id: "https://openalex.org/A2" },
            countries: ["JP", null as unknown as string, "xyz", 7 as unknown as string],
          },
          { author: { id: "https://openalex.org/A3" }, countries: null },
          { author: { id: "https://openalex.org/A4" } },
        ],
      }),
      work("W2"),
    ]);
    expect(items.get("W1")!.meta.countries).toEqual(["FR", "US", "JP"]);
    expect(items.get("W2")!.meta.countries).toBeUndefined();
  });

  it("caps the country list at 50", () => {
    const many = Array.from(
      { length: 60 },
      (_, i) => String.fromCharCode(65 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26)),
    );
    const items = build([work("W1", { authorships: [{ ...OWNER, countries: many }] })]);
    const countries = items.get("W1")!.meta.countries!;
    expect(countries).toHaveLength(50);
    expect(new Set(countries).size).toBe(50);
    expect(countries[0]).toBe("AA");
  });

  it("counts references and self-references against the owner's own works in this sync", () => {
    const items = build([
      work("W1", {
        referenced_works: [
          "https://openalex.org/W2", // own
          "https://openalex.org/W3", // own
          "https://openalex.org/W999", // someone else's
          42 as unknown as string, // malformed entry — counted in refCount, never a self-ref
        ],
      }),
      work("W2", { referenced_works: [] }),
      work("W3", { referenced_works: null }),
      work("W4"),
    ]);
    expect(items.get("W1")!.meta).toMatchObject({ refCount: 4, selfRefs: 2 });
    expect(items.get("W2")!.meta).toMatchObject({ refCount: 0, selfRefs: 0 });
    expect(items.get("W3")!.meta.refCount).toBeUndefined();
    expect(items.get("W3")!.meta.selfRefs).toBeUndefined();
    expect(items.get("W4")!.meta.refCount).toBeUndefined();
  });

  it("counts an ORCID-discovered candidate's references against the attributed set only", () => {
    const items = build(
      [work("W1"), work("W2")],
      [
        work("W7", {
          doi: "https://doi.org/10.1/w7",
          referenced_works: ["https://openalex.org/W1", "https://openalex.org/W8"],
        }),
        work("W8", {
          doi: "https://doi.org/10.1/w8",
          referenced_works: ["https://openalex.org/W7"],
        }),
      ],
    );
    // W1 is attributed → a self-reference; W8 is only another unconfirmed candidate.
    expect(items.get("W7")!.meta).toMatchObject({ refCount: 2, selfRefs: 1 });
    expect(items.get("W8")!.meta).toMatchObject({ refCount: 1, selfRefs: 0 });
  });
});
