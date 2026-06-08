import type { Metadata } from "next";
import Contact from "@/components/Contact";
import { contactStrings } from "@/lib/i18n/contact";
import { contactLanguageAlternates } from "@/lib/seo";

const s = contactStrings("en-US");

export const metadata: Metadata = {
  // The root layout's title template appends " — SigmaCV".
  title: s.metaTitle,
  description: s.metaDescription,
  alternates: { canonical: "/contact", languages: contactLanguageAlternates() },
};

export default function ContactPage() {
  return <Contact locale="en-US" />;
}
