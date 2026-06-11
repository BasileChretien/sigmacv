import type { Locale } from "./index";
import type { LandingPageContent } from "./landingContent";
import type { LandingPageId, LandingPageStrings } from "./landingPages";
import { HEAD_TERM_CONTENT, HEAD_TERM_STRINGS } from "./headTermContent";

/**
 * Native head-term landing pages (I1, Phase 7) — single-locale pages that target
 * each market's OWN search term for an academic CV (CV académique, wissenschaftlicher
 * Lebenslauf, 学术简历, アカデミックCV …) at a native-language URL, e.g. /fr/cv-academique.
 *
 * Unlike the other landing families these are NOT ×10: a "CV académique" page exists
 * only in French. Structure (native slug, target locale, cross-links) lives here in
 * `HEAD_TERM_META`; the native-first copy lives in `headTermContent.ts`. They reuse
 * the regular `LandingPageStrings` / `LandingPageContent` shapes and render through
 * the shared `LandingPage` component via the `landingAll` facade — but are kept OUT
 * of `ALL_LANDING_PAGE_IDS`, so the ×10 sitemap/route logic stays untouched; they get
 * their own single-locale routes (`makeHeadTermRoute`) and sitemap entries.
 *
 * Copy is machine-drafted and flagged for native review (incl. the chosen native term
 * and slug — e.g. a native speaker may prefer a different romanisation for the slug).
 */

/** Native URL slug for each head-term page (also its id). A const tuple → literal union. */
export const HEAD_TERM_PAGE_IDS = [
  "cv-academique", // fr
  "wissenschaftlicher-lebenslauf", // de
  "cv-academico", // es
  "cv-accademico", // it
  "curriculo-academico", // pt
  "akademicheskoe-rezume", // ru
  "xueshu-jianli", // zh
  "gakujutsu-cv", // ja
  "haksul-cv", // ko
] as const;
export type HeadTermPageId = (typeof HEAD_TERM_PAGE_IDS)[number];

export interface HeadTermMeta {
  /** Native URL slug == page id. */
  slug: HeadTermPageId;
  /** The single locale this page is served in. */
  locale: Locale;
  /** The native head term it targets (documentation + native-review aid). */
  headTerm: string;
  /** Hub-and-spoke cross-links to the (×10) landing pages. */
  related: readonly LandingPageId[];
}

const RELATED: readonly LandingPageId[] = [
  "academic-cv-template",
  "orcid-to-cv",
  "publication-list",
];

export const HEAD_TERM_META: Record<HeadTermPageId, HeadTermMeta> = {
  "cv-academique": {
    slug: "cv-academique",
    locale: "fr-FR",
    headTerm: "CV académique",
    related: RELATED,
  },
  "wissenschaftlicher-lebenslauf": {
    slug: "wissenschaftlicher-lebenslauf",
    locale: "de-DE",
    headTerm: "wissenschaftlicher Lebenslauf",
    related: RELATED,
  },
  "cv-academico": {
    slug: "cv-academico",
    locale: "es-ES",
    headTerm: "CV académico",
    related: RELATED,
  },
  "cv-accademico": {
    slug: "cv-accademico",
    locale: "it-IT",
    headTerm: "CV accademico",
    related: RELATED,
  },
  "curriculo-academico": {
    slug: "curriculo-academico",
    locale: "pt-BR",
    headTerm: "currículo acadêmico",
    related: RELATED,
  },
  "akademicheskoe-rezume": {
    slug: "akademicheskoe-rezume",
    locale: "ru-RU",
    headTerm: "академическое резюме",
    related: RELATED,
  },
  "xueshu-jianli": {
    slug: "xueshu-jianli",
    locale: "zh-CN",
    headTerm: "学术简历",
    related: RELATED,
  },
  "gakujutsu-cv": {
    slug: "gakujutsu-cv",
    locale: "ja-JP",
    headTerm: "アカデミックCV",
    related: RELATED,
  },
  "haksul-cv": { slug: "haksul-cv", locale: "ko-KR", headTerm: "학술 CV", related: RELATED },
};

/** True if `id` is a head-term page id. */
export function isHeadTermPageId(id: string): id is HeadTermPageId {
  return (HEAD_TERM_PAGE_IDS as readonly string[]).includes(id);
}

/** Structural meta for a head-term page. */
export function getHeadTermMeta(slug: HeadTermPageId): HeadTermMeta {
  return HEAD_TERM_META[slug];
}

/** Thin localized copy (native language) for a head-term page. */
export function headTermStrings(slug: HeadTermPageId): LandingPageStrings {
  return HEAD_TERM_STRINGS[slug];
}

/** Deep localized content (native language) for a head-term page. */
export function headTermContent(slug: HeadTermPageId): LandingPageContent {
  return HEAD_TERM_CONTENT[slug];
}

/** Hub-and-spoke related landing ids for a head-term page. */
export function headTermRelated(slug: HeadTermPageId): readonly LandingPageId[] {
  return HEAD_TERM_META[slug].related;
}
