import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingPage from "@/components/LandingPage";
import { LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { getHeadTermMeta, type HeadTermPageId, headTermStrings } from "@/lib/i18n/headTermPages";
import { localeLandingPagePath } from "@/lib/seo";

/**
 * Builds the route exports for one native head-term page (I1). Each head-term
 * page is single-locale: it only exists at `/{loc}/{native-slug}` for its own
 * language (e.g. /fr/cv-academique), so `generateStaticParams` emits just that one
 * locale and `dynamicParams = false` 404s every other locale. Rendering reuses the
 * shared `LandingPage` (the `landingAll` facade resolves the native copy by id).
 *
 * Keeps the 9 route files to four one-line re-exports each — no duplicated logic.
 */
type Params = { params: Promise<{ locale: string }> };

export function makeHeadTermRoute(slug: HeadTermPageId) {
  const meta = getHeadTermMeta(slug);
  const localeSlug = LOCALE_SLUGS[meta.locale];

  function generateStaticParams(): { locale: string }[] {
    return [{ locale: localeSlug }];
  }

  async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { locale } = await params;
    if (locale !== localeSlug) return {};
    const s = headTermStrings(slug);
    return {
      // The root layout's title template appends " — SigmaCV".
      title: s.metaTitle,
      description: s.metaDescription,
      alternates: { canonical: localeLandingPagePath(slug, meta.locale) },
    };
  }

  async function Page({ params }: Params) {
    const { locale } = await params;
    if (localeForSlug(locale) !== meta.locale) notFound();
    return <LandingPage page={slug} locale={meta.locale} />;
  }

  return { generateStaticParams, generateMetadata, Page };
}
