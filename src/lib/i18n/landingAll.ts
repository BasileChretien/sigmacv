import { asLocale } from "./index";
import {
  LANDING_PAGE_IDS,
  type LandingPageId,
  type LandingPageStrings,
  landingPageStrings,
} from "./landingPages";
import { LANDING_RELATED, type LandingPageContent, landingPageContent } from "./landingContent";
import {
  PERSONA_PAGE_IDS,
  PERSONA_RELATED,
  type PersonaPageId,
  personaPageContent,
  personaPageStrings,
} from "./personaPages";

/**
 * Facade over the two landing-page families: the original 7 SEO pages
 * (`landingPages.ts` + `landingContent.ts`) and the persona pages
 * (`personaPages.ts`). Routes, the sitemap, and the shared `LandingPage`
 * component go through these accessors so personas are first-class without
 * touching — or risking a regression in — the existing pages.
 */

export type AnyLandingPageId = LandingPageId | PersonaPageId;

/** Every landing-page id (original SEO pages + persona pages). */
export const ALL_LANDING_PAGE_IDS: readonly AnyLandingPageId[] = [
  ...LANDING_PAGE_IDS,
  ...PERSONA_PAGE_IDS,
];

function isPersona(id: AnyLandingPageId): id is PersonaPageId {
  return (PERSONA_PAGE_IDS as readonly string[]).includes(id);
}

/** Thin localized copy for any landing/persona page. */
export function anyLandingPageStrings(page: AnyLandingPageId, locale: string): LandingPageStrings {
  return isPersona(page) ? personaPageStrings(page, locale) : landingPageStrings(page, locale);
}

/** Deep localized content for any landing/persona page. */
export function anyLandingPageContent(page: AnyLandingPageId, locale: string): LandingPageContent {
  return isPersona(page) ? personaPageContent(page, locale) : landingPageContent(page, locale);
}

/** Related-page ids (hub-and-spoke) for any landing/persona page. */
export function anyLandingRelated(page: AnyLandingPageId): readonly AnyLandingPageId[] {
  return isPersona(page) ? PERSONA_RELATED[page] : LANDING_RELATED[page];
}

/** True if the id is a valid landing/persona page (for route validation). */
export function isLandingPageId(id: string): id is AnyLandingPageId {
  return (ALL_LANDING_PAGE_IDS as readonly string[]).includes(id);
}

void asLocale;
