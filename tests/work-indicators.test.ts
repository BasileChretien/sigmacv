import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { workIndicators } from "@/lib/render/workIndicators";
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

function makeCv() {
  return buildCanonicalCv({ id: "cv_ind", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}

/** Overwrite meta on every publication item (immutable). */
function withMeta(cv: CanonicalCv, meta: Partial<CvItem["meta"]>): CanonicalCv {
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) => ({ ...it, meta: { ...it.meta, ...meta } })),
    })),
  };
}

function firstItem(cv: CanonicalCv): CvItem {
  return cv.sections[0]!.items[0]!;
}

describe("workIndicators", () => {
  const data = { rcr: 1.84, fwci: 1.26, clinicalCitations: 4, isClinical: true, apt: 0.9 };

  it("is empty when the toggle is off, whatever the item carries", () => {
    const cv = withMeta(makeCv(), data);
    expect(workIndicators(firstItem(cv), cv.display)).toEqual([]);
  });

  it("is empty when the toggle is on but the item carries no data", () => {
    const cv = updateDisplay(
      withMeta(makeCv(), {
        rcr: undefined,
        fwci: undefined,
        clinicalCitations: undefined,
        isClinical: undefined,
      }),
      { showWorkIndicators: true },
    );
    expect(workIndicators(firstItem(cv), cv.display)).toEqual([]);
  });

  it("formats each indicator (locale-aware) with a responsible-reading title", () => {
    const cv = updateDisplay(withMeta(makeCv(), data), { showWorkIndicators: true });
    const out = workIndicators(firstItem(cv), cv.display);
    expect(out.map((i) => i.key)).toEqual(["rcr", "fwci", "clinicalCitations", "clinical"]);
    expect(out[0]).toMatchObject({ label: "RCR", value: "RCR 1.8" });
    expect(out[0]!.title).toMatch(/iCite/);
    expect(out[1]).toMatchObject({ label: "FWCI", value: "FWCI 1.3" });
    expect(out[1]!.title).toMatch(/OpenAlex/);
    expect(out[2]).toMatchObject({
      label: "Clinical citations",
      value: "cited by 4 clinical articles",
    });
    expect(out[3]).toMatchObject({ label: "Clinical article", value: "Clinical article" });
    // APT is stored but deliberately never displayed (a model prediction).
    expect(out.some((i) => /apt/i.test(i.key) || /0\.9/.test(i.value))).toBe(false);
  });

  it("uses the singular form for exactly one clinical citation and hides a zero", () => {
    const one = updateDisplay(withMeta(makeCv(), { clinicalCitations: 1 }), {
      showWorkIndicators: true,
    });
    expect(workIndicators(firstItem(one), one.display).map((i) => i.value)).toContain(
      "cited by 1 clinical article",
    );
    const zero = updateDisplay(withMeta(makeCv(), { clinicalCitations: 0, isClinical: false }), {
      showWorkIndicators: true,
    });
    expect(
      workIndicators(firstItem(zero), zero.display).filter(
        (i) => i.key === "clinicalCitations" || i.key === "clinical",
      ),
    ).toEqual([]);
  });

  it("renders decimals in the CV's own locale", () => {
    const cv = updateDisplay(withMeta(makeCv(), { rcr: 1.84 }), {
      showWorkIndicators: true,
      locale: "de-DE",
    });
    expect(workIndicators(firstItem(cv), cv.display)[0]!.value).toBe("RCR 1,8");
  });
});

describe.skipIf(!hasApa)("HTML per-work indicator badges (needs vendored CSL assets)", () => {
  it("appear only when `showWorkIndicators` is on", () => {
    const base = withMeta(makeCv(), { rcr: 1.84, clinicalCitations: 4 });
    const off = renderCvHtml(base);
    expect(off).not.toContain("cv-badge-indicator");
    expect(off).not.toContain("RCR 1.8");

    const on = renderCvHtml(updateDisplay(base, { showWorkIndicators: true }));
    expect(on).toContain('data-indicator="rcr"');
    expect(on).toContain(">RCR 1.8</span>");
    expect(on).toContain(">cited by 4 clinical articles</span>");
    // The pill carries its caveat as a title (escaped).
    expect(on).toMatch(/cv-badge-indicator[^>]*title="[^"]*NIH iCite/);
  });

  it("escapes the value and title", () => {
    const cv = updateDisplay(withMeta(makeCv(), { fwci: 2 }), { showWorkIndicators: true });
    const html = renderCvHtml(cv);
    expect(html).toContain(">FWCI 2.0</span>");
    expect(html).not.toContain("<script");
  });
});
