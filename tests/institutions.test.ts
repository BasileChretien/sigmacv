import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  groupBy: vi.fn(),
  institutionFindUnique: vi.fn(),
  institutionFindMany: vi.fn(),
  institutionUpsert: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: {
      count: mocks.count,
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      groupBy: mocks.groupBy,
    },
    institution: {
      findUnique: mocks.institutionFindUnique,
      findMany: mocks.institutionFindMany,
      upsert: mocks.institutionUpsert,
    },
  },
}));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: mocks.warn, error: vi.fn() } }));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { __resetPublicPageCache, isKnownMiss } from "@/lib/cv/publicPageCache";
import { currentAffiliation } from "@/lib/cv/publicJsonLd";
import {
  countListedCvs,
  countListedCvsByRor,
  recordInstitutions,
  trustedInstitutionNames,
  trustedInstitutionRecord,
} from "@/lib/cv/listed";
import {
  MIN_INDEXABLE_LISTED,
  institutionIndex,
  institutionJsonLd,
  institutionOaiSetUrl,
  institutionSummary,
  isInstitutionIndexable,
  isKnownInstitutionMiss,
  isRorId,
  rememberInstitutionMiss,
} from "@/lib/institutions/institutions";
import { SITE_URL } from "@/lib/siteUrl";

const ROR = "04chrp450";
const HOSTILE = "Nagoya University (closed by court order — see example.evil)";

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.institutionFindUnique.mockResolvedValue(null);
  mocks.institutionFindMany.mockResolvedValue([]);
  mocks.institutionUpsert.mockResolvedValue({});
});
afterEach(() => __resetPublicPageCache());

describe("isRorId", () => {
  it("accepts the bare ROR id shape (leading 0, six Crockford chars, two check digits)", () => {
    expect(isRorId("04chrp450")).toBe(true);
    expect(isRorId("05m32f987")).toBe(true);
    expect(isRorId("00000001")).toBe(false);
    expect(isRorId("")).toBe(false);
  });

  it("rejects IRIs, uppercase, the excluded letters (i l o u) and anything over-long", () => {
    expect(isRorId("https://ror.org/04chrp450")).toBe(false);
    expect(isRorId("04CHRP450")).toBe(false);
    expect(isRorId("04chri450")).toBe(false);
    expect(isRorId("04chrl450")).toBe(false);
    expect(isRorId("04chro450")).toBe(false);
    expect(isRorId("04chru450")).toBe(false);
    expect(isRorId("14chrp450")).toBe(false);
    expect(isRorId("04chrp4500")).toBe(false);
    expect(isRorId("04chrp45a")).toBe(false);
    expect(isRorId("04chrp450\n")).toBe(false);
    expect(isRorId("../04chrp450")).toBe(false);
  });
});

describe("listed.ts counters (database only)", () => {
  const LISTED_WHERE = {
    published: true,
    publicIndexable: true,
    listUnderAffiliation: true,
    currentRorId: ROR,
  };

  it("countListedCvs counts only published, indexable, opted-in CVs under that ROR", async () => {
    mocks.count.mockResolvedValue(3);
    await expect(countListedCvs(ROR)).resolves.toBe(3);
    expect(mocks.count).toHaveBeenCalledWith({ where: LISTED_WHERE });
  });

  it("countListedCvsByRor groups the opted-in CVs by ROR key with the same consent gate", async () => {
    mocks.groupBy.mockResolvedValue([
      { currentRorId: ROR, _count: { _all: 2 } },
      { currentRorId: "05m32f987", _count: { _all: 1 } },
      { currentRorId: null, _count: { _all: 9 } },
    ]);
    const counts = await countListedCvsByRor();
    expect(counts.get(ROR)).toBe(2);
    expect(counts.get("05m32f987")).toBe(1);
    expect(counts.size).toBe(2);
    expect(mocks.groupBy).toHaveBeenCalledWith({
      by: ["currentRorId"],
      where: {
        published: true,
        publicIndexable: true,
        listUnderAffiliation: true,
        currentRorId: { not: null },
      },
      _count: { _all: true },
    });
  });
});

