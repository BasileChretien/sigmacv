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

import { buildCanonicalCv, selfWorkCountries } from "@/lib/canonical/build";
import { parseCanonicalCv, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { serializePublicCv } from "@/lib/cv/publicFormats";
import { projectCvForPreview, projectCvForPublic } from "@/lib/cv/publicProjection";
import { freezeCanonical } from "@/lib/cv/snapshots";
import { getPublicCvRecord, listPublicCvRecords } from "@/lib/cv/sync";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexAuthorship, OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

/**
 * The per-work inputs of the worklist's rights lines: the owner's affiliation
 * countries on the paper (rebuilt from OpenAlex on every sync) and the OA.Works
 * record the owner's sync stores (carried across re-sync). Owner-only: every
 * public surface strips both.
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

/** The fixture's own work with `countries` set on the owner's and the co-author's authorships. */
function withCountries(self: unknown, coauthor: string[] = ["US"]): OpenAlexWork {
  const w = works.find((x) => x.id === OWN)!;
  return {
    ...w,
    authorships: (w.authorships ?? []).map((a) => ({
      ...a,
      countries: (a.author?.id === SELF_AUTHOR ? self : coauthor) as string[],
    })),
  };
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

  it("rebuilds the countries from the source on every sync, and carries the OA.Works record with its date", () => {
    const first = build([withCountries(["FR"]), ...others()]);
    const stored = withOwnMeta(first, {
      selfArchiving: RECORD,
      selfArchivingCheckedAt: NOW,
      selfArchivingTriedAt: NOW,
      selfArchivingOpfAt: NOW,
      selfArchivingOpfIssn: "0165-1781",
    });
    const again = build([withCountries(["DE"]), ...others()], stored);
    // Source-driven: the new affiliation country replaces the old one.
    expect(own(again).meta.workCountries).toEqual(["DE"]);
    // Bounded-enrichment result: carried until the owner's pass refreshes it.
    expect(own(again).meta.selfArchiving).toEqual(RECORD);
    expect(own(again).meta.selfArchivingCheckedAt).toBe(NOW);
    expect(own(again).meta.selfArchivingTriedAt).toBe(NOW);
    expect(own(again).meta.selfArchivingOpfAt).toBe(NOW);
    expect(own(again).meta.selfArchivingOpfIssn).toBe("0165-1781");
  });

  it("drops the carried OA.Works record when the work's DOI changed, so the new DOI is asked about", () => {
    const first = build(works);
    const stored = withOwnMeta(first, {
      selfArchiving: RECORD,
      selfArchivingCheckedAt: NOW,
      selfArchivingTriedAt: NOW,
      selfArchivingOpfAt: NOW,
      selfArchivingOpfIssn: "0165-1781",
    });
    const ownFixture = works.find((x) => x.id === OWN)!;
    const sameDoiUpperCased = build(
      [{ ...ownFixture, doi: ownFixture.doi?.toUpperCase() }, ...others()],
      stored,
    );
    expect(own(sameDoiUpperCased).meta.selfArchiving).toEqual(RECORD);
    const corrected = build(
      [{ ...ownFixture, doi: "https://doi.org/10.9999/corrected" }, ...others()],
      stored,
    );
    expect(own(corrected).csl?.DOI).toMatch(/10\.9999\/corrected/i);
    expect(own(corrected).meta.selfArchiving).toBeUndefined();
    expect(own(corrected).meta.selfArchivingCheckedAt).toBeUndefined();
    expect(own(corrected).meta.selfArchivingTriedAt).toBeUndefined();
    expect(own(corrected).meta.selfArchivingOpfAt).toBeUndefined();
    expect(own(corrected).meta.selfArchivingOpfIssn).toBeUndefined();
  });
});

describe("schema: the self-archiving fields round-trip and degrade", () => {
  const full = () =>
    withOwnMeta(build(works), {
      selfArchiving: RECORD,
      selfArchivingCheckedAt: NOW,
      selfArchivingTriedAt: NOW,
      workCountries: ["FR"],
    });

  it("survives a stored round trip unchanged", () => {
    const cv = full();
    expect(parseCanonicalCv(JSON.parse(JSON.stringify(cv)))).toEqual(cv);
  });

  it("round-trips an Open Policy Finder record with its conditions and routes, and bounds them", () => {
    const route = {
      versions: ["acceptedVersion"],
      embargoMonths: 12,
      locations: ["Any Repository"],
      licence: "cc-by-nc-nd",
      conditions: ["Must link to publisher version with DOI"],
    };
    const opf = {
      ...RECORD,
      source: "open-policy-finder",
      conditions: ["Must link to publisher version with DOI"],
      policyUrl: "https://openpolicyfinder.jisc.ac.uk/publication/16060",
      routes: [route, { ...route, versions: ["publishedVersion"], licence: undefined }],
    };
    const parsed = parseCanonicalCv(
      JSON.parse(JSON.stringify(withOwnMeta(build(works), { selfArchiving: opf }))),
    );
    expect(own(parsed).meta.selfArchiving).toEqual(opf);
    for (const tooMuch of [
      { ...opf, conditions: Array.from({ length: 9 }, (_, i) => `c${i}`) },
      { ...opf, routes: Array.from({ length: 9 }, () => route) },
      { ...opf, routes: [{ ...route, versions: [] }] },
      { ...opf, routes: [{ ...route, embargoMonths: 1.5 }] },
    ]) {
      const bounded = parseCanonicalCv(
        JSON.parse(JSON.stringify(withOwnMeta(build(works), { selfArchiving: tooMuch }))),
      );
      expect(own(bounded).meta.selfArchiving).toBeUndefined();
    }
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

  it("degrades malformed countries as a whole, keeping the record", () => {
    for (const value of [["fra"], ["fr"], "FR", Array.from({ length: 11 }, () => "FR")]) {
      const parsed = parseCanonicalCv(withOwnMeta(full(), { workCountries: value }));
      expect(own(parsed).meta.workCountries).toBeUndefined();
      expect(own(parsed).meta.selfArchiving).toEqual(RECORD);
    }
  });
});

describe("the self-archiving fields never reach a public surface", () => {
  const cv = withOwnMeta(build(works), {
    selfArchiving: RECORD,
    selfArchivingCheckedAt: NOW,
    selfArchivingTriedAt: NOW,
    selfArchivingOpfAt: NOW,
    selfArchivingOpfIssn: "0165-1781",
    workCountries: ["FR"],
  });
  const FIELDS = [
    "selfArchiving",
    "selfArchivingCheckedAt",
    "selfArchivingTriedAt",
    "selfArchivingOpfAt",
    "selfArchivingOpfIssn",
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
        "SENTINEL-STATEMENT",
        "SENTINEL-POLICY",
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
