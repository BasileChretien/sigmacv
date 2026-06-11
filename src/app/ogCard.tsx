import type { ReactElement } from "react";

/**
 * Shared layout + font plumbing for the site-wide Open Graph / social-share
 * cards (the root `opengraph-image` and its per-locale variant). The design
 * mirrors the homepage hero: deep indigo brand gradient with soft glows, the Σ
 * medallion wordmark, and a white CV-document mock with the signature
 * identifier-driven self-name highlight, ringed by open-data source chips.
 *
 * Satori (next/og) renders this — only flexbox layout and a CSS subset are
 * available, and theme CSS variables don't exist here, so the brand ramp from
 * `globals.css` is mirrored as constants.
 */

/** Standard OG card size (also exported as `size` by the image routes). */
export const OG_SIZE = { width: 1200, height: 630 };

/* Brand accent ramp — mirrors --accent-* in globals.css. */
const ACCENT_100 = "#dce6ff";
const ACCENT_200 = "#b9ccff";
const ACCENT_300 = "#8eabff";
const ACCENT_400 = "#5e82f7";
const ACCENT_500 = "#3a5fe6";
const ACCENT_600 = "#2b4fd6";

/** Open-data source names shown as chips (brand proper nouns, never translated). */
const SOURCE_CHIPS = ["ORCID", "OpenAlex", "Crossref", "DataCite"];

/** Floating pills over the CV mock (echoes the hero graphic's source chips). */
const FLOATING_CHIPS: { label: string; style: Record<string, string | number> }[] = [
  { label: "ORCID", style: { top: 30, left: -26 } },
  { label: "OpenAlex", style: { top: 208, right: -30 } },
  { label: "Crossref", style: { bottom: 54, left: -38 } },
];

/**
 * Every latin glyph the card renders besides the localized copy — callers add
 * this to the font-subset request so chips/wordmark never fall back to tofu.
 */
export const OG_CARD_GLYPHS = `SigmaCV Σ sigmacv.org ${SOURCE_CHIPS.join(" ")}`;

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 800;
  style: "normal";
}

/**
 * Fetch one Google-font weight subset (only `text`'s glyphs) as TTF data for
 * satori. The old UA makes Google serve truetype (satori can't read woff2).
 * Returns null on any failure so the caller can fall back to the default font.
 */
async function loadFontWeight(
  family: string,
  weight: 400 | 800,
  text: string,
): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await fetch(url, {
      headers: {
        // Old UA → Google returns a truetype URL (satori cannot use woff2).
        "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
      },
    }).then((r) => r.text());
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match) return null;
    return await fetch(match[1]!).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Best-effort load of the regular + extra-bold subsets used by the card.
 * Failures (e.g. no network at build) yield an empty array — the card then
 * renders with satori's default font instead of crashing.
 */
