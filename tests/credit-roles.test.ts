import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  CREDIT_ROLES,
  extractCreditRoles,
  normalizeCreditRole,
  normalizeCreditRoles,
} from "@/lib/canonical/credit";
import { setCreditRoles } from "@/lib/canonical/curate";
import { parseCanonicalCv, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderStrings } from "@/lib/i18n/render";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { creditRolesHtml } from "@/lib/render/creditRoles";
import { renderCvHtml } from "@/lib/render/html";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const SECTION = "publications";
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({ id: "cv_credit", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}
function firstCitation(cv: CanonicalCv): CvItem {
  const item = cv.sections.find((s) => s.id === SECTION)?.items.find((i) => i.csl);
  if (!item) throw new Error("fixture has no citation item");
  return item;
}
function withMeta(cv: CanonicalCv, itemId: string, meta: Partial<CvItem["meta"]>): CanonicalCv {
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) =>
        it.id === itemId ? { ...it, meta: { ...it.meta, ...meta } } : it,
      ),
    })),
  };
}

describe("normalizeCreditRole", () => {
  it("maps every canonical id to itself", () => {
    for (const r of CREDIT_ROLES) expect(normalizeCreditRole(r)).toBe(r);
  });

  it("accepts the human spellings, en/em dashes, ampersands and British spellings", () => {
    expect(normalizeCreditRole("Writing – review & editing")).toBe("writing-review-editing");
    expect(normalizeCreditRole("Writing - Review and Editing")).toBe("writing-review-editing");
    expect(normalizeCreditRole("writing-review-and-editing")).toBe("writing-review-editing");
    expect(normalizeCreditRole("Writing — original draft")).toBe("writing-original-draft");
    expect(normalizeCreditRole("Formal Analysis")).toBe("formal-analysis");
    expect(normalizeCreditRole("  data_curation ")).toBe("data-curation");
    expect(normalizeCreditRole("Conceptualisation")).toBe("conceptualization");
    expect(normalizeCreditRole("Visualisation")).toBe("visualization");
    expect(normalizeCreditRole("Funding Acquisition")).toBe("funding-acquisition");
  });

  it("accepts the NISO CRediT URI form", () => {
    expect(normalizeCreditRole("https://credit.niso.org/contributor-roles/formal-analysis/")).toBe(
      "formal-analysis",
    );
    expect(normalizeCreditRole("http://credit.niso.org/contributor-roles/software?x=1#y")).toBe(
      "software",
    );
    expect(normalizeCreditRole("https://credit.niso.org/")).toBeUndefined();
  });

  it("rejects non-strings, blanks and anything outside the 14 roles", () => {
    expect(normalizeCreditRole(undefined)).toBeUndefined();
    expect(normalizeCreditRole(42)).toBeUndefined();
    expect(normalizeCreditRole("")).toBeUndefined();
    expect(normalizeCreditRole("   ")).toBeUndefined();
    expect(normalizeCreditRole("Wizardry")).toBeUndefined();
    expect(normalizeCreditRole("author")).toBeUndefined();
    expect(normalizeCreditRole("writing")).toBeUndefined();
  });
});

describe("normalizeCreditRoles", () => {
  it("drops unknowns, collapses duplicates and returns taxonomy order", () => {
    expect(
      normalizeCreditRoles(["Software", "Conceptualization", "software", 3, "nope", "Validation"]),
    ).toEqual(["conceptualization", "software", "validation"]);
    expect(normalizeCreditRoles([])).toEqual([]);
  });
});

