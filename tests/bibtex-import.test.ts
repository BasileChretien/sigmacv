import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { importBibtexIntoCv } from "@/lib/import/bibtex";
import type { CanonicalCv } from "@/lib/canonical/schema";

function baseCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "cv1",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Test User" },
    works: [],
    now: "2026-01-01T00:00:00.000Z",
  });
}

function pubs(cv: CanonicalCv) {
  return cv.sections.find((s) => s.type === "publications")?.items ?? [];
}
function preprints(cv: CanonicalCv) {
  return cv.sections.find((s) => s.type === "preprints")?.items ?? [];
}

describe("importBibtexIntoCv", () => {
  it("imports @article / @inproceedings / @book with correct CSL types", () => {
    const bib = `
      @article{a2023, title={An Article}, author={Smith, Jane and Doe, John}, journal={J Ex}, year={2023}, volume={4}, number={2}, pages={1--9}, doi={10.1/a}}
      @inproceedings{c2021, title={A Talk}, author={Lee, Kim}, booktitle={Proc ICEX}, year={2021}}
      @book{b2019, title={A Book}, author={Brown, Pat}, publisher={Uni Press}, year={2019}}
    `;
    const out = importBibtexIntoCv(baseCv(), bib);
    expect(out.parsed).toBe(3);
    expect(out.added).toBe(3);
    expect(out.duplicates).toBe(0);
    expect(out.skipped).toBe(0);

    const items = pubs(out.cv);
    const byType = Object.fromEntries(items.map((i) => [i.csl?.title, i.csl?.type]));
    expect(byType["An Article"]).toBe("article-journal"); // @article -> article-journal
    expect(byType["A Talk"]).toBe("paper-conference");
    expect(byType["A Book"]).toBe("book");

    const article = items.find((i) => i.csl?.title === "An Article")!;
    expect(article.source).toBe("bibtex");
    expect(article.authoredBySelf).toBe(true); // user-asserted ownership
    expect(article.selfNameVariants).toEqual([]); // never name-matched
    expect(article.meta.claimed).toBe(true);
    expect(article.meta.matchBasis).toBe("claimed");
    expect(article.meta.year).toBe(2023);
    expect(article.meta.doi).toBe("10.1/a");
    expect(article.csl?.issued?.["date-parts"]).toEqual([[2023]]); // no empty month/day
    expect(article.csl?.author).toHaveLength(2);
  });

  it("maps editors, ISSN, and a book chapter", () => {
    const bib = `@incollection{c, title={A Chapter}, author={Wu, A}, editor={Ng, B and Ali, C}, booktitle={A Book}, publisher={P}, year={2022}, issn={1234-5678}}`;
    const out = importBibtexIntoCv(baseCv(), bib);
    expect(out.added).toBe(1);
    const item = pubs(out.cv).find((i) => i.csl?.title === "A Chapter")!;
    expect(item.csl?.type).toBe("chapter");
    expect(item.csl?.editor).toHaveLength(2);
    expect(item.csl?.ISSN).toBe("1234-5678");
    expect(item.csl?.["container-title"]).toBe("A Book");
  });

  it("skips works already in the CV (DOI dedup) on re-import", () => {
    const bib = `@article{a, title={A}, author={X, Y}, journal={J}, year={2020}, doi={10.1/DUP}}`;
    const first = importBibtexIntoCv(baseCv(), bib);
    expect(first.added).toBe(1);
    // Re-import the same entry (DOI case-insensitive) into the resulting CV.
    const again = importBibtexIntoCv(
      first.cv,
      `@article{a, title={A}, doi={10.1/dup}, year={2020}}`,
    );
    expect(again.added).toBe(0);
    expect(again.duplicates).toBe(1);
  });

  it("dedups two entries sharing a DOI within one file", () => {
    const bib = `
      @article{one, title={First}, year={2020}, doi={10.5/x}}
      @article{two, title={Second copy}, year={2021}, doi={10.5/x}}
    `;
    const out = importBibtexIntoCv(baseCv(), bib);
    expect(out.added).toBe(1);
    expect(out.duplicates).toBe(1);
  });

  it("routes a preprint (by venue) into the Preprints section", () => {
    const bib = `@article{p, title={A Preprint}, journal={arXiv}, year={2024}, doi={10.9/pp}}`;
    const out = importBibtexIntoCv(baseCv(), bib);
    expect(out.added).toBe(1);
    expect(preprints(out.cv).some((i) => i.csl?.title === "A Preprint")).toBe(true);
    expect(pubs(out.cv).some((i) => i.csl?.title === "A Preprint")).toBe(false);
  });

  it("skips an entry with no usable title", () => {
    const out = importBibtexIntoCv(baseCv(), `@misc{x, author={No, Title}, year={2020}}`);
    expect(out.added).toBe(0);
    expect(out.skipped).toBe(1);
  });

  it("is resilient to a malformed entry (falls back to per-entry parsing)", () => {
    // The unclosed brace makes the whole-file grammar parse throw; the split
    // fallback still recovers the leading valid entry.
    const bib = `@article{a,title={A},year={2020},doi={10.1/ok}}\n@article{bad, title = {unclosed \n@book{b,title={B},year={2021}}`;
    const out = importBibtexIntoCv(baseCv(), bib);
    expect(out.added).toBeGreaterThanOrEqual(1);
    expect(pubs(out.cv).some((i) => i.csl?.title === "A")).toBe(true);
    expect(out.skipped).toBeGreaterThanOrEqual(1);
  });

  it("handles non-BibTeX / empty input without throwing", () => {
    expect(importBibtexIntoCv(baseCv(), "just some prose, not bibtex").added).toBe(0);
    expect(importBibtexIntoCv(baseCv(), "").added).toBe(0);
  });
});
