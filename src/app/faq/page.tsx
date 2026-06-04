import type { Metadata } from "next";
import Faq from "@/components/Faq";
import { faqStrings } from "@/lib/i18n/faq";
import { faqLanguageAlternates } from "@/lib/seo";

const s = faqStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/faq", languages: faqLanguageAlternates() },
};

export default function FaqPage() {
  return <Faq locale="en-US" />;
}
