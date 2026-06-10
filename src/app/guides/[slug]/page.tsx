import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GuidePage from "@/components/GuidePage";
import { GUIDE_AUTHOR, GUIDE_SLUGS, getGuide } from "@/lib/guides/guides";
import { guideLanguageAlternates } from "@/lib/seo";

/** The default-locale (en-US) cornerstone guides, rendered as static pages. */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    // The root layout's title template appends " — SigmaCV".
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${slug}`, languages: guideLanguageAlternates(slug) },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `/guides/${slug}`,
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
      authors: [GUIDE_AUTHOR.name],
    },
  };
}

export default async function GuideRoute({ params }: Params) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuidePage guide={guide} />;
}
