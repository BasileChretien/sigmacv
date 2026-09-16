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

import { buildCanonicalCv } from "@/lib/canonical/build";
import { parseCanonicalCv, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { serializePublicCv } from "@/lib/cv/publicFormats";
import { projectCvForPreview, projectCvForPublic } from "@/lib/cv/publicProjection";
import { freezeCanonical } from "@/lib/cv/snapshots";
import { getPublicCvRecord, listPublicCvRecords } from "@/lib/cv/sync";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

/**
 * The repository copies the owner's sync stores (`meta.repositoryCopies`):
 * carried across re-sync while the DOI is unchanged, dropped with a corrected
 * DOI, degrading to nothing when malformed — and owner-only: every public
 * surface strips them, like the OA.Works record beside them.
 */

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const NOW = "2026-09-16T00:00:00.000Z";
const OWN = "https://openalex.org/W4300000001";
const COPIES: NonNullable<CvItem["meta"]["repositoryCopies"]> = [
  {
    source: "hal",
    id: "hal-SENTINEL1",
    url: "https://hal.science/hal-SENTINEL1",
    hasFile: true,
    recorded: "2021-12-10",
    retrievedAt: NOW,
  },
  {
    source: "europepmc",
    id: "PMC999",
    url: "https://europepmc.org/article/PMC/PMC999",
    hasFile: true,
    name: "Europe PMC",
    retrievedAt: NOW,
  },
];
const FIELDS = [
  "repositoryCopies",
  "repositoryCopiesCheckedAt",
  "repositoryCopiesTriedAt",
] as const;

function build(ws: OpenAlexWork[], previous?: CanonicalCv): CanonicalCv {
  return buildCanonicalCv({ id: "cv_rc", resolved, works: ws, now: NOW, previous });
}
const own = (cv: CanonicalCv): CvItem =>
  cv.sections.flatMap((s) => s.items).find((it) => it.sourceId === OWN)!;
function withOwnMeta(cv: CanonicalCv, meta: Record<string, unknown>): CanonicalCv {
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) =>
        it.sourceId === OWN ? { ...it, meta: { ...it.meta, ...meta } } : it,
      ),
    })),
  } as CanonicalCv;
}
const others = () => works.filter((x) => x.id !== OWN);
const stored = () =>
  withOwnMeta(build(works), {
    repositoryCopies: COPIES,
    repositoryCopiesCheckedAt: NOW,
    repositoryCopiesTriedAt: NOW,
  });

beforeEach(() => {
  for (const m of Object.values(db)) m.mockReset();
});

describe("build: the repository copies are carried across re-sync while the DOI holds", () => {
  it("carries the copies and both sentinels", () => {
    const again = build(works, stored());
    expect(own(again).meta.repositoryCopies).toEqual(COPIES);
    expect(own(again).meta.repositoryCopiesCheckedAt).toBe(NOW);
    expect(own(again).meta.repositoryCopiesTriedAt).toBe(NOW);
  });

  it("drops them when the work's DOI changed — a case change of the same DOI is not a change", () => {
    const ownFixture = works.find((x) => x.id === OWN)!;
    const same = build(
      [{ ...ownFixture, doi: ownFixture.doi?.toUpperCase() }, ...others()],
      stored(),
    );
    expect(own(same).meta.repositoryCopies).toEqual(COPIES);
    const corrected = build(
      [{ ...ownFixture, doi: "https://doi.org/10.9999/corrected" }, ...others()],
      stored(),
    );
    for (const field of FIELDS) expect(own(corrected).meta[field], field).toBeUndefined();
  });
});

describe("schema: the copies round-trip and degrade", () => {
  it("survives a stored round trip unchanged", () => {
    const parsed = parseCanonicalCv(JSON.parse(JSON.stringify(stored())));
    expect(own(parsed).meta.repositoryCopies).toEqual(COPIES);
  });

  it("degrades malformed copies to undefined without failing the CV read", () => {
    const bad = withOwnMeta(build(works), {
      repositoryCopies: [{ source: "hal", id: 42, url: "ftp://x", hasFile: "yes" }],
      repositoryCopiesCheckedAt: NOW,
    });
    const parsed = parseCanonicalCv(JSON.parse(JSON.stringify(bad)));
    expect(own(parsed).meta.repositoryCopies).toBeUndefined();
    expect(own(parsed).meta.repositoryCopiesCheckedAt).toBe(NOW);
  });
});

describe("the repository copies never reach a public surface", () => {
  const cv = stored();

  it("are stripped by the public projection, the preview projection and the snapshot freeze", () => {
    for (const projected of [
      projectCvForPublic(cv),
      projectCvForPreview(cv),
      freezeCanonical(cv),
    ]) {
      for (const it of projected.sections.flatMap((s) => s.items)) {
        for (const field of FIELDS) expect(it.meta[field], field).toBeUndefined();
      }
    }
    expect(own(cv).meta.repositoryCopies).toEqual(COPIES);
  });

  it("are absent from the public .json, JSON-LD, CSL-JSON and BibTeX bodies", () => {
    const pub = projectCvForPublic(cv);
    for (const fmt of ["json", "jsonld", "csljson", "bibtex"] as const) {
      const body = serializePublicCv(pub, fmt, "slug").body;
      for (const needle of ["repositoryCopies", "SENTINEL1", "PMC999", "europepmc"]) {
        expect(body, `${fmt} carries ${needle}`).not.toContain(needle);
      }
    }
  });

  it("are absent from the records the OAI-PMH harvest reads off the stored document", async () => {
    const row = {
      publicSlug: "slug",
      published: true,
      publicIndexable: true,
      updatedAt: new Date(NOW),
      document: JSON.parse(JSON.stringify(cv)) as CanonicalCv,
      listUnderAffiliation: false,
      currentRorId: null,
    };
    db.count.mockResolvedValue(1);
    db.findMany.mockResolvedValue([row]);
    db.findUnique.mockResolvedValue(row);
    const { records } = await listPublicCvRecords({ limit: 10, offset: 0 });
    const single = await getPublicCvRecord("slug");
    for (const rec of [records[0]!, single!]) {
      const items = rec.cv.sections.flatMap((s) => s.items);
      expect(items.map((it) => it.sourceId)).toContain(OWN);
      for (const it of items) {
        for (const field of FIELDS) expect(it.meta[field], field).toBeUndefined();
      }
    }
  });
});
