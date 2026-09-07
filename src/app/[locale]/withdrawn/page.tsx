import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Withdrawn from "@/components/Withdrawn";
import { WITHDRAWN_PATH } from "@/lib/datacite/mint";
import {
  DEFAULT_UI_LOCALE,
  LOCALE_SLUGS,
  NON_DEFAULT_LOCALE_SLUGS,
  localeForSlug,
} from "@/lib/i18n";
import { withdrawnStrings } from "@/lib/i18n/withdrawn";

/** Localized DOI tombstone page (/fr/withdrawn, /ja/withdrawn, …). The default
 *  (en-US) lives at "/withdrawn" and is the URL a withdrawn DOI points at; the
 *  localized copies are reachable only by URL (nothing links to them — not the
 *  language switcher, not the tombstone). `noindex` like the default. */
export const dynamicParams = false;

export function generateStaticParams(): { locale: string }[] {
  return NON_DEFAULT_LOCALE_SLUGS.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  const s = withdrawnStrings(loc);
  return {
    // The root layout's title template appends " — SigmaCV".
    title: s.metaTitle,
    description: s.metaDescription,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${LOCALE_SLUGS[loc]}/${WITHDRAWN_PATH}` },
  };
}

export default async function LocaleWithdrawnPage({ params }: Params) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  return <Withdrawn locale={loc} />;
}