describe("extractCreditRoles (every accepted contributor shape)", () => {
  it("role as an array of strings", () => {
    expect(extractCreditRoles({ role: ["Methodology", "Supervision", "Wizardry"] })).toEqual([
      "methodology",
      "supervision",
    ]);
  });

  it("role as a single string", () => {
    expect(extractCreditRoles({ role: "Investigation" })).toEqual(["investigation"]);
  });

  it("role as objects with a CRediT vocabulary (value / role / name keys)", () => {
    expect(
      extractCreditRoles({
        role: [
          { value: "Conceptualization", vocab: "CRediT" },
          { role: "Software", vocabulary: "https://credit.niso.org/" },
          { name: "Validation", vocab: "credit" },
        ],
      }),
    ).toEqual(["conceptualization", "software", "validation"]);
  });

  it("drops objects whose vocabulary is named and is not CRediT, keeps vocab-less ones", () => {
    expect(
      extractCreditRoles({
        role: [
          { value: "Software", vocab: "publisher-roles" },
          { value: "Resources" }, // no vocab → judged on its value
          { value: "Editor" }, // not a CRediT role
          { vocab: "credit" }, // no value at all
        ],
      }),
    ).toEqual(["resources"]);
  });

  it("contributor-role (string or list) and roles (list)", () => {
    expect(extractCreditRoles({ "contributor-role": "Project administration" })).toEqual([
      "project-administration",
    ]);
    expect(extractCreditRoles({ "contributor-role": ["Data curation", "Software"] })).toEqual([
      "data-curation",
      "software",
    ]);
    expect(extractCreditRoles({ roles: ["Visualization"] })).toEqual(["visualization"]);
  });

  it("merges across shapes, de-duplicating", () => {
    expect(
      extractCreditRoles({
        role: ["Software"],
        "contributor-role": "software",
        roles: [{ value: "Writing – original draft", vocab: "credit" }],
      }),
    ).toEqual(["software", "writing-original-draft"]);
  });

  it("returns [] for a non-record, an empty record and null role fields", () => {
    expect(extractCreditRoles(undefined)).toEqual([]);
    expect(extractCreditRoles("Basile")).toEqual([]);
    expect(extractCreditRoles({ given: "B", family: "C" })).toEqual([]);
    expect(extractCreditRoles({ role: null, roles: undefined })).toEqual([]);
    expect(extractCreditRoles({ role: [42, null, {}] })).toEqual([]);
  });
});

describe("setCreditRoles (pure curate op)", () => {
  it("stores the normalised roles as a SELF declaration, immutably", () => {
    const cv = makeCv();
    const item = firstCitation(cv);
    const next = setCreditRoles(cv, SECTION, item.id, ["Software", "Conceptualization", "nope"]);
    expect(next).not.toBe(cv);
    expect(firstCitation(cv).meta.creditRoles).toBeUndefined(); // input untouched
    const updated = firstCitation(next);
    expect(updated.meta.creditRoles).toEqual(["conceptualization", "software"]);
    expect(updated.meta.creditRolesSource).toBe("self");
    expect(() => parseCanonicalCv(next)).not.toThrow();
  });

  it("overrides Crossref-sourced roles with the user's own declaration", () => {
    const base = makeCv();
    const item = firstCitation(base);
    const cv = withMeta(base, item.id, {
      creditRoles: ["software"],
      creditRolesSource: "crossref",
    });
    const updated = firstCitation(setCreditRoles(cv, SECTION, item.id, ["validation"]));
    expect(updated.meta.creditRoles).toEqual(["validation"]);
    expect(updated.meta.creditRolesSource).toBe("self");
  });

  it("clears both fields on an empty (or all-invalid) selection", () => {
    const base = makeCv();
    const item = firstCitation(base);
    const cv = withMeta(base, item.id, { creditRoles: ["software"], creditRolesSource: "self" });
    for (const roles of [[], ["nope"]]) {
      const updated = firstCitation(setCreditRoles(cv, SECTION, item.id, roles));
      expect(updated.meta.creditRoles).toBeUndefined();
      expect(updated.meta.creditRolesSource).toBeUndefined();
    }
  });

  it("is a no-op for an unknown item, an unknown section and a non-citation entry", () => {
    const cv = makeCv();
    const item = firstCitation(cv);
    expect(setCreditRoles(cv, SECTION, "nope", ["software"]).sections).toEqual(cv.sections);
    expect(setCreditRoles(cv, "nope", item.id, ["software"]).sections).toEqual(cv.sections);
    const entry: CvItem = {
      ...item,
      id: "entry:1",
      csl: undefined,
      displayText: "A line",
      meta: {},
    };
    const withEntry: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.id === SECTION ? { ...s, items: [...s.items, entry] } : s,
      ),
    };
    const out = setCreditRoles(withEntry, SECTION, "entry:1", ["software"]);
    const untouched = out.sections.find((s) => s.id === SECTION)!.items.at(-1)!;
    expect(untouched.meta.creditRoles).toBeUndefined();
  });
});

