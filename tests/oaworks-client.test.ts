import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchSelfArchivingPermission,
  isoFromRecordDate,
  PERMISSION_LIMITS,
} from "@/lib/oaworks/client";

/**
 * OA.Works permissions client: one DOI → the printed subset of `best_permission`,
 * or an honest `none` / `failed`. Mocked fetch only (no network in tests). The
 * fixture is a trimmed copy of the live answer for 10.1016/j.cell.2020.01.001
 * (2026-09-15), including the fields the boundary must DROP (contributor e-mail
 * addresses, copyright owner, score).
 */

function res(body: string, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, text: async () => body } as Response;
}
const json = (value: unknown, status = 200) => res(JSON.stringify(value), status);

const CELL = {
  best_permission: {
    can_archive: true,
    version: "acceptedVersion",
    versions: ["acceptedVersion", "submittedVersion"],
    licence: "cc-by-nc-nd",
    locations: ["Institutional Repository", "Non-commercial Subject Repository"],
    embargo_months: 12,
    embargo_end: "2021-01-23",
    deposit_statement:
      "© This manuscript version is made available under the CC-BY-NC-ND 4.0 license https://creativecommons.org/licenses/by-nc-nd/4.0/",
    copyright_owner: "journal",
    copyright_name: "Cell",
    issuer: { id: ["0092-8674"], has_policy: "Yes", type: "journal" },
    meta: {
      contributors: ["joe@openaccessbutton.org", "natalia@oa.works"],
      added: "01/01/2019 00:00:00",
      updated: "27/01/2021 00:00:00",
    },
    provenance: {
      author_rights: "https://perma.cc/H55L-FCQU",
      archiving_policy: [
        "https://web.archive.org/web/20200106202134/https://www.elsevier.com/__data/promis_misc/external-embargo-list.pdf",
        "https://perma.cc/J5MA-H2EJ",
      ],
    },
    score: 1100,
  },
  all_permissions: [],
};

/** CELL with `best_permission` fields replaced. */
function cellWith(over: Record<string, unknown>) {
  return { ...CELL, best_permission: { ...CELL.best_permission, ...over } };
}