describe("listed.ts trusted names (the Institution table, never a CV column)", () => {
  it("trustedInstitutionRecord reads the ROR-recorded row by id (name trimmed, blank → null) with its OpenAlex columns, or null", async () => {
    const fetchedAt = new Date("2026-09-09T10:00:00Z");
    mocks.institutionFindUnique.mockResolvedValue({
      name: "  Nagoya University  ",
      openalexId: "I60134161",
      openalexAggregates: { version: 1 },
      openalexFetchedAt: fetchedAt,
    });
    await expect(trustedInstitutionRecord(ROR)).resolves.toEqual({
      name: "Nagoya University",
      openalexId: "I60134161",
      openalexAggregates: { version: 1 },
      openalexFetchedAt: fetchedAt,
    });
    expect(mocks.institutionFindUnique).toHaveBeenCalledWith({
      where: { rorId: ROR },
      select: { name: true, openalexId: true, openalexAggregates: true, openalexFetchedAt: true },
    });
    mocks.institutionFindUnique.mockResolvedValue(null);
    await expect(trustedInstitutionRecord(ROR)).resolves.toBeNull();
    // A row the OpenAlex job has not touched (or cleared): null columns.
    mocks.institutionFindUnique.mockResolvedValue({ name: "   " });
    await expect(trustedInstitutionRecord(ROR)).resolves.toEqual({
      name: null,
      openalexId: null,
      openalexAggregates: null,
      openalexFetchedAt: null,
    });
    // Never the Cv table.
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("trustedInstitutionNames reads many ids in one query and skips blank rows and no ids", async () => {
    mocks.institutionFindMany.mockResolvedValue([
      { rorId: ROR, name: "Nagoya University" },
      { rorId: "05m32f987", name: " " },
    ]);
    const names = await trustedInstitutionNames([ROR, "05m32f987", "00abcde12"]);
    expect([...names]).toEqual([[ROR, "Nagoya University"]]);
    expect(mocks.institutionFindMany).toHaveBeenCalledWith({
      where: { rorId: { in: [ROR, "05m32f987", "00abcde12"] } },
      select: { rorId: true, name: true },
    });
    mocks.institutionFindMany.mockClear();
    await expect(trustedInstitutionNames([])).resolves.toEqual(new Map());
    expect(mocks.institutionFindMany).not.toHaveBeenCalled();
  });
});

describe("recordInstitutions (sync-time writer of ROR's own record)", () => {
  it("upserts each confident match by bare id, accepting ROR's IRI form, once per id", async () => {
    await recordInstitutions([
      { id: `https://ror.org/${ROR}`, name: " Nagoya University ", countryCode: "JP" },
      { id: ROR, name: "Nagoya University" }, // same id again → one write
      { id: "05m32f987", name: "Elsewhere" },
    ]);
    expect(mocks.institutionUpsert).toHaveBeenCalledTimes(2);
    const first = mocks.institutionUpsert.mock.calls[0]![0];
    expect(first.where).toEqual({ rorId: ROR });
    expect(first.create).toMatchObject({
      rorId: ROR,
      name: "Nagoya University",
      country: "JP",
      source: "ror",
    });
    expect(first.create.fetchedAt).toBeInstanceOf(Date);
    expect(first.update).toMatchObject({ name: "Nagoya University", country: "JP", source: "ror" });
    const second = mocks.institutionUpsert.mock.calls[1]![0];
    expect(second.where).toEqual({ rorId: "05m32f987" });
    expect(second.create.country).toBeNull();
  });

  it("writes nothing for an id that is not ROR-shaped or a blank name — only what ROR returned", async () => {
    await recordInstitutions([
      { id: "https://evil.example/04chrp450", name: "X" },
      { id: "04CHRP450", name: "X" },
      { id: "", name: "X" },
      { id: ROR, name: "   " },
    ]);
    expect(mocks.institutionUpsert).not.toHaveBeenCalled();
  });

  it("is fail-soft: a database error is logged and the remaining rows still land", async () => {
    mocks.institutionUpsert.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce({});
    await expect(
      recordInstitutions([
        { id: ROR, name: "Nagoya University" },
        { id: "05m32f987", name: "Elsewhere" },
      ]),
    ).resolves.toBeUndefined();
    expect(mocks.institutionUpsert).toHaveBeenCalledTimes(2);
    expect(mocks.warn).toHaveBeenCalledWith(
      "institution.record_failed",
      expect.objectContaining({ rorId: ROR }),
    );
  });
});

describe("institutionSummary", () => {
  it("returns the ROR, the trusted name and the count for a listed institution", async () => {
    mocks.count.mockResolvedValue(4);
    mocks.institutionFindUnique.mockResolvedValue({ name: "Nagoya University" });
    await expect(institutionSummary(ROR)).resolves.toEqual({
      rorId: ROR,
      name: "Nagoya University",
      listedCount: 4,
      openalex: null,
    });
  });

  it("falls back to 'ROR <id>' when no trusted record exists", async () => {
    mocks.count.mockResolvedValue(1);
    await expect(institutionSummary(ROR)).resolves.toEqual({
      rorId: ROR,
      name: `ROR ${ROR}`,
      listedCount: 1,
      openalex: null,
    });
  });

  it("carries the stored OpenAlex snapshot when the row has a valid one — and null when it is missing, cleared, or malformed", async () => {
    const fetchedAt = new Date("2026-09-09T10:00:00Z");
    const aggregates = {
      version: 1,
      countedEntity: {
        openalexId: "I60134161",
        displayName: "Nagoya University",
        lineageSize: 2,
        relatedCount: 3,
        foldedIds: ["I60134161"],
        fetchedAt: fetchedAt.toISOString(),
      },
      countedWorkTypes: ["article"],
      years: { from: 2020, to: 2026 },
      worksByYear: [{ year: 2026, count: 5 }],
      oaByStatusByYear: [{ year: 2026, status: "gold", count: 2 }],
      topCountries: [{ code: "JP", name: "Japan", count: 5 }],
      topCoAffiliations: [],
    };
    mocks.count.mockResolvedValue(2);
    const row = {
      name: "Nagoya University",
      openalexId: "I60134161",
      openalexAggregates: aggregates,
      openalexFetchedAt: fetchedAt,
    };
    mocks.institutionFindUnique.mockResolvedValue(row);
    const summary = await institutionSummary(ROR);
    expect(summary?.openalex).toEqual({
      openalexId: "I60134161",
      aggregates,
      fetchedAt: "2026-09-09T10:00:00.000Z",
    });

    for (const broken of [
      { ...row, openalexAggregates: { version: 1, junk: true } },
      { ...row, openalexAggregates: null },
      { ...row, openalexId: null },
      { ...row, openalexFetchedAt: null },
      // Tampered ids become hrefs / sameAs: anything but an `I…` id is refused.
      { ...row, openalexId: "javascript:alert(1)" },
      { ...row, openalexId: "https://openalex.org/I60134161" },
      {
        ...row,
        openalexAggregates: {
          ...aggregates,
          topCountries: [{ code: "javascript:", name: "Japan", count: 5 }],
        },
      },
    ]) {
      mocks.institutionFindUnique.mockResolvedValue(broken);
      expect((await institutionSummary(ROR))?.openalex).toBeNull();
    }
  });

  it("is null for a ROR nobody listed under (no page exists for it)", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.institutionFindUnique.mockResolvedValue({ name: "Stale" });
    await expect(institutionSummary(ROR)).resolves.toBeNull();
  });

  it("never touches the database for an id that is not ROR-shaped", async () => {
    await expect(institutionSummary("https://ror.org/04chrp450")).resolves.toBeNull();
    await expect(institutionSummary("'; drop table cv; --")).resolves.toBeNull();
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.institutionFindUnique).not.toHaveBeenCalled();
  });

  it("cannot be renamed by an owner: a manual position's hostile text beside a real ROR never reaches the page", async () => {
    // What the owner can do: save a position whose `institution` is any string
    // and whose `rorId` is a real institution's — and the CV's denormalised
    // affiliation name (the column a name-from-CV design would read) carries
    // that string verbatim.
    const cv = buildCanonicalCv({
      id: "cv_hostile",
      resolved: { orcid: "0000-0002-7483-2489", authorIds: [], displayName: "Mallory" },
      works: [],
      employments: [{ putCode: "m1", organization: HOSTILE, startYear: 2024, rorId: ROR }],
      now: "2026-09-08T00:00:00.000Z",
    });
    expect(currentAffiliation(cv)).toMatchObject({ rorId: ROR, setName: HOSTILE });
    // Even with that column present on every listed CV, the page reads only
    // the ROR-recorded row: the trusted name, or `ROR <id>` — never the text.
    mocks.count.mockResolvedValue(1);
    mocks.findFirst.mockResolvedValue({ currentAffiliationName: HOSTILE });
    mocks.findMany.mockResolvedValue([{ currentRorId: ROR, currentAffiliationName: HOSTILE }]);
    await expect(institutionSummary(ROR)).resolves.toMatchObject({ name: `ROR ${ROR}` });
    mocks.institutionFindUnique.mockResolvedValue({ name: "Nagoya University" });
    await expect(institutionSummary(ROR)).resolves.toMatchObject({ name: "Nagoya University" });
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

describe("institutionIndex", () => {
  it("lists every listed ROR with its count and trusted name, sorted by name, 'ROR <id>' when unrecorded", async () => {
    mocks.groupBy.mockResolvedValue([
      { currentRorId: "05m32f987", _count: { _all: 5 } },
      { currentRorId: ROR, _count: { _all: 1 } },
      { currentRorId: "00abcde12", _count: { _all: 2 } },
    ]);
    mocks.institutionFindMany.mockResolvedValue([
      { rorId: "05m32f987", name: "Zeta Institute" },
      { rorId: ROR, name: "Alpha University" },
    ]);
    const index = await institutionIndex();
    expect(index).toEqual([
      { rorId: ROR, name: "Alpha University", listedCount: 1, openalex: null },
      { rorId: "00abcde12", name: "ROR 00abcde12", listedCount: 2, openalex: null },
      { rorId: "05m32f987", name: "Zeta Institute", listedCount: 5, openalex: null },
    ]);
    expect(mocks.institutionFindMany).toHaveBeenCalledWith({
      where: { rorId: { in: ["05m32f987", ROR, "00abcde12"] } },
      select: { rorId: true, name: true },
    });
    // Never the CVs' own affiliation text.
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("is empty when nobody opted in, without a names query", async () => {
    mocks.groupBy.mockResolvedValue([]);
    await expect(institutionIndex()).resolves.toEqual([]);
    expect(mocks.institutionFindMany).not.toHaveBeenCalled();
  });
});

describe("isInstitutionIndexable", () => {
  it("indexes a page only from two listed researchers (one would be a profile by another route)", () => {
    expect(MIN_INDEXABLE_LISTED).toBe(2);
    expect(isInstitutionIndexable({ listedCount: 1 })).toBe(false);
    expect(isInstitutionIndexable({ listedCount: 2 })).toBe(true);
    expect(isInstitutionIndexable({ listedCount: 40 })).toBe(true);
  });
});

describe("institutionOaiSetUrl", () => {
  it("points at the existing OAI-PMH ror:<id> set (Dublin Core ListRecords)", () => {
    expect(institutionOaiSetUrl(ROR)).toBe(
      `${SITE_URL}/api/oai?verb=ListRecords&metadataPrefix=oai_dc&set=ror:${ROR}`,
    );
  });
});

describe("institutionJsonLd", () => {
  const summary = { rorId: ROR, name: "Nagoya University", listedCount: 7, openalex: null };

  it("is a schema.org Organization identified by its ROR IRI, named by the trusted name, with the OAI set as subjectOf", () => {
    const ld = institutionJsonLd(summary);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Organization");
    expect(ld["@id"]).toBe(`https://ror.org/${ROR}`);
    expect(ld.identifier).toBe(`https://ror.org/${ROR}`);
    expect(ld.name).toBe("Nagoya University");
    expect(ld.subjectOf).toMatchObject({
      "@type": "DataFeed",
      url: institutionOaiSetUrl(ROR),
    });
    expect(ld).not.toHaveProperty("sameAs");
  });

  it("links the counted OpenAlex entity as sameAs when a snapshot is stored — an identifier, never a figure", () => {
    const ld = institutionJsonLd({
      ...summary,
      openalex: {
        openalexId: "I60134161",
        fetchedAt: "2026-09-09T10:00:00.000Z",
        aggregates: {
          version: 1,
          countedEntity: {
            openalexId: "I60134161",
            displayName: "Nagoya University",
            lineageSize: 1,
            relatedCount: 0,
            foldedIds: ["I60134161"],
            fetchedAt: "2026-09-09T10:00:00.000Z",
          },
          countedWorkTypes: ["article"],
          years: { from: 2020, to: 2026 },
          worksByYear: [{ year: 2026, count: 99 }],
          oaByStatusByYear: [],
          topCountries: [],
          topCoAffiliations: [],
        },
      },
    });
    expect(ld.sameAs).toBe("https://openalex.org/I60134161");
    expect(JSON.stringify(ld)).not.toContain("99");
  });

  it("never asserts employment or membership, and carries no ratio, score or roster", () => {
    const serialized = JSON.stringify(institutionJsonLd(summary));
    for (const banned of [
      "employee",
      "member",
      "alumni",
      "worksFor",
      "affiliation",
      "ratio",
      "score",
      "rank",
      "%",
      "numberOfEmployees",
    ]) {
      expect(serialized, banned).not.toContain(banned);
    }
    // The count is not a JSON-LD claim either: the page states it in prose only.
    expect(serialized).not.toContain("7");
  });
});

describe("institution negative cache", () => {
  it("remembers a miss under its own key, never colliding with a public-CV slug", () => {
    expect(isKnownInstitutionMiss(ROR)).toBe(false);
    rememberInstitutionMiss(ROR);
    expect(isKnownInstitutionMiss(ROR)).toBe(true);
    expect(isKnownMiss(ROR)).toBe(false);
  });
});
