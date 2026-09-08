import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { FAQ_REQUEST_LINK_INDEX, faqItemAnchor } from "@/lib/i18n/faq";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import {
  institutionJsonLd,
  institutionOaiSetUrl,
  type InstitutionSummary,
} from "@/lib/institutions/institutions";
import { serializeJsonLd } from "@/lib/jsonLd";
import { rorSetSpec } from "@/lib/oai/oai";
import {
  localeFaqPath,
  localeHomePath,
  localeInstitutionPath,
  localeInstitutionsIndexPath,
} from "@/lib/seo";
import DocJsonLd from "./DocJsonLd";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * One institution's page: its canonical name, the ROR record, how many
 * researchers chose to be listed under it (a count — never a roster), the
 * OAI-PMH set for machines, and the "About this page" block that states who the
 * controller is, that the institution is a reader like anyone else, that
 * listing is voluntary and absence means nothing, and that SigmaCV does not
 * rank, score or compare researchers. Shared by `/i/[ror]` and the localized
 * `/[locale]/i/[ror]`; `lang` is set on the subtree.
 */
export default function InstitutionPage({
  locale,
  summary,
}: {
  locale: string;
  summary: InstitutionSummary;
}) {
  const loc = asLocale(locale);
  const s = institutionStrings(loc);
  const rorUrl = `https://ror.org/${summary.rorId}`;
  const setUrl = institutionOaiSetUrl(summary.rorId);
  const faqHref = `${localeFaqPath(loc)}#${faqItemAnchor(FAQ_REQUEST_LINK_INDEX)}`;
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <DocJsonLd
          path={localeInstitutionPath(loc, summary.rorId).replace(/^\//, "")}
          name={summary.name}
          description={fillInstitutionString(s.metaDescription, { name: summary.name })}
          locale={loc}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(institutionJsonLd(summary)) }}
        />

        <p className="muted">
          <Link href={localeInstitutionsIndexPath(loc)}>{s.backToIndex}</Link>
        </p>
        <h1>{summary.name}</h1>
        <p>
          {s.rorLabel}: <a href={rorUrl}>{rorUrl}</a>
        </p>
        <p className="doc-lede">{listedSentence(s, summary.listedCount)}</p>
        <p>{s.selfDeclared}</p>

        <h2>{s.oaiHeading}</h2>
        <p>
          {s.oaiBody}{" "}
          <a href={setUrl}>{fillInstitutionString(s.oaiLink, { id: rorSetSpec(summary.rorId) })}</a>
        </p>

        <h2>{s.aboutHeading}</h2>
        <p>{s.aboutController}</p>
        <p>{s.aboutReader}</p>
        <p>{s.aboutVoluntary}</p>
        <p>
          {s.aboutNoRanking} <Link href={faqHref}>{s.aboutRequestLink}</Link>
        </p>

        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}

/** "N researchers list this affiliation" (singular for one). */
export function listedSentence(s: ReturnType<typeof institutionStrings>, count: number): string {
  return count === 1 ? s.listedOne : fillInstitutionString(s.listedMany, { count });
}

/** The notice shown in place of either page when the public-page rate limit is
 *  exceeded: a server component cannot send a 429, so it says so in prose, and
 *  the route's metadata marks it `noindex, nofollow` (`institutionRobots`). */
export function InstitutionRateLimited({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = institutionStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <h1>{s.rateLimitedHeading}</h1>
        <p>{s.rateLimitedBody}</p>
        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
