import { ImageResponse } from "next/og";
import type { OgImageProps } from "@/lib/cv/ogImage";
import { readableOn } from "@/lib/cv/badgeSvg";
import { BADGE_PNG_DISPLAY, BADGE_PNG_SCALE } from "@/lib/cv/emailSignature";

/**
 * Outlook-safe raster of the "Living CV" badge for an email signature
 * (`/p/<slug>/badge.png`). A horizontal profile card — initials avatar tinted by
 * the CV accent, name, headline, and a "Living CV · synced <month>" footer.
 *
 * Why a PNG (not the SVG badge): classic Outlook for Windows renders no SVG
 * `<img>`. This mirrors the per-CV OG card's approach exactly — Satori/Resvg via
 * `next/og`, default/system fonts only (no remote fetch), all display branching
 * in the tested `ogImageProps` helper; this file is presentation-only JSX.
 *
 * Rendered at `BADGE_PNG_SCALE`× the logical display size so it stays crisp on
 * hi-DPI mail clients (the signature `<img>` pins width/height to the 1× size).
 */

/** Rendered pixel size = logical display size × the hi-DPI scale. */
const W = BADGE_PNG_DISPLAY.width * BADGE_PNG_SCALE;
const H = BADGE_PNG_DISPLAY.height * BADGE_PNG_SCALE;
/** Inner content width available to the text column (canvas − padding − avatar). */
const TEXT_MAX = 700;

/** rgba() tint from a 6-digit hex accent (for the avatar gradient). */
function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Trim to `max` chars on a word boundary when possible, adding an ellipsis. */
function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}…`;
}

/** Single-line text style: clip with an ellipsis inside the text column. */
const lineClamp = {
  maxWidth: TEXT_MAX,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

export interface EmailBadgeArgs {
  props: OgImageProps;
  /** Right-hand brand label (e.g. "Living CV"). */
  label: string;
  /** Coarse "<Month YYYY>" freshness suffix, or "" when unknown. */
  synced: string;
}

/** Render the email-signature badge PNG for a (public-projected) CV's props. */
export function renderEmailBadge({ props, label, synced }: EmailBadgeArgs): ImageResponse {
  const accent = props.accentColor;
  const onAccent = readableOn(accent);
  const name = truncate(props.name, 30);
  const headline = truncate(props.headline || props.affiliation, 44);
  const footer = synced ? `${label} · synced ${synced}` : label;
  const nameSize = name.length > 22 ? 34 : 40;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        boxSizing: "border-box",
        padding: "0 30px",
        background: "#ffffff",
        border: "2px solid #e3e7ec",
        borderRadius: 26,
        fontFamily: "sans-serif",
        color: "#1a1d24",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 124,
          height: 124,
          borderRadius: 999,
          flexShrink: 0,
          background: `linear-gradient(135deg, ${accent} 0%, ${rgba(accent, 0.78)} 100%)`,
          color: onAccent,
          fontSize: 56,
          fontWeight: 700,
        }}
      >
        {props.initials}
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginLeft: 30, flexGrow: 1 }}>
        <div
          style={{
            fontSize: nameSize,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -0.5,
            ...lineClamp,
          }}
        >
          {name}
        </div>
        {headline ? (
          <div style={{ marginTop: 8, fontSize: 25, color: "#5b626e", ...lineClamp }}>
            {headline}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: accent }}>Σ</div>
          <div style={{ marginLeft: 9, fontSize: 24, color: "#8a909c", ...lineClamp }}>
            {footer}
          </div>
        </div>
      </div>
    </div>,
    { width: W, height: H },
  );
}
