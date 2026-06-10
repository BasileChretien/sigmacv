import type { Metadata } from "next";
import FairCv from "@/components/FairCv";
import { fairCvStrings } from "@/lib/i18n/fairCv";
import { fairLanguageAlternates } from "@/lib/seo";

const s = fairCvStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/fair", languages: fairLanguageAlternates() },
};

export default function FairPage() {
  return <FairCv locale="en-US" />;
}
