import { describe, expect, it } from "vitest";
import { getExample } from "@/lib/examples/examples";
import { getGuide } from "@/lib/guides/guides";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { EXAMPLES_CHROME, examplesChrome, fillChrome } from "@/lib/i18n/examplesChrome";
import { localizeContentHref } from "@/lib/seo";

/**
 * The Fonds de recherche du Québec "CV descriptif" — the guide and the French
 * example. The FRQ's own headings (July 2025 FR instructions) are what an
 * applicant must reproduce, so they are held verbatim in every locale of the
 * guide and as the three section titles of the example.
 */
const FRQ_HEADINGS = [
  "Première section : Parcours et compétences de la personne candidate",
  "Deuxième section : Contributions et expériences les plus importantes",
  "Troisième section : Activités de supervision et de mentorat",
] as const;

describe("the CV-FRQ guide", () => {
  it("exists in every locale and quotes the FRQ's three headings verbatim", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const guide = getGuide("frq-narrative-cv", loc)!;
      expect(guide, loc).toBeDefined();
      const sectionsList = guide.blocks.find((b) => b.type === "ul")!;
      expect(sectionsList.type).toBe("ul");
      if (sectionsList.type !== "ul") return;
      expect(sectionsList.items).toHaveLength(3);
      FRQ_HEADINGS.forEach((heading, i) => {
        expect(sectionsList.items[i], `${loc} heading ${i + 1}`).toContain(heading);
      });
      // The English template's headings travel with them (an applicant may need either).
      expect(sectionsList.items[0]).toContain("Section 1: Background and skills");
      expect(sectionsList.items[1]).toContain(
        "Section 2: Most significant contributions and experiences",
      );
      expect(sectionsList.items[2]).toContain("Section 3: Supervisory and mentorship activities");
    }
  });

  it("states the two page limits and the ten-contribution cap, and never recommends a metric", () => {
    for (const loc of ["en-US", "fr-FR"] as const) {
      const guide = getGuide("frq-narrative-cv", loc)!;
      const blob = JSON.stringify(guide);
      expect(blob, loc).toMatch(/six pages|6 pages|Six pages/);
      expect(blob, loc).toMatch(/five|cinq|5 pages/i);
      expect(blob, loc).toMatch(/ten contributions|dix contributions/i);
      // The FAQ answers the metrics question with "no", never "add your h-index".
      const metricsFaq = guide.faq!.find((f) => /h-index|indice h/i.test(f.q))!;
      expect(metricsFaq, loc).toBeDefined();
      expect(metricsFaq.a, loc).toMatch(/do not ask|ne les demandent pas/i);
    }
  });

  it("is linked from the country-formats guide", () => {
    expect(getGuide("academic-cv-format-by-country")!.relatedGuides).toContain("frq-narrative-cv");
  });
});

describe("the French CV-FRQ example", () => {
  const example = getExample("cv-frq-pharmacologie")!;

  it("is a French page whose three sections are the FRQ's headings, in order", () => {
    expect(example.locale).toBe("fr-FR");
    expect(example.sections.map((s) => s.title)).toEqual([...FRQ_HEADINGS]);
  });

  it("lists at most ten numbered contributions, each with a period and an audience letter", () => {
    const contributions = example.sections[1]!.items;
    expect(contributions.length).toBeLessThanOrEqual(10);
    contributions.forEach((item, i) => {
      expect(item, `contribution ${i + 1}`).toMatch(new RegExp(`^${i + 1}\\. `));
      // "(2021-2023 · clientèles A et B)" — a period and an A/B/C audience.
      expect(item, `contribution ${i + 1} period`).toMatch(/\(20\d\d(-(20\d\d|en cours))?/);
      expect(item, `contribution ${i + 1} audience`).toMatch(/clientèles? [ABC]/);
    });
  });

  it("follows the FRQ's publication rules: the candidate's surname appears, supervisees carry an asterisk", () => {
    const blob = example.sections.map((s) => s.items.join("\n")).join("\n");
    expect(blob).toContain("Bouchard-Nadeau, L.");
    expect(blob).toContain("Kaur, P.*");
    expect(blob).toContain("Nguyen, T.-A.*");
  });

  it("is entirely fabricated: every DOI uses the 10.0000 test prefix and the disclaimers say so", () => {
    const blob = JSON.stringify(example);
    const dois = blob.match(/10\.\d{4,}\/[^\s"),]+/g) ?? [];
    expect(dois.length).toBeGreaterThan(5);
    for (const doi of dois) expect(doi).toMatch(/^10\.0000\//);
    expect(example.person.affiliation).toContain("fictive");
    expect(example.intro.join(" ")).toContain("Aucun indicateur n'est inventé");
  });

  it("keeps one URL whatever the UI locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(localizeContentHref("/examples/cv-frq-pharmacologie", loc)).toBe(
        "/examples/cv-frq-pharmacologie",
      );
    }
  });
});

describe("examples chrome", () => {
  it("is defined non-empty in all 10 locales, with the placeholders each string needs", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const c = EXAMPLES_CHROME[loc];
      for (const v of Object.values(c)) expect(v.trim().length, loc).toBeGreaterThan(0);
      expect(c.disclaimerBody, loc).toContain("{name}");
      expect(c.citations, loc).toContain("{style}");
      expect(c.template, loc).toContain("{template}");
      expect(c.exampleAria, loc).toContain("{label}");
      expect(examplesChrome(loc)).toBe(c);
    }
    expect(examplesChrome("xx-XX")).toBe(EXAMPLES_CHROME["en-US"]);
  });

  it("fillChrome substitutes known placeholders and leaves unknown ones", () => {
    expect(fillChrome("{style} citations", { style: "APA" })).toBe("APA citations");
    expect(fillChrome("{a} and {b}", { a: "x" })).toBe("x and {b}");
  });
});
