import { ImageResponse } from "next/og";
import { NON_DEFAULT_LOCALE_SLUGS, localeForSlug, type Locale } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { OG_SIZE, SiteOgCard, loadOgFonts } from "../ogCard";

/**
 * Per-locale Open Graph / social-share card (1200×630). Renders the shared
 * `SiteOgCard` layout with each non-default locale's copy (the default "/"
 * card lives in the root opengraph-image). Non-Latin scripts (zh/ja/ko/ru)
 * need a font with the right glyphs, so a SUBSET of the appropriate Noto
 * family is fetched for exactly the characters used (small, cached). Font
 * loading is best-effort: if it fails (e.g. no network at build), we fall
 * back to the default font rather than crash — the card still renders.
 */
export const alt = "SigmaCV — Free academic CV generator from ORCID & OpenAlex";
export const size = OG_SIZE;
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

type Params = { params: Promise<{ locale: string }> };

export default async function LocaleOpengraphImage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug) ?? "en-US";
  const s = landingStrings(loc);
  const family = fontFamilyFor(loc);
  const fonts = await loadOgFonts(family, `${s.heroTitle} ${s.heroSub} ${s.eyebrow}`);
  return new ImageResponse(
    <SiteOgCard
      eyebrow={s.eyebrow}
      title={s.heroTitle}
      sub={s.heroSub}
      fontFamily={fonts.length ? family : "sans-serif"}
    />,
    { ...size, ...(fonts.length ? { fonts } : {}) },
  );
}
