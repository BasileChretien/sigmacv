import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), warn: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { funder: { findMany: mocks.findMany } } }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: mocks.warn, error: vi.fn() } }));

import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { loadFunderCrosswalk } from "@/lib/funders/crosswalk";

/**
 * The owner-only crosswalk reader: the `Funder` rows for the funders printed
 * on the owner's works, as the editor page loads them beside the CV. Reads
 * Postgres only, fails soft to an empty crosswalk (the join then matches by
 * award number alone).
 */

function work(id: string, funderIds: string[], over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}` },
    meta: { funders: funderIds.map((f) => ({ id: `https://openalex.org/${f}` })) },
    ...over,
  };
}

function makeCv(works: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cw",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "B" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: works,
      },
    ],
    provenance: { generatedAt: "2026-09-09T00:00:00.000Z", sources: ["openalex"] },
  });
}

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
});

describe("loadFunderCrosswalk", () => {
  it("reads the rows for the funders on the owner's non-hidden works, nulls as absent fields", async () => {
    mocks.findMany.mockResolvedValue([
      {
        openalexId: "F1",
        fundrefDoi: "10.13039/501100001665",
        rorId: null,
        wikidataId: "Q1",
        name: "ANR",
      },
      { openalexId: "F2", fundrefDoi: null, rorId: "03vhdva43", wikidataId: null, name: "JSPS" },
    ]);
    const rows = await loadFunderCrosswalk(
      makeCv([
        work("W1", ["F1"]),
        work("W2", ["F2", "F1"]),
        work("W3", ["F9"], { included: false }),
      ]),
    );
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { openalexId: { in: ["F1", "F2"] } },
      select: { openalexId: true, fundrefDoi: true, rorId: true, wikidataId: true, name: true },
    });
    expect(rows).toEqual([
      { openalexId: "F1", fundrefDoi: "10.13039/501100001665", wikidataId: "Q1", name: "ANR" },
      { openalexId: "F2", rorId: "03vhdva43", name: "JSPS" },
    ]);
  });

  it("answers an empty crosswalk without a query when the works name no funder", async () => {
    expect(await loadFunderCrosswalk(makeCv([work("W1", [])]))).toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("fails soft to an empty crosswalk when the database is unreachable", async () => {
    mocks.findMany.mockRejectedValue(new Error("db down"));
    expect(await loadFunderCrosswalk(makeCv([work("W1", ["F1"])]))).toEqual([]);
    expect(mocks.warn).toHaveBeenCalledWith("funder.crosswalk_failed", expect.anything());
  });
});
