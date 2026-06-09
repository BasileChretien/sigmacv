import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the OAuth token so no credentials/network are needed for the token leg.
const { getTokenMock } = vi.hoisted(() => ({ getTokenMock: vi.fn() }));
vi.mock("@/lib/epo/auth", () => ({ getEpoAccessToken: getTokenMock }));

import { fetchEpoPatents } from "@/lib/epo/client";

function mockXml(xml: string, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(xml, { status }))),
  );
}

/** A biblio search response: one matching patent (epodoc id), one wrong-org
 *  patent (dropped), one docdb-only matching patent (untitled-lang), one
 *  title-less patent (dropped). */
const BIBLIO_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ops:world-patent-data xmlns:ops="http://ops.epo.org" xmlns="http://www.epo.org/exchange">
  <ops:biblio-search total-result-count="4">
    <ops:query syntax="CQL">in="Helen Smith"</ops:query>
    <ops:range begin="1" end="4"/>
    <ops:search-result>
      <exchange-documents>
        <exchange-document country="EP" doc-number="1234567" kind="A1">
          <bibliographic-data>
            <publication-reference>
              <document-id document-id-type="docdb"><country>EP</country><doc-number>1234567</doc-number><kind>A1</kind><date>20210310</date></document-id>
              <document-id document-id-type="epodoc"><doc-number>EP1234567</doc-number><date>20210310</date></document-id>
            </publication-reference>
            <invention-title lang="de">Eine clevere Vorrichtung</invention-title>
            <invention-title lang="en">A clever device</invention-title>
            <parties>
              <applicants>
                <applicant sequence="1" data-format="original"><applicant-name><name>University of York</name></applicant-name></applicant>
              </applicants>
              <inventors>
                <inventor sequence="1" data-format="original"><inventor-name><name>SMITH, HELEN</name></inventor-name></inventor>
              </inventors>
            </parties>
          </bibliographic-data>
        </exchange-document>
        <exchange-document>
          <bibliographic-data>
            <publication-reference>
              <document-id document-id-type="epodoc"><doc-number>EP9999999</doc-number><date>20190101</date></document-id>
            </publication-reference>
            <invention-title lang="en">Unrelated</invention-title>
            <parties>
              <applicants><applicant><applicant-name><name>Other Corp</name></applicant-name></applicant></applicants>
              <inventors><inventor><inventor-name><name>SMITH, HELEN</name></inventor-name></inventor></inventors>
            </parties>
          </bibliographic-data>
        </exchange-document>
        <exchange-document>
          <bibliographic-data>
            <publication-reference>
              <document-id document-id-type="docdb"><country>EP</country><doc-number>7654321</doc-number><kind>B1</kind><date>20240615</date></document-id>
            </publication-reference>
            <invention-title>A second method</invention-title>
            <parties>
              <applicants><applicant><applicant-name><name>University of York</name></applicant-name></applicant></applicants>
              <inventors><inventor><inventor-name><name>Helen Smith</name></inventor-name></inventor></inventors>
            </parties>
          </bibliographic-data>
        </exchange-document>
        <exchange-document>
          <bibliographic-data>
            <publication-reference>
              <document-id document-id-type="epodoc"><doc-number>EP5555555</doc-number></document-id>
            </publication-reference>
            <parties>
              <applicants><applicant><applicant-name><name>University of York</name></applicant-name></applicant></applicants>
              <inventors><inventor><inventor-name><name>Helen Smith</name></inventor-name></inventor></inventors>
            </parties>
          </bibliographic-data>
        </exchange-document>
      </exchange-documents>
    </ops:search-result>
  </ops:biblio-search>
</ops:world-patent-data>`;

beforeEach(() => {
  getTokenMock.mockResolvedValue("access-token");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchEpoPatents", () => {
  it("returns [] without an org, and without fetching", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchEpoPatents("Helen Smith", [])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns [] (dormant) when no OPS token is available", async () => {
    getTokenMock.mockResolvedValue(null);
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchEpoPatents("Helen Smith", ["University of York"])).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("keeps only inventor+applicant-org matches; parses epodoc + docdb numbers", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) => {
        urls.push(String(url));
        return Promise.resolve(new Response(BIBLIO_XML, { status: 200 }));
      }),
    );
    const patents = await fetchEpoPatents("Helen Smith", ["University of York"]);
    // Wrong-org and title-less patents are dropped; the two name-order queries
    // return the same doc, so it's merged (de-duped) — not listed twice.
    expect(patents).toEqual([
      {
        source: "epo",
        publicationNumber: "EP1234567",
        title: "A clever device", // English variant preferred over the German one
        applicants: ["University of York"],
        inventors: ["SMITH, HELEN"],
        year: 2021,
      },
      {
        source: "epo",
        publicationNumber: "EP7654321B1", // built from docdb country+number+kind
        title: "A second method",
        applicants: ["University of York"],
        inventors: ["Helen Smith"],
        year: 2024,
      },
    ]);
    // Both the as-given and the surname-first phrase are queried.
    const decoded = urls.map((u) => decodeURIComponent(u.replace(/\+/g, " ")));
    expect(decoded.some((u) => u.includes('q=in="Helen Smith"'))).toBe(true);
    expect(decoded.some((u) => u.includes('q=in="smith helen"'))).toBe(true);
  });

  it("finds a patent indexed surname-first that the as-given query misses", async () => {
    const EMPTY_XML = `<?xml version="1.0"?>
