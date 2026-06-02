import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { parseCanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};

function build() {
  return buildCanonicalCv({
    id: "cv_test",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("buildCanonicalCv", () => {
  it("produces a schema-valid canonical object", () => {
    const cv = build();
    expect(() => parseCanonicalCv(cv)).not.toThrow();
    expect(cv.schemaVersion).toBe(1);
    expect(cv.owner.orcid).toBe("0000-0002-7483-2489");
    expect(cv.sections).toHaveLength(1);
    expect(cv.sections[0]!.type).toBe("publications");
  });

  it("orders items newest-first with sequential order indices", () => {
    const items = build().sections[0]!.items;
    expect(items.map((i) => i.id)).toEqual([
      "W4300000002", // 2024
      "W4300000001", // 2023
      "W4300000003", // 2020
    ]);
    expect(items.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it("flags authoredBySelf by identifier — matches on OpenAlex id OR ORCID", () => {
    const items = build().sections[0]!.items;
    const byId = (id: string) => items.find((i) => i.id === id)!;
    // matched by primary author id
    expect(byId("W4300000001").authoredBySelf).toBe(true);
    // matched by secondary author id + orcid
    expect(byId("W4300000002").authoredBySelf).toBe(true);
  });

  it("does NOT flag a same-family-name work with a different identifier", () => {
    const namesake = build().sections[0]!.items.find(
      (i) => i.id === "W4300000003",
    )!;
    expect(namesake.authoredBySelf).toBe(false);
    expect(namesake.selfNameVariants).toEqual([]);
  });

  it("captures self name variants (incl. family name) only for own works", () => {
    const own = build().sections[0]!.items.find(
      (i) => i.id === "W4300000001",
    )!;
    expect(own.selfNameVariants).toContain("Basile Chrétien");
    expect(own.selfNameVariants).toContain("Chrétien");
  });

  it("defaults all items to included and metrics off", () => {
    const cv = build();
    expect(cv.sections[0]!.items.every((i) => i.included)).toBe(true);
    expect(cv.display.showMetrics).toBe(false);
    expect(cv.display.highlightSelf).toBe(true);
    expect(cv.display.cslStyle).toBe("apa");
  });

  it("preserves prior curation on re-sync (included flag survives)", () => {
    const first = build();
    const curated = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === "W4300000003" ? { ...it, included: false } : it,
        ),
      })),
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-07-01T00:00:00.000Z",
      previous: curated,
    });
    const namesake = resynced.sections[0]!.items.find(
      (i) => i.id === "W4300000003",
    )!;
    expect(namesake.included).toBe(false);
  });

  it("preserves a 'not mine' assertion (+timestamp) across re-sync", () => {
    const first = build();
    const asserted = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === "W4300000003"
            ? { ...it, notMine: true, notMineAssertedAt: "2026-06-02T00:00:00.000Z" }
            : it,
        ),
      })),
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-09-01T00:00:00.000Z",
      previous: asserted,
    });
    const item = resynced.sections[0]!.items.find((i) => i.id === "W4300000003")!;
    expect(item.notMine).toBe(true);
    expect(item.notMineAssertedAt).toBe("2026-06-02T00:00:00.000Z");
  });

  it("defaults notMine=false on a fresh build", () => {
    expect(build().sections[0]!.items.every((i) => i.notMine === false)).toBe(true);
  });

  it("appends newly-discovered works AFTER the user's curated order on re-sync", () => {
    const first = build();
    // Simulate the user reordering to: W3, W2, W1.
    const customOrder: Record<string, number> = {
      W4300000003: 0,
      W4300000002: 1,
      W4300000001: 2,
    };
    const previous = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => ({
          ...it,
          order: customOrder[it.id] ?? it.order,
        })),
      })),
    };

    // A brand-new (and newest) work appears on re-sync.
    const newWork = {
      id: "https://openalex.org/W9000000009",
      title: "Brand new finding",
      display_name: "Brand new finding",
      publication_year: 2025,
      publication_date: "2025-03-01",
      type: "article",
      type_crossref: "journal-article",
      cited_by_count: 0,
      authorships: [
        {
          author_position: "first",
          author: {
            id: "https://openalex.org/A5001069481",
            display_name: "Basile Chrétien",
            orcid: "https://orcid.org/0000-0002-7483-2489",
          },
          raw_author_name: "Basile Chrétien",
        },
      ],
      primary_location: { source: { display_name: "New Journal" } },
      biblio: {},
    } as unknown as OpenAlexWork;

    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works: [newWork, ...works],
      now: "2026-08-01T00:00:00.000Z",
      previous,
    });

    const ordered = [...resynced.sections[0]!.items].sort(
      (a, b) => a.order - b.order,
    );
    // Curated order is preserved; the new (newest) work is appended last.
    expect(ordered.map((i) => i.id)).toEqual([
      "W4300000003",
      "W4300000002",
      "W4300000001",
      "W9000000009",
    ]);
  });

  it("breaks recency ties alphabetically by title", () => {
    const sameYear = [
      {
        id: "https://openalex.org/W500",
        title: "Zeta study",
        publication_year: 2022,
        type: "article",
        authorships: [
          { author: { id: "https://openalex.org/A5001069481" }, raw_author_name: "Self" },
        ],
      },
      {
        id: "https://openalex.org/W501",
        title: "Alpha study",
        publication_year: 2022,
        type: "article",
        authorships: [
          { author: { id: "https://openalex.org/A5001069481" }, raw_author_name: "Self" },
        ],
      },
    ] as unknown as OpenAlexWork[];
    const cv = buildCanonicalCv({
      id: "tie",
      resolved,
      works: sameYear,
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(cv.sections[0]!.items.map((i) => i.csl?.title)).toEqual([
      "Alpha study",
      "Zeta study",
    ]);
  });
});
