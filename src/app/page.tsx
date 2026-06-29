import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Landing from "@/components/Landing";
import { landingStrings } from "@/lib/i18n/landing";
import { homeLanguageAlternates, ogAlternateLocales, ogLocale } from "@/lib/seo";

const s = landingStrings("en-US");

export const metadata: Metadata = {
  // title inherits the layout default (the en-US landing title).
  description: s.metaDescription,
  alternates: { canonical: "/", languages: homeLanguageAlternates() },
  openGraph: {
    type: "website",
    siteName: "SigmaCV",
    title: s.metaTitle,
    description: s.metaDescription,
    url: "/",
    locale: ogLocale("en-US"),
    alternateLocale: ogAlternateLocales(),
  },
};

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/cv");
  return <Landing locale="en-US" />;
}
