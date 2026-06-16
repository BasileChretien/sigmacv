import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/siteUrl";
import { landingStrings } from "@/lib/i18n/landing";
import { homeLanguageAlternates, ogAlternateLocales, ogLocale } from "@/lib/seo";
import { THEME_INIT_SCRIPT } from "@/lib/themeInit";

// Cookieless, first-party analytics (self-hosted Plausible CE v3). Rendered only
// when configured at build time (blank on local/dev → no script, no calls). SRC
// is the per-site script URL from the Plausible dashboard, e.g.
// https://plausible.sigmacv.org/js/pa-<id>.js — the site is baked into that
// script, so v3 needs no data-domain attribute.
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC;

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
    // suppressHydrationWarning: the no-flash init script sets data-theme on <html>
    // before React hydrates, so the attribute legitimately differs from SSR.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        {/* No-flash theme bootstrap — must run before paint. Static content,
            allow-listed by its sha256 in the CSP (see proxy.ts / themeInit.ts). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {PLAUSIBLE_SRC && (
          <>
            <Script async src={PLAUSIBLE_SRC} />
            {/* Plausible v3 init stub (the exact snippet the dashboard provides).
                The queue captures window.plausible(...) custom events fired before
                the async script loads; the `||` guards never clobber the real fns. */}
            <Script id="plausible-init" strategy="afterInteractive">
              {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
