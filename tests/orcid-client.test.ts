import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Configurable ORCID environment for the bases() ternary.
let orcidEnv = "production";
vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    ORCID_CLIENT_ID: "cid",
    ORCID_CLIENT_SECRET: "csec",
    ORCID_ENVIRONMENT: orcidEnv,
  }),
}));

// Fresh module each test → resets the in-process token cache.
async function freshClient() {
  vi.resetModules();
  return import("@/lib/orcid/client");
}

function res(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

const TOKEN_BODY = { access_token: "tok", scope: "/read-public", token_type: "bearer" };

const EMPLOYMENTS = {
  "affiliation-group": [
    {
      summaries: [
        {
          "employment-summary": {
            "put-code": 200,
            "role-title": "Assistant Professor",
            "department-name": "Pharmacology",
            organization: { name: "Nagoya University" },
            "start-date": { year: { value: "2024" } },
            "end-date": null,
          },
        },
      ],
    },
    // single (non-array) summary + missing org → skipped
    { summaries: { "employment-summary": { "put-code": 9 } } },
  ],
};

const FUNDINGS = {
  group: [
    {
      "funding-summary": [
        {
          "put-code": 100,
          title: { title: { value: "PARANAC" } },
          type: "contract",
          organization: {
            name: "University of Caen",
            // Disambiguated funder (FundRef) + a grant number → funderId + awardId.
            "disambiguated-organization": {
              "disambiguated-organization-identifier": "http://dx.doi.org/10.13039/501100001665",
              "disambiguation-source": "FUNDREF",
            },
          },
          "external-ids": {
            "external-id": [
              { "external-id-type": "grant_number", "external-id-value": "ANR-18-CE17-0001" },
            ],
          },
          "start-date": { year: { value: "2021" } },
          "end-date": null,
        },
        {
          // No disambiguation + a non-grant_number external id → funderId undefined,
          // awardId falls back to the first external-id value.
          "put-code": 101,
          title: { title: { value: "Seed grant" } },
          organization: { name: "Local Org" },
          "external-ids": {
            "external-id": [{ "external-id-type": "other", "external-id-value": "SEED-2020" }],
          },
        },
      ],
    },
  ],
};

function routedFetch(overrides: { token?: Response; emp?: Response; fund?: Response } = {}) {
  return vi.fn(async (url: URL | string) => {
    const u = url.toString();
    if (u.includes("/oauth/token")) return overrides.token ?? res(TOKEN_BODY);
    if (u.includes("/employments")) return overrides.emp ?? res(EMPLOYMENTS);
    if (u.includes("/fundings")) return overrides.fund ?? res(FUNDINGS);
    return res({}, false, 404);
  });
}

beforeEach(() => {
  orcidEnv = "production";
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchOrcidPositions", () => {
  it("parses employments (role, department, org, start year, put-code)", async () => {
    vi.stubGlobal("fetch", routedFetch());
    const { fetchOrcidPositions } = await freshClient();
    const positions = await fetchOrcidPositions("0000-0002-7483-2489");
    expect(positions).toHaveLength(1); // the org-less summary is skipped
    expect(positions[0]).toMatchObject({
      putCode: "200",
      organization: "Nagoya University",
      roleTitle: "Assistant Professor",
      department: "Pharmacology",
      startYear: 2024,
    });
    expect(positions[0]?.endYear).toBeUndefined();
  });

  it("returns [] when the ORCID API errors (fails soft)", async () => {
    vi.stubGlobal("fetch", routedFetch({ emp: res({}, false, 500) }));
    const { fetchOrcidPositions } = await freshClient();
    expect(await fetchOrcidPositions("0000-0002-7483-2489")).toEqual([]);
  });

  it("returns [] when the token request fails", async () => {
    vi.stubGlobal("fetch", routedFetch({ token: res({}, false, 401) }));
    const { fetchOrcidPositions } = await freshClient();
    expect(await fetchOrcidPositions("0000-0002-7483-2489")).toEqual([]);
  });

  it("returns [] when the token response has no access_token", async () => {
    vi.stubGlobal("fetch", routedFetch({ token: res({ scope: "/read-public" }) }));
    const { fetchOrcidPositions } = await freshClient();
    expect(await fetchOrcidPositions("0000-0002-7483-2489")).toEqual([]);
  });

  it("uses the sandbox host when ORCID_ENVIRONMENT=sandbox", async () => {
    orcidEnv = "sandbox";
    const fetchMock = routedFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { fetchOrcidPositions } = await freshClient();
    await fetchOrcidPositions("0000-0002-7483-2489");
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("sandbox.orcid.org/oauth/token"))).toBe(true);
    expect(urls.some((u) => u.includes("pub.sandbox.orcid.org"))).toBe(true);
  });
});