function stubFetch(...responses: Array<Response | Error>) {
  const fn = vi.fn();
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r);
    else fn.mockResolvedValueOnce(r);
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchSelfArchivingPermission — answers", () => {
  it("reduces best_permission to the printed subset and drops everything else", async () => {
    const fetchMock = stubFetch(json(CELL));
    const out = await fetchSelfArchivingPermission("10.1016/j.cell.2020.01.001", "ci@example.org");
    expect(out).toEqual({
      status: "found",
      permission: {
        canArchive: true,
        versions: ["submittedVersion", "acceptedVersion"],
        embargoMonths: 12,
        embargoEnd: "2021-01-23",
        locations: ["Institutional Repository", "Non-commercial Subject Repository"],
        licence: "cc-by-nc-nd",
        depositStatement:
          "© This manuscript version is made available under the CC-BY-NC-ND 4.0 license https://creativecommons.org/licenses/by-nc-nd/4.0/",
        recordUpdated: "2021-01-27",
        policyUrl:
          "https://web.archive.org/web/20200106202134/https://www.elsevier.com/__data/promis_misc/external-embargo-list.pdf",
      },
    });
    expect(JSON.stringify(out)).not.toMatch(/@|copyright|score|issuer/i);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://bg.api.oa.works/permissions/10.1016/j.cell.2020.01.001");
    expect(init.headers["User-Agent"]).toContain("mailto:ci@example.org");
    expect(init.cache).toBe("no-store");
  });

  it("records a refusal as found with canArchive false, keeping only the record's date and archived policy", async () => {
    stubFetch(json(cellWith({ can_archive: false })));
    const out = await fetchSelfArchivingPermission("10.1234/closed");
    expect(out).toEqual({
      status: "found",
      permission: {
        canArchive: false,
        versions: [],
        locations: [],
        recordUpdated: "2021-01-27",
        policyUrl:
          "https://web.archive.org/web/20200106202134/https://www.elsevier.com/__data/promis_misc/external-embargo-list.pdf",
      },
    });
    expect(JSON.stringify(out)).not.toMatch(/embargo_end|licence|manuscript version/i);
  });

  it("answers none when OA.Works holds no best_permission (absent or null)", async () => {
    stubFetch(json({ all_permissions: [] }), json({ best_permission: null }));
    expect(await fetchSelfArchivingPermission("10.1234/a")).toEqual({ status: "none" });
    expect(await fetchSelfArchivingPermission("10.1234/b")).toEqual({ status: "none" });
  });

  it("answers none when the record's issuer is not the journal or the publisher", async () => {
    stubFetch(
      json(cellWith({ issuer: { type: "affiliation", id: ["FR"] } })),
      json(cellWith({ issuer: undefined })),
      json(cellWith({ issuer: { type: " Publisher " } })),
    );
    expect(await fetchSelfArchivingPermission("10.1234/a")).toEqual({ status: "none" });
    expect(await fetchSelfArchivingPermission("10.1234/b")).toEqual({ status: "none" });
    expect((await fetchSelfArchivingPermission("10.1234/c")).status).toBe("found");
  });

  it("answers none for a 404 and for OA.Works' 501 'DOI is not a journal article', asking once", async () => {
    const fetchMock = stubFetch(res("Not found", 404), res("DOI is not a journal article", 501));
    expect(await fetchSelfArchivingPermission("10.1234/a")).toEqual({ status: "none" });
    expect(await fetchSelfArchivingPermission("10.1234/b")).toEqual({ status: "none" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("answers none for a malformed DOI without calling OA.Works", async () => {
    const fetchMock = stubFetch();
    expect(await fetchSelfArchivingPermission("not a doi")).toEqual({ status: "none" });
    expect(await fetchSelfArchivingPermission("")).toEqual({ status: "none" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a DOI with a dot segment — which would walk the request out of /permissions/ — or an over-long one", async () => {
    const fetchMock = stubFetch();
    for (const doi of [
      "10.1234/../../../secret",
      "10.1234/./x",
      "10.1234/a/..",
      `10.1234/${"a".repeat(300)}`,
    ]) {
      expect(await fetchSelfArchivingPermission(doi), doi).toEqual({ status: "none" });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts the DOI URL and doi: forms, keeps the slash and escapes the rest; no mailto, no contact", async () => {
    const fetchMock = stubFetch(json(CELL), json(CELL));
    await fetchSelfArchivingPermission("https://doi.org/10.1002/(SICI)1097#x?y");
    await fetchSelfArchivingPermission("doi:10.1002/pds.5000");
    expect(fetchMock.mock.calls[0]![0]).toBe(
      "https://bg.api.oa.works/permissions/10.1002/(SICI)1097%23x%3Fy",
    );
    expect(fetchMock.mock.calls[1]![0]).toBe(
      "https://bg.api.oa.works/permissions/10.1002/pds.5000",
    );
    expect(fetchMock.mock.calls[1]![1].headers["User-Agent"]).not.toContain("mailto");
  });
});

describe("fetchSelfArchivingPermission — failures are not answers", () => {
  it("fails on a 429 and on a 5xx other than 501, without retrying (the pass retries on a later sync)", async () => {
    const fetchMock = stubFetch(res("slow down", 429), res("oops", 503));
    expect(await fetchSelfArchivingPermission("10.1234/a")).toEqual({ status: "failed" });
    expect(await fetchSelfArchivingPermission("10.1234/b")).toEqual({ status: "failed" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fails on malformed JSON, a non-object body and an oversized body", async () => {
    stubFetch(res("<html>not json"), json(["best_permission"]), res(`"${"x".repeat(1_000_001)}"`));
    expect(await fetchSelfArchivingPermission("10.1234/a")).toEqual({ status: "failed" });
    expect(await fetchSelfArchivingPermission("10.1234/b")).toEqual({ status: "failed" });
    expect(await fetchSelfArchivingPermission("10.1234/c")).toEqual({ status: "failed" });
  });

  it("fails on a best_permission it cannot read (an API change must not clear a stored record)", async () => {
    stubFetch(json({ best_permission: { can_archive: "yes" } }));
    expect(await fetchSelfArchivingPermission("10.1234/a")).toEqual({ status: "failed" });
  });

  it("fails on a network error, asking once", async () => {
    const fetchMock = stubFetch(new Error("ECONNRESET"));
    expect(await fetchSelfArchivingPermission("10.1234/a")).toEqual({ status: "failed" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchSelfArchivingPermission — bounds and normalisation", () => {
  async function permission(over: Record<string, unknown>) {
    stubFetch(json(cellWith(over)));
    const out = await fetchSelfArchivingPermission("10.1016/j.cell.2020.01.001");
    if (out.status !== "found") throw new Error(`expected found, got ${out.status}`);
    return out.permission;
  }

  it("keeps only known versions, in canonical order, falling back to `version`", async () => {
    expect(
      (await permission({ versions: ["publishedVersion", "draft", 3, "acceptedVersion"] }))
        .versions,
    ).toEqual(["acceptedVersion", "publishedVersion"]);
    expect(
      (await permission({ versions: undefined, version: "publishedVersion" })).versions,
    ).toEqual(["publishedVersion"]);
    expect((await permission({ versions: "acceptedVersion", version: 7 })).versions).toEqual([]);
  });

  it("bounds, trims and dedupes locations, dropping non-strings and over-long entries", async () => {
    const many = Array.from({ length: 12 }, (_, i) => `Repository kind ${i}`);
    const out = await permission({
      locations: [
        "  Institutional   Repository ",
        "Institutional Repository",
        42,
        "",
        "x".repeat(101),
        ...many,
      ],
    });
    expect(out.locations[0]).toBe("Institutional Repository");
    expect(out.locations).toHaveLength(PERMISSION_LIMITS.locations);
    expect(new Set(out.locations).size).toBe(out.locations.length);
  });

  it("strips markup from the deposit statement and drops one too long to quote whole", async () => {
    expect(
      (await permission({ deposit_statement: "Role of<i><scp>CYP</scp>2B6</i>\n in  X." }))
        .depositStatement,
    ).toBe("Role ofCYP2B6 in X.");
    // A nested or broken tag leaves no angle bracket behind.
    expect(
      (await permission({ deposit_statement: "a<scr<script>ipt>alert(1)</script>b <c" }))
        .depositStatement,
    ).toBe("aiptalert(1)b c");
    expect(
      (await permission({ deposit_statement: "y".repeat(PERMISSION_LIMITS.depositStatement + 1) }))
        .depositStatement,
    ).toBeUndefined();
    expect((await permission({ deposit_statement: "  " })).depositStatement).toBeUndefined();
  });

  it("drops an over-long licence, a non-integer or out-of-range embargo and an invalid embargo end", async () => {
    const out = await permission({
      licence: "l".repeat(PERMISSION_LIMITS.licence + 1),
      embargo_months: 6.5,
      embargo_end: "2021-02-30",
    });
    expect(out.licence).toBeUndefined();
    expect(out.embargoMonths).toBeUndefined();
    expect(out.embargoEnd).toBeUndefined();
    expect((await permission({ embargo_months: -1 })).embargoMonths).toBeUndefined();
    expect((await permission({ embargo_months: 601 })).embargoMonths).toBeUndefined();
    expect((await permission({ embargo_months: 0 })).embargoMonths).toBe(0);
    expect((await permission({ embargo_months: "12" })).embargoMonths).toBeUndefined();
  });

  it("prefers the archived address that names a policy (Wiley lists a price list first)", async () => {
    const wiley = [
      "https://web.archive.org/web/20200106202133/https://onlinelibrary.wiley.com/library-info/products/price-lists",
      "http://web.archive.org/web/20190530141919/https://authorservices.wiley.com/author-resources/Journal-Authors/licensing/self-archiving.html",
    ];
    expect((await permission({ provenance: { archiving_policy: wiley } })).policyUrl).toBe(
      wiley[1],
    );
  });

  it("otherwise takes the first http(s) archived URL, from a list or a comma-separated string", async () => {
    expect(
      (await permission({ provenance: { archiving_policy: [3, "ftp://x", "http://a.example/p"] } }))
        .policyUrl,
    ).toBe("http://a.example/p");
    expect(
      (await permission({ provenance: { archiving_policy: "nope, https://perma.cc/J5MA-H2EJ" } }))
        .policyUrl,
    ).toBe("https://perma.cc/J5MA-H2EJ");
    expect(
      (await permission({ provenance: { archiving_policy: [`https://${"a".repeat(2050)}`] } }))
        .policyUrl,
    ).toBeUndefined();
    expect((await permission({ provenance: undefined })).policyUrl).toBeUndefined();
    expect((await permission({ provenance: { archiving_policy: 12 } })).policyUrl).toBeUndefined();
  });
});

describe("isoFromRecordDate", () => {
  it("reads OA.Works' day-first dates, with or without a time", () => {
    expect(isoFromRecordDate("27/01/2021 00:00:00")).toBe("2021-01-27");
    expect(isoFromRecordDate("20/08/2024 06:05")).toBe("2024-08-20");
    expect(isoFromRecordDate("5/3/2022")).toBe("2022-03-05");
  });

  it("accepts an ISO date or timestamp, and rejects impossible or unrecognised dates", () => {
    expect(isoFromRecordDate("2022-03-05T13:19:06Z")).toBe("2022-03-05");
    expect(isoFromRecordDate("2022-03-05")).toBe("2022-03-05");
    expect(isoFromRecordDate("31/02/2021")).toBeUndefined();
    expect(isoFromRecordDate("01/13/2021")).toBeUndefined();
    expect(isoFromRecordDate("January 2021")).toBeUndefined();
    expect(isoFromRecordDate(undefined)).toBeUndefined();
  });
});
