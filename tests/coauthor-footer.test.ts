import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { coauthorLinksFooter } from "@/lib/render/templates/shared";
import { renderPublicCvHtml } from "@/lib/render/publicStyles";
import { renderCvHtml } from "@/lib/render/html";
import type { CanonicalCv } from "@/lib/canonical/schema";

const LINKS = [
  { orcid: "0000-0001-2345-6789", slug: "jane-x", name: "Jane Coauthor" },
  { orcid: "0000-0003-1111-2222", slug: "bob-y", name: "Bob <b>Smith</b>" },
];

function cv(showCoauthorLinks: boolean): CanonicalCv {
  const base = buildCanonicalCv({
    id: "o",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Owner" },
    works: [],
    now: "2026-06-17T00:00:00.000Z",
  });
  return updateDisplay(base, { showCoauthorLinks });
}

describe("coauthorLinksFooter", () => {
  it("renders the heading + first-party links when opted in and links present", () => {
    const html = coauthorLinksFooter(cv(true), { coauthorCvs: LINKS });
    expect(html).toContain("Co-authors on SigmaCV");
    expect(html).toContain('href="/p/jane-x"');
    expect(html).toContain("Jane Coauthor");
  });

  it("escapes co-author names (no raw HTML injection)", () => {
    const html = coauthorLinksFooter(cv(true), { coauthorCvs: LINKS });
    expect(html).not.toContain("<b>Smith</b>");
    expect(html).toContain("Bob &lt;b&gt;Smith&lt;/b&gt;");
  });

  it("is empty when the owner has not opted in (default off)", () => {
    expect(coauthorLinksFooter(cv(false), { coauthorCvs: LINKS })).toBe("");
  });

  it("is empty when there are no resolved links", () => {
    expect(coauthorLinksFooter(cv(true), { coauthorCvs: [] })).toBe("");
    expect(coauthorLinksFooter(cv(true), {})).toBe("");
  });
});

describe("public render integration", () => {
  it("includes the co-author block on the default public page when opted in", () => {
    const html = renderPublicCvHtml(cv(true), { attribution: true, coauthorCvs: LINKS });
    // Assert on the rendered ELEMENT, not the bare class (the .cv-coauthors CSS
    // rule is in the stylesheet of every render, blocks present or not).
    expect(html).toContain('class="cv-coauthors"');
    expect(html).toContain('href="/p/jane-x"');
  });

  it("includes the block in an animated public style too", () => {
    const styled = updateDisplay(cv(true), { publicStyle: "prism" });
    const html = renderPublicCvHtml(styled, { attribution: true, coauthorCvs: LINKS });
    expect(html).toContain('class="cv-coauthors"');
  });

  it("never includes the block in an export (renderCvHtml, no coauthorCvs opt)", () => {
    expect(renderCvHtml(cv(true))).not.toContain('class="cv-coauthors"');
  });
});
