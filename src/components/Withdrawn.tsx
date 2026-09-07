import Link from "next/link";
import { asLocale } from "@/lib/i18n";
import { withdrawnStrings } from "@/lib/i18n/withdrawn";
import { localeHomePath } from "@/lib/seo";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * The DOI tombstone: the static page a minted frozen-version DOI is repointed
 * at once its owner deletes their account (`datacite/mint.ts`
 * `tombstoneSnapshotDoi`). Deliberately carries nothing about the withdrawn
 * version — no name, no slug, no version number — so a resolved DOI leads to
 * an explanation, never back to the erased data. Shared by the default
 * `/withdrawn` (en-US) and the localized `/[locale]/withdrawn` routes. `lang`
 * is set on the subtree so the content is read in the correct language even
 * though the single root <html> stays en.
 */
export default function Withdrawn({ locale }: { locale: string }) {
  const loc = asLocale(locale);
  const s = withdrawnStrings(loc);
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page" id="site-main">
        <h1>{s.heading}</h1>
        <p>{s.body}</p>
        <p className="muted">{s.note}</p>
        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.backLink}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
