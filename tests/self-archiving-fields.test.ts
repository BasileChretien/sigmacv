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

import {
  buildCanonicalCv,
  selfWorkCountries,
  workIssn,
  workRepositoryLocations,
} from "@/lib/canonical/build";
import { parseCanonicalCv, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { serializePublicCv } from "@/lib/cv/publicFormats";
import { projectCvForPreview, projectCvForPublic } from "@/lib/cv/publicProjection";
import { freezeCanonical } from "@/lib/cv/snapshots";
import { getPublicCvRecord, listPublicCvRecords } from "@/lib/cv/sync";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexAuthorship, OpenAlexLocation, OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

/**
 * The per-work inputs of the worklist's self-archiving rows: the owner's
 * affiliation countries on the paper, the journal ISSN-L and the open repository
 * copies (rebuilt from OpenAlex on every sync), plus the OA.Works record the
 * owner's sync stores (carried across re-sync). Owner-only: every public surface
 * strips all of them.
 */

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const NOW = "2026-09-15T00:00:00.000Z";
const OWN = "https://openalex.org/W4300000001";
const SELF_AUTHOR = "https://openalex.org/A5001069481";
const HAL = "https://openalex.org/S4306402512";
const RECORD: NonNullable<CvItem["meta"]["selfArchiving"]> = {
  source: "oa.works",
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: ["Institutional Repository"],
  embargoMonths: 6,
  embargoEnd: "2021-01-01",
  licence: "cc-by",
  depositStatement: "SENTINEL-STATEMENT accepted manuscript",
  recordUpdated: "2021-01-27",
  policyUrl: "https://perma.cc/SENTINEL-POLICY",
  retrievedAt: NOW,
};

function repo(id: string, name: string, isOa = true): OpenAlexLocation {
  return { is_oa: isOa, source: { id, display_name: name, type: "repository" } };
}

/** The fixture's own work with fields replaced. */
function ownWork(patch: Partial<OpenAlexWork>): OpenAlexWork {
  const w = works.find((x) => x.id === OWN)!;
  return { ...w, ...patch };
}

/** The own work with `countries` set on the owner's authorship and on the co-author's. */
function withCountries(self: unknown, coauthor: string[] = ["US"]): OpenAlexWork {
  const w = works.find((x) => x.id === OWN)!;
  return ownWork({
    authorships: (w.authorships ?? []).map((a) => ({
      ...a,
      countries: (a.author?.id === SELF_AUTHOR ? self : coauthor) as string[],
    })),
  });
}

function build(ws: OpenAlexWork[], previous?: CanonicalCv): CanonicalCv {
  return buildCanonicalCv({ id: "cv_sa", resolved, works: ws, now: NOW, previous });
}

const own = (cv: CanonicalCv): CvItem =>
  cv.sections.flatMap((s) => s.items).find((it) => it.sourceId === OWN)!;

/** `cv` with the own item's meta patched (any stored shape). */
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

beforeEach(() => {
  for (const m of Object.values(db)) m.mockReset();
});

describe("build: the affiliation countries on the owner's own authorship", () => {
  it("stores the owner's codes only — not the co-authors' — upper-cased and deduped", () => {
    const cv = build([withCountries(["fr", "FR", " jp ", "FRA", 7], ["US", "DE"]), ...others()]);
    expect(own(cv).meta.workCountries).toEqual(["FR", "JP"]);
  });

  it("is bounded at 10, and undefined without codes or without an authorship", () => {
    const many = ["AA", "BB", "CC", "DD", "EE", "FF", "GG", "HH", "II", "JJ", "KK", "LL"];
    const a = (countries: unknown) => ({ countries }) as OpenAlexAuthorship;
    expect(selfWorkCountries(a(many))).toHaveLength(10);
    expect(selfWorkCountries(a([]))).toBeUndefined();
    expect(selfWorkCountries(a(null))).toBeUndefined();
    expect(selfWorkCountries(undefined)).toBeUndefined();
    expect(own(build(works)).meta.workCountries).toBeUndefined();
  });
});

describe("build: the journal ISSN-L", () => {
  it("stores the linking ISSN, upper-cased, and nothing that is not ISSN-shaped", () => {
    expect(own(build(works)).meta.issn).toBe("0306-5251");
    const at = (issn_l: unknown) =>
      workIssn({ id: "W", primary_location: { source: { issn_l } } } as OpenAlexWork);
    expect(at(" 1234-567x ")).toBe("1234-567X");
    expect(at("12345678")).toBeUndefined();
    expect(at(null)).toBeUndefined();
    expect(workIssn({ id: "W" })).toBeUndefined();
  });
});

describe("build: the open repository copies", () => {
  it("keeps only OPEN copies in a repository, deduped by source, with a well-formed id and name, bounded at 5", () => {
    const locations = [
      null,
      repo(HAL, "HAL", false), // closed copy (a metadata-only record)
      {
        is_oa: true,
        source: { id: "https://openalex.org/S1", display_name: "J", type: "journal" },
      },
      repo(HAL, " HAL "),
      repo(HAL, "HAL again"),
      repo("https://openalex.org/I123", "not a source id"),
      repo("https://openalex.org/S9", ""),
      repo("https://openalex.org/S10", "x".repeat(301)),
      { is_oa: true, source: null },
      ...[21, 22, 23, 24, 25, 26].map((n) => repo(`https://openalex.org/S${n}`, `Repo ${n}`)),
    ] as OpenAlexLocation[];
    expect(workRepositoryLocations(ownWork({ locations }))).toEqual([
      { sourceId: "S4306402512", name: "HAL" },
      { sourceId: "S21", name: "Repo 21" },
      { sourceId: "S22", name: "Repo 22" },
      { sourceId: "S23", name: "Repo 23" },
      { sourceId: "S24", name: "Repo 24" },
    ]);
    expect(
      workRepositoryLocations(ownWork({ locations: [repo(HAL, "HAL", false)] })),
    ).toBeUndefined();
    expect(workRepositoryLocations(ownWork({ locations: null }))).toBeUndefined();
  });

  it("rebuilds them from the source on every sync, and carries the OA.Works record with its date", () => {
    const first = build([ownWork({ locations: [repo(HAL, "HAL")] }), ...others()]);
    expect(own(first).meta.repositoryLocations).toEqual([{ sourceId: "S4306402512", name: "HAL" }]);
    const stored = withOwnMeta(first, { selfArchiving: RECORD, selfArchivingCheckedAt: NOW });
    const again = build([ownWork({ locations: [] }), ...others()], stored);
    // Source-driven: the dropped location is gone.
    expect(own(again).meta.repositoryLocations).toBeUndefined();
    // Bounded-enrichment result: carried until the owner's pass refreshes it.
    expect(own(again).meta.selfArchiving).toEqual(RECORD);
    expect(own(again).meta.selfArchivingCheckedAt).toBe(NOW);
  });
});

describe("schema: the self-archiving fields round-trip and degrade", () => {
  const full = () =>
    withOwnMeta(build(works), {
      selfArchiving: RECORD,
      selfArchivingCheckedAt: NOW,
      issn: "0306-5251",
      repositoryLocations: [{ sourceId: "S4306402512", name: "HAL" }],
      workCountries: ["FR"],
    });

  it("survives a stored round trip unchanged", () => {
    const cv = full();
    expect(parseCanonicalCv(JSON.parse(JSON.stringify(cv)))).toEqual(cv);
  });

  it("degrades a malformed OA.Works record to undefined without failing the CV read", () => {
    for (const bad of [
      { ...RECORD, versions: ["draft"] },
      { ...RECORD, retrievedAt: undefined },
      { ...RECORD, policyUrl: "javascript:alert(1)" },
      { ...RECORD, embargoEnd: "23/01/2021" },
      { ...RECORD, source: "sherpa" },
      "not an object",
    ]) {
      const parsed = parseCanonicalCv(withOwnMeta(full(), { selfArchiving: bad }));
      expect(own(parsed).meta.selfArchiving).toBeUndefined();
      expect(own(parsed).meta.workCountries).toEqual(["FR"]);
    }
  });

  it("degrades repository copies per entry, and the other fields as a whole", () => {
    const parsed = parseCanonicalCv(
      withOwnMeta(full(), {
        repositoryLocations: [
          { sourceId: "S1", name: "Kept" },
          { sourceId: "I2", name: "Bad" },
        ],
        issn: "not-an-issn",
        workCountries: ["fra"],
      }),
    );
    expect(own(parsed).meta.repositoryLocations).toEqual([{ sourceId: "S1", name: "Kept" }]);
    expect(own(parsed).meta.issn).toBeUndefined();
    expect(own(parsed).meta.workCountries).toBeUndefined();
    const tooMany = Array.from({ length: 6 }, (_, i) => ({ sourceId: `S${i}`, name: `R${i}` }));
    for (const value of [tooMany, [{ sourceId: "bad" }], [], "HAL"]) {
      const out = parseCanonicalCv(withOwnMeta(full(), { repositoryLocations: value }));
      expect(own(out).meta.repositoryLocations).toBeUndefined();
    }
  });
});

describe("the self-archiving fields never reach a public surface", () => {
  const cv = withOwnMeta(build(works), {
    selfArchiving: RECORD,
    selfArchivingCheckedAt: NOW,
    issn: "0306-5251",
    repositoryLocations: [{ sourceId: "S4306402512", name: "SENTINEL-REPOSITORY" }],
    workCountries: ["FR"],
  });
  const FIELDS = [
    "selfArchiving",
    "selfArchivingCheckedAt",
    "issn",
    "repositoryLocations",
    "workCountries",
  ] as const;

  it("is stripped by the public projection, the preview projection and the snapshot freeze", () => {
    for (const projected of [
      projectCvForPublic(cv),
      projectCvForPreview(cv),
      freezeCanonical(cv),
    ]) {
      for (const it of projected.sections.flatMap((s) => s.items)) {
        for (const field of FIELDS) expect(it.meta[field], field).toBeUndefined();
      }
    }
    // The stored document is untouched (immutable projections).
    expect(own(cv).meta.selfArchiving).toEqual(RECORD);
  });

  it("is absent from the public .json, JSON-LD, CSL-JSON and BibTeX bodies", () => {
    const pub = projectCvForPublic(cv);
    for (const fmt of ["json", "jsonld", "csljson", "bibtex"] as const) {
      const body = serializePublicCv(pub, fmt, "slug").body;
      for (const needle of [
        "selfArchiving",
        "workCountries",
        "repositoryLocations",
        "SENTINEL-STATEMENT",
        "SENTINEL-POLICY",
        "SENTINEL-REPOSITORY",
        "oa.works",
      ]) {
        expect(body, `${fmt} carries ${needle}`).not.toContain(needle);
      }
    }
  });

  it("is absent from the records the OAI-PMH harvest reads off the stored document", async () => {
    const row = {
      publicSlug: "slug",
      published: true,
      publicIndexable: true,
      updatedAt: new Date(NOW),
      document: JSON.parse(JSON.stringify(cv)) as CanonicalCv,
      listUnderAffiliation: false,
      currentRorId: null,
    };
    expect(own(row.document).meta.selfArchiving).toEqual(RECORD);
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
