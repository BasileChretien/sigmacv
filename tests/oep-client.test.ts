import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the prisma singleton (hoisted) so the DB-backed client is unit-testable
// without a database. `vi.hoisted` makes `findMany` available inside the factory.
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { oepEditorialRole: { findMany } },
}));

import { fetchEditorialRoleCandidates, fetchEditorialRoles } from "@/lib/oep/client";

const ORCID = "0000-0002-7483-2489";
const SELECT = { journal: true, role: true, trust: true };
const ORDER = [{ journal: "asc" }, { role: "asc" }];

beforeEach(() => {
  findMany.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchEditorialRoles", () => {
  it("returns [] for an empty ORCID without querying the DB", async () => {
    expect(await fetchEditorialRoles("")).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("queries the scraped tier by bare ORCID and maps rows", async () => {
    findMany.mockResolvedValue([
      { journal: "BMJ", role: "Associate Editor", trust: "scraped" },
      { journal: "Lancet", role: "Reviewer", trust: "scraped" },
    ]);
    // Accepts the URL form too — normalized to the bare iD before the query.
    const roles = await fetchEditorialRoles(`https://orcid.org/${ORCID}`);
    expect(findMany).toHaveBeenCalledWith({
      where: { orcid: ORCID, trust: "scraped" },
      select: SELECT,
      orderBy: ORDER,
    });
    expect(roles).toEqual([
      { journal: "BMJ", role: "Associate Editor", trust: "scraped" },
      { journal: "Lancet", role: "Reviewer", trust: "scraped" },
    ]);
  });

  it("never returns an inferred tier — those go through the candidate path", async () => {
    findMany.mockResolvedValue([]);
    await fetchEditorialRoles(ORCID);
    expect(findMany.mock.calls[0]![0].where.trust).toBe("scraped");
  });

  it("returns [] (fails soft) when the query throws", async () => {
    findMany.mockRejectedValue(new Error("db down"));
    expect(await fetchEditorialRoles(ORCID)).toEqual([]);
  });
});

describe("fetchEditorialRoleCandidates", () => {
  it("returns [] when there is neither an ORCID nor an author id", async () => {
    expect(await fetchEditorialRoleCandidates({ orcid: "", authorIds: [] })).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("matches on the ORCID and the OpenAlex author ids, inferred tiers only", async () => {
    findMany.mockResolvedValue([
      {
        journal: "Respiratory Medicine and Research",
        role: "Editor-in-chief",
        trust: "propagated",
      },
    ]);
    const roles = await fetchEditorialRoleCandidates({
      orcid: `https://orcid.org/${ORCID}`,
      authorIds: ["A5078054842", "A5136414971"],
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        trust: { in: ["propagated", "openalex"] },
        OR: [{ orcid: ORCID }, { openalexAuthorId: { in: ["A5078054842", "A5136414971"] } }],
      },
      select: SELECT,
      orderBy: ORDER,
    });
    expect(roles[0]!.trust).toBe("propagated");
  });

  it("sends no name string to the database — identifiers only", async () => {
    findMany.mockResolvedValue([]);
    await fetchEditorialRoleCandidates({ orcid: ORCID, authorIds: ["A1"] });
    const where = JSON.stringify(findMany.mock.calls[0]![0].where);
    expect(where).not.toMatch(/name|editor|affiliation/i);
  });

  it("dedupes and drops empty author ids", async () => {
    findMany.mockResolvedValue([]);
    await fetchEditorialRoleCandidates({ orcid: "", authorIds: ["A1", "A1", ""] });
    expect(findMany.mock.calls[0]![0].where.OR).toEqual([{ openalexAuthorId: { in: ["A1"] } }]);
  });

  it("queries on author ids alone when the ORCID is missing", async () => {
    findMany.mockResolvedValue([]);
    await fetchEditorialRoleCandidates({ orcid: "", authorIds: ["A1"] });
    expect(findMany.mock.calls[0]![0].where.OR).toHaveLength(1);
  });

  it("returns [] (fails soft) when the query throws", async () => {
    findMany.mockRejectedValue(new Error("db down"));
    expect(await fetchEditorialRoleCandidates({ orcid: ORCID, authorIds: ["A1"] })).toEqual([]);
  });
});
