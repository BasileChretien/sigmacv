import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { anyLandingPageStrings } from "@/lib/i18n/landingAll";
import { landingPageLanguageAlternates } from "@/lib/seo";

const PAGE = "faculty-cv" as const;
const s = anyLandingPageStrings(PAGE, "en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: {
    canonical: `/${PAGE}`,
    languages: landingPageLanguageAlternates(PAGE),
  },
};

export default function FacultyCvPage() {
  return <LandingPage page={PAGE} locale="en-US" />;
}
