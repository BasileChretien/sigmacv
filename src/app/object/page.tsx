import type { Metadata } from "next";
import ObjectionPage from "@/components/ObjectionPage";
import { objectionStrings } from "@/lib/i18n/objection";
import { objectLanguageAlternates } from "@/lib/seo";

const s = objectionStrings("en-US");

export const metadata: Metadata = {
  title: s.metaTitle,
  description: s.heading,
  alternates: { canonical: "/object", languages: objectLanguageAlternates() },
};

export default function ObjectPage() {
  return <ObjectionPage locale="en-US" />;
}
