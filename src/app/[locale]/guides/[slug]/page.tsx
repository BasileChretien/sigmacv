import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidePage from "@/components/GuidePage";
import { GUIDE_AUTHOR, GUIDE_SLUGS, getGuide } from "@/lib/guides/guides";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { guideLanguageAlternates, localeGuidePath } from "@/lib/seo";

/** Localized cornerstone guides (/fr/guides/{slug}, …), static per locale × slug. */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string; slug: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.flatMap((locale) =>
    GUIDE_SLUGS.map((slug) => ({ locale, slug })),
  );
}

type Params = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: localeSlug, slug } = await params;
  const loc = localeForSlug(localeSlug);
  if (!loc) return {};
  const guide = getGuide(slug, loc);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: localeGuidePath(slug, loc),
      languages: guideLanguageAlternates(slug),
    },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: localeGuidePath(slug, loc),
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
      authors: [GUIDE_AUTHOR.name],
    },
  };
}

export default async function LocaleGuideRoute({ params }: Params) {
  const { locale: localeSlug, slug } = await params;
  const loc = localeForSlug(localeSlug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  const guide = getGuide(slug, loc);
  if (!guide) notFound();
  return <GuidePage guide={guide} locale={loc} />;
}
