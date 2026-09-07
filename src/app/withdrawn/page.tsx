import type { Metadata } from "next";
import Withdrawn from "@/components/Withdrawn";
import { WITHDRAWN_PATH } from "@/lib/datacite/mint";
import { withdrawnStrings } from "@/lib/i18n/withdrawn";

const s = withdrawnStrings("en-US");

/**
 * The DOI tombstone page (en-US). A withdrawn snapshot DOI resolves here; the
 * page is for DOI resolvers and the people who follow them, not for search —
 * hence `noindex`, no sitemap entry and no hreflang alternates (the localized
 * copies are reachable only by URL — they are not linked from the language
 * switcher — and are not for crawlers).
 */
export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  robots: { index: false, follow: false },
  alternates: { canonical: `/${WITHDRAWN_PATH}` },
};

export default function WithdrawnPage() {
  return <Withdrawn locale="en-US" />;
}
