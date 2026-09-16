import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupEuropePmcCopy } from "@/lib/repositoryCopies/europepmc";
import { lookupHalCopy } from "@/lib/repositoryCopies/hal";
import { lookupOpenaireCopy } from "@/lib/repositoryCopies/openaire";
import { bareDoi, COPY_LIMITS, isoDate } from "@/lib/repositoryCopies/shared";
import { lookupZenodoCopy } from "@/lib/repositoryCopies/zenodo";

/**
 * The four repository clients: one DOI → the copies the worklist prints, or an
 * honest `none` / `failed`. Mocked fetch only. The fixtures are trimmed copies
 * of live answers of 2026-09-16 (HAL and Europe PMC on the owner's own DOIs).
 */

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

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

const DOI = "10.1111/bjh.17863";

describe("shared", () => {
  it("keys a DOI bare and sane, refusing dot segments and junk", () => {
    expect(bareDoi("https://doi.org/10.1111/bjh.17863")).toBe(DOI);
    expect(bareDoi("doi:10.1111/BJH.17863 ")).toBe("10.1111/BJH.17863");
    expect(bareDoi("10.1111/../x")).toBeUndefined();
    expect(bareDoi("not a doi")).toBeUndefined();
    expect(isoDate("2021-12-10T09:00:00Z")).toBe("2021-12-10");
    expect(isoDate(42)).toBeUndefined();
  });
});

describe("HAL", () => {
  it("finds the record, says whether a file is open on it, the file first", async () => {
    const fetch = stub(
      json({
        response: {
          numFound: 2,
          docs: [
            {
              halId_s: "hal-05745947",
              submittedDate_s: "2026-09-10 11:02:33",
              openAccess_bool: false,
              docType_s: "ART",
            },
            {
              halId_s: "hal-03474586",
              submittedDate_s: "2021-12-10 09:00:00",
              openAccess_bool: true,
              docType_s: "ART",
            },
          ],
        },
      }),
    );
    const r = await lookupHalCopy("10.1111/BJH.17863", "ci@example.org");
    expect(r).toEqual({
      status: "found",
      copies: [
        {
          source: "hal",
          id: "hal-03474586",
          url: "https://hal.science/hal-03474586",
          hasFile: true,
          recorded: "2021-12-10",
        },
        {
          source: "hal",
          id: "hal-05745947",
          url: "https://hal.science/hal-05745947",
          hasFile: false,
          recorded: "2026-09-10",
        },
      ],
    });
    const url = new URL(fetch.mock.calls[0]![0] as string);
    expect(url.origin + url.pathname).toBe("https://api.archives-ouvertes.fr/search/");
    expect(url.searchParams.get("q")).toBe('doiId_s:"10.1111/bjh.17863"');
    expect(url.searchParams.get("fl")).toBe("halId_s,submittedDate_s,openAccess_bool");
    expect(url.searchParams.get("wt")).toBe("json");
    const init = fetch.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>)["User-Agent"]).toContain(
      "mailto:ci@example.org",
    );
    expect(init.redirect).toBe("error");
  });

  it("answers none for no record and for a DOI it cannot key; failed on a 5xx, a 429 or a broken body — never throws", async () => {
    stub(json({ response: { numFound: 0, docs: [] } }));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "none" });
    stub(json({}, 404));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "none" });
    stub(new Response("x".repeat(1_200_000), { status: 200 }));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "failed" });
    expect(await lookupHalCopy("junk")).toEqual({ status: "none" });
    stub(json({}, 503));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "failed" });
    stub(json({}, 429));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "failed" });
    stub(new Response("<html>", { status: 200 }));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "failed" });
    stub(new Error("ECONNRESET"));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "failed" });
    stub(json({ response: { docs: [{ halId_s: "not an id" }] } }));
    expect(await lookupHalCopy(DOI)).toEqual({ status: "none" });
  });
});

describe("Europe PMC", () => {
  it("counts a record only when the full text is in Europe PMC", async () => {
    stub(
      json({
        resultList: {
          result: [
            {
              pmid: "40272201",
              pmcid: "PMC12342995",
              inEPMC: "Y",
              isOpenAccess: "Y",
              firstPublicationDate: "2025-04-24",
            },
            { pmid: "1", inEPMC: "N" },
          ],
        },
      }),
    );
    expect(await lookupEuropePmcCopy("10.1093/ehjcvp/pvaf027")).toEqual({
      status: "found",
      copies: [
        {
          source: "europepmc",
          id: "PMC12342995",
          url: "https://europepmc.org/article/PMC/PMC12342995",
          hasFile: true,
          name: "Europe PMC",
          recorded: "2025-04-24",
        },
      ],
    });
    stub(json({ resultList: { result: [{ pmid: "2", inEPMC: "N" }] } }));
    expect(await lookupEuropePmcCopy(DOI)).toEqual({ status: "none" });
    stub(json({ nonsense: true }));
    expect(await lookupEuropePmcCopy(DOI)).toEqual({ status: "failed" });
  });
});

