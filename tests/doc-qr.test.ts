import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { qrGifBuffer, qrSvg } from "@/lib/cv/qrSvg";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { editorUi } from "@/lib/i18n/editorUi";
import { renderStrings } from "@/lib/i18n/render";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { docQrFooter } from "@/lib/render/templates/shared";
import type { CanonicalCv } from "@/lib/canonical/schema";

const PUBLIC_URL = "https://sigmacv.org/p/abc-def";

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "docqr",
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

describe("display.showDocQr schema flag", () => {
  it("defaults OFF on a freshly built CV (opt-in)", () => {
    expect(makeCv().display.showDocQr).toBe(false);
  });
});

describe("qrGifBuffer", () => {
  it("returns a non-empty GIF buffer", () => {
    const buf = qrGifBuffer(PUBLIC_URL);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    // GIF magic bytes ("GIF8") — qrcode-generator emits a GIF data-URL.
    expect(buf.toString("ascii", 0, 4)).toBe("GIF8");
  });

  it("is deterministic for the same input", () => {
    expect(qrGifBuffer(PUBLIC_URL).equals(qrGifBuffer(PUBLIC_URL))).toBe(true);
  });
});

describe("docQrFooter (HTML)", () => {
  it("renders nothing on the export path (no publicPageUrl)", () => {
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    expect(docQrFooter(optedIn)).toBe("");
    expect(docQrFooter(optedIn, {})).toBe("");
  });

  it("renders nothing when the owner has not opted in, even with a public URL", () => {
    // showDocQr defaults false → no QR even though the page is published.
    expect(docQrFooter(makeCv(), { publicPageUrl: PUBLIC_URL })).toBe("");
  });

  it("renders the QR + label + link when opted in and the page is published", () => {
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    const html = docQrFooter(optedIn, { publicPageUrl: PUBLIC_URL });
    expect(html).toContain('class="cv-qr"');
    expect(html).toContain('class="cv-qr-img"');
    expect(html).toContain("<svg"); // the inline QR
    expect(html).toContain(renderStrings("en-US").liveVersionLabel); // "Live version"
    expect(html).toContain(`href="${PUBLIC_URL}"`);
    expect(html).toContain("sigmacv.org/p/abc-def"); // human-readable displayUrl
  });

  it("encodes ONLY the public URL in the QR (no PII / tokens)", () => {
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    const html = docQrFooter(optedIn, { publicPageUrl: PUBLIC_URL });
    // The QR SVG is generated straight from the URL — byte-identical to qrSvg(url).
    expect(html).toContain(qrSvg(PUBLIC_URL));
    // No ORCID or other identifiers leak into the footer markup.
    expect(html).not.toContain("0000-0002-7483-2489");
  });

  it("is omitted on the ATS template (kept noise-free for parsers)", () => {
    const ats = updateDisplay(makeCv(), { showDocQr: true, template: "ats" });
    expect(docQrFooter(ats, { publicPageUrl: PUBLIC_URL })).toBe("");
  });

  it("localizes the 'Live version' label", () => {
    const fr = updateDisplay(makeCv(), { showDocQr: true, locale: "fr-FR" });
    const html = docQrFooter(fr, { publicPageUrl: PUBLIC_URL });
    expect(html).toContain(renderStrings("fr-FR").liveVersionLabel); // "Version en ligne"
  });

  it("defines a non-empty liveVersionLabel + docQr editor strings for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      expect(renderStrings(loc).liveVersionLabel.length).toBeGreaterThan(0);
      expect(editorUi(loc).docQrLabel.length).toBeGreaterThan(0);
      expect(editorUi(loc).docQrHint.length).toBeGreaterThan(0);
    }
  });
});

