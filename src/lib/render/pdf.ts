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
  async render({ cv }: RenderInput): Promise<RenderResult> {
    if (activeRenders >= PDF_CONCURRENCY_LIMIT) {
      throw new PdfBusyError();
    }
    activeRenders += 1;
    // The decrement MUST bracket everything after the increment — a throw from
    // renderCvHtml or chromium.launch (both before the browser exists) would
    // otherwise leak a slot and, after PDF_CONCURRENCY_LIMIT such errors,
    // permanently wedge PDF export.
    try {
      const html = renderCvHtml(cv);
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
          margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" },
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
