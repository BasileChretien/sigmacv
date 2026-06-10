import type { Metadata } from "next";
import Transparency from "@/components/Transparency";
import { transparencyStrings } from "@/lib/i18n/transparency";
import { transparencyLanguageAlternates } from "@/lib/seo";

const s = transparencyStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/transparency", languages: transparencyLanguageAlternates() },
};

export default function TransparencyPage() {
  return <Transparency locale="en-US" />;
}
