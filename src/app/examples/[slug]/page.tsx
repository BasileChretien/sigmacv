import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExamplePage from "@/components/ExamplePage";
import { EXAMPLE_SLUGS, getExample } from "@/lib/examples/examples";

/** The illustrative example CVs are a fixed, English-only set of static pages. */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return EXAMPLE_SLUGS.map((slug) => ({ slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const example = getExample(slug);
  if (!example) return {};
  return {
    // The root layout's title template appends " — SigmaCV".
    title: example.metaTitle,
    description: example.metaDescription,
    alternates: { canonical: `/examples/${slug}` },
  };
}

export default async function ExampleRoute({ params }: Params) {
  const { slug } = await params;
  const example = getExample(slug);
  if (!example) notFound();
  return <ExamplePage example={example} />;
}
