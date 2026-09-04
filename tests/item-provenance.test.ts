import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { addManualEntry } from "@/lib/canonical/curate";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { itemProvenance, itemProvenanceHtml } from "@/lib/render/itemProvenance";
import { SOURCE_LABEL, sourceLabel } from "@/lib/render/sourceLabel";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({ id: "cv_prov", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}

/** A bare citation item (OpenAlex-sourced) with the given meta / source overrides. */
function item(over: Partial<CvItem> & { meta?: CvItem["meta"] } = {}): CvItem {
  return {
    id: "W1",
    source: "openalex",
    sourceId: "https://openalex.org/W1",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    ...over,
    meta: { ...(over.meta ?? {}) },
  };
}

describe("itemProvenance (pure)", () => {
  it("names the identifier match when the match basis is on the item", () => {
    expect(itemProvenance(item({ meta: { matchBasis: "orcid" } }), "en-US")).toEqual({
      label: "ORCID",
      title: "Matched to the owner by ORCID iD",
    });
    expect(itemProvenance(item({ meta: { matchBasis: "openalex-id" } }), "en-US")).toEqual({
      label: "OpenAlex ID",
      title: "Matched to the owner by OpenAlex author ID",
    });
    expect(itemProvenance(item({ meta: { matchBasis: "both" } }), "en-US")).toEqual({
      label: "ORCID + OpenAlex ID",
      title: "Matched to the owner by ORCID iD and OpenAlex author ID",
    });
    expect(itemProvenance(item({ meta: { matchBasis: "claimed" } }), "en-US")).toEqual({
      label: "Claimed",
      title: "Added by the owner by DOI — no identifier match on the record",
    });
  });

  it("falls back to the record's source when no match basis is present", () => {
    expect(itemProvenance(item(), "en-US")).toEqual({
      label: "OpenAlex",
      title: "Record from OpenAlex",
    });
    expect(itemProvenance(item({ source: "datacite" }), "en-US").label).toBe("DataCite");
    expect(itemProvenance(item({ source: "dblp" }), "en-US").title).toBe("Record from DBLP");
  });

  it("labels manual and derived items with the localized words, not raw keys", () => {
    expect(itemProvenance(item({ source: "manual" }), "en-US")).toEqual({
      label: "Manual",
      title: "Entered by the owner",
    });
    expect(itemProvenance(item({ source: "manual" }), "fr-FR").label).toBe("Manuel");
    const derived = itemProvenance(item({ source: "derived" }), "en-US");
    expect(derived.label).toBe("derived");
    expect(derived.title).toBe("Record from derived");
  });

  it("appends enrichment, verification, retraction, review and freshness fragments", () => {
    const full = itemProvenance(
      item({
        meta: {
          matchBasis: "orcid",
          enriched: true,
          verified: true,
          verifiedBy: "Nagoya University",
          retracted: true,
          reviewFlag: "name-matched",
          lastVerifiedAt: "2026-06-02T00:00:00.000Z",
        },
      }),
      "en-US",
    );
    expect(full.label).toBe("ORCID");
    const parts = full.title.split(" · ");
    expect(parts[0]).toBe("Matched to the owner by ORCID iD");
    expect(parts).toContain("metadata completed from Crossref");
    expect(parts.some((p) => p.includes("Nagoya University"))).toBe(true);
    expect(parts.some((p) => /retract/i.test(p))).toBe(true);
    expect(parts).toContain("flagged for the owner's review");
    expect(parts).toContain("last verified Jun 2, 2026");
  });

  it("uses the generic verified wording when no confirming organisation is known", () => {
    const blank = itemProvenance(item({ meta: { verified: true, verifiedBy: "  " } }), "en-US");
    expect(blank.title).not.toContain("  ");
    const generic = itemProvenance(item({ meta: { verified: true } }), "en-US");
    expect(generic.title).toBe(blank.title);
    expect(generic.title.split(" · ")).toHaveLength(2);
  });

  it("omits fragments whose flag is absent or false", () => {
    const none = itemProvenance(
      item({ meta: { enriched: false, verified: false, retracted: false } }),
      "en-US",
    );
    expect(none.title).toBe("Record from OpenAlex");
  });

  it("falls back to the ISO date part on an unparseable or unformattable timestamp", () => {
    const bad = itemProvenance(item({ meta: { lastVerifiedAt: "not-a-date" } }), "en-US");
    expect(bad.title).toContain("last verified not-a-date");
    // A malformed locale makes Intl throw → same ISO-date fallback, never a crash.
    const weird = itemProvenance(item({ meta: { lastVerifiedAt: "2026-06-02T00:00:00Z" } }), "x-!");
    expect(weird.title).toContain("last verified 2026-06-02");
  });

  it("localizes the mark (fr-FR)", () => {
    const fr = itemProvenance(item({ meta: { matchBasis: "claimed" } }), "fr-FR");
    expect(fr.label).toBe("Revendiqué");
    expect(fr.title).toMatch(/^Ajouté par le titulaire/);
  });
});

describe("itemProvenanceHtml", () => {
  it("renders a .cv-prov span with the escaped title and label", () => {
    const html = itemProvenanceHtml(
      item({ meta: { verified: true, verifiedBy: 'Univ <"A&B">' } }),
      "en-US",
    );
    expect(html).toMatch(/^<span class="cv-prov" title="[^"]*">OpenAlex<\/span>$/);
    expect(html).toContain("&lt;&quot;A&amp;B&quot;&gt;");
    expect(html).not.toContain('<"A&B">');
  });
});

describe("SOURCE_LABEL", () => {
  it("names every CvItem source (no raw key leaks into the provenance footer or mark)", () => {
    for (const key of [
      "openalex",
      "orcid",
      "oep",
      "datacite",
      "crossref",
      "openaire",
      "dblp",
      "ukri",
      "nih",
      "nsf",
      "clinicaltrials",
      "ctis",
      "ictrp",
      "epo",
      "derived",
      "manual",
      "bibtex",
    ]) {
      expect(SOURCE_LABEL[key], key).toBeTruthy();
    }
    expect(sourceLabel("openaire")).toBe("OpenAIRE");
    expect(sourceLabel("unknown-source")).toBe("unknown-source");
  });
});

describe.skipIf(!hasApa)("renderCvHtml readerMode option (needs vendored CSL assets)", () => {
  it("appends a provenance mark to every citation entry ONLY under opts.readerMode", () => {
    const cv = makeCv();
    const plain = renderCvHtml(cv);
    expect(plain).not.toContain('class="cv-prov"');
    const reader = renderCvHtml(cv, { readerMode: true });
    const marks = reader.match(/class="cv-prov"/g) ?? [];
    // One mark per rendered entry outside Positions/Education (those carry the
    // structured Verified mark instead).
    const cited = cv.sections
      .filter((s) => s.type !== "positions" && s.type !== "education")
      .flatMap((s) => s.items)
      .filter((it) => it.included && !it.notMine);
    expect(marks.length).toBeGreaterThan(0);
    expect(marks.length).toBe(cited.length);
    // The fixture works are identifier-matched, so the (unprojected) owner-side
    // render names the match basis; the public route renders the projection, where
    // the mark falls back to the record source (see the route test).
    expect(reader).toMatch(
      /title="Matched to the owner by [^"]*">(ORCID|OpenAlex ID|ORCID \+ OpenAlex ID)<\/span>/,
    );
  });

  it("marks a manual entry as such, and is a render option — no display toggle switches it on", () => {
    const withManual = addManualEntry(
      makeCv(),
      "publications",
      "Chrétien B. (2020). A manual note.",
      "man1",
    );
    const html = renderCvHtml(withManual, { readerMode: true });
    expect(html).toContain('title="Entered by the owner">Manual</span>');
    // Every display toggle on, no option → still no mark (exports never carry it).
    const allOn = {
      ...withManual,
      display: { ...withManual.display, showProvenance: true, allowReaderMode: true },
    };
    expect(renderCvHtml(allOn)).not.toContain('class="cv-prov"');
  });
});
