import { describe, expect, it } from "vitest";
import { highlightSelf } from "@/lib/citeproc/highlight";

describe("highlightSelf", () => {
  it("wraps a matching family name in a cv-self span", () => {
    const html = "Chrétien, B., & Dolladille, C. (2023). A study.";
    const out = highlightSelf(html, ["Chrétien", "Basile Chrétien"]);
    expect(out).toContain('<span class="cv-self">Chrétien</span>');
    // co-author untouched
    expect(out).toContain("Dolladille");
    expect(out).not.toContain('<span class="cv-self">Dolladille</span>');
  });

  it("does not match inside HTML tags or attributes", () => {
    const html = '<a href="https://doi.org/Smith">Smith, J. (2020).</a>';
    const out = highlightSelf(html, ["Smith"]);
    // The attribute value must remain intact…
    expect(out).toContain('href="https://doi.org/Smith"');
    // …while the visible text is highlighted.
    expect(out).toContain('<span class="cv-self">Smith</span>, J.');
  });

  it("prefers the longest variant when several overlap", () => {
    const html = "Basile Chrétien wrote this.";
    const out = highlightSelf(html, ["Chrétien", "Basile Chrétien"]);
    expect(out).toContain('<span class="cv-self">Basile Chrétien</span>');
  });

  it("escapes regex-special characters in hyphenated names", () => {
    const html = "Müller-Schmitt, A. (2021).";
    const out = highlightSelf(html, ["Müller-Schmitt"]);
    expect(out).toContain('<span class="cv-self">Müller-Schmitt</span>');
  });

  it("does not inject spans inside HTML comments", () => {
    const html = "<!-- Chrétien --> Chrétien, B. (2023).";
    const out = highlightSelf(html, ["Chrétien"]);
    expect(out).toContain("<!-- Chrétien -->"); // comment untouched
    expect(out).toContain('<span class="cv-self">Chrétien</span>, B.');
  });

  it("returns the input unchanged when there are no variants", () => {
    const html = "Nobody, A. (2019).";
    expect(highlightSelf(html, [])).toBe(html);
  });
});
