import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import Landing from "@/components/Landing";
import { DEFAULT_UI_LOCALE, NON_DEFAULT_LOCALE_SLUGS, localeForSlug } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { homeLanguageAlternates, ogAlternateLocales, ogLocale } from "@/lib/seo";

/**
 * Localized homepage: a real, crawlable URL per language (/fr, /de, …) so
 * search engines can index each language with correct hreflang. The default
 * (en-US) lives at "/" — only the non-default slugs are generated here.
 */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = landingStrings(loc);
  return {
    title: { absolute: s.metaTitle },
    description: s.metaDescription,
    alternates: { canonical: `/${slug}`, languages: homeLanguageAlternates() },
    openGraph: {
      title: s.metaTitle,
      description: s.metaDescription,
      url: `/${slug}`,
      locale: ogLocale(loc),
      alternateLocale: ogAlternateLocales(loc),
    },
  };
}

export default async function LocaleHome({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  // The default locale is served at "/", not "/en".
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();

  const session = await auth();
  if (session?.user) redirect("/cv");

  return <Landing locale={loc} />;
}
