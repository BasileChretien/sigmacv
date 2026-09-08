import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { institutionStrings } from "@/lib/i18n/institutions";
import type { InstitutionSummary } from "@/lib/institutions/institutions";
import { localeHomePath, localeInstitutionPath, localeInstitutionsIndexPath } from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import { listedSentence } from "./InstitutionPage";

/**
 * The institution index: every institution at least one researcher chose to be
 * listed under, with its name and count, linking to its page. Nothing else —
 * no ordering by count, no comparison. Shared by `/i` and `/[locale]/i`.
 */
export default function InstitutionIndex({
  locale,
  institutions,
}: {
  locale: string;
  institutions: InstitutionSummary[];
}) {
  const loc = asLocale(locale);
  const s = institutionStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeInstitutionsIndexPath(loc).replace(/^\//, "")}
          name={s.indexHeading}
          description={s.indexMetaDescription}
          locale={loc}
        />
        <h1>{s.indexHeading}</h1>
        <p className="doc-lede">{s.indexIntro}</p>
        {institutions.length === 0 ? (
          <p>{s.indexEmpty}</p>
        ) : (
          <ul>
            {institutions.map((inst) => (
              <li key={inst.rorId}>
                <Link href={localeInstitutionPath(loc, inst.rorId)}>{inst.name}</Link>
                {" — "}
                <span className="muted">{listedSentence(s, inst.listedCount)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
