import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { type FairCvStrings, fairCvStrings } from "@/lib/i18n/fairCv";
import { principlesStrings } from "@/lib/i18n/principles";
import { localeFairPath, localeHomePath, localePrinciplesPath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteLinks from "./SiteLinks";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The machine-readable formats a published CV is offered in, in display order.
 * Format NAMES are proper-noun constants (not i18n); each `key` selects the
 * localized "what it is for" sentence from `FairCvStrings`.
 */
const FORMATS: ReadonlyArray<{ key: keyof FairCvStrings; name: string }> = [
  { key: "fmtCanonical", name: "Canonical JSON + JSON Schema" },
  { key: "fmtCitations", name: "CSL-JSON & BibTeX" },
  { key: "fmtRoCrate", name: "RO-Crate" },
  { key: "fmtDocuments", name: "PDF · Word · LaTeX · Markdown · HTML" },
  { key: "fmtJsonLd", name: "schema.org JSON-LD" },
  { key: "fmtHarvest", name: "OAI-PMH & Signposting" },
];

/**
 * The "FAIR for your CV" explainer page, localized. Shared by the default `/fair`
 * (en-US) and the localized `/[locale]/fair` routes. `lang` is set on the subtree
 * so the content is read in the correct language even though the single root
 * <html> stays en.
 */
export default function FairCv({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = fairCvStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeFairPath(loc).replace(/^\//, "")}
          name={s.heading}
          description={s.metaDescription}
          locale={loc}
        />
        <h1>{s.heading}</h1>
        <p>{s.intro}</p>

        <p className="muted">{s.lead}</p>
        <ul className="principles-list">
          {FORMATS.map((f) => (
            <li key={f.key}>
              <strong>{f.name}</strong>
              {" — "}
              {s[f.key]}
            </li>
          ))}
        </ul>

        <p>{s.cite}</p>
        <p>{s.repositories}</p>
        <p>{s.selfHost}</p>

        <p>
          {s.more} <Link href={localePrinciplesPath(loc)}>{principlesStrings(loc).navLabel}</Link>
        </p>

        <SiteLinks className="site-links about-links" locale={loc} />

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