describe("fetchOrcidFundings", () => {
  it("parses fundings (title, org, type, start year, put-code) + funder/award ids", async () => {
    vi.stubGlobal("fetch", routedFetch());
    const { fetchOrcidFundings } = await freshClient();
    const fundings = await fetchOrcidFundings("0000-0002-7483-2489");
    expect(fundings).toHaveLength(2);
    expect(fundings[0]).toMatchObject({
      putCode: "100",
      title: "PARANAC",
      organization: "University of Caen",
      type: "contract",
      startYear: 2021,
      // Disambiguated FundRef id, prefixed with its source scheme.
      funderId: "FUNDREF:http://dx.doi.org/10.13039/501100001665",
      // Award number from the grant_number external id.
      awardId: "ANR-18-CE17-0001",
    });
    // No disambiguation → no funderId; awardId falls back to the first external id.
    expect(fundings[1]).toMatchObject({
      putCode: "101",
      title: "Seed grant",
      awardId: "SEED-2020",
    });
    expect(fundings[1]?.funderId).toBeUndefined();
  });

  it("emits a bare disambiguated id when no disambiguation-source is present", async () => {
    const fund = res({
      group: [
        {
          "funding-summary": [
            {
              "put-code": 102,
              title: { title: { value: "Untagged funder" } },
              organization: {
                name: "Mystery Org",
                "disambiguated-organization": {
                  "disambiguated-organization-identifier": "grid.12345.6",
                },
              },
            },
          ],
        },
      ],
    });
    vi.stubGlobal("fetch", routedFetch({ fund }));
    const { fetchOrcidFundings } = await freshClient();
    const fundings = await fetchOrcidFundings("0000-0002-7483-2489");
    expect(fundings[0]?.funderId).toBe("grid.12345.6");
    expect(fundings[0]?.awardId).toBeUndefined();
  });

  it("caches the read-public token across calls (one token request)", async () => {
    const fetchMock = routedFetch();
    vi.stubGlobal("fetch", fetchMock);
    const { fetchOrcidPositions, fetchOrcidFundings } = await freshClient();
    await fetchOrcidPositions("0000-0002-7483-2489");
    await fetchOrcidFundings("0000-0002-7483-2489");
    const tokenCalls = fetchMock.mock.calls.filter((c) => String(c[0]).includes("/oauth/token"));
    expect(tokenCalls).toHaveLength(1);
  });

  it("returns [] when the fundings API errors (fails soft)", async () => {
    vi.stubGlobal("fetch", routedFetch({ fund: res({}, false, 503) }));
    const { fetchOrcidFundings } = await freshClient();
    expect(await fetchOrcidFundings("0000-0002-7483-2489")).toEqual([]);
  });
});

// Affiliation-shaped endpoint body for a given summary key.
function aff(summaryKey: string) {
  return {
    "affiliation-group": [
      {
        summaries: [
          {
            [summaryKey]: {
              "put-code": 1,
              "role-title": "Role",
              "department-name": "Dept",
              organization: { name: "Org" },
              "start-date": { year: { value: "2020" } },
              "end-date": null,
            },
          },
        ],
      },
    ],
  };
}

