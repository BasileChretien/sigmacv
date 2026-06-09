import type { Metadata } from "next";
import Principles from "@/components/Principles";
import { principlesStrings } from "@/lib/i18n/principles";
import { principlesLanguageAlternates } from "@/lib/seo";

const s = principlesStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/principles", languages: principlesLanguageAlternates() },
};

export default function PrinciplesPage() {
  return <Principles locale="en-US" />;
}
