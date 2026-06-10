import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderBibliography } from "@/lib/citeproc/engine";
import { renderCvHtml } from "@/lib/render/html";
import { externalizeLinks } from "@/lib/render/templates/shared";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import type { CslItem } from "@/types/csl";
import worksFixture from "./fixtures/openalex-works.json";

const hasApa = listAvailableStyles().includes("apa");

const itemWithDoi: CslItem = {
  id: "x1",
  type: "article-journal",
  title: "A study of things",
  author: [{ family: "Doe", given: "Jane" }],
  "container-title": "Journal of Things",
  issued: { "date-parts": [[2021, 5, 1]] },
  DOI: "10.1234/abcd.5678",
  URL: "https://example.org/article/123",
} as CslItem;

describe("externalizeLinks", () => {
  it("appends target + rel to a bare anchor", () => {
    const out = externalizeLinks('<a href="https://doi.org/10.1/x">10.1/x</a>');
    expect(out).toBe(
      '<a href="https://doi.org/10.1/x" target="_blank" rel="noopener noreferrer">10.1/x</a>',
    );
  });

  it("preserves an existing rel (e.g. license) and never doubles it", () => {
    const out = externalizeLinks('<a href="https://x" rel="license">CC BY 4.0</a>');
    expect(out).toContain('rel="license"');
    expect(out).toContain('target="_blank"');
    expect(out.match(/rel=/g)).toHaveLength(1);
  });

  it("preserves an existing target and never doubles it", () => {
    const out = externalizeLinks('<a target="_self" href="https://x">y</a>');
    expect(out.match(/target=/g)).toHaveLength(1);
    expect(out).toContain('target="_self"');
    // rel is still added (it was absent)
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it("appends at the end of the tag, preserving the attribute prefix", () => {
    const out = externalizeLinks(
      '<a class="cv-ror-link" href="https://ror.org/04chrp450" title="ROR">Org</a>',
    );
    expect(
      out.startsWith('<a class="cv-ror-link" href="https://ror.org/04chrp450" title="ROR"'),
    ).toBe(true);
    expect(out).toContain('target="_blank"');
  });

  it("never matches closing tags or CSS selectors", () => {
    const css = "ol.cv-bib > li a { color: red; }";
    expect(externalizeLinks(css)).toBe(css);
    expect(externalizeLinks("text</a>more")).toBe("text</a>more");
  });
});

describe.skipIf(!hasApa)("citeproc HTML output (needs vendored CSL assets)", () => {
  it("wraps DOIs/URLs in <a> anchors for HTML output", () => {
    const [entry] = renderBibliography([itemWithDoi], "apa", "en-US", "html");
    expect(entry?.content).toContain('<a href="https://doi.org/10.1234/abcd.5678"');
  });

  it("leaves the plain-text output free of markup", () => {
    const [entry] = renderBibliography([itemWithDoi], "apa", "en-US", "text");
    expect(entry?.content).not.toContain("<a ");
    expect(entry?.content).toContain("doi.org/10.1234/abcd.5678");
  });
});

describe.skipIf(!hasApa)("renderCvHtml link behaviour (needs vendored CSL assets)", () => {
  const works = worksFixture as unknown as OpenAlexWork[];
  const resolved: ResolvedAuthor = {
    orcid: "0000-0002-7483-2489",
    authorIds: ["A5001069481", "A5136414971"],
    displayName: "Basile Chrétien",
  };
  const cv = buildCanonicalCv({
    id: "cv_links",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
  });

  it("makes publication DOI links clickable and open in a new tab", () => {
    const html = renderCvHtml(cv);
    expect(html).toMatch(
      /<a href="https:\/\/doi\.org\/10\.1000\/example1" target="_blank" rel="noopener noreferrer"/,
    );
  });

  it("makes the ORCID id link open in a new tab too", () => {
    const html = renderCvHtml(cv);
    expect(html).toMatch(
      /<a href="https:\/\/orcid\.org\/0000-0002-7483-2489" target="_blank" rel="noopener noreferrer"/,
    );
  });
});
