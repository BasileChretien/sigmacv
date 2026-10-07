import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { OG_SIZE, siteOgImage } from "../ogCard";

/**
 * Per-locale Open Graph / social-share card (1200×630). Renders the shared
 * card with each non-default locale's copy (the default "/" card lives in the
 * root opengraph-image). Non-Latin scripts (zh/ja/ko/ru) need a font with the
 * right glyphs, so `siteOgImage` fetches a SUBSET of the appropriate Noto
 * family for exactly the characters used (small, cached). Font loading is
 * best-effort: if it fails (e.g. no network at build), the card is drawn from
 * what is on disk rather than crash — in English where the bundled font lacks
 * the script (zh/ja/ko).
 */
export const alt = "SigmaCV — Free academic CV generator from ORCID & OpenAlex";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export default async function LocaleOpengraphImage({ params }: Params) {
  const { locale: slug } = await params;
  return siteOgImage(localeForSlug(slug) ?? DEFAULT_UI_LOCALE);
}
