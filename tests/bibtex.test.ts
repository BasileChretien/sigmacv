import { describe, expect, it } from "vitest";
import { cslItemsToBibtex } from "@/lib/render/bibtex";
import type { CslItem } from "@/types/csl";

const article: CslItem = {
  id: "W1",
  type: "article-journal",
  title: "A study of adverse drug reactions",
  author: [
    { family: "Chrétien", given: "Basile" },
    { family: "Dolladille", given: "Charles" },
  ],
  "container-title": "British Journal of Clinical Pharmacology",
  issued: { "date-parts": [[2023]] },
  volume: "89",
  issue: "5",
  page: "1500-1510",
  DOI: "10.1000/example1",
};

const chapter: CslItem = {
  id: "W2",
  type: "chapter",
  title: "The handbook chapter",
  author: [{ literal: "World Health Organization" }],
  "container-title": "Big Handbook of Things",
  issued: { "date-parts": [[2021]] },
  publisher: "Elsevier",
};

const preprint: CslItem = {
  id: "W3",
  type: "posted-content",
  title: "On the preprint",
  // family-only author (no given name) exercises the "family || given" path
  author: [{ family: "Mononym" }],
  issued: { "date-parts": [[2023]] },
  URL: "https://example.org/p",
};

// Collides with `article`'s key (same first author + year + first title word).
const articleDup: CslItem = {
  id: "W4",
  type: "article-journal",
  title: "A study of something else entirely",
  author: [{ family: "Chrétien", given: "Basile" }],
  issued: { "date-parts": [[2023]] },
  "container-title": "Another Journal",
};

const bare: CslItem = { id: "W5", type: "dataset" }; // no author, title, year

describe("cslItemsToBibtex", () => {
  it("maps an article: @article, journal, doi, double-braced title, en-dash pages", () => {
    const bib = cslItemsToBibtex([article]);
    expect(bib).toContain("@article{chretien2023study,");
    expect(bib).toContain("author = {Chrétien, Basile and Dolladille, Charles}");
    expect(bib).toContain("title = {{A study of adverse drug reactions}}");
    expect(bib).toContain("journal = {British Journal of Clinical Pharmacology}");
    expect(bib).toContain("volume = {89}");
    expect(bib).toContain("number = {5}");
    expect(bib).toContain("pages = {1500--1510}"); // normalised to en-dash range
    expect(bib).toContain("doi = {10.1000/example1}");
    expect(bib.endsWith("\n")).toBe(true);
  });

  it("maps a chapter to @incollection with booktitle + an organisation author", () => {
    const bib = cslItemsToBibtex([chapter]);
    expect(bib).toContain("@incollection{");
    expect(bib).toContain("booktitle = {Big Handbook of Things}");
    expect(bib).toContain("author = {{World Health Organization}}"); // literal braced
    expect(bib).toContain("publisher = {Elsevier}");
  });

  it("maps a preprint to @misc with a literal url, no journal, family-only author", () => {
    const bib = cslItemsToBibtex([preprint]);
    expect(bib).toContain("@misc{");
    expect(bib).toContain("author = {Mononym}"); // family-only, no comma
    expect(bib).toContain("url = {https://example.org/p}");
    expect(bib).not.toContain("journal = {");
  });

  it("suffixes colliding cite keys with a, b, …", () => {
    const bib = cslItemsToBibtex([article, articleDup]);
    expect(bib).toContain("@article{chretien2023study,");
    expect(bib).toContain("@article{chretien2023studyb,");
  });

  it("handles a bare item: anon key, no crash, @misc", () => {
    const bib = cslItemsToBibtex([bare]);
    expect(bib).toContain("@misc{anon,");
  });

  it("returns an empty string for no items", () => {
    expect(cslItemsToBibtex([])).toBe("");
  });
});
