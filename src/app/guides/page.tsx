import type { Metadata } from "next";
import GuidesIndex from "@/components/GuidesIndex";
import { guidesChrome } from "@/lib/i18n/guidesChrome";
import { guidesIndexLanguageAlternates } from "@/lib/seo";

const chrome = guidesChrome("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: chrome.guidesIndexTitle,
  description: chrome.guidesIndexDescription,
  alternates: { canonical: "/guides", languages: guidesIndexLanguageAlternates() },
};

export default function GuidesPage() {
  return <GuidesIndex />;
}
