import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { renderCvHtml } from "@/lib/render/html";
import { PDF_PAGE_MARGIN } from "@/lib/render/pdf";
import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * Locks in the WYSIWYG invariant: the exported PDF and the editor preview share
 * one page geometry, so they can't drift apart again.
 *
 * The horizontal gutter is owned by the template's `.cv` box (max-width + side
 * padding); the page margin is VERTICAL ONLY and lives in TWO places that must
 * agree — `pdf.ts` (`PDF_PAGE_MARGIN`, passed to Playwright) and the shared CSS
 * (`@page { margin: <v> 0 }`). If either grows a horizontal margin, or the two
 * verticals diverge, the PDF column stops matching the preview — these tests fail.
 */
const A4_WIDTH = Math.round((210 / 25.4) * 96); // 794

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "geom",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

/** Pull the `@page` margin shorthand out of the rendered document CSS. */
function pageMargin(html: string): { vertical: string; horizontal: string } {
  const shorthand = html.match(/@page\s*\{[^}]*\bmargin:\s*([^;}]+)/)?.[1]?.trim();
  if (!shorthand) throw new Error("no `@page { … margin: … }` rule found in the rendered CSS");
  // `margin: <v> <h>` (or a single value applying to both).
  const parts = shorthand.split(/\s+/);
  const vertical = parts[0];
  if (!vertical) throw new Error("empty `@page` margin shorthand");
  return { vertical, horizontal: parts[1] ?? vertical };
}

describe("PDF/preview page geometry stays in lockstep", () => {
  const css = pageMargin(renderCvHtml(makeCv()));

  it("keeps the page margin vertical-only (gutter must come from .cv, not the page)", () => {
    // pdf.ts side.
    expect(PDF_PAGE_MARGIN.left).toBe("0");
    expect(PDF_PAGE_MARGIN.right).toBe("0");
    expect(PDF_PAGE_MARGIN.top).toBe(PDF_PAGE_MARGIN.bottom);
    // CSS @page side.
    expect(css.horizontal).toBe("0");
  });

  it("matches the Playwright margin (pdf.ts) to the CSS @page margin", () => {
    // The same vertical value in both places — change one without the other and
    // the PDF's vertical rhythm no longer matches what the template intends.
    expect(css.vertical).toBe(PDF_PAGE_MARGIN.top);
  });
});

// End-to-end proof: render the real CV and confirm the print and screen `.cv`
// text columns are byte-identical at A4 width (so wrapping is identical). Needs a
// real browser; skipped (not failed) where Chromium isn't installed — e.g. a unit
// CI job that doesn't run `playwright install` — so it never reintroduces the very
// "PDF export 500s because Chromium is missing" failure this whole change started from.
const chromiumInstalled = (() => {
  try {
    return existsSync(chromium.executablePath());
  } catch {
    return false;
  }
})();

describe.skipIf(!chromiumInstalled)("print and screen .cv render identically (browser)", () => {
  it("has the same text-column width in print and screen media at A4 width", async () => {
    const html = renderCvHtml(makeCv());
    const b = await chromium.launch({ args: ["--no-sandbox"] });
    try {
      const p = await (await b.newContext({ javaScriptEnabled: false })).newPage();
      await p.setViewportSize({ width: A4_WIDTH, height: 1123 });
      const columnWidth = async (media: "screen" | "print") => {
        await p.emulateMedia({ media });
        await p.setContent(html, { waitUntil: "load" });
        return p.evaluate(() => {
          const cv = document.querySelector(".cv") as HTMLElement;
          const cs = getComputedStyle(cv);
          return Math.round(
            cv.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
          );
        });
      };
      const screen = await columnWidth("screen");
      const print = await columnWidth("print");
      expect(print).toBe(screen);
    } finally {
      await b.close();
    }
  }, 60_000);
});
