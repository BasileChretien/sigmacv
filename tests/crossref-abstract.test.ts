import { afterEach, describe, expect, it, vi } from "vitest";
import { crossrefAbstractText, fetchCrossrefAbstract } from "@/lib/crossref/client";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

function res(body: string, init?: { status?: number }): Response {
  const status = init?.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => body,
  } as unknown as Response;
}

const MAILTO = "ci@example.org";
afterEach(() => vi.unstubAllGlobals());

describe("crossrefAbstractText", () => {
  it("strips JATS tags and a leading Abstract heading", () => {
    expect(
      crossrefAbstractText("<jats:title>Abstract</jats:title><jats:p>Hello world.</jats:p>"),
    ).toBe("Hello world.");
  });

  it("decodes basic + numeric entities and collapses whitespace", () => {
    expect(crossrefAbstractText("<jats:p>A &amp; B,  &lt;x&gt;  &#956;g</jats:p>")).toBe(
      `A & B, <x> ${String.fromCodePoint(956)}g`, // &#956; → Greek small mu (U+03BC)
    );
  });

  it("caps a very long abstract with an ellipsis", () => {
    const out = crossrefAbstractText(`<jats:p>${"word ".repeat(2000)}</jats:p>`);
    expect(out.length).toBeLessThanOrEqual(5001);
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns '' for whitespace-only markup", () => {
    expect(crossrefAbstractText("<jats:p>   </jats:p>")).toBe("");
  });
});

describe("fetchCrossrefAbstract", () => {
  it("fetches and reduces the JATS abstract via select=abstract", async () => {
    const fetchMock = vi.fn(async (_url: URL | string) =>
      res(JSON.stringify({ message: { abstract: "<jats:p>Hi there.</jats:p>" } })),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchCrossrefAbstract("10.1000/abc", MAILTO)).toBe("Hi there.");
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("select=abstract");
    expect(url).toContain("mailto=ci%40example.org");
  });

  it("returns null when there is no abstract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ message: {} }))),
    );
    expect(await fetchCrossrefAbstract("10.1000/abc", MAILTO)).toBeNull();
  });

  it("returns null for a malformed DOI without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchCrossrefAbstract("not-a-doi", MAILTO)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails soft on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("", { status: 500 })),
    );
    expect(await fetchCrossrefAbstract("10.1000/abc", MAILTO)).toBeNull();
  });
});

describe("build persists a gap-filled abstract across re-sync", () => {
  const SELF = "https://openalex.org/A5001069481";
  const resolved: ResolvedAuthor = {
    orcid: "0000-0002-7483-2489",
    authorIds: ["A5001069481"],
    displayName: "B",
  };
  const work = (): OpenAlexWork =>
    ({
      id: "https://openalex.org/W1",
      doi: "https://doi.org/10.1/x",
      title: "T",
      display_name: "T",
      type: "article",
      publication_year: 2024,
      authorships: [{ author: { id: SELF, display_name: "B" }, raw_author_name: "B" }],
      primary_location: { source: { display_name: "J", type: "journal" } },
    }) as unknown as OpenAlexWork;

  function pubItem(cv: CanonicalCv, id: string) {
    return cv.sections.find((s) => s.type === "publications")?.items.find((i) => i.id === id);
  }

  it("carries the previous abstract when OpenAlex provides none (and OpenAlex wins when it does)", () => {
    const cv1 = buildCanonicalCv({ id: "a", resolved, works: [work()], now: "t0" });
    expect(pubItem(cv1, "W1")?.csl?.abstract).toBeUndefined(); // OpenAlex had none

    // Simulate a prior Crossref gap-fill, then re-sync with this as `previous`.
    const filled: CanonicalCv = {
      ...cv1,
      sections: cv1.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === "W1" ? { ...it, csl: { ...it.csl!, abstract: "Persisted abstract." } } : it,
        ),
      })),
    };
    const cv2 = buildCanonicalCv({
      id: "a",
      resolved,
      works: [work()],
      now: "t1",
      previous: filled,
    });
    expect(pubItem(cv2, "W1")?.csl?.abstract).toBe("Persisted abstract.");
  });
});
