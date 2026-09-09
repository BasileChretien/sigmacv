import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ OPENALEX_MAILTO: "test@example.org" }),
}));

import { fetchInstitutionByRor, groupWorks } from "@/lib/openalex/institutions";

/**
 * The two OpenAlex fetchers behind the institution snapshot, against the
 * response shapes verified on the production server on 2026-09-08. Every call
 * goes through the shared polite-pool GET (mailto + User-Agent, `http.ts`
 * retry with Retry-After). No network: `fetch` is stubbed.
 */

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

const ENTITY = {
  id: "https://openalex.org/I98702875",
  display_name: "Université de Caen Normandie",
  ror: "https://ror.org/051kpcy16",
  works_count: 41_234,
  lineage: ["https://openalex.org/I4210105918", "https://openalex.org/I98702875"],
  associated_institutions: [
    {
      id: "https://openalex.org/I4210105918",
      ror: "https://ror.org/01k40cz91",
      display_name: "Normandie Université",
      country_code: "FR",
      type: "education",
      relationship: "parent",
    },
    {
      id: "https://openalex.org/I4210114068",
      ror: "https://ror.org/027arzy69",
      display_name: "CHU de Caen Normandie",
      country_code: "FR",
      type: "healthcare",
      relationship: "related",
    },
    { id: "https://openalex.org/I1", ror: null, display_name: "Lab", relationship: "child" },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const calledUrl = (i = 0) => new URL(fetchMock.mock.calls[i]![0].toString());

describe("fetchInstitutionByRor", () => {
  it("GETs /institutions/ror:<bare id> with the verified select and the polite-pool mailto, and reduces the entity", async () => {
    fetchMock.mockResolvedValue(jsonResponse(ENTITY));
    const entity = await fetchInstitutionByRor("051kpcy16");
    const url = calledUrl();
    expect(url.origin).toBe("https://api.openalex.org");
    expect(url.pathname).toBe("/institutions/ror:051kpcy16");
    expect(url.searchParams.get("select")).toBe(
      "id,display_name,ror,works_count,lineage,associated_institutions",
    );
    expect(url.searchParams.get("mailto")).toBe("test@example.org");
    expect(fetchMock.mock.calls[0]![1].headers["User-Agent"]).toContain("mailto:test@example.org");
    expect(entity).toEqual({
      openalexId: "I98702875",
      displayName: "Université de Caen Normandie",
      lineage: ["I4210105918", "I98702875"],
      related: [
        {
          id: "I4210105918",
          ror: "01k40cz91",
          name: "Normandie Université",
          relationship: "parent",
        },
        {
          id: "I4210114068",
          ror: "027arzy69",
          name: "CHU de Caen Normandie",
          relationship: "related",
        },
        { id: "I1", name: "Lab", relationship: "child" },
      ],
      worksCount: 41_234,
    });
  });

  it("is null on 404 (no OpenAlex entity for that ROR) without throwing", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "not found" }, 404));
    await expect(fetchInstitutionByRor("051kpcy16")).resolves.toBeNull();
  });

  it("never calls OpenAlex for a value that is not ROR-shaped (no query parameter can reach the API)", async () => {
    for (const bad of ["", "https://ror.org/051kpcy16", "051kpcy16?x=1", "I98702875", "0abc"]) {
      await expect(fetchInstitutionByRor(bad)).resolves.toBeNull();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on a non-404 failure after the shared retry, honouring Retry-After on a 429", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 429, { "Retry-After": "0" }))
      .mockResolvedValueOnce(jsonResponse(ENTITY));
    const entity = await fetchInstitutionByRor("051kpcy16");
    expect(entity?.openalexId).toBe("I98702875");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockReset();
    fetchMock.mockResolvedValue(jsonResponse({}, 403));
    await expect(fetchInstitutionByRor("051kpcy16")).rejects.toThrow(/OpenAlex.*403/);
  });

  it("tolerates a sparse entity: missing lineage / associated_institutions / names", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: "https://openalex.org/I7",
        associated_institutions: [{ id: "https://openalex.org/I8" }, { display_name: "no id" }],
      }),
    );
    await expect(fetchInstitutionByRor("051kpcy16")).resolves.toEqual({
      openalexId: "I7",
      displayName: "",
      lineage: [],
      related: [{ id: "I8", name: "", relationship: "" }],
      worksCount: 0,
    });
  });

  it("is null when the entity carries no id (nothing to count under)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ display_name: "x" }));
    await expect(fetchInstitutionByRor("051kpcy16")).resolves.toBeNull();
  });
});

