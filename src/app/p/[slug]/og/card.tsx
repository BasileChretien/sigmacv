import { ImageResponse } from "next/og";
import type { OgImageProps } from "@/lib/cv/ogImage";

/**
 * The per-CV Open Graph card layout (1200×630): a light, modern profile card
 * tinted by the CV's accent colour — initials avatar, name/headline/affiliation,
 * Σ watermark, and the SigmaCV wordmark. All display branching lives in the
 * tested `ogImageProps` helper; this is intentionally presentation-only JSX.
 *
 * Only default/system fonts are used — no remote font fetch — so the card stays
 * self-contained and fast (route comment explains the caching/rate limiting).
 */

export const CV_OG_SIZE = { width: 1200, height: 630 };

/** rgba() tint from the schema-validated 6-digit hex accent. */
function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function renderCvOgImage({
  name,
  initials,
  headline,
  affiliation,
  accentColor,
}: OgImageProps): ImageResponse {
  const accent = accentColor;
  const nameSize = name.length > 26 ? 56 : 70;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#fbfcfe",
        color: "#171a21",
        fontFamily: "sans-serif",
      }}
    >
      {/* Accent hairline, soft glows, and a Σ watermark — tinted by the CV's accent. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 8,
          background: `linear-gradient(90deg, ${accent} 0%, ${rgba(accent, 0.25)} 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -220,
          right: -160,
          width: 560,
          height: 560,
          background: `radial-gradient(circle at 50% 50%, ${rgba(accent, 0.14)} 0%, ${rgba(accent, 0)} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -260,
          left: -180,
          width: 520,
          height: 520,
          background: `radial-gradient(circle at 50% 50%, ${rgba(accent, 0.08)} 0%, ${rgba(accent, 0)} 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: -150,
          fontSize: 430,
          fontWeight: 700,
          lineHeight: 1,
          color: rgba(accent, 0.06),
        }}
      >
        Σ
      </div>

      <div
        style={{
          display: "flex",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "56px 72px",
        }}
      >
        {/* Brand row. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 46,
                height: 46,
                borderRadius: 12,
                background: accent,
                color: "#ffffff",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              Σ
            </div>
            <div style={{ marginLeft: 14, fontSize: 27, fontWeight: 700, color: "#1a1d24" }}>
              SigmaCV
            </div>
          </div>
          <div style={{ fontSize: 21, color: "#8a909c" }}>sigmacv.org</div>
        </div>

        {/* Profile: initials avatar + name / headline / affiliation. */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 132,
              borderRadius: 999,
              background: `linear-gradient(135deg, ${rgba(accent, 1)} 0%, ${rgba(accent, 0.72)} 100%)`,
              boxShadow: `0 18px 50px ${rgba(accent, 0.35)}`,
              color: "#ffffff",
              fontSize: 54,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: 40, flexGrow: 1 }}>
            <div
              style={{
                fontSize: nameSize,
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: -1.5,
              }}
            >
              {name}
            </div>
            {headline ? (
              <div style={{ marginTop: 16, fontSize: 31, lineHeight: 1.3, color: "#4a505c" }}>
                {headline}
              </div>
            ) : null}
            {affiliation ? (
              <div style={{ display: "flex", alignItems: "center", marginTop: 14 }}>
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 999,
                    background: accent,
                    marginRight: 11,
                  }}
                />
                <div style={{ fontSize: 25, color: "#8a909c" }}>{affiliation}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer: accent flourish + a quiet latin label (not locale copy). */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              width: 130,
              height: 7,
              borderRadius: 4,
              background: `linear-gradient(90deg, ${accent} 0%, ${rgba(accent, 0.25)} 100%)`,
            }}
          />
          <div style={{ fontSize: 18, letterSpacing: 3, color: "#aeb3bd" }}>CURRICULUM VITAE</div>
        </div>
      </div>
    </div>,
    CV_OG_SIZE,
  );
}
