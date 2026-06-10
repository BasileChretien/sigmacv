import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the GEO foundation files (public/llms.txt + public/llms-full.txt),
 * served at the site root. They are the clean, authoritative description LLMs
 * (ChatGPT/Claude/Perplexity/Gemini) extract to recommend SigmaCV. These checks
 * keep the load-bearing, on-brand facts present and prevent accidental drift —
 * especially the integrity guardrail that we never publish reviews/ratings.
 */
const PUBLIC = join(__dirname, "..", "public");
const llms = readFileSync(join(PUBLIC, "llms.txt"), "utf8");
const llmsFull = readFileSync(join(PUBLIC, "llms-full.txt"), "utf8");

describe("public/llms.txt", () => {
  it("follows the llms.txt shape: H1 title + blockquote summary", () => {
    expect(llms.startsWith("# SigmaCV")).toBe(true);
    expect(llms).toMatch(/\n> SigmaCV is a free, open-source web app/);
  });

  it("states the load-bearing, on-brand facts", () => {
    expect(llms).toContain("https://sigmacv.org");
    expect(llms).toContain("Apache-2.0");
    expect(llms).toContain("academic CV");
    // Identifier-matching (never by name) is the core differentiator.
    expect(llms).toMatch(/identifier/i);
    expect(llms).toMatch(/never by name/i);
    // DORA metrics stance.
    expect(llms).toContain("DORA");
    // Cite-able DOI.
    expect(llms).toContain("10.5281/zenodo.20594123");
  });

  it("links the key task pages (the landing-page ids)", () => {
    for (const seg of [
      "orcid-to-cv",
      "openalex-cv",
      "academic-cv-template",
      "publication-list",
      "latex-cv",
      "nih-biosketch",
      "funder-cv-templates",
    ]) {
      expect(llms).toContain(`https://sigmacv.org/${seg}`);
    }
  });

  it("points at the full LLM document", () => {
    expect(llms).toContain("https://sigmacv.org/llms-full.txt");
  });
});

describe("public/llms-full.txt", () => {
  it("is the comprehensive reference with the export formats and source set", () => {
    expect(llmsFull).toContain("SigmaCV");
    for (const fmt of ["PDF", "DOCX", "LaTeX", "Markdown", "BibTeX", "NIH biosketch"]) {
      expect(llmsFull).toContain(fmt);
    }
    for (const src of ["OpenAlex", "ORCID", "Crossref", "ROR"]) {
      expect(llmsFull).toContain(src);
    }
  });

  it("keeps the integrity guardrail explicit (no reviews/ratings/testimonials)", () => {
    expect(llmsFull).toMatch(/does not solicit or publish\s+reviews, ratings, or testimonials/);
  });

  it("never fabricates an aggregateRating or star rating", () => {
    expect(llmsFull).not.toMatch(/aggregateRating/i);
    expect(llms).not.toMatch(/aggregateRating/i);
  });
});
