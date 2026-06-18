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

  it("shows a 'What's new' strip from recentlyAdded (public path only)", () => {
    const html = attributionFooter(makeCv(), {
      attribution: true,
      recentlyAdded: [
        { title: "Brand new finding", sectionType: "publications" },
        { title: "A fresh dataset", sectionType: "datasets" },
      ],
    });
    expect(html).toContain('class="cv-whatsnew"');
    expect(html).toContain(renderStrings("en-US").whatsNewLabel);
    expect(html).toContain("Brand new finding · A fresh dataset");
    // No strip when nothing was added.
    expect(attributionFooter(makeCv(), { attribution: true })).not.toContain("cv-whatsnew");
    // Off the export path entirely (the whole footer is "").
    expect(
      attributionFooter(makeCv(), {
        recentlyAdded: [{ title: "X", sectionType: "publications" }],
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
