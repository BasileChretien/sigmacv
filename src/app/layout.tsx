import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/siteUrl";
import { landingStrings } from "@/lib/i18n/landing";
import { homeLanguageAlternates, ogAlternateLocales, ogLocale } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const home = landingStrings("en-US");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "SigmaCV",
  title: { default: home.metaTitle, template: "%s — SigmaCV" },
  description: home.metaDescription,
  keywords: [
    "academic CV builder",
    "academic CV generator",
    "academic CV from ORCID",
    "free researcher CV maker",
    "ORCID CV",
    "OpenAlex CV",
    "free academic CV",
    "researcher CV builder",
    "CV from ORCID",
    "academic resume builder",
    "open source CV generator",
    "NIH biosketch generator",
  ],
  alternates: {
    canonical: "/",
    languages: homeLanguageAlternates(),
  },
  openGraph: {
    type: "website",
    siteName: "SigmaCV",
    title: home.metaTitle,
    description: home.metaDescription,
    url: "/",
    locale: ogLocale("en-US"),
    alternateLocale: ogAlternateLocales(),
  },
  twitter: {
    card: "summary_large_image",
    title: home.metaTitle,
    description: home.metaDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1f4fd8" },
    { media: "(prefers-color-scheme: dark)", color: "#13151a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
