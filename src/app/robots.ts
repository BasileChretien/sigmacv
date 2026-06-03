import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Crawl policy. Marketing pages are open; the auth-gated editor, API, Next
 * internals, and published CVs are disallowed. Published CVs (/p/*) are also
 * served with `X-Robots-Tag: noindex` — robots Disallow alone does not de-index
 * already-known URLs, so both are kept until an explicit "allow indexing"
 * consent exists.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/p/", "/cv"],
      },
    ],
    sitemap: absoluteUrl("sitemap.xml"),
  };
}