const PEER = {
  group: [
    {
      // ORCID groups per journal; the group external-id is the ISSN.
      "external-ids": {
        "external-id": [
          { "external-id-type": "peer-review", "external-id-value": "issn:1471-2415" },
        ],
      },
      "peer-review-group": [
        {
          "peer-review-summary": [
            { "convening-organization": { name: "Springer Nature" } },
            { "convening-organization": { name: "Springer Nature" } },
          ],
        },
      ],
    },
    {
      // No group external-id → ISSN comes from the summary's review-group-id.
      "peer-review-group": [
        {
          "peer-review-summary": [
            { "convening-organization": { name: "BMJ" }, "review-group-id": "issn:0959-8138" },
          ],
        },
      ],
    },
    {
      // No ISSN anywhere, no convening org → generic publisher fallback.
      "peer-review-group": [{ "peer-review-summary": [{}] }],
    },
  ],
};

function routeAll(overrides: { peer?: Response } = {}) {
  return vi.fn(async (url: URL | string) => {
    const u = url.toString();
    if (u.includes("/oauth/token")) return res(TOKEN_BODY);
    if (u.includes("/educations")) return res(aff("education-summary"));
    if (u.includes("/qualifications")) return res(aff("qualification-summary"));
    if (u.includes("/distinctions")) return res(aff("distinction-summary"));
    if (u.includes("/memberships")) return res(aff("membership-summary"));
    if (u.includes("/services")) return res(aff("service-summary"));
    if (u.includes("/invited-positions")) return res(aff("invited-position-summary"));
    if (u.includes("/peer-reviews")) return overrides.peer ?? res(PEER);
    return res({});
  });
}

describe("ORCID extra public sections", () => {
  it("reads education (educations + qualifications)", async () => {
    vi.stubGlobal("fetch", routeAll());
    const { fetchOrcidEducation } = await freshClient();
    const edu = await fetchOrcidEducation("0000-0002-7483-2489");
    expect(edu).toHaveLength(2); // one from each endpoint
    expect(edu[0]).toMatchObject({ organization: "Org", roleTitle: "Role" });
  });

  it("reads distinctions", async () => {
    vi.stubGlobal("fetch", routeAll());
    const { fetchOrcidDistinctions } = await freshClient();
    const d = await fetchOrcidDistinctions("0000-0002-7483-2489");
    expect(d[0]?.organization).toBe("Org");
  });

  it("reads service (memberships + services merged)", async () => {
    vi.stubGlobal("fetch", routeAll());
    const { fetchOrcidService } = await freshClient();
    expect(await fetchOrcidService("0000-0002-7483-2489")).toHaveLength(2);
  });

  it("reads invited positions", async () => {
    vi.stubGlobal("fetch", routeAll());
    const { fetchOrcidInvitedPositions } = await freshClient();
    expect(await fetchOrcidInvitedPositions("0000-0002-7483-2489")).toHaveLength(1);
  });

  it("groups peer reviews per journal (ISSN), keeping the publisher as fallback", async () => {
    vi.stubGlobal("fetch", routeAll());
    const { fetchOrcidPeerReviews } = await freshClient();
    const pr = await fetchOrcidPeerReviews("0000-0002-7483-2489");
    // ISSN from the group external-id; count is per journal, not per publisher.
    expect(pr).toContainEqual({
      issn: "1471-2415",
      organization: "Springer Nature",
      count: 2,
    });
    // ISSN recovered from the summary's review-group-id.
    expect(pr).toContainEqual({ issn: "0959-8138", organization: "BMJ", count: 1 });
    // No ISSN, no convening org → generic fallback (issn undefined).
    expect(pr).toContainEqual({
      issn: undefined,
      organization: "Journals & conferences",
      count: 1,
    });
  });

  it("peer reviews fail soft on error", async () => {
    vi.stubGlobal("fetch", routeAll({ peer: res({}, false, 500) }));
    const { fetchOrcidPeerReviews } = await freshClient();
    expect(await fetchOrcidPeerReviews("0000-0002-7483-2489")).toEqual([]);
  });
});

