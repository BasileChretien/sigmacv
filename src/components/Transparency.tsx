import Link from "next/link";
import { asLocale, t } from "@/lib/i18n";
import { principlesStrings } from "@/lib/i18n/principles";
import { type TransparencyStrings, transparencyStrings } from "@/lib/i18n/transparency";
import {
  localeHomePath,
  localePrinciplesPath,
  localePrivacyPath,
  localeTransparencyPath,
} from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteLinks from "./SiteLinks";

/**
 * The open sources a CV is built from, grouped, in display order. Source NAMES
 * are proper-noun constants (not i18n); each `key` selects the localized "what we
 * pull" sentence from `TransparencyStrings`.
 */
const SOURCES: ReadonlyArray<{ key: keyof TransparencyStrings; name: string }> = [
  { key: "srcPublications", name: "OpenAlex · ORCID · Crossref" },
  { key: "srcIdentity", name: "ORCID · ROR · Wikidata" },
  { key: "srcOutputs", name: "DataCite · OpenAIRE · DBLP" },
  { key: "srcGrants", name: "Crossref · UKRI · NIH · NSF" },
  { key: "srcTrials", name: "ClinicalTrials.gov · EU CTIS · WHO ICTRP" },
  { key: "srcOther", name: "Open Editors Plus · EPO" },
];

/**
 * The "Transparency" page, localized. Shared by the default `/transparency`
 * (en-US) and the localized `/[locale]/transparency` routes. `lang` is set on the
 * subtree so the content is read in the correct language even though the single
 * root <html> stays en.
 */
export default function Transparency({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = transparencyStrings(loc);
  return (
    <main className="doc-page" lang={loc}>
      <DocJsonLd
        path={localeTransparencyPath(loc).replace(/^\//, "")}
        name={s.heading}
        description={s.metaDescription}
        locale={loc}
      />
      <h1>{s.heading}</h1>
      <p>{s.intro}</p>

      <h2>{s.sourcesHeading}</h2>
      <p className="muted">{s.sourcesLead}</p>
      <ul className="principles-list">
        {SOURCES.map((src) => (
          <li key={src.key}>
            <strong>{src.name}</strong>
            {" — "}
            {s[src.key]}
          </li>
        ))}
      </ul>

      <h2>{s.matchingHeading}</h2>
      <p>{s.matchingBody}</p>

      <h2>{s.refreshHeading}</h2>
      <p>{s.refreshBody}</p>

      <h2>{s.logHeading}</h2>
      <p>{s.logBody}</p>

      <h2>{s.controlHeading}</h2>
      <p>{s.controlBody}</p>

      <p>{s.more}</p>
      <p>
        <Link href={localePrivacyPath(loc)}>{t(loc, "privacy")}</Link>
        {" · "}
        <Link href={localePrinciplesPath(loc)}>{principlesStrings(loc).navLabel}</Link>
      </p>

      <SiteLinks className="site-links about-links" locale={loc} />

      <p className="doc-back muted">
        <Link href={localeHomePath(loc)}>{s.backLink}</Link>
      </p>
    </main>
  );
}
