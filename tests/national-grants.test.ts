import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchUkriGrants } from "@/lib/ukri/client";
import { fetchNihGrants } from "@/lib/nih/client";
import { fetchNsfGrants } from "@/lib/nsf/client";

function mockJson(impl: (url: unknown, init?: RequestInit) => unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: unknown, init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(impl(url, init)), { status: 200 })),
    ),
  );
}
function mockStatus(status: number) {
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("x", { status }))));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchUkriGrants (GtR)", () => {
  it("returns only PI+org-matched grants as candidates", async () => {
    mockJson(() => ({
      results: [
        {
          projectComposition: {
            project: {
              title: "Print Matters",
              grantReference: "AH/Y00325X/1",
              fund: {
                start: 1711926000000,
                end: 1790722800000,
                funder: { name: "AHRC" },
              },
            },
            leadResearchOrganisation: { name: "University of York" },
            principalInvestigators: [{ fullName: "Helen Smith" }],
          },
        },
        {
          // Same surname, WRONG org → must be dropped.
          projectComposition: {
            project: { title: "Other", grantReference: "X/1" },
            leadResearchOrganisation: { name: "University of Oxford" },
            principalInvestigators: [{ fullName: "Helen Smith" }],
          },
        },
      ],
    }));
    const grants = await fetchUkriGrants("Helen Smith", ["University of York"]);
    expect(grants).toEqual([
      {
        source: "ukri",
        externalId: "AH/Y00325X/1",
        title: "Print Matters",
        funder: "AHRC",
        org: "University of York",
        startYear: 2024,
        endYear: 2026,
      },
    ]);
  });

  it("returns [] without org, and fails soft on errors", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchUkriGrants("Helen Smith", [])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
    mockStatus(500);
    expect(await fetchUkriGrants("Helen Smith", ["University of York"])).toEqual([]);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      }),
    );
    expect(await fetchUkriGrants("Helen Smith", ["University of York"])).toEqual([]);
  });

  it("drops a matched record that is missing its grant reference", async () => {
    mockJson(() => ({
      results: [
        {
          projectComposition: {
            project: { title: "No grant ref" },
            leadResearchOrganisation: { name: "University of York" },
            principalInvestigators: [{ fullName: "Helen Smith" }],
          },
        },
      ],
    }));
    expect(await fetchUkriGrants("Helen Smith", ["University of York"])).toEqual([]);
  });
});

describe("fetchNihGrants (RePORTER)", () => {
  it("POSTs pi_names + org_names and maps PI+org-matched grants", async () => {
    let method = "";
    let bodyStr = "";
    mockJson((_url, init) => {
      method = init?.method ?? "";
      bodyStr = typeof init?.body === "string" ? init.body : "";
      return {
        meta: { total: 1 },
        results: [
          {
            project_num: "5R01GM123456-03",
            project_title: "Mechanisms of synaptic plasticity",
            agency_ic_admin: { abbreviation: "NIGMS" },
            organization: { org_name: "JOHNS HOPKINS UNIVERSITY" },
            project_start_date: "2021-09-01T00:00:00",
            project_end_date: "2026-08-31T00:00:00",
            principal_investigators: [
              { first_name: "Jane", last_name: "Doe", full_name: "Jane A Doe" },
            ],
          },
        ],
      };
    });
    const grants = await fetchNihGrants("Jane Doe", ["Johns Hopkins University"]);
    expect(method).toBe("POST");
    expect(bodyStr).toContain("doe");
    expect(grants).toEqual([
      {
        source: "nih",
        externalId: "5R01GM123456-03",
        title: "Mechanisms of synaptic plasticity",
        funder: "NIGMS",
        org: "JOHNS HOPKINS UNIVERSITY",
        startYear: 2021,
        endYear: 2026,
      },
    ]);
  });

  it("fails soft on a non-OK response and a thrown fetch", async () => {
    mockStatus(500);
    expect(await fetchNihGrants("Jane Doe", ["Johns Hopkins University"])).toEqual([]);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      }),
    );
    expect(await fetchNihGrants("Jane Doe", ["Johns Hopkins University"])).toEqual([]);
  });

  it("drops wrong-org and title-less records", async () => {
    mockJson(() => ({
      results: [
        {
          // matched name, WRONG org → dropped.
          project_num: "X",
          project_title: "Y",
          organization: { org_name: "MIT" },
          principal_investigators: [{ full_name: "Jane Doe" }],
        },
        {
          // matched, but no title → dropped.
          project_num: "Z",
          organization: { org_name: "Johns Hopkins University" },
          principal_investigators: [{ full_name: "Jane Doe" }],
        },
      ],
    }));
    expect(await fetchNihGrants("Jane Doe", ["Johns Hopkins University"])).toEqual([]);
  });
});

describe("fetchNsfGrants (NSF)", () => {
  it("maps PI+institution-matched awards (MM/DD/YYYY dates)", async () => {
    mockJson(() => ({
      response: {
        metadata: { totalCount: 2 },
        award: [
          {
            id: "2218427",
            title: "Identifying novel memory traces",
            pdPIName: "Maurice Smith",
            awardeeName: "Harvard University",
            agency: "NSF",
            startDate: "09/01/2022",
            expDate: "08/31/2026",
          },
          {
            // Wrong institution → dropped.
            id: "9999999",
            title: "Unrelated",
            pdPIName: "Maurice Smith",
            awardeeName: "MIT",
            agency: "NSF",
          },
        ],
      },
    }));
    const grants = await fetchNsfGrants("Maurice Smith", ["Harvard University"]);
    expect(grants).toEqual([
      {
        source: "nsf",
        externalId: "2218427",
        title: "Identifying novel memory traces",
        funder: "NSF",
        org: "Harvard University",
        startYear: 2022,
        endYear: 2026,
      },
    ]);
  });

  it("fails soft on a thrown fetch", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      }),
    );
    expect(await fetchNsfGrants("Maurice Smith", ["Harvard University"])).toEqual([]);
  });

  it("applies the NSF funder fallback, tolerates odd dates, and drops junk", async () => {
    mockJson(() => ({
      response: {
        award: [
          "not-an-object", // non-object element → skipped
          {
            // no `agency` → funder falls back to "NSF"; non-string + year-less
            // dates → undefined years (exercises both yearFromMdy branches).
            id: "100",
            title: "Fallback award",
            pdPIName: "Maurice Smith",
            awardeeName: "Harvard University",
            startDate: 20200101,
            expDate: "to be decided",
          },
          {
            // matched but no id → dropped.
            title: "No id",
            pdPIName: "Maurice Smith",
            awardeeName: "Harvard University",
          },
        ],
      },
    }));
    const grants = await fetchNsfGrants("Maurice Smith", ["Harvard University"]);
    expect(grants).toEqual([
      {
        source: "nsf",
        externalId: "100",
        title: "Fallback award",
        funder: "NSF",
        org: "Harvard University",
        startYear: undefined,
        endYear: undefined,
      },
    ]);
  });
});
