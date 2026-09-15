import { beforeEach, describe, expect, it, vi } from "vitest";

const lookup = vi.hoisted(() => vi.fn());
vi.mock("@/lib/oaworks/client", () => ({ fetchSelfArchivingPermission: lookup }));
// The pass shares the bounded-pass helpers in canonical/enrich, whose import graph
// reaches the Prisma client (FORRT); no database is touched here.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import {
  enrichCvWithSelfArchiving,
  SELF_ARCHIVING_MAX_LOOKUPS,
  SELF_ARCHIVING_REFRESH_DAYS,
} from "@/lib/archiving/selfArchivingPass";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The owner sync's OA.Works pass: one lookup per countable closed journal
 * article with a DOI, sequential and capped; answers stored with their retrieval
 * date, "no record" clears, a failure keeps the old record and is retried; a
 * work that stops being a candidate loses its record (store only what the row
 * prints). The client is mocked — its own behaviour is `oaworks-client.test.ts`.
 */

const NOW = "2026-09-15T00:00:00.000Z";
const MAILTO = "ci@example.org";
const PERMISSION = {
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: ["Institutional Repository"],
  embargoMonths: 12,
  embargoEnd: "2021-01-23",
  recordUpdated: "2021-01-27",
};
const daysAgo = (n: number) => new Date(Date.parse(NOW) - n * 86_400_000).toISOString();
const OLD_RECORD = {
  source: "oa.works" as const,
  canArchive: false,
  versions: [],
  locations: [],
  retrievedAt: daysAgo(30),
};

function work(id: string, meta: CvItem["meta"] = {}, csl: Record<string, unknown> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, DOI: `10.1234/${id}`, ...csl },
    meta: { oaIsOpen: false, ...meta },
  };
}

function makeCv(publications: CvItem[], preprints: CvItem[] = []): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "sa",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: publications,
      },
      {
        id: "pre",
        type: "preprints",
        title: "Preprints",
        visible: true,
        order: 1,
        items: preprints,
      },
    ],
    provenance: { generatedAt: NOW, sources: ["openalex"] },
  });
}

const items = (cv: CanonicalCv) => cv.sections.flatMap((s) => s.items);
const byId = (cv: CanonicalCv, id: string) => items(cv).find((it) => it.id === id)!;

beforeEach(() => {
  lookup.mockReset();
  lookup.mockResolvedValue({ status: "found", permission: PERMISSION });
});

describe("enrichCvWithSelfArchiving", () => {
  it("asks once per countable closed journal article with a DOI, one call at a time, and stores the answer dated", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    lookup.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return { status: "found", permission: PERMISSION };
    });
    const cv = makeCv(
      [
        work("A"),
        work("B"),
        work("open", { oaIsOpen: true }),
        work("unknown", { oaIsOpen: undefined }),
        work("noDoi", {}, { DOI: undefined }),
        work("blankDoi", {}, { DOI: "  " }),
        work("chapter", {}, { type: "chapter" }),
        work("retracted", { retracted: true }),
        work("notReviewed", { peerReviewed: false }),
        { ...work("hidden"), included: false },
      ],
      [work("preprint")],
    );
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);

    expect(lookup.mock.calls).toEqual([
      ["10.1234/A", MAILTO],
      ["10.1234/B", MAILTO],
    ]);
    expect(maxInFlight).toBe(1);
    for (const id of ["A", "B"]) {
      expect(byId(out, id).meta.selfArchiving).toEqual({
        source: "oa.works",
        ...PERMISSION,
        retrievedAt: NOW,
      });
      expect(byId(out, id).meta.selfArchivingCheckedAt).toBe(NOW);
    }
    for (const id of [
      "open",
      "unknown",
      "noDoi",
      "chapter",
      "retracted",
      "notReviewed",
      "hidden",
      "preprint",
    ]) {
      expect(byId(out, id).meta.selfArchiving, id).toBeUndefined();
    }
    // Immutable: the input document is untouched.
    expect(byId(cv, "A").meta.selfArchiving).toBeUndefined();
    // What was stored survives the canonical schema.
    expect(CanonicalCvSchema.parse(out)).toEqual(out);
  });

  it("clears the record on an answered 'no record', and keeps it — unstamped, to retry — on a failed call", async () => {
    lookup.mockResolvedValueOnce({ status: "none" }).mockResolvedValueOnce({ status: "failed" });
    const cv = makeCv([
      work("gone", { selfArchiving: OLD_RECORD, selfArchivingCheckedAt: daysAgo(30) }),
      work("flaky", { selfArchiving: OLD_RECORD, selfArchivingCheckedAt: daysAgo(30) }),
    ]);
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(byId(out, "gone").meta.selfArchiving).toBeUndefined();
    expect(byId(out, "gone").meta.selfArchivingCheckedAt).toBe(NOW);
    expect(byId(out, "flaky").meta.selfArchiving).toEqual(OLD_RECORD);
    expect(byId(out, "flaky").meta.selfArchivingCheckedAt).toBe(daysAgo(30));
  });

  it(`skips works answered within ${SELF_ARCHIVING_REFRESH_DAYS} days and asks never-checked works first, then the oldest`, async () => {
    const cv = makeCv([
      work("recent", { selfArchivingCheckedAt: daysAgo(2) }),
      work("older", { selfArchivingCheckedAt: daysAgo(20) }),
      work("old", { selfArchivingCheckedAt: daysAgo(8) }),
      work("never"),
      work("future", { selfArchivingCheckedAt: "2027-01-01T00:00:00.000Z" }),
      work("garbled", { selfArchivingCheckedAt: "not a date" }),
    ]);
    await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup.mock.calls.map((c) => c[0])).toEqual(
      ["10.1234/never", "10.1234/older", "10.1234/old", "10.1234/future", "10.1234/garbled"].sort(
        (a, b) => (a === "10.1234/never" ? -1 : b === "10.1234/never" ? 1 : 0),
      ),
    );
    expect(lookup.mock.calls.map((c) => c[0])).not.toContain("10.1234/recent");
  });

  it("makes at most the per-sync number of lookups", async () => {
    const cv = makeCv(
      Array.from({ length: SELF_ARCHIVING_MAX_LOOKUPS + 5 }, (_, i) => work(`W${i}`)),
    );
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup).toHaveBeenCalledTimes(SELF_ARCHIVING_MAX_LOOKUPS);
    expect(items(out).filter((it) => it.meta.selfArchiving).length).toBe(
      SELF_ARCHIVING_MAX_LOOKUPS,
    );
  });

  it("drops the record and its date from a work that is no longer a candidate, without asking", async () => {
    const stored = { selfArchiving: OLD_RECORD, selfArchivingCheckedAt: daysAgo(1) };
    const cv = makeCv([
      work("nowOpen", { ...stored, oaIsOpen: true }),
      { ...work("nowHidden", stored), notMine: true },
      work("fresh", stored),
    ]);
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup).not.toHaveBeenCalled();
    for (const id of ["nowOpen", "nowHidden"]) {
      expect(byId(out, id).meta.selfArchiving, id).toBeUndefined();
      expect(byId(out, id).meta.selfArchivingCheckedAt, id).toBeUndefined();
    }
    // Still a candidate, answered yesterday: kept as it was.
    expect(byId(out, "fresh").meta.selfArchiving).toEqual(OLD_RECORD);
  });

  it("asks nothing and changes nothing when no work is closed", async () => {
    const cv = makeCv([work("open", { oaIsOpen: true })]);
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup).not.toHaveBeenCalled();
    expect(out).toEqual(cv);
  });
});
