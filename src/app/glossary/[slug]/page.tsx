import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GlossaryTermPage from "@/components/GlossaryTermPage";
import { GLOSSARY_SLUGS, getTerm } from "@/lib/glossary/glossary";

/** The glossary is a fixed, English-only set rendered as static pages. */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return GLOSSARY_SLUGS.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) return {};
  return {
    // The root layout's title template appends " — SigmaCV".
    title: term.title,
    description: term.description,
    alternates: { canonical: `/glossary/${slug}` },
  };
}

export default async function GlossaryRoute({ params }: Params) {
  const { slug } = await params;
  const term = getTerm(slug);
  if (!term) notFound();
  return <GlossaryTermPage term={term} />;
}
