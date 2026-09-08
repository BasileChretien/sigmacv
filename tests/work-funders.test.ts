import { beforeEach, describe, expect, it, vi } from "vitest";

// `@/lib/cv/sync` (the OAI record gate under test) instantiates the Prisma
// client at import and reads the env lazily → mock the DB and provide the
// minimal env; everything else on its import path is pure or lazily networked.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: { cv: { findUnique: db.findUnique, findMany: db.findMany, count: db.count } },
}));

import { buildCanonicalCv, indexFundersByAward } from "@/lib/canonical/build";
import { parseCanonicalCv, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { serializePublicCv } from "@/lib/cv/publicFormats";
import { projectCvForPreview, projectCvForPublic } from "@/lib/cv/publicProjection";
import { freezeCanonical } from "@/lib/cv/snapshots";
import { getPublicCvRecord, listPublicCvRecords } from "@/lib/cv/sync";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

/**
 * Per-work funder ids from OpenAlex `awards[]` (`meta.funders`): persisted at
 * build so a later funder-join PR needs no global re-sync, and — for now —
 * kept OUT of every public surface (panel veto: nothing that could read as a
 * compliance signal ships before the join PR decides what is shown).
 */

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const NOW = "2026-09-08T00:00:00.000Z";
const OWN = "https://openalex.org/W4300000001";
const ANR = "https://openalex.org/F4320332161";
const ANR_NAME = "Agence Nationale de la Recherche";
const OTHER = "https://openalex.org/F4320337357";

function build(ws: OpenAlexWork[] = works, previous?: CanonicalCv): CanonicalCv {
  // The id must not itself contain "funders" — the leak tests grep the bodies for it.
  return buildCanonicalCv({ id: "cv_wf", resolved, works: ws, now: NOW, previous });
}

function itemBySourceId(cv: CanonicalCv, sourceId: string): CvItem | undefined {
  return cv.sections.flatMap((s) => s.items).find((it) => it.sourceId === sourceId);
}

/** The fixture's own work (W4300000001, two awards) with its `awards[]` replaced. */
function ownWork(awards: OpenAlexWork["awards"]): OpenAlexWork {
  const w = works.find((x) => x.id === OWN)!;
  return { ...w, awards };
}

/** `cv` with the own work's item patched (a stored-document shape, any value). */
function withOwnItem(cv: CanonicalCv, patch: (it: CvItem) => unknown): CanonicalCv {
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) => (it.sourceId === OWN ? patch(it) : it)),
    })),
  } as CanonicalCv;
}

/** `cv` with the own work's stored `meta.funders` replaced by `funders` (any shape). */
function withStoredFunders(cv: CanonicalCv, funders: unknown): CanonicalCv {
  return withOwnItem(cv, (it) => ({ ...it, meta: { ...it.meta, funders } }));
}

beforeEach(() => {
  for (const m of Object.values(db)) m.mockReset();
});

