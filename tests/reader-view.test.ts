import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  READER_VIEW_KEEP,
  isReaderViewRequested,
  readerViewActive,
  readerViewBannerHtml,
  readerViewCv,
  readerViewHeadTags,
  readerViewLinkHtml,
} from "@/lib/cv/readerView";
import { parseViewFilters, viewFilterBarHtml, viewFilterQuery } from "@/lib/cv/viewFilter";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, year: number, oa: boolean): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type: "article",
    publication_year: year,
    authorships: [{ author: { id: SELF, display_name: "B" }, raw_author_name: "B" }],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
    open_access: { is_oa: oa, oa_status: oa ? "gold" : "closed" },
  } as unknown as OpenAlexWork;
}

function makeCv(allow: boolean): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "rv",
    resolved,
    works: [work("W1", 2025, true), work("W2", 2019, false), work("W3", 2014, true)],
    now: "2026-06-02T00:00:00.000Z",
  });
  return { ...cv, display: { ...cv.display, allowReaderMode: allow } };
}

const params = (q: string) => new URL(`https://sigmacv.test/p/abc${q}`).searchParams;

describe("reader view request + gate", () => {
  it("recognises exactly ?view=reader", () => {
    expect(isReaderViewRequested(params("?view=reader"))).toBe(true);
    expect(isReaderViewRequested(params("?view=reader&since=2020"))).toBe(true);
    expect(isReaderViewRequested(params(""))).toBe(false);
    expect(isReaderViewRequested(params("?view=READER"))).toBe(false);
    expect(isReaderViewRequested(params("?view=print"))).toBe(false);
    expect(isReaderViewRequested(params("?reader=1"))).toBe(false);
  });

  it("serves the view only when requested AND the owner opted in (fails closed)", () => {
    expect(readerViewActive(params("?view=reader"), makeCv(true))).toBe(true);
    expect(readerViewActive(params("?view=reader"), makeCv(false))).toBe(false);
    expect(readerViewActive(params(""), makeCv(true))).toBe(false);
    // A CV whose display predates the flag (undefined) is treated as off.
    const legacy = makeCv(true);
    const { allowReaderMode: _drop, ...rest } = legacy.display;
    expect(
      readerViewActive(params("?view=reader"), {
        ...legacy,
        display: rest as CanonicalCv["display"],
      }),
    ).toBe(false);
  });
});

describe("readerViewCv", () => {
  it("returns a new CV with the reader-mode preset applied, leaving the input untouched", () => {
    const cv = makeCv(true);
    const before = structuredClone(cv);
    const out = readerViewCv(cv);
    expect(out).not.toBe(cv);
    expect(cv).toEqual(before);
    expect(out.display.showProvenance).toBe(true);
    expect(out.display.showOpenAccess).toBe(true);
    expect(out.display.hideRetracted).toBe(false);
    expect(out.display.showMetrics).toBe(cv.display.showMetrics);
    expect(out.sections).toBe(cv.sections);
    expect(out.owner).toBe(cv.owner);
  });
});

describe("reader view chrome", () => {
  it("links to ?view=reader from the standard page, preserving active filters", () => {
    const html = readerViewLinkHtml(parseViewFilters(params("?since=2020&oa=1")), "en-US");
    expect(html).toMatch(/^<nav class="cv-readerbar"/);
    expect(html).toContain('href="?since=2020&amp;oa=1&amp;view=reader"');
    expect(html).toContain(">Reader view</a>");
    expect(html).toContain('title="Show the provenance, verification and context signals');
    // No filters → just the view param.
    expect(readerViewLinkHtml(parseViewFilters(params("")), "en-US")).toContain(
      'href="?view=reader"',
    );
  });

  it("renders the banner with the score disclaimer and a back link that drops only the view param", () => {
    const html = readerViewBannerHtml(
      parseViewFilters(params("?type=article&view=reader")),
      "en-US",
    );
    expect(html).toMatch(/^<aside class="cv-readerbanner" role="note">/);
    expect(html).toContain("Nothing here is a score.");
    expect(html).toContain('<a href="?type=article">Back to the standard page</a>');
    // Unfiltered → "?" (clears every param, the same convention as the filter chips).
    expect(readerViewBannerHtml(parseViewFilters(params("?view=reader")), "en-US")).toContain(
      '<a href="?">',
    );
  });

  it("localizes the chrome", () => {
    expect(readerViewLinkHtml(parseViewFilters(params("")), "fr-FR")).toContain("Vue évaluateur");
    expect(readerViewBannerHtml(parseViewFilters(params("")), "ja-JP")).toContain("審査者ビュー");
  });

  it("emits a noindex robots meta for the reader view head", () => {
    expect(readerViewHeadTags()).toBe('<meta name="robots" content="noindex, nofollow" />');
  });
});

describe("viewFilterQuery / viewFilterBarHtml `keep`", () => {
  it("carries extra params through the serialized query, after the filter params", () => {
    const f = parseViewFilters(params("?since=2020"));
    expect(viewFilterQuery(f)).toBe("?since=2020");
    expect(viewFilterQuery(f, READER_VIEW_KEEP)).toBe("?since=2020&view=reader");
    expect(viewFilterQuery(parseViewFilters(params("")), READER_VIEW_KEEP)).toBe("?view=reader");
    expect(viewFilterQuery(parseViewFilters(params("")))).toBe("?");
  });

  it("keeps view=reader on every facet chip so a facet never drops the reader view", () => {
    const cv = makeCv(true);
    const f = parseViewFilters(params("?view=reader"));
    const bar = viewFilterBarHtml(cv, f, "en-US", READER_VIEW_KEEP);
    const hrefs = [...bar.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(2);
    for (const h of hrefs) expect(h).toContain("view=reader");
    // Without `keep` the chips are unchanged (the standard page's bar).
    const plain = viewFilterBarHtml(cv, f, "en-US");
    expect(plain).not.toContain("view=reader");
  });
});
