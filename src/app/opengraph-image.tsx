import { DEFAULT_UI_LOCALE } from "@/lib/i18n";
import { OG_SIZE, siteOgImage } from "./ogCard";

/**
 * Open Graph / social-share card (1200×630), generated at build/runtime via
 * Next's ImageResponse — no binary asset to commit. English is used for the
 * shared card; the per-locale variant renders the same card with localized
 * copy. `siteOgImage` fetches Inter as a small glyph subset, best-effort: when
 * it cannot, the card is drawn from what is on disk and still renders.
 */
export const alt = "SigmaCV — Free academic CV generator from ORCID & OpenAlex";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
  return siteOgImage(DEFAULT_UI_LOCALE);
}
