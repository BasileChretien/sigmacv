import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { landingPageStrings } from "@/lib/i18n/landingPages";
import { landingPageLanguageAlternates } from "@/lib/seo";

const PAGE = "orcid-to-cv" as const;
const s = landingPageStrings(PAGE, "en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: {
    canonical: `/${PAGE}`,
    languages: landingPageLanguageAlternates(PAGE),
  },
};

export default function OrcidToCvPage() {
  return <LandingPage page={PAGE} locale="en-US" />;
}
