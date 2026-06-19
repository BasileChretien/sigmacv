"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ui } from "@/lib/i18n/ui";

interface CvPreviewProps {
  html: string;
  loading?: boolean;
  locale: string;
  /** Paper size — sets the preview width so it stays WYSIWYG with the PDF. */
  pageFormat?: "a4" | "letter";
}

/** A4 page width in CSS px (210mm at 96 px/in) — the width the PDF prints at, so
 *  rendering the preview iframe at exactly this width makes line-wrapping and
 *  layout WYSIWYG-identical to the exported PDF, independent of the pane width. */
export const A4_WIDTH_PX = (210 / 25.4) * 96; // ≈ 793.7
/** US Letter page width in CSS px (8.5in at 96 px/in). */
export const LETTER_WIDTH_PX = 8.5 * 96; // 816

/** The preview/paper width for a page format. */
export function pageWidthPx(pageFormat?: "a4" | "letter"): number {
  return pageFormat === "letter" ? LETTER_WIDTH_PX : A4_WIDTH_PX;
}

/** scale that fits a page of `pageWidth` into `availWidth`, never magnifying past 1:1. */
export function fitScale(availWidth: number, pageWidth: number = A4_WIDTH_PX): number {
  if (!(availWidth > 0)) return 1;
  return Math.min(1, availWidth / pageWidth);
}

export default function CvPreview({ html, loading, locale, pageFormat }: CvPreviewProps) {
  const u = ui(locale);
  const pageWidth = pageWidthPx(pageFormat);
  const containerRef = useRef<HTMLDivElement>(null);
  // The CV is rendered at a fixed A4 width and scaled to fit the pane (so the
  // preview matches the PDF), so we track the available content box of the pane.
  const [{ scale, height }, setBox] = useState<{ scale: number; height: number }>({
    scale: 1,
    height: 0,
  });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = (w: number, h: number) => setBox({ scale: fitScale(w, pageWidth), height: h });
    // Initial synchronous measure (content box = client size minus padding) so the
    // first paint is already correctly scaled — no unscaled flash on a narrow pane.
    const cs = getComputedStyle(el);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    apply(el.clientWidth - padX, el.clientHeight - padY);
    // Track pane resizes. Guarded: jsdom (and any environment without the API)
    // skips the observer and keeps the one-shot measure above.
    if (typeof ResizeObserver === "undefined") return;
    // contentRect already excludes padding, so it is the true available area.
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) apply(r.width, r.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageWidth]);

  return (
    <div className="cv-preview" ref={containerRef}>
      {html ? (
        // The "paper": a fixed-A4-width iframe scaled to fit, on a centred page
        // tile. The tile carries the page shadow/clip; the iframe fills it and
        // scrolls its (taller) content internally.
        <div
          className="cv-preview-page"
          style={{ width: pageWidth * scale, height: height || undefined }}
        >
          {/* Sandboxed iframe isolates the CV's own styles from the app chrome and
              keeps untrusted CV markup inert. NEVER add `allow-scripts`/
              `allow-same-origin` — those would re-enable script execution / parent
              access on the CV markup. `allow-popups` + `allow-popups-to-escape-sandbox`
              are required so a publication's DOI/URL link can open in a NEW TAB from
              inside the sandbox (a bare `sandbox=""` silently blocks the click); the
              opened tab escapes the sandbox so the destination loads as a normal page.
              Neither token grants the CV frame script or same-origin access. */}
          <iframe
            title={u.previewTitle}
            className={`cv-preview-frame${loading ? " is-loading" : ""}`}
            srcDoc={html}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            style={{
              width: pageWidth,
              // Unscaled height chosen so the scaled iframe fills the pane height
              // exactly; content past it scrolls inside the iframe.
              height: height ? height / scale : "100%",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      ) : (
        <div className="cv-preview-empty muted">
          {loading ? u.previewRendering : u.previewEmpty}
        </div>
      )}
    </div>
  );
}
