import { ImageResponse } from "next/og";
import { landingStrings } from "@/lib/i18n/landing";
import { OG_SIZE, SiteOgCard, loadOgFonts } from "./ogCard";

/**
 * Open Graph / social-share card (1200×630), generated at build/runtime via
 * Next's ImageResponse — no binary asset to commit. English is used for the
 * shared card; the layout lives in the shared `SiteOgCard` (the per-locale
 * variant renders the same card with localized copy). Inter is fetched as a
 * small glyph subset best-effort — on failure the default font still renders.
 */
export const alt = "SigmaCV — Free academic CV generator from ORCID & OpenAlex";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
  const s = landingStrings("en-US");
  const family = "Inter";
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
