import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchJournalPolicy,
  issnList,
  normalIssn,
  permissionFor,
  type JournalPolicy,
  type PolicyRoute,
} from "@/lib/openPolicyFinder/client";

/**
 * Jisc Open Policy Finder client: one ISSN → every route of the journal's policy
 * SigmaCV may name, or an honest `none` / `failed` / `unauthorized`; and
 * `permissionFor`, the one route an article is shown. Mocked fetch only. The
 * fixtures are trimmed copies of live answers of 2026-09-18 (Psychiatry
 * Research 0165-1781, Blood 0006-4971, Psychological Medicine 0033-2917).
 */

const KEY = "test-key-not-real";
const res = (body: string, status = 200) => new Response(body, { status });
const json = (value: unknown, status = 200) => res(JSON.stringify(value), status);
function stub(...responses: Array<Response | Error>) {
  const fn = vi.fn();
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r);
    else fn.mockResolvedValueOnce(r);
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}
afterEach(() => vi.unstubAllGlobals());

const phrases = (...pairs: Array<[string, string]>) =>
  pairs.map(([value, phrase]) => ({ value, phrase, language: "en" }));

/** Psychiatry Research (Elsevier), as Open Policy Finder answered on 2026-09-18. */
const PSYCHIATRY_RESEARCH = {
  id: 16060,
  issns: [
    { type: "print", issn: "0165-1781" },
    { type: "electronic", issn: "1872-7123" },
  ],
  system_metadata: { id: 16060, date_modified: "2025-03-13 09:57:39" },
  publisher_policy: [
    {
      id: 7217,
      open_access_prohibited: "no",
      permitted_oa: [
        {
          article_version: ["submitted"],
          additional_oa_fee: "no",
          location: {
            location: ["any_website", "named_repository"],
            location_phrases: phrases(
              ["any_website", "Any Website"],
              ["named_repository", "Named Repository"],
            ),
            named_repository: ["arXiv", "RePEc"],
          },
        },
        {
          // Author's homepage only: not a repository.
          article_version: ["accepted"],
          additional_oa_fee: "no",
          license: [{ license: "cc_by_nc_nd", version: "4.0" }],
          location: { location: ["authors_homepage"] },
        },
        {
          article_version: ["accepted"],
          additional_oa_fee: "no",
          embargo: { amount: 12, units: "months" },
          license: [{ license: "cc_by_nc_nd", version: "4.0" }],
          location: {
            location: [
              "non_commercial_institutional_repository",
              "non_commercial_website",
              "subject_repository",
            ],
            location_phrases: phrases(
              [
                "non_commercial_institutional_repository",
                "Non-Commercial Institutional Repository",
              ],
              ["non_commercial_website", "Non-Commercial Website"],
              ["subject_repository", "Subject Repository"],
            ),
          },
          conditions: [
            "Must link to publisher version with DOI",
            "Published source must be acknowledged with citation.",
          ],
        },
        {
          // Paid open access: not self-archiving.
          article_version: ["published"],
          additional_oa_fee: "yes",
          license: [{ license: "cc_by" }],
          location: { location: ["any_website", "institutional_repository", "this_journal"] },
        },
        {
          // A funder's condition SigmaCV cannot see.
          article_version: ["published"],
          additional_oa_fee: "no",
          location: { location: ["any_repository"] },
          prerequisites: {
            prerequisite_funders: [{ funder_metadata: { name: [{ name: "Wellcome" }] } }],
          },
        },
      ],
    },
  ],
};
const answer = (...items: unknown[]) => json({ items, totalHits: items.length });

const SUBMITTED_ROUTE: PolicyRoute = {
  versions: ["submittedVersion"],
  embargoMonths: 0,
  locations: ["Any Website", "arXiv", "RePEc"],
  licence: undefined,
  conditions: undefined,
};
const ACCEPTED_ROUTE: PolicyRoute = {
  versions: ["acceptedVersion"],
  embargoMonths: 12,
  locations: [
    "Non-Commercial Institutional Repository",
    "Non-Commercial Website",
    "Subject Repository",
  ],
  licence: "cc-by-nc-nd",
  conditions: [
    "Must link to publisher version with DOI",
    "Published source must be acknowledged with citation",
  ],
};

