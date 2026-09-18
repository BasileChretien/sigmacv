import { describe, expect, it } from "vitest";
import { migrateAuthorNames } from "@/lib/canonical/migrateAuthorNames";
import { safeParseCanonicalCv } from "@/lib/canonical/schema";

/**
 * Read-time repair of the author names a stored CV already holds. DOI-claimed
 * works and ORCID-discovered candidates are CARRIED across a re-sync, never
 * rebuilt, so a name stored as "Basile ChréTien" would otherwise stay that way
 * forever; works built from OpenAlex heal on their next sync, but not before.
 * Strings only: a stored list is never shortened here (only a sync, comparing
 * printed bylines and ORCID iDs, collapses a byline deposited twice).
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
    items: {
      csl: { author?: Name[]; editor?: Name[] };
      meta: Record<string, unknown>;
      selfNameVariants: unknown[];
    }[];
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
    expect(items(migrateAuthorNames(doc))[0]!.csl.author).toEqual([
      n("Basile", "Chrétien"),
      { literal: "Kenji Uda" },
    ]);
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
    expect(items(migrateAuthorNames(doc))[0]!.selfNameVariants).toEqual([
      "Basile Chrétien",
      7,
      "B. Chrétien",
    ]);
  });

  it("cleans editors too", () => {
    const it0 = item("W1", [n("Ada", "Lovelace")]);
    (it0.csl as Record<string, unknown>).editor = [n("Jörg", "MüLler")];
    expect(items(migrateAuthorNames(rawDoc([it0])))[0]!.csl.editor).toEqual([n("Jörg", "Müller")]);
  });

  it("never shortens a stored list, even one with a repeated run", () => {
    // Stored names are profile names: on a large collaboration's list, different
    // people share one. Only the sync, which sees the bylines, may collapse.
    const author = [
      n("Satoshi", "Maesawa"),
      n("Shinji", "Shimato"),
      n("Takeshi", "Kinkori"),
      n("Satoshi", "Maesawa"),
      n("Shinji", "Shimato"),
      n("Takeshi", "Kinkori"),
      n("Basile", "ChréTien"),
    ];
    const doc = rawDoc([item("W1", author, { authorPosition: 7, authorCount: 7 })]);
    const [w] = items(migrateAuthorNames(doc));
    expect(w!.csl.author).toHaveLength(7);
    expect(w!.csl.author![6]).toEqual(n("Basile", "Chrétien"));
    expect(w!.meta).toEqual({ authorPosition: 7, authorCount: 7 });
  });

  it("returns the very same document when every name is clean", () => {
    const doc = rawDoc([item("W1", [n("Basile", "Chrétien")]), item("W2", [])]);
    expect(migrateAuthorNames(doc)).toBe(doc);
  });

  it("is idempotent", () => {
    const once = migrateAuthorNames(rawDoc([item("W1", [n("Basile", "ChrÃ©Tien")])]));
    expect(migrateAuthorNames(once)).toBe(once);
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
    const parsed = safeParseCanonicalCv(rawDoc([item("W1", [n("Basile", "ChréTien")])]));
    expect(parsed.success).toBe(true);
    expect(parsed.data!.sections[0]!.items[0]!.csl!.author).toEqual([n("Basile", "Chrétien")]);
  });

  it("leaves a frozen snapshot's citations as they were frozen", () => {
    const parsed = safeParseCanonicalCv(rawDoc([item("W1", [n("Basile", "ChréTien")])]), {
      frozen: true,
    });
    expect(parsed.success).toBe(true);
    expect(parsed.data!.sections[0]!.items[0]!.csl!.author).toEqual([n("Basile", "ChréTien")]);
  });
});