describe("build: meta.funders from OpenAlex awards[]", () => {
  it("stores every funder on the fixture work — the second one has a different award", () => {
    const item = itemBySourceId(build(), OWN)!;
    expect(item.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME, awardId: "ANR-18-CE17-0001" },
      { id: OTHER, name: "Co-author's funder", awardId: "OTHER-999" },
    ]);
  });

  it("omits the field when the work carries no awards (or an empty list)", () => {
    expect(
      itemBySourceId(build(), "https://openalex.org/W4300000002")?.meta.funders,
    ).toBeUndefined();
    expect(itemBySourceId(build([ownWork([])]), OWN)?.meta.funders).toBeUndefined();
    expect(itemBySourceId(build([ownWork(null)]), OWN)?.meta.funders).toBeUndefined();
  });

  it("keeps an award-less funder, drops entries without a funder id, and trims", () => {
    const cv = build([
      ownWork([
        { funder_id: `  ${ANR}  `, funder_display_name: `  ${ANR_NAME} `, funder_award_id: null },
        // An award number with no funder id cannot be keyed — nothing to store.
        { funder_id: null, funder_display_name: "Anonymous", funder_award_id: "X-1" },
        { funder_id: "", funder_award_id: "X-2" },
      ]),
    ]);
    expect(itemBySourceId(cv, OWN)!.meta.funders).toEqual([{ id: ANR, name: ANR_NAME }]);
  });

  it("normalises the funder id to the canonical OpenAlex URL form", () => {
    const cv = build([
      ownWork([
        { funder_id: "F4320332161", funder_display_name: ANR_NAME },
        { funder_id: "http://openalex.org/f4320337357/", funder_display_name: "Other" },
        // Not an OpenAlex funder id at all → never invented, skipped.
        { funder_id: "https://doi.org/10.13039/501100001665", funder_display_name: "Bad" },
      ]),
    ]);
    expect(itemBySourceId(cv, OWN)!.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME },
      { id: OTHER, name: "Other" },
    ]);
  });

  it("dedupes by funder id + award number (case-insensitive); same funder, other award is kept", () => {
    const cv = build([
      ownWork([
        { funder_id: ANR, funder_display_name: ANR_NAME, funder_award_id: "ANR-18-CE17-0001" },
        { funder_id: ANR, funder_display_name: "ANR (dup)", funder_award_id: "anr-18-ce17-0001" },
        { funder_id: ANR, funder_display_name: ANR_NAME, funder_award_id: "ANR-20-CE17-0002" },
        { funder_id: ANR, funder_display_name: ANR_NAME, funder_award_id: null },
        { funder_id: ANR, funder_display_name: ANR_NAME },
      ]),
    ]);
    // Sorted by (id, awardId): the award-less entry first, then the awards in order.
    expect(itemBySourceId(cv, OWN)!.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME },
      { id: ANR, name: ANR_NAME, awardId: "ANR-18-CE17-0001" },
      { id: ANR, name: ANR_NAME, awardId: "ANR-20-CE17-0002" },
    ]);
  });

  it("orders by (funder id, award number) whatever order OpenAlex listed the awards in", () => {
    const shuffled: NonNullable<OpenAlexWork["awards"]> = [
      { funder_id: OTHER, funder_display_name: "Other", funder_award_id: "Z-2" },
      { funder_id: ANR, funder_display_name: ANR_NAME, funder_award_id: "b-1" },
      { funder_id: OTHER, funder_display_name: "Other", funder_award_id: "A-1" },
      { funder_id: ANR, funder_display_name: ANR_NAME, funder_award_id: "A-2" },
    ];
    const expected = [
      { id: ANR, name: ANR_NAME, awardId: "A-2" },
      { id: ANR, name: ANR_NAME, awardId: "b-1" },
      { id: OTHER, name: "Other", awardId: "A-1" },
      { id: OTHER, name: "Other", awardId: "Z-2" },
    ];
    expect(itemBySourceId(build([ownWork(shuffled)]), OWN)!.meta.funders).toEqual(expected);
    expect(itemBySourceId(build([ownWork([...shuffled].reverse())]), OWN)!.meta.funders).toEqual(
      expected,
    );
  });

  it("caps at 20 AFTER sorting, so the survivors are the same set on every sync", () => {
    const mk = (i: number) => ({
      funder_id: `https://openalex.org/F${1000 + i}`,
      funder_display_name: "N".repeat(1500),
      funder_award_id: "A".repeat(700),
    });
    const ascending = Array.from({ length: 25 }, (_, i) => mk(i));
    // Listed highest-id first: a cap applied in source order would keep F1024…F1005.
    const descending = [...ascending].reverse();
    const funders = itemBySourceId(build([ownWork(descending)]), OWN)!.meta.funders!;
    expect(funders).toHaveLength(20);
    expect(funders[0]!.id).toBe("https://openalex.org/F1000");
    expect(funders[19]!.id).toBe("https://openalex.org/F1019");
    expect(funders[0]!.name).toHaveLength(1000);
    expect(funders[0]!.awardId).toHaveLength(500);
    expect(itemBySourceId(build([ownWork(ascending)]), OWN)!.meta.funders).toEqual(funders);
    // The bounded item still round-trips through the schema.
    const parsed = parseCanonicalCv(build([ownWork(descending)]));
    expect(itemBySourceId(parsed, OWN)!.meta.funders).toHaveLength(20);
  });

  it("is rebuilt from the source for a work OpenAlex returned — not taken from the previous item", () => {
    const first = build();
    expect(itemBySourceId(first, OWN)!.meta.funders).toHaveLength(2);
    // The source dropped its awards → the stored list goes with them.
    const resynced = build([ownWork(null)], first);
    expect(itemBySourceId(resynced, OWN)!.meta.funders).toBeUndefined();
    // …and a source that regained one award rebuilds exactly that.
    const again = build([ownWork([{ funder_id: ANR, funder_display_name: ANR_NAME }])], resynced);
    expect(itemBySourceId(again, OWN)!.meta.funders).toEqual([{ id: ANR, name: ANR_NAME }]);
  });

  it("keeps the previous value verbatim on a work the sync CARRIES (claimed / manual / orcid-doi)", () => {
    const first = build();
    const claimedPrev = withOwnItem(first, (it) => ({
      ...it,
      meta: { ...it.meta, claimed: true },
    }));
    // OpenAlex no longer returns the work → carryOverUserItems re-lists the
    // stored item as-is, funders included (there is no source to rebuild from).
    const resynced = build(
      works.filter((w) => w.id !== OWN),
      claimedPrev,
    );
    expect(itemBySourceId(resynced, OWN)!.meta.funders).toEqual(
      itemBySourceId(first, OWN)!.meta.funders,
    );
  });
});

