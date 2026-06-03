import { ImageResponse } from "next/og";
import { landingStrings } from "@/lib/i18n/landing";

/**
 * Open Graph / social-share card (1200×630), generated at build/runtime via
 * Next's ImageResponse — no binary asset to commit. English is used for the
 * shared card (latin glyphs only, so the default font renders cleanly).
 */
export const alt = "SigmaCV — Free academic CV generator from ORCID & OpenAlex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const s = landingStrings("en-US");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #1f4fd8 0%, #11329e 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 44, fontWeight: 700 }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              marginRight: 24,
              borderRadius: 18,
              background: "rgba(255,255,255,0.16)",
              fontSize: 48,
            }}
          >
            Σ
          </span>
          SigmaCV
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
            Free academic CV generator
          </div>
          <div style={{ fontSize: 34, marginTop: 20, color: "rgba(255,255,255,0.88)" }}>
            Auto-built from ORCID &amp; OpenAlex · export PDF, DOCX, LaTeX, Markdown
          </div>
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.8)" }}>
          {s.eyebrow}
        </div>
      </div>
    ),
    size,
  );
}
