import type { Metadata } from "next";
import About from "@/components/About";
import { aboutStrings } from "@/lib/i18n/about";
import { aboutLanguageAlternates } from "@/lib/seo";

const s = aboutStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/about", languages: aboutLanguageAlternates() },
};

export default function AboutPage() {
  return <About locale="en-US" />;
}
