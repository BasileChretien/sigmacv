import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Accessibility from "@/components/Accessibility";
import {
  DEFAULT_UI_LOCALE,
  NON_DEFAULT_LOCALE_SLUGS,
  localeForSlug,
} from "@/lib/i18n";
import { accessibilityStrings } from "@/lib/i18n/accessibility";
import {
  accessibilityLanguageAlternates,
  localeAccessibilityPath,
} from "@/lib/seo";

/** Localized Accessibility page (/fr/accessibility, /ja/accessibility, …) — a
 *  crawlable URL per language with reciprocal hreflang. The default (en-US)
 *  lives at "/accessibility". */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = accessibilityStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: {
      canonical: localeAccessibilityPath(loc),
      languages: accessibilityLanguageAlternates(),
    },
  };
}

export default async function LocaleAccessibilityPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <Accessibility locale={loc} />;
}
