import { beforeEach, describe, expect, it, vi } from "vitest";

// `@/lib/cv/sync` (the OAI record gate under test) instantiates the Prisma client at
// import and reads the env lazily → mock the DB and provide the minimal env.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

const db = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { cv: { findUnique: db.findUnique, findMany: db.findMany, count: db.count } },
}));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { parseCanonicalCv, type CanonicalCv } from "@/lib/canonical/schema";
import { serializePublicCv } from "@/lib/cv/publicFormats";
import { projectCvForPreview, projectCvForPublic } from "@/lib/cv/publicProjection";
import { getPublicCvRecord, listPublicCvRecords } from "@/lib/cv/sync";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

/**
 * `owner.depositRepositories` — the places the owner's works sit, written by the
 * owner sync: carried across rebuilds while the author record is unchanged,
 * degrading rather than failing a read, and owner-only on every public surface.
 */

const works = worksFixture as unknown as OpenAlexWork[];
const NOW = "2026-09-15T00:00:00.000Z";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const PLACES = [
  { sourceId: "S4306402512", name: "HAL", url: "https://hal.science/submit" },
  { sourceId: "S999", name: "SENTINEL-REPOSITORY", url: "https://sentinel.example.org" },
];

function build(previous?: CanonicalCv, authorIds = resolved.authorIds): CanonicalCv {
  return buildCanonicalCv({
    id: "cv_dr",
    resolved: { ...resolved, authorIds },
    works,
    now: NOW,
    previous,
  });
}

function withPlaces(cv: CanonicalCv, owner: Record<string, unknown>): CanonicalCv {
  return { ...cv, owner: { ...cv.owner, ...owner } } as CanonicalCv;
}

beforeEach(() => {
  for (const m of Object.values(db)) m.mockReset();
});

describe("build: the owner's repositories across a rebuild", () => {
  it("carries them while the author ids are the same (in any order), and drops them when they change", () => {
    const stored = withPlaces(build(), {
      depositRepositories: PLACES,
      depositRepositoriesCheckedAt: NOW,
    });
    const same = build(stored, [...resolved.authorIds].reverse());
    expect(same.owner.depositRepositories).toEqual(PLACES);
    expect(same.owner.depositRepositoriesCheckedAt).toBe(NOW);
    const merged = build(stored, [...resolved.authorIds, "A5000000009"]);
    expect(merged.owner.depositRepositories).toBeUndefined();
    expect(merged.owner.depositRepositoriesCheckedAt).toBeUndefined();
    expect(build().owner.depositRepositories).toBeUndefined();
  });
});

describe("schema: owner.depositRepositories", () => {
  it("round-trips, and degrades a malformed value to undefined without failing the read", () => {
    const cv = withPlaces(build(), {
      depositRepositories: PLACES,
      depositRepositoriesCheckedAt: NOW,
    });
    expect(parseCanonicalCv(JSON.parse(JSON.stringify(cv)))).toEqual(cv);
    for (const bad of [
      [{ ...PLACES[0], url: "javascript:alert(1)" }],
      [{ ...PLACES[0], sourceId: "I123" }],
      [...PLACES, ...PLACES],
      "HAL",
    ]) {
      const parsed = parseCanonicalCv(withPlaces(cv, { depositRepositories: bad }));
      expect(parsed.owner.depositRepositories).toBeUndefined();
      expect(parsed.owner.displayName).toBe(cv.owner.displayName);
    }
  });
});

describe("owner.depositRepositories never reaches a public surface", () => {
  const cv = withPlaces(build(), {
    depositRepositories: PLACES,
    depositRepositoriesCheckedAt: NOW,
  });

  it("is stripped by the public and the preview projections", () => {
    for (const projected of [projectCvForPublic(cv), projectCvForPreview(cv)]) {
      expect(projected.owner.depositRepositories).toBeUndefined();
      expect(projected.owner.depositRepositoriesCheckedAt).toBeUndefined();
    }
    expect(cv.owner.depositRepositories).toEqual(PLACES);
  });

  it("is absent from the public .json, JSON-LD, CSL-JSON and BibTeX bodies", () => {
    const pub = projectCvForPublic(cv);
    for (const fmt of ["json", "jsonld", "csljson", "bibtex"] as const) {
      const body = serializePublicCv(pub, fmt, "slug").body;
      expect(body, fmt).not.toContain("depositRepositories");
      expect(body, fmt).not.toContain("SENTINEL-REPOSITORY");
    }
  });

  it("is absent from the records the OAI-PMH harvest reads", async () => {
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
      expect(rec.cv.owner.depositRepositories).toBeUndefined();
    }
  });
});
