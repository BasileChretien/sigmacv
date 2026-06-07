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

  it("fails soft on a non-OK response", async () => {
    mockStatus(500);
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
});
