import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCrossrefDataLinks } from "@/lib/crossref/client";

const MAILTO = "ci@example.org";

function res(body: string, init?: { status?: number }): Response {
  const status = init?.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => body,
  } as unknown as Response;
}

const msg = (relation: unknown) => JSON.stringify({ status: "ok", message: { relation } });

afterEach(() => vi.unstubAllGlobals());

describe("fetchCrossrefDataLinks", () => {
  it("reads supplement / part / reference relations to data and code deposits", async () => {
    const f = vi.fn(async () =>
      res(
        msg({
          "is-supplemented-by": [
            // Any non-figshare DOI qualifies for a publisher-asserted supplement.
            { "id-type": "doi", id: "https://doi.org/10.1000/SUPP.1", "asserted-by": "subject" },
            { "id-type": "doi", id: "10.6084/m9.figshare.99" }, // figshare → dropped
            { "id-type": "issn", id: "1234-5678" }, // not a DOI/URL → dropped
            { "id-type": "doi" }, // no id → dropped
            "junk",
          ],
          "has-part": [
            { "id-type": "doi", id: "10.5281/zenodo.7" }, // Zenodo → kept
            { "id-type": "doi", id: "10.1000/chapter.2" }, // plain part → dropped (strict)
          ],
          references: [
            { "id-type": "uri", id: "https://github.com/org/repo" }, // code host → kept
            { "id-type": "url", id: "https://example.org/paper" }, // plain URL → dropped
            { "id-type": "doi", id: "10.5061/dryad.abc" }, // Dryad → kept
          ],
          "is-preprint-of": [{ "id-type": "doi", id: "10.5281/zenodo.8" }], // wrong key → ignored
        }),
      ),
    );
    vi.stubGlobal("fetch", f);
    const out = await fetchCrossrefDataLinks("10.1234/X", MAILTO);
    expect(out).toEqual([
      { id: "10.1000/supp.1", scheme: "doi" },
      { id: "10.5281/zenodo.7", scheme: "doi" },
      { id: "https://github.com/org/repo", scheme: "url", url: "https://github.com/org/repo" },
      { id: "10.5061/dryad.abc", scheme: "doi" },
    ]);
    const url = String((f.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/works/10.1234%2Fx?");
    expect(url).toContain("select=relation");
    expect(url).toContain(`mailto=${encodeURIComponent(MAILTO)}`);
  });

  it("returns [] when the record has no relation, or the keys are not arrays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ message: {} }))),
    );
    expect(await fetchCrossrefDataLinks("10.1234/x", MAILTO)).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(msg({ "is-supplemented-by": "nope", references: null }))),
    );
    expect(await fetchCrossrefDataLinks("10.1234/x", MAILTO)).toEqual([]);
  });

  it("fails soft on an HTTP error, malformed JSON, an over-cap body or a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("{}", { status: 404 })),
    );
    expect(await fetchCrossrefDataLinks("10.1234/x", MAILTO)).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("<html>")),
    );
    expect(await fetchCrossrefDataLinks("10.1234/x", MAILTO)).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("x".repeat(300_000))),
    );
    expect(await fetchCrossrefDataLinks("10.1234/x", MAILTO)).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await fetchCrossrefDataLinks("10.1234/x", MAILTO)).toEqual([]);
  });

  it("skips an invalid DOI without any request", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchCrossrefDataLinks("not-a-doi", MAILTO)).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});
