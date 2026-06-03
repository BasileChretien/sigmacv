import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Crawl policy. Marketing pages are open; the auth-gated editor, API and Next
 * internals are disallowed. Published CVs (/p/*) are NO LONGER blanket-disallowed
 * here: indexing is decided per page via `X-Robots-Tag`. A page is `noindex`
 * unless its owner gave the explicit, separate "allow indexing" consent — so
 * crawlers may fetch /p/ but only index opted-in pages (and only those are in
 * the sitemap). Disallowing /p/ in robots would prevent crawlers from ever
 * seeing the per-page header, blocking the opted-in pages too.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/cv"],
      },
    ],
    sitemap: absoluteUrl("sitemap.xml"),
  };
}