describe("groupWorks", () => {
  const GROUPED = {
    meta: { count: 3_210, groups_count: 3 },
    group_by: [
      { key: "closed", key_display_name: "closed", count: 2_000 },
      { key: "gold", key_display_name: "gold", count: 1_000 },
      { key: "green", key_display_name: null, count: 210 },
    ],
  };

  it("filters on the OR-joined lineage ids plus the caller's filters, groups by the verified key, per-page 200, no paging", async () => {
    fetchMock.mockResolvedValue(jsonResponse(GROUPED));
    const out = await groupWorks({
      lineageIds: ["I98702875", "https://openalex.org/I4210114068"],
      filters: ["type:article|review", "publication_year:2024"],
      groupBy: "open_access.oa_status",
    });
    const url = calledUrl();
    expect(url.pathname).toBe("/works");
    expect(url.searchParams.get("filter")).toBe(
      "authorships.institutions.lineage:I98702875|I4210114068,type:article|review,publication_year:2024",
    );
    expect(url.searchParams.get("group_by")).toBe("open_access.oa_status");
    expect(url.searchParams.get("per-page")).toBe("200");
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.get("mailto")).toBe("test@example.org");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(out).toEqual({
      total: 3_210,
      groups: [
        { key: "closed", label: "closed", count: 2_000 },
        { key: "gold", label: "gold", count: 1_000 },
        { key: "green", label: "green", count: 210 },
      ],
    });
  });

  it("accepts a bare ROR id instead of lineage ids (the verified `authorships.institutions.ror` filter)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meta: {}, group_by: [] }));
    const out = await groupWorks({ rorId: "04chrp450", groupBy: "publication_year" });
    expect(calledUrl().searchParams.get("filter")).toBe("authorships.institutions.ror:04chrp450");
    expect(out).toEqual({ total: 0, groups: [] });
  });

  it("refuses to build a request from anything that is not an OpenAlex institution id or a bare ROR id", async () => {
    await expect(
      groupWorks({ lineageIds: ["I1|authorships.author.id:A1"], groupBy: "publication_year" }),
    ).rejects.toThrow(/institution id/);
    await expect(groupWorks({ lineageIds: [], groupBy: "publication_year" })).rejects.toThrow(
      /institution id/,
    );
    await expect(
      groupWorks({ rorId: "https://ror.org/04chrp450", groupBy: "publication_year" }),
    ).rejects.toThrow(/ROR/);
    await expect(
      groupWorks({
        lineageIds: ["I1"],
        filters: ["publication_year:2024,doi:x"],
        groupBy: "publication_year",
      }),
    ).rejects.toThrow(/filter/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps numeric keys as strings and treats a missing count as zero", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        meta: { count: 5 },
        group_by: [
          { key: 2024, key_display_name: "2024" },
          { key: null, count: 9 },
        ],
      }),
    );
    const out = await groupWorks({ lineageIds: ["I1"], groupBy: "publication_year" });
    // A null key (OpenAlex's "unknown" bucket) has nothing to count under.
    expect(out.groups).toEqual([{ key: "2024", label: "2024", count: 0 }]);
  });

  it("throws on a failed response (the refresh job records the error and backs off)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 400));
    await expect(groupWorks({ lineageIds: ["I1"], groupBy: "publication_year" })).rejects.toThrow(
      /OpenAlex.*400/,
    );
  });
});
