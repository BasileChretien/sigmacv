import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDblpConferencePapers } from "@/lib/dblp/client";

const ORCID = "0000-0001-7580-4351";

const SPARQL_JSON = {
  head: { vars: ["author"] },
  results: {
    bindings: [{ author: { type: "uri", value: "https://dblp.org/pid/00/1" } }],
  },
};

const PERSON_XML = `<?xml version="1.0"?>
<dblpperson name="Michael Ley" pid="00/1" n="2">
  <r><article key="journals/pvldb/Ley09"><author orcid="0000-0001-7580-4351" pid="00/1">Michael Ley</author><title>DBLP - Some Lessons Learned.</title><year>2009</year><journal>Proc. VLDB Endow.</journal></article></r>
  <r><inproceedings key="conf/jcdl/MichelsFLSS17"><author pid="176/1053">Christopher Michels</author><author pid="00/1">Michael Ley</author><title>OXPath-Based Data Acquisition for dblp.</title><year>2017</year><booktitle>JCDL</booktitle><ee>https://doi.org/10.1109/JCDL.2017.7991609</ee></inproceedings></r>
</dblpperson>`;

function mock(opts: { sparql?: unknown; xml?: string; sparqlStatus?: number }) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: unknown) => {
      const u = String(url);
      if (u.includes("sparql.dblp.org")) {
        return Promise.resolve(
          new Response(JSON.stringify(opts.sparql ?? SPARQL_JSON), {
            status: opts.sparqlStatus ?? 200,
          }),
        );
      }
      if (u.includes("/pid/")) {
        return Promise.resolve(new Response(opts.xml ?? PERSON_XML, { status: 200 }));
      }
      return Promise.resolve(new Response("", { status: 404 }));
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchDblpConferencePapers", () => {
  it("returns [] for an empty ORCID without fetching", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchDblpConferencePapers("")).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("resolves ORCID→PID then keeps only conference papers (drops journal articles)", async () => {
    mock({});
    const papers = await fetchDblpConferencePapers(`https://orcid.org/${ORCID}`);
    expect(papers).toEqual([
      {
        key: "conf/jcdl/MichelsFLSS17",
        title: "OXPath-Based Data Acquisition for dblp",
        venue: "JCDL",
        year: 2017,
        doi: "10.1109/JCDL.2017.7991609",
      },
    ]);
  });

  it("returns [] when the ORCID is not linked to a DBLP profile", async () => {
    mock({ sparql: { results: { bindings: [] } } });
    expect(await fetchDblpConferencePapers(ORCID)).toEqual([]);
  });

  it("fails soft when the SPARQL lookup errors", async () => {
    mock({ sparqlStatus: 500 });
    expect(await fetchDblpConferencePapers(ORCID)).toEqual([]);
  });

  it("handles an <ee> with attributes (object), a DOI-less <ee>, and drops title-less records", async () => {
    const xml = `<?xml version="1.0"?>
<dblpperson pid="00/1">
  <r><inproceedings key="conf/x/1"><title>Paper A.</title><year>2020</year><booktitle>X</booktitle><ee type="oa">https://doi.org/10.1/abc</ee></inproceedings></r>
  <r><inproceedings key="conf/x/2"><year>2021</year><booktitle>X</booktitle></inproceedings></r>
  <r><inproceedings key="conf/x/3"><title>Paper C.</title><booktitle>X</booktitle></inproceedings></r>
</dblpperson>`;
    mock({ xml });
    expect(await fetchDblpConferencePapers(ORCID)).toEqual([
      { key: "conf/x/1", title: "Paper A", venue: "X", year: 2020, doi: "10.1/abc" },
      { key: "conf/x/3", title: "Paper C", venue: "X", year: undefined, doi: undefined },
    ]);
  });

  it("rejects a malformed PID (query/fragment/traversal) without fetching the profile", async () => {
    // A hostile/garbled SPARQL value carrying a query string would, if passed
    // verbatim into `https://dblp.org/pid/${pid}.xml`, re-point the outbound
    // request. The PID allow-list must reject it so no profile fetch happens.
    const fetchSpy = vi.fn((url: unknown) => {
      // Route on the parsed host (not a substring match) so the mock dispatch
      // itself is unambiguous — a SPARQL request gets the binding, anything else
      // (a profile fetch) gets an empty 200.
      const host = new URL(String(url)).hostname;
      if (host === "sparql.dblp.org") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              results: {
                bindings: [
                  { author: { type: "uri", value: "https://dblp.org/pid/00/1?x=../../internal" } },
                ],
              },
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response("", { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchDblpConferencePapers(ORCID)).toEqual([]);
    // Only the SPARQL call was made; the /pid/ profile fetch was never attempted.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchSpy.mock.calls[0]![0])).hostname).toBe("sparql.dblp.org");
  });

  it("fails soft when the profile fetch throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) => {
        const u = String(url);
        if (u.includes("sparql.dblp.org")) {
          return Promise.resolve(new Response(JSON.stringify(SPARQL_JSON), { status: 200 }));
        }
        throw new Error("profile down");
      }),
    );
    expect(await fetchDblpConferencePapers(ORCID)).toEqual([]);
  });
});