describe.skipIf(!hasApa)("doc QR in the full rendered document", () => {
  it("HTML: present only when opted in + published", () => {
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    expect(renderCvHtml(optedIn, { publicPageUrl: PUBLIC_URL })).toContain('class="cv-qr"');
    // No URL (export path) → no QR.
    expect(renderCvHtml(optedIn)).not.toContain('class="cv-qr"');
    // Not opted in → no QR even with a URL.
    expect(renderCvHtml(makeCv(), { publicPageUrl: PUBLIC_URL })).not.toContain('class="cv-qr"');
  });

  it("Markdown: appends a 'Live version' autolink only when opted in + published", () => {
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    const md = renderCvMarkdown(optedIn, { publicPageUrl: PUBLIC_URL });
    expect(md).toContain(`${renderStrings("en-US").liveVersionLabel}: <${PUBLIC_URL}>`);
    // Off paths.
    expect(renderCvMarkdown(optedIn)).not.toContain(PUBLIC_URL);
    expect(renderCvMarkdown(makeCv(), { publicPageUrl: PUBLIC_URL })).not.toContain(PUBLIC_URL);
    // ATS template → omitted.
    const ats = updateDisplay(optedIn, { template: "ats" });
    expect(renderCvMarkdown(ats, { publicPageUrl: PUBLIC_URL })).not.toContain(PUBLIC_URL);
  });

  it("LaTeX: emits \\qrcode + the qrcode package only when opted in + published", () => {
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    const tex = renderCvLatex(optedIn, { publicPageUrl: PUBLIC_URL });
    expect(tex).toContain("\\usepackage{qrcode}");
    expect(tex).toContain("\\qrcode[height=2.2cm]{https://sigmacv.org/p/abc-def}");
    expect(tex).toContain("\\url{https://sigmacv.org/p/abc-def}");
    // Off paths.
    expect(renderCvLatex(optedIn)).not.toContain("\\qrcode");
    expect(renderCvLatex(makeCv(), { publicPageUrl: PUBLIC_URL })).not.toContain("\\qrcode");
    // ATS template → omitted.
    const ats = updateDisplay(optedIn, { template: "ats" });
    expect(renderCvLatex(ats, { publicPageUrl: PUBLIC_URL })).not.toContain("\\qrcode");
  });

  it("LaTeX: strips any user:pass@ credentials from the QR URL (defense-in-depth)", () => {
    // publicPageUrl is system-generated and never carries userinfo, but the QR URL
    // is run through safeHref before emission so a credential can never reach the
    // \qrcode{} / \url{} output even if one somehow appeared.
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    const tex = renderCvLatex(optedIn, {
      publicPageUrl: "https://user:pass@sigmacv.org/p/abc-def",
    });
    expect(tex).toContain("\\qrcode[height=2.2cm]{https://sigmacv.org/p/abc-def}");
    expect(tex).toContain("\\url{https://sigmacv.org/p/abc-def}");
    expect(tex).not.toContain("user:pass");
    expect(tex).not.toContain("pass@");
  });

  it("LaTeX: also emits the QR in the two-column sidebar layout", () => {
    const sidebar = updateDisplay(makeCv(), { showDocQr: true, template: "sidebar" });
    const tex = renderCvLatex(sidebar, { publicPageUrl: PUBLIC_URL });
    expect(tex).toContain("\\usepackage{qrcode}");
    expect(tex).toContain("\\qrcode[height=2.2cm]{https://sigmacv.org/p/abc-def}");
  });

  it("DOCX: embeds the QR (larger buffer) only when opted in + published", async () => {
    // The embedded QR GIF + URL paragraph adds hundreds of bytes; the ZIP container
    // is otherwise byte-stable up to ~1 byte of deflate jitter, so the off-paths are
    // compared with a small tolerance and the QR delta with a wide margin.
    const optedIn = updateDisplay(makeCv(), { showDocQr: true });
    const withQr = await renderCvDocxBuffer(optedIn, { publicPageUrl: PUBLIC_URL });
    const withoutQr = await renderCvDocxBuffer(optedIn);
    const notOptedIn = await renderCvDocxBuffer(makeCv(), { publicPageUrl: PUBLIC_URL });
    expect(withQr.length).toBeGreaterThan(withoutQr.length + 200);
    expect(Math.abs(notOptedIn.length - withoutQr.length)).toBeLessThanOrEqual(8);
    // ATS template → no QR image, ~same size as the off path (well below `withQr`).
    const ats = updateDisplay(optedIn, { template: "ats" });
    const atsBuf = await renderCvDocxBuffer(ats, { publicPageUrl: PUBLIC_URL });
    const atsOff = await renderCvDocxBuffer(updateDisplay(makeCv(), { template: "ats" }));
    expect(Math.abs(atsBuf.length - atsOff.length)).toBeLessThanOrEqual(8);
    expect(withQr.length).toBeGreaterThan(atsBuf.length + 200);
  });
});
