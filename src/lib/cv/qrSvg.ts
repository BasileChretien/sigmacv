import qrcode from "qrcode-generator";

/**
 * QR code (as a self-contained SVG) that encodes a CV's public page URL — for
 * conference posters, slides, and business cards. PURE + tested under the gate;
 * the route handler validates the slug, confirms the CV is published, and passes
 * the canonical absolute URL here.
 *
 * The library does only the hard part (Reed–Solomon encoding + masking); we render
 * the module matrix to SVG ourselves so the output is a clean, viewBox-scaled,
 * crisp-edged image with a proper quiet zone. The encoded text is a server-built
 * `https://…/p/<slug>` URL (slug already validated `^[a-z0-9][a-z0-9-]*$`), and it
 * goes into the QR matrix — never into the SVG markup — so there is nothing to
 * escape. QR needs high contrast to scan, so it is deliberately NOT themed:
 * near-black modules on white.
 */

/** Quiet zone in modules (the QR spec requires ≥4 for reliable scanning). */
const QUIET_ZONE = 4;

export function qrSvg(text: string): string {
  // typeNumber 0 = auto-pick the smallest version that fits; "M" = ~15% recovery.
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const dim = count + QUIET_ZONE * 2;

  // One path of 1×1 cells for every dark module (offset by the quiet zone).
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="img" aria-label="QR code linking to this CV">` +
    `<title>QR code linking to this CV</title>` +
    `<rect width="${dim}" height="${dim}" fill="#ffffff"/>` +
    `<path d="${path}" fill="#1f2328"/>` +
    `</svg>`
  );
}

/**
 * The same QR as a raster GIF Buffer (near-black on white) — for the DOCX export,
 * whose `docx` library embeds bitmaps, not SVG. Uses the library's own renderer
 * (`createDataURL`) so there is no extra image dependency. The first arg is px per
 * module; `QUIET_ZONE` modules of white margin keep it scannable on paper.
 */
export function qrGifBuffer(text: string): Buffer {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const dataUrl = qr.createDataURL(6, QUIET_ZONE);
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}
