import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCrossrefGrantsByOrcid } from "@/lib/crossref/client";

const ORCID = "0000-0001-9773-0023";
const MAILTO = "test@example.org";

function mockFetch(impl: (url: unknown) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A trimmed but realistic Crossref `type:grant` work-list (Wellcome + FWF + junk).
const WORK_LIST = {
  status: "ok",
  "message-type": "work-list",
  message: {
    "total-results": 2,
    items: [
      {
        publisher: "Wellcome",
        award: "218300",
        DOI: "10.35802/218300",
        type: "grant",
        issued: { "date-parts": [[2019, 11, 1]] },
        project: [
          {
            "project-title": [
              { title: "Biocontainment Level 2 high-parameter FACS" },
            ],
            "award-start": { "date-parts": [[2019, 11, 1]] },
            "award-end": { "date-parts": [[2024, 10, 31]] },
            funding: [
              {
                funder: {
                  id: [{ id: "10.13039/100010269", "id-type": "DOI" }],
                  name: "Wellcome Trust",
                },
              },
            ],
          },
        ],
      },
      {
        // Minimal record: no award dates, but DOI + title + funder present.
        publisher: "Austrian Science Fund (FWF)",
        award: "PIN8859924",
        DOI: "10.55776/pin8859924",
        type: "grant",
        project: [
          {
            "project-title": [
              { title: "Wave Based Method for time-domain vibro-acoustic problems" },
            ],
            funding: [
              {
                funder: {
                  id: [{ id: "10.13039/501100002428", "id-type": "DOI" }],
                  name: "Austrian Science Fund (FWF)",
                },
              },
            ],
          },
        ],
      },
      {
        // Minimal VALID grant: DOI + title only (no funder / dates) — included.
        DOI: "10.5555/minimal",
        type: "grant",
        project: [{ "project-title": [{ title: "Minimal grant" }] }],
      },
      // Dropped: DOI but no title.
      { DOI: "10.1000/notitle", type: "grant", project: [{ funding: [] }] },
      // Dropped: DOI but no project at all.
      { DOI: "10.1000/noproject", type: "grant" },
      // Dropped: no DOI.
      { type: "grant", project: [{ "project-title": [{ title: "No DOI" }] }] },
    ],
  },
};

describe("fetchCrossrefGrantsByOrcid", () => {
  it("returns [] for an empty ORCID without fetching", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchCrossrefGrantsByOrcid("", MAILTO)).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("queries by bare ORCID + type:grant and maps the records", async () => {
    let calledUrl = "";
    mockFetch((url) => {
      calledUrl = String(url);
      return new Response(JSON.stringify(WORK_LIST), { status: 200 });
    });
    // Accepts the URL form; normalized to the bare iD for the filter.
    const grants = await fetchCrossrefGrantsByOrcid(
      `https://orcid.org/${ORCID}`,
      MAILTO,
    );
    const decoded = decodeURIComponent(calledUrl);
    expect(decoded).toContain("filter=orcid:0000-0001-9773-0023,type:grant");
    expect(decoded).toContain("mailto=test@example.org");
    expect(grants).toEqual([
      {
        doi: "10.35802/218300",
        award: "218300",
        title: "Biocontainment Level 2 high-parameter FACS",
        funderName: "Wellcome Trust",
        funderId: "10.13039/100010269",
        startYear: 2019,
        endYear: 2024,
      },
      {
        doi: "10.55776/pin8859924",
        award: "PIN8859924",
        title: "Wave Based Method for time-domain vibro-acoustic problems",
        funderName: "Austrian Science Fund (FWF)",
        funderId: "10.13039/501100002428",
        startYear: undefined,
        endYear: undefined,
      },
      {
        doi: "10.5555/minimal",
        award: undefined,
        title: "Minimal grant",
        funderName: undefined,
        funderId: undefined,
        startYear: undefined,
        endYear: undefined,
      },
    ]);
  });

  it("returns [] on a non-OK response", async () => {
    mockFetch(() => new Response("err", { status: 500 }));
    expect(await fetchCrossrefGrantsByOrcid(ORCID, MAILTO)).toEqual([]);
  });

  it("fails soft (returns []) when the fetch throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockFetch(() => {
      throw new Error("network down");
    });
    expect(await fetchCrossrefGrantsByOrcid(ORCID, MAILTO)).toEqual([]);
  });
});
