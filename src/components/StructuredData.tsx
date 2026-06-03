import { getSiteLinks } from "@/lib/siteLinks";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * JSON-LD structured data for the public homepage. Three complementary types:
 *  - WebSite: the site itself, with the languages it serves.
 *  - SoftwareApplication: the strongest signal for a free web tool (price 0,
 *    feature list, license) — drives rich results for "free CV generator".
 *  - Organization: ties the project to its maintainer's verifiable identities.
 *
 * Rendered as a single <script type="application/ld+json"> (the pattern Next's
 * App Router recommends). `description` is the localized homepage description so
 * the markup matches the visible, localized copy.
 */
interface StructuredDataProps {
  locale: string;
  description: string;
}

const NAME = "SigmaCV";

export default function StructuredData({
  locale,
  description,
}: StructuredDataProps) {
  const { github, linkedin } = getSiteLinks();
  const sameAs = [github, linkedin].filter((u) => u.length > 0);

  const graph = [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: NAME,
      url: `${SITE_URL}/`,
      description,
      inLanguage: locale,
    },
    {
      "@type": "SoftwareApplication",
      name: NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: `${SITE_URL}/`,
      description,
      inLanguage: locale,
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      license: "https://www.apache.org/licenses/LICENSE-2.0",
      featureList: [
        "Auto-import publications from OpenAlex and ORCID",
        "CSL citation styles",
        "Self-name highlighting by identifier",
        "Export to PDF, DOCX, LaTeX and Markdown",
        "Living public CV page",
      ],
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: NAME,
      url: `${SITE_URL}/`,
      ...(sameAs.length ? { sameAs } : {}),
    },
  ];

  const jsonLd = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      // Server-rendered from static, non-user data — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
