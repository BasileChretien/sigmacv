import { describe, expect, it } from "vitest";
import { CV_MODELS } from "@/lib/canonical/cvModels";
import {
  cvModelSourceDueOn,
  cvModelSourceNote,
  cvModelSources,
  isCvModelSourceDue,
  verifiedCvModelSources,
  type CvModelSource,
} from "@/lib/canonical/cvModelSources";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";

/**
 * The table of funder documents each CV model was read against: committed,
 * hand-verified data, checked here for shape (a reading has a real past date and
 * an https address) and for the rule that every French funder model has one.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const source = (over: Partial<CvModelSource> = {}): CvModelSource => ({
  document: "Guide",
  url: "https://funder.example/guide.pdf",
  lastVerified: "2026-10-16",
  ...over,
});

describe("CV model sources — the committed table", () => {
  const table = verifiedCvModelSources();

  it("names only models that exist, each with at least one document", () => {
    const ids = new Set(CV_MODELS.map((m) => m.id));
    expect(table.length).toBeGreaterThan(0);
    for (const [id, docs] of table) {
      expect(ids.has(id), id).toBe(true);
      expect(docs.length, id).toBeGreaterThan(0);
    }
  });

  it("gives every document a name, https addresses and a past reading date", () => {
    const now = Date.now();
    for (const [id, docs] of table) {
      for (const d of docs) {
        const where = `${id}: ${d.document}`;
        expect(d.document.trim().length, where).toBeGreaterThan(0);
        expect(new URL(d.url).protocol, where).toBe("https:");
        if (d.listedOn !== undefined) expect(new URL(d.listedOn).protocol, where).toBe("https:");
        expect(d.lastVerified, where).toMatch(ISO_DATE);
        expect(Date.parse(d.lastVerified), where).toBeLessThanOrEqual(now);
        if (d.recheckBy !== undefined) {
          expect(d.recheckBy, where).toMatch(ISO_DATE);
          expect(d.recheckBy > d.lastVerified, `${where} is due after it was read`).toBe(true);
        }
      }
    }
  });

  it("reads every French funder model against a document", () => {
    const french = CV_MODELS.filter((m) => m.region === "FR" && m.category === "grant");
    expect(french.map((m) => m.id).sort()).toEqual(["anr", "atip-avenir", "fondation-arc", "frm"]);
    for (const m of french) expect(cvModelSources(m.id).length, m.id).toBeGreaterThan(0);
  });
});

describe("cvModelSources", () => {
  it("is empty for a model never read against a document and for an unknown id", () => {
    expect(cvModelSources("nih")).toEqual([]);
    expect(cvModelSources("does-not-exist")).toEqual([]);
    // An inherited property name is not a model.
    expect(cvModelSources("constructor")).toEqual([]);
  });
});

describe("cvModelSourceDueOn / isCvModelSourceDue", () => {
  it("is the funder's expected day when one is recorded", () => {
    expect(cvModelSourceDueOn(source({ recheckBy: "2027-07-15" }))).toBe("2027-07-15");
  });

  it("is twelve months after the reading otherwise", () => {
    expect(cvModelSourceDueOn(source())).toBe("2027-10-16");
  });

  it("falls on 28 February for a reading on 29 February", () => {
    expect(cvModelSourceDueOn(source({ lastVerified: "2028-02-29" }))).toBe("2029-02-28");
  });

  it("is due from the start of its due day, UTC", () => {
    const s = source({ recheckBy: "2027-07-15" });
    expect(isCvModelSourceDue(s, new Date("2027-07-14T23:59:59Z"))).toBe(false);
    expect(isCvModelSourceDue(s, new Date("2027-07-15T00:00:00Z"))).toBe(true);
  });
});

describe("cvModelSourceNote", () => {
  it("is undefined for a model never read against a document", () => {
    expect(cvModelSourceNote("nih", new Date("2026-10-16T00:00:00Z"))).toBeUndefined();
  });

  it("lists the model's documents with the earliest reading, not yet due", () => {
    const note = cvModelSourceNote("anr", new Date("2026-10-16T12:00:00Z"));
    expect(note?.documents.map((d) => d.document)).toEqual(
      cvModelSources("anr").map((d) => d.document),
    );
    const earliest = cvModelSources("anr")
      .map((d) => d.lastVerified)
      .sort()[0];
    expect(note?.lastVerified).toBe(earliest);
    expect(note?.due).toBe(false);
  });

  it("is due once any of its readings is", () => {
    const due = cvModelSourceDueOn(cvModelSources("anr")[0]!);
    expect(cvModelSourceNote("anr", new Date(`${due}T00:00:00Z`))?.due).toBe(true);
  });
});

describe("the editor's source line strings", () => {
  it("carry {docs} and {date} exactly once in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const { modelSourceChecked, modelSourceDue } = editorUi(loc);
      expect(modelSourceChecked.split("{docs}").length - 1, loc).toBe(1);
      expect(modelSourceChecked.split("{date}").length - 1, loc).toBe(1);
      expect(modelSourceDue.trim().length, loc).toBeGreaterThan(0);
    }
  });
});