describe("OpenAIRE", () => {
  const record = (instance: unknown) => ({
    response: {
      results: {
        result: [{ metadata: { "oaf:entity": { "oaf:result": { children: { instance } } } } }],
      },
    },
  });
  it("keeps only OPEN instances in OpenDOAR-registered repositories, over https, not the DOI itself; one instance may come alone", async () => {
    stub(
      json(
        record([
          {
            hostedby: { "@name": "Therapies", "@id": "doajarticles::1" },
            accessright: { "@classid": "CLOSED" },
            webresource: { url: "https://doi.org/10.1/x" },
          },
          {
            hostedby: { "@name": "DSpace@MIT", "@id": "opendoar____::42" },
            accessright: { "@classid": "OPEN" },
            webresource: [{ url: "https://dspace.mit.edu/handle/1/2" }],
          },
          {
            hostedby: { "@name": "Journal X" },
            accessright: { "@classid": "OPEN" },
            webresource: { url: "https://doi.org/10.1/x" },
          },
        ]),
      ),
    );
    expect(await lookupOpenaireCopy(DOI)).toEqual({
      status: "found",
      copies: [
        {
          source: "openaire",
          id: "opendoar____::42",
          url: "https://dspace.mit.edu/handle/1/2",
          hasFile: true,
          name: "DSpace@MIT",
        },
      ],
    });
    stub(
      json(
        record({
          hostedby: { "@name": "Unknown Repository" },
          accessright: { "@classid": "UNKNOWN" },
        }),
      ),
    );
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "none" });
    stub(json({ response: { results: null } }));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "none" });
    // A journal's own page (DOAJ) marked OPEN, and a repository reached over http
    // (the schema keeps https links only): neither is a copy.
    stub(
      json(
        record([
          {
            hostedby: { "@name": "Journal X", "@id": "doajarticles::9" },
            accessright: { "@classid": "OPEN" },
            webresource: { url: "https://journalx.example/article/1" },
          },
          {
            hostedby: { "@name": "EPrints Y", "@id": "opendoar____::7" },
            accessright: { "@classid": "OPEN" },
            webresource: { url: "http://hdl.handle.net/1/2" },
          },
        ]),
      ),
    );
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "none" });
    stub(json({}, 500));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "failed" });
  });
});

describe("Zenodo", () => {
  const publication = { resource_type: { type: "publication" } };
  const same = (relation: string) => ({
    related_identifiers: [{ identifier: "https://doi.org/10.1111/BJH.17863", relation }],
  });

  it("keeps only a publication record that IS the article — its own DOI, or related as identical / a version — open with listed files = a file", async () => {
    const fetch = stub(
      json({
        hits: {
          hits: [
            {
              id: 123456,
              metadata: {
                access_right: "open",
                publication_date: "2024-03-01",
                ...publication,
                ...same("isIdenticalTo"),
              },
              files: [{ key: "manuscript.pdf" }],
              links: { self_html: "https://zenodo.org/records/123456" },
            },
            {
              id: "7",
              metadata: { access_right: "restricted", doi: "10.1111/BJH.17863", ...publication },
            },
            {
              id: 8,
              metadata: { access_right: "open", ...publication, ...same("isVersionOf") },
              files: [],
            },
            {
              id: 9,
              metadata: {
                access_right: "open",
                resource_type: { type: "dataset" },
                ...same("isSupplementTo"),
              },
              files: [{ key: "data.csv" }],
            },
            {
              id: 10,
              metadata: { access_right: "open", ...publication, ...same("cites") },
              files: [{ key: "x" }],
            },
            {
              id: 11,
              metadata: { access_right: "open", ...publication, ...same("isIdenticalTo") },
            },
            {
              id: "abc",
              metadata: { access_right: "open", ...publication, ...same("isIdenticalTo") },
            },
          ],
        },
      }),
    );
    expect(await lookupZenodoCopy("10.1111/BJH.17863")).toEqual({
      status: "found",
      copies: [
        {
          source: "zenodo",
          id: "123456",
          url: "https://zenodo.org/records/123456",
          hasFile: true,
          name: "Zenodo",
          recorded: "2024-03-01",
        },
        {
          source: "zenodo",
          id: "7",
          url: "https://zenodo.org/records/7",
          hasFile: false,
          name: "Zenodo",
          recorded: undefined,
        },
        {
          source: "zenodo",
          id: "8",
          url: "https://zenodo.org/records/8",
          hasFile: false,
          name: "Zenodo",
          recorded: undefined,
        },
        {
          source: "zenodo",
          id: "11",
          url: "https://zenodo.org/records/11",
          hasFile: false,
          name: "Zenodo",
          recorded: undefined,
        },
      ],
    });
    const url = new URL(fetch.mock.calls[0]![0] as string);
    expect(url.searchParams.get("q")).toBe(
      'related.identifier:"10.1111/bjh.17863" OR doi:"10.1111/bjh.17863"',
    );
  });

  it("answers none for a dataset alone, failed on a 429 or a shapeless body", async () => {
    stub(
      json({
        hits: {
          hits: [
            {
              id: 9,
              metadata: {
                access_right: "open",
                resource_type: { type: "dataset" },
                ...same("isSupplementTo"),
              },
            },
          ],
        },
      }),
    );
    expect(await lookupZenodoCopy(DOI)).toEqual({ status: "none" });
    stub(json({}, 429));
    expect(await lookupZenodoCopy(DOI)).toEqual({ status: "failed" });
    stub(json({ hits: { hits: "nope" } }));
    expect(await lookupZenodoCopy(DOI)).toEqual({ status: "failed" });
    stub(json({ hits: { hits: [] } }));
    expect(await lookupZenodoCopy(DOI)).toEqual({ status: "none" });
  });

  it("caps what it keeps", () => {
    expect(COPY_LIMITS.perSource).toBe(3);
  });
});
