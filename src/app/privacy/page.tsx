import type { Metadata } from "next";
import Privacy from "@/components/Privacy";
import { privacyStrings } from "@/lib/i18n/privacy";
import { privacyLanguageAlternates } from "@/lib/seo";

const s = privacyStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/privacy", languages: privacyLanguageAlternates() },
};

export default function PrivacyPage() {
  return <Privacy locale="en-US" />;
}
