import { serializeJsonLd } from "@/lib/jsonLd";
import { absoluteUrl, SITE_URL } from "@/lib/siteUrl";

/**
 * JSON-LD for a static content page (About / Privacy). Emits a WebPage tied to
 * the site's WebSite + Organization nodes, in the page's own language — so each
 * localized /about and /privacy is structured-data-described, not just the
 * homepage. `path` is locale-relative (e.g. "about", "fr/privacy").
 */
interface DocJsonLdProps {
  path: string;
  name: string;
  description: string;
  locale: string;
}

export default function DocJsonLd({ path, name, description, locale }: DocJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: absoluteUrl(path),
    inLanguage: locale,
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
    publisher: { "@type": "Organization", "@id": `${SITE_URL}/#org` },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
