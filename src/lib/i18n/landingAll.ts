import { LANDING_RELATED, type LandingPageContent, landingPageContent } from "./landingContent";
import {
  LANDING_PAGE_IDS,
  type LandingPageId,
  type LandingPageStrings,
  landingPageStrings,
} from "./landingPages";
import {
  PERSONA_PAGE_IDS,
  PERSONA_RELATED,
  type PersonaPageId,
  personaPageContent,
  personaPageStrings,
} from "./personaPages";
import {
  type HeadTermPageId,
  headTermContent,
  headTermRelated,
  headTermStrings,
  isHeadTermPageId,
} from "./headTermPages";
import {
  TOPIC_PAGE_IDS,
  TOPIC_RELATED,
  type TopicPageId,
  topicPageContent,
  topicPageStrings,
} from "./topicPages";

/**
 * Facade over the three landing-page families: the original SEO pages
 * (`landingPages.ts` + `landingContent.ts`), the persona pages (`personaPages.ts`),
 * and the topic pages (`topicPages.ts`). Routes, the sitemap, and the shared
 * `LandingPage` component go through these accessors so every family is
 * first-class without touching — or risking a regression in — the others.
 */

export type AnyLandingPageId = LandingPageId | PersonaPageId | TopicPageId | HeadTermPageId;

/**
 * Every ×10 landing-page id (original SEO pages + persona pages + topic pages).
 * Head-term pages are deliberately EXCLUDED: they are single-locale, so they must
 * not be iterated ×10 by the sitemap/route logic — they're routed + sitemapped
 * separately. The `LandingPage` component still renders them via the accessors below.
 */
export const ALL_LANDING_PAGE_IDS: readonly AnyLandingPageId[] = [
  ...LANDING_PAGE_IDS,
  ...PERSONA_PAGE_IDS,
  ...TOPIC_PAGE_IDS,
];

function isPersona(id: AnyLandingPageId): id is PersonaPageId {
  return (PERSONA_PAGE_IDS as readonly string[]).includes(id);
}

function isTopic(id: AnyLandingPageId): id is TopicPageId {
  return (TOPIC_PAGE_IDS as readonly string[]).includes(id);
}

/** Thin localized copy for any landing/persona/topic/head-term page. */
export function anyLandingPageStrings(page: AnyLandingPageId, locale: string): LandingPageStrings {
  if (isHeadTermPageId(page)) return headTermStrings(page);
  if (isPersona(page)) return personaPageStrings(page, locale);
  if (isTopic(page)) return topicPageStrings(page, locale);
  return landingPageStrings(page, locale);
}

/** Deep localized content for any landing/persona/topic/head-term page. */
export function anyLandingPageContent(page: AnyLandingPageId, locale: string): LandingPageContent {
  if (isHeadTermPageId(page)) return headTermContent(page);
  if (isPersona(page)) return personaPageContent(page, locale);
  if (isTopic(page)) return topicPageContent(page, locale);
  return landingPageContent(page, locale);
}

/** Related-page ids (hub-and-spoke) for any landing/persona/topic/head-term page. */
export function anyLandingRelated(page: AnyLandingPageId): readonly AnyLandingPageId[] {
  if (isHeadTermPageId(page)) return headTermRelated(page);
  if (isPersona(page)) return PERSONA_RELATED[page];
  if (isTopic(page)) return TOPIC_RELATED[page];
  return LANDING_RELATED[page];
}

/** True if the id is a valid landing/persona/topic page (for route validation). */
export function isLandingPageId(id: string): id is AnyLandingPageId {
  return (ALL_LANDING_PAGE_IDS as readonly string[]).includes(id);
}
