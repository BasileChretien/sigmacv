import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  PROSE_BODY_MAX,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { applyCvModel } from "@/lib/canonical/cvModels";
import {
  prefillEmptyProse,
  starterProseBody,
  starterReferenceLine,
} from "@/lib/canonical/proseStarter";
import { PROSE_STARTER_STRINGS, proseStarterStrings } from "@/lib/i18n/proseStarter";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";

/** A minimal item; `extra` layers csl / meta / display text on top. */
function item(id: string, extra: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "manual",
    sourceId: "manual",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: {},
    ...extra,
  };
}

function section(type: CvSectionType, items: CvItem[], visible = true): CvSection {
  return {
    id: type,
    type,
    title: type,
    visible,
    order: 0,
    items: items.map((it, i) => ({ ...it, order: i })),
  };
}

function pub(
  id: string,
  title: string,
  year: number,
  cited: number,
  extra: Partial<CvItem> = {},
): CvItem {
  return item(id, {
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    csl: {
      id,
      type: "article-journal",
      title,
      author: [
        { family: "Chrétien", given: "Basile" },
        { family: "Kaur", given: "Priya" },
      ],
      issued: { "date-parts": [[year]] },
      "container-title": "Revue fictive",
      DOI: `10.0000/${id.toLowerCase()}`,
    },
    meta: { year, citedByCount: cited },
    ...extra,
  });
}

/** A CV with a record behind every draft: works, education, a position, awards, supervision. */
function makeCv(locale = "fr-FR", sections: CvSection[] = defaultSections()): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "starter_test",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Basile Chrétien",
      links: [],
      countsByYear: [],
    },
    display: { locale },
    sections: sections.map((s, i) => ({ ...s, order: i })),
    presets: [],
    provenance: { generatedAt: "2026-09-16T00:00:00.000Z", sources: ["manual"] },
  });
}

function defaultSections(): CvSection[] {
  const pubs = Array.from({ length: 8 }, (_, i) =>
    pub(`W${i + 1}`, `Article ${i + 1}`, 2015 + i, (8 - i) * 10),
  );
  // A hidden one and a "not mine" one must never surface.
  pubs.push(pub("W_hidden", "Hidden article", 2026, 999, { included: false }));
  pubs.push(pub("W_notmine", "Not my article", 2026, 998, { notMine: true }));
  return [
    section("publications", pubs),
    section("datasets", [
      item("dataset:1", {
        csl: {
          id: "dataset:1",
          type: "dataset",
          title: "QC-ADR-ONCO",
          issued: { "date-parts": [[2023]] },
        },
        meta: { year: 2023 },
      }),
    ]),
    section("software", [
      item("software:1", {
        displayText: "SIGNALTRI (version 1.4), Zenodo, 2021",
        meta: { year: 2021 },
      }),
    ]),
    section("education", [
      item("edu:1", {
        displayText: "PhD, Université du Saint-Laurent, 2016–2020",
        meta: {
          roleTitle: "Doctorat en pharmacoépidémiologie",
          institution: "Université du Saint-Laurent",
          startYear: 2016,
          endYear: 2020,
        },
      }),
    ]),
    section("positions", [
      item("pos:1", {
        displayText: "Professeure adjointe, Université du Saint-Laurent, 2021–",
        meta: {
          roleTitle: "Professeure adjointe",
          institution: "Université du Saint-Laurent",
          startYear: 2021,
        },
      }),
    ]),
    section("awards", [
      item("award:1", { displayText: "Prix de la relève en pharmacologie (2022)" }),
    ]),
    section("grants", [item("grant:1", { displayText: "Bourse de carrière junior 1, 2022–2026" })]),
    section("supervision", [
      item("sup:1", {
        displayText: "Priya Kaur, PhD",
        meta: {
          superviseeName: "Priya Kaur",
          degreeLevel: "phd",
          supervisionRole: "primary",
          institution: "Université du Saint-Laurent",
          startYear: 2021,
        },
      }),
      item("sup:2", { displayText: "Stagiaires de premier cycle (6)" }),
    ]),
    section("teaching", [
      item("teach:1", { displayText: "Pharmacovigilance, Pharm. D., 45 h/an" }),
    ]),
    section("peer-review", [
      item("rev:1", { displayText: "Revue fictive de pharmacovigilance (20 rapports)" }),
    ]),
    section("patents", []),
  ];
}