<ops:world-patent-data xmlns:ops="http://ops.epo.org" xmlns="http://www.epo.org/exchange">
  <ops:biblio-search total-result-count="0"><ops:search-result><exchange-documents></exchange-documents></ops:search-result></ops:biblio-search>
</ops:world-patent-data>`;
    const SURNAME_FIRST_XML = `<?xml version="1.0"?>
<ops:world-patent-data xmlns:ops="http://ops.epo.org" xmlns="http://www.epo.org/exchange">
  <ops:biblio-search total-result-count="1"><ops:search-result><exchange-documents>
    <exchange-document><bibliographic-data>
      <publication-reference><document-id document-id-type="epodoc"><doc-number>EP4238559</doc-number><date>20230907</date></document-id></publication-reference>
      <invention-title lang="en">Surname-indexed invention</invention-title>
      <parties>
        <applicants><applicant><applicant-name><name>University of York</name></applicant-name></applicant></applicants>
        <inventors><inventor><inventor-name><name>SMITH HELEN</name></inventor-name></inventor></inventors>
      </parties>
    </bibliographic-data></exchange-document>
  </exchange-documents></ops:search-result></ops:biblio-search>
</ops:world-patent-data>`;
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) => {
        const decoded = decodeURIComponent(String(url).replace(/\+/g, " "));
        // as-given "Helen Smith" → nothing; surname-first "smith helen" → the patent.
        const xml = decoded.includes('in="smith helen"') ? SURNAME_FIRST_XML : EMPTY_XML;
        return Promise.resolve(new Response(xml, { status: 200 }));
      }),
    );
    const patents = await fetchEpoPatents("Helen Smith", ["University of York"]);
    expect(patents.map((p) => p.publicationNumber)).toEqual(["EP4238559"]);
  });

  it("issues a single inventor query for a one-token (mononym) name", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) => {
        calls.push(String(url));
        return Promise.resolve(
          new Response(
            `<ops:world-patent-data xmlns:ops="http://ops.epo.org" xmlns="http://www.epo.org/exchange"><ops:biblio-search><ops:search-result><exchange-documents></exchange-documents></ops:search-result></ops:biblio-search></ops:world-patent-data>`,
            { status: 200 },
          ),
        );
      }),
    );
    await fetchEpoPatents("Madonna", ["Some Org"]);
    expect(calls).toHaveLength(1); // as-given == surname-first → de-duped to one query
  });

  it("handles a single-result response (exchange-document not an array)", async () => {
    const single = `<?xml version="1.0"?>
<ops:world-patent-data xmlns:ops="http://ops.epo.org" xmlns="http://www.epo.org/exchange">
  <ops:biblio-search><ops:search-result><exchange-documents>
    <exchange-document><bibliographic-data>
      <publication-reference><document-id document-id-type="epodoc"><doc-number>EP1112223</doc-number><date>20220101</date></document-id></publication-reference>
      <invention-title lang="en">Solo patent</invention-title>
      <parties>
        <applicants><applicant><applicant-name><name>University of York</name></applicant-name></applicant></applicants>
        <inventors><inventor><inventor-name><name>Helen Smith</name></inventor-name></inventor></inventors>
      </parties>
    </bibliographic-data></exchange-document>
  </exchange-documents></ops:search-result></ops:biblio-search>
</ops:world-patent-data>`;
    mockXml(single);
    const patents = await fetchEpoPatents("Helen Smith", ["University of York"]);
    expect(patents).toHaveLength(1);
    expect(patents[0]!.publicationNumber).toBe("EP1112223");
  });

  it("fails soft on a non-OK response and on a thrown fetch", async () => {
    mockXml("error", 403);
    expect(await fetchEpoPatents("Helen Smith", ["University of York"])).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      }),
    );
    expect(await fetchEpoPatents("Helen Smith", ["University of York"])).toEqual([]);
  });
});
