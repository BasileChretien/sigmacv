import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { ictrpTrial: { findMany } } }));

import { fetchIctrpTrials } from "@/lib/ictrp/client";

function row(over: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    trialId: "ISRCTN12345",
    sourceRegister: "ISRCTN",
    publicTitle: "A UK trial",
    scientificTitle: null,
    primarySponsor: "University of Oxford",
    contactName: "Jane Roe",
    contactNameLower: "jane roe",
    recruitmentStatus: "Recruiting",
    registrationYear: 2021,
    ...over,
  };
}

beforeEach(() => {
  findMany.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("fetchIctrpTrials", () => {
  it("returns [] without an org, and without querying", async () => {
    expect(await fetchIctrpTrials("Jane Roe", [])).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("queries by surname and keeps contact+sponsor-org matches as candidates", async () => {
    findMany.mockResolvedValue([
      row({ trialId: "ISRCTN12345" }),
      // Same surname, WRONG sponsor org → dropped.
      row({ trialId: "ISRCTN99999", primarySponsor: "Some Other Place" }),
      // No sponsor → can't satisfy name+org → dropped.
      row({ trialId: "ISRCTN00000", primarySponsor: null }),
    ]);
    const trials = await fetchIctrpTrials("Jane Roe", ["University of Oxford"]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { contactNameLower: { contains: "roe" } } }),
    );
    expect(trials).toEqual([
      {
        source: "ictrp",
        registryId: "ISRCTN12345",
        title: "A UK trial",
        status: "Recruiting",
        sponsor: "University of Oxford",
        startYear: 2021,
      },
    ]);
  });

  it("falls back to the scientific title, then the trial id; dedups by trialId", async () => {
    findMany.mockResolvedValue([
      row({
        trialId: "jRCT1",
        publicTitle: "",
        scientificTitle: "A Japanese study",
        registrationYear: null,
        recruitmentStatus: null,
      }),
      row({ trialId: "jRCT1", publicTitle: "", scientificTitle: "A Japanese study" }), // dup id
    ]);
    const trials = await fetchIctrpTrials("Jane Roe", ["University of Oxford"]);
    expect(trials).toHaveLength(1);
    expect(trials[0]).toEqual({
      source: "ictrp",
      registryId: "jRCT1",
      title: "A Japanese study",
      status: undefined,
      sponsor: "University of Oxford",
      startYear: undefined,
    });
  });

  it("fails soft (returns []) when the query throws", async () => {
    findMany.mockRejectedValue(new Error("db down"));
    expect(await fetchIctrpTrials("Jane Roe", ["University of Oxford"])).toEqual([]);
  });
});
