import { describe, expect, it } from "vitest";
import { buildCanonicalCv, workOaUrl } from "@/lib/canonical/build";
import { reconstructAbstract } from "@/lib/openalex/toCsl";
import { buildRenderedSections, renderCvHtml } from "@/lib/render/html";
import { attributionFooter } from "@/lib/render/templates/shared";
import { publicMetaTags } from "@/lib/cv/publicMeta";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const hasApa = listAvailableStyles().includes("apa");
const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    doi: "https://doi.org/10.1/abc",
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type: "article",
    publication_year: 2024,
    authorships: [{ author: { id: SELF, display_name: "B" }, raw_author_name: "B" }],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
    open_access: { is_oa: true, oa_status: "gold", oa_url: "https://example.org/pdf/W1.pdf" },
    abstract_inverted_index: { This: [0], work: [1], matters: [2] },
  } as unknown as OpenAlexWork;
}

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "tools",
    resolved,
    works: [work("W1")],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("reconstructAbstract", () => {
  it("rebuilds plain text from the inverted index", () => {
    expect(reconstructAbstract({ The: [0], study: [1], works: [2] })).toBe("The study works");
  });
  it("returns undefined for absent / empty input", () => {
    expect(reconstructAbstract(null)).toBeUndefined();
    expect(reconstructAbstract({})).toBeUndefined();
  });
  it("ignores out-of-range / non-integer positions", () => {
    expect(reconstructAbstract({ ok: [0], bad: [-1, 1.5, 99999] })).toBe("ok");
  });
  it("strips stray markup tokens", () => {
    expect(reconstructAbstract({ "<jats:p>": [0], Body: [1] })).toBe("Body");
  });
  it("caps a very long abstract with an ellipsis", () => {
    const inv: Record<string, number[]> = {};
    for (let i = 0; i < 2000; i++) inv[`word${i}`] = [i];
    const out = reconstructAbstract(inv)!;
    expect(out.length).toBeLessThanOrEqual(5001);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("workOaUrl", () => {
  const base = (over: Record<string, unknown>): OpenAlexWork =>
    ({ id: "https://openalex.org/W", open_access: over }) as unknown as OpenAlexWork;
  it("returns the OA url for an open work", () => {
    expect(workOaUrl(base({ is_oa: true, oa_url: "https://x.org/a.pdf" }))).toBe(
      "https://x.org/a.pdf",
    );
  });
  it("returns undefined for a closed work, a missing url, or a bad scheme", () => {
    expect(workOaUrl(base({ is_oa: false, oa_url: "https://x.org/a.pdf" }))).toBeUndefined();
    expect(workOaUrl(base({ is_oa: true }))).toBeUndefined();
    expect(workOaUrl(base({ is_oa: true, oa_url: "ftp://x.org/a" }))).toBeUndefined();
  });
});

describe("build stores oaUrl + abstract", () => {
  it("maps the OA url and reconstructed abstract onto the item", () => {
    const item = makeCv().sections.find((s) => s.type === "publications")!.items[0]!;
    expect(item.meta.oaUrl).toBe("https://example.org/pdf/W1.pdf");
    expect(item.csl?.abstract).toBe("This work matters");
  });
});

describe.skipIf(!hasApa)("per-publication tools (publicExtras)", () => {
  it("appends a Cite/Full-text/Abstract affordance on the public page only", () => {
    const cv = makeCv();
    const withTools = buildRenderedSections(cv, { publicExtras: true, slug: "abc" }).find(
      (s) => s.section.type === "publications",
    )!.items[0]!.html;
    expect(withTools).toContain('class="cv-itemtools"');
    // COinS metadata span for reference-manager (Zotero) multi-item detection.
    expect(withTools).toContain('class="Z3988"');
    expect(withTools).toContain('class="cv-cite"');
    expect(withTools).toContain("/p/abc/cite?id=W1");
    expect(withTools).toContain("format=bibtex");
    expect(withTools).toContain("format=ris");
    expect(withTools).toContain("cv-fulltext");
    expect(withTools).toContain("cv-abstract");
    expect(withTools).toContain("This work matters");

    // The export path (no publicExtras) is clean. (The class selector lives in
    // commonCss, so assert on the rendered markup form.)
    const clean = buildRenderedSections(cv).find((s) => s.section.type === "publications")!
      .items[0]!.html;
    expect(clean).not.toContain("cv-itemtools");
    expect(renderCvHtml(cv)).not.toContain('class="cv-itemtools"');
  });
});

describe.skipIf(!hasApa)("per-publication PubMed link (publicExtras)", () => {
  const pmWork = () =>
    ({
      ...work("W1"),
      ids: { pmid: "https://pubmed.ncbi.nlm.nih.gov/39123456" },
    }) as unknown as OpenAlexWork;
  const pubHtml = (cv: CanonicalCv): string =>
    buildRenderedSections(cv, { publicExtras: true, slug: "abc" }).find(
      (s) => s.section.type === "publications",
    )!.items[0]!.html;

  it("links to PubMed when the work carries a numeric PubMed id", () => {
    const cv = buildCanonicalCv({
      id: "pm",
      resolved,
      works: [pmWork()],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(cv.sections.find((s) => s.type === "publications")!.items[0]!.meta.pmid).toBe(
      "39123456",
    );
    expect(pubHtml(cv)).toContain(
      'class="cv-pubmed" href="https://pubmed.ncbi.nlm.nih.gov/39123456/"',
    );
  });

  it("omits the link with no id, and the numeric guard rejects a non-numeric stored id", () => {
    // W1 has no ids.pmid → no link.
    expect(pubHtml(makeCv())).not.toContain("cv-pubmed");

    // Defensive: a hand-edited / stored non-numeric pmid never yields a link.
    const base = buildCanonicalCv({
      id: "bad",
      resolved,
      works: [pmWork()],
      now: "2026-06-02T00:00:00.000Z",
    });
    const bad: CanonicalCv = {
      ...base,
      sections: base.sections.map((sec) =>
        sec.type === "publications"
          ? {
              ...sec,
              items: sec.items.map((it, i) =>
                i === 0 ? { ...it, meta: { ...it.meta, pmid: "39; DROP" } } : it,
              ),
            }
          : sec,
      ),
    };
    expect(pubHtml(bad)).not.toContain("cv-pubmed");
  });
});

describe("attributionFooter subscribe affordance", () => {
  it("renders a no-JS disclosure revealing the feed URL, only with a feed href", () => {
    const cv = makeCv();
    const withFeed = attributionFooter(cv, { attribution: true, feedHref: "/p/abc/feed.xml" });
    // A <details> disclosure (not a bare link that navigates to raw XML).
    expect(withFeed).toContain('<details class="cv-subscribe">');
    expect(withFeed).toContain("<summary>");
    expect(withFeed).toContain("cv-subscribe-how"); // the explanatory hint container
    // The feed URL is both a link and shown as copyable text.
    expect(withFeed).toContain('class="cv-subscribe-url" href="/p/abc/feed.xml"');
    expect(withFeed).toContain(">/p/abc/feed.xml</a>");

    const without = attributionFooter(cv, { attribution: true });
    expect(without).not.toContain("cv-subscribe");
  });
});

describe("publicMetaTags feed link", () => {
  it("emits an Atom alternate link when feedUrl is given", () => {
    const cv = makeCv();
    const tags = publicMetaTags(cv, { feedUrl: "https://sigmacv.org/p/abc/feed.xml" });
    expect(tags).toContain('rel="alternate" type="application/atom+xml"');
    expect(tags).toContain("https://sigmacv.org/p/abc/feed.xml");
    expect(publicMetaTags(cv, {})).not.toContain("application/atom+xml");
  });
});