export async function loadOgFonts(family: string, text: string): Promise<OgFont[]> {
  // Include the uppercased copy: the eyebrow renders with text-transform:
  // uppercase, and glyphs missing from the subset would fall back mid-word.
  const subset = `${text} ${text.toUpperCase()} ${OG_CARD_GLYPHS}`;
  const [regular, bold] = await Promise.all([
    loadFontWeight(family, 400, subset),
    loadFontWeight(family, 800, subset),
  ]);
  const fonts: OgFont[] = [];
  if (regular) fonts.push({ name: family, data: regular, weight: 400, style: "normal" });
  if (bold) fonts.push({ name: family, data: bold, weight: 800, style: "normal" });
  return fonts;
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

/** Skeleton bar inside the CV mock (greys mirror the neutral ramp). */
function Bar({
  width,
  color = "#e9eaee",
  grow,
}: {
  width?: number | string;
  color?: string;
  grow?: boolean;
}) {
  return (
    <div
      style={{
        height: 9,
        borderRadius: 5,
        background: color,
        ...(width !== undefined ? { width } : {}),
        ...(grow ? { flexGrow: 1 } : {}),
      }}
    />
  );
}

/** The accent "self-name highlight" bar — the brand's signature detail. */
function HighlightBar({ width }: { width: number }) {
  return (
    <div
      style={{
        width,
        height: 9,
        borderRadius: 5,
        background: `linear-gradient(90deg, ${ACCENT_500}, ${ACCENT_400})`,
      }}
    />
  );
}

export interface SiteOgCardProps {
  /** Small uppercase line above the title (the localized landing eyebrow). */
  eyebrow: string;
  /** Big headline (the localized hero title). */
  title: string;
  /** Supporting line (the localized hero sub; truncated to fit the card). */
  sub: string;
  /** Font family to render with (loaded via `loadOgFonts`, or a fallback). */
  fontFamily: string;
}

/** The 1200×630 site-wide share card. */
export function SiteOgCard({ eyebrow, title, sub, fontFamily }: SiteOgCardProps): ReactElement {
  const titleSize = title.length > 75 ? 44 : title.length > 45 ? 52 : 60;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#101b45",
        color: "#ffffff",
        fontFamily,
      }}
    >
      {/* Deep brand gradient + soft glows (the hero's backdrop). */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e2f6e 0%, #18255f 45%, #0d1538 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -240,
          right: -140,
          width: 640,
          height: 640,
          background:
            "radial-gradient(circle at 50% 50%, rgba(94,130,247,0.42) 0%, rgba(94,130,247,0) 68%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -240,
          left: -160,
          width: 560,
          height: 560,
          background:
            "radial-gradient(circle at 50% 50%, rgba(43,79,214,0.5) 0%, rgba(43,79,214,0) 70%)",
        }}
      />
      {/* Top accent hairline. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 6,
          background: `linear-gradient(90deg, ${ACCENT_300} 0%, ${ACCENT_500} 45%, rgba(94,130,247,0) 100%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          padding: "52px 64px",
        }}
      >
        {/* Left column: brand → headline → source chips. Both columns get
            explicit widths: satori/yoga's default flex-shrink is 0, so a
            grow-based split lets long text push the doc mock off-canvas. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 722,
            paddingRight: 36,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 58,
                height: 58,
                borderRadius: 15,
                background: `linear-gradient(135deg, ${ACCENT_400}, ${ACCENT_600})`,
                boxShadow: "0 10px 30px rgba(58,95,230,0.5)",
                fontSize: 34,
                fontWeight: 800,
              }}
            >
              Σ
            </div>
            <div style={{ marginLeft: 18, fontSize: 36, fontWeight: 800, letterSpacing: -0.5 }}>
              SigmaCV
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                lineHeight: 1.35,
                color: ACCENT_300,
                marginBottom: 16,
              }}
            >
              {eyebrow}
            </div>
            <div
              style={{
                fontSize: titleSize,
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: -1.5,
              }}
            >
              {title}
            </div>
            <div
              style={{
                marginTop: 18,
                fontSize: 23,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {truncate(sub, 200)}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            {SOURCE_CHIPS.map((name) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  marginRight: 10,
                  padding: "7px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  fontSize: 16,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                {name}
              </div>
            ))}
            <div style={{ display: "flex", flexGrow: 1 }} />
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 0.5, color: ACCENT_200 }}>
              sigmacv.org
            </div>
          </div>
        </div>

        {/* Right: the CV-document mock with self-name highlights + floating chips. */}
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 350,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 13,
              width: 320,
              height: 472,
              padding: 26,
              borderRadius: 20,
              background: "#ffffff",
              boxShadow: "0 30px 80px rgba(5,10,30,0.55)",
              transform: "rotate(3.5deg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  background: `linear-gradient(135deg, ${ACCENT_100}, ${ACCENT_200})`,
                  fontSize: 24,
                  fontWeight: 800,
                  color: ACCENT_600,
                }}
              >
                Σ
              </div>
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
                <div
                  style={{
                    width: 140,
                    height: 14,
                    borderRadius: 7,
                    background: `linear-gradient(90deg, ${ACCENT_500}, ${ACCENT_400})`,
                  }}
                />
                <div
                  style={{
                    marginTop: 8,
                    width: 96,
                    height: 9,
                    borderRadius: 5,
                    background: "#d3d6dd",
                  }}
                />
              </div>
            </div>

            <div style={{ height: 2, width: "100%", background: "#eef0f4" }} />

            <Bar width={88} color={ACCENT_200} />
            <div style={{ display: "flex", gap: 6 }}>
              <Bar width={58} color="#e4e6eb" />
              <HighlightBar width={92} />
              <Bar grow color="#e4e6eb" />
            </div>
            <Bar width="100%" />
            <Bar width="72%" />

            <div style={{ height: 4 }} />
            <Bar width={70} color={ACCENT_200} />
            <Bar width="100%" />
            <div style={{ display: "flex", gap: 6 }}>
              <Bar grow color="#e4e6eb" />
              <HighlightBar width={80} />
              <Bar width={40} color="#e4e6eb" />
            </div>
            <Bar width="60%" />
          </div>

          {FLOATING_CHIPS.map(({ label, style }) => (
            <div
              key={label}
              style={{
                display: "flex",
                position: "absolute",
                padding: "8px 15px",
                borderRadius: 999,
                background: "#ffffff",
                border: `1px solid ${ACCENT_100}`,
                boxShadow: "0 10px 28px rgba(5,10,30,0.45)",
                fontSize: 16,
                fontWeight: 800,
                color: ACCENT_600,
                ...style,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
