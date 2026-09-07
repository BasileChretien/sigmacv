import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCrossrefCreditRoles, fetchCrossrefPeerReviewsByOrcid } from "@/lib/crossref/client";

const ORCID = "0000-0002-7483-2489";
const MAILTO = "test@example.org";

function mockFetch(impl: (url: string, n: number) => Response | Promise<Response>) {
  let calls = 0;
  const fn = vi.fn((url: unknown) => impl(String(url), calls++));
  vi.stubGlobal("fetch", fn);
  return fn;
}

function page(items: unknown[], next?: string) {
  return new Response(
    JSON.stringify({
      status: "ok",
      "message-type": "work-list",
      message: { "total-results": items.length, items, "next-cursor": next ?? "AoJ/next" },
    }),
    { status: 200 },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A realistic Crossref `type:peer-review` record (eLife-style referee report).
const FULL_REVIEW = {
  DOI: "10.7554/ELIFE.12345.SA1",
  type: "peer-review",
  title: ["Decision letter: A study of something"],
  "container-title": ["eLife"],
  URL: "https://doi.org/10.7554/elife.12345.sa1",
  issued: { "date-parts": [[2024, 3, 12]] },
  created: { "date-parts": [[2024, 3, 13]] },
  author: [
    { given: "Someone", family: "Else", ORCID: "http://orcid.org/0000-0001-0000-0002" },
    { given: "Basile", family: "Chrétien", ORCID: "https://orcid.org/0000-0002-7483-2489" },
  ],
  review: {
    type: "referee-report",
    stage: "pre-publication",
    recommendation: "major-revision",
    "competing-interest-statement": "None",
  },
  relation: {
    "is-review-of": [{ id: "10.7554/eLife.12345", "id-type": "doi", "asserted-by": "subject" }],
  },
};

describe("fetchCrossrefPeerReviewsByOrcid", () => {
  it("returns [] for an empty ORCID without fetching", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchCrossrefPeerReviewsByOrcid("", MAILTO)).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("queries by bare ORCID + type:peer-review with cursor paging and maps the record", async () => {
    let calledUrl = "";
    mockFetch((url) => {
      calledUrl = url;
      return page([FULL_REVIEW]);
    });
    const reviews = await fetchCrossrefPeerReviewsByOrcid(`https://orcid.org/${ORCID}`, MAILTO);
    const decoded = decodeURIComponent(calledUrl);
    expect(decoded).toContain("filter=orcid:0000-0002-7483-2489,type:peer-review");
    expect(decoded).toContain("rows=200");
    expect(decoded).toContain("cursor=*");
    expect(decoded).toContain("mailto=test@example.org");
    expect(reviews).toEqual([
      {
        doi: "10.7554/elife.12345.sa1",
        title: "Decision letter: A study of something",
        venue: "eLife",
        year: 2024,
        url: "https://doi.org/10.7554/elife.12345.sa1",
        reviewType: "referee-report",
        stage: "pre-publication",
        recommendation: "major-revision",
        reviewOf: "10.7554/elife.12345",
        reviewer: { given: "Basile", family: "Chrétien" },
      },
    ]);
  });

  it("maps a minimal record defensively (DOI only; created-date fallback; bad URL dropped)", async () => {
    mockFetch(() =>
      page([
        { DOI: "10.5555/min", created: { "date-parts": [[2020]] }, URL: "ftp://nope" },
        // The owner is on the author list but without a name → no reviewer.
        { DOI: "10.5555/noname", author: [{ ORCID: `http://orcid.org/${ORCID}` }] },
        // Malformed rows: no DOI / not an object / review + relation of the wrong shape.
        { type: "peer-review", title: ["No DOI"] },
        "junk",
        null,
        { DOI: "10.5555/odd", review: "nope", relation: { "is-review-of": "nope" }, author: "x" },
      ]),
    );
    const reviews = await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO);
    expect(reviews.map((r) => r.doi)).toEqual(["10.5555/min", "10.5555/noname", "10.5555/odd"]);
    expect(reviews[0]).toEqual({ doi: "10.5555/min", year: 2020 });
    expect(reviews[1]!.reviewer).toBeUndefined();
    expect(reviews[2]!.reviewOf).toBeUndefined();
  });

  it("de-duplicates by DOI (case-insensitively) across pages", async () => {
    const big = Array.from({ length: 200 }, (_, i) => ({ DOI: `10.5555/r${i}` }));
    mockFetch((_url, n) =>
      n === 0 ? page(big, "c2") : page([{ DOI: "10.5555/R0" }, { DOI: "10.5555/new" }]),
    );
    const reviews = await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO);
    expect(reviews).toHaveLength(201);
    expect(reviews.at(-1)?.doi).toBe("10.5555/new");
  });

  it("follows next-cursor for at most 3 pages", async () => {
    const big = Array.from({ length: 200 }, (_, i) => ({ DOI: `10.5555/p${i}` }));
    const urls: string[] = [];
    mockFetch((url, n) => {
      urls.push(decodeURIComponent(url));
      return page(
        big.map((r) => ({ DOI: `${r.DOI}-${n}` })),
        `cur${n + 1}`,
      );
    });
    const reviews = await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO);
    expect(urls).toHaveLength(3);
    expect(urls[1]).toContain("cursor=cur1");
    expect(urls[2]).toContain("cursor=cur2");
    expect(reviews).toHaveLength(600);
  });

  it("stops after a short page even when a cursor is returned", async () => {
    const fn = mockFetch(() => page([{ DOI: "10.5555/only" }], "more"));
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toHaveLength(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("stops when a full page carries no usable cursor", async () => {
    const big = Array.from({ length: 200 }, (_, i) => ({ DOI: `10.5555/q${i}` }));
    const fn = mockFetch(
      () =>
        new Response(JSON.stringify({ message: { items: big, "next-cursor": null } }), {
          status: 200,
        }),
    );
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toHaveLength(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("returns [] on a non-OK response and keeps earlier pages on a later failure", async () => {
    mockFetch(() => new Response("err", { status: 500 }));
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toEqual([]);

    const big = Array.from({ length: 200 }, (_, i) => ({ DOI: `10.5555/k${i}` }));
    mockFetch((_url, n) => (n === 0 ? page(big, "c2") : new Response("err", { status: 503 })));
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toHaveLength(200);
  });

  it("returns [] for an empty or non-JSON body and an over-sized body", async () => {
    mockFetch(() => new Response(JSON.stringify({ message: {} }), { status: 200 }));
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toEqual([]);

    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => new Response("not json", { status: 200 }));
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toEqual([]);

    mockFetch(() => new Response("x".repeat(4_000_001), { status: 200 }));
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toEqual([]);
  });

  it("fails soft (returns []) when the fetch throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => {
      throw new Error("network down");
    });
    expect(await fetchCrossrefPeerReviewsByOrcid(ORCID, MAILTO)).toEqual([]);
  });
});

describe("fetchCrossrefCreditRoles", () => {
  const work = (author: unknown) =>
    new Response(JSON.stringify({ status: "ok", message: { author } }), { status: 200 });

  it("returns null without fetching for a bad DOI or a missing ORCID", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchCrossrefCreditRoles("not-a-doi", ORCID, MAILTO)).toBeNull();
    expect(await fetchCrossrefCreditRoles("10.1000/x", "", MAILTO)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("selects only the author list and returns the OWNER's normalised roles (matched by ORCID)", async () => {
    let calledUrl = "";
    mockFetch((url) => {
      calledUrl = url;
      return work([
        { given: "Other", family: "Person", role: ["Conceptualization", "Software"] },
        {
          given: "Basile",
          family: "Chrétien",
          ORCID: `http://orcid.org/${ORCID}`,
          role: [
            { value: "Writing – review & editing", vocab: "CRediT" },
            { value: "Formal analysis", vocab: "credit" },
            { value: "Wizardry", vocab: "credit" },
          ],
        },
      ]);
    });
    const roles = await fetchCrossrefCreditRoles("https://doi.org/10.1000/ABC", ORCID, MAILTO);
    const decoded = decodeURIComponent(calledUrl);
    expect(decoded).toContain("/works/10.1000/abc?");
    expect(decoded).toContain("select=author");
    expect(decoded).toContain("mailto=test@example.org");
    expect(roles).toEqual(["formal-analysis", "writing-review-editing"]);
  });

  it("returns null when the owner is not on the author list, or carries no CRediT roles", async () => {
    mockFetch(() => work([{ given: "Other", family: "Person", role: ["Software"] }]));
    expect(await fetchCrossrefCreditRoles("10.1000/x", ORCID, MAILTO)).toBeNull();

    mockFetch(() => work([{ family: "Chrétien", ORCID: `https://orcid.org/${ORCID}` }]));
    expect(await fetchCrossrefCreditRoles("10.1000/x", ORCID, MAILTO)).toBeNull();

    mockFetch(() => work("nope"));
    expect(await fetchCrossrefCreditRoles("10.1000/x", ORCID, MAILTO)).toBeNull();
  });

  it("returns null on a non-OK response, an over-sized body, or a thrown fetch", async () => {
    mockFetch(() => new Response("err", { status: 404 }));
    expect(await fetchCrossrefCreditRoles("10.1000/x", ORCID, MAILTO)).toBeNull();

    mockFetch(() => new Response("x".repeat(200_001), { status: 200 }));
    expect(await fetchCrossrefCreditRoles("10.1000/x", ORCID, MAILTO)).toBeNull();

    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => {
      throw new Error("network down");
    });
    expect(await fetchCrossrefCreditRoles("10.1000/x", ORCID, MAILTO)).toBeNull();
  });
});