describe("indexFundersByAward: the funder id an ORCID grant borrows agrees with meta.funders", () => {
  it("normalises both OpenAlex forms to the canonical URL, and invents nothing for another namespace", () => {
    const idx = indexFundersByAward([
      {
        id: OWN,
        awards: [
          { funder_id: "F4320332161", funder_display_name: ANR_NAME, funder_award_id: "AB-1" },
          { funder_id: "http://openalex.org/f4320337357/", funder_award_id: "AB-2" },
          { funder_id: "https://doi.org/10.13039/501100001665", funder_award_id: "AB-3" },
        ],
      },
    ] as unknown as OpenAlexWork[]);
    expect(idx.get("ab-1")).toEqual({ funderId: ANR, funderName: ANR_NAME });
    expect(idx.get("ab-2")).toEqual({ funderId: OTHER, funderName: undefined });
    expect(idx.get("ab-3")).toEqual({ funderId: undefined, funderName: undefined });
  });
});

describe("schema: meta.funders round-trip + degradation", () => {
  it("survives parse unchanged, and an over-long stored list degrades to undefined", () => {
    const cv = build();
    const parsed = parseCanonicalCv(JSON.parse(JSON.stringify(cv)));
    expect(itemBySourceId(parsed, OWN)!.meta.funders).toEqual(
      itemBySourceId(cv, OWN)!.meta.funders,
    );
    const tooMany = withStoredFunders(
      cv,
      Array.from({ length: 21 }, (_, i) => ({ id: `https://openalex.org/F${i}` })),
    );
    expect(itemBySourceId(parseCanonicalCv(tooMany), OWN)!.meta.funders).toBeUndefined();
  });

  it("degrades PER ENTRY: one malformed entry is dropped, the well-formed ones survive", () => {
    const stored = withStoredFunders(build(), [
      { id: ANR, name: ANR_NAME, awardId: "ANR-18-CE17-0001" },
      { id: OTHER, name: null }, // the single bad entry (a `name: null`)
      { name: "no id at all" },
      "not an object",
      { id: "https://openalex.org/F1", awardId: "OK-1" },
    ]);
    expect(itemBySourceId(parseCanonicalCv(stored), OWN)!.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME, awardId: "ANR-18-CE17-0001" },
      { id: "https://openalex.org/F1", awardId: "OK-1" },
    ]);
  });

  it("never yields an empty list: all-malformed entries, `[]`, or a non-array degrade to undefined", () => {
    const cv = build();
    for (const bad of [[{ id: null }, 7], [], "nope", { id: ANR }]) {
      expect(
        itemBySourceId(parseCanonicalCv(withStoredFunders(cv, bad)), OWN)!.meta.funders,
      ).toBeUndefined();
    }
  });
});

describe("meta.funders never reaches a public surface (panel veto, pending the funder join)", () => {
  const cv = build();

  it("is stripped by the public projection, the preview projection and the snapshot freeze", () => {
    expect(itemBySourceId(cv, OWN)!.meta.funders).toHaveLength(2);
    for (const projected of [
      projectCvForPublic(cv),
      projectCvForPreview(cv),
      freezeCanonical(cv),
    ]) {
      for (const it of projected.sections.flatMap((s) => s.items)) {
        expect(it.meta.funders).toBeUndefined();
      }
    }
    // The stored document is untouched (immutable projections; the owner + the
    // later join PR keep the data).
    expect(itemBySourceId(cv, OWN)!.meta.funders).toHaveLength(2);
  });

  it("is absent from the public .json, JSON-LD and CSL-JSON bodies", () => {
    const pub = projectCvForPublic(cv);
    for (const fmt of ["json", "jsonld", "csljson", "bibtex"] as const) {
      const body = serializePublicCv(pub, fmt, "slug").body;
      expect(body).not.toContain("funders");
      expect(body).not.toContain(ANR);
      expect(body).not.toContain(ANR_NAME);
    }
  });

  it("is absent from the records the OAI-PMH harvest reads off the stored document", async () => {
    // The actual gate: OAI records come from listPublicCvRecords / getPublicCvRecord,
    // which public-project the STORED document. (oai_dc itself cannot carry a
    // meta field by construction, so asserting on the XML would prove nothing.)
    const row = {
      publicSlug: "slug",
      published: true,
      publicIndexable: true,
      updatedAt: new Date(NOW),
      document: JSON.parse(JSON.stringify(cv)) as CanonicalCv,
      listUnderAffiliation: false,
      currentRorId: null,
    };
    expect(itemBySourceId(row.document, OWN)!.meta.funders).toHaveLength(2);
    db.count.mockResolvedValue(1);
    db.findMany.mockResolvedValue([row]);
    db.findUnique.mockResolvedValue(row);
    const { records } = await listPublicCvRecords({ limit: 10, offset: 0 });
    const single = await getPublicCvRecord("slug");
    expect(records).toHaveLength(1);
    expect(single).not.toBeNull();
    for (const rec of [records[0]!, single!]) {
      const items = rec.cv.sections.flatMap((s) => s.items);
      expect(items.map((it) => it.sourceId)).toContain(OWN);
      for (const it of items) expect(it.meta.funders).toBeUndefined();
    }
  });
});
