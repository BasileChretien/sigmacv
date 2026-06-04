import type { Metadata } from "next";
import Accessibility from "@/components/Accessibility";
import { accessibilityStrings } from "@/lib/i18n/accessibility";
import { accessibilityLanguageAlternates } from "@/lib/seo";

const s = accessibilityStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: {
    canonical: "/accessibility",
    languages: accessibilityLanguageAlternates(),
  },
};

export default function AccessibilityPage() {
  return <Accessibility locale="en-US" />;
}
