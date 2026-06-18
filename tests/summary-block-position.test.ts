import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderCvHtml } from "@/lib/render/html";
import { renderPublicCvHtml } from "@/lib/render/publicStyles";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

/** A CV with the full research-summary block enabled (metrics + chart + authorship
 *  + OA share), at the requested placement. */
function cvAt(
  summaryBlockPosition: CanonicalCv["display"]["summaryBlockPosition"],
  extra: Partial<CanonicalCv["display"]> = {},
): CanonicalCv {
  const base = buildCanonicalCv({ id: "s", resolved, works, now: "2026-06-02T00:00:00.000Z" });
  let toggle = false;
  return {
    ...base,
    owner: {
      ...base.owner,
      summary: "A researcher.",
      metrics: { ...base.owner.metrics, fwci_mean: 1.4, fwci_n: 95, h_index: 31 },
    },
    sections: base.sections.map((s) => ({
      ...s,
      items: s.items.map((it) => {
        toggle = !toggle;
        return { ...it, meta: { ...it.meta, oaIsOpen: toggle } };
      }),
    })),
    display: {
      ...base.display,
      showMetrics: true,
      metrics: ["fwci_mean", "h_index"],
      showOpenAccess: true,
      showCharts: true,
      showAuthorshipTable: true,
      authorshipRoles: ["first", "last"],
      summaryBlockPosition,
      ...extra,
    },
  };
}

describe("research-summary block placement (HTML)", () => {
  // NB: assert on MARKUP (`<div class="…">`), never the bare class — the always-
  // present stylesheet contains `.cv-summary-block` / `.cv-metrics` / `.cv-research`.
  const BLOCK = '<div class="cv-summary-block">';
  const METRICS = '<ul class="cv-metrics">';
  const RESEARCH = '<div class="cv-research">';
  const SECTION = '<section class="cv-section"';
  const MAIN = '<main class="cv-main">';

  it('default "header": block sits in the header, with NO heading wrapper', () => {
    const html = renderCvHtml(cvAt("header"));
    expect(html).toContain(METRICS);
    expect(html).toContain(RESEARCH);
    expect(html).not.toContain(BLOCK);
    // The metric strip precedes the first content section (it's in the header).
    expect(html.indexOf(METRICS)).toBeLessThan(html.indexOf(SECTION));
  });

  it('"top": block becomes its own labelled <div> BEFORE the first section', () => {
    const html = renderCvHtml(cvAt("top"));
    expect(html).toContain(BLOCK);
    // A <div>, never a <section> — the mascot binds hats by section:nth-of-type.
    expect(html).not.toContain('<section class="cv-summary-block"');
    expect(html).toContain('<h2 class="cv-summary-h">Research summary</h2>');
    expect(html.indexOf(BLOCK)).toBeLessThan(html.indexOf(SECTION));
    // It is inside <main>, not the header banner.
    expect(html.indexOf(MAIN)).toBeLessThan(html.indexOf(BLOCK));
  });

  it('"bottom": block renders AFTER the last section', () => {
    const html = renderCvHtml(cvAt("bottom"));
    expect(html).toContain(BLOCK);
    expect(html.indexOf(BLOCK)).toBeGreaterThan(html.lastIndexOf(SECTION));
  });

  it('"hidden": the block is absent everywhere', () => {
    const html = renderCvHtml(cvAt("hidden"));
    expect(html).not.toContain(BLOCK);
    expect(html).not.toContain(METRICS);
    expect(html).not.toContain(RESEARCH);
  });

  it("uses the user's custom heading when set, the localized default when blank", () => {
    expect(renderCvHtml(cvAt("top", { summaryHeading: "My numbers" }))).toContain(
      '<h2 class="cv-summary-h">My numbers</h2>',
    );
    expect(renderCvHtml(cvAt("top", { summaryHeading: "" }))).toContain(
      '<h2 class="cv-summary-h">Research summary</h2>',
    );
    // A blank-but-whitespace heading still falls back to the default.
    expect(renderCvHtml(cvAt("top", { summaryHeading: "   " }))).toContain(
      '<h2 class="cv-summary-h">Research summary</h2>',
    );
  });
});

describe("research-summary heading matches the section-title styling", () => {
  // The moved block stays a <div> (so it can't shift the mascot's section:nth-of-type
  // counting), which means its <h2> can't match `section.cv-section > h2` on its own.
  // Each template that restyles section headings must therefore GROUP the summary
  // heading into the same rule, so it shares the font / weight / case / colour.
  it("groups the summary heading into the section-heading rule for each template", () => {
    const classic = renderCvHtml(cvAt("top")); // classic is the default template
    expect(classic).toContain("section.cv-section > h2, .cv-summary-block > .cv-summary-h");

    const modern = renderCvHtml(cvAt("top", { template: "modern" }));
    expect(modern).toContain("section.cv-section > h2, .cv-summary-block > .cv-summary-h");

    const sidebar = renderCvHtml(cvAt("top", { template: "sidebar" }));
    expect(sidebar).toContain(
      ".cv-main section.cv-section > h2, .cv-main .cv-summary-block > .cv-summary-h",
    );
    // Sidebar's accent underline (drawn with ::after) is shared too.
    expect(sidebar).toContain(".cv-main .cv-summary-block > .cv-summary-h::after");
  });

  it("shares a public style's decorative heading pseudo-elements (skipping counter ::before)", () => {
    // A pseudo-heavy public style: both the marker (::before) and underline (::after)
    // decorations are grouped onto the moved summary heading for full parity.
    const cyber = renderPublicCvHtml(cvAt("top", { publicStyle: "cyberpunk" }));
    expect(cyber).toContain(
      "section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before",
    );
    expect(cyber).toContain(
      "section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after",
    );

    // Folio numbers its sections via a counter in ::before — the summary block is not
    // a numbered section, so its ::before is intentionally NOT grouped (no stray
    // numeral), while the underline ::after still matches.
    const folio = renderPublicCvHtml(cvAt("top", { publicStyle: "folio" }));
    expect(folio).toContain(
      "section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after",
    );
    expect(folio).not.toContain(".cv-summary-block > .cv-summary-h::before");
  });

  it("shares the scroll-reveal motion rule of a public style (not just the look)", () => {
    // The reveal animation is a COMMA-GROUPED rule; the summary heading must be in it
    // so it animates in like the section headings (and is reset under reduced-motion).
    const aura = renderPublicCvHtml(cvAt("top", { publicStyle: "aura" }));
    expect(aura).toContain(
      "section.cv-section > h2, .cv-summary-block > .cv-summary-h, .cv-prose-body > *",
    );
  });
});

describe("research-summary block — plain exports honour 'hidden'", () => {
  it("Markdown drops the metrics line when hidden", () => {
    expect(renderCvMarkdown(cvAt("header"))).toContain("Mean work FWCI");
    expect(renderCvMarkdown(cvAt("hidden"))).not.toContain("Mean work FWCI");
  });

  it("LaTeX drops the metrics + tables when hidden", () => {
    const shown = renderCvLatex(cvAt("header"));
    expect(shown).toContain("Mean work FWCI");
    const hidden = renderCvLatex(cvAt("hidden"));
    expect(hidden).not.toContain("Mean work FWCI");
  });

  it("DOCX still builds when hidden (block suppressed)", async () => {
    const buf = await renderCvDocxBuffer(cvAt("hidden"));
    expect(buf.length).toBeGreaterThan(0);
  });
});
