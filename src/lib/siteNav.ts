import { t } from "@/lib/i18n";
import { accessibilityStrings } from "@/lib/i18n/accessibility";
import { contactStrings } from "@/lib/i18n/contact";
import { faqStrings } from "@/lib/i18n/faq";
import { fairCvStrings } from "@/lib/i18n/fairCv";
import { examplesNavLabel, glossaryNavLabel, guidesNavLabel } from "@/lib/i18n/guidesNav";
import { landingStrings } from "@/lib/i18n/landing";
import { principlesStrings } from "@/lib/i18n/principles";
import { transparencyStrings } from "@/lib/i18n/transparency";
import {
  localeAboutPath,
  localeAccessibilityPath,
  localeContactPath,
  localeFairPath,
  localeFaqPath,
  localeGlossaryIndexPath,
  localeGuidesIndexPath,
  localePrinciplesPath,
  localePrivacyPath,
  localeTransparencyPath,
} from "@/lib/seo";

/**
 * Single source of truth for the site-wide navigation, shared by the homepage
 * (`Landing`) and the `SiteHeader`/`SiteFooter` that wrap every other public
 * page — so the surfaces stay connected instead of each page being a dead end.
 * Pure (locale-keyed string builders), no React, so it's trivially unit-tested.
 */

export interface SiteNavLink {
  label: string;
  href: string;
}

/**
 * The compact top-bar links: the two content hubs (Guides, Examples) plus About.
 * Deliberately short so the header stays light; the footer carries the full set.
 */
export function siteHeaderLinks(locale: string): SiteNavLink[] {
  return [
    { label: guidesNavLabel(locale), href: localeGuidesIndexPath(locale) },
    { label: examplesNavLabel(locale), href: "/examples" },
    { label: landingStrings(locale).about, href: localeAboutPath(locale) },
  ];
}

/**
 * The full footer link set (privacy, contact, FAQ, guides, glossary, examples,
 * principles, FAIR, transparency, accessibility) — every secondary destination,
 * reachable from any page. Mirrors what the homepage footer has always shown.
 */
export function siteFooterLinks(locale: string): SiteNavLink[] {
  return [
    { label: t(locale, "privacy"), href: localePrivacyPath(locale) },
    { label: contactStrings(locale).heading, href: localeContactPath(locale) },
    { label: faqStrings(locale).navLabel, href: localeFaqPath(locale) },
    { label: guidesNavLabel(locale), href: localeGuidesIndexPath(locale) },
    { label: glossaryNavLabel(locale), href: localeGlossaryIndexPath(locale) },
    { label: examplesNavLabel(locale), href: "/examples" },
    { label: principlesStrings(locale).navLabel, href: localePrinciplesPath(locale) },
    { label: fairCvStrings(locale).navLabel, href: localeFairPath(locale) },
    { label: transparencyStrings(locale).navLabel, href: localeTransparencyPath(locale) },
    { label: accessibilityStrings(locale).navLabel, href: localeAccessibilityPath(locale) },
  ];
}
