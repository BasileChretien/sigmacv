import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { DEFAULT_UI_LOCALE, type Locale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { logger } from "@/lib/log";

/**
 * The site-wide Open Graph / social-share cards (the root `opengraph-image` and
 * its per-locale variant both return `siteOgImage`): layout, fonts, and the
 * variant drawn when the fonts could not be loaded. The design
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

/** What `truncate` ends a shortened line with. */
const ELLIPSIS = "…";

/**
 * Every glyph the card draws that is not in the localized copy handed to
 * `loadOgFonts`: the wordmark, the Σ, the source chips and the ellipsis of a
 * shortened line. They go into the font-subset request so that the fonts passed
 * to next/og cover the whole card. For a glyph they lack, next/og fetches a font
 * from Google Fonts itself, in requests that carry no time limit.
 */
const OG_CARD_GLYPHS = `SigmaCV Σ sigmacv.org ${SOURCE_CHIPS.join(" ")} ${ELLIPSIS}`;

/**
 * How long one weight's subset may take, style sheet and font file together
 * (a few hundred milliseconds is usual). A connection that stalls is not a
 * failure to Node's fetch, which waits up to 300 s for the headers and 300 s for
 * the body, while `next build` gives a prerendered card 60 s
 * (`staticPageGenerationTimeout`), three times, and then stops the build.
 */
const OG_FONT_TIMEOUT_MS = 5_000;

/**
 * The limit is counted in turns of the event loop this far apart, not read off
 * the clock. `next build` draws up to eight pages at once in one process, and
 * drawing a card keeps it busy for a second or more at a stretch, so a font that
 * arrived in 100 ms can wait several seconds to be read: on a 5 s clock that
 * wait dropped the fonts of four to six cards out of ten in an ordinary build.
 * However long the process was busy, it costs one turn, and each turn is
 * followed by a read of what has arrived. Ten cards loading at once need
 * thirty to forty turns, however slow each turn is; the limit is 250.
 *
 * `OG_FONT_TIMEOUT_MS` is therefore the least a stalled request is waited for:
 * a busy process waits longer, and the log line says how long. There is no
 * ceiling on the clock on purpose, since that would be the clock again.
 */
const OG_FONT_TURN_MS = 20;

export interface OgFont {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 800;
  style: "normal";
}

/**
 * The two requests behind one weight: Google's style sheet for the subset (only
 * `text`'s glyphs), then the font file it names, as TTF data for satori. Null
 * when either is answered with an error or the style sheet names no file;
 * throws on a network error or an abort.
 */
async function fetchFontWeight(
  family: string,
  weight: 400 | 800,
  text: string,
  signal: AbortSignal,
): Promise<ArrayBuffer | null> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const sheet = await fetch(url, {
    headers: {
      // Old UA → Google returns a truetype URL (satori cannot use woff2).
      "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
    },
    signal,
  });
  if (!sheet.ok) return null;
  const match = (await sheet.text()).match(/src:\s*url\(([^)]+)\)/);
  if (!match) return null;
  const file = await fetch(match[1]!, { signal });
  // An error page is not a font: satori throws on one, and the card with it.
  if (!file.ok) return null;
  return await file.arrayBuffer();
}

/**
 * One Google-font weight subset, or null on any failure so the caller can fall
 * back to the default font. A request still unanswered after
 * `OG_FONT_TIMEOUT_MS` (in turns of `OG_FONT_TURN_MS`) is such a failure: it is
 * aborted, and the answer does not wait for the abort to take effect.
 */