describe("schema", () => {
  it("degrades an unknown stored role / source to undefined instead of failing the read", () => {
    const base = makeCv();
    const item = firstCitation(base);
    const raw = JSON.parse(JSON.stringify(base)) as CanonicalCv;
    const target = raw.sections.find((s) => s.id === SECTION)!.items.find((i) => i.id === item.id)!;
    (target.meta as Record<string, unknown>).creditRoles = ["wizardry"];
    (target.meta as Record<string, unknown>).creditRolesSource = "elsewhere";
    const parsed = parseCanonicalCv(raw);
    const back = parsed.sections
      .find((s) => s.id === SECTION)!
      .items.find((i) => i.id === item.id)!;
    expect(back.meta.creditRoles).toBeUndefined();
    expect(back.meta.creditRolesSource).toBeUndefined();
    expect(parsed.display.showCreditRoles).toBe(false); // default OFF
  });
});

describe("creditRolesHtml", () => {
  const item = (meta: Partial<CvItem["meta"]>): CvItem => ({
    ...firstCitation(makeCv()),
    meta: { ...meta },
  });

  it("returns '' without roles", () => {
    expect(creditRolesHtml(item({}), "en-US")).toBe("");
    expect(creditRolesHtml(item({ creditRoles: [] }), "en-US")).toBe("");
  });

  it("renders the localised names with a provenance title (self vs Crossref)", () => {
    const self = creditRolesHtml(
      item({ creditRoles: ["conceptualization", "formal-analysis"], creditRolesSource: "self" }),
      "en-US",
    );
    expect(self).toBe(
      '<span class="cv-credit" title="Self-declared">Roles: Conceptualization, Formal analysis</span>',
    );
    const cr = creditRolesHtml(
      item({ creditRoles: ["software"], creditRolesSource: "crossref" }),
      "fr-FR",
    );
    expect(cr).toContain('title="D’après les métadonnées de l’éditeur (Crossref)"');
    expect(cr).toContain("Rôles : Logiciel");
  });

  it("has a real (non-English-copy) name for every role in every locale", () => {
    const en = renderStrings("en-US");
    for (const locale of SUPPORTED_LOCALES) {
      const s = renderStrings(locale);
      for (const role of CREDIT_ROLES) expect(s.creditRoles[role].trim().length).toBeGreaterThan(0);
      if (locale !== "en-US") {
        // At least most labels must differ from the English ones ("Software" is a
        // legitimate loan word in several languages, so allow a few identical).
        const same = CREDIT_ROLES.filter((r) => s.creditRoles[r] === en.creditRoles[r]).length;
        expect(same).toBeLessThan(4);
      }
    }
  });
});

describe.skipIf(!hasApa)("renderCvHtml — CRediT roles line", () => {
  it("is OFF by default and ON with display.showCreditRoles", () => {
    const base = makeCv();
    const item = firstCitation(base);
    const cv = withMeta(base, item.id, {
      creditRoles: ["methodology", "writing-review-editing"],
      creditRolesSource: "crossref",
    });
    const off = renderCvHtml(cv);
    // (The `.cv-credit` CSS rule is always in the stylesheet; assert on the markup.)
    expect(off).not.toContain('class="cv-credit"');
    const on = renderCvHtml({ ...cv, display: { ...cv.display, showCreditRoles: true } });
    expect(on).toContain(
      '<span class="cv-credit" title="From publisher metadata (Crossref)">Roles: Methodology, Writing – review &amp; editing</span>',
    );
    // Only the one work carries roles → exactly one line.
    expect(on.match(/class="cv-credit"/g)).toHaveLength(1);
  });
});
