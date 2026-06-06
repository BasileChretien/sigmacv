import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  addManualEntry,
  setItemNotMine,
  updateDisplay,
  updateOwner,
} from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { cvCslItems, renderCvCslJson, csljsonRenderer } from "@/lib/render/csljson";
import {
  buildJsonResume,
  renderCvJsonResume,
  jsonresumeRenderer,
} from "@/lib/render/jsonresume";
import { renderCvBiosketch, biosketchRenderer } from "@/lib/render/biosketch";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const baseWorks = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "rx",
    resolved,
    works: baseWorks,
    now: "2026-06-02T00:00:00.000Z",
  });
}

/** A richly-populated CV: header + contact + links + every mapped section type
 *  (positions, education, awards, skills, languages) added as manual entries. */
function fullCv(): CanonicalCv {
  let cv = makeCv();
  cv = updateOwner(cv, {
    headline: "Senior Pharmacologist",
    summary: "I study drug safety signals.",
    honorific: "Dr",
    contact: { email: "me@uni.example", website: "https://me.example", location: "Caen, France" },
    links: [
      { label: "GitHub", url: "https://github.com/me" },
      { label: "", url: "https://scholar.example/me" }, // no label → network fallback
      { label: "Broken", url: "" }, // empty url → dropped
    ],
  });
  cv = addManualEntry(cv, "positions", "Lecturer, Université de Caen (2020–)", "position:1");
  cv = addManualEntry(cv, "education", "PharmD, Université de Caen (2015)", "education:1");
  cv = addManualEntry(cv, "awards", "Young Investigator Award (2021)", "award:1");
  cv = addManualEntry(cv, "skills", "R, TypeScript, Pharmacovigilance", "skill:1");
  cv = addManualEntry(cv, "languages", "French (native), English (fluent)", "lang:1");
  return cv;
}

/** A bare CV: no header, no contact, no extra sections — only the publications
 *  from the fixture. Exercises every "omit empty field/section" branch. */
function bareCv(): CanonicalCv {
  const cv = makeCv();
  return {
    ...cv,
    owner: {
      ...cv.owner,
      displayName: "",
      headline: undefined,
      summary: undefined,
      honorific: undefined,
      contact: undefined,
      links: [],
    },
  };
}

// ─── 3.1 CSL-JSON ────────────────────────────────────────────────────────────

describe.skipIf(!hasApa)("CSL-JSON renderer", () => {
  it("returns the canonical CSL items as a pretty JSON array", async () => {
    const cv = makeCv();
    const r = await csljsonRenderer.render({ cv });
    expect(r.format).toBe("csljson");
    expect(r.mimeType).toBe("application/vnd.citationstyles.csl+json; charset=utf-8");
    expect(r.filename).toBe("basile-chretien-cv.csl.json");

    const parsed = JSON.parse(r.text!);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(cvCslItems(cv).length);
    expect(parsed.length).toBeGreaterThan(0);
    // Each entry is a CSL item with an id + type.
    expect(parsed[0]).toHaveProperty("id");
    expect(parsed[0]).toHaveProperty("type");
    // Pretty-printed (indented) + trailing newline.
    expect(r.text).toContain("\n  ");
    expect(r.text!.endsWith("\n")).toBe(true);
  });

  it("excludes 'not mine' and hidden works", () => {
    const cv = makeCv();
    const id = cv.sections[0]!.items[0]!.id;
    const before = cvCslItems(cv).length;
    const corrected = setItemNotMine(cv, "publications", id, true);
    expect(cvCslItems(corrected).length).toBe(before - 1);
  });

  it("renders an empty array for a CV with no citations", () => {
    const cv = makeCv();
    const empty: CanonicalCv = { ...cv, sections: [] };
    expect(renderCvCslJson(empty)).toBe("[]\n");
  });
});

// ─── 3.2 JSON Résumé ─────────────────────────────────────────────────────────

