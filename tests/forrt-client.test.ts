import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { forrtReplication: { findMany } } }));

import { fetchReplicationsForDois } from "@/lib/forrt/client";

function row(over: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 1,
    originalDoi: "10.1000/original",
    replicationDoi: "10.1000/replication",
    outcome: "success",
    discipline: "Psychology",
    description: "A description",
    originalRef: "Original et al. 2019",
    replicationRef: "Replicator et al. 2021",
    sourceUrl: "https://osf.io/abc",
    importedAt: new Date(),
    ...over,
  };
}

beforeEach(() => {
  findMany.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("fetchReplicationsForDois", () => {
  it("returns empty maps for an empty DOI list, without querying", async () => {
    const result = await fetchReplicationsForDois([]);
    expect(result.replicatedBy.size).toBe(0);
    expect(result.replicationOf.size).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns empty maps when every DOI is malformed, without querying", async () => {
    const result = await fetchReplicationsForDois(["not-a-doi", undefined, ""]);
    expect(result.replicatedBy.size).toBe(0);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("normalizes and dedupes DOIs before querying (bare, lower-case)", async () => {
    findMany.mockResolvedValue([]);
    await fetchReplicationsForDois([
      "https://doi.org/10.1000/Original",
      "10.1000/original",
      "doi:10.1000/original",
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { originalDoi: { in: ["10.1000/original"] } },
          { replicationDoi: { in: ["10.1000/original"] } },
        ],
      },
    });
  });

  it("maps a row keyed by originalDoi into replicatedBy", async () => {
    findMany.mockResolvedValue([row({})]);
    const result = await fetchReplicationsForDois(["10.1000/original"]);
    expect(result.replicatedBy.get("10.1000/original")).toEqual([
      {
        doi: "10.1000/replication",
        outcome: "success",
        ref: "Replicator et al. 2021",
        url: "https://osf.io/abc",
      },
    ]);
    expect(result.replicationOf.size).toBe(0);
  });

  it("maps a row keyed by replicationDoi into replicationOf", async () => {
    findMany.mockResolvedValue([row({})]);
    const result = await fetchReplicationsForDois(["10.1000/replication"]);
    expect(result.replicationOf.get("10.1000/replication")).toEqual({
      doi: "10.1000/original",
      ref: "Original et al. 2019",
    });
    expect(result.replicatedBy.size).toBe(0);
  });

  it("populates both maps when the caller's DOIs cover both roles", async () => {
    findMany.mockResolvedValue([row({})]);
    const result = await fetchReplicationsForDois(["10.1000/original", "10.1000/replication"]);
    expect(result.replicatedBy.has("10.1000/original")).toBe(true);
    expect(result.replicationOf.has("10.1000/replication")).toBe(true);
  });

  it("collects multiple replications of the same original into one array", async () => {
    findMany.mockResolvedValue([
      row({ id: 1, replicationDoi: "10.1000/rep-a", outcome: "success" }),
      row({ id: 2, replicationDoi: "10.1000/rep-b", outcome: "mixed" }),
    ]);
    const result = await fetchReplicationsForDois(["10.1000/original"]);
    expect(result.replicatedBy.get("10.1000/original")).toHaveLength(2);
  });

  it("handles a row with no replicationDoi (FReD didn't record one)", async () => {
    findMany.mockResolvedValue([row({ replicationDoi: null })]);
    const result = await fetchReplicationsForDois(["10.1000/original"]);
    expect(result.replicatedBy.get("10.1000/original")![0]!.doi).toBeUndefined();
  });

  it("fails soft (empty maps) when the query throws", async () => {
    findMany.mockRejectedValue(new Error("db down"));
    const result = await fetchReplicationsForDois(["10.1000/original"]);
    expect(result.replicatedBy.size).toBe(0);
    expect(result.replicationOf.size).toBe(0);
  });

  it("returns empty maps when the table has no matching rows", async () => {
    findMany.mockResolvedValue([]);
    const result = await fetchReplicationsForDois(["10.1000/original"]);
    expect(result.replicatedBy.size).toBe(0);
    expect(result.replicationOf.size).toBe(0);
  });
});
