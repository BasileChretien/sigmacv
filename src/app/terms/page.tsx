import type { Metadata } from "next";
import Terms from "@/components/Terms";
import { termsStrings } from "@/lib/i18n/terms";
import { termsLanguageAlternates } from "@/lib/seo";

const s = termsStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/terms", languages: termsLanguageAlternates() },
};

export default function TermsPage() {
  return <Terms locale="en-US" />;
}
