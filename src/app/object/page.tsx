import type { Metadata } from "next";
import ObjectionPage from "@/components/ObjectionPage";
import { objectionStrings } from "@/lib/i18n/objection";
import { objectLanguageAlternates } from "@/lib/seo";

// Rendered per request, NOT prerendered at build time: the page decides whether
// objections are available from PREVIEW_SUPPRESSION_KEY, which exists only in the
// running container (the image build has no secrets). A static render would bake
// "unavailable" into the HTML for the life of the image — as it did on 2026-09-09.
export const dynamic = "force-dynamic";

const s = objectionStrings("en-US");

export const metadata: Metadata = {
  title: s.metaTitle,
  description: s.heading,
  alternates: { canonical: "/object", languages: objectLanguageAlternates() },
};

export default function ObjectPage() {
  return <ObjectionPage locale="en-US" />;
}
