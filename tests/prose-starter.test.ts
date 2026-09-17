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
  appendContributionStub,
  contributionStub,
  contributionStubCount,
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
    expect(contributionStubCount(body)).toBe(0);
  });

  it("appends a numbered stub per picked entry: slots, reference, the entry's token; the pick prompt gives way", () => {
    const cv = makeCv("fr-FR");
    const knowledge = cv.sections.find((s) => s.type === "narrative-knowledge")!;
    const pubs = cv.sections.find((s) => s.type === "publications")!;
    const w1 = pubs.items.find((it) => it.id === "W1")!;
    const start = { ...knowledge, body: starterProseBody(cv, "narrative-knowledge") };
    const first = appendContributionStub(cv, start, w1);
    expect(first.body).not.toContain(proseStarterStrings("fr-FR").pickPrompt);
    expect(first.body).toContain(proseStarterStrings("fr-FR").contribIntro);
    expect(first.body).toContain(
      "1. Article 1 (2015 · Clientèle : A / B / C) [[W1 | Chrétien et al. 2015]]",
    );
    expect(first.body).toContain("Rôle : [à compléter]");
    expect(first.body).toContain("Retombées : [à compléter]");
    expect(first.body).toContain(
      "Référence : Chrétien, B., & Kaur, P. (2015). Article 1. Revue fictive. https://doi.org/10.0000/w1",
    );
    // The role slot's placeholder is what the editor selects.
    expect(first.body.slice(first.selectStart, first.selectEnd)).toBe("[à compléter]");
    expect(first.body.slice(0, first.selectStart)).toMatch(/Rôle : $/);
    // A second pick is numbered 2 and lands after the first.
    const dataset = cv.sections.find((s) => s.type === "datasets")!.items[0]!;
    const second = appendContributionStub(cv, { ...knowledge, body: first.body }, dataset);
    expect(contributionStubCount(second.body)).toBe(2);
    expect(second.body.indexOf("1. Article 1")).toBeLessThan(second.body.indexOf("2. QC-ADR-ONCO"));
    expect(second.body).toContain(
      "2. QC-ADR-ONCO (2023 · Clientèle : A / B / C) [[dataset:1 | QC-ADR-ONCO]]",
    );
    // An entry with no CSL falls back to its display line, and the stub stays bounded.
    const software = cv.sections.find((s) => s.type === "software")!.items[0]!;
    expect(contributionStub(cv, software, 7)).toContain(
      "7. SIGNALTRI (version 1.4), Zenodo, 2021 (2021 · Clientèle : A / B / C)",
    );
    expect(contributionStub(cv, software, 7)).toContain(
      "Référence : SIGNALTRI (version 1.4), Zenodo, 2021",
    );
    // A body with no prompt at all (the owner wrote their own text) just grows.
    const own = appendContributionStub(cv, { ...knowledge, body: "Mon texte." }, w1);
    expect(own.body.startsWith("Mon texte.\n\n1. Article 1")).toBe(true);
  });

  it("a stub names the clinical guidelines that cite the work, between the impact slot and the reference", () => {
    const cv = CanonicalCvSchema.parse({
      schemaVersion: 2,
      id: "guided",
      owner: {
        orcid: "0000-0002-7483-2489",
        openAlexAuthorIds: [],
        displayName: "Basile Chrétien",
      },
      display: { locale: "fr-FR" },
      sections: [
        section("publications", [
          pub("W2", "Taken up in practice", 2020, 3, {
            meta: {
              year: 2020,
              citedByCount: 3,
              guidelineCitations: [
                {
                  pmid: "34724392",
                  title: "ASCO Guideline Update.",
                  source: "J Clin Oncol",
                  year: 2021,
                },
                {
                  pmid: "38228461",
                  title: "Position statement.",
                  source: "Gastroenterol Hepatol",
                  year: 2024,
                },
              ],
            },
          }),
        ]),
        section("narrative-knowledge", []),
      ],
      provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["manual"] },
    });
    const stub = contributionStub(cv, cv.sections[0]!.items[0]!, 1);
    expect(stub).toContain(
      "Cité dans le guide de pratique : ASCO Guideline Update (J Clin Oncol, 2021). https://pubmed.ncbi.nlm.nih.gov/34724392/",
    );
    expect(stub).toContain(
      "Cité dans le guide de pratique : Position statement (Gastroenterol Hepatol, 2024). https://pubmed.ncbi.nlm.nih.gov/38228461/",
    );
    expect(stub.indexOf("Retombées")).toBeLessThan(stub.indexOf("Cité dans le guide"));
    expect(stub.indexOf("Cité dans le guide")).toBeLessThan(stub.indexOf("Référence :"));
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
    // A contribution stub for an item with a title override and no year prints the prompt for the year.
    const cv2 = makeCv("en-US", [
      section("publications", [
        item("W_ov", {
          displayTextOverride: "Overridden title",
          csl: { id: "W_ov", type: "article-journal", title: "Original" },
        }),
      ]),
      section("narrative-knowledge", [], true),
    ]);
    const stub = contributionStub(cv2, cv2.sections[0]!.items[0]!, 1);
    expect(stub).toContain("1. Overridden title ([to complete] · Audience : A / B / C)");
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