describe.skipIf(!hasApa)("JSON Résumé renderer", () => {
  it("maps header, contact, links and every section", async () => {
    const cv = fullCv();
    const r = await jsonresumeRenderer.render({ cv });
    expect(r.format).toBe("jsonresume");
    expect(r.mimeType).toBe("application/json");
    expect(r.filename).toBe("basile-chretien-resume.json");

    const j = JSON.parse(r.text!);
    expect(j.basics.name).toBe("Basile Chrétien");
    expect(j.basics.label).toBe("Senior Pharmacologist");
    expect(j.basics.email).toBe("me@uni.example");
    expect(j.basics.url).toBe("https://me.example");
    expect(j.basics.summary).toBe("I study drug safety signals.");
    expect(j.basics.location).toEqual({ address: "Caen, France" });
    // Links → profiles; empty-url link dropped; missing label → "Link".
    expect(j.basics.profiles).toEqual([
      { network: "GitHub", url: "https://github.com/me" },
      { network: "Link", url: "https://scholar.example/me" },
    ]);
    expect(j.work).toEqual([{ name: "Lecturer, Université de Caen (2020–)" }]);
    expect(j.education).toEqual([{ name: "PharmD, Université de Caen (2015)" }]);
    expect(j.awards).toEqual([{ name: "Young Investigator Award (2021)" }]);
    expect(j.skills).toEqual([{ name: "R, TypeScript, Pharmacovigilance" }]);
    expect(j.languages).toEqual([{ name: "French (native), English (fluent)" }]);

    // publications mapped from CSL.
    expect(Array.isArray(j.publications)).toBe(true);
    expect(j.publications.length).toBeGreaterThan(0);
    const pub = j.publications[0];
    expect(pub.name).toBeTruthy();
    expect(pub.publisher).toBeTruthy(); // container-title
    expect(pub.releaseDate).toMatch(/^\d{4}/);
  });

  it("omits every empty field and section for a bare CV", () => {
    const j = buildJsonResume(bareCv());
    expect(j.basics).toEqual({ name: "" });
    expect(j).not.toHaveProperty("work");
    expect(j).not.toHaveProperty("education");
    expect(j).not.toHaveProperty("awards");
    expect(j).not.toHaveProperty("skills");
    expect(j).not.toHaveProperty("languages");
    // Bare CV still has the fixture publications.
    expect(j).toHaveProperty("publications");
  });

  it("falls back to publisher and builds a DOI url when no container/URL", () => {
    const cv = makeCv();
    const withCsl: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.type === "publications"
          ? {
              ...s,
              items: s.items.map((it, i) =>
                i === 0
                  ? {
                      ...it,
                      csl: {
                        id: it.id,
                        type: "article-journal",
                        title: "Has DOI only",
                        publisher: "Acme Press",
                        DOI: "10.1/xyz",
                        issued: { "date-parts": [[2022, 3, 4]] },
                      },
                    }
                  : it,
              ),
            }
          : s,
      ),
    };
    const j = buildJsonResume(withCsl) as { publications: Array<Record<string, string>> };
    const p = j.publications.find((x) => x.name === "Has DOI only")!;
    expect(p.publisher).toBe("Acme Press"); // container-title absent → publisher
    expect(p.url).toBe("https://doi.org/10.1/xyz"); // DOI → url
    expect(p.releaseDate).toBe("2022-03-04"); // full date
  });

  it("handles a citation with no title, no date, no publisher", () => {
    const cv = makeCv();
    const minimal: CanonicalCv = {
      ...cv,
      sections: [
        {
          id: "publications",
          type: "publications",
          title: "Publications",
          visible: true,
          order: 0,
          items: [
            {
              id: "W-min",
              source: "openalex",
              sourceId: "manual",
              csl: { id: "W-min", type: "article-journal" },
              included: true,
              notMine: false,
              order: 0,
              authoredBySelf: false,
              selfNameVariants: [],
              meta: {},
            },
          ],
        },
      ],
    };
    const j = buildJsonResume(minimal) as { publications: Array<Record<string, string>> };
    expect(j.publications[0]).toEqual({ name: "Untitled" });
  });
});

// ─── 3.3 NIH biosketch ───────────────────────────────────────────────────────

describe.skipIf(!hasApa)("NIH biosketch renderer", () => {
  it("renders the full NIH structure with English headings", async () => {
    const cv = fullCv();
    const r = await biosketchRenderer.render({ cv });
    expect(r.format).toBe("biosketch");
    expect(r.mimeType).toBe("text/markdown; charset=utf-8");
    expect(r.filename).toBe("basile-chretien-biosketch.md");

    const md = r.text!;
    expect(md).toContain("# Dr Basile Chrétien");
    expect(md).toContain("*Senior Pharmacologist*");
    expect(md).toContain("## Education/Training");
    expect(md).toContain("PharmD, Université de Caen (2015)");
    expect(md).toContain("## A. Personal Statement");
    expect(md).toContain("I study drug safety signals.");
    expect(md).toContain("## B. Positions, Scientific Appointments, and Honors");
    expect(md).toContain("Lecturer, Université de Caen (2020–)");
    expect(md).toContain("Young Investigator Award (2021)"); // award in B
    expect(md).toContain("## C. Contributions to Science");
    // Contributions are a numbered citeproc list.
    expect(md).toMatch(/## C\. Contributions to Science\n\n1\. /);
    expect(md.endsWith("\n")).toBe(true);
  });

  it("uses placeholders for an empty summary / positions / publications", () => {
    const cv = bareCv();
    // Drop the publications so C is empty too.
    const noPubs: CanonicalCv = { ...cv, sections: [] };
    const md = renderCvBiosketch(noPubs);
    expect(md).toContain("# Curriculum Vitae"); // empty name fallback
    expect(md).not.toContain("## Education/Training"); // no education section
    expect(md).toContain("Add a personal statement"); // A placeholder
    expect(md).toContain("## B. Positions");
    expect(md).toMatch(/## B\.[^\n]*\n\n_\(None listed\.\)_/); // B placeholder
    expect(md).toMatch(/## C\.[^\n]*\n\n_\(None listed\.\)_/); // C placeholder
  });

  it("bolds the account holder's name in the contributions list", () => {
    const cv = makeCv();
    const md = renderCvBiosketch(cv);
    // The fixture's self works carry selfNameVariants, so the name is bolded.
    expect(md).toContain("**");
  });

  it("does not bold when highlightSelf is off", () => {
    const cv = updateDisplay(makeCv(), { highlightSelf: false });
    const md = renderCvBiosketch(cv);
    expect(md).toContain("## C. Contributions to Science");
    // The personal-statement and headings never use ** — so no bold at all here.
    expect(md).not.toContain("**");
  });

  it("renders the name without an honorific when none is set", () => {
    const cv = updateOwner(makeCv(), { honorific: undefined });
    const md = renderCvBiosketch(cv);
    expect(md).toMatch(/^# Basile Chrétien/);
  });
});
