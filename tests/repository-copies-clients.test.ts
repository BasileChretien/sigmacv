import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupEuropePmcCopy } from "@/lib/repositoryCopies/europepmc";
import { lookupHalCopy } from "@/lib/repositoryCopies/hal";
import { lookupOpenaireCopy } from "@/lib/repositoryCopies/openaire";
import { bareDoi, COPY_LIMITS, isoDate } from "@/lib/repositoryCopies/shared";

/**
 * The three repository clients: one DOI → the copies the worklist prints, or an
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

describe("OpenAIRE (Graph API)", () => {
  const product = (over: Record<string, unknown>) => ({
    id: "doi_dedup___::488a8e8dabcbd74433b55b7f51a5b33e",
    isGreen: true,
    bestAccessRight: { label: "OPEN" },
    publicationDate: "2021-10-05",
    instances: [
      { urls: ["https://doi.org/10.1111/bjh.17863"] },
      { urls: ["https://pubmed.ncbi.nlm.nih.gov/34611896"] },
      { urls: ["http://hdl.handle.net/1/2", "https://hal.science/hal-03474586v1"] },
    ],
    ...over,
  });
  const answer = (results: unknown[]) => json({ header: { numFound: results.length }, results });

  it("takes OpenAIRE's own verdict — a green record is a copy with a file — pointed at the OpenAIRE record page (the instances mix the publisher's PDF with the repository's), and sends the token", async () => {
    const fetch = stub(
      answer([
        product({
          instances: [
            { urls: ["https://onlinelibrary.wiley.com/doi/pdfdirect/10.1111/bjh.17863"] },
            { urls: ["https://hal.science/hal-03474586v1"] },
          ],
        }),
      ]),
    );
    expect(await lookupOpenaireCopy(DOI, "ci@example.org", 8000, "tok-123")).toEqual({
      status: "found",
      copies: [
        {
          source: "openaire",
          id: "doi_dedup___::488a8e8dabcbd74433b55b7f51a5b33e",
          url: "https://explore.openaire.eu/search/result?id=doi_dedup___%3A%3A488a8e8dabcbd74433b55b7f51a5b33e",
          hasFile: true,
          name: "OpenAIRE",
          recorded: "2021-10-05",
        },
      ],
    });
    const url = new URL(fetch.mock.calls[0]![0] as string);
    expect(url.origin + url.pathname).toBe("https://api.openaire.eu/graph/v1/researchProducts");
    expect(url.searchParams.get("pid")).toBe("10.1111/bjh.17863");
    const init = fetch.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-123");
  });

  it("sends no token when none is held", async () => {
    const fetch = stub(answer([product({})]));
    expect((await lookupOpenaireCopy(DOI)).status).toBe("found");
    const init = fetch.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("answers none for a record that is not green (a journal page is not a repository) or unknown, failed on a 404, a 500 or a shapeless body", async () => {
    stub(answer([product({ isGreen: false })]));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "none" });
    stub(answer([product({ bestAccessRight: { label: "CLOSED" } })]));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "none" });
    stub(answer([]));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "none" });
    stub(json({}, 404));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "failed" });
    stub(json({}, 500));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "failed" });
    stub(json({ results: "nope" }));
    expect(await lookupOpenaireCopy(DOI)).toEqual({ status: "failed" });
    expect(await lookupOpenaireCopy("junk")).toEqual({ status: "none" });
  });
});

it("caps what each source keeps", () => {
  expect(COPY_LIMITS.perSource).toBe(3);
});
