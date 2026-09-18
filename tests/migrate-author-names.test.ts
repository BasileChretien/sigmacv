import { describe, expect, it } from "vitest";
import { migrateAuthorNames } from "@/lib/canonical/migrateAuthorNames";
import { safeParseCanonicalCv } from "@/lib/canonical/schema";

/**
 * Read-time repair of the author lists a stored CV already holds. DOI-claimed
 * works and ORCID-discovered candidates are CARRIED across a re-sync, never
 * rebuilt, so a name stored as "Basile ChréTien" would otherwise stay that way
 * forever; works built from OpenAlex heal on their next sync, but not before.
 */

type Name = Record<string, string>;

const item = (id: string, author: Name[], meta: Record<string, unknown> = {}, extra = {}) => ({
  id,
  source: "openalex",
  sourceId: `https://openalex.org/${id}`,
  included: true,
  notMine: false,
  order: 0,
  authoredBySelf: true,
  selfNameVariants: [],
  csl: { id, type: "article-journal", title: `Work ${id}`, author },
  meta,
  ...extra,
});

function rawDoc(items: unknown[]) {
  return {
    schemaVersion: 2,
    id: "m",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      { id: "pubs", type: "publications", title: "Publications", visible: true, order: 0, items },
      { id: "empty", type: "preprints", title: "Preprints", visible: true, order: 1, items: [] },
    ],
    provenance: { generatedAt: "2026-09-18T00:00:00.000Z", sources: ["openalex"] },
  };
}

const n = (given: string, family: string): Name => ({ given, family });

type Doc = ReturnType<typeof rawDoc> & {
  sections: {
    items: { csl: { author?: Name[]; editor?: Name[] }; meta: Record<string, unknown> }[];
  }[];
};
const items = (doc: unknown) => (doc as Doc).sections[0]!.items;

