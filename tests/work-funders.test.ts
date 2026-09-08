import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { parseCanonicalCv, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { serializePublicCv } from "@/lib/cv/publicFormats";
import { projectCvForPreview, projectCvForPublic } from "@/lib/cv/publicProjection";
import { freezeCanonical } from "@/lib/cv/snapshots";
import { listRecordsResponse, workRecords, type OaiRecordInput } from "@/lib/oai/oai";
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
const ANR = "https://openalex.org/F4320332161";
const ANR_NAME = "Agence Nationale de la Recherche";

function build(ws: OpenAlexWork[] = works, previous?: CanonicalCv): CanonicalCv {
  // The id must not itself contain "funders" — the leak tests grep the bodies for it.
  return buildCanonicalCv({ id: "cv_wf", resolved, works: ws, now: NOW, previous });
}

function itemBySourceId(cv: CanonicalCv, sourceId: string): CvItem | undefined {
  return cv.sections.flatMap((s) => s.items).find((it) => it.sourceId === sourceId);
}

/** The fixture's own work (W4300000001, two awards) with its `awards[]` replaced. */
function ownWork(awards: OpenAlexWork["awards"]): OpenAlexWork {
  const w = works.find((x) => x.id === "https://openalex.org/W4300000001")!;
  return { ...w, awards };
}

describe("build: meta.funders from OpenAlex awards[]", () => {
  it("stores every funder on the fixture work — the second one has a different award", () => {
    const item = itemBySourceId(build(), "https://openalex.org/W4300000001")!;
    expect(item.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME, awardId: "ANR-18-CE17-0001" },
      { id: "https://openalex.org/F4320337357", name: "Co-author's funder", awardId: "OTHER-999" },
    ]);
  });

  it("omits the field when the work carries no awards (or an empty list)", () => {
    expect(
      itemBySourceId(build(), "https://openalex.org/W4300000002")?.meta.funders,
    ).toBeUndefined();
    expect(
      itemBySourceId(build([ownWork([])]), "https://openalex.org/W4300000001")?.meta.funders,
    ).toBeUndefined();
    expect(
      itemBySourceId(build([ownWork(null)]), "https://openalex.org/W4300000001")?.meta.funders,
    ).toBeUndefined();
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
    expect(itemBySourceId(cv, "https://openalex.org/W4300000001")!.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME },
    ]);
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
    expect(itemBySourceId(cv, "https://openalex.org/W4300000001")!.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME },
      { id: "https://openalex.org/F4320337357", name: "Other" },
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
    expect(itemBySourceId(cv, "https://openalex.org/W4300000001")!.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME, awardId: "ANR-18-CE17-0001" },
      { id: ANR, name: ANR_NAME, awardId: "ANR-20-CE17-0002" },
      { id: ANR, name: ANR_NAME },
    ]);
  });

  it("caps at 20 entries and bounds the name / award strings", () => {
    const awards = Array.from({ length: 25 }, (_, i) => ({
      funder_id: `https://openalex.org/F${1000 + i}`,
      funder_display_name: "N".repeat(1500),
      funder_award_id: "A".repeat(700),
    }));
    const funders = itemBySourceId(build([ownWork(awards)]), "https://openalex.org/W4300000001")!
      .meta.funders!;
    expect(funders).toHaveLength(20);
    expect(funders[0]!.id).toBe("https://openalex.org/F1000");
    expect(funders[19]!.id).toBe("https://openalex.org/F1019");
    expect(funders[0]!.name).toHaveLength(1000);
    expect(funders[0]!.awardId).toHaveLength(500);
    // The bounded item still round-trips through the schema.
    const parsed = parseCanonicalCv(build([ownWork(awards)]));
    expect(itemBySourceId(parsed, "https://openalex.org/W4300000001")!.meta.funders).toHaveLength(
      20,
    );
  });

  it("is recomputed from the source on every sync — never carried from the previous item", () => {
    const first = build();
    expect(itemBySourceId(first, "https://openalex.org/W4300000001")!.meta.funders).toHaveLength(2);
    // The source dropped its awards → the stored list goes with them.
    const resynced = build([ownWork(null)], first);
    expect(
      itemBySourceId(resynced, "https://openalex.org/W4300000001")!.meta.funders,
    ).toBeUndefined();
    // …and a source that regained one award rebuilds exactly that.
    const again = build([ownWork([{ funder_id: ANR, funder_display_name: ANR_NAME }])], resynced);
    expect(itemBySourceId(again, "https://openalex.org/W4300000001")!.meta.funders).toEqual([
      { id: ANR, name: ANR_NAME },
    ]);
  });
});

describe("schema: meta.funders round-trip + degradation", () => {
  it("survives parse unchanged, and an over-long stored list degrades to undefined", () => {
    const cv = build();
    const parsed = parseCanonicalCv(JSON.parse(JSON.stringify(cv)));
    expect(itemBySourceId(parsed, "https://openalex.org/W4300000001")!.meta.funders).toEqual(
      itemBySourceId(cv, "https://openalex.org/W4300000001")!.meta.funders,
    );
    const tooMany = {
      ...cv,
      sections: cv.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => ({
          ...it,
          meta: {
            ...it.meta,
            funders: Array.from({ length: 21 }, (_, i) => ({ id: `https://openalex.org/F${i}` })),
          },
        })),
      })),
    };
    for (const it of parseCanonicalCv(tooMany).sections.flatMap((s) => s.items)) {
      expect(it.meta.funders).toBeUndefined();
    }
  });
});

describe("meta.funders never reaches a public surface (panel veto, pending the funder join)", () => {
  const cv = build();
  const own = "https://openalex.org/W4300000001";

  it("is stripped by the public projection, the preview projection and the snapshot freeze", () => {
    expect(itemBySourceId(cv, own)!.meta.funders).toHaveLength(2);
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
    expect(itemBySourceId(cv, own)!.meta.funders).toHaveLength(2);
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

  it("is absent from the OAI-PMH per-work records", () => {
    const record: OaiRecordInput = {
      slug: "slug",
      cv: projectCvForPublic(cv),
      datestamp: new Date(NOW),
    };
    // The page lists the fixture's own funded work, so its record is emitted.
    expect(workRecords(record).map((w) => w.itemId)).toContain("W4300000001");
    const xml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      { records: [record], cursor: 0, nextOffset: null },
      { baseUrl: "https://sigmacv.org/api/oai", now: new Date(NOW) },
    );
    expect(xml).toContain("slug/w/W4300000001");
    expect(xml).not.toContain("funder");
    expect(xml).not.toContain(ANR_NAME);
  });
});
