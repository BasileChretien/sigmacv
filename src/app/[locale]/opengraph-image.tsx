import { ImageResponse } from "next/og";
import { NON_DEFAULT_LOCALE_SLUGS, localeForSlug, type Locale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";

/**
 * Per-locale Open Graph / social-share card (1200×630). Localizes the card text
 * for each non-default locale (the default "/" card lives in the root
 * opengraph-image). Non-Latin scripts (zh/ja/ko/ru) need a font with the right
 * glyphs, so we fetch a SUBSET of the appropriate Noto family for exactly the
 * characters used (small, cached). Font loading is best-effort: if it fails
 * (e.g. no network at build), we fall back to the default font rather than
 * crash — the card still renders.
 */
export const alt = "SigmaCV — Free academic CV generator from ORCID & OpenAlex";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

/** Noto family that covers each locale's script (Latin + Cyrillic = Noto Sans). */
function fontFamilyFor(loc: Locale): string {
  if (loc === "zh-CN") return "Noto Sans SC";
  if (loc === "ja-JP") return "Noto Sans JP";
  if (loc === "ko-KR") return "Noto Sans KR";
  return "Noto Sans";
}

/**
 * Fetch a Google font subset (only `text`'s glyphs) as TTF data for satori.
 * The old UA makes Google serve truetype (satori can't read woff2). Returns
 * null on any failure so the caller can fall back to the default font.
 */
async function loadFontSubset(
  family: string,
  text: string,
): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@700&text=${encodeURIComponent(text)}`;
    const css = await fetch(url, {
      headers: {
        // Old UA → Google returns a truetype URL (satori cannot use woff2).
        "User-Agent":
          "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
      },
    }).then((r) => r.text());
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match) return null;
    return await fetch(match[1]!).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

type Params = { params: Promise<{ locale: string }> };

export default async function LocaleOpengraphImage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug) ?? "en-US";
  const s = landingStrings(loc);

  const title = s.heroTitle;
  const sub = s.heroSub;
  const eyebrow = s.eyebrow;
  const family = fontFamilyFor(loc);
  const fontData = await loadFontSubset(family, `SigmaCV ${title} ${sub} ${eyebrow}`);

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
          fontFamily: fontData ? family : "sans-serif",
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
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.12 }}>{title}</div>
          <div style={{ fontSize: 32, marginTop: 20, color: "rgba(255,255,255,0.9)" }}>
            {sub}
          </div>
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.8)" }}>{eyebrow}</div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? { fonts: [{ name: family, data: fontData, style: "normal", weight: 700 }] }
        : {}),
    },
  );
}