describe("normalIssn", () => {
  it("reads the usual spellings, the first readable one of a list, and refuses the rest", () => {
    expect(normalIssn("0165-1781")).toBe("0165-1781");
    expect(normalIssn("2049848x")).toBe("2049-848X");
    expect(normalIssn(["junk", "1872-7123"])).toBe("1872-7123");
    expect(normalIssn(["junk"])).toBeUndefined();
    expect(normalIssn(" 0165 1781 ")).toBeUndefined();
    expect(normalIssn(42)).toBeUndefined();
  });

  it("lists every readable ISSN of a value once — a journal's print and electronic ones", () => {
    expect(issnList(["1872-7123", "01651781", "junk", "0165-1781", ["0000-0000"]])).toEqual([
      "1872-7123",
      "0165-1781",
    ]);
    expect(issnList("2049848x")).toEqual(["2049-848X"]);
    expect(issnList(undefined)).toEqual([]);
  });
});

describe("fetchJournalPolicy", () => {
  it("keeps every route with no fee, no prerequisite and a repository, in the record's own words, with the journal's record page", async () => {
    const fetch = stub(answer(PSYCHIATRY_RESEARCH));
    expect(await fetchJournalPolicy("0165-1781", KEY, "ci@example.org", 5_000)).toEqual({
      status: "found",
      policy: {
        routes: [SUBMITTED_ROUTE, ACCEPTED_ROUTE],
        recordUpdated: "2025-03-13",
        policyUrl: "https://openpolicyfinder.jisc.ac.uk/publication/16060",
      },
    });
    const [url, init] = fetch.mock.calls[0]! as [string, RequestInit];
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://api.openpolicyfinder.jisc.ac.uk/retrieve");
    expect(u.searchParams.get("item-type")).toBe("publication");
    expect(JSON.parse(u.searchParams.get("filter")!)).toEqual([["issn", "equals", "0165-1781"]]);
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe(KEY);
    expect(headers["User-Agent"]).toContain("mailto:ci@example.org");
    // The key goes in the header only, never in the address.
    expect(url).not.toContain(KEY);
    expect(init.redirect).toBe("error");
  });

  it("finds no route to name when the record allows only web pages, paid or conditional routes (Blood), or prohibits open access", async () => {
    const blood = {
      issns: [{ issn: "0006-4971" }],
      system_metadata: { id: 13507, date_modified: "2025-09-16 13:26:51" },
      publisher_policy: [
        {
          open_access_prohibited: "no",
          permitted_oa: [
            {
              article_version: ["published"],
              additional_oa_fee: "no",
              embargo: { amount: 12, units: "months" },
              location: {
                location: ["authors_homepage", "institutional_website", "non_commercial_website"],
              },
            },
            {
              article_version: ["accepted"],
              additional_oa_fee: "no",
              location: { location: ["named_repository"], named_repository: ["PubMed Central"] },
              prerequisites: { prerequisites: ["when_required_by_funder"] },
            },
          ],
        },
      ],
    };
    stub(answer(blood));
    expect(await fetchJournalPolicy("0006-4971", KEY)).toEqual({
      status: "found",
      policy: {
        routes: [],
        recordUpdated: "2025-09-16",
        policyUrl: "https://openpolicyfinder.jisc.ac.uk/publication/13507",
      },
    });
    stub(
      answer({
        ...PSYCHIATRY_RESEARCH,
        publisher_policy: [
          { ...PSYCHIATRY_RESEARCH.publisher_policy[0], open_access_prohibited: "yes" },
        ],
      }),
    );
    const prohibited = await fetchJournalPolicy("0165-1781", KEY);
    expect(prohibited.status === "found" && prohibited.policy.routes).toEqual([]);
  });

  it("reads embargoes in days, weeks and years without shortening them; drops a route whose embargo it cannot read; keeps only a Creative Commons licence", async () => {
    const withRoutes = (permitted_oa: unknown[]) =>
      answer({
        issns: [{ issn: "2374-2437" }],
        system_metadata: {},
        publisher_policy: [{ permitted_oa }],
      });
    const route = (embargo: unknown, license?: unknown) => ({
      article_version: ["accepted"],
      location: { location: ["any_repository"] },
      embargo,
      license,
    });
    stub(
      withRoutes([
        route({ amount: 365, units: "days" }),
        route({ amount: 52, units: "weeks" }),
        route({ amount: 2, units: "years" }, [
          { license: "bespoke_license" },
          { license: "cc_by" },
        ]),
        route({ amount: 1, units: "days" }, [{ license: "bespoke_license" }]),
        route({ amount: 45, units: "days" }),
        route({ amount: 5, units: "fortnights" }),
        route({ amount: -1, units: "months" }),
      ]),
    );
    const r = await fetchJournalPolicy("2374-2437", KEY);
    expect(
      r.status === "found" && r.policy.routes.map((x) => [x.embargoMonths, x.licence]),
    ).toEqual([
      [12, undefined],
      [12, undefined],
      [24, "cc-by"],
      [1, undefined],
      [2, undefined],
    ]);
    expect(r.status === "found" && r.policy.policyUrl).toBeUndefined();
  });

  it("never shortens an embargo given in days or weeks: the fewest whole months that hold it, whatever month it starts in", async () => {
    const days = (amount: number, units = "days") => ({
      article_version: ["accepted"],
      location: { location: ["any_repository"] },
      embargo: { amount, units },
    });
    stub(
      answer({
        issns: [{ issn: "2374-2437" }],
        system_metadata: {},
        publisher_policy: [
          { permitted_oa: [days(183), days(366), days(26, "weeks"), days(180), days(0)] },
        ],
      }),
    );
    const r = await fetchJournalPolicy("2374-2437", KEY);
    // Six months can be 181 days; twelve are at least 365.
    expect(r.status === "found" && r.policy.routes.map((x) => x.embargoMonths)).toEqual([
      7, 13, 7, 6, 0,
    ]);
  });

  it("drops what it cannot read rather than guess: odd versions, places and conditions; an embargo past the bound; a prerequisite of any shape", async () => {
    const odd = (extra: Record<string, unknown>) => ({
      article_version: ["accepted"],
      location: { location: ["any_repository"] },
      ...extra,
    });
    stub(
      answer({
        issns: [{ issn: "2374-2437" }],
        system_metadata: {},
        publisher_policy: [
          {
            permitted_oa: [
              odd({
                article_version: ["accepted", 7, "draft"],
                location: {
                  location: ["any_repository", "any_repository", 3, "institutional_repository"],
                  location_phrases: [
                    { value: "any_repository", phrase: 12 },
                    { value: 5, phrase: "Five" },
                    null,
                  ],
                },
                conditions: ["x".repeat(501), 4, "   ", "Must link to the DOI..."],
              }),
              odd({ embargo: { amount: 100, units: "years" } }),
              odd({ embargo: { amount: "12", units: "months" } }),
              odd({ prerequisites: "when required by funder" }),
              odd({ embargo: null }),
              odd({ embargo: "12 months" }),
              odd({ prerequisites: { prerequisite_subjects: [], prerequisites_phrases: ["x"] } }),
            ],
          },
        ],
      }),
    );
    const r = await fetchJournalPolicy("2374-2437", KEY);
    expect(r.status === "found" && r.policy.routes).toEqual([
      {
        versions: ["acceptedVersion"],
        embargoMonths: 0,
        locations: ["any repository", "institutional repository"],
        licence: undefined,
        conditions: ["Must link to the DOI"],
      },
      {
        versions: ["acceptedVersion"],
        embargoMonths: 0,
        locations: ["any repository"],
        licence: undefined,
        conditions: undefined,
      },
    ]);
  });

  it("fails on a body past the size bound", async () => {
    stub(res(" ".repeat(2_000_001)));
    expect(await fetchJournalPolicy("0165-1781", KEY)).toEqual({ status: "failed" });
  });

  it("answers none for the record of a journal that now publishes everything open — its policy does not describe a closed article (Psychological Medicine)", async () => {
    stub(
      answer({
        issns: [{ issn: "0033-2917" }],
        system_metadata: { id: 2174 },
        publisher_policy: [
          {
            open_access_prohibited: "no",
            permitted_oa: [
              {
                article_version: ["published"],
                additional_oa_fee: "no",
                license: [{ license: "cc_by" }, { license: "cc_by_sa" }],
                location: { location: ["any_website", "this_journal"] },
              },
              {
                article_version: ["submitted", "accepted"],
                additional_oa_fee: "no",
                license: [{ license: "cc_by" }],
                location: { location: ["any_website"] },
              },
            ],
          },
        ],
      }),
    );
    expect(await fetchJournalPolicy("0033-2917", KEY)).toEqual({ status: "none" });
  });

  it("keeps only the record that lists the ISSN asked about — no record lists it: none", async () => {
    stub(
      answer(
        { ...PSYCHIATRY_RESEARCH, issns: [{ issn: "9999-9999" }], system_metadata: { id: 1 } },
        PSYCHIATRY_RESEARCH,
      ),
    );
    const r = await fetchJournalPolicy("1872-7123", KEY);
    expect(r.status === "found" && r.policy.policyUrl).toBe(
      "https://openpolicyfinder.jisc.ac.uk/publication/16060",
    );
    stub(answer({ ...PSYCHIATRY_RESEARCH, issns: [{ issn: "9999-9999" }] }));
    expect(await fetchJournalPolicy("0165-1781", KEY)).toEqual({ status: "none" });
  });

  it("answers none for no record, an ISSN it cannot read or no key (no call); unauthorized on 401/403; failed on any other non-200, a shapeless body or a network error", async () => {
    stub(answer());
    expect(await fetchJournalPolicy("0165-1781", KEY)).toEqual({ status: "none" });
    const none = stub();
    expect(await fetchJournalPolicy("junk", KEY)).toEqual({ status: "none" });
    expect(await fetchJournalPolicy("0165-1781", "  ")).toEqual({ status: "none" });
    expect(none).not.toHaveBeenCalled();
    for (const status of [401, 403]) {
      stub(json({}, status));
      expect(await fetchJournalPolicy("0165-1781", KEY), String(status)).toEqual({
        status: "unauthorized",
      });
    }
    for (const status of [404, 429, 500]) {
      stub(json({}, status));
      expect(await fetchJournalPolicy("0165-1781", KEY), String(status)).toEqual({
        status: "failed",
      });
    }
    stub(json({ items: "nope" }));
    expect(await fetchJournalPolicy("0165-1781", KEY)).toEqual({ status: "failed" });
    stub(res("<html>"));
    expect(await fetchJournalPolicy("0165-1781", KEY)).toEqual({ status: "failed" });
    stub(new Error("ECONNRESET"));
    expect(await fetchJournalPolicy("0165-1781", KEY)).toEqual({ status: "failed" });
  });
});