async function loadFontWeight(
  family: string,
  weight: 400 | 800,
  text: string,
): Promise<ArrayBuffer | null> {
  const controller = new AbortController();
  const started = Date.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<null>((resolve) => {
    let turnsLeft = OG_FONT_TIMEOUT_MS / OG_FONT_TURN_MS;
    const turn = (): void => {
      turnsLeft -= 1;
      if (turnsLeft > 0) {
        timer = setTimeout(turn, OG_FONT_TURN_MS);
        return;
      }
      controller.abort();
      // `siteOgImage` logs that a card went out without a font; this says why,
      // and how long the request was really waited for.
      logger.warn("og_card.font_timed_out", {
        family,
        weight,
        timeoutMs: OG_FONT_TIMEOUT_MS,
        waitedMs: Date.now() - started,
      });
      resolve(null);
    };
    timer = setTimeout(turn, OG_FONT_TURN_MS);
  });
  try {
    return await Promise.race([fetchFontWeight(family, weight, text, controller.signal), timedOut]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Best-effort load of the regular + extra-bold subsets used by the card, given
 * up after `OG_FONT_TIMEOUT_MS`. Failures (no network at build, a request that
 * stalls) yield an empty array, and `siteOgImage` then draws the card that needs
 * no font fetched.
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

/**
 * Per locale: the Google Fonts family that has its script (Inter for English,
 * Noto elsewhere), and whether the font next/og ships with can draw its copy
 * when that family could not be loaded. That font, Geist, has Latin and
 * Cyrillic, and no Chinese, Japanese or Korean.
 */
const OG_TYPE: Record<Locale, { family: string; bundledFontDraws: boolean }> = {
  "en-US": { family: "Inter", bundledFontDraws: true },
  "zh-CN": { family: "Noto Sans SC", bundledFontDraws: false },
  "es-ES": { family: "Noto Sans", bundledFontDraws: true },
  "fr-FR": { family: "Noto Sans", bundledFontDraws: true },
  "de-DE": { family: "Noto Sans", bundledFontDraws: true },
  "ja-JP": { family: "Noto Sans JP", bundledFontDraws: false },
  "pt-BR": { family: "Noto Sans", bundledFontDraws: true },
  "it-IT": { family: "Noto Sans", bundledFontDraws: true },
  "ko-KR": { family: "Noto Sans KR", bundledFontDraws: false },
  "ru-RU": { family: "Noto Sans", bundledFontDraws: true },
};

/**
 * The social card of one locale, as the response its route returns.
 *
 * With its fonts: the card as designed, in that locale's copy. One weight of
 * the two is enough for that, since each is asked for every glyph of the card.
 *
 * With none (Google Fonts refused, answered an error, or stayed silent past the
 * limit): a card that needs nothing fetched. next/og then draws in its bundled
 * font, and for any glyph that font lacks it fetches one from Google Fonts
 * itself, in requests that carry no time limit and cannot be given one: during
 * `next build` a stall there holds the card until Next stops the build. So the
 * Σ, which the bundled font lacks, is drawn (`SigmaMark`), and a locale whose
 * script it lacks gets the English copy. `tests/og-card-offline.test.tsx` draws
 * all ten cards this way through the real next/og, with every request refused
 * (a `data:` URL is let through: it reaches no network). It expects two requests
 * and no more, both to fonts.googleapis.com and both carrying an abort signal:
 * `loadOgFonts`'s own, the style sheet of each weight. A third request, one to
 * another host or one with no signal fails it.
 *
 * A prerendered card is served until the next build, and nothing in a green
 * build shows which variant it is: each departure from the design is logged.
 */
export async function siteOgImage(locale: Locale): Promise<ImageResponse> {
  const { family, bundledFontDraws } = OG_TYPE[locale];
  const copy = landingStrings(locale);
  const fonts = await loadOgFonts(family, `${copy.heroTitle} ${copy.heroSub} ${copy.eyebrow}`);
  if (fonts.length) {
    if (fonts.length === 1) {
      logger.warn("og_card.drawn_in_one_weight", { locale, weight: fonts[0]!.weight });
    }
    return new ImageResponse(
      <SiteOgCard
        eyebrow={copy.eyebrow}
        title={copy.heroTitle}
        sub={copy.heroSub}
        fontFamily={family}
      />,
      { ...OG_SIZE, fonts },
    );
  }
  logger.warn("og_card.drawn_without_fonts", { locale });
  const plain = bundledFontDraws ? copy : landingStrings(DEFAULT_UI_LOCALE);
  return new ImageResponse(
    <SiteOgCard
      eyebrow={plain.eyebrow}
      title={plain.heroTitle}
      sub={plain.heroSub}
      fontFamily="sans-serif"
      drawnSigma
    />,
    OG_SIZE,
  );
}

/** Trim to `max` chars on a word boundary when possible, adding an ellipsis. */
function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut;
  return `${head.trimEnd()}${ELLIPSIS}`;
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

/**
 * The Σ as a drawing: the mark of `public/icon.svg`, in the proportions it has
 * there (`size` is its 64-unit square, in pixels). For a card with no font
 * loaded, since the bundled one has no Σ.
 */
function SigmaMark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path
        d="M44 16H22.5l12.2 16L22 48h22"
        fill="none"
        stroke={color}
        strokeWidth={5.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SiteOgCardProps {
  /** Small uppercase line above the title (the localized landing eyebrow). */
  eyebrow: string;
  /** Big headline (the localized hero title). */
  title: string;
  /** Supporting line (the localized hero sub; truncated to fit the card). */
  sub: string;
  /** Font family to render with (loaded via `loadOgFonts`, or a fallback). */
  fontFamily: string;
  /** Draw the Σ instead of setting it as a glyph: no loaded font has one. */
  drawnSigma?: boolean;
}

/** The 1200×630 site-wide share card. */
function SiteOgCard({
  eyebrow,
  title,
  sub,
  fontFamily,
  drawnSigma = false,
}: SiteOgCardProps): ReactElement {
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
              {drawnSigma ? <SigmaMark size={58} color="#ffffff" /> : "Σ"}
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
                {drawnSigma ? <SigmaMark size={52} color={ACCENT_600} /> : "Σ"}
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
