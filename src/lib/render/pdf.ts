import { chromium } from "playwright";
import { cvSlug, renderCvHtml } from "./html";
import type { Renderer, RenderInput, RenderResult } from "./types";

// Cap concurrent Chromium instances so a burst of export requests can't OOM the
// VPS. Excess requests fail fast rather than piling up browser processes.
const PDF_CONCURRENCY_LIMIT = 3;
const PDF_TIMEOUT_MS = 30_000;
let activeRenders = 0;

/** Thrown when the concurrent-render slots are full; the route maps it to 503. */
export class PdfBusyError extends Error {
  constructor() {
    super("PDF renderer is busy — please try again in a moment.");
    this.name = "PdfBusyError";
  }
}

/**
 * PDF renderer. Composes the HTML renderer (no separate pipeline) and prints
 * the result with headless Chromium via Playwright.
 *
 * Hardening: the render page runs with JavaScript disabled and under a strict
 * CSP (from the template), so any markup that slips through citeproc cannot
 * execute in the headless browser. Concurrency is capped and every step is
 * time-bounded.
 *
 * Requires a Chromium install: `npx playwright install chromium` locally, or
 * the Playwright base image in the Docker runtime.
 */
export const pdfRenderer: Renderer = {
  format: "pdf",
  async render({ cv, opts }: RenderInput): Promise<RenderResult> {
    if (activeRenders >= PDF_CONCURRENCY_LIMIT) {
      throw new PdfBusyError();
    }
    activeRenders += 1;
    // The decrement MUST bracket everything after the increment — a throw from
    // renderCvHtml or chromium.launch (both before the browser exists) would
    // otherwise leak a slot and, after PDF_CONCURRENCY_LIMIT such errors,
    // permanently wedge PDF export.
    try {
      const html = renderCvHtml(cv, opts);
      const browser = await chromium.launch({
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });
      try {
        // The CV is static HTML — no scripts needed, so disable JS entirely.
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();
        await page.setContent(html, {
          waitUntil: "load",
          timeout: PDF_TIMEOUT_MS,
        });
        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
          // Vertical page margin only; the horizontal gutter is owned by the
          // template's `.cv` box (max-width + side padding) so the printed text
          // column is pixel-identical to the editor preview (which renders the
          // same `.cv` at A4 width). Matches `@page { margin: 16mm 0 }` in the
          // shared template CSS. Left/right 0 → `.cv`'s auto margins centre it.
          margin: { top: "16mm", bottom: "16mm", left: "0", right: "0" },
          // Accessibility: emit a TAGGED PDF (structure tree from the HTML's
          // headings/lists/links + the document's `<html lang>`) plus a document
          // outline, so screen readers and "reflow" can navigate the CV. The
          // source HTML is already semantic (h1/h2, lang on <html>), so the tags
          // are meaningful rather than a flat blob.
          tagged: true,
          outline: true,
        });
        return {
          format: "pdf",
          mimeType: "application/pdf",
          filename: `${cvSlug(cv.owner.displayName)}-cv.pdf`,
          buffer: Buffer.from(pdf),
        };
      } finally {
        await browser.close();
      }
    } finally {
      activeRenders -= 1;
    }
  },
};
