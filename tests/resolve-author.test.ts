import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetchAuthorsByOrcid: vi.fn() }));
vi.mock("@/lib/openalex/client", () => ({
  fetchAuthorsByOrcid: mocks.fetchAuthorsByOrcid,
}));

import { resolveAuthorByOrcid } from "@/lib/openalex/resolveAuthor";

beforeEach(() => mocks.fetchAuthorsByOrcid.mockReset());

describe("resolveAuthorByOrcid", () => {
  it("returns null when no author records match", async () => {
    mocks.fetchAuthorsByOrcid.mockResolvedValue([]);
    expect(await resolveAuthorByOrcid("0000-0002-7483-2489")).toBeNull();
  });

  it("orders ids by works_count (primary first) and takes metrics from the primary", async () => {
    mocks.fetchAuthorsByOrcid.mockResolvedValue([
      { id: "https://openalex.org/A_minor", works_count: 1 },
      {
        id: "https://openalex.org/A_main",
        display_name: "Basile Chrétien",
        works_count: 116,
        cited_by_count: 1485,
        summary_stats: { "2yr_mean_citedness": 3.4, h_index: 12, i10_index: 8 },
      },
    ]);
    const resolved = await resolveAuthorByOrcid("https://orcid.org/0000-0002-7483-2489");
    expect(resolved).not.toBeNull();
    expect(resolved!.orcid).toBe("0000-0002-7483-2489");
    expect(resolved!.authorIds).toEqual(["A_main", "A_minor"]);
    expect(resolved!.displayName).toBe("Basile Chrétien");
    expect(resolved!.metrics).toMatchObject({
      h_index: 12,
      works_count: 116,
      cited_by_count: 1485,
      "2yr_mean_citedness": 3.4,
    });
  });

  it("handles a primary record with no summary_stats", async () => {
    mocks.fetchAuthorsByOrcid.mockResolvedValue([
      { id: "https://openalex.org/A1", display_name: "X", works_count: 2 },
    ]);
    const resolved = await resolveAuthorByOrcid("0000-0002-7483-2489");
    expect(resolved!.metrics).toEqual({
      "2yr_mean_citedness": undefined,
      h_index: undefined,
      i10_index: undefined,
      works_count: 2,
      cited_by_count: undefined,
    });
  });
});
