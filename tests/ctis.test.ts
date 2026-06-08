import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCtisTrials } from "@/lib/ctis/client";

/** Mock both legs: POST /search → a list of ctNumbers; GET /retrieve/{ct} → detail. */
function mock(searchData: unknown, details: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: unknown) => {
      const u = String(url);
      if (u.includes("/search")) {
        return Promise.resolve(new Response(JSON.stringify(searchData), { status: 200 }));
      }
      const ct = decodeURIComponent(u.split("/retrieve/")[1] ?? "");
      const d = details[ct];
      return Promise.resolve(new Response(JSON.stringify(d ?? {}), { status: d ? 200 : 404 }));
    }),
  );
}

function detail(
  ctNumber: string,
  pi: { firstName: string; lastName: string },
  siteOrg: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    ctNumber,
    ctStatus: "Authorised",
    startDateEU: "2022-06-16T00:00:00",
    authorizedApplication: {
      authorizedPartI: {
        trialDetails: { clinicalTrialIdentifiers: { fullTitle: `Trial ${ctNumber}` } },
        sponsors: [{ organisation: { name: "Columbia University" } }],
      },
      authorizedPartsII: [
        {
          trialSites: [
            {
              personInfo: pi,
              organisationAddressInfo: { organisation: { name: siteOrg } },
            },
          ],
        },
      ],
    },
    ...extra,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchCtisTrials", () => {
  it("returns [] without an org, and without fetching", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchCtisTrials("Dawn Hershman", [])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("searches by surname+org, then keeps only investigator+site-org matches", async () => {
    let searchBody = "";
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown, init?: RequestInit) => {
        const u = String(url);
        if (u.includes("/search")) {
          searchBody = typeof init?.body === "string" ? init.body : "";
          return Promise.resolve(
            new Response(
              JSON.stringify({
                data: [{ ctNumber: "2022-500001-30-00" }, { ctNumber: "2022-999999-99-00" }],
                pagination: { totalRecords: 2 },
              }),
              { status: 200 },
            ),
          );
        }
        const ct = decodeURIComponent(u.split("/retrieve/")[1] ?? "");
        const details: Record<string, unknown> = {
          "2022-500001-30-00": detail(
            "2022-500001-30-00",
            { firstName: "Dawn", lastName: "Hershman" },
            "Columbia University Medical Center",
          ),
          "2022-999999-99-00": detail(
            "2022-999999-99-00",
            { firstName: "John", lastName: "Other" },
            "Other Hospital",
          ),
        };
        return Promise.resolve(new Response(JSON.stringify(details[ct]), { status: 200 }));
      }),
    );

    const trials = await fetchCtisTrials("Dawn Hershman", ["Columbia University"]);
    expect(trials).toEqual([
      {
        source: "ctis",
        registryId: "2022-500001-30-00",
        title: "Trial 2022-500001-30-00",
        status: "Authorised",
        role: "INVESTIGATOR",
        sponsor: "Columbia University",
        org: "Columbia University Medical Center",
        startYear: 2022,
      },
    ]);
    // The search narrowed by surname (normalized lower-case) + the primary org.
    expect(searchBody.toLowerCase()).toContain("hershman");
    expect(searchBody).toContain("Columbia University");
  });

  it("tolerates missing title/sponsor and falls back to decisionDate for the year", async () => {
    mock(
      { data: [{ ctNumber: "2023-000002-10-00" }] },
      {
        "2023-000002-10-00": {
          ctNumber: "2023-000002-10-00",
          decisionDate: "2023-03-01T12:00:00",
          authorizedApplication: {
            authorizedPartsII: [
              {
                trialSites: [
                  {
                    personInfo: { firstName: "Dawn", lastName: "Hershman" },
                    organisationAddressInfo: { organisation: { name: "Columbia University" } },
                  },
                ],
              },
            ],
          },
        },
      },
    );
    const trials = await fetchCtisTrials("Dawn Hershman", ["Columbia University"]);
    expect(trials).toHaveLength(1);
    expect(trials[0]).toMatchObject({
      registryId: "2023-000002-10-00",
      title: "2023-000002-10-00", // fullTitle absent → falls back to ctNumber
      sponsor: undefined,
      startYear: 2023, // from decisionDate
    });
  });

  it("drops a trial whose sites have no matching investigator", async () => {
    mock(
      { data: [{ ctNumber: "2024-1" }] },
      {
        "2024-1": detail(
          "2024-1",
          { firstName: "Someone", lastName: "Else" },
          "Columbia University",
        ),
      },
    );
    expect(await fetchCtisTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
  });

  it("skips a 404 detail, a site with no investigator, and duplicate ctNumbers", async () => {
    mock(
      { data: [{ ctNumber: "A" }, { ctNumber: "A" }, { ctNumber: "B" }, { ctNumber: "MISSING" }] },
      {
        // 'A': a site with no personInfo → no investigator to match → skipped.
        A: {
          ctNumber: "A",
          authorizedApplication: {
            authorizedPartsII: [
              {
                trialSites: [
                  { organisationAddressInfo: { organisation: { name: "Columbia University" } } },
                ],
              },
            ],
          },
        },
        B: detail("B", { firstName: "Dawn", lastName: "Hershman" }, "Columbia University"),
        // 'MISSING' is absent from details → the mock returns 404.
      },
    );
    const trials = await fetchCtisTrials("Dawn Hershman", ["Columbia University"]);
    expect(trials.map((t) => t.registryId)).toEqual(["B"]);
  });

  it("caps a pathologically large search response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("x".repeat(4_000_001), { status: 200 }))),
    );
    expect(await fetchCtisTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
  });

  it("caps a pathologically large detail response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) => {
        const u = String(url);
        if (u.includes("/search")) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: [{ ctNumber: "BIG" }] }), { status: 200 }),
          );
        }
        return Promise.resolve(new Response("x".repeat(8_000_001), { status: 200 }));
      }),
    );
    expect(await fetchCtisTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
  });

  it("fails soft on a non-OK search and on a thrown fetch", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("err", { status: 500 }))),
    );
    expect(await fetchCtisTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      }),
    );
    expect(await fetchCtisTrials("Dawn Hershman", ["Columbia University"])).toEqual([]);
  });
});
