import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ObjectionDone from "@/components/ObjectionDone";
import { parseObjectionOutcome } from "@/lib/auth/objectionOutcome";
import { DEFAULT_UI_LOCALE, localeForSlug } from "@/lib/i18n";
import { objectionStrings } from "@/lib/i18n/objection";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc) return {};
  return { title: objectionStrings(loc).metaTitle, robots: { index: false, follow: false } };
}

export default async function LocaleObjectDonePage({ params, searchParams }: Props) {
  const { locale: slug } = await params;
  const loc = localeForSlug(slug);
  if (!loc || loc === DEFAULT_UI_LOCALE) notFound();
  const q = await searchParams;
  return <ObjectionDone locale={loc} outcome={parseObjectionOutcome(q.outcome)} />;
}
