import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the prisma singleton (hoisted) so the DB-backed client is unit-testable
// without a database. `vi.hoisted` makes `findMany` available inside the factory.
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: { oepEditorialRole: { findMany } },
}));

import { fetchEditorialRoles } from "@/lib/oep/client";

const ORCID = "0000-0002-7483-2489";

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

  it("queries by the bare ORCID and maps rows to {journal, role}", async () => {
    findMany.mockResolvedValue([
      { journal: "BMJ", role: "Associate Editor" },
      { journal: "Lancet", role: "Reviewer" },
    ]);
    // Accepts the URL form too — normalized to the bare iD before the query.
    const roles = await fetchEditorialRoles(`https://orcid.org/${ORCID}`);
    expect(findMany).toHaveBeenCalledWith({
      where: { orcid: ORCID },
      select: { journal: true, role: true },
      orderBy: [{ journal: "asc" }, { role: "asc" }],
    });
    expect(roles).toEqual([
      { journal: "BMJ", role: "Associate Editor" },
      { journal: "Lancet", role: "Reviewer" },
    ]);
  });

  it("returns [] (fails soft) when the query throws", async () => {
    findMany.mockRejectedValue(new Error("db down"));
    expect(await fetchEditorialRoles(ORCID)).toEqual([]);
  });
});