const WORKS = {
  group: [
    {
      // DOI on the group's merged external-ids; a non-DOI id is ignored. The
      // summary repeats the same DOI in a different case → de-duplicated.
      "external-ids": {
        "external-id": [
          { "external-id-type": "doi", "external-id-value": "10.1/AAA" },
          { "external-id-type": "eid", "external-id-value": "2-s2.0-1" },
        ],
      },
      "work-summary": [
        {
          "put-code": 1,
          "external-ids": {
            "external-id": [{ "external-id-type": "doi", "external-id-value": "10.1/aaa" }],
          },
        },
      ],
    },
    {
      // DOI only on the summary (no group-level external-ids).
      "work-summary": [
        {
          "put-code": 2,
          "external-ids": {
            "external-id": [{ "external-id-type": "DOI", "external-id-value": "10.2/BbB" }],
          },
        },
      ],
    },
    {
      // No DOI anywhere → contributes nothing.
      "external-ids": {
        "external-id": [{ "external-id-type": "pmid", "external-id-value": "123" }],
      },
      "work-summary": [{ "put-code": 3 }],
    },
  ],
};

describe("fetchOrcidWorkDois", () => {
  function routeWorks(works: Response) {
    return vi.fn(async (url: URL | string) => {
      const u = url.toString();
      if (u.includes("/oauth/token")) return res(TOKEN_BODY);
      if (u.includes("/works")) return works;
      return res({});
    });
  }

  it("collects DOIs from group + summary external-ids, lower-cased and de-duped", async () => {
    vi.stubGlobal("fetch", routeWorks(res(WORKS)));
    const { fetchOrcidWorkDois } = await freshClient();
    expect(await fetchOrcidWorkDois("0000-0002-7483-2489")).toEqual(["10.1/aaa", "10.2/bbb"]);
  });

  it("returns [] when the works API errors (fails soft)", async () => {
    vi.stubGlobal("fetch", routeWorks(res({}, false, 500)));
    const { fetchOrcidWorkDois } = await freshClient();
    expect(await fetchOrcidWorkDois("0000-0002-7483-2489")).toEqual([]);
  });
});

const PATENTS_WORKS = {
  group: [
    {
      "work-summary": [
        {
          // A patent with a title, year, and a patent-number external id.
          "put-code": 10,
          type: "patent",
          title: { title: { value: "A clever apparatus" } },
          "publication-date": { year: { value: "2021" } },
          "external-ids": {
            "external-id": [{ "external-id-type": "other-id", "external-id-value": "US1234567B2" }],
          },
        },
      ],
    },
    {
      // A patent with no external id and no year → publicationNumber omitted; the
      // put-code becomes the stable sourceId.
      "work-summary": [
        {
          "put-code": 11,
          type: "patent",
          title: { title: { value: "A numberless invention" } },
        },
      ],
    },
    {
      // A non-patent work → ignored.
      "work-summary": [
        { "put-code": 12, type: "journal-article", title: { title: { value: "Not a patent" } } },
      ],
    },
    {
      // A patent missing a title → skipped.
      "work-summary": [{ "put-code": 13, type: "patent" }],
    },
    {
      // Duplicate put-code (same as 10) → de-duped by sourceId.
      "work-summary": [
        { "put-code": 10, type: "patent", title: { title: { value: "Duplicate of 10" } } },
      ],
    },
  ],
};

