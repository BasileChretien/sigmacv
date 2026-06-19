import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderStrings } from "@/lib/i18n/render";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { renderCvHtml } from "@/lib/render/html";
import { attributionFooter } from "@/lib/render/templates/shared";
import { SITE_URL } from "@/lib/siteUrl";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "attr",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A1"],
      displayName: "Basile Chrétien",
    },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

/** A CV WITH publications, so the reference-manager hint (which needs citation
 *  items to be meaningful) applies. */
function makeCvWithWorks(): CanonicalCv {
  return buildCanonicalCv({
    id: "attr-works",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
    },
    works: worksFixture as unknown as OpenAlexWork[],
    now: "2026-06-02T00:00:00.000Z",
  });
}

const hasApa = listAvailableStyles().includes("apa");

describe("attributionFooter", () => {
  it("defaults publicAttribution to ON in the schema", () => {
    // Additive default → the flag is true on every freshly built CV.
    expect(makeCv().display.publicAttribution).toBe(true);
  });

  it("renders the 'Made with SigmaCV' backlink when the caller opts in", () => {
    const html = attributionFooter(makeCv(), { attribution: true });
    expect(html).toContain('class="cv-attribution"');
    expect(html).toContain("Made with");
    expect(html).toContain("SigmaCV</a>");
    // Links to the site root (no nofollow — the backlink is wanted).
    expect(html).toContain(`href="${SITE_URL}"`);
    expect(html).not.toContain("nofollow");
  });

  it("includes a visible 'living CV' line with the last-synced date (public path only)", () => {
    const html = attributionFooter(makeCv(), { attribution: true });
    expect(html).toContain('class="cv-living"');
    expect(html).toContain("Updated"); // en-US livingNote prefix
    expect(html).toContain("2026"); // the formatted last-synced date
    // Absent on the export path (the whole footer is "").
    expect(attributionFooter(makeCv())).not.toContain("cv-living");
  });

  it("shows a 'save to your reference manager' hint when the page has publications (public only)", () => {
    const cv = makeCvWithWorks();
    const html = attributionFooter(cv, { attribution: true });
    expect(html).toContain('class="cv-refman"');
    expect(html).toContain(renderStrings("en-US").refManagerNote);
    // Off the export path (whole footer is "").
    expect(attributionFooter(cv)).not.toContain("cv-refman");
  });

  it("omits the reference-manager hint when there are no citation items", () => {
    // makeCv() has no works → a narrative-only page has nothing to save.
    expect(attributionFooter(makeCv(), { attribution: true })).not.toContain("cv-refman");
  });

  it("shows a 'What's new' strip whose items deep-link to the entry (public path only)", () => {
    const html = attributionFooter(makeCv(), {
      attribution: true,
      recentlyAdded: [
        { itemId: "W4300000001", title: "Brand new finding", sectionType: "publications" },
        {
          itemId: "publication:doi:10.5281/zenodo.1",
          title: "A fresh dataset",
          sectionType: "datasets",
        },
      ],
    });
    expect(html).toContain('class="cv-whatsnew"');
    expect(html).toContain(renderStrings("en-US").whatsNewLabel);
    // Each title is a same-page link to the entry's sanitized anchor.
    expect(html).toContain('<a href="#item-w4300000001">Brand new finding</a>');
    expect(html).toContain('<a href="#item-publication-doi-10-5281-zenodo-1">A fresh dataset</a>');
    // No strip when nothing was added.
    expect(attributionFooter(makeCv(), { attribution: true })).not.toContain("cv-whatsnew");
    // Off the export path entirely (the whole footer is "").
    expect(
      attributionFooter(makeCv(), {
        recentlyAdded: [{ itemId: "X", title: "X", sectionType: "publications" }],
      }),
    ).not.toContain("cv-whatsnew");
  });

  it("localizes the living-CV line", () => {
    const fr = updateDisplay(makeCv(), { locale: "fr-FR" });
    const html = attributionFooter(fr, { attribution: true });
    expect(html).toContain("Mis à jour le"); // fr-FR livingNote prefix
    expect(html).toContain('class="cv-living"');
  });

  it("omits the living-CV line when the CV has no sync timestamp", () => {
    const base = makeCv();
    const noSync: CanonicalCv = {
      ...base,
      provenance: { ...base.provenance, lastSyncedAt: undefined },
    };
    const html = attributionFooter(noSync, { attribution: true });
    expect(html).not.toContain("cv-living");
    expect(html).toContain('class="cv-attribution"'); // the backlink still renders
  });

  it("renders nothing when the attribution flag is absent (the export path)", () => {
    expect(attributionFooter(makeCv())).toBe("");
    expect(attributionFooter(makeCv(), {})).toBe("");
    expect(attributionFooter(makeCv(), { attribution: false })).toBe("");
  });

  it("renders nothing when the owner opted out, even on the public path", () => {
    const optedOut = updateDisplay(makeCv(), { publicAttribution: false });
    expect(attributionFooter(optedOut, { attribution: true })).toBe("");
  });

  it("uses the localized 'Made with' prefix while keeping SigmaCV untranslated", () => {
    const fr = updateDisplay(makeCv(), { locale: "fr-FR" });
    const html = attributionFooter(fr, { attribution: true });
    expect(html).toContain(renderStrings("fr-FR").madeWith); // "Créé avec"
    expect(html).toContain("SigmaCV"); // brand untranslated
  });

  it("defines a non-empty madeWith string for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      expect(renderStrings(loc).madeWith.length).toBeGreaterThan(0);
    }
  });
});

describe.skipIf(!hasApa)("attribution footer in the full rendered document", () => {
  it("appears only when renderCvHtml is called with { attribution: true }", () => {
    // Public living page passes the flag → footer + living line present.
    const pub = renderCvHtml(makeCv(), { attribution: true });
    expect(pub).toContain('class="cv-attribution"');
    expect(pub).toContain('class="cv-living"');
    expect(pub).toContain(`href="${SITE_URL}"`);

    // Export / default path passes no opts → unbranded, no footer, no living line.
    const exported = renderCvHtml(makeCv());
    expect(exported).not.toContain('class="cv-attribution"');
    expect(exported).not.toContain('class="cv-living"');
  });

  it("is absent on the public path when the owner opted out", () => {
    const optedOut = updateDisplay(makeCv(), { publicAttribution: false });
    const html = renderCvHtml(optedOut, { attribution: true });
    expect(html).not.toContain('class="cv-attribution"');
  });
});