describe("starter drafts for the prose sections", () => {
  it("writes the background from education, positions, recognitions and funding, in the CV's language", () => {
    const body = starterProseBody(makeCv("fr-FR"), "statement");
    const s = proseStarterStrings("fr-FR");
    expect(body.startsWith(s.draftNote)).toBe(true);
    expect(body).toContain(s.bgIntro);
    expect(body).toContain(
      "Formation\n- Doctorat en pharmacoépidémiologie, Université du Saint-Laurent (2016–2020)",
    );
    expect(body).toContain(
      "Postes\n- Professeure adjointe, Université du Saint-Laurent (2021–aujourd'hui)",
    );
    expect(body).toContain("Reconnaissances\n- Prix de la relève en pharmacologie (2022)");
    expect(body).toContain("Financements obtenus\n- Bourse de carrière junior 1, 2022–2026");
    expect(body.endsWith(s.skillsPrompt)).toBe(true);
    // Same record, English CV: English scaffold.
    const en = starterProseBody(makeCv("en-US"), "statement");
    expect(en).toContain("Education\n- ");
    expect(en).toContain("(2021–present)");
  });

  it("starts the contributions section on its prompts alone, ending on where to pick the publications", () => {
    const body = starterProseBody(makeCv("fr-FR"), "narrative-knowledge");
    expect(body.split("\n").filter((l) => /^\d+\. /.test(l))).toEqual([]);
    expect(body).toContain(proseStarterStrings("fr-FR").contribIntro);
    expect(body).toContain(proseStarterStrings("fr-FR").pickPrompt);
    expect(body).toContain("panneau Contenu");
  });

  it("writes the people section from supervision and teaching records, with the owner's own labels", () => {
    const body = starterProseBody(makeCv("fr-FR"), "narrative-individuals");
    expect(body).toContain("Encadrement\n- ");
    expect(body).toMatch(
      /- Doctorat, .*: Priya Kaur \(Université du Saint-Laurent; 2021–aujourd'hui\)/,
    );
    expect(body).toContain("- Stagiaires de premier cycle (6)");
    expect(body).toContain("Enseignement\n- Pharmacovigilance, Pharm. D., 45 h/an");
    expect(body.endsWith(proseStarterStrings("fr-FR").mentoringPrompt)).toBe(true);
  });

  it("writes the community and society modules from their records, skipping empty ones", () => {
    const cv = makeCv("en-US");
    const community = starterProseBody(cv, "narrative-community");
    expect(community).toContain("peer-review\n- Revue fictive de pharmacovigilance (20 rapports)");
    const society = starterProseBody(cv, "narrative-society");
    // No patents, no trials: the prompt alone, no empty heading.
    expect(society).toBe(
      `${proseStarterStrings("en-US").draftNote}\n\n${proseStarterStrings("en-US").societyIntro}`,
    );
  });

  it("returns an empty string for a non-prose type and never exceeds the prose cap", () => {
    const cv = makeCv("en-US");
    expect(starterProseBody(cv, "publications")).toBe("");
    for (const t of ["statement", "narrative-knowledge", "narrative-individuals"] as const) {
      expect(starterProseBody(cv, t).length).toBeLessThanOrEqual(PROSE_BODY_MAX);
    }
  });

  it("a plain reference line: authors, year, title, venue and DOI when known; display text otherwise; et al. past seven", () => {
    expect(starterReferenceLine(pub("W9", "Title here", 2020, 0))).toBe(
      "Chrétien, B., & Kaur, P. (2020). Title here. Revue fictive. https://doi.org/10.0000/w9",
    );
    expect(starterReferenceLine(item("x", { displayText: "Some report, 2021" }))).toBe(
      "Some report, 2021",
    );
    const many = pub("W10", "Many", 2021, 0);
    many.csl!.author = Array.from({ length: 9 }, (_, i) => ({
      family: `F${i}`,
      given: `Jean-Baptiste`,
    }));
    const line = starterReferenceLine(many);
    expect(line).toContain("F0, J.-B., F1, J.-B.");
    expect(line).toContain("F6, J.-B., et al. (2021)");
    expect(line).not.toContain("F7");
  });
});

describe("supervisee names in the people draft", () => {
  it("stand in with the degree-level noun when the owner hides supervisee names, in the CV's language", () => {
    const hidden = {
      ...makeCv("fr-FR"),
      display: { ...makeCv("fr-FR").display, hideSuperviseeNames: true },
    };
    const body = starterProseBody(hidden, "narrative-individuals");
    expect(body).not.toContain("Priya Kaur");
    expect(body).toMatch(
      /- Doctorat, [^:]+: [^(]+ \(Université du Saint-Laurent; 2021–aujourd'hui\)/,
    );
    // Free-text supervision lines (no structured record) are the owner's own words and pass through.
    expect(body).toContain("- Stagiaires de premier cycle (6)");
    // With the toggle off the name is printed, as the FRQ asks.
    expect(starterProseBody(makeCv("fr-FR"), "narrative-individuals")).toContain("Priya Kaur");
  });
});

describe("prefillEmptyProse", () => {
  it("fills the empty visible prose sections a layout shows, leaves written ones and hidden ones alone, and is immutable", () => {
    const applied = applyCvModel(makeCv("fr-FR"), "frq");
    const filled = prefillEmptyProse(applied);
    expect(filled).not.toBe(applied);
    const visibleProse = filled.sections.filter((s) => s.visible && s.body !== undefined);
    expect(visibleProse.map((s) => s.type).sort()).toEqual(
      ["narrative-individuals", "narrative-knowledge", "statement"].sort(),
    );
    for (const s of visibleProse) expect((s.body ?? "").length).toBeGreaterThan(50);
    // The input was not mutated.
    for (const s of applied.sections) if (s.body !== undefined) expect(s.body).toBe("");
    // A second pass changes nothing (every visible prose section now has text).
    expect(prefillEmptyProse(filled)).toBe(filled);
    // A section the owner wrote keeps its text.
    const written = {
      ...applied,
      sections: applied.sections.map((s) =>
        s.type === "statement" ? { ...s, body: "Mon texte." } : s,
      ),
    };
    const refilled = prefillEmptyProse(written);
    expect(refilled.sections.find((s) => s.type === "statement")!.body).toBe("Mon texte.");
    expect(refilled.sections.find((s) => s.type === "narrative-knowledge")!.body).toContain(
      proseStarterStrings("fr-FR").pickPrompt,
    );
  });

  it("is the identity when nothing is empty and visible", () => {
    const cv = makeCv("en-US"); // no prose sections at all
    expect(prefillEmptyProse(cv)).toBe(cv);
  });
});

describe("starter-draft strings", () => {
  it("exist in all ten locales, non-empty, prompts in square brackets, and the editor button too", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = PROSE_STARTER_STRINGS[loc];
      for (const v of Object.values(s)) expect(v.trim().length, loc).toBeGreaterThan(0);
      for (const k of [
        "draftNote",
        "todo",
        "bgIntro",
        "contribIntro",
        "supervisionIntro",
      ] as const) {
        expect(s[k], `${loc} ${k}`).toMatch(/^\[.*\]$/);
      }
      expect(s.audienceKey).toBe("A / B / C");
      expect(editorUi(loc).proseStarterInsert.trim().length, loc).toBeGreaterThan(0);
      expect(editorUi(loc).proseStarterHint.trim().length, loc).toBeGreaterThan(0);
    }
    expect(proseStarterStrings("xx-XX")).toBe(PROSE_STARTER_STRINGS["en-US"]);
  });
});

describe("starter-draft edge cases", () => {
  it("falls back sensibly when an entry lacks pieces: CSL year only, literal or single author, end year only, same start and end", () => {
    // Year from CSL `issued` when meta.year is absent; a literal author printed as is; one author, no ampersand.
    const lone = item("W_lone", {
      csl: {
        id: "W_lone",
        type: "article-journal",
        title: "Lone",
        author: [{ literal: "Consortium fictif" }],
        issued: { "date-parts": [[2019]] },
      },
    });
    expect(starterReferenceLine(lone)).toBe("Consortium fictif (2019). Lone.");
    // No author, no year, no venue, no DOI: the title alone.
    expect(
      starterReferenceLine(
        item("W_bare", { csl: { id: "W_bare", type: "article-journal", title: "Bare" } }),
      ),
    ).toBe("Bare.");
    // A given name with no letters yields the family name alone.
    const nameless = item("W_fam", {
      csl: {
        id: "W_fam",
        type: "article-journal",
        title: "Fam",
        author: [{ family: "Solo", given: " " }],
      },
    });
    expect(starterReferenceLine(nameless)).toBe("Solo. Fam.");
    // History bullets: end year only, same start and end, and a line with neither role nor institution.
    const cv = makeCv("en-US", [
      section("education", [
        item("edu:a", { meta: { roleTitle: "MSc", institution: "U", endYear: 2016 } }),
        item("edu:b", {
          meta: { roleTitle: "Cert.", institution: "V", startYear: 2018, endYear: 2018 },
        }),
        item("edu:c", { displayText: "Some course" }),
        item("edu:d", {}),
      ]),
      section("positions", []),
      section("statement", [], true),
    ]);
    const body = starterProseBody(cv, "statement");
    expect(body).toContain("- MSc, U (2016)");
    expect(body).toContain("- Cert., V (2018)");
    expect(body).toContain("- Some course");
    expect(body).not.toContain("Positions");
    // A community draft on a CV that has no such sections at all: prompt only, headings fall back to the type.
    const cv3 = makeCv("en-US", [
      section("service", [item("svc:1", { displayText: "Board member" })]),
      section("narrative-community", [], true),
    ]);
    const community = starterProseBody(cv3, "narrative-community");
    expect(community).toContain("service\n- Board member");
    expect(community).not.toContain("peer-review");
    // A supervision record with only a name, no degree or role, keeps the name.
    const cv4 = makeCv("en-US", [
      section("supervision", [item("sup:x", { meta: { superviseeName: "Only Name" } })]),
      section("narrative-individuals", [], true),
    ]);
    expect(starterProseBody(cv4, "narrative-individuals")).toContain("- Only Name");
  });
});