describe("migrateAuthorNames", () => {
  it("repairs a carried work's stored names (the ORCID-discovered ChréTien)", () => {
    const doc = rawDoc([
      item("W4409781897", [n("Basile", "ChréTien"), { literal: "Kenji U\uFFFDda" }], {
        reviewFlag: "orcid-doi",
      }),
    ]);
    const out = migrateAuthorNames(doc);
    expect(items(out)[0]!.csl.author).toEqual([n("Basile", "Chrétien"), { literal: "Kenji Uda" }]);
  });

  it("cleans the stored self-name variants the highlighter matches with", () => {
    const doc = rawDoc([
      item(
        "W1",
        [n("Basile", "Chrétien")],
        {},
        { selfNameVariants: ["Basile ChréTien", 7, "B. Chrétien"] },
      ),
    ]);
    const out = migrateAuthorNames(doc) as {
      sections: { items: { selfNameVariants: unknown[] }[] }[];
    };
    expect(out.sections[0]!.items[0]!.selfNameVariants).toEqual([
      "Basile Chrétien",
      7,
      "B. Chrétien",
    ]);
  });

  it("cleans editors too", () => {
    const it0 = item("W1", [n("Ada", "Lovelace")]);
    (it0.csl as Record<string, unknown>).editor = [n("Jörg", "MüLler")];
    const out = migrateAuthorNames(rawDoc([it0]));
    expect(items(out)[0]!.csl.editor).toEqual([n("Jörg", "Müller")]);
  });

  it("collapses a repeated run and keeps the owner's position and the count in step", () => {
    const author = [
      n("Shinsuke", "Muraoka"),
      n("Satoshi", "Maesawa"),
      n("Shinji", "Shimato"),
      n("Takeshi", "Kinkori"),
      n("Satoshi", "Maesawa"),
      n("Shinji", "Shimato"),
      n("Takeshi", "Kinkori"),
      n("Basile", "Chrétien"),
    ];
    const doc = rawDoc([item("W1", author, { authorPosition: 8, authorCount: 8 })]);
    const [w] = items(migrateAuthorNames(doc));
    expect(w!.csl.author!.map((a) => a.family)).toEqual([
      "Muraoka",
      "Maesawa",
      "Shimato",
      "Kinkori",
      "Chrétien",
    ]);
    expect(w!.meta.authorPosition).toBe(5);
    expect(w!.meta.authorCount).toBe(5);
  });

  it("moves an owner who sat in the dropped copy onto its twin", () => {
    const author = [
      n("Ada", "Lovelace"),
      n("Basile", "Chrétien"),
      n("Ada", "Lovelace"),
      n("Basile", "Chrétien"),
    ];
    const doc = rawDoc([item("W1", author, { authorPosition: 4, authorCount: 40 })]);
    const [w] = items(migrateAuthorNames(doc));
    expect(w!.csl.author).toHaveLength(2);
    expect(w!.meta.authorPosition).toBe(2);
    // A count larger than the stored list (a truncated byline) drops by what went.
    expect(w!.meta.authorCount).toBe(38);
  });

  it("leaves an owner before the run, and a missing position, alone", () => {
    const author = [
      n("Basile", "Chrétien"),
      n("A", "One"),
      n("B", "Two"),
      n("A", "One"),
      n("B", "Two"),
    ];
    const doc = rawDoc([item("W1", author, { authorPosition: 1 }), item("W2", author, {})]);
    const [w1, w2] = items(migrateAuthorNames(doc));
    expect(w1!.meta.authorPosition).toBe(1);
    expect(w1!.meta.authorCount).toBeUndefined();
    expect(w2!.meta).toEqual({});
    expect(w2!.csl.author).toHaveLength(3);
  });

  it("leaves a run no name of which is stored verbatim twice (the cheap pre-check)", () => {
    // Folded, these repeat; stored, no two strings are equal — so the read path
    // skips them, and only a sync (which compares the printed bylines) collapses them.
    const author = [
      n("Ada", "Lovelace"),
      n("Basile", "Chrétien"),
      n("ADA", "LOVELACE"),
      n("Basile", "Chretien"),
    ];
    const doc = rawDoc([item("W1", author)]);
    expect(migrateAuthorNames(doc)).toBe(doc);
  });

  it("does not re-order or dedupe single repeated names", () => {
    const author = [n("Wei", "Wang"), n("Li", "Zhang"), n("Wei", "Wang")];
    const doc = rawDoc([item("W1", author, { authorPosition: 3 })]);
    expect(migrateAuthorNames(doc)).toBe(doc);
  });

  it("returns the very same document when every name is clean", () => {
    const doc = rawDoc([item("W1", [n("Basile", "Chrétien")]), item("W2", [])]);
    expect(migrateAuthorNames(doc)).toBe(doc);
  });

  it("never mutates the stored document", () => {
    const doc = rawDoc([item("W1", [n("Basile", "ChréTien")], { authorPosition: 1 })]);
    const snapshot = JSON.parse(JSON.stringify(doc));
    migrateAuthorNames(doc);
    expect(doc).toEqual(snapshot);
  });

  it("passes malformed documents through untouched", () => {
    for (const bad of [
      null,
      "x",
      { sections: "no" },
      {
        sections: [
          null,
          { items: "no" },
          { items: [null, { csl: null }, { csl: { author: "x" } }] },
        ],
      },
    ]) {
      expect(migrateAuthorNames(bad)).toBe(bad);
    }
    const oddName = rawDoc([item("W1", [null as never, "x" as never, n("Basile", "ChréTien")])]);
    expect(items(migrateAuthorNames(oddName))[0]!.csl.author).toEqual([
      null,
      "x",
      n("Basile", "Chrétien"),
    ]);
  });

  it("runs on every read, through safeParseCanonicalCv", () => {
    const parsed = safeParseCanonicalCv(
      rawDoc([item("W1", [n("Basile", "ChréTien")], { authorPosition: 1 })]),
    );
    expect(parsed.success).toBe(true);
    expect(parsed.data!.sections[0]!.items[0]!.csl!.author).toEqual([n("Basile", "Chrétien")]);
  });
});