describe("permissionFor — the default route, with every route kept", () => {
  const policy = (...routes: PolicyRoute[]): JournalPolicy => ({
    routes,
    recordUpdated: "2025-03-13",
    policyUrl: "https://openpolicyfinder.jisc.ac.uk/publication/16060",
  });
  const PUBLISHED_12: PolicyRoute = {
    versions: ["publishedVersion"],
    embargoMonths: 12,
    locations: ["Institutional Repository"],
  };
  const ACCEPTED_0: PolicyRoute = {
    versions: ["acceptedVersion"],
    embargoMonths: 0,
    locations: ["Any Repository"],
  };

  it("stores the route chosen for the article as the default, and every route for the row to pick again", () => {
    expect(
      permissionFor(policy(PUBLISHED_12, ACCEPTED_0), { openToday: (m) => m === 0, fit: () => 1 }),
    ).toEqual({
      canArchive: true,
      ...ACCEPTED_0,
      recordUpdated: "2025-03-13",
      policyUrl: "https://openpolicyfinder.jisc.ac.uk/publication/16060",
      routes: [PUBLISHED_12, ACCEPTED_0],
    });
  });

  it("says no route with the record's dates and link when the journal permits none SigmaCV may name", () => {
    expect(permissionFor(policy(), { openToday: () => true, fit: () => 1 })).toEqual({
      canArchive: false,
      versions: [],
      locations: [],
      recordUpdated: "2025-03-13",
      policyUrl: "https://openpolicyfinder.jisc.ac.uk/publication/16060",
      routes: [],
    });
  });
});