describe("fetchOrcidPatents", () => {
  function routeWorks(works: Response) {
    return vi.fn(async (url: URL | string) => {
      const u = url.toString();
      if (u.includes("/oauth/token")) return res(TOKEN_BODY);
      if (u.includes("/works")) return works;
      return res({});
    });
  }

  it("returns self-asserted patents (source orcid); skips non-patents, title-less + dup", async () => {
    vi.stubGlobal("fetch", routeWorks(res(PATENTS_WORKS)));
    const { fetchOrcidPatents } = await freshClient();
    expect(await fetchOrcidPatents("0000-0002-7483-2489")).toEqual([
      {
        source: "orcid",
        title: "A clever apparatus",
        applicants: [],
        inventors: [],
        year: 2021,
        sourceId: "10",
        publicationNumber: "US1234567B2",
      },
      {
        source: "orcid",
        title: "A numberless invention",
        applicants: [],
        inventors: [],
        sourceId: "11",
      },
    ]);
  });

  it("returns [] when the works API errors (fails soft)", async () => {
    vi.stubGlobal("fetch", routeWorks(res({}, false, 500)));
    const { fetchOrcidPatents } = await freshClient();
    expect(await fetchOrcidPatents("0000-0002-7483-2489")).toEqual([]);
  });
});

const WORK_TYPES = {
  group: [
    {
      "work-summary": [
        {
          // journal-article on a bare DOI (lower-cased), plus a non-DOI id ignored.
          "put-code": 1,
          type: "journal-article",
          "external-ids": {
            "external-id": [
              { "external-id-type": "doi", "external-id-value": "10.1000/Aaa" },
              { "external-id-type": "eid", "external-id-value": "2-s2.0-1" },
            ],
          },
        },
      ],
    },
    {
      // A poster typed via a DOI carried as a doi.org URL → scheme stripped.
      "work-summary": [
        {
          "put-code": 2,
          type: "conference-poster",
          "external-ids": {
            "external-id": [
              { "external-id-type": "doi", "external-id-value": "https://doi.org/10.2000/BbB" },
            ],
          },
        },
      ],
    },
    {
      // Missing type → skipped (no entry for its DOI).
      "work-summary": [
        {
          "put-code": 3,
          "external-ids": {
            "external-id": [{ "external-id-type": "doi", "external-id-value": "10.3000/ccc" }],
          },
        },
      ],
    },
    {
      // Two summaries assert different types for the SAME DOI → first wins.
      "work-summary": [
        {
          "put-code": 4,
          type: "data-set",
          "external-ids": {
            "external-id": [{ "external-id-type": "doi", "external-id-value": "10.4000/dup" }],
          },
        },
        {
          "put-code": 5,
          type: "software",
          "external-ids": {
            "external-id": [{ "external-id-type": "doi", "external-id-value": "10.4000/dup" }],
          },
        },
      ],
    },
  ],
};

describe("fetchOrcidWorkTypes", () => {
  function routeWorks(works: Response) {
    return vi.fn(async (url: URL | string) => {
      const u = url.toString();
      if (u.includes("/oauth/token")) return res(TOKEN_BODY);
      if (u.includes("/works")) return works;
      return res({});
    });
  }

  it("maps bare-lowercased DOI → ORCID work type (URL scheme stripped, first wins)", async () => {
    vi.stubGlobal("fetch", routeWorks(res(WORK_TYPES)));
    const { fetchOrcidWorkTypes } = await freshClient();
    const types = await fetchOrcidWorkTypes("0000-0002-7483-2489");
    expect(types).toEqual({
      "10.1000/aaa": "journal-article",
      "10.2000/bbb": "conference-poster",
      "10.4000/dup": "data-set", // first non-empty summary wins on conflict
    });
    // The missing-type DOI contributes nothing.
    expect(types["10.3000/ccc"]).toBeUndefined();
  });

  it("returns {} when the works API errors (fails soft)", async () => {
    vi.stubGlobal("fetch", routeWorks(res({}, false, 500)));
    const { fetchOrcidWorkTypes } = await freshClient();
    expect(await fetchOrcidWorkTypes("0000-0002-7483-2489")).toEqual({});
  });

  it("returns {} on malformed JSON (no group array)", async () => {
    vi.stubGlobal("fetch", routeWorks(res({ unexpected: true })));
    const { fetchOrcidWorkTypes } = await freshClient();
    expect(await fetchOrcidWorkTypes("0000-0002-7483-2489")).toEqual({});
  });
});
