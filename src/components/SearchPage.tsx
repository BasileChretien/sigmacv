import Link from "next/link";
import type { SearchLookup } from "@/app/search/searchLoad";
import { asLocale } from "@/lib/i18n";
import { searchStrings } from "@/lib/i18n/search";
import { AUTHOR_QUERY_MAX, AUTHOR_QUERY_MIN } from "@/lib/openalex/authorSearch";
import { localeHomePath, localeObjectPath, localeSearchPath } from "@/lib/seo";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/**
 * `/search` — find a researcher by name and open their automatic preview.
 *
 * The promise is on the page: what a researcher has published, not how they
 * score. A row is a name, a place, a span of years and the ORCID mark; no
 * figure anywhere, no sort control, relevance order as OpenAlex returns it.
 * Result links are `nofollow` and the result page itself is `noindex`: a
 * list assembled for one visitor's query is never a crawlable index of people.
 */
export default function SearchPage({ locale, lookup }: { locale: string; lookup: SearchLookup }) {
  const loc = asLocale(locale);
  const s = searchStrings(loc);
  const rawValue =
    lookup.kind === "ok" ? lookup.query : lookup.kind === "invalid" ? lookup.raw : "";
  return (
    <div className="site-shell" lang={loc}>
      <SiteHeader locale={loc} />
      <main className="doc-page search-page" id="site-main">
        <h1>{s.heading}</h1>
        <p className="search-promise">{s.promise}</p>

        <form action={localeSearchPath(loc)} method="get" className="search-form" role="search">
          <label className="field">
            <span>{s.inputLabel}</span>
            <input
              type="search"
              name="q"
              defaultValue={rawValue}
              placeholder={s.placeholder}
              minLength={AUTHOR_QUERY_MIN}
              maxLength={AUTHOR_QUERY_MAX}
              autoComplete="off"
              spellCheck={false}
              required
              data-testid="search-input"
            />
          </label>
          <button type="submit" className="hp2-btn hp2-btn-primary">
            {s.submit}
          </button>
          <p className="muted search-hint">{s.hint}</p>
        </form>

        {lookup.kind === "invalid" ? (
          <p className="search-notice" role="status" data-testid="search-invalid">
            {s.invalid}
          </p>
        ) : null}
        {lookup.kind === "rate-limited" ? (
          <p className="search-notice" role="status" data-testid="search-rate-limited">
            {s.rateLimited}
          </p>
        ) : null}

        {lookup.kind === "ok" ? (
          lookup.hits.length === 0 ? (
            <p className="search-notice" role="status" data-testid="search-empty">
              {s.noResults}
            </p>
          ) : (
            <ol className="search-results" data-testid="search-results">
              {lookup.hits.map((h) => (
                <li key={h.orcid} className="search-result">
                  <Link
                    href={`/preview/${h.orcid}`}
                    rel="nofollow"
                    className="search-result-link"
                    data-testid="search-result"
                  >
                    <span className="search-result-name">{h.name}</span>
                    {h.affiliation ? (
                      <span className="search-result-aff muted">
                        {h.affiliation}
                        {h.years
                          ? ` · ${h.years[0] === h.years[1] ? h.years[0] : `${h.years[0]}–${h.years[1]}`}`
                          : ""}
                      </span>
                    ) : null}
                    <span className="search-result-orcid muted">
                      <span aria-hidden="true">iD</span> {s.orcidMark}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )
        ) : null}

        {lookup.kind === "ok" ? <p className="muted search-source">{s.sourceNote}</p> : null}

        <p className="muted search-object">
          <Link href={localeObjectPath(loc)}>{s.objectLink}</Link>
        </p>
        <p className="doc-back muted">
          <Link href={localeHomePath(loc)}>{s.back}</Link>
        </p>
      </main>
      <SiteFooter locale={loc} />
    </div>
  );
}
