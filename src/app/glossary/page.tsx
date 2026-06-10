import type { Metadata } from "next";
import GlossaryIndex from "@/components/GlossaryIndex";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { glossaryIndexLanguageAlternates } from "@/lib/seo";

const chrome = guidesChrome("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: chrome.glossaryIndexTitle,
  description: chrome.glossaryIndexDescription,
  alternates: { canonical: "/glossary", languages: glossaryIndexLanguageAlternates() },
};

export default function GlossaryPage() {
  return <GlossaryIndex />;
}
