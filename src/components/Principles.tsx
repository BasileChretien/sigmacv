import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { type PrinciplesStrings, principlesStrings } from "@/lib/i18n/principles";
import { localeHomePath, localePrinciplesPath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteLinks from "./SiteLinks";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The frameworks SigmaCV aligns with, in display order. Names + canonical URLs
 * are proper-noun constants (not i18n); each `key` selects the localized
 * "how we apply it" sentence from `PrinciplesStrings`.
 */
const FRAMEWORKS: ReadonlyArray<{
  key: keyof PrinciplesStrings;
  name: string;
  url: string;
}> = [
  {
    key: "barcelona",
    name: "Barcelona Declaration on Open Research Information",
    url: "https://barcelona-declaration.org/",
  },
  {
    key: "dora",
    name: "DORA — San Francisco Declaration on Research Assessment",
    url: "https://sfdora.org/",
  },
  {
    key: "coara",
    name: "CoARA — Coalition for Advancing Research Assessment",
    url: "https://coara.eu/",
  },
  {
    key: "leiden",
    name: "Leiden Manifesto for research metrics",
    url: "https://doi.org/10.1038/520429a",
  },
  {
    key: "hongKong",
    name: "Hong Kong Principles for assessing researchers",
    url: "https://doi.org/10.1371/journal.pbio.3000737",
  },
  { key: "metricTide", name: "The Metric Tide", url: "https://doi.org/10.13140/RG.2.1.4929.1363" },
  {
    key: "fair",
    name: "FAIR principles & FAIR4RS",
    url: "https://www.go-fair.org/fair-principles/",
  },
];

/**
 * The "Standards & principles we align with" page, localized. Shared by the
 * default `/principles` (en-US) and the localized `/[locale]/principles` routes.
 * `lang` is set on the subtree so the content is read in the correct language
 * even though the single root <html> stays en.
 */
export default function Principles({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = principlesStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localePrinciplesPath(loc).replace(/^\//, "")}
          name={s.heading}
          description={s.metaDescription}
          locale={loc}
        />
        <h1>{s.heading}</h1>
        <p>{s.intro}</p>

        <p className="muted">{s.lead}</p>
        <ul className="principles-list">
          {FRAMEWORKS.map((f) => (
            <li key={f.key}>
              <a href={f.url} target="_blank" rel="noopener noreferrer">
                {f.name}
              </a>
              {" — "}
              {s[f.key]}
            </li>
          ))}
        </ul>

        <p>{s.more}</p>

        <SiteLinks className="site-links about-links" locale={loc} />

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
